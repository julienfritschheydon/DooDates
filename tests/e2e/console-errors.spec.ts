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
import { setupAllMocks } from './global-setup';
import { waitForNetworkIdle, waitForReactStable, waitForElementReady, waitForChatInputReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';
import { safeIsVisible } from './helpers/safe-helpers';

// Ces tests de console errors ne fonctionnent correctement que sur Chromium (problèmes de mock sur WebKit)
test.describe('Console Errors & React Warnings', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Console error checks optimized for Chrome');

  test.beforeEach(async ({ page, context, browserName }) => {
    // IMPORTANT : Configurer le mock différemment selon le navigateur
    // Webkit a des problèmes de timing avec les routes d'interception

    // Importons la fonction de génération de mock depuis global-setup
    // (on va la dupliquer ici pour éviter les imports circulaires)

    // Fonction locale pour générer la réponse mock
    const generateMockResponse = (userPrompt: string) => {
      const lowerPrompt = userPrompt.toLowerCase();
      const isFormPoll = lowerPrompt.includes('questionnaire') ||
        lowerPrompt.includes('formulaire') ||
        lowerPrompt.includes('form') ||
        lowerPrompt.includes('question');

      if (isFormPoll) {
        let numQuestions = 3;
        const questionMatch = lowerPrompt.match(/(\d+)\s*(question|q)/);
        numQuestions = questionMatch ? parseInt(questionMatch[1]) : 3;

        const questions: Array<{
          title: string;
          type: string;
          required: boolean;
          options?: string[];
          maxChoices?: number;
          placeholder?: string;
          maxLength?: number;
        }> = [];
        for (let i = 1; i <= numQuestions; i++) {
          questions.push({
            title: `Question ${i} générée par mock`,
            type: i === 1 ? 'single' : i === 2 ? 'multiple' : 'text',
            required: true,
            ...(i === 1 && { options: ['Option A', 'Option B', 'Option C'] }),
            ...(i === 2 && { options: ['Choix 1', 'Choix 2', 'Choix 3'], maxChoices: 2 }),
            ...(i === 3 && { placeholder: 'Votre réponse...', maxLength: 500 })
          });
        }

        return {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  type: 'form',
                  title: 'Questionnaire Mock E2E',
                  description: 'Questionnaire généré automatiquement pour les tests',
                  questions
                })
              }]
            },
            finishReason: 'STOP'
          }]
        };
      } else {
        return {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  type: 'date',
                  title: 'Sondage de dates Mock E2E',
                  description: 'Sondage généré automatiquement pour les tests',
                  dates: ['2025-11-01', '2025-11-02', '2025-11-03']
                })
              }]
            },
            finishReason: 'STOP'
          }]
        };
      }
    };

    // Pour les navigateurs normaux : utiliser context.route (plus performant)
    // Webkit sera géré dans le test lui-même avec page.route
    if (browserName !== 'webkit') {
      await context.route('**/generativelanguage.googleapis.com/**', async (route) => {
        const request = route.request();
        const url = request.url();
        const method = request.method();
        const postData = request.postDataJSON();

        let userPrompt = '';
        if (postData?.contents) {
          const lastContent = postData.contents[postData.contents.length - 1];
          if (lastContent?.parts?.[0]?.text) {
            userPrompt = lastContent.parts[0].text;
          }
        }

        // Test de connexion
        if (userPrompt.toLowerCase().includes('test de connexion') || userPrompt.toLowerCase().includes('ok')) {
          console.log('🤖 Gemini API mock (context) - Test de connexion');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              candidates: [{
                content: {
                  parts: [{ text: 'OK' }]
                },
                finishReason: 'STOP'
              }]
            })
          });
          return;
        }

        // Autres requêtes
        console.log('🤖 Gemini API mock (context) - Prompt:', userPrompt.substring(0, 100) + '...');
        const mockResponse = generateMockResponse(userPrompt);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      });

      // Aussi configurer au niveau de la page (doublon de sécurité)
      await setupAllMocks(page);
    }
  });

  test('devrait ne pas avoir d\'erreurs console sur la page d\'accueil @smoke', async ({ page, browserName }) => {
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

    // Aller sur la page d'accueil (workspace date par défaut)
    await page.goto("/date-polls/workspace/date?e2e-test=true", { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // Filtrer les erreurs connues/acceptables
    const filteredErrors = consoleErrors.filter(error => {
      return !error.includes('ServiceWorker') &&
        !error.includes('CORS') &&
        !error.includes('sw.js') &&
        !error.includes('Gemini') &&
        !error.includes('DooDatesError') && // Erreurs métier loggées intentionnellement
        !error.includes('An unknown error occurred when fetching the script.') &&
        !error.includes('ERR_CONNECTION_RESET') &&
        !error.includes('Failed to read from doodates_conversations') &&
        !error.includes('process is not defined') && // Ignorer l'erreur process is not defined
        !error.includes('guest_emails') &&
        !error.includes('Failed to load resource: the server responded with a status of 404'); // Ignorer les 404 génériques
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

  test('devrait ne pas avoir de warnings React Hooks @critical', async ({ page, browserName }) => {
    // Skip sur Safari/Webkit car les mocks d'Edge Function ne fonctionnent pas de manière fiable
    test.skip(browserName === 'webkit', 'Mocks Edge Function non fiables sur Safari/Webkit');

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

    // SOLUTION WEBKIT : Configurer le route au niveau de la page AVANT la navigation
    // D'après les recherches web, webkit a besoin que page.route soit configuré avant goto
    if (browserName === 'webkit') {
      // Fonction locale pour générer la réponse mock (même que dans beforeEach)
      const generateMockResponse = (userPrompt: string) => {
        const lowerPrompt = userPrompt.toLowerCase();
        const isFormPoll = lowerPrompt.includes('questionnaire') ||
          lowerPrompt.includes('formulaire') ||
          lowerPrompt.includes('form') ||
          lowerPrompt.includes('question');

        if (isFormPoll) {
          let numQuestions = 3;
          const questionMatch = lowerPrompt.match(/(\d+)\s*(question|q)/);
          numQuestions = questionMatch ? parseInt(questionMatch[1]) : 3;

          const questions: Array<{
            title: string;
            type: string;
            required: boolean;
            options?: string[];
            maxChoices?: number;
            placeholder?: string;
            maxLength?: number;
          }> = [];
          for (let i = 1; i <= numQuestions; i++) {
            questions.push({
              title: `Question ${i} générée par mock`,
              type: i === 1 ? 'single' : i === 2 ? 'multiple' : 'text',
              required: true,
              ...(i === 1 && { options: ['Option A', 'Option B', 'Option C'] }),
              ...(i === 2 && { options: ['Choix 1', 'Choix 2', 'Choix 3'], maxChoices: 2 }),
              ...(i === 3 && { placeholder: 'Votre réponse...', maxLength: 500 })
            });
          }

          return {
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    type: 'form',
                    title: 'Questionnaire Mock E2E',
                    description: 'Questionnaire généré automatiquement pour les tests',
                    questions
                  })
                }]
              },
              finishReason: 'STOP'
            }]
          };
        } else {
          return {
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    type: 'date',
                    title: 'Sondage de dates Mock E2E',
                    description: 'Sondage généré automatiquement pour les tests',
                    dates: ['2025-11-01', '2025-11-02', '2025-11-03']
                  })
                }]
              },
              finishReason: 'STOP'
            }]
          };
        }
      };

      const routeHandler = async (route: any) => {
        const request = route.request();
        const url = request.url();

        if (url.includes('generativelanguage.googleapis.com')) {
          const method = request.method();
          const postData = request.postDataJSON();

          console.log('🔵 ROUTE WEBKIT INTERCEPTÉE:', { url, method, hasPostData: !!postData });

          let userPrompt = '';
          if (postData?.contents) {
            const lastContent = postData.contents[postData.contents.length - 1];
            if (lastContent?.parts?.[0]?.text) {
              userPrompt = lastContent.parts[0].text;
            }
          }

          // Test de connexion
          if (userPrompt.toLowerCase().includes('test de connexion') || userPrompt.toLowerCase().includes('ok')) {
            console.log('🤖 Gemini API mock (webkit) - Test de connexion');
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                candidates: [{
                  content: {
                    parts: [{ text: 'OK' }]
                  },
                  finishReason: 'STOP'
                }]
              })
            });
            return;
          }

          // Autres requêtes
          console.log('🤖 Gemini API mock (webkit) - Prompt:', userPrompt.substring(0, 100) + '...');
          const mockResponse = generateMockResponse(userPrompt);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse)
          });
          return;
        }

        await route.continue();
      };

      // Configurer le route AVANT la navigation (crucial pour webkit)
      await page.route('**/generativelanguage.googleapis.com/**', routeHandler);

      console.log('✅ Routes webkit configurés au niveau de la page (avant navigation)');
    }

    const timeouts = getTimeouts(browserName);
    // Créer un poll via IA (workspace form pour ce test)
    await page.goto("/form-polls/workspace/form?e2e-test=true", { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    await waitForReactStable(page, { browserName });

    // 📸 Capture 1 : Page chargée
    await page.screenshot({ path: 'test-results/debug-1-page-loaded.png', fullPage: true });

    const chatInput = await waitForChatInputReady(page, browserName, { timeout: timeouts.element });
    await chatInput.fill('Crée un questionnaire avec 1 question');

    // 📸 Capture 2 : Message rempli avant Enter
    await page.screenshot({ path: 'test-results/debug-2-message-filled.png', fullPage: true });

    await chatInput.press('Enter');

    // 📸 Capture 3 : Message envoyé (attente de la réponse)
    await page.screenshot({ path: 'test-results/debug-3-message-sent.png', fullPage: true });

    // Attendre que le bouton de création soit visible (utiliser data-testid pour plus de fiabilité)
    // Le timeout est plus long pour webkit qui peut être plus lent
    const createButton = page.locator("[data-testid="create-form-button"]");

    // Attendre que la réponse IA soit reçue et le bouton apparaisse
    // On attend d'abord qu'un message avec pollSuggestion apparaisse dans le DOM
    try {
      // Attendre qu'un message avec le bouton create-form-button apparaisse
      await page.waitForFunction(
        () => {
          const button = document.querySelector('[data-testid="create-form-button"]') as HTMLElement | null;
          return button !== null && button.offsetParent !== null; // Vérifier qu'il est visible
        },
        { timeout: 20000 }
      );
    } catch (error) {
      // Si le waitForFunction échoue, on essaie une approche alternative
      // Attendre qu'au moins un message de réponse IA soit présent
      await page.waitForFunction(
        () => {
          const messages = Array.from(document.querySelectorAll('[class*="message"], [class*="Message"]'));
          return messages.length >= 2; // Au moins le message utilisateur + la réponse IA
        },
        { timeout: 15000 }
      ).catch(() => {
        // Si ça échoue aussi, on continue avec le wait classique
      });
    }

    // Vérifier les messages affichés dans le chat
    const allMessages = await page.locator("[class*="message"], [class*="Message"]").all();
    console.log('📝 Messages trouvés dans le DOM:', allMessages.length);

    for (let i = 0; i < allMessages.length; i++) {
      const messageText = await allMessages[i].textContent();
      const innerHTML = await allMessages[i].innerHTML();
      console.log(`  Message ${i + 1}: "${messageText?.substring(0, 100)}"`);
      console.log(`  HTML: "${innerHTML.substring(0, 200)}"`);

      // Vérifier si c'est un message d'erreur réseau
      if (messageText && (
        messageText.includes('Problème de connexion') ||
        messageText.includes('connexion réseau') ||
        messageText.includes('indisponible') ||
        messageText.includes('Erreur réseau')
      )) {
        console.log('⚠️ MESSAGE RÉSEAU DÉTECTÉ:', messageText);
      }
    }

    // Vérifier aussi dans le HTML brut
    const pageContent = await page.content();
    const hasNetworkError = pageContent.includes('Problème de connexion') ||
      pageContent.includes('connexion réseau') ||
      pageContent.includes('indisponible') ||
      pageContent.includes('Erreur réseau');
    console.log('🔍 Message réseau dans le HTML:', hasNetworkError ? 'OUI' : 'NON');

    // 📸 Capture 4 : Après attente de la réponse
    await page.screenshot({ path: 'test-results/debug-4-after-wait.png', fullPage: true });

    // Si c'est webkit et qu'il y a un message réseau, skip le test proprement
    // (le code fonctionne en production, c'est juste un problème de mock dans les tests)
    if (browserName === 'webkit' && hasNetworkError) {
      console.log('⚠️ Webkit: Mock n\'a pas intercepté les requêtes. Le code fonctionne en production.');
      console.log('⚠️ Skip du test sur webkit - problème connu avec les routes d\'interception Playwright');
      test.skip();
      return; // Sortir proprement du test
    }

    // Vérifier qu'il n'y a pas de message d'erreur de l'IA
    const errorMessage = page.getByText(/désolé.*je n'ai pas pu traiter/i);
    const hasError = await safeIsVisible(errorMessage);
    if (hasError) {
      // Prendre une capture pour debug
      await page.screenshot({ path: 'test-results/debug-console-errors-ia-error.png', fullPage: true });
      const errorText = await errorMessage.textContent();
      console.error(`❌ L'IA a retourné une erreur: ${errorText}`);
      console.error('💡 Cause probable: Edge Function Supabase "hyper-task" non disponible');
      console.error('💡 Solution: Configurer l\'Edge Function ou utiliser un mock pour les tests E2E');
      throw new Error(
        `L'IA a retourné une erreur au lieu de générer un formulaire. ` +
        `Vérifiez que l'Edge Function Supabase est configurée et accessible. ` +
        `Erreur: ${errorText}`
      );
    }

    try {
      await waitForElementReady(page, '[data-testid="create-form-button"]', { browserName, timeout: timeouts.element * 2 });
      // 📸 Capture 5 : Bouton trouvé et visible
      await page.screenshot({ path: 'test-results/debug-5-button-found.png', fullPage: true });
    } catch (error) {
      // 📸 Capture 6 : Échec - bouton non trouvé après timeout
      await page.screenshot({ path: 'test-results/debug-6-button-not-found.png', fullPage: true });

      // Debug : Vérifier ce qui est dans le DOM
      const pageContent = await page.content();
      const hasButton = pageContent.includes('create-form-button');
      const hasPollSuggestion = pageContent.includes('pollSuggestion') || pageContent.includes('poll-suggestion');
      const hasMessageAI = await page.locator("text=/voici votre/i").count() > 0;

      console.log('🔍 Debug - État de la page:');
      console.log('- Bouton avec data-testid présent:', hasButton);
      console.log('- PollSuggestion dans le DOM:', hasPollSuggestion);
      console.log('- Message AI visible:', hasMessageAI);
      console.log('- Nombre de messages:', await page.locator("[class*="message"]").count());

      throw error;
    }

    // Cliquer sur "Créer ce formulaire"
    await createButton.click();

    // Attendre la prévisualisation
    await waitForElementReady(page, '[data-poll-preview]', { browserName, timeout: timeouts.element });

    // Finaliser (le bouton s'appelle "Publier le formulaire" dans FormEditor)
    const finalizeButton = page.getByRole("button", { name: /publier le formulaire/i });
    if (await safeIsVisible(finalizeButton)) {
      await finalizeButton.click();
      await waitForNetworkIdle(page, { browserName });
      await waitForReactStable(page, { browserName });
      // Attendre que la navigation soit terminée
      await page.waitForURL(/\/poll\/|\/dashboard/, { timeout: timeouts.navigation }).catch(() => { });
    }

    // Rafraîchir la page plusieurs fois pour détecter les memory leaks
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page, { browserName });
      await waitForReactStable(page, { browserName });
    }

    // Vérifier qu'il n'y a pas de warnings React
    expect(reactWarnings, `Warnings React trouvés:\n${reactWarnings.join('\n')}`).toHaveLength(0);
  });
});
