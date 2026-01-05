// /**
//  * Form Poll Regression Tests
//  * DooDates - Tests de non-régression pour les Form Polls avec IA
//  *
//  * Objectif : Détecter les régressions dans les fonctionnalités critiques
//  * - Création Form Poll via IA
//  * - Ajout de questions
//  * - Modification de questions
//  * - Suppression de questions
//  * - Reprise de conversation
//  */

// import { test, expect } from '@playwright/test';
// import { withConsoleGuard, robustFill, createLogger, debugScreenshot } from './utils';
// import { setupAllMocks, setupAllMocksWithoutNavigation } from './global-setup';
// import { createFormPollViaAI } from './helpers/poll-helpers';
// import { navigateToWorkspace, sendChatMessage, waitForAIResponse } from './helpers/chat-helpers';
// import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from './helpers/wait-helpers';
// import { getTimeouts } from './config/timeouts';
// import { safeIsVisible } from './helpers/safe-helpers';

// test.describe('Form Poll - Tests de non-régression', () => {
//   test.describe.configure({ mode: 'serial' });

//   // Skip sur WebKit/Safari car les mocks Gemini ne fonctionnent pas de manière fiable
//   // Limitation connue de Playwright : https://github.com/microsoft/playwright/issues/13038
//   test.skip(({ browserName }) => browserName === 'webkit', 'Mocks Gemini non fiables sur Safari/Webkit');

//   // Variables partagées entre les tests (persistent dans le même worker grâce au mode serial)
//   let pollCreated = false;
//   let pollUrl = '';
//   let conversationData: { id: string; data: any } | null = null;

//   test.beforeAll(async ({ browser }) => {
//     // Clear localStorage au début de la suite de tests
//     // Créer un contexte temporaire pour nettoyer le localStorage
//     const context = await browser.newContext();
//     const page = await context.newPage();
//     await page.goto('/');
//     await page.evaluate(() => localStorage.clear());
//     await context.close();
//   });

//   test.beforeEach(async ({ page, browserName }) => {
//     const timeouts = getTimeouts(browserName);
//     await setupAllMocks(page);

//     // Pour le premier test, on va créer le poll dans le test lui-même
//     // Pour les tests suivants, vérifier si pollUrl existe et naviguer vers le poll
//     if (!pollCreated || !pollUrl) {
//       // Premier test ou pollUrl non défini : laisser le test créer le poll
//       await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
//       await waitForNetworkIdle(page, { browserName });
//       // Attendre que le chat input soit visible (indicateur que la page est prête)
//       await waitForElementReady(page, '[data-testid="message-input"]', { browserName, timeout: timeouts.element });
//     } else {
//       // Pour les tests suivants, restaurer le localStorage avant la navigation
//       if (conversationData) {
//         await page.addInitScript(({ convId, convData }) => {
//           localStorage.setItem(`conversation_${convId}`, JSON.stringify(convData));
//         }, { convId: conversationData.id, convData: conversationData.data });
//       }

//       // Naviguer vers le poll créé
//       await page.goto(pollUrl, { waitUntil: 'domcontentloaded' });
//       await waitForNetworkIdle(page, { browserName });

//       // Attendre que l'éditeur soit visible ou présent
//       const editor = page.locator('[data-poll-preview]');
//       const editorAttached = await safeIsVisible(editor);

//       if (!editorAttached) {
//         // Si l'éditeur n'est pas trouvé, peut-être que le localStorage n'a pas été préservé
//         // Dans ce cas, recréer le poll
//         // Note: browserName n'est pas accessible ici, utiliser 'chromium' par défaut
//         const currentPollUrl = await createFormPollViaAI(page, 'chromium', 'Crée un questionnaire avec 1 seule question');
//         pollUrl = currentPollUrl;
//         pollCreated = true;
//         // Mettre à jour conversationData
//         const conversationId = currentPollUrl.split('conversationId=')[1];
//         if (conversationId) {
//           const convData = await page.evaluate((convId) => {
//             return localStorage.getItem(`conversation_${convId}`);
//           }, conversationId);
//           if (convData) {
//             conversationData = { id: conversationId, data: JSON.parse(convData) };
//           }
//         }
//         await page.goto(currentPollUrl, { waitUntil: 'domcontentloaded' });
//         await waitForNetworkIdle(page, { browserName });
//         await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element });
//       } else {
//         // Attendre que l'éditeur soit visible
//         await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element });
//         await waitForReactStable(page, { browserName });
//       }
//     }
//   });

