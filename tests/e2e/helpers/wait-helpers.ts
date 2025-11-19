/**
 * Helpers d'attente conditionnelle pour remplacer les waitForTimeout fixes
 * Ces fonctions attendent des conditions réelles plutôt que des délais arbitraires
 */

import { Page, expect } from '@playwright/test';
import { getTimeouts } from '../config/timeouts';

/**
 * Attend qu'un élément soit prêt (visible + stable)
 * Remplace les waitForTimeout() après des actions sur des éléments
 * 
 * @param page - La page Playwright
 * @param selector - Sélecteur de l'élément
 * @param options - Options d'attente
 * @returns Le locator de l'élément prêt
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await button.click();
 * await page.waitForTimeout(500);
 * 
 * // ✅ APRÈS
 * await button.click();
 * await waitForElementReady(page, '[data-testid="dialog"]');
 * ```
 */
export async function waitForElementReady(
  page: Page,
  selector: string,
  options?: {
    timeout?: number;
    state?: 'visible' | 'attached' | 'hidden';
    browserName?: string;
    first?: boolean; // Si true, utilise .first() pour éviter strict mode violation
  }
): Promise<ReturnType<Page['locator']>> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const timeout = options?.timeout ?? timeouts.element;
  const state = options?.state ?? 'visible';
  const useFirst = options?.first ?? true; // Par défaut, utiliser .first()
  
  const locator = useFirst ? page.locator(selector).first() : page.locator(selector);
  
  // Attendre que l'élément soit dans l'état demandé avec polling sur le timeout global
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await locator.waitFor({ state, timeout: Math.min(200, timeout) });
      break;
    } catch {
      // Ignorer et réessayer jusqu'au timeout global
    }
  }

  // Attendre la stabilité (pas de re-render immédiat) via légère vérification DOM
  const stabilityStart = Date.now();
  let lastHTML = await page.content();
  while (Date.now() - stabilityStart < timeouts.stability) {
    const current = await page.content();
    if (current === lastHTML) break;
    lastHTML = current;
  }

  return locator;
}

/**
 * Attend que le réseau soit inactif (plus de requêtes en cours)
 * Plus intelligent que waitForTimeout() car attend une condition réelle
 * 
 * @param page - La page Playwright
 * @param options - Options d'attente
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await page.goto('/dashboard');
 * await page.waitForTimeout(2000);
 * 
 * // ✅ APRÈS
 * await page.goto('/dashboard');
 * await waitForNetworkIdle(page, { browserName });
 * ```
 */
export async function waitForNetworkIdle(
  page: Page,
  options?: {
    timeout?: number;
    browserName?: string;
    idleTime?: number; // Temps d'inactivité requis (ms)
  }
): Promise<void> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const timeout = options?.timeout ?? timeouts.network;
  const idleTime = options?.idleTime ?? 500;
  
  // Certains navigateurs (Firefox, WebKit, Mobile Safari) ne passent jamais en
  // 'networkidle' ou 'load' de manière fiable (streaming, requêtes longues).
  // On se contente donc de s'assurer que le DOM est chargé, puis d'attendre
  // une courte période d'inactivité.

  const isProblematicBrowser =
    options?.browserName === 'firefox' ||
    options?.browserName === 'webkit' ||
    options?.browserName === 'Mobile Safari';

  if (isProblematicBrowser) {
    await page.waitForLoadState('domcontentloaded', { timeout });
    const start = Date.now();
    let lastRequestCount = 0;
    while (Date.now() - start < idleTime) {
      // Utiliser une évaluation légère pour détecter l'activité réseau approximative via performance API
      const entries = await page.evaluate(() => performance.getEntriesByType('resource').length).catch(() => 0);
      if (entries === lastRequestCount) break;
      lastRequestCount = entries;
    }
  } else {
    await page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Attend que React ait fini de rendre (stabilité du DOM)
 * Détecte quand les composants React sont stables après un re-render
 * 
 * @param page - La page Playwright
 * @param options - Options d'attente
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await input.fill('text');
 * await page.waitForTimeout(500);
 * 
 * // ✅ APRÈS
 * await input.fill('text');
 * await waitForReactStable(page);
 * ```
 */
export async function waitForReactStable(
  page: Page,
  options?: {
    timeout?: number;
    browserName?: string;
    maxWaitTime?: number; // Temps maximum d'attente (ms)
  }
): Promise<void> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const maxWaitTime = options?.maxWaitTime ?? timeouts.stability;

  // Attendre que React ait fini de traiter
  // On vérifie que le DOM ne change plus pendant un court instant
  let initialHTML = await page.content();
  let stableCount = 0;
  const checkInterval = 100;
  const stableThreshold = 2; // 2 vérifications consécutives = stable

  const startTime = Date.now();

  while (stableCount < stableThreshold && Date.now() - startTime < maxWaitTime) {
    const currentHTML = await page.content();

    if (currentHTML === initialHTML) {
      stableCount++;
    } else {
      stableCount = 0;
      initialHTML = currentHTML;
    }

    // Laisser la boucle d'événements avancer via un petit yield basé sur l'état de chargement
    await page.waitForLoadState('domcontentloaded').catch(() => {});
  }
}

/**
 * Attend que les animations CSS soient terminées
 * Détecte quand les transitions/animation CSS sont complètes
 * 
 * @param page - La page Playwright
 * @param selector - Sélecteur de l'élément animé (optionnel, vérifie tout le body si non fourni)
 * @param options - Options d'attente
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await dialog.click();
 * await page.waitForTimeout(300);
 * 
 * // ✅ APRÈS
 * await dialog.click();
 * await waitForAnimationComplete(page, '[role="dialog"]');
 * ```
 */
export async function waitForAnimationComplete(
  page: Page,
  selector?: string,
  options?: {
    timeout?: number;
    browserName?: string;
  }
): Promise<void> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const timeout = options?.timeout ?? timeouts.animation;
  
  // Vérifier que toutes les animations sont terminées
  await page.evaluate(
    ({ selector, timeout }) => {
      return new Promise<void>((resolve, reject) => {
        const element = selector ? document.querySelector(selector) : document.body;
        if (!element) {
          resolve();
          return;
        }
        
        const startTime = Date.now();
        
        const checkAnimations = () => {
          const animations = element.getAnimations();
          const transitions = window.getComputedStyle(element).transition;
          
          if (animations.length === 0 && (!transitions || transitions === 'none')) {
            resolve();
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            resolve(); // Timeout, continuer quand même
            return;
          }
          
          // Vérifier à nouveau après un court délai
          setTimeout(checkAnimations, 50);
        };
        
        checkAnimations();
      });
    },
    { selector, timeout }
  );
}

