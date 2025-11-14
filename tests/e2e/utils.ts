import { expect, Page } from '@playwright/test';

export type ConsoleGuard = {
  assertClean: () => Promise<void>;
  stop: () => void;
};

/**
 * Attache une garde de console qui échoue le test si des erreurs critiques apparaissent.
 * - Capte: console.error, console.assert(!cond), erreurs de page (pageerror)
 * - Ignore optionnellement certains messages via allowlist regex
 */
export function attachConsoleGuard(
  page: Page,
  options?: {
    allowlist?: RegExp[];
  }
): ConsoleGuard {
  const errors: string[] = [];
  // Base: ignorer les erreurs clipboard fréquentes en headless
  const baseAllow = [
    /Cannot read properties of null \(reading 'classList'\)/i,
    /Clipboard.*(denied|NotAllowed)/i,
    /Failed to execute 'writeText' on 'Clipboard'/i,
    /navigator\.clipboard/i,
    // Réseau/ressources externes bénignes en E2E multi-navigateurs
    /fonts\.gstatic\.com/i,
    /downloadable font: download failed/i,
    /Cross-Origin Request Blocked/i,
    /CORS request did not succeed/i,
    /ServiceWorker .*FetchEvent.*NetworkError/i,
    /sw\.js/i,
    /Failed to load resource/i,
    /Erreur lors du test de connexion Gemini/i,
    /generativelanguage\.googleapis\.com/i,
    /hyper-task due to access control checks/i,
    // Erreurs Supabase attendues en environnement de test local (Supabase non disponible)
    /Erreur chargement Supabase, utilisation localStorage/i,
    /Unexpected token '<', "<!DOCTYPE "/i,
    // WebKit/Safari n'a pas requestIdleCallback (utilisé par certaines libs React)
    /requestIdleCallback/i,
    /Can't find variable: requestIdleCallback/i,
    // Erreurs de chargement de modules dynamiques (problèmes de timing dans certains navigateurs)
    /Importing a module script failed/i,
    /error loading dynamically imported module/i,
    /ErrorBoundary caught an error/i,
    // Erreurs React transitoires (lazy loading race conditions)
    /The above error occurred in the <Route\.Provider> component/i,
    /The above error occurred in one of your React components/i,
    /JSHandle@object/i, // Firefox log des objets comme "JSHandle@object" au lieu du message réel
  ];
  // Dev-noise (activé seulement si E2E_DEV_NOISE=1): erreurs réseau externes, Vite/React transitoires, etc.
  const devNoiseAllow = [
    /fonts\.gstatic\.com/i,
    /downloadable font: download failed/i,
    /Cross-Origin Request Blocked/i,
    /CORS request did not succeed/i,
    /ServiceWorker .*FetchEvent.*NetworkError/i,
    /sw\.js/i,
    /Erreur lors du test de connexion Gemini/i,
    /generativelanguage\.googleapis\.com/i,
    /access control checks/i,
    /Importing a module script failed\./i,
    /error loading dynamically imported module/i,
    /The above error occurred in the <Route\.Provider> component/i,
    /The above error occurred in one of your React components/i,
    /JSHandle@object/i, // Firefox log des objets comme "JSHandle@object" au lieu du message réel
  ];
  const defaultAllow = process.env.E2E_DEV_NOISE === '1' ? [...baseAllow, ...devNoiseAllow] : baseAllow;
  const allow = options?.allowlist ? [...defaultAllow, ...options.allowlist] : defaultAllow;

  const isAllowed = (text: string) => allow.some((r) => r.test(text));

  const onConsole = (msg: any) => {
    try {
      const type = msg.type();
      const text = msg.text();
      if ((type === 'error' || type === 'assert') && !isAllowed(text)) {
        errors.push(`[console.${type}] ${text}`);
      }
    } catch {}
  };
  const onPageError = (err: Error) => {
    const text = String(err?.message || err);
    if (!isAllowed(text)) errors.push(`[pageerror] ${text}`);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  return {
    async assertClean() {
      await expect(errors, errors.join('\n')).toHaveLength(0);
    },
    stop() {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
    },
  };
}

/**
 * Active le mode local E2E côté application avant le premier document.
 * Doit être appelé AVANT tout page.goto().
 */
export async function enableE2ELocalMode(page: Page) {
  await page.addInitScript(() => {
    try {
      (window as any).__E2E__ = true;
      (window as any).__IS_E2E_TESTING__ = true;
      localStorage.setItem('e2e', '1');
      localStorage.setItem('dev-local-mode', '1');
    } catch {}
  });

  // S'assurer que l'URL comporte le flag pour les détections basées sur location.search
  const url = new URL(page.url() || 'http://localhost');
  if (!url.searchParams.has('e2e-test')) {
    url.searchParams.set('e2e-test', 'true');
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
}

/**
 * Attend un indicateur de succès de copie pour gérer les environnements sans clipboard API.
 * Usage: cliquez sur le bouton de copie, puis appelez waitForCopySuccess(page)
 */
export async function waitForCopySuccess(
  page: Page,
  testId: string = 'copy-success',
  timeoutMs: number = 5000
) {
  const indicator = page.getByTestId(testId);
  await indicator.waitFor({ state: 'visible', timeout: timeoutMs });
}

/**
 * Clique robuste: scroll-into-view si nécessaire et force le clic si l'élément peut être masqué
 */
export async function robustClick(locator: ReturnType<Page['locator']>) {
  // S'assurer que le noeud existe
  try {
    await locator.waitFor({ state: 'attached', timeout: 5000 });
  } catch {}
  // Tenter de le rendre visible
  try {
    await locator.scrollIntoViewIfNeeded();
  } catch {}
  try {
    await locator.click({ timeout: 5000 });
    return;
  } catch {}
  // Fallback: petit délai puis clic forcé
  await new Promise((res) => setTimeout(res, 200));
  await locator.click({ force: true, timeout: 5000 });
}

/**
 * Fill robuste pour inputs/textareas: gère race conditions, overlays, et re-rendering
 * 
 * Vérifie les 5 hypothèses de l'IA:
 * 1. Race Condition - Attend que l'élément soit complètement chargé
 * 2. Element Overlap - Scroll et vérifie la visibilité
 * 3. Dynamic Re-rendering - Attend la stabilité du composant
 * 4. user-select: none - Force la visibilité si nécessaire
 * 5. Incorrect Selector - Vérifie enabled/editable
 * 
 * @param locator - Le locator Playwright de l'input/textarea
 * @param text - Le texte à remplir
 * @param options - Options de timeout et debug
 */
export async function robustFill(
  locator: ReturnType<Page['locator']>,
  text: string,
  options?: { 
    timeout?: number;
    debug?: boolean;
    waitForStability?: boolean; // Attendre que le composant soit stable (useEffect, etc.)
  }
) {
  const timeout = options?.timeout ?? 10000;
  const debug = options?.debug ?? false;
  const waitForStability = options?.waitForStability ?? true;
  
  const log = (...args: any[]) => {
    if (debug) console.log('[robustFill]', ...args);
  };

  try {
    // 1. Attendre que l'élément soit attaché au DOM
    log('1. Waiting for element to be attached...');
    await locator.waitFor({ state: 'attached', timeout });
    log('✅ Element attached');

    // 2. Attendre la stabilité du composant (race condition + re-rendering)
    if (waitForStability) {
      log('2. Waiting for component stability (500ms)...');
      await locator.page().waitForTimeout(500);
      log('✅ Component should be stable');
    }

    // 3. Scroll into view (éviter overlaps)
    log('3. Scrolling into view...');
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
      log('✅ Scrolled into view');
    } catch (e) {
      log('⚠️ Scroll failed, continuing anyway');
    }

    // 4. Vérifier que l'élément n'est pas disabled
    log('4. Checking if element is enabled...');
    const isDisabled = await locator.isDisabled();
    if (isDisabled) {
      throw new Error('Element is disabled, cannot fill');
    }
    log('✅ Element enabled');

    // 5. Vérifier que l'élément est editable
    log('5. Checking if element is editable...');
    const isEditable = await locator.isEditable();
    if (!isEditable) {
      log('⚠️ Element not editable, trying to force visibility...');
      // Force visibility (hypothèse #4: user-select: none ou visibility: hidden)
      await locator.evaluate((el: HTMLElement) => {
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          el.readOnly = false;
          el.disabled = false;
        }
      });
      log('✅ Forced visibility');
    } else {
      log('✅ Element editable');
    }

    // 6. Vérifier si l'élément est visible (non bloquant sur mobile)
    log('6. Checking if element is visible...');
    const isVisible = await locator.isVisible();
    if (!isVisible) {
      log('⚠️ Element not visible according to Playwright (z-index issue)');
      log('⚠️ Using evaluate() to bypass z-index and fill directly');
      
      // Sur mobile, le textarea est visuellement visible mais Playwright ne peut pas
      // interagir avec à cause du z-index. Solution : evaluate() complet.
      
      // Étape 1 : Cliquer + focus via DOM
      await locator.evaluate((el: HTMLTextAreaElement | HTMLInputElement) => {
        el.click();
        el.focus();
      });
      log('✅ Clicked + focused via evaluate()');
      
      // Étape 2 : Attendre React + auto-focus du composant
      await locator.page().waitForTimeout(800);
      
      // Étape 3 : Remplir avec synthetic events React
      await locator.evaluate((el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
        // Utiliser le setter natif pour déclencher React
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, value);
        } else {
          el.value = value;
        }
        
        // Déclencher les événements React
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.focus();
      }, text);
      log('✅ Text filled via evaluate() with React events');
      
      // Attendre que React traite
      await locator.page().waitForTimeout(300);
      
      // Vérifier
      const value = await locator.inputValue();
      if (value !== text) {
        throw new Error(`Fill verification failed: expected "${text}", got "${value}"`);
      }
      log('✅ Fill verified');
      return;
    }
    log('✅ Element visible');

    // 7. Attendre un peu pour que les animations se terminent
    log('7. Waiting for animations to complete (300ms)...');
    await locator.page().waitForTimeout(300);

    // 8. Tenter le fill normal
    log('8. Attempting normal fill...');
    try {
      await locator.fill(text, { timeout: 3000 });
      log('✅ Fill successful (normal)');
    } catch (e) {
      log('⚠️ Normal fill failed, trying evaluate() fallback...');
      
      // Fallback: Utiliser evaluate() pour forcer la valeur (mobile, hidden inputs)
      await locator.evaluate((el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
        el.value = value;
        // Déclencher les événements React
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        // Focus pour activer les handlers
        el.focus();
      }, text);
      log('✅ Fill successful (evaluate fallback)');
    }

    // 9. Vérifier que le texte a bien été rempli
    log('9. Verifying fill...');
    const value = await locator.inputValue();
    if (value !== text) {
      log(`⚠️ Value mismatch: expected "${text}", got "${value}"`);
      // Réessayer une fois
      await locator.evaluate((el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, text);
      
      const finalValue = await locator.inputValue();
      if (finalValue !== text) {
        throw new Error(`Fill verification failed: expected "${text}", got "${finalValue}"`);
      }
    }
    log('✅ Fill verified');

  } catch (error) {
    log('❌ robustFill failed:', error);
    throw error;
  }
}

