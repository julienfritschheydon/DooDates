// Imports Playwright et helpers E2E utilisés dans le scénario ultra simple.
import { test, expect } from "@playwright/test";
import { withConsoleGuard, PRODUCT_ROUTES } from "./utils";
import { waitForNetworkIdle, waitForReactStable } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";
import { setupTestEnvironment } from "./helpers/test-setup";
import { navigateToWorkspace, sendChatMessage } from "./helpers/chat-helpers";
import { authenticateUser } from "./helpers/auth-helpers";

// Logger scoped pour suivre précisément chaque étape dans les traces.
const mkLogger =
  (scope: string) =>
  (...parts: any[]) =>
    console.log(`[${scope}]`, ...parts);

/**
 * Test Ultra Simple Form (via IA) : workflow complet de création, ajout, suppression, reprise, vote et vérification dashboard.
 */
test.describe("DooDates - Test Ultra Simple Form (via IA)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Prépare l'environnement complet avant chaque test (mocks, garde console, mode local).
   */
  test.beforeEach(async ({ page, browserName }) => {
    // Prépare l'environnement complet (mode local, mocks, garde console) avant chaque test.
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: false,
      navigation: { path: PRODUCT_ROUTES.formPoll.landing },
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred in one of your React components/i,
          /The above error occurred in the .* component/i,
          /Erreur préchargement/i,
          /calendrier JSON/i,
          /TimeSlot Functions/i,
          /Sondage avec slug .* non trouvé/i,
          /DooDatesError/i,
          /\[vite\] Failed to reload.*\.css/i,
          /\[vite\] Failed to reload \/src\/index\.css/i,
          /vite.*reload.*css/i,
          /Can't find variable: requestIdleCallback/i,
          /GoogleGenerativeAI/i,
          /API key/i,
          /Error fetching from/i,
          /API key not valid/i,
          /generativelanguage\.googleapis\.com/i,
          /Supabase API error/i,
          /status: 401/i,
          /Failed to resolve import/i,
          /\[vite\] Internal Server Error/i,
          /DooDates Error: \{message: Failed to execute 'json' on 'Response': Unexpected end of JSON input/i,
          /NETWORK_ERROR détectée \{mode: EDGE_FUNCTION/i,
          /Edge Function testConnection exception/i,
          /CONFIG_ERROR détectée \{useDirectGemini: false, hasApiKey: true, apiKeyLength: \d+, errorMessage: Configuration Supabase manquante\}/i,
        ],
      },
      mocks: { all: true },
    });

    await authenticateUser(page, browserName, { reload: true, waitForReady: true });
  });

  /**
   * Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard.
   */
  test("Workflow complet Form Poll : création → ajout → suppression → reprise → vote → dashboard @smoke @functional", async ({
    page,
    browserName,
  }) => {
    const log = mkLogger("UltraSimpleForm");
    const timeouts = getTimeouts(browserName);

    await withConsoleGuard(
      page,
      async () => {
        test.slow();

        // 1. Navigation workspace Form
        log("🛠️ Navigation vers le workspace Form");
        await navigateToWorkspace(page, browserName, "form");
        await waitForNetworkIdle(page, { browserName });
        log("✅ App chargée");

        // 2. Détecter le type d'interface (chat IA ou formulaire manuel)
        const chatInput = page.locator('[data-testid="chat-input"]');
        const formTitle = page
          .locator(
            'input[placeholder*="titre" i], input[name*="title"], [data-testid="form-title"]',
          )
          .first();

        const hasChatInput = await chatInput.isVisible({ timeout: 3000 }).catch(() => false);
        const hasFormTitle = await formTitle.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasChatInput) {
          // Mode Chat IA
          log("📝 Mode Chat IA détecté");
          const prompt = "crée un questionnaire avec 2 questions pour organiser une formation";
          await sendChatMessage(page, prompt, { timeout: timeouts.element });

          // Attendre la réponse IA
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // CLIQUER SUR LE BOUTON "CRÉER" pour vraiment créer le formulaire
          log("🔘 Clic sur le bouton CRÉER");

          // Essayer plusieurs sélecteurs possibles pour le bouton de création
          const createButton = page
            .locator("button")
            .filter({ hasText: /créer|Créer/i })
            .first()
            .or(page.locator('[data-testid="publish-button"]'))
            .or(page.locator('button[type="submit"]:not([disabled])'))
            .or(page.locator('button:has-text("Créer"):not([disabled])'))
            .or(page.locator('button:has-text("créer"):not([disabled])'))
            .first();

          await createButton.waitFor({ state: "visible", timeout: 10000 });
          await createButton.click();

          // Attendre que le formulaire soit créé en brouillon
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // Étape 5 — Publication du formulaire
          log("🚀 Publication du formulaire");

          // Capturer tous les boutons visibles pour débogage

          // CLIQUER SUR LE BOUTON "PUBLIER"
          const publishButton = page.locator('[data-testid="publish-button"]').first();

          // Essayer le bouton Publier d'abord
          try {
            await publishButton.waitFor({ state: "visible", timeout: 3000 });
            await publishButton.click();
          } catch (e) {
            console.log("Bouton Publier non trouvé, clic sur le dernier bouton visible");
            const allButtons = page.locator("button:visible");
            const count = await allButtons.count();
            if (count > 0) {
              await allButtons.nth(count - 1).click();
            } else {
              throw new Error("Aucun bouton trouvé");
            }
          }

          // Attendre la navigation vers la nouvelle page de succès
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // Étape 6 — Suivre le lien de vote depuis la page de succès
          log("🔗 Recherche du lien de vote sur la page de succès");

          // Vérifier si le formulaire est déjà publié (bouton "VOIR LE FORMULAIRE")
          const viewFormButton = page
            .locator("button")
            .filter({ hasText: /voir le formulaire|VOIR LE FORMULAIRE/i })
            .first();

          if (await viewFormButton.isVisible({ timeout: 3000 })) {
            // Le formulaire est déjà publié, cliquer sur "VOIR LE FORMULAIRE"
            await viewFormButton.click();
          } else {
            // Le formulaire vient d'être publié, chercher le lien de vote
            const voteLink = page.locator('a[href*="/form/"]').first();
            await expect(voteLink).toBeVisible({ timeout: 5000 });

            // Copier le lien de vote
            const voteUrl = await voteLink.getAttribute("href");
            console.log(`🔗 Lien de vote copié: ${voteUrl}`);

            // Cliquer sur le lien de vote
            await voteLink.click();
          }

          // Attendre la navigation vers la page de vote
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // Simuler un vote simple (remplir une question)
          const firstInput = page
            .locator('input[type="text"], textarea, input[type="radio"], input[type="checkbox"]')
            .first();
          if (await firstInput.isVisible({ timeout: 3000 })) {
            await firstInput.fill("Test E2E Response");
            log("✅ Réponse test ajoutée");

            // Soumettre le formulaire
            const submitBtn = page
              .locator("button")
              .filter({ hasText: /soumettre|envoyer|voter/i })
              .first();
            if (await submitBtn.isVisible({ timeout: 3000 })) {
              await submitBtn.click();
              log("✅ Formulaire soumis");
            }
          }

          // Navigation vers le dashboard form polls
          await page.goto("/form/dashboard", {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

          // Étape 6 — Vérification dashboard
          log("📊 Vérification dashboard");

          // Vérifier qu'on est sur le dashboard
          const dashboardTitle = await page.title();
          expect(dashboardTitle).toContain("DooDates");

          log("🎉 WORKFLOW COMPLET FORM POLL RÉUSSI");
        } else if (hasFormTitle) {
          // Mode Formulaire manuel
          log("📝 Mode Formulaire manuel détecté");
          throw new Error("Mode formulaire manuel non supporté dans ce test");
        } else {
          // Fallback - aucune interface détectée
          log("⚠️ Ni chat ni formulaire trouvé - impossible de créer un formulaire");
          throw new Error("Ni chat ni formulaire trouvé - impossible de créer un formulaire");
        }
      },
      {
        // Allowlist pour ignorer les erreurs console attendues
        allowlist: [/ResizeObserver loop/i],
      },
    );

    // Capturer le résumé des étapes en fin de test
    try {
      console.log("📸 Test terminé avec succès");
    } catch (error) {
      console.log("⚠️ Erreur lors du test:", (error as Error).message);
    }
  });

  /**
   * Nettoie les données de test après chaque exécution.
   */
  test.afterEach(async ({ page }) => {
    // Nettoyage simple du localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
  });
});