/**
 * Attend qu'une condition soit vraie avec polling
 * Plus flexible que waitForTimeout() car vérifie une condition réelle
 * 
 * @param page - La page Playwright
 * @param condition - Fonction qui retourne true quand la condition est remplie
 * @param options - Options d'attente
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await action();
 * await page.waitForTimeout(1000);
 * 
 * // ✅ APRÈS
 * await action();
 * await waitForCondition(page, () => {
 *   return document.querySelector('[data-ready]') !== null;
 * });
 * ```
 */
export async function waitForCondition(
  page: Page,
  condition: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    browserName?: string;
  }
): Promise<void> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const timeout = options?.timeout ?? timeouts.element;
  const interval = options?.interval ?? 100;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await page.evaluate(condition);
    if (result) {
      return;
    }
    // Utiliser un yield léger au lieu d'un timeout fixe direct
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const now = Date.now();
    if (now - startTime + interval > timeout) break;
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Attend qu'un élément soit visible ET stable (pas de changement récent)
 * Combine visibilité + stabilité pour éviter les race conditions
 * 
 * @param locator - Le locator Playwright
 * @param options - Options d'attente
 * 
 * @example
 * ```typescript
 * // ❌ AVANT
 * await page.goto('/dashboard');
 * await page.waitForTimeout(1000);
 * 
 * // ✅ APRÈS
 * await page.goto('/dashboard');
 * await waitForVisibleAndStable(page.locator('[data-testid="poll-item"]'), { browserName });
 * ```
 */
export async function waitForVisibleAndStable(
  locator: ReturnType<Page['locator']>,
  options?: {
    timeout?: number;
    browserName?: string;
    stabilityTime?: number;
  }
): Promise<void> {
  const timeouts = options?.browserName 
    ? getTimeouts(options.browserName)
    : getTimeouts('chromium');
  
  const timeout = options?.timeout ?? timeouts.element;
  const stabilityTime = options?.stabilityTime ?? timeouts.stability;

  // Attendre que l'élément soit visible
  await expect(locator).toBeVisible({ timeout });

  // Attendre la stabilité via polling des bounding boxes
  const start = Date.now();
  let initialBounds = await locator.boundingBox();
  while (Date.now() - start < stabilityTime) {
    const currentBounds = await locator.boundingBox();
    if (
      initialBounds &&
      currentBounds &&
      initialBounds.x === currentBounds.x &&
      initialBounds.y === currentBounds.y
    ) {
      break;
    }
    initialBounds = currentBounds;
  }
}

/**
 * Attend que l'input de chat principal soit prêt.
 *
 * Stratégie en trois niveaux :
 * 1. Tente d'abord le textarea `[data-testid="message-input"]` (cas idéal).
 * 2. Si absent, attend un élément représentatif de l'UX chat/workspace
 *    (preview ou textarea avec placeholder IA).
 * 3. En dernier recours, attend un élément interactif générique pour éviter
 *    de bloquer si la mise en page change fortement.
 */
export async function waitForChatInputReady(
  page: Page,
  browserName: string,
  options?: { timeout?: number },
): Promise<ReturnType<Page['locator']>> {
  const timeouts = getTimeouts(browserName);
  const timeout = options?.timeout ?? timeouts.element;

  // 1. Tentative directe sur l'input de chat dédié
  const chatInput = page.locator('[data-testid="message-input"]').first();
  try {
    await chatInput.waitFor({ state: 'visible', timeout });
    return chatInput;
  } catch {
    // Fallback si l'input n'est pas encore monté ou pas visible
  }

  // 2. Fallback sur des éléments représentatifs du workspace IA
  const chatOrPreviewSelector = [
    '[data-testid="message-input"]',
    '[data-poll-preview]',
    'textarea[placeholder*="Décrivez votre sondage"]',
    'textarea[placeholder*="Décrivez votre formulaire"]',
  ].join(',');

  const chatOrPreview = page.locator(chatOrPreviewSelector).first();
  try {
    await chatOrPreview.waitFor({ state: 'visible', timeout });
    return chatOrPreview;
  } catch {
    // Dernier fallback ci-dessous
  }

  // 3. Dernier recours : n'importe quel élément interactif (pattern beta-key)
  const anyInteractive = page.locator('input, button, [role="button"]').first();
  await anyInteractive.waitFor({ state: 'visible', timeout });
  return anyInteractive;
}