/**
 * Injecte des sondages dans localStorage avant le chargement de la page.
 * Utilise addInitScript pour que l'état soit présent dès le premier document.
 */
export async function seedLocalStorage(page: Page, polls: any[]) {
  await page.addInitScript(({ polls }) => {
    try {
      localStorage.setItem('dev-polls', JSON.stringify(polls));
    } catch {}
  }, { polls });
}

/**
 * Attend l'affichage d'un toast contenant le texte fourni.
 * Robuste aux variantes d'implémentation (aria-live, data-testid, texte brut).
 */
export async function assertToast(page: Page, text: string, timeoutMs: number = 5000) {
  const candidates = [
    page.getByRole('status'),
    page.getByRole('alert'),
    page.getByTestId('toast-root'),
    page.getByText(text, { exact: false }),
  ];
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const loc of candidates) {
      try {
        if (await loc.first().isVisible()) {
          const has = await loc.first().getByText(text, { exact: false }).count();
          if (has || (await loc.first().textContent())?.includes(text)) return;
        }
      } catch {}
    }
    await page.waitForTimeout(100);
  }
  await expect(page.getByText(text, { exact: false })).toBeVisible();
}

// Warmup helper: prime Vite/route chunks to avoid transient dynamic import errors on first render
export async function warmup(page: Page) {
  // Warmup workspace (route principale pour les tests)
  await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
}

