/**
 * Form Poll Regression Tests
 * DooDates - Tests de non-régression pour les Form Polls avec IA
 * 
 * Objectif : Détecter les régressions dans les fonctionnalités critiques
 * - Création Form Poll via IA
 * - Ajout de questions
 * - Modification de questions
 * - Suppression de questions
 * - Reprise de conversation
 */

import { test, expect } from '@playwright/test';
import { attachConsoleGuard, robustClick, enableE2ELocalMode, warmup } from './utils';
import { setupGeminiMock } from './global-setup';

function mkLogger(scope: string) {
  return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
}

test.describe('Form Poll - Tests de non-régression', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    await enableE2ELocalMode(page);
  });

  test.skip('RÉGRESSION #1 : Créer Form Poll + Ajouter 3 questions via IA', async ({ page }) => {
    // Test skippé : Nécessite intégration IA réelle
    // TODO: Implémenter avec mock Gemini complet
    const log = mkLogger('FormPoll-Create');
    log('⚠️ Test skippé - Nécessite mock IA');
  });

  test.skip('RÉGRESSION #2 : Modifier une question existante', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('FormPoll-Modify');

    try {
      test.slow();
      await warmup(page);
      
      // 1. Créer un questionnaire de base
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      await chatInput.fill('Crée un questionnaire simple avec 2 questions');
      await chatInput.press('Enter');
      await page.waitForTimeout(3000);
      log('✅ Questionnaire créé');

      // 2. Attendre l'éditeur
      const editor = page.locator('[data-testid="poll-editor"], [data-testid="form-poll-creator"]');
      await expect(editor).toBeVisible({ timeout: 15000 });

      // 3. Récupérer le texte de la première question
      const firstQuestion = page.locator('[data-testid^="question-card"], [data-testid*="question"]').first();
      await expect(firstQuestion).toBeVisible();
      const originalText = await firstQuestion.textContent();
      log(`✅ Question originale : "${originalText?.substring(0, 50)}..."`);

      // 4. Demander une modification
      await chatInput.fill('Change la première question en "Quel est votre nom ?"');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
      log('✅ Demande de modification envoyée');

      // 5. Vérifier que la question a changé
      await page.waitForTimeout(1000);
      const modifiedText = await firstQuestion.textContent();
      expect(modifiedText).not.toBe(originalText);
      log(`✅ Question modifiée : "${modifiedText?.substring(0, 50)}..."`);

      log('🎉 TEST RÉUSSI : Modification de question');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('RÉGRESSION #3 : Supprimer une question', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('FormPoll-Delete');

    try {
      test.slow();
      await warmup(page);
      
      // 1. Créer un questionnaire avec plusieurs questions
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      await chatInput.fill('Crée un questionnaire avec 3 questions');
      await chatInput.press('Enter');
      await page.waitForTimeout(3000);
      log('✅ Questionnaire créé');

      // 2. Attendre l'éditeur
      const editor = page.locator('[data-testid="poll-editor"], [data-testid="form-poll-creator"]');
      await expect(editor).toBeVisible({ timeout: 15000 });

      // 3. Compter les questions
      const questions = page.locator('[data-testid^="question-card"], [data-testid*="question"]');
      const initialCount = await questions.count();
      expect(initialCount).toBeGreaterThanOrEqual(2);
      log(`✅ ${initialCount} questions présentes`);

      // 4. Demander la suppression
      await chatInput.fill('Supprime la dernière question');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
      log('✅ Demande de suppression envoyée');

      // 5. Vérifier que le nombre a diminué
      await page.waitForTimeout(1000);
      const finalCount = await questions.count();
      expect(finalCount).toBeLessThan(initialCount);
      log(`✅ Question supprimée (${initialCount} → ${finalCount})`);

      log('🎉 TEST RÉUSSI : Suppression de question');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('RÉGRESSION #4 : Reprendre conversation après refresh', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('FormPoll-Resume');

    try {
      test.slow();
      await warmup(page);
      
      // 1. Créer un questionnaire
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      await chatInput.fill('Crée un questionnaire de test');
      await chatInput.press('Enter');
      await page.waitForTimeout(3000);
      log('✅ Questionnaire créé');

      // 2. Attendre l'éditeur
      const editor = page.locator('[data-testid="poll-editor"], [data-testid="form-poll-creator"]');
      await expect(editor).toBeVisible({ timeout: 15000 });

      // 3. Vérifier qu'il y a des questions
      const questions = page.locator('[data-testid^="question-card"], [data-testid*="question"]');
      const questionCount = await questions.count();
      expect(questionCount).toBeGreaterThanOrEqual(1);
      log(`✅ ${questionCount} question(s) avant refresh`);

      // 4. Récupérer l'URL avec conversationId
      const currentUrl = page.url();
      log(`✅ URL actuelle : ${currentUrl}`);

      // 5. Refresh la page
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      log('✅ Page rechargée');

      // 6. Vérifier que l'éditeur est toujours là
      await expect(editor).toBeVisible({ timeout: 15000 });
      log('✅ Éditeur restauré');

      // 7. Vérifier que les questions sont toujours là
      const restoredQuestionCount = await questions.count();
      expect(restoredQuestionCount).toBe(questionCount);
      log(`✅ ${restoredQuestionCount} question(s) après refresh (identique)`);

      log('🎉 TEST RÉUSSI : Reprise de conversation');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test.skip('RÉGRESSION #5 : Workflow complet - Créer, Modifier, Sauvegarder', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('FormPoll-Complete');

    try {
      test.slow();
      await warmup(page);
      
      // 1. Créer questionnaire
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const chatInput = page.locator('textarea, input[type="text"]').first();
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      await chatInput.fill('Crée un questionnaire de satisfaction client');
      await chatInput.press('Enter');
      await page.waitForTimeout(3000);
      log('✅ Questionnaire créé');

      // 2. Vérifier éditeur
      const editor = page.locator('[data-testid="poll-editor"], [data-testid="form-poll-creator"]');
      await expect(editor).toBeVisible({ timeout: 15000 });

      // 3. Ajouter une question
      await chatInput.fill('Ajoute une question sur l\'email');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
      log('✅ Question ajoutée');

      // 4. Modifier une question
      await chatInput.fill('Change la première question');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
      log('✅ Question modifiée');

      // 5. Chercher le bouton de sauvegarde
      const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer|save/i });
      if (await saveButton.isVisible()) {
        await robustClick(saveButton);
        log('✅ Questionnaire sauvegardé');
      } else {
        log('⚠️ Bouton de sauvegarde non trouvé (peut-être auto-save)');
      }

      // 6. Vérifier que le poll est dans localStorage
      const pollsInStorage = await page.evaluate(() => {
        const polls = localStorage.getItem('doodates_polls');
        return polls ? JSON.parse(polls).length : 0;
      });
      expect(pollsInStorage).toBeGreaterThan(0);
      log(`✅ ${pollsInStorage} poll(s) en localStorage`);

      log('🎉 TEST RÉUSSI : Workflow complet');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
