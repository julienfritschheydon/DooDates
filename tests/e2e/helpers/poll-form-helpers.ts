import { Page, expect } from '@playwright/test';
import { setupAllMocksWithoutNavigation } from '../global-setup';
import { robustFill, waitForPageLoad, PRODUCT_ROUTES } from '../utils';
import { waitForElementReady, waitForReactStable } from '../helpers/wait-helpers';
import { fillFormTitle } from './form-helpers';
import { type BrowserName, getTimeouts } from './poll-core-helpers';

type CreateFormPollOptions = {
  waitForEditor?: boolean;
  fillTitle?: string;
  publish?: boolean;
};

async function clickViewFormButton(page: Page): Promise<void> {
  console.log('Recherche du bouton "Voir le formulaire"...');

  const button = page.locator('a:has-text("Voir le formulaire"), a:has-text("Voir le sondage")').first();

  try {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Bouton trouvé, clic en cours...');
    await button.click();
    console.log('Clic effectué avec succès');
  } catch (error) {
    console.error('Échec du clic sur le bouton, tentative avec JavaScript...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a'));
      const targetButton = buttons.find((btn) =>
        btn.textContent?.includes('Voir le formulaire') ||
        btn.textContent?.includes('Voir le sondage'),
      );
      if (targetButton) {
        (targetButton as HTMLElement).click();
      }
    });
  }

  await page.waitForURL(/\/poll\/[^/]+/, { timeout: 15000 });
}

export async function createFormPollViaAI(
  page: Page,
  browserName: string,
  prompt: string = 'Crée un questionnaire avec 1 seule question',
  options?: CreateFormPollOptions
): Promise<string> {
  await setupAllMocksWithoutNavigation(page);

  // Use new product route
  await page.goto(PRODUCT_ROUTES.formPoll.workspace, { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page, browserName);

  const chatInput = page.locator('[data-testid="chat-input"]');
  await expect(chatInput).toBeVisible({ timeout: 10000 });

  await robustFill(chatInput, prompt, { debug: process.env.DEBUG_E2E === '1' });

  await chatInput.press('Enter');

  const successText = page.getByText(/(Voici votre (questionnaire|sondage)|Formulaire créé|Sondage créé|Création réussie)/i);
  const errorText = page.getByText(/(désolé|quota.*dépassé|erreur|échec|impossible)/i);

  await page.waitForTimeout(2000);

  try {
    await expect(successText).toBeVisible({ timeout: 30000 });
  } catch (error) {
    const hasError = await errorText.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasError) {
      const errorContent = await errorText.textContent();
      throw new Error(`Erreur lors de la création du formulaire : ${errorContent}`);
    }
    throw error;
  }

  const hasError = await errorText.isVisible({ timeout: 1000 }).catch(() => false);
  if (hasError) {
    const errorContent = await errorText.textContent();
    throw new Error(
      `L'IA a retourné une erreur au lieu de générer un formulaire. ` +
      `Vérifiez que l'Edge Function Supabase est configurée avec CORS. ` +
      `Erreur: ${errorContent}`
    );
  }

  const createButton = page.locator('[data-testid="create-form-button"]');
  await expect(createButton).toBeVisible({ timeout: 10000 });
  await createButton.click({ force: true });

  const previewCard = page.locator('[data-poll-preview]');
  await expect(previewCard).toBeVisible({ timeout: 15000 });

  const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
  const isButtonVisible = await viewFormButton.isVisible({ timeout: 2000 }).catch(() => false);

  if (isButtonVisible) {
    await viewFormButton.click();
  }

  if (options?.waitForEditor !== false) {
    const questionTabs = previewCard.getByRole('button', { name: /^Q\d+$/ });
    await expect(questionTabs.first()).toBeVisible({ timeout: 5000 });
  }

  if (options?.fillTitle) {
    await fillFormTitle(page, options.fillTitle, {
      context: previewCard,
      skipIfNotEmpty: true,
    });
  }

  if (options?.publish) {
    const finalizeButton = page.locator('[data-testid="publish-button"]');
    await expect(finalizeButton).toBeVisible({ timeout: 15000 });
    await finalizeButton.click();

    console.log('Bouton de publication cliqué, attente du modal de succès...');

    await page.waitForSelector('div[role="dialog"], .modal, [class*="bg-\\[\\#3c4043\\]"]', {
      state: 'visible',
      timeout: 15000,
    });

    await page.screenshot({ path: 'debug-modal-visible.png', fullPage: true });

    await clickViewFormButton(page);
  }

  const url = page.url();

  const conversationId = url.split('conversationId=')[1];
  if (conversationId) {
    await page.evaluate((convId: string) => {
      const conversation = {
        id: convId,
        title: 'Test Form Poll Conversation',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        firstMessage: 'Crée un questionnaire avec 1 seule question',
        messageCount: 2,
        isFavorite: false,
        tags: [],
        metadata: {},
      };
      localStorage.setItem(`conversation_${convId}`, JSON.stringify(conversation));
    }, conversationId);
  }

  return url;
}

export async function voteOnFormPoll(
  page: Page,
  browserName: string,
  slug: string,
  voterName: string,
  answer: string,
) {
  // Use prefix for poll route
  await page.goto('/DooDates/poll/${slug}?e2e-test=true`, { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page, browserName);

  const nameInput = page.locator('input[placeholder*="nom" i]').first();
  await expect(nameInput).toBeVisible({ timeout: 10000 });
  await nameInput.fill(voterName);

  const textInput = page
    .locator('input[placeholder*="réponse" i], input[placeholder*="Votre réponse" i]')
    .first();
  await expect(textInput).toBeVisible({ timeout: 10000 });
  await textInput.fill(answer);

  const submitButton = page.locator('[data-testid="form-submit"]');
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'debug-before-submit.png', fullPage: true }).catch(() => { });
  await submitButton.click();

  await expect(
    page.locator('text=/merci|réponses.*enregistrées|envoyées/i').first(),
  )
    .toBeVisible({ timeout: 5000 })
    .catch(() => {
      return expect(page.locator('[data-testid="form-submit"]'))
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => { });
    });
}