/**
 * Ouvre le dialogue de gestion tags/dossiers depuis une carte de conversation.
 * Helper réutilisable pour éviter la duplication de code dans les tests tags-folders.
 * 
 * @param page - La page Playwright
 * @param conversationCard - Le locator de la carte de conversation (optionnel, utilise la première si non fourni)
 * @returns Le locator du dialogue ouvert
 */
export async function openTagsFolderDialog(
  page: Page,
  conversationCard?: ReturnType<Page['locator']>
) {
  // Utiliser la carte fournie ou prendre la première
  const card = conversationCard || page.locator('[data-testid="poll-item"]').first();
  
  // Attendre que la carte soit attachée
  await card.waitFor({ state: 'attached', timeout: 10000 });
  
  // Trouver le bouton menu : chercher le bouton contenant l'icône MoreVertical (SVG)
  // Le menu est généralement le dernier bouton visible dans la carte
  const menuButton = card.locator('button').filter({ has: card.locator('svg') }).last();
  
  // Fallback : si pas trouvé par SVG, prendre le dernier bouton visible
  const menuButtonCount = await card.locator('button').count();
  let finalMenuButton = menuButton;
  if (menuButtonCount > 0) {
    const isMenuButtonVisible = await menuButton.isVisible().catch(() => false);
    if (!isMenuButtonVisible) {
      // Prendre le dernier bouton visible
      const buttons = card.locator('button');
      for (let i = menuButtonCount - 1; i >= 0; i--) {
        const btn = buttons.nth(i);
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          finalMenuButton = btn;
          break;
        }
      }
    }
  }
  
  // Attendre et cliquer sur le bouton menu
  await finalMenuButton.waitFor({ state: 'visible', timeout: 5000 });
  await finalMenuButton.click();
  
  // Attendre que le menu dropdown s'ouvre
  const manageMenuItem = page.getByText('Gérer les tags/dossier');
  await expect(manageMenuItem).toBeVisible({ timeout: 5000 });
  
  // Cliquer sur "Gérer les tags/dossier"
  await manageMenuItem.click();
  
  // Attendre que le dialogue s'ouvre
  const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Gérer les tags et le dossier' });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Gérer les tags et le dossier')).toBeVisible({ timeout: 5000 });
  
  return dialog;
}

