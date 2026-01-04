import { Page, expect } from "@playwright/test";
import {
  waitForElementReady,
  waitForReactStable,
  waitForNetworkIdle,
  waitForChatInputReady,
} from "../helpers/wait-helpers";
import { robustClick } from "../utils";
import { safeIsVisible } from "./safe-helpers";
import { type BrowserName, getTimeouts } from "./poll-core-helpers";

export interface CreateDatePollOptions {
  title: string;
  dates?: string[];
  timeSlots?: boolean;
  mobileMode?: boolean;
  skipTimeSlots?: boolean;
  aiPrompt?: string;
}

export interface PollCreationResult {
  pollSlug: string;
  pollId: string;
  title: string;
}

export async function selectDatesInCalendar(
  page: Page,
  browserName: BrowserName,
  dates: string[],
  mobileMode: boolean = false,
): Promise<number> {
  const timeouts = getTimeouts(browserName);
  let datesSelected = 0;

  if (!mobileMode) {
    for (const dateStr of dates) {
      const dayButton = page.locator(`button[data-date="${dateStr}"]:visible`).first();
      await expect(dayButton).toBeVisible({ timeout: timeouts.element });
      await robustClick(dayButton);
      datesSelected++;
    }
    console.log(`✅ ${datesSelected} date(s) sélectionnée(s) sur desktop`);
  } else {
    for (const dateStr of dates) {
      const dayButton = page.locator(`button[data-date="${dateStr}"]`).first();
      const isAttached = await dayButton
        .waitFor({ state: "attached", timeout: timeouts.element })
        .catch(() => false);

      if (isAttached) {
        try {
          await dayButton.scrollIntoViewIfNeeded();
          await waitForReactStable(page, { browserName });
          await dayButton.click({ timeout: timeouts.element });
          datesSelected++;
          await waitForReactStable(page, { browserName });
        } catch {
          try {
            await dayButton.click({ force: true, timeout: timeouts.element });
            datesSelected++;
            await waitForReactStable(page, { browserName });
          } catch {
            console.log(`⚠️ Impossible de cliquer sur la date ${dateStr}`);
          }
        }
      }
    }

    if (datesSelected === 0) {
      console.log("📱 Tentative de sélection via API React directement");
      const selectedViaAPI = await page.evaluate((datesToSelect: string[]) => {
        let successCount = 0;
        for (const dateStr of datesToSelect) {
          const button = document.querySelector(
            `button[data-date="${dateStr}"]`,
          ) as HTMLButtonElement;
          if (button) {
            button.click();
            successCount++;
          }
        }
        return successCount;
      }, dates);

      if (selectedViaAPI > 0) {
        datesSelected = selectedViaAPI;
        console.log(`✅ ${datesSelected} date(s) sélectionnée(s) via API React`);
        await waitForReactStable(page, { browserName });
      }
    } else {
      console.log(`✅ ${datesSelected} date(s) sélectionnée(s) via clics`);
    }
  }

  return datesSelected;
}

export async function selectTimeSlots(
  page: Page,
  browserName: BrowserName,
  timeCandidates: string[] = ["09-00", "10-00", "11-00", "14-00", "15-00"],
  maxColumns: number = 3,
): Promise<number> {
  let slotsSelected = 0;

  const visibleGrid = page
    .locator(
      '[data-testid="time-slots-grid-mobile"]:visible, [data-testid="time-slots-grid-desktop"]:visible',
    )
    .first();

  for (let col = 0; col < maxColumns; col++) {
    for (const time of timeCandidates) {
      const btn = visibleGrid.getByTestId(`time-slot-${time}-col-${col}`);
      if (await btn.count()) {
        await robustClick(btn);
        console.log(`Créneau ${time} sélectionné pour colonne ${col + 1}`);
        slotsSelected++;
        break;
      }
    }
  }

  expect(slotsSelected, `Au moins 1 créneau requis`).toBeGreaterThanOrEqual(1);
  console.log(`✅ ${slotsSelected} créneau(x) sélectionné(s)`);

  return slotsSelected;
}

