/**
 * Form Poll Results Access E2E Tests
 * Tests pour la visibilité des résultats et l'email de confirmation
 */

import { test, expect } from '@playwright/test';
import { withConsoleGuard } from './utils';
import { setupGeminiMock } from './global-setup';
import { waitForNetworkIdle, waitForElementReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';
import { clearTestData } from './helpers/test-data';
import { safeIsVisible } from './helpers/safe-helpers';

test.describe('Form Poll - Accès aux résultats et Email', () => {
  test.beforeEach(async ({ page, browserName }) => {
    await setupGeminiMock(page);
    await page.goto('/DooDates/workspace', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await clearTestData(page);
  });

  test('Visibilité creator-only : créateur peut voir, votant ne peut pas', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // 1. Créer un poll directement dans localStorage avec visibilité "creator-only"
    const pollSlug = `test-poll-creator-only-${Date.now()}`;
    const deviceId = `dev-${Date.now()}`;
    
    await page.evaluate(({ slug, deviceId }) => {
      const poll = {
        id: slug,
        slug: slug,
        title: 'Test Poll Creator Only',
        type: 'form',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        dates: [],
        resultsVisibility: 'creator-only',
        questions: [
          {
            id: 'q1',
            kind: 'single',
            title: 'Question 1',
            options: [
              { id: 'o1', label: 'Option 1' },
              { id: 'o2', label: 'Option 2' },
            ],
          },
        ],
      };
      
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
      localStorage.setItem('dd-device-id', deviceId);
    }, { slug: pollSlug, deviceId });

    // 2. Vérifier que le créateur peut voir les résultats
    const resultsUrl = `/poll/${pollSlug}/results`;
    await page.goto(resultsUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Le créateur devrait voir les résultats (pas de message d'accès restreint)
    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: timeouts.element });

    // 3. Simuler un autre utilisateur (changer device ID)
    await page.evaluate(() => {
      localStorage.setItem('dd-device-id', `dev-other-${Date.now()}`);
    });
    
    const voteUrl = `/poll/${pollSlug}`;
    await page.goto(voteUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Attendre que la page de vote soit chargée (titre du poll visible)
    await waitForElementReady(page, 'h1, h2, [role="heading"]', { browserName, timeout: timeouts.element });

    // Voter - utiliser l'id spécifique pour plus de fiabilité
    const nameInput = await waitForElementReady(page, '#voter-name-input', { browserName, timeout: timeouts.element });
    await nameInput.fill('Test Voter');

    // Remplir la question (si c'est un choix unique)
    const option = await waitForElementReady(page, 'input[type="radio"]', { browserName, timeout: timeouts.element });
    await option.check();

    // Soumettre
    const submitBtn = await waitForElementReady(page, 'button[type="submit"], button:has-text("Envoyer")', { browserName, timeout: timeouts.element });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await waitForElementReady(page, 'text=Merci pour votre participation', { browserName, timeout: timeouts.element });

    // 4. Vérifier que le bouton "Voir les résultats" n'apparaît pas
    const seeResultsBtn = page.locator('text=Voir les résultats');
    await expect(seeResultsBtn).not.toBeVisible({ timeout: timeouts.element });

    // 5. Essayer d'accéder directement aux résultats
    await page.goto(resultsUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Devrait voir le message d'accès restreint
    await expect(restrictedMessage).toBeVisible({ timeout: timeouts.element });
  });

  test('Visibilité voters : votant peut voir après avoir voté', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // 1. Créer un poll directement dans localStorage avec visibilité "voters"
    const pollSlug = `test-poll-voters-${Date.now()}`;
    const deviceId = `dev-${Date.now()}`;
    
    await page.evaluate(({ slug, deviceId }) => {
      const poll = {
        id: slug,
        slug: slug,
        title: 'Test Poll Voters',
        type: 'form',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        dates: [],
        resultsVisibility: 'voters',
        questions: [
          {
            id: 'q1',
            kind: 'single',
            title: 'Question 1',
            options: [
              { id: 'o1', label: 'Option 1' },
              { id: 'o2', label: 'Option 2' },
            ],
          },
        ],
      };
      
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
      localStorage.setItem('dd-device-id', deviceId);
    }, { slug: pollSlug, deviceId });

    // 2. Voter (simuler un autre utilisateur)
    await page.evaluate(() => {
      localStorage.setItem('dd-device-id', `dev-voter-${Date.now()}`);
    });
    
    const voteUrl = `/poll/${pollSlug}`;
    await page.goto(voteUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Attendre que la page de vote soit chargée
    await waitForElementReady(page, 'h1, h2, [role="heading"]', { browserName, timeout: timeouts.element });

    // Voter avec un nom - utiliser l'id spécifique pour plus de fiabilité
    const nameInput = await waitForElementReady(page, '#voter-name-input', { browserName, timeout: timeouts.element });
    await nameInput.fill('Test Voter');
    
    const option = await waitForElementReady(page, 'input[type="radio"]', { browserName, timeout: timeouts.element });
    await option.check();

    const submitBtn = await waitForElementReady(page, 'button[type="submit"], button:has-text("Envoyer")', { browserName, timeout: timeouts.element });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await waitForElementReady(page, 'text=Merci pour votre participation', { browserName, timeout: timeouts.element });

    // 3. Vérifier que le bouton "Voir les résultats" apparaît
    const seeResultsBtn = await waitForElementReady(page, 'text=Voir les résultats', { browserName, timeout: timeouts.element });

    // 4. Cliquer sur le bouton et vérifier l'accès
    await seeResultsBtn.click();
    
    // Attendre que la page de résultats se charge
    await waitForNetworkIdle(page, { browserName });

    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: timeouts.element });
  });

  test('Visibilité public : tout le monde peut voir sans voter', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // 1. Créer un poll directement dans localStorage avec visibilité "public"
    const pollSlug = `test-poll-public-${Date.now()}`;
    const deviceId = `dev-${Date.now()}`;
    
    await page.evaluate(({ slug, deviceId }) => {
      const poll = {
        id: slug,
        slug: slug,
        title: 'Test Poll Public',
        type: 'form',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        dates: [],
        resultsVisibility: 'public',
        questions: [
          {
            id: 'q1',
            kind: 'single',
            title: 'Question 1',
            options: [
              { id: 'o1', label: 'Option 1' },
              { id: 'o2', label: 'Option 2' },
            ],
          },
        ],
      };
      
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
      localStorage.setItem('dd-device-id', deviceId);
    }, { slug: pollSlug, deviceId });

    // 2. Accéder directement aux résultats sans voter
    const resultsUrl = `/poll/${pollSlug}/results`;
    await page.goto(resultsUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Devrait pouvoir voir les résultats
    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: timeouts.element });
  });

  test('Email de confirmation : checkbox et envoi', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // 1. Créer un poll directement dans localStorage
    const pollSlug = `test-poll-email-${Date.now()}`;
    const deviceId = `dev-${Date.now()}`;
    
    await page.evaluate(({ slug, deviceId }) => {
      const poll = {
        id: slug,
        slug: slug,
        title: 'Test Poll Email',
        type: 'form',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        dates: [],
        questions: [
          {
            id: 'q1',
            kind: 'single',
            title: 'Question 1',
            options: [
              { id: 'o1', label: 'Option 1' },
              { id: 'o2', label: 'Option 2' },
            ],
          },
        ],
      };
      
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
      localStorage.setItem('dd-device-id', deviceId);
    }, { slug: pollSlug, deviceId });

    // 2. Voter avec email
    const voteUrl = `/poll/${pollSlug}`;
    await page.goto(voteUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Attendre que la page de vote soit chargée
    await waitForElementReady(page, 'h1, h2, [role="heading"]', { browserName, timeout: timeouts.element });

    const nameInput = await waitForElementReady(page, '#voter-name-input', { browserName, timeout: timeouts.element });
    await nameInput.fill('Test User');

    const option = await waitForElementReady(page, 'input[type="radio"]', { browserName, timeout: timeouts.element });
    await option.check();

    // Cocher la checkbox pour recevoir l'email
    const emailCheckbox = await waitForElementReady(page, 'input[type="checkbox"]', { browserName, timeout: timeouts.element });
    await emailCheckbox.check();

    // Attendre que le champ email apparaisse (attente explicite)
    const emailInput = await waitForElementReady(page, 'input[type="email"]', { browserName, timeout: timeouts.element });
    await emailInput.fill('test@example.com');

    // 3. Capturer les logs console pour vérifier l'envoi d'email
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });

    const submitBtn = await waitForElementReady(page, 'button[type="submit"], button:has-text("Envoyer")', { browserName, timeout: timeouts.element });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await waitForElementReady(page, 'text=Merci pour votre participation', { browserName, timeout: timeouts.element });

    // 4. Vérifier que l'email a été "envoyé" (log en console pour MVP)
    const emailLog = consoleMessages.find((msg) => msg.includes('📧 Email à envoyer'));
    expect(emailLog).toBeTruthy();
  });

  test('Email de confirmation : validation email requise si checkbox cochée', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // 1. Créer un poll directement dans localStorage
    const pollSlug = `test-poll-email-validation-${Date.now()}`;
    const deviceId = `dev-${Date.now()}`;
    
    await page.evaluate(({ slug, deviceId }) => {
      const poll = {
        id: slug,
        slug: slug,
        title: 'Test Poll Email Validation',
        type: 'form',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: deviceId,
        dates: [],
        questions: [
          {
            id: 'q1',
            kind: 'single',
            title: 'Question 1',
            options: [
              { id: 'o1', label: 'Option 1' },
              { id: 'o2', label: 'Option 2' },
            ],
          },
        ],
      };
      
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      polls.push(poll);
      localStorage.setItem('doodates_polls', JSON.stringify(polls));
      localStorage.setItem('dd-device-id', deviceId);
    }, { slug: pollSlug, deviceId });

    // 2. Voter avec checkbox cochée mais sans email
    const voteUrl = `/poll/${pollSlug}`;
    await page.goto(voteUrl, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });

    // Attendre que la page de vote soit chargée
    await waitForElementReady(page, 'h1, h2, [role="heading"]', { browserName, timeout: timeouts.element });

    const nameInput = await waitForElementReady(page, '#voter-name-input', { browserName, timeout: timeouts.element });
    await nameInput.fill('Test User');

    const option = await waitForElementReady(page, 'input[type="radio"]', { browserName, timeout: timeouts.element });
    await option.check();

    // Cocher la checkbox
    const emailCheckbox = await waitForElementReady(page, 'input[type="checkbox"]', { browserName, timeout: timeouts.element });
    await emailCheckbox.check();

    // Vérifier que le champ email est maintenant visible (attente explicite)
    const emailInput = await waitForElementReady(page, 'input[type="email"]', { browserName, timeout: timeouts.element });

    // Ne pas remplir l'email et essayer de soumettre
    const submitBtn = await waitForElementReady(page, 'button[type="submit"], button:has-text("Envoyer")', { browserName, timeout: timeouts.element });
    
    await submitBtn.click();

    // 3. Vérifier que le formulaire n'a pas été soumis (attente explicite)
    // Le message de confirmation ne doit PAS apparaître
    const confirmationMessage = page.locator('text=Merci pour votre participation');
    await expect(confirmationMessage).not.toBeVisible({ timeout: timeouts.element });
    
    // Vérifier qu'un message d'erreur est visible OU que la validation HTML5 bloque
    const errorMessage = page.locator('[role="alert"]').filter({ hasText: /email/i });
    const errorVisible = await safeIsVisible(errorMessage);
    
    if (errorVisible) {
      // Message d'erreur visible → OK
      await expect(errorMessage).toBeVisible();
    } else {
      // Pas d'erreur visible → vérifier validation HTML5
      const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => {
        return !el.validity.valid;
      });
      expect(emailValidation).toBe(true);
    }
  });
});