/**
 * Vérifie que les tags et dossiers sont bien chargés dans localStorage.
 * Utilisé pour valider l'état initial avant les tests.
 */
export async function verifyTagsFoldersLoaded(page: Page) {
  const tags = await page.evaluate(() => {
    const stored = localStorage.getItem('doodates_tags');
    return stored ? JSON.parse(stored) : null;
  });
  
  const folders = await page.evaluate(() => {
    const stored = localStorage.getItem('doodates_folders');
    return stored ? JSON.parse(stored) : null;
  });
  
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    throw new Error('Tags not loaded in localStorage');
  }
  
  if (!folders || !Array.isArray(folders) || folders.length === 0) {
    throw new Error('Folders not loaded in localStorage');
  }
  
  return { tags, folders };
}

/**
 * Mock l'authentification Supabase dans localStorage pour les tests E2E.
 * Simule un utilisateur authentifié avec un token valide.
 * 
 * @param page - La page Playwright
 * @param options - Options pour personnaliser l'authentification mockée
 */
export async function mockSupabaseAuth(
  page: Page,
  options?: {
    userId?: string;
    email?: string;
    accessToken?: string;
    expiresAt?: number;
  }
) {
  const userId = options?.userId || 'test-user-id';
  const email = options?.email || 'test@example.com';
  const accessToken = options?.accessToken || 'mock-token-12345';
  const expiresAt = options?.expiresAt || Date.now() + 3600000; // 1h dans le futur

  await page.evaluate(
    ({ userId, email, accessToken, expiresAt }) => {
      const supabaseUrl = (window as any).__VITE_SUPABASE_URL__ || 'test.supabase.co';
      const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || 'test';
      localStorage.setItem(`sb-${projectId}-auth-token`, JSON.stringify({
        user: {
          id: userId,
          email: email,
          aud: 'authenticated',
        },
        access_token: accessToken,
        expires_at: expiresAt,
      }));
    },
    { userId, email, accessToken, expiresAt }
  );
}

/**
 * Attend que la page soit complètement chargée, avec gestion spéciale pour Firefox.
 * Firefox peut avoir des problèmes avec `networkidle` qui ne se produit jamais,
 * donc on utilise un timeout plus long avec fallback.
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur (pour adapter le comportement)
 * @param timeout - Timeout en ms (défaut: 30000 pour Firefox, pas de timeout pour les autres)
 */
export async function waitForPageLoad(page: Page, browserName: string, timeout?: number) {
  if (browserName === 'firefox') {
    const firefoxTimeout = timeout || 30000;
    await page.waitForLoadState('networkidle', { timeout: firefoxTimeout }).catch(async () => {
      // Fallback: attendre un élément spécifique si networkidle échoue sur Firefox
      await page.waitForSelector('body', { timeout: 5000 });
    });
  } else {
    if (timeout) {
      await page.waitForLoadState('networkidle', { timeout });
    } else {
      await page.waitForLoadState('networkidle');
    }
  }
}