//   test('RÉGRESSION #1 : Créer Form Poll avec 1 question via IA @smoke @critical @functional', async ({ page, browserName }) => {
//     const log = createLogger('FormPoll-Create');
//     test.slow();

//     // Créer un questionnaire avec 1 seule question via IA (utilise le helper)
//     const url = await createFormPollViaAI(page, browserName, 'Crée un questionnaire avec 1 seule question');

//     // Sauvegarder l'URL pour les tests suivants
//     pollUrl = url;
//     log(`✅ URL du poll sauvegardée : ${pollUrl}`);

//     // Vérifier que les onglets de questions sont présents dans l'éditeur
//     const editor = page.locator('[data-poll-preview]');
//     const questionTabs = editor.getByRole('button', { name: /^Q\d+$/ });
//     const count = await questionTabs.count();
//     expect(count).toBeGreaterThan(0);
//     log(`✅ ${count} onglet(s) de question(s) généré(s)`);

//     // Créer manuellement la conversation dans localStorage si elle n'existe pas
//     const conversationId = pollUrl.split('conversationId=')[1];
//     if (conversationId) {
//       const conversation = {
//         id: conversationId,
//         title: 'Test Form Poll Conversation',
//         status: 'active',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         firstMessage: 'Crée un questionnaire avec 1 seule question',
//         messageCount: 2,
//         isFavorite: false,
//         tags: [],
//         metadata: {}
//       };
//       await page.evaluate(({ convId, convData }) => {
//         localStorage.setItem(`conversation_${convId}`, JSON.stringify(convData));
//       }, { convId: conversationId, convData: conversation });
//       // Sauvegarder les données pour les tests suivants
//       conversationData = { id: conversationId, data: conversation };
//       log('✅ Conversation créée dans localStorage');
//     }

//     // Marquer le poll comme créé pour les tests suivants
//     pollCreated = true;
//   });

//   test('RÉGRESSION #2 : Ajouter une question via IA @functional', async ({ page, isMobile, browserName }) => {
//     // Skip sur mobile : le textarea est caché par le z-index de l'éditeur
//     test.skip(isMobile, 'Textarea caché par z-index sur mobile');

//     const timeouts = getTimeouts(browserName);
//     const log = createLogger('FormPoll-AddQuestion');

//     await withConsoleGuard(page, async () => {
//       test.slow();

//       // Le poll avec 1 question est déjà créé par le test #1
//       const editor = page.locator('[data-poll-preview]');
//       const editorVisible = await safeIsVisible(editor);

//       if (!editorVisible) {
//         // Si l'éditeur n'est pas trouvé, peut-être que le localStorage n'a pas été préservé
//         // Dans ce cas, recréer le poll
//         const currentPollUrl = await createFormPollViaAI(page, browserName, 'Crée un questionnaire avec 1 seule question');
//         pollUrl = currentPollUrl;
//         pollCreated = true;
//         // Mettre à jour conversationData
//         const conversationId = currentPollUrl.split('conversationId=')[1];
//         if (conversationId) {
//           conversationData = { id: conversationId, data: {} };
//         }
//       }
//       log('✅ Éditeur déjà présent');

//       const chatInput = page.locator('[data-testid="message-input"]');

//       // 🔍 DIAGNOSTIC COMPLET
//       const inputCount = await page.locator('[data-testid="message-input"]').count();
//       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);

//       await waitForElementReady(page, '[data-testid="message-input"]', { browserName, timeout: timeouts.element });
//       log('✅ Chat input trouvé dans le DOM');

