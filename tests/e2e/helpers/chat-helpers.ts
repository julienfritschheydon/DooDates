/**
 * Helpers pour la gestion du chat dans les tests E2E
 * Factorise le code commun pour naviguer vers workspace, envoyer des messages, etc.
 */

import { Page, expect } from '@playwright/test';
import { waitForPageLoad, robustFill } from '../utils';

/**
 * Navigue vers workspace et attend que le chat soit prêt
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 */
export async function navigateToWorkspace(
  page: Page,
  browserName: string
) {
  await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page, browserName);
  
  // Attendre que le chat input soit visible
  const messageInput = page.locator('[data-testid="message-input"]');
  await expect(messageInput).toBeVisible({ timeout: 10000 });
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
  const messageInput = page.locator('[data-testid="message-input"]');
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

