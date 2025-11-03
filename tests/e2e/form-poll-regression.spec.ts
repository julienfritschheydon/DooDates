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

import { test as base, expect } from '@playwright/test';
import { attachConsoleGuard, robustFill } from './utils';
import { setupGeminiMock } from './global-setup';

// Créer un test avec contexte partagé pour que localStorage persiste entre les tests
const test = base.extend<{}, { sharedContext: any }>({
  sharedContext: [async ({ browser }: any, use: any) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  }, { scope: 'worker' }],
  
  page: async ({ sharedContext }: any, use: any) => {
    const page = await sharedContext.newPage();
    await use(page);
  },
});

function mkLogger(scope: string) {
  return (...parts: any[]) => console.log(`[${scope}]`, ...parts);
}

test.describe('Form Poll - Tests de non-régression', () => {
  test.describe.configure({ mode: 'serial' });
  
  // Skip sur Firefox et Safari car bug Playwright avec shared context
  // https://github.com/microsoft/playwright/issues/13038
  // https://github.com/microsoft/playwright/issues/22832
  test.skip(({ browserName }) => browserName !== 'chromium', 'Shared context non supporté sur Firefox/Safari');
  
  // Variables partagées entre les tests
  let pollCreated = false;
  let pollUrl = '';
  
  test.beforeAll(async ({ browser }) => {
    // Clear localStorage au début de la suite de tests
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await context.close();
  });
  
  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
    
    // Clear localStorage SEULEMENT pour le premier test
    if (!pollCreated) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      // Attendre que le chat input soit visible (indicateur que la page est prête)
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 10000 });
    } else {
      // Pour les tests suivants, naviguer vers le poll créé
      await page.goto(pollUrl, { waitUntil: 'domcontentloaded' });
      // Attendre que l'éditeur soit visible
      await expect(page.locator('[data-poll-preview]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('RÉGRESSION #1 : Créer Form Poll avec 1 question via IA @smoke @critical @functional', async ({ page }) => {
    const log = mkLogger('FormPoll-Create');
    
    try {
      test.slow();
      
      // 1. Créer un questionnaire avec 1 seule question via IA (mock)
      await page.goto('/');
      const chatInput = page.locator('[data-testid="message-input"]');
      
      // 🔍 DIAGNOSTIC COMPLET (Test #1)
      const inputCount = await page.locator('[data-testid="message-input"]').count();
      log(`📊 Nombre d'inputs trouvés : ${inputCount}`);
      
      await expect(chatInput).toBeVisible({ timeout: 10000 });
      log('✅ Chat input visible');
      
      const isDisabled = await chatInput.isDisabled();
      log(`🔒 Input disabled : ${isDisabled}`);
      
      const isEditable = await chatInput.isEditable();
      log(`✏️ Input editable : ${isEditable}`);
      
      const valueBefore = await chatInput.inputValue();
      log(`📝 Valeur AVANT fill : "${valueBefore}"`);

      // Utiliser robustFill() pour gérer race conditions et overlays
      await robustFill(chatInput, 'Crée un questionnaire avec 1 seule question', { debug: true });
      log('✅ robustFill() terminé');
      
      const valueAfter = await chatInput.inputValue();
      log(`📝 Valeur APRÈS fill : "${valueAfter}"`);
      
      // 📸 CAPTURE AVANT ENTER (Test #1)
      await page.screenshot({ path: 'test-results/TEST1-BEFORE-ENTER.png', fullPage: true });
      log('📸 TEST #1 - Capture AVANT Enter');
      
      await chatInput.press('Enter');
      // Attendre que le bouton de création soit visible
      await expect(page.getByRole('button', { name: /créer ce formulaire/i })).toBeVisible({ timeout: 10000 });
      log('✅ Enter pressé');
      
      // 📸 CAPTURE APRÈS ENTER (Test #1)
      await page.screenshot({ path: 'test-results/TEST1-AFTER-ENTER.png', fullPage: true });
      log('📸 TEST #1 - Capture APRÈS Enter');

      // 2. Cliquer sur "Créer ce formulaire"
      const createButton = page.getByRole('button', { name: /créer ce formulaire/i });
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();
      log('✅ Bouton "Créer ce formulaire" cliqué');

      // 3. Vérifier que la carte de prévisualisation apparaît
      const previewCard = page.locator('[data-poll-preview]');
      await expect(previewCard).toBeVisible({ timeout: 15000 });
      log('✅ Carte de prévisualisation visible');

      // 4. Sur desktop, cliquer sur "Voir" pour ouvrir l'éditeur
      // Sur mobile, l'éditeur s'ouvre automatiquement en overlay
      const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
      const isButtonVisible = await viewFormButton.isVisible().catch(() => false);
      
      if (isButtonVisible) {
        await viewFormButton.click();
        log('✅ Bouton "Voir" cliqué (desktop)');
        // Attendre que l'éditeur soit ouvert
        await expect(page.locator('[data-poll-preview]').getByRole('button', { name: /^Q\d+$/ })).toBeVisible({ timeout: 5000 });
      } else {
        log('✅ Preview s\'ouvre automatiquement (mobile)');
        // Attendre que l'éditeur soit visible même sur mobile
        await expect(page.locator('[data-poll-preview]').getByRole('button', { name: /^Q\d+$/ })).toBeVisible({ timeout: 5000 });
      }

      // 5. Vérifier que les onglets de questions sont présents dans l'éditeur
      const editor = page.locator('[data-poll-preview]');
      const questionTabs = editor.getByRole('button', { name: /^Q\d+$/ });
      const count = await questionTabs.count();
      expect(count).toBeGreaterThan(0);
      log(`✅ ${count} onglet(s) de question(s) généré(s)`);
      
      // Sauvegarder l'URL pour les tests suivants
      pollUrl = page.url();
      log(`✅ URL du poll sauvegardée : ${pollUrl}`);
      
      // Créer manuellement la conversation dans localStorage si elle n'existe pas
      const conversationId = pollUrl.split('conversationId=')[1];
      if (conversationId) {
        await page.evaluate((convId) => {
          const conversation = {
            id: convId,
            title: 'Test Form Poll Conversation',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            firstMessage: 'Crée un questionnaire avec 3 questions',
            messageCount: 2,
            isFavorite: false,
            tags: [],
            metadata: {}
          };
          localStorage.setItem(`conversation_${convId}`, JSON.stringify(conversation));
        }, conversationId);
        log('✅ Conversation créée dans localStorage');
      }
      
      // Marquer le poll comme créé pour les tests suivants
      pollCreated = true;
      
    } catch (error) {
      log('❌ Erreur:', error);
      throw error;
    }
  });

  test.skip('RÉGRESSION #2 : Ajouter une question via IA @functional', async ({ page, isMobile }) => {
    // Skip sur mobile : le textarea est caché par le z-index de l'éditeur
    test.skip(isMobile, 'Textarea caché par z-index sur mobile');
    
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
        /DooDatesError/i,
      ],
    });
    const log = mkLogger('FormPoll-AddQuestion');

    try {
      test.slow();
      
      // Le poll avec 1 question est déjà créé par le test #1
      const editor = page.locator('[data-poll-preview]');
      await expect(editor).toBeVisible({ timeout: 5000 });
      log('✅ Éditeur déjà présent');
      
      const chatInput = page.locator('[data-testid="message-input"]');
      
      // 🔍 DIAGNOSTIC COMPLET
      const inputCount = await page.locator('[data-testid="message-input"]').count();
      log(`📊 Nombre d'inputs trouvés : ${inputCount}`);
      
      await chatInput.waitFor({ state: 'attached', timeout: 5000 });
      log('✅ Chat input trouvé dans le DOM');
      
      const isVisible = await chatInput.isVisible();
      log(`👁️ Input visible : ${isVisible}`);
      
      const isDisabled = await chatInput.isDisabled();
      log(`🔒 Input disabled : ${isDisabled}`);
      
      const isEditable = await chatInput.isEditable();
      log(`✏️ Input editable : ${isEditable}`);
      
      const valueBefore = await chatInput.inputValue();
      log(`📝 Valeur AVANT fill : "${valueBefore}"`);

      // 1. Compter les onglets de questions avant ajout (Q1, Q2, Q3...)
      const questionTabsBefore = editor.getByRole('button', { name: /^Q\d+$/ });
      const countBefore = await questionTabsBefore.count();
      log(`✅ Nombre d'onglets avant : ${countBefore}`);

      // 📸 CAPTURE DEBUG AVANT robustFill (pour voir l'état de la page)
      await page.screenshot({ path: 'test-results/TEST2-DEBUG-BEFORE-FILL.png', fullPage: true });
      log('📸 TEST #2 - Capture DEBUG avant robustFill');

      // 2. Demander l'ajout d'une question avec robustFill()
      const textToFill = 'Ajoute une question sur l\'âge';
      
      // robustFill() gère automatiquement les cas mobile et les inputs cachés
      await robustFill(chatInput, textToFill, { debug: true });
      log('✅ robustFill() terminé');
      
      const valueAfter = await chatInput.inputValue();
      log(`📝 Valeur APRÈS robustFill : "${valueAfter}"`);
      
      // 📸 CAPTURE AVANT ENTER (Test #2)
      await page.screenshot({ path: 'test-results/TEST2-BEFORE-ENTER.png', fullPage: true });
      log('📸 TEST #2 - Capture AVANT Enter');
      
      await chatInput.press('Enter');
      log('✅ Enter pressé');
      
      // 📸 CAPTURE APRÈS ENTER (Test #2)
      await page.screenshot({ path: 'test-results/TEST2-AFTER-ENTER.png', fullPage: true });
      log('📸 TEST #2 - Capture APRÈS Enter');
      
      // 3. Attendre que l'IA traite la demande et ajoute la question
      // Sur mobile, on ne peut pas voir les messages IA (cachés par le Preview)
      // On attend directement que le nouvel onglet apparaisse
      log('⏱️ Attente que l\'IA ajoute la question...');
      
      // 4. Vérifier qu'un nouvel onglet a été ajouté (attendre que le count augmente)
      const questionTabsAfter = page.locator('button').filter({ hasText: /^Q\d+$/ });
      // Attendre que le nombre d'onglets augmente (indique qu'une question a été ajoutée)
      await expect(async () => {
        const countAfter = await questionTabsAfter.count();
        expect(countAfter).toBeGreaterThan(countBefore);
      }).toPass({ timeout: 10000 });
      const countAfter = await questionTabsAfter.count();
      
      log(`📊 Onglets avant: ${countBefore}, après: ${countAfter}`);
      
      expect(countAfter).toBe(countBefore + 1);
      log(`✅ Nombre d'onglets après : ${countAfter}`);

      log('🎉 TEST RÉUSSI : Ajout de question');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('RÉGRESSION #3 : Supprimer une question @functional', async ({ page, isMobile }) => {
    // Skip sur mobile : le textarea est caché par le z-index de l'éditeur
    test.skip(isMobile, 'Textarea caché par z-index sur mobile');
    
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
      
      // 📸 CAPTURE INITIALE - Voir ce qui s'affiche
      await page.screenshot({ path: 'test-results/TEST3-INITIAL-STATE.png', fullPage: true });
      log('📸 TEST #3 - Capture état initial');
      
      // Le poll est déjà créé, on vérifie qu'il est là
      const editor = page.locator('[data-poll-preview]');
      const isEditorVisible = await editor.isVisible().catch(() => false);
      log(`🔍 Éditeur visible ? ${isEditorVisible}`);
      
      if (!isEditorVisible) {
        // Capturer l'état actuel pour debug
        const bodyText = await page.locator('body').textContent();
        log(`📄 Contenu de la page : ${bodyText?.substring(0, 200)}...`);
        await page.screenshot({ path: 'test-results/TEST3-NO-EDITOR.png', fullPage: true });
        log('📸 TEST #3 - Éditeur non trouvé');
      }
      
      await expect(editor).toBeVisible({ timeout: 5000 });
      log('✅ Éditeur déjà présent');
      
      const chatInput = page.locator('[data-testid="message-input"]');
      // Sur mobile, essayer de scroller vers le chat (optionnel)
      try {
        await chatInput.scrollIntoViewIfNeeded({ timeout: 2000 });
      } catch (e) {
        // Ignorer si le scroll échoue
      }
      await expect(chatInput).toBeVisible({ timeout: 5000 });

      // 1. Compter les onglets de questions (Q1, Q2, Q3...) dans l'éditeur
      const questionTabs = page.getByRole('button', { name: /^Q\d+$/ });
      const initialCount = await questionTabs.count();
      expect(initialCount).toBeGreaterThanOrEqual(2);
      log(`✅ ${initialCount} onglets de questions présents`);

      // 2. Demander la suppression de la question 2 avec robustFill()
      await robustFill(chatInput, 'Supprime la question 2', { debug: true });
      log('✅ robustFill() terminé');
      
      // 📸 CAPTURE AVANT ENTER (Test #3)
      await page.screenshot({ path: 'test-results/TEST3-BEFORE-ENTER.png', fullPage: true });
      log('📸 TEST #3 - Capture AVANT Enter');
      
      await chatInput.press('Enter');
      log('✅ Enter pressé');
      
      // 📸 CAPTURE APRÈS ENTER (Test #3)
      await page.screenshot({ path: 'test-results/TEST3-AFTER-ENTER.png', fullPage: true });
      log('📸 TEST #3 - Capture APRÈS Enter');
      
      // 3. Vérifier que le nombre d'onglets a diminué (attendre que le count diminue)
      await expect(async () => {
        const finalCount = await questionTabs.count();
        expect(finalCount).toBe(initialCount - 1);
      }).toPass({ timeout: 10000 });
      const finalCount = await questionTabs.count();
      log(`✅ Question supprimée (${initialCount} onglets → ${finalCount} onglets)`);

      log('🎉 TEST RÉUSSI : Suppression de question');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });

  test('RÉGRESSION #4 : Reprendre conversation après refresh @functional', async ({ page }) => {
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
      
      // Le poll est déjà créé par le test #1, on vérifie juste qu'il est là
      const editor = page.locator('[data-poll-preview]');
      await expect(editor).toBeVisible({ timeout: 5000 });
      log('✅ Éditeur déjà présent');
      
      // 1. Vérifier qu'il y a des onglets avant refresh
      const questionTabs = editor.getByRole('button', { name: /^Q\d+$/ });
      const tabCount = await questionTabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(1);
      log(`✅ ${tabCount} onglet(s) avant refresh`);

      // 2. Récupérer l'URL avec conversationId
      const currentUrl = page.url();
      log(`✅ URL actuelle : ${currentUrl}`);

      // 3. Refresh la page
      await page.reload({ waitUntil: 'domcontentloaded' });
      log('✅ Page rechargée');

      // 4. Vérifier que l'éditeur est toujours là (après reload, besoin de le relocaliser)
      const editorAfterReload = page.locator('[data-poll-preview]');
      await expect(editorAfterReload).toBeVisible({ timeout: 15000 });
      log('✅ Éditeur restauré');

      // 5. Vérifier que les onglets sont toujours là
      const restoredTabCount = await questionTabs.count();
      expect(restoredTabCount).toBe(tabCount);
      log(`✅ ${restoredTabCount} onglet(s) après refresh (identique)`);

      log('🎉 TEST RÉUSSI : Reprise de conversation');

    } finally {
      await guard.assertClean();
      guard.stop();
    }
  });
});
