import { Page, expect } from '@playwright/test';
import { waitForElementReady, waitForNetworkIdle } from '../helpers/wait-helpers';
import { safeIsVisible } from './safe-helpers';
import { robustClick } from '../utils';

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

function getTimeouts(browserName: BrowserName) {
  const timeouts = {
    navigation: 30000,
    element: 15000,
    action: 10000,
    stability: 1000,
  };

  switch (browserName) {
    case 'webkit':
      return { ...timeouts, navigation: 45000, element: 20000 };
    case 'firefox':
      return { ...timeouts, navigation: 35000 };
    default:
      return timeouts;
  }
}

export async function navigateToPollVotingPage(
  page: Page,
  browserName: BrowserName,
  pollSlug: string,
  expectedTitle: string,
): Promise<void> {
  const timeouts = getTimeouts(browserName);

  const voirSondageBtn = page.getByRole('button', { name: /Voir le sondage/i });
  const isVoirSondageVisible = await safeIsVisible(voirSondageBtn);

  if (isVoirSondageVisible) {
    const popupPromise = page
      .context()
      .waitForEvent('page', { timeout: 3000 })
      .catch(() => null);

    await voirSondageBtn.waitFor({ state: 'visible', timeout: timeouts.element }).catch(() => {});
    await robustClick(voirSondageBtn);

    const popupPage = await popupPromise;
    if (popupPage) {
      await popupPage.waitForLoadState('domcontentloaded');
      console.log('✅ Navigation vers page votant via nouvel onglet (popup détectée)');
      page = popupPage;
    } else {
      console.log('✅ Navigation vers page votant via le même onglet');
    }

    if (!/\/poll\//.test(page.url())) {
      await page.goto(`/DooDates/poll/${pollSlug}`, { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });
      console.log('ℹ️ Navigation forcée vers page votant (URL inchangée après clic)');
    }
  } else {
    await page.goto(`/DooDates/poll/${pollSlug}`, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    console.log('✅ Navigation directe vers page votant via slug');
  }

  await expect(page).toHaveURL(/\/poll\//, { timeout: timeouts.navigation });
  await expect(page.locator('body')).toContainText(expectedTitle, { timeout: timeouts.element });
  console.log('✅ Page votant affiche le sondage correctement');
}

export async function performDashboardActions(
  page: Page,
  browserName: BrowserName,
  actions: {
    copyLink?: boolean;
    verifyPollVisible?: boolean;
    expectedTitle?: string;
    dashboardUrl?: string;
  } = {},
): Promise<void> {
  const timeouts = getTimeouts(browserName);

  const targetDashboardUrl = actions.dashboardUrl || '/DooDates/dashboard';

  await page.goto(targetDashboardUrl, { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page, { browserName });
  console.log(`✅ Navigation vers dashboard: ${targetDashboardUrl}`);

  if (actions.verifyPollVisible && actions.expectedTitle) {
    const pollItem = await waitForElementReady(page, '[data-testid="poll-item"]', {
      browserName,
      timeout: timeouts.element,
    });
    await expect(pollItem).toContainText(actions.expectedTitle, { timeout: timeouts.element });
    console.log('✅ Sondage visible dans dashboard');
  }

  if (actions.copyLink) {
    const copyBtn = page.locator('[data-testid="poll-action-copy-link"]').first();
    if (await safeIsVisible(copyBtn)) {
      await robustClick(copyBtn);
      console.log('✅ Lien copié');
    }
  }
}

export async function getPollSlugFromPage(page: Page): Promise<string | null> {
  const url = page.url();
  let slug = url.split('/poll/')[1]?.split('/')[0] || url.split('/poll/')[1]?.split('?')[0];

  if (slug) {
    return slug;
  }

  slug = await page.evaluate(() => {
    const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
    const lastPoll = polls[polls.length - 1];
    return lastPoll?.slug;
  });

  return slug || null;
}
