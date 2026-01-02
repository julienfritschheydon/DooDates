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
 * Navigue vers le workspace spécifié et attend que le chat soit prêt
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
  }
) {
  const url = WORKSPACE_URLS[workspaceType];
  const finalUrl = options?.addE2EFlag ? `${url}?e2e-test=true` : url;

  await page.goto(finalUrl, {
    waitUntil: options?.waitUntil || 'domcontentloaded'
  });

  await waitForPageLoad(page, browserName);
  
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

  // Attendre que le chat soit prêt avec la stratégie robuste
  await waitForChatInput(page, browserName);
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

    // Lister tous les éléments avec data-testid pour debug
    const allTestIds = await page.locator('[data-testid]').all();
    console.log(`🔍 waitForChatInput: ${allTestIds.length} éléments avec data-testid trouvés`);

    // Prendre un screenshot pour debug
    await page.screenshot({ path: 'debug-chat-input.png', fullPage: true });
    console.log('🔍 waitForChatInput: Screenshot sauvegardé dans debug-chat-input.png');

    throw error;
  }
}

/**
 * Envoie un message dans le chat
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
  }
) {
  const messageInput = page.locator('[data-testid="chat-input"]');
  await expect(messageInput).toBeVisible({ timeout: options?.timeout || 10000 });

  // Attendre que l'input soit activé avant de remplir (Gemini peut désactiver le champ pendant la génération)
  await expect(messageInput).toBeEnabled({ timeout: options?.timeout || 10000 });

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
 * Attend qu'une réponse IA apparaisse dans le chat
 * 
 * @param page - La page Playwright
 * @param timeout - Timeout en ms (défaut: 30000)
 */
export async function waitForAIResponse(
  page: Page,
  timeout: number = 30000
) {
  const successText = page.getByText(/Voici votre (questionnaire|sondage)/i);
  const errorText = page.getByText(/désolé|quota.*dépassé|erreur/i);

  await Promise.race([
    successText.waitFor({ state: 'visible', timeout }).catch(() => null),
    errorText.waitFor({ state: 'visible', timeout }).catch(() => null),
  ]);

  const hasError = await errorText.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasError) {
    const errorContent = await errorText.textContent();
    throw new Error(
      `L'IA a retourné une erreur: ${errorContent}`
    );
  }

  await expect(successText).toBeVisible({ timeout: 5000 });
}

/**
 * Récupère l'ID de la conversation la plus récente depuis localStorage
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

