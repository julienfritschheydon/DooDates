/**
 * Console Errors & React Hooks Tests
 * DooDates - Tests pour détecter les erreurs console et warnings React
 * 
 * Objectif : Détecter les problèmes de qualité qui n'empêchent pas l'app de tourner
 * - Erreurs console
 * - Warnings React (hooks, re-renders)
 * - Memory leaks
 */

import { test, expect } from '@playwright/test';
import { setupGeminiMock } from './global-setup';

test.describe('Console Errors & React Warnings', () => {
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });

  test('devrait ne pas avoir d\'erreurs console sur la page d\'accueil @smoke', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capturer les erreurs et warnings
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Aller sur la page d'accueil
    await page.goto('/?e2e-test=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filtrer les erreurs connues/acceptables
    const filteredErrors = consoleErrors.filter(error => {
      return !error.includes('ServiceWorker') &&
             !error.includes('CORS') &&
             !error.includes('sw.js') &&
             !error.includes('Gemini') &&
             !error.includes('DooDatesError') && // Erreurs métier loggées intentionnellement
             !error.includes('Failed to read from doodates_conversations');
    });

    const filteredWarnings = consoleWarnings.filter(warning => {
      return !warning.includes('React Router Future Flag Warning');
    });

    // Vérifier qu'il n'y a pas d'erreurs
    expect(filteredErrors, `Erreurs console trouvées:\n${filteredErrors.join('\n')}`).toHaveLength(0);
    
    // Log des warnings (non bloquant)
    if (filteredWarnings.length > 0) {
      console.log('⚠️ Warnings trouvés:', filteredWarnings);
    }
  });

  test('devrait ne pas avoir de warnings React Hooks @critical', async ({ page }) => {
    const reactWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      // Détecter les warnings React spécifiques
      if (text.includes('Rendered more hooks') ||
          text.includes('order of Hooks') ||
          text.includes('Cannot update a component') ||
          text.includes('Memory leak') ||
          text.includes('unmounted component')) {
        reactWarnings.push(text);
      }
    });

    // Créer un poll via IA
    await page.goto('/?e2e-test=true');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('[data-testid="message-input"]');
    await chatInput.fill('Crée un questionnaire avec 1 question');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Cliquer sur "Créer ce formulaire"
    const createButton = page.getByRole('button', { name: /créer ce formulaire/i });
    await createButton.click();
    await page.waitForTimeout(2000);

    // Finaliser
    const finalizeButton = page.locator('button:has-text("Finaliser")');
    if (await finalizeButton.isVisible()) {
      await finalizeButton.click();
      await page.waitForTimeout(2000);
    }

    // Rafraîchir la page plusieurs fois pour détecter les memory leaks
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Vérifier qu'il n'y a pas de warnings React
    expect(reactWarnings, `Warnings React trouvés:\n${reactWarnings.join('\n')}`).toHaveLength(0);
  });

  test('devrait ne pas avoir d\'erreurs console sur la page résultats @smoke', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Créer un poll rapide
    await page.goto('/?e2e-test=true');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('[data-testid="message-input"]');
    await chatInput.fill('Crée un questionnaire avec 1 question');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    const createButton = page.getByRole('button', { name: /créer ce formulaire/i });
    await createButton.click();
    await page.waitForTimeout(2000);

    const finalizeButton = page.locator('button:has-text("Finaliser")');
    if (await finalizeButton.isVisible()) {
      await finalizeButton.click();
      await page.waitForTimeout(2000);
    }

    // Récupérer le slug
    const slug = await page.evaluate(() => {
      const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
      return polls[polls.length - 1]?.slug;
    });

    if (!slug) {
      throw new Error('Slug non trouvé');
    }

    // Voter 1 fois
    await page.goto(`/poll/${slug}?e2e-test=true`);
    await page.waitForLoadState('networkidle');
    
    // Remplir le nom
    const nameInput = page.locator('input[placeholder*="nom" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
    }
    
    // Remplir la réponse (textarea ou input selon le type de question)
    const responseInput = page.locator('textarea, input[type="text"]').last();
    await responseInput.waitFor({ state: 'visible', timeout: 5000 });
    await responseInput.fill('Test response');
    
    const submitButton = page.locator('button:has-text("Envoyer")');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Clôturer
    await page.goto(`/poll/${slug}/results?e2e-test=true`);
    await page.waitForLoadState('networkidle');
    const closeButton = page.locator('button:has-text("Clôturer")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      const confirmButton = page.locator('button:has-text("Confirmer")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      await page.waitForTimeout(2000);
    }

    // Rafraîchir plusieurs fois
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Filtrer les erreurs connues
    const filteredErrors = consoleErrors.filter(error => {
      return !error.includes('ServiceWorker') &&
             !error.includes('CORS') &&
             !error.includes('sw.js') &&
             !error.includes('Gemini') &&
             !error.includes('JSHandle@object');
    });

    expect(filteredErrors, `Erreurs console trouvées:\n${filteredErrors.join('\n')}`).toHaveLength(0);
  });
});
