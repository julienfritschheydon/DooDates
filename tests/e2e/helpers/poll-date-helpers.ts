import { Page, expect } from '@playwright/test';
import { waitForElementReady, waitForReactStable, waitForNetworkIdle, waitForChatInputReady } from '../helpers/wait-helpers';
import { robustClick } from '../utils';
import { safeIsVisible } from './safe-helpers';
import { type BrowserName, getTimeouts } from './poll-core-helpers';

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
  mobileMode: boolean = false
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
      const isAttached = await dayButton.waitFor({ state: 'attached', timeout: timeouts.element }).catch(() => false);

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
      console.log('📱 Tentative de sélection via API React directement');
      const selectedViaAPI = await page.evaluate((datesToSelect: string[]) => {
        let successCount = 0;
        for (const dateStr of datesToSelect) {
          const button = document.querySelector(`button[data-date="${dateStr}"]`) as HTMLButtonElement;
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
  timeCandidates: string[] = ['09-00', '10-00', '11-00', '14-00', '15-00'],
  maxColumns: number = 3
): Promise<number> {
  let slotsSelected = 0;

  const visibleGrid = page
    .locator('[data-testid="time-slots-grid-mobile"]:visible, [data-testid="time-slots-grid-desktop"]:visible')
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
  mobileMode: boolean = false
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
      console.log('ℹ️ Bouton "Créer manuellement" déjà utilisé, on passe directement au formulaire');
    }
  }

  const titleInput = await waitForElementReady(page, '[data-testid="poll-title"]', {
    browserName,
    timeout: timeouts.element,
  });
  await titleInput.fill(title);
  console.log(`✅ Titre saisi${mobileMode ? ' sur mobile' : ''}`);
}

export async function publishPollAndGetInfo(
  page: Page,
  browserName: BrowserName
): Promise<PollCreationResult> {
  const timeouts = getTimeouts(browserName);

  const finalizeBtn = await waitForElementReady(page, 'button:has-text("Publier le sondage")', {
    browserName,
    timeout: timeouts.element,
  });

  const isDisabled = await finalizeBtn.isDisabled();
  if (isDisabled) {
    throw new Error(
      'Le bouton "Publier le sondage" est désactivé. Vérifiez que le titre est saisi et qu\'au moins une date est sélectionnée.'
    );
  }

  await robustClick(finalizeBtn);
  console.log('✅ Bouton "Publier le sondage" cliqué');

  const successMessage = await waitForElementReady(page, 'text=/Sondage publié !/i', {
    browserName,
    timeout: timeouts.element,
  });
  await expect(successMessage).toBeVisible({ timeout: timeouts.element });
  console.log('✅ Écran de succès affiché');

  let pollSlug: string | null = null;
  await expect
    .poll(async () => {
      pollSlug = await page.evaluate(() => {
        try {
          const devPollsRaw = localStorage.getItem('dev-polls');
          const prodPollsRaw = localStorage.getItem('doodates_polls');

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
    }, { timeout: timeouts.element, message: 'Slug du sondage indisponible' })
    .toBeTruthy();

  const pollInfo = await page.evaluate(() => {
    try {
      const devPollsRaw = localStorage.getItem('dev-polls');
      const prodPollsRaw = localStorage.getItem('doodates_polls');

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
        id: poll?.id || '',
        title: poll?.title || '',
        slug: poll?.slug || '',
      };
    } catch {
      return { id: '', title: '', slug: '' };
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
  options: CreateDatePollOptions
): Promise<PollCreationResult> {
  const timeouts = getTimeouts(browserName);
  const projectName = (global as any).testInfo?.project?.name || '';
  const isMobileBrowser = options.mobileMode ?? (projectName === 'Mobile Safari' || projectName === 'Mobile Chrome');

  console.log(
    `🔍 DEBUG: projectName="${projectName}", browserName="${browserName}", options.mobileMode=${options.mobileMode}, isMobileBrowser=${isMobileBrowser}`
  );

  const dates =
    options.dates ||
    (() => {
      const today = new Date();
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const offsets = [1, 4, 7];
      return offsets.map((offset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        return formatDate(d);
      });
    })();

  console.log(`📅 Dates à sélectionner: ${dates.join(', ')}`);

  await page.goto('/create/date', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page, { browserName });
  await expect(page).toHaveURL(/\/create\/ai\?type=date/);
  console.log('✅ Page /create/date accessible → redirigée vers /create/ai?type=date');

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

    const devPolls = parseArray('dev-polls');
    const prodPolls = parseArray('doodates_polls');
    const ids: string[] = [];

    [...devPolls, ...prodPolls].forEach((poll) => {
      const id = collectId(poll);
      if (id) ids.push(id);
    });

    return ids;
  });

  const promptMessage =
    options.aiPrompt ||
    `Crée un sondage "${options.title}" avec les dates ${dates.join(', ')} et propose quelques créneaux.`;

  const input = await waitForChatInputReady(page, browserName, { timeout: timeouts.element });

  await input.fill(promptMessage);
  console.log(`✉️ Prompt IA saisi (${promptMessage.length} caractères)`);

  const sendButton = page.locator('[data-testid="send-message-button"]').first();
  await expect(sendButton).toBeEnabled({ timeout: timeouts.element });
  await sendButton.click();
  console.log('📨 Prompt IA envoyé, attente de la réponse...');

  await expect(input).toHaveValue('', { timeout: timeouts.navigation });
  console.log('✅ Réponse IA reçue (champ vidé)');

  const createSuggestionButton = await waitForElementReady(page, '[data-testid="create-poll-button"]', {
    browserName,
    timeout: timeouts.element,
  });
  await robustClick(createSuggestionButton);
  console.log('🖱️ Bouton "Créer ce sondage" cliqué');

  await waitForReactStable(page, { browserName });

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

    const merge = [...parseArray('dev-polls'), ...parseArray('doodates_polls')];
    for (let idx = merge.length - 1; idx >= 0; idx -= 1) {
      const poll = merge[idx];
      if (!poll || poll.type !== 'date') continue;

      const id = (poll.id as string | undefined) ?? (poll.slug as string | undefined);
      if (!id || existingIds.includes(id)) continue;

      return {
        id,
        slug: (poll.slug as string | undefined) ?? undefined,
        title: (poll.title as string | undefined) ?? undefined,
      };
    }
    return null;
  }, existingPollIds);

  if (!result) {
    throw new Error('Sondage généré par le mock introuvable dans le localStorage');
  }

  console.log(`🤖 Sondage IA détecté: ${result.id} (${result.title ?? 'sans titre'})`);

  return {
    pollId: result.id,
    pollSlug: result.slug ?? result.id,
    title: result.title ?? 'Sondage mock IA',
  };
}
