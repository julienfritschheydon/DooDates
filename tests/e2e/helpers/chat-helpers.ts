/**
 * Helpers pour la gestion du chat dans les tests E2E
 * Factorise le code commun pour naviguer vers workspace, envoyer des messages, etc.
 */

import { Page, expect } from '@playwright/test';
import { waitForPageLoad, robustFill } from '../utils';
import { waitForChatInputReady, waitForReactStable } from './wait-helpers';

/**
 * Types de workspace disponibles
 */
export type WorkspaceType = 'date' | 'form' | 'quizz' | 'availability' | 'default';

/**
 * Configuration des URLs de workspace selon le type
 */
const WORKSPACE_URLS: Record<WorkspaceType, string> = {
  date: '/DooDates/date-polls/workspace/date',
  form: '/DooDates/form-polls/workspace/form',
  quizz: '/DooDates/quizz/workspace',
  availability: '/DooDates/availability-polls/workspace/availability',
  default: '/DooDates/date-polls/workspace/date'
};

/**
 * Détecte automatiquement le type de poll en fonction de l'URL et du contenu
 * 
 * @param page - La page Playwright
 * @returns Le type de poll détecté
 */
export async function detectPollType(page: Page): Promise<WorkspaceType> {
  // 1. Détection via l'URL (méthode principale)
  const url = page.url();
  if (url.includes('/form-polls/')) return 'form';
  if (url.includes('/date-polls/')) return 'date';
  if (url.includes('/quizz/')) return 'quizz';
  if (url.includes('/availability-polls/')) return 'availability';
  
  // 2. Fallback via le contenu de la page
  try {
    const hasDateElements = await page.locator('[data-testid="calendar"], [data-testid="date-picker"]').count() > 0;
    const hasFormElements = await page.locator('[data-testid="question-card"], [data-testid="form-editor"]').count() > 0;
    const hasQuizzElements = await page.locator('[data-testid="quizz-editor"], [data-testid="question-quizz"]').count() > 0;
    
    if (hasQuizzElements) return 'quizz';
    if (hasFormElements) return 'form';
    if (hasDateElements) return 'date';
  } catch {
    // Ignorer les erreurs de détection
  }
  
  // 3. Fallback via les placeholders dans le chat
  try {
    const chatInput = page.locator('textarea').first();
    const placeholder = await chatInput.getAttribute('placeholder');
    
    if (placeholder?.includes('formulaire')) return 'form';
    if (placeholder?.includes('sondage') && placeholder?.includes('date')) return 'date';
    if (placeholder?.includes('quiz')) return 'quizz';
    if (placeholder?.includes('disponibilités')) return 'availability';
  } catch {
    // Ignorer les erreurs
  }
  
  // 4. Default par défaut
  return 'default';
}

/**
 * Trouve la zone chat principale quel que soit le type de poll
 * Utilise une stratégie de détection robuste avec fallbacks multiples
 * 
 * @param page - La page Playwright
 * @returns Le locator de la zone chat trouvée
 */
export async function findChatZone(page: Page): Promise<ReturnType<Page['locator']>> {
  // 1. Essayer l'input de chat principal (le plus fiable)
  const chatInput = page.locator('[data-testid="chat-input"]').first();
  try {
    await chatInput.waitFor({ state: 'visible', timeout: 2000 });
    return chatInput;
  } catch {
    // Continuer avec les fallbacks
  }

  // 2. Essayer les conteneurs de chat
  const chatContainers = [
    '[data-testid="gemini-chat"]',
    '[data-testid="chat-interface"]',
    '[data-testid="chat-container"]',
    '[data-testid="conversation-container"]'
  ];
  
  for (const selector of chatContainers) {
    try {
      const container = page.locator(selector).first();
      await container.waitFor({ state: 'visible', timeout: 1000 });
      return container;
    } catch {
      continue;
    }
  }

  // 3. Essayer les textareas avec placeholders spécifiques
  const textareaSelectors = [
    'textarea[placeholder*="IA"]',
    'textarea[placeholder*="sondage"]',
    'textarea[placeholder*="formulaire"]',
    'textarea[placeholder*="Décrivez"]',
    'textarea[placeholder*="Organisez"]'
  ];
  
  for (const selector of textareaSelectors) {
    try {
      const textarea = page.locator(selector).first();
      await textarea.waitFor({ state: 'visible', timeout: 1000 });
      return textarea;
    } catch {
      continue;
    }
  }

  // 4. Fallback sur la zone preview (souvent adjacente au chat)
  const previewSelectors = [
    '[data-poll-preview]',
    '[data-testid="poll-preview"]',
    '[data-testid="form-preview"]',
    '[data-testid="preview-container"]'
  ];
  
  for (const selector of previewSelectors) {
    try {
      const preview = page.locator(selector).first();
      await preview.waitFor({ state: 'visible', timeout: 1000 });
      return preview;
    } catch {
      continue;
    }
  }

  // 5. Dernier recours : premier textarea/input éditable
  const anyEditable = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
  try {
    await anyEditable.waitFor({ state: 'visible', timeout: 2000 });
    return anyEditable;
  } catch {
    throw new Error('Chat zone not found: No chat input, container, or editable element detected');
  }
}

