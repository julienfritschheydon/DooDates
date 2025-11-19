/**
 * Helpers avec gestion d'erreurs explicite
 * Remplace les .catch() silencieux par une gestion d'erreurs avec logging
 */

import { Page } from '@playwright/test';
import { createLogger } from '../utils';

/**
 * Clique sur un élément avec fallback et logging
 * 
 * @param locator - Le locator Playwright
 * @param options - Options de clic
 * @returns true si le clic a réussi, false sinon
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await button.click().catch(() => {});
 * 
 * // ✅ APRÈS
 * const clicked = await safeClick(button);
 * if (!clicked) {
 *   // Gérer l'échec explicitement
 * }
 * ```
 */
export async function safeClick(
  locator: ReturnType<Page['locator']>,
  options?: {
    force?: boolean;
    timeout?: number;
    log?: ReturnType<typeof createLogger>;
  }
): Promise<boolean> {
  const log = options?.log || createLogger('safeClick');
  
  try {
    await locator.click({ 
      force: options?.force ?? false,
      timeout: options?.timeout ?? 5000,
    });
    return true;
  } catch (error: any) {
    log('Click failed, trying alternative method', error.message);
    
    try {
      // Essayer avec force
      await locator.click({ force: true, timeout: 3000 });
      log('Click succeeded with force=true');
      return true;
    } catch (forceError: any) {
      log('Click failed even with force', forceError.message);
      return false;
    }
  }
}

/**
 * Vérifie la visibilité d'un élément avec logging
 * 
 * @param locator - Le locator Playwright
 * @param options - Options de vérification
 * @returns true si visible, false sinon
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * const isVisible = await element.isVisible().catch(() => false);
 * 
 * // ✅ APRÈS
 * const isVisible = await safeIsVisible(element, { log });
 * if (!isVisible) {
 *   log('Element not visible, trying alternative approach');
 * }
 * ```
 */
export async function safeIsVisible(
  locator: ReturnType<Page['locator']>,
  options?: {
    timeout?: number;
    log?: ReturnType<typeof createLogger>;
  }
): Promise<boolean> {
  const log = options?.log || createLogger('safeIsVisible');
  
  try {
    return await locator.isVisible({ timeout: options?.timeout ?? 5000 });
  } catch (error: any) {
    log('isVisible check failed', error.message);
    return false;
  }
}

/**
 * Remplit un champ avec gestion d'erreurs explicite
 * 
 * @param locator - Le locator Playwright
 * @param text - Le texte à remplir
 * @param options - Options de remplissage
 * @returns true si le remplissage a réussi, false sinon
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await input.fill('text').catch(() => {});
 * 
 * // ✅ APRÈS
 * const filled = await safeFill(input, 'text', { log });
 * if (!filled) {
 *   throw new Error('Failed to fill input');
 * }
 * ```
 */
export async function safeFill(
  locator: ReturnType<Page['locator']>,
  text: string,
  options?: {
    timeout?: number;
    log?: ReturnType<typeof createLogger>;
  }
): Promise<boolean> {
  const log = options?.log || createLogger('safeFill');
  
  try {
    await locator.fill(text, { timeout: options?.timeout ?? 5000 });
    return true;
  } catch (error: any) {
    log('Fill failed, trying alternative method', error.message);
    
    try {
      // Essayer avec evaluate
      await locator.evaluate((el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, text);
      log('Fill succeeded with evaluate()');
      return true;
    } catch (evaluateError: any) {
      log('Fill failed even with evaluate()', evaluateError.message);
      return false;
    }
  }
}

/**
 * Vérifie qu'un élément existe dans le DOM avec logging
 * 
 * @param locator - Le locator Playwright
 * @param options - Options de vérification
 * @returns true si l'élément existe, false sinon
 */
export async function safeExists(
  locator: ReturnType<Page['locator']>,
  options?: {
    timeout?: number;
    log?: ReturnType<typeof createLogger>;
  }
): Promise<boolean> {
  const log = options?.log || createLogger('safeExists');
  
  try {
    const count = await locator.count();
    return count > 0;
  } catch (error: any) {
    log('count() check failed', error.message);
    return false;
  }
}

/**
 * Récupère le texte d'un élément avec gestion d'erreurs
 * 
 * @param locator - Le locator Playwright
 * @param options - Options
 * @returns Le texte ou null si erreur
 */
export async function safeTextContent(
  locator: ReturnType<Page['locator']>,
  options?: {
    timeout?: number;
    log?: ReturnType<typeof createLogger>;
  }
): Promise<string | null> {
  const log = options?.log || createLogger('safeTextContent');
  
  try {
    return await locator.textContent({ timeout: options?.timeout ?? 5000 });
  } catch (error: any) {
    log('textContent() failed', error.message);
    return null;
  }
}

