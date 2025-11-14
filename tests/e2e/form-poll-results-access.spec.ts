/**
 * Form Poll Results Access E2E Tests
 * Tests pour la visibilité des résultats et l'email de confirmation
 */

import { test, expect } from '@playwright/test';
import { attachConsoleGuard } from './utils';
import { setupGeminiMock } from './global-setup';

test.describe('Form Poll - Accès aux résultats et Email', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
  });

  test('Visibilité creator-only : créateur peut voir, votant ne peut pas', async ({ page }) => {
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
    await page.goto(resultsUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Le créateur devrait voir les résultats (pas de message d'accès restreint)
    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: 5000 });

    // 3. Simuler un autre utilisateur (changer device ID)
    await page.evaluate(() => {
      localStorage.setItem('dd-device-id', `dev-other-${Date.now()}`);
    });
    
    const voteUrl = `/poll/${pollSlug}`;
    await page.goto(voteUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Voter
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Test Voter');

    // Remplir la question (si c'est un choix unique)
    const option = page.locator('input[type="radio"]').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.check();

    // Soumettre
    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await expect(page.locator('text=Merci pour votre participation')).toBeVisible({ timeout: 5000 });

    // 4. Vérifier que le bouton "Voir les résultats" n'apparaît pas
    const seeResultsBtn = page.locator('text=Voir les résultats');
    await expect(seeResultsBtn).not.toBeVisible({ timeout: 2000 });

    // 5. Essayer d'accéder directement aux résultats
    await page.goto(resultsUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Devrait voir le message d'accès restreint
    await expect(restrictedMessage).toBeVisible({ timeout: 5000 });
  });

  test('Visibilité voters : votant peut voir après avoir voté', async ({ page }) => {
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
    await page.goto(voteUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Voter avec un nom
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Test Voter');
    
    const option = page.locator('input[type="radio"]').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.check();

    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await expect(page.locator('text=Merci pour votre participation')).toBeVisible({ timeout: 5000 });

    // 3. Vérifier que le bouton "Voir les résultats" apparaît
    const seeResultsBtn = page.locator('text=Voir les résultats');
    await expect(seeResultsBtn).toBeVisible({ timeout: 5000 });

    // 4. Cliquer sur le bouton et vérifier l'accès
    await seeResultsBtn.click();
    
    // Attendre que la page de résultats se charge
    await page.waitForLoadState('networkidle');

    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('Visibilité public : tout le monde peut voir sans voter', async ({ page }) => {
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
    await page.goto(resultsUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    // Devrait pouvoir voir les résultats
    const restrictedMessage = page.locator('text=Accès restreint');
    await expect(restrictedMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('Email de confirmation : checkbox et envoi', async ({ page }) => {
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
    await page.goto(voteUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Test User');

    const option = page.locator('input[type="radio"]').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.check();

    // Cocher la checkbox pour recevoir l'email
    const emailCheckbox = page.locator('input[type="checkbox"]').first();
    await emailCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await emailCheckbox.check();

    // Attendre que le champ email apparaisse (attente explicite)
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 3000 });
    await emailInput.fill('test@example.com');

    // 3. Capturer les logs console pour vérifier l'envoi d'email
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });

    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    // Attendre la confirmation de soumission
    await expect(page.locator('text=Merci pour votre participation')).toBeVisible({ timeout: 5000 });

    // 4. Vérifier que l'email a été "envoyé" (log en console pour MVP)
    const emailLog = consoleMessages.find((msg) => msg.includes('📧 Email à envoyer'));
    expect(emailLog).toBeTruthy();
  });

  test('Email de confirmation : validation email requise si checkbox cochée', async ({ page }) => {
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
    await page.goto(voteUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Test User');

    const option = page.locator('input[type="radio"]').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.check();

    // Cocher la checkbox
    const emailCheckbox = page.locator('input[type="checkbox"]').first();
    await emailCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await emailCheckbox.check();

    // Vérifier que le champ email est maintenant visible (attente explicite)
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 3000 });

    // Ne pas remplir l'email et essayer de soumettre
    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    
    await submitBtn.click();

    // 3. Vérifier que le formulaire n'a pas été soumis (attente explicite)
    // Le message de confirmation ne doit PAS apparaître
    const confirmationMessage = page.locator('text=Merci pour votre participation');
    await expect(confirmationMessage).not.toBeVisible({ timeout: 2000 });
    
    // Vérifier qu'un message d'erreur est visible OU que la validation HTML5 bloque
    const errorMessage = page.locator('[role="alert"]').filter({ hasText: /email/i });
    const errorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    
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