//       const isVisible = await chatInput.isVisible();
//       log(`👁️ Input visible : ${isVisible}`);

//       const isDisabled = await chatInput.isDisabled();
//       log(`🔒 Input disabled : ${isDisabled}`);

//       const isEditable = await chatInput.isEditable();
//       log(`✏️ Input editable : ${isEditable}`);

//       const valueBefore = await chatInput.inputValue();
//       log(`📝 Valeur AVANT fill : "${valueBefore}"`);

//       // 1. Compter les onglets de questions avant ajout (Q1, Q2, Q3...)
//       const questionTabsBefore = editor.getByRole('button', { name: /^Q\d+$/ });
//       const countBefore = await questionTabsBefore.count();
//       log(`✅ Nombre d'onglets avant : ${countBefore}`);

//       await debugScreenshot(page, 'TEST2-DEBUG-BEFORE-FILL');

//       // 2. Demander l'ajout d'une question
//       const textToFill = 'Ajoute une question sur l\'âge';

//       await sendChatMessage(page, textToFill);
//       log('✅ Message envoyé');

//       await debugScreenshot(page, 'TEST2-AFTER-ENTER');

//       // 3. Attendre que l'IA traite la demande et ajoute la question
//       // Sur mobile, on ne peut pas voir les messages IA (cachés par le Preview)
//       // On attend directement que le nouvel onglet apparaisse
//       log('⏱️ Attente que l\'IA ajoute la question...');

//       // 4. Vérifier qu'un nouvel onglet a été ajouté (attendre que le count augmente)
//       const questionTabsAfter = editor.getByRole('button', { name: /^Q\d+$/ });
//       // Attendre que le nombre d'onglets augmente (attente explicite avec expect.poll)
//       await expect.poll(async () => {
//         const countAfter = await questionTabsAfter.count();
//         return countAfter;
//       }, { timeout: timeouts.element * 1.5 }).toBeGreaterThan(countBefore);

//       const countAfter = await questionTabsAfter.count();
//       expect(countAfter).toBe(countBefore + 1);
//       log(`✅ Question ajoutée (${countBefore} → ${countAfter} onglets)`);

//       // Mettre à jour conversationData pour préserver les modifications
//       if (conversationData) {
//         const updatedConvData = await page.evaluate((convId) => {
//           const data = localStorage.getItem(`conversation_${convId}`);
//           return data ? JSON.parse(data) : null;
//         }, conversationData.id);
//         if (updatedConvData) {
//           conversationData.data = updatedConvData;
//         }
//       }

//       log('🎉 TEST RÉUSSI : Ajout de question');
//     }, {
//       allowlist: [
//         /Importing a module script failed\./i,
//         /error loading dynamically imported module/i,
//         /DooDatesError/i,
//       ],
//     });
//   });

//   test('RÉGRESSION #3 : Supprimer une question @functional', async ({ page, isMobile, browserName }) => {
//     // Skip sur mobile : le textarea est caché par le z-index de l'éditeur
//     test.skip(isMobile, 'Textarea caché par z-index sur mobile');

//     const timeouts = getTimeouts(browserName);
//     const log = createLogger('FormPoll-Delete');

//     await withConsoleGuard(page, async () => {
//       test.slow();

//       await debugScreenshot(page, 'TEST3-INITIAL-STATE');

//       // Le poll est déjà créé, on vérifie qu'il est là
//       const editor = await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element });
//       log('✅ Éditeur présent');

//       const chatInput = page.locator('[data-testid="message-input"]');
//       // Sur mobile, essayer de scroller vers le chat (optionnel)
//       const scrollSuccess = await chatInput.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => false);
//       if (!scrollSuccess) {
//         // Ignorer si le scroll échoue
//       }
//       await waitForElementReady(page, '[data-testid="message-input"]', { browserName, timeout: timeouts.element });

//       // 1. Compter les onglets de questions (Q1, Q2, Q3...) dans l'éditeur
//       const questionTabs = page.getByRole('button', { name: /^Q\d+$/ });
//       let initialCount = await questionTabs.count();