/**
 * Valide l'état du chat (prêt, chargement, désactivé)
 * Utile pour les tests qui doivent vérifier l'état de l'interface
 * 
 * @param page - La page Playwright
 * @param expectedState - L'état attendu du chat
 * @param options - Options supplémentaires
 */
export async function validateChatState(
  page: Page,
  expectedState: 'ready' | 'loading' | 'disabled' | 'hidden',
  options?: {
    timeout?: number;
    fallbackSelector?: string;
  }
): Promise<void> {
  const timeout = options?.timeout || 10000;
  const selector = options?.fallbackSelector || '[data-testid="chat-input"]';
  const chatInput = page.locator(selector).first();

  switch (expectedState) {
    case 'ready':
      await expect(chatInput).toBeVisible({ timeout });
      await expect(chatInput).toBeEnabled({ timeout });
      break;
      
    case 'loading':
      await expect(chatInput).toBeVisible({ timeout });
      await expect(chatInput).toBeDisabled({ timeout });
      // Vérifier aussi l'indicateur de chargement
      try {
        const loadingIndicator = page.locator('[data-testid="ai-thinking"], [data-testid="loading"]').first();
        await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      } catch {
        // L'indicateur de chargement est optionnel
      }
      break;
      
    case 'disabled':
      await expect(chatInput).toBeDisabled({ timeout });
      break;
      
    case 'hidden':
      await expect(chatInput).toBeHidden({ timeout });
      break;
  }
}

/**
 * Navigue vers le workspace spécifié et attend que le chat soit prêt
 * Version améliorée avec détection automatique du type si non spécifié
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param workspaceType - Le type de workspace ('date', 'form', 'quizz', 'availability', 'default')
 * @param options - Options supplémentaires
 */
