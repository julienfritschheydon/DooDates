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
import { setupAllMocks } from './global-setup';

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

// Helper pour logs conditionnels (seulement si DEBUG_E2E=1)
function mkLogger(scope: string) {
  const debug = process.env.DEBUG_E2E === '1';
  return (...parts: any[]) => {
    if (debug) console.log(`[${scope}]`, ...parts);
  };
}

// Helper pour screenshots conditionnels (seulement si DEBUG_E2E=1)
async function debugScreenshot(page: any, name: string) {
  if (process.env.DEBUG_E2E === '1') {
    await page.screenshot({ path: `test-results/DEBUG-${name}.png`, fullPage: true });
  }
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

  /**
   * Helper pour créer un FormPoll via IA
   * Utilisé pour rendre les tests indépendants en cas de sharding
   */
  async function createFormPoll(page: any): Promise<string> {
    // S'assurer que les mocks sont configurés avant la navigation
    // (nécessaire car les routes peuvent ne pas persister après un nouveau goto())
    await setupAllMocks(page);
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Attendre que le chat input soit visible
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 10000 });
    
    const chatInput = page.locator('[data-testid="message-input"]');
    
    // Utiliser robustFill() pour gérer race conditions et overlays
    await robustFill(chatInput, 'Crée un questionnaire avec 1 seule question', { debug: process.env.DEBUG_E2E === '1' });
    
    await chatInput.press('Enter');
    
    // Attendre que l'IA réponde
    const successText = page.getByText(/Voici votre (questionnaire|sondage)/i);
    const errorText = page.getByText(/désolé|quota.*dépassé|erreur/i);
    
    await expect(successText).toBeVisible({ timeout: 30000 });
    
    const hasError = await errorText.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasError) {
      const errorContent = await errorText.textContent();
      throw new Error(
        `L'IA a retourné une erreur au lieu de générer un formulaire. ` +
        `Vérifiez que l'Edge Function Supabase est configurée avec CORS. ` +
        `Erreur: ${errorContent}`
      );
    }
    
    // Cliquer sur "Créer ce formulaire"
    const createButton = page.locator('[data-testid="create-form-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    
    // Attendre la prévisualisation
    const previewCard = page.locator('[data-poll-preview]');
    await expect(previewCard).toBeVisible({ timeout: 15000 });
    
    // Cliquer sur "Voir" si visible (desktop)
    const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
    const isButtonVisible = await viewFormButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isButtonVisible) {
      await viewFormButton.click();
    }
    
    // Attendre que l'éditeur soit ouvert
    await expect(previewCard.getByRole('button', { name: /^Q\d+$/ })).toBeVisible({ timeout: 5000 });
    
    // Retourner l'URL du poll créé
    const url = page.url();
    
    // Créer manuellement la conversation dans localStorage si nécessaire
    const conversationId = url.split('conversationId=')[1];
    if (conversationId) {
      await page.evaluate((convId) => {
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
          metadata: {}
        };
        localStorage.setItem(`conversation_${convId}`, JSON.stringify(conversation));
      }, conversationId);
    }
    
    return url;
  }
  
  test.beforeAll(async ({ browser }) => {
    // Clear localStorage au début de la suite de tests
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await context.close();
  });
  
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page);
    
    // Clear localStorage SEULEMENT pour le premier test
    if (!pollCreated) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      // Attendre que le chat input soit visible (indicateur que la page est prête)
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 10000 });
    } else {
      // Pour les tests suivants, naviguer vers le poll créé
      // Si pollUrl n'est pas défini (sharding), créer un poll indépendant
      let currentPollUrl = pollUrl;
      if (!currentPollUrl) {
        currentPollUrl = await createFormPoll(page);
        // Mettre à jour les variables partagées pour les tests suivants dans le même shard
        pollUrl = currentPollUrl;
        pollCreated = true;
      }
      
      await page.goto(currentPollUrl, { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle');
      // Attendre que l'éditeur soit visible ou présent
      const editor = page.locator('[data-poll-preview]');
      await expect(editor).toBeAttached({ timeout: 10000 });
      // Attendre que l'éditeur soit visible (attente explicite au lieu de timeout fixe)
      await expect(editor).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Si l'éditeur n'est pas visible, attendre qu'il apparaisse après chargement complet
        await page.waitForLoadState('networkidle');
        await expect(editor).toBeVisible({ timeout: 5000 });
      });
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
      await robustFill(chatInput, 'Crée un questionnaire avec 1 seule question', { debug: process.env.DEBUG_E2E === '1' });
      log('✅ robustFill() terminé');
      
      const valueAfter = await chatInput.inputValue();
      log(`📝 Valeur APRÈS fill : "${valueAfter}"`);
      
      await debugScreenshot(page, 'TEST1-BEFORE-ENTER');
      
      await chatInput.press('Enter');
      
      // Attendre que l'IA réponde - vérifier soit le message de succès, soit une erreur
      // On attend d'abord qu'un message AI apparaisse (succès ou erreur)
      const successText = page.getByText(/Voici votre (questionnaire|sondage)/i);
      const errorText = page.getByText(/désolé|quota.*dépassé|erreur/i);
      
      // Attendre que le message de succès apparaisse (attente explicite)
      await expect(successText).toBeVisible({ timeout: 30000 });
      log('✅ Réponse IA visible');
      
      // Vérifier qu'il n'y a pas de message d'erreur (assertion explicite)
      const hasError = await errorText.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasError) {
        await debugScreenshot(page, 'TEST1-ERROR-IA');
        const errorContent = await errorText.textContent();
        throw new Error(
          `L'IA a retourné une erreur au lieu de générer un formulaire. ` +
          `Vérifiez que l'Edge Function Supabase est configurée avec CORS. ` +
          `Erreur: ${errorContent}`
        );
      }
      
      // Attendre que le bouton de création soit visible (utiliser data-testid pour plus de fiabilité)
      // Le bouton apparaît après que pollSuggestion soit ajouté au message
      const createButton = page.locator('[data-testid="create-form-button"]');
      await expect(createButton).toBeVisible({ timeout: 10000 });
      log('✅ Bouton création visible');
      
      await debugScreenshot(page, 'TEST1-AFTER-ENTER');

      // 2. Cliquer sur "Créer ce formulaire" (le bouton est déjà trouvé et visible ci-dessus)
      await createButton.click();
      log('✅ Bouton "Créer ce formulaire" cliqué');

      // 3. Vérifier que la carte de prévisualisation apparaît
      const previewCard = page.locator('[data-poll-preview]');
      await expect(previewCard).toBeVisible({ timeout: 15000 });
      log('✅ Carte de prévisualisation visible');
      
      // 4. Sur desktop, cliquer sur "Voir" pour ouvrir l'éditeur
      // Sur mobile, l'éditeur s'ouvre automatiquement en overlay
      const viewFormButton = page.getByRole('button', { name: /voir/i }).first();
      const isButtonVisible = await viewFormButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isButtonVisible) {
        await viewFormButton.click();
        log('✅ Bouton "Voir" cliqué (desktop)');
      } else {
        log('✅ Preview s\'ouvre automatiquement (mobile)');
      }
      
      // Attendre que l'éditeur soit ouvert avec les onglets de questions (attente explicite)
      await expect(previewCard.getByRole('button', { name: /^Q\d+$/ })).toBeVisible({ timeout: 5000 });

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

  test('RÉGRESSION #2 : Ajouter une question via IA @functional', async ({ page, isMobile }) => {
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

      await debugScreenshot(page, 'TEST2-DEBUG-BEFORE-FILL');

      // 2. Demander l'ajout d'une question avec robustFill()
      const textToFill = 'Ajoute une question sur l\'âge';
      
      // robustFill() gère automatiquement les cas mobile et les inputs cachés
      await robustFill(chatInput, textToFill, { debug: process.env.DEBUG_E2E === '1' });
      log('✅ robustFill() terminé');
      
      await debugScreenshot(page, 'TEST2-BEFORE-ENTER');
      
      await chatInput.press('Enter');
      log('✅ Enter pressé');
      
      await debugScreenshot(page, 'TEST2-AFTER-ENTER');
      
      // 3. Attendre que l'IA traite la demande et ajoute la question
      // Sur mobile, on ne peut pas voir les messages IA (cachés par le Preview)
      // On attend directement que le nouvel onglet apparaisse
      log('⏱️ Attente que l\'IA ajoute la question...');
      
      // 4. Vérifier qu'un nouvel onglet a été ajouté (attendre que le count augmente)
      const questionTabsAfter = editor.getByRole('button', { name: /^Q\d+$/ });
      // Attendre que le nombre d'onglets augmente (attente explicite avec expect.poll)
      await expect.poll(async () => {
        const countAfter = await questionTabsAfter.count();
        return countAfter;
      }, { timeout: 15000 }).toBeGreaterThan(countBefore);
      
      const countAfter = await questionTabsAfter.count();
      expect(countAfter).toBe(countBefore + 1);
      log(`✅ Question ajoutée (${countBefore} → ${countAfter} onglets)`);

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
      
      await debugScreenshot(page, 'TEST3-INITIAL-STATE');
      
      // Le poll est déjà créé, on vérifie qu'il est là
      const editor = page.locator('[data-poll-preview]');
      await expect(editor).toBeVisible({ timeout: 10000 });
      log('✅ Éditeur présent');
      
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
      await robustFill(chatInput, 'Supprime la question 2', { debug: process.env.DEBUG_E2E === '1' });
      log('✅ robustFill() terminé');
      
      await debugScreenshot(page, 'TEST3-BEFORE-ENTER');
      
      await chatInput.press('Enter');
      log('✅ Enter pressé');
      
      await debugScreenshot(page, 'TEST3-AFTER-ENTER');
      
      // 3. Vérifier que le nombre d'onglets a diminué (attente explicite avec expect.poll)
      await expect.poll(async () => {
        const finalCount = await questionTabs.count();
        return finalCount;
      }, { timeout: 15000 }).toBe(initialCount - 1);
      
      const finalCount = await questionTabs.count();
      log(`✅ Question supprimée (${initialCount} → ${finalCount} onglets)`);

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