//       // Si le poll n'a qu'une seule question, c'est que le test #2 n'a pas ajouté la question
//       // ou que le localStorage n'a pas été préservé. Dans ce cas, ajouter une question maintenant.
//       if (initialCount < 2) {
//         log(`⚠️ Seulement ${initialCount} question(s) trouvée(s), ajout d'une question maintenant...`);
//         await robustFill(chatInput, 'Ajoute une question sur l\'âge', { debug: process.env.DEBUG_E2E === '1' });
//         await chatInput.press('Enter');

//         // Attendre que la question soit ajoutée
//         await expect.poll(async () => {
//           const count = await questionTabs.count();
//           return count;
//         }, { timeout: timeouts.element * 1.5 }).toBeGreaterThan(initialCount);

//         // Mettre à jour initialCount après l'ajout
//         initialCount = await questionTabs.count();
//         log(`✅ Question ajoutée, maintenant ${initialCount} onglets`);
//       }

//       expect(initialCount).toBeGreaterThanOrEqual(2);
//       log(`✅ ${initialCount} onglets de questions présents`);

//       // 2. Demander la suppression de la question 2
//       await sendChatMessage(page, 'Supprime la question 2');
//       log('✅ Message envoyé');

//       await debugScreenshot(page, 'TEST3-AFTER-ENTER');

//       // 3. Vérifier que le nombre d'onglets a diminué (attente explicite avec expect.poll)
//       await expect.poll(async () => {
//         const finalCount = await questionTabs.count();
//         return finalCount;
//       }, { timeout: timeouts.element * 1.5 }).toBe(initialCount - 1);

//       const finalCount = await questionTabs.count();
//       log(`✅ Question supprimée (${initialCount} → ${finalCount} onglets)`);

//       log('🎉 TEST RÉUSSI : Suppression de question');
//     }, {
//       allowlist: [
//         /Importing a module script failed\./i,
//         /error loading dynamically imported module/i,
//         /DooDatesError/i,
//       ],
//     });
//   });

//   test('RÉGRESSION #4 : Reprendre conversation après refresh @functional', async ({ page, browserName }) => {
//     const timeouts = getTimeouts(browserName);
//     const log = createLogger('FormPoll-Resume');

//     await withConsoleGuard(page, async () => {
//       test.slow();

//       // Le poll est déjà créé par le test #1, on vérifie juste qu'il est là
//       const editor = await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element });
//       log('✅ Éditeur déjà présent');

//       // 1. Vérifier qu'il y a des onglets avant refresh
//       const questionTabs = editor.getByRole('button', { name: /^Q\d+$/ });
//       const tabCount = await questionTabs.count();
//       expect(tabCount).toBeGreaterThanOrEqual(1);
//       log(`✅ ${tabCount} onglet(s) avant refresh`);

//       // 2. Récupérer l'URL avec conversationId
//       const currentUrl = page.url();
//       log(`✅ URL actuelle : ${currentUrl}`);

//       // 3. Refresh la page
//       await page.reload({ waitUntil: 'domcontentloaded' });
//       await waitForNetworkIdle(page, { browserName });
//       log('✅ Page rechargée');

//       // 4. Vérifier que l'éditeur est toujours là (après reload, besoin de le relocaliser)
//       const editorAfterReload = await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element * 1.5 });
//       log('✅ Éditeur restauré');

//       // 5. Vérifier que les onglets sont toujours là
//       const restoredTabs = editorAfterReload.getByRole('button', { name: /^Q\d+$/ });
//       const restoredTabCount = await restoredTabs.count();
//       expect(restoredTabCount).toBe(tabCount);
//       log(`✅ ${restoredTabCount} onglet(s) après refresh (identique)`);

//       log('🎉 TEST RÉUSSI : Reprise de conversation');
//     }, {
//       allowlist: [
//         /Importing a module script failed\./i,
//         /error loading dynamically imported module/i,
//         /DooDatesError/i,
//       ],
//     });
//   });
// });