export async function navigateToWorkspace(
  page: Page,
  browserName: string,
  workspaceType: WorkspaceType = 'default',
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: 'domcontentloaded' | 'networkidle' | 'load';
    waitForChat?: boolean; // Nouvelle option pour attendre le chat
  }
) {
  // Vérifier si la page est déjà fermée
  if (page.isClosed()) {
    throw new Error('Cannot navigate: page is already closed.');
  }

  const url = WORKSPACE_URLS[workspaceType];
  const finalUrl = options?.addE2EFlag ? `${url}?e2e-test=true` : url;

  try {
    console.log(`🚀 Navigation vers: ${finalUrl}`);
    await page.goto(finalUrl, {
      waitUntil: options?.waitUntil || 'networkidle', // Plus robuste que domcontentloaded
      timeout: 30000 // Timeout explicite pour éviter les timeouts par défaut
    });

    console.log(`✅ Navigation terminée: ${page.url()}`);

    // Vérifier que la navigation a réussi
    if (page.isClosed()) {
      throw new Error('Page was closed during navigation');
    }

    await waitForPageLoad(page, browserName);
    
    // Vérification défensive après chaque opération critique
    if (page.isClosed()) {
      throw new Error('Page was closed after page load');
    }
    
    // N'attendre le chat que si explicitement demandé (par défaut oui pour compatibilité)
    const shouldWaitForChat = options?.waitForChat !== false;
    
    if (shouldWaitForChat) {
      // Attendre que le chat input soit disponible avant de continuer
      try {
        await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });
        console.log('✅ Chat input trouvé après navigation');
      } catch (error) {
        console.log('⚠️ Chat input non trouvé immédiatement, utilisation des fallbacks...');
        // Continuer avec les fallbacks existants
      }

      // Attendre que React soit stable avant de chercher le chat input
      await waitForReactStable(page, { browserName });
      
      // Vérification défensive avant waitForChatInputReady
      if (page.isClosed()) {
        throw new Error('Page was closed before chat input search');
      }

      // Attendre que le chat input soit prêt via le helper résilient
      await waitForChatInputReady(page, browserName);
    } else {
      console.log('⏭️ Skip chat input wait (waitForChat: false)');
      // Juste attendre que React soit stable
      await waitForReactStable(page, { browserName });
    }
    
    // Vérification défensive finale
    if (page.isClosed()) {
      throw new Error('Page was closed at end of navigation');
    }
  } catch (error) {
    console.error('❌ Navigation failed:', error);
    
    // Screenshot pour le debug
    try {
      await page.screenshot({ 
        path: `debug-navigation-failed-${Date.now()}.png`, 
        fullPage: true 
      });
      console.log('📸 Screenshot de debug sauvegardé');
    } catch (screenshotError) {
      console.log('⚠️ Impossible de sauvegarder le screenshot:', screenshotError);
    }
    
    // Logs détaillés pour le debug
    try {
      const pageUrl = page.url();
      const pageTitle = await page.title();
      console.log(`🔍 Debug info - URL: ${pageUrl}, Title: ${pageTitle}`);
      console.log(`🔍 Page closed: ${page.isClosed()}`);
    } catch (debugError) {
      console.log('⚠️ Impossible de récupérer les infos de debug:', debugError);
    }
    
    throw new Error(`Navigation to workspace failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Navigue vers le workspace avec détection automatique du type
 * Utilise l'URL actuelle pour déterminer le type de workspace approprié
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param options - Options supplémentaires
 */
export async function navigateToWorkspaceAuto(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: 'domcontentloaded' | 'networkidle' | 'load';
    waitForChat?: boolean;
    forceType?: WorkspaceType; // Forcer un type spécifique si détection échoue
  }
): Promise<WorkspaceType> {
  // Détecter le type de poll automatiquement
  const detectedType = options?.forceType || await detectPollType(page);
  console.log(`🔍 Auto-detected poll type: ${detectedType}`);
  
  // Naviguer vers le workspace approprié
  await navigateToWorkspace(page, browserName, detectedType, options);
  
  return detectedType;
}

/**
 * @deprecated Utiliser navigateToWorkspace(page, browserName, 'date') à la place
 * Navigue vers le workspace des date-polls (compatibilité ascendante)
 */
export async function navigateToDateWorkspace(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: 'domcontentloaded' | 'networkidle' | 'load';
  }
) {
  return navigateToWorkspace(page, browserName, 'date', options);
}

/**
 * @deprecated Utiliser navigateToWorkspace(page, browserName, 'form') à la place  
 * Navigue vers le workspace des form-polls
 */
export async function navigateToFormWorkspace(
  page: Page,
  browserName: string,
  options?: {
    addE2EFlag?: boolean;
    waitUntil?: 'domcontentloaded' | 'networkidle' | 'load';
  }
) {
  return navigateToWorkspace(page, browserName, 'form', options);
}

/**
 * Attend que le champ de saisie du chat soit visible
 * Utilise waitForChatInputReady pour une stratégie robuste avec fallbacks
 *
 * @param page - La page Playwright
 * @param browserNameOrTimeout - Le nom du navigateur (string) ou timeout en ms (number) pour compatibilité
 * @param timeout - Timeout en ms (optionnel, utilise les timeouts par défaut si non fourni)
 */
export async function waitForChatInput(
  page: Page,
  browserNameOrTimeout?: string | number,
  timeout?: number
) {
  console.log('🔍 waitForChatInput: Recherche du chat input...');

  // Gérer la compatibilité avec l'ancienne signature: waitForChatInput(page, timeout)
  let browserName: string = 'chromium';
  let actualTimeout: number | undefined;

  if (typeof browserNameOrTimeout === 'string') {
    browserName = browserNameOrTimeout;
    actualTimeout = timeout;
  } else if (typeof browserNameOrTimeout === 'number') {
    // Ancienne signature: waitForChatInput(page, timeout)
    actualTimeout = browserNameOrTimeout;
  } else {
    // Pas de paramètres: utiliser les valeurs par défaut
    actualTimeout = timeout;
  }

  try {
    // Utiliser la stratégie robuste avec fallbacks
    const chatInput = await waitForChatInputReady(page, browserName, { timeout: actualTimeout });

    // Vérifier que c'est bien l'input de chat (pas un fallback)
    const testId = await chatInput.getAttribute('data-testid');
    if (testId === 'chat-input') {
      console.log('✅ waitForChatInput: Chat input trouvé et visible');
    } else {
      console.log(`⚠️ waitForChatInput: Fallback utilisé (${testId || 'unknown'}), mais élément interactif trouvé`);
    }

    // Vérifier que l'élément est visible et interactif
    await expect(chatInput).toBeVisible({ timeout: actualTimeout || 5000 });
  } catch (error) {
    // Diagnostic en cas d'échec
    console.log('❌ waitForChatInput: Échec de la recherche du chat input');

    // Vérifier si la page est fermée
    if (page.isClosed()) {
      console.log('❌ La page est fermée - impossible de continuer');
      throw new Error('Page is closed - cannot continue with chat input search');
    }

    // Lister tous les éléments avec data-testid pour debug
    try {
      const allTestIds = await page.locator('[data-testid]').all();
      console.log(`🔍 waitForChatInput: ${allTestIds.length} éléments avec data-testid trouvés`);
    } catch (debugError) {
      console.log('❌ Impossible de lister les éléments - page probablement fermée');
    }

    // Prendre un screenshot pour debug
    try {
      await page.screenshot({ path: 'debug-chat-input.png', fullPage: true });
      console.log('🔍 waitForChatInput: Screenshot sauvegardé dans debug-chat-input.png');
    } catch (screenshotError) {
      console.log('❌ Impossible de prendre un screenshot');
    }

    throw error;
  }
}

/**
 * Envoie un message dans le chat avec détection automatique de la zone chat
 * Version améliorée qui utilise findChatZone pour une détection robuste
 * 
 * @param page - La page Playwright
 * @param message - Le message à envoyer
 * @param options - Options supplémentaires
 */
export async function sendChatMessage(
  page: Page,
  message: string,
  options?: {
    waitForResponse?: boolean;
    timeout?: number;
    useAutoDetection?: boolean; // Utiliser findChatZone automatiquement
  }
) {
  const timeout = options?.timeout || 10000;
  const useAutoDetection = options?.useAutoDetection !== false; // true par défaut
  
  // Trouver la zone chat automatiquement si demandé
  let messageInput;
  if (useAutoDetection) {
    try {
      const chatZone = await findChatZone(page);
      // Si la zone trouvée est un input/textarea, l'utiliser directement
      const tagName = await chatZone.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'textarea' || tagName === 'input') {
        messageInput = chatZone;
      } else {
        // Sinon, chercher l'input à l'intérieur de la zone
        messageInput = chatZone.locator('textarea, input[type="text"]').first();
      }
    } catch (error) {
      console.log('⚠️ Auto-detection failed, falling back to default selector');
      messageInput = page.locator('[data-testid="chat-input"]');
    }
  } else {
    messageInput = page.locator('[data-testid="chat-input"]');
  }

  await expect(messageInput).toBeVisible({ timeout });
  await expect(messageInput).toBeEnabled({ timeout });

  await robustFill(messageInput, message, { debug: process.env.DEBUG_E2E === '1' });
  await messageInput.press('Enter');

  if (options?.waitForResponse !== false) {
    // Attendre que le message apparaisse ou que l'input soit toujours disponible
    const messageVisible = await page.locator(`text=${message}`).isVisible({ timeout: 5000 }).catch(() => false);
    if (!messageVisible) {
      // Si le message n'apparaît pas, vérifier que l'input est toujours disponible
      await expect(messageInput).toBeVisible();
    }
  }
}

/**
 * Attend qu'une réponse IA apparaisse dans le chat (version générique)
 * Détecte automatiquement les patterns de réponse quel que soit le type de poll
 * 
 * @param page - La page Playwright
 * @param options - Options d'attente
 */
export async function waitForAIResponse(
  page: Page,
  options?: {
    timeout?: number;
    pollType?: WorkspaceType; // Type de poll pour patterns spécifiques
  }
) {
  const timeout = options?.timeout || 30000;
  const pollType = options?.pollType || await detectPollType(page);
  
  // Patterns de réponse selon le type de poll
  let successPatterns: string[];
  let errorPatterns: string[] = [
    'désolé',
    'quota dépassé',
    'erreur',
    'une erreur s\'est produite'
  ];

  switch (pollType) {
    case 'form':
      successPatterns = [
        'Voici votre questionnaire',
        'Voici votre formulaire',
        'Voici le questionnaire',
        'Voici le formulaire',
        'J\'ai créé un questionnaire',
        'J\'ai créé un formulaire'
      ];
      break;
    case 'quizz':
      successPatterns = [
        'Voici votre quiz',
        'Voici votre quizz',
        'Voici le quiz',
        'Voici le quizz',
        'J\'ai créé un quiz',
        'J\'ai créé un quizz'
      ];
      break;
    case 'availability':
      successPatterns = [
        'Voici votre sondage de disponibilités',
        'Voici votre créneau',
        'Voici les disponibilités',
        'Voici les créneaux',
        'J\'ai organisé vos disponibilités'
      ];
      break;
    case 'date':
    default:
      successPatterns = [
        'Voici votre sondage',
        'Voici votre questionnaire',
        'Voici le sondage',
        'Voici le questionnaire',
        'J\'ai créé un sondage',
        'J\'ai créé un questionnaire'
      ];
      break;
  }

  // Attendre une réponse (succès ou erreur)
  const successLocators = successPatterns.map(pattern => page.locator(`text=${pattern}`));
  const errorLocators = errorPatterns.map(pattern => page.locator(`text=${pattern}`));

  // Race condition entre succès et erreur
  const results = await Promise.race([
    ...successLocators.map(locator => locator.waitFor({ state: 'visible', timeout }).catch(() => null)),
    ...errorLocators.map(locator => locator.waitFor({ state: 'visible', timeout }).catch(() => null))
  ]);

  // Vérifier s'il y a une erreur
  for (const errorLocator of errorLocators) {
    const hasError = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      const errorContent = await errorLocator.textContent();
      throw new Error(`L'IA a retourné une erreur: ${errorContent}`);
    }
  }

  // Vérifier qu'on a bien une réponse de succès
  let hasSuccess = false;
  for (const successLocator of successLocators) {
    const isVisible = await successLocator.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      hasSuccess = true;
      break;
    }
  }

  if (!hasSuccess) {
    throw new Error(`Aucune réponse IA de succès détectée pour le type ${pollType}`);
  }
}