export async function enterPollTitle(
  page: Page,
  browserName: BrowserName,
  title: string,
  mobileMode: boolean = false,
): Promise<void> {
  const timeouts = getTimeouts(browserName);

  if (mobileMode) {
    console.log('📱 Mode mobile détecté - utilisation du bouton "Créer manuellement"');
    const createManualButton = page.locator('[data-testid="manual-editor-trigger"]').first();
    const manualButtonVisible = await safeIsVisible(createManualButton);
    if (manualButtonVisible) {
      await robustClick(createManualButton);
      console.log('✅ Bouton "Créer manuellement" cliqué');
      await waitForReactStable(page, { browserName });
    } else {
      console.log(
        'ℹ️ Bouton "Créer manuellement" déjà utilisé, on passe directement au formulaire',
      );
    }
  }

  const titleInput = await waitForElementReady(page, '[data-testid="poll-title"]', {
    browserName,
    timeout: timeouts.element,
  });
  await titleInput.fill(title);
  console.log(`✅ Titre saisi${mobileMode ? " sur mobile" : ""}`);
}

export async function publishPollAndGetInfo(
  page: Page,
  browserName: BrowserName,
): Promise<PollCreationResult> {
  const timeouts = getTimeouts(browserName);

  const finalizeBtn = await waitForElementReady(page, 'button:has-text("Publier le sondage")', {
    browserName,
    timeout: timeouts.element,
  });

  const isDisabled = await finalizeBtn.isDisabled();
  if (isDisabled) {
    throw new Error(
      'Le bouton "Publier le sondage" est désactivé. Vérifiez que le titre est saisi et qu\'au moins une date est sélectionnée.',
    );
  }

  await robustClick(finalizeBtn);
  console.log('✅ Bouton "Publier le sondage" cliqué');

  const successMessage = await waitForElementReady(page, "text=/Sondage publié !/i", {
    browserName,
    timeout: timeouts.element,
  });
  await expect(successMessage).toBeVisible({ timeout: timeouts.element });
  console.log("✅ Écran de succès affiché");

  let pollSlug: string | null = null;
  await expect
    .poll(
      async () => {
        pollSlug = await page.evaluate(() => {
          try {
            const devPollsRaw = localStorage.getItem("dev-polls");
            const prodPollsRaw = localStorage.getItem("doodates_polls");

            const parseArray = (raw: string | null) => {
              if (!raw) return [];
              try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            };

            const devPolls = parseArray(devPollsRaw);
            const prodPolls = parseArray(prodPollsRaw);

            const lastDev = devPolls[devPolls.length - 1];
            const lastProd = prodPolls[prodPolls.length - 1];

            return lastDev?.slug ?? lastProd?.slug ?? null;
          } catch {
            return null;
          }
        });
        return pollSlug;
      },
      { timeout: timeouts.element, message: "Slug du sondage indisponible" },
    )
    .toBeTruthy();

  const pollInfo = await page.evaluate(() => {
    try {
      const devPollsRaw = localStorage.getItem("dev-polls");
      const prodPollsRaw = localStorage.getItem("doodates_polls");

      const parseArray = (raw: string | null) => {
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const devPolls = parseArray(devPollsRaw);
      const prodPolls = parseArray(prodPollsRaw);

      const lastDev = devPolls[devPolls.length - 1];
      const lastProd = prodPolls[prodPolls.length - 1];

      const poll = lastDev || lastProd;
      return {
        id: poll?.id || "",
        title: poll?.title || "",
        slug: poll?.slug || "",
      };
    } catch {
      return { id: "", title: "", slug: "" };
    }
  });

  return {
    pollSlug: pollSlug!,
    pollId: pollInfo.id,
    title: pollInfo.title,
  };
}

export async function createDatePollWithTimeSlots(
  page: Page,
  browserName: BrowserName,
  options: CreateDatePollOptions,
): Promise<PollCreationResult> {
  const timeouts = getTimeouts(browserName);
  const projectName = (global as any).testInfo?.project?.name || "";
  const isMobileBrowser =
    options.mobileMode ?? (projectName === "Mobile Safari" || projectName === "Mobile Chrome");

  console.log(
    `🔍 DEBUG: projectName="${projectName}", browserName="${browserName}", options.mobileMode=${options.mobileMode}, isMobileBrowser=${isMobileBrowser}`,
  );

  const dates =
    options.dates ||
    (() => {
      const today = new Date();
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const offsets = [1, 4, 7];
      return offsets.map((offset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        return formatDate(d);
      });
    })();

  console.log(`📅 Dates à sélectionner: ${dates.join(", ")}`);

  // Navigate to date polls workspace (new product-specific route)
  await page.goto("/DooDates/date/workspace/date", { waitUntil: "domcontentloaded" });
  await waitForNetworkIdle(page, { browserName });

  // Verify we're on the date polls workspace page
  await expect(page).toHaveURL(/.*\/date\/workspace\/date/);
  console.log("✅ Page /date/workspace/date accessible");

  const existingPollIds = await page.evaluate(() => {
    const parseArray = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const collectId = (poll: any) =>
      (poll?.id as string | undefined) ?? (poll?.slug as string | undefined) ?? null;

    const devPolls = parseArray("dev-polls");
    const prodPolls = parseArray("doodates_polls");
    const ids: string[] = [];

    [...devPolls, ...prodPolls].forEach((poll) => {
      const id = collectId(poll);
      if (id) ids.push(id);
    });

    return ids;
  });

  const promptMessage =
    options.aiPrompt ||
    `Crée un sondage "${options.title}" avec les dates ${dates.join(", ")} et propose quelques créneaux.`;

  const input = await waitForChatInputReady(page, browserName, { timeout: 2000 });

  // Vérifier que l'élément est bien un input avant de faire fill
  try {
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
    const role = await input.getAttribute("role");
    const isEditable = await input.evaluate((el) => {
      const editable = el as HTMLElement;
      return (
        editable.isContentEditable || ["input", "textarea"].includes(editable.tagName.toLowerCase())
      );
    });

    if (!isEditable && tagName !== "input" && tagName !== "textarea") {
      console.log(
        "⚠️ waitForChatInputReady a retourné un élément non-éditable, recherche alternative...",
      );

      // Chercher un vrai input de manière flexible
      const inputSelectors = [
        page.locator('input[placeholder*="message"], textarea[placeholder*="message"]'),
        page.locator('input[type="text"], textarea'),
        page.locator('[contenteditable="true"]'),
        page.locator("input:visible, textarea:visible").first(),
      ];

      let realInput = null;
      for (const selector of inputSelectors) {
        try {
          await expect(selector).toBeVisible({ timeout: 2000 });
          const isRealEditable = await selector.evaluate((el) => {
            const editable = el as HTMLElement;
            return (
              editable.isContentEditable ||
              ["input", "textarea"].includes(editable.tagName.toLowerCase())
            );
          });
          if (isRealEditable) {
            realInput = selector;
            break;
          }
        } catch (e) {
          // Continuer avec le sélecteur suivant
        }
      }

      if (!realInput) {
        console.log("⚠️ Aucun input éditable trouvé, tentative directe");
        try {
          await input.fill(promptMessage);
        } catch (fillError) {
          console.log("⚠️ Impossible de remplir l'input, test skip");
          throw new Error("Chat input non disponible pour créer le sondage");
        }
      } else {
        await realInput.fill(promptMessage);
      }
    } else {
      await input.fill(promptMessage);
    }
  } catch (e) {
    console.log("⚠️ Erreur vérification input, tentative directe");
    try {
      await input.fill(promptMessage);
    } catch (fillError) {
      console.log("⚠️ Impossible de remplir l'input, test skip");
      throw new Error("Chat input non disponible pour créer le sondage");
    }
  }

  console.log(`✉️ Prompt IA saisi (${promptMessage.length} caractères)`);

  const sendButton = page.locator('[data-testid="send-message-button"]').first();
  await expect(sendButton).toBeEnabled({ timeout: timeouts.element });
  await sendButton.click();
  console.log("📨 Prompt IA envoyé, attente de la réponse...");

  await expect(input).toHaveValue("", { timeout: timeouts.navigation });
  console.log("✅ Réponse IA reçue (champ vidé)");

  const createSuggestionButton = await waitForElementReady(
    page,
    '[data-testid="create-poll-button"]',
    {
      browserName,
      timeout: timeouts.element * 2, // Double timeout car l'IA peut être lente
    },
  );

  // Attendre que l'interface soit stable (fin des animations/effets)
  await waitForReactStable(page, { browserName });

  // S'assurer que le bouton est bien activé
  await expect(createSuggestionButton).toBeEnabled({ timeout: timeouts.element });

  console.log('🖱️ Clic sur "Créer ce sondage"...');

  // Capturer les erreurs console avant le clic
  const consoleErrorsBefore: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrorsBefore.push(msg.text());
    }
  });

  await createSuggestionButton.click({ timeout: timeouts.action, force: true });
  console.log("✅ Clic effectué");

  // Attendre que la création soit terminée
  await waitForReactStable(page, { browserName });
  await waitForNetworkIdle(page, { browserName });

  // Attendre soit l'ouverture de l'éditeur, soit la redirection vers la page de vote
  try {
    // Option 1: L'éditeur s'ouvre (PollCreator visible)
    const pollCreator = page
      .locator('[data-testid="poll-creator"], [data-testid="poll-title"]')
      .first();
    await pollCreator.waitFor({ state: "visible", timeout: timeouts.element }).catch(() => {
      // Option 2: Redirection vers la page de vote
      return page.waitForURL(/\/poll\/[a-zA-Z0-9-]+/, { timeout: timeouts.element });
    });
    console.log("✅ Poll créé - éditeur ouvert ou redirection effectuée");
  } catch (e) {
    // Vérifier s'il y a une erreur affichée
    const errorMessages = [
      page.getByText(/Une erreur s'est produite/i),
      page.getByText(/Erreur lors de la création/i),
      page.getByRole("alert"),
    ];

    for (const errorMsg of errorMessages) {
      const isVisible = await errorMsg.isVisible().catch(() => false);
      if (isVisible) {
        const errorText = await errorMsg.textContent().catch(() => "Erreur inconnue");
        throw new Error(
          `Erreur lors de la création du poll: ${errorText}. Console errors: ${JSON.stringify(consoleErrorsBefore)}`,
        );
      }
    }

    // Si pas d'erreur visible mais pas de redirection non plus, c'est suspect
    console.log("⚠️ Pas de redirection ni d'éditeur visible après création");
  }

  // Attendre un peu que le localStorage soit mis à jour
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const result = await page.evaluate((existingIds) => {
    const parseArray = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const merge = [...parseArray("dev-polls"), ...parseArray("doodates_polls")];

    const found = merge.find((p: any) => {
      if (!p || p.type !== "date") return false;
      const id = (p.id as string | undefined) ?? (p.slug as string | undefined);
      return (id && !existingIds.includes(id)) || p.title === "Sondage de dates Mock E2E";
    });

    return {
      found,
      debug: {
        devPolls: parseArray("dev-polls"),
        doodatesPolls: parseArray("doodates_polls"),
        allKeys: Object.keys(localStorage),
      },
    };
  }, existingPollIds);

  if (!result.found) {
    console.log("⚠️ Sondage non trouvé dans localStorage, tentative de récupération via URL...");

    // Attendre la redirection vers la page de vote
    try {
      await expect(page).toHaveURL(/DooDates\/.*\/poll\/[a-zA-Z0-9-]+\//, { timeout: 10000 });
      const url = page.url();
      const slugMatch = url.match(/\/poll\/([a-zA-Z0-9-]+)/);
      if (slugMatch && slugMatch[1]) {
        const slug = slugMatch[1];
        console.log(`✅ Slug récupéré via URL: ${slug}`);
        return {
          pollId: slug, // On utilise le slug comme ID si on ne l'a pas
          pollSlug: slug,
          title: options.title ?? "Sondage mock IA",
        };
      }
    } catch (e) {
      console.log("❌ Échec de récupération via URL");
    }

    console.log("❌ localStorage debug:", JSON.stringify(result.debug, null, 2));
    throw new Error(
      `Sondage généré par le mock introuvable dans le localStorage ni via URL. Keys: ${result.debug.allKeys.join(", ")}`,
    );
  }

  return {
    pollId: result.found.id,
    pollSlug: result.found.slug ?? result.found.id,
    title: result.found.title ?? "Sondage mock IA",
  };
}