/**
 * Vérifie qu'une conversation est active et fonctionnelle
 * Combine détection de zone + validation état + test d'envoi
 * 
 * @param page - La page Playwright
 * @param options - Options de vérification
 */
export async function verifyChatFunctionality(
  page: Page,
  options?: {
    testMessage?: string;
    pollType?: WorkspaceType;
    timeout?: number;
  }
): Promise<{
  pollType: WorkspaceType;
  chatZone: ReturnType<Page['locator']>;
  isFunctional: boolean;
  error?: string;
}> {
  const timeout = options?.timeout || 15000;
  const testMessage = options?.testMessage || "Test de fonctionnement";
  
  try {
    // 1. Détecter le type de poll
    const pollType = options?.pollType || await detectPollType(page);
    console.log(`🔍 Detected poll type: ${pollType}`);

    // 2. Trouver la zone chat
    const chatZone = await findChatZone(page);
    console.log('✅ Chat zone found');

    // 3. Valider que le chat est prêt
    await validateChatState(page, 'ready', { timeout });
    console.log('✅ Chat state validated: ready');

    // 4. Tester l'envoi d'un message (si demandé)
    if (options?.testMessage) {
      await sendChatMessage(page, testMessage, { 
        timeout, 
        waitForResponse: false, // Ne pas attendre de réponse pour un test simple
        useAutoDetection: true 
      });
      console.log('✅ Test message sent successfully');
    }

    return {
      pollType,
      chatZone,
      isFunctional: true
    };

  } catch (error) {
    return {
      pollType: options?.pollType || 'default',
      chatZone: page.locator('body'), // Fallback
      isFunctional: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Récupère l'ID de la conversation la plus récente depuis localStorage
 * Version améliorée avec fallbacks multiples
 * 
 * @param page - La page Playwright
 * @returns L'ID de la conversation ou null
 */
export async function getLatestConversationId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    // Méthode 1: Chercher dans doodates_conversations (format principal)
    const conversationsData = localStorage.getItem('doodates_conversations');
    if (conversationsData) {
      try {
        const conversations = JSON.parse(conversationsData);
        if (Array.isArray(conversations) && conversations.length > 0) {
          // Retourner l'ID de la conversation la plus récente
          const sorted = conversations.sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          return sorted[0].id || null;
        }
      } catch (e) {
        // Ignorer erreur de parsing
      }
    }

    // Méthode 2: Chercher des clés conversation_* (format legacy)
    const keys = Object.keys(localStorage);
    const convKey = keys.find(k => k.startsWith('conversation_'));
    if (convKey) {
      return convKey.replace('conversation_', '');
    }

    return null;
  });
}

/**
 * Attend qu'une conversation soit créée dans localStorage ou Supabase
 * 
 * @param page - La page Playwright
 * @param maxAttempts - Nombre maximum de tentatives (défaut: 15)
 * @returns L'ID de la conversation ou null
 */
export async function waitForConversationCreated(
  page: Page,
  maxAttempts: number = 15
): Promise<string | null> {
  let conversationId: string | null = null;
  let attempts = 0;

  while (!conversationId && attempts < maxAttempts) {
    await page.waitForTimeout(1000);
    conversationId = await getLatestConversationId(page);
    attempts++;
  }

  return conversationId;
}

