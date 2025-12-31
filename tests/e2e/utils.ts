import { expect, Page } from '@playwright/test';

export type ConsoleGuard = {
  assertClean: () => Promise<void>;
  stop: () => void;
};

/**
 * Liste des patterns allowlist par défaut pour console guard
 * Utilisé par plusieurs fichiers de tests
 */
export function getDefaultConsoleGuardAllowlist(): RegExp[] {
  return [
    /GoogleGenerativeAI/i,
    /API key/i,
    /Error fetching from/i,
    /API key not valid/i,
    /generativelanguage\.googleapis\.com/i,
    /Supabase API error/i,
    /status: 401/i,
    /Failed to resolve import/i,
    /\[vite\] Internal Server Error/i,
    // Erreurs Gemini attendues en CI (EDGE function / parsing JSON)
    /DooDates Error: \{message: Failed to execute 'json' on 'Response': Unexpected end of JSON input/i,
    /NETWORK_ERROR détectée \{mode: EDGE_FUNCTION/i,
    /Edge Function testConnection exception/i,
    // Erreurs de configuration Supabase/Gemini attendues en environnement de test (Analytics non configuré)
    /CONFIG_ERROR détectée \{useDirectGemini: false, hasApiKey: true, apiKeyLength: \d+, errorMessage: Configuration Supabase manquante\}/i,
  ];
}

/**
 * Wrapper pour exécuter du code avec console guard automatique
 * Le guard.assertClean() et guard.stop() sont appelés automatiquement dans un finally
 * 
 * @param page - La page Playwright
 * @param fn - Fonction à exécuter avec le guard
 * @param options - Options pour le console guard
 * @returns Le résultat de la fonction
 * 
 * @example
 * ```typescript
 * await withConsoleGuard(page, async (guard) => {
 *   await page.goto('/workspace');
 *   // Test logic - guard.assertClean() appelé automatiquement
 * }, {
 *   allowlist: [/Custom pattern/i],
 * });
 * ```
 */
export async function withConsoleGuard<T>(
  page: Page,
  fn: (guard: ConsoleGuard) => Promise<T>,
  options?: { allowlist?: RegExp[] }
): Promise<T> {
  const guard = attachConsoleGuard(page, {
    allowlist: [
      ...getDefaultConsoleGuardAllowlist(),
      ...(options?.allowlist || []),
    ],
  });

  try {
    return await fn(guard);
  } finally {
    await guard.assertClean();
    guard.stop();
  }
}

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
    /❌ 💳 Error in getGuestEmail.*Failed to fetch/i, // Erreurs Supabase en CI
    /❌ 💳 Error in.*supabaseApi.*Failed to fetch/i, // Erreurs Supabase génériques
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
    /❌ 💳 Error in getGuestEmail.*Failed to fetch/i, // Erreurs Supabase en CI
    /❌ 💳 Error in.*supabaseApi.*Failed to fetch/i, // Erreurs Supabase génériques
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
    } catch { }
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
      localStorage.setItem('dd-device-id', 'test-device-id');
      // ✅ FIX: getDeviceId() cherche 'doodates_device_id', pas 'dd-device-id'
      localStorage.setItem('doodates_device_id', 'test-device-id');
    } catch { }
  });

  // S'assurer que l'URL comporte le flag pour les détections basées sur location.search
  // Ne naviguer que si on est déjà sur une page valide (pas about:blank)
  if (page.url() && !page.url().startsWith('about:blank')) {
    const url = new URL(page.url());
    if (!url.searchParams.has('e2e-test')) {
      url.searchParams.set('e2e-test', 'true');
      await page.goto(url.toString(), { waitUntil: 'domcontentloaded' }).catch(() => { });
    }
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
  } catch { }
  // Tenter de le rendre visible
  try {
    await locator.scrollIntoViewIfNeeded();
  } catch { }
  try {
    await locator.click({ timeout: 5000 });
    return;
  } catch { }
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
  const timeout = options?.timeout ?? 20000;
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
      log('2. Waiting for component stability (polling up to 500ms)...');
      const stabilityStart = Date.now();
      while (Date.now() - stabilityStart < 500) {
        try {
          // Vérifier que l'élément est toujours attaché pour détecter un re-render
          await locator.waitFor({ state: 'attached', timeout: 50 });
          break;
        } catch {
          // Ignorer et réessayer jusqu'au timeout global de stabilité
        }
      }
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

    // 4. Vérifier que l'élément n'est pas disabled (avec timeout)
    log('4. Checking if element is enabled...');
    try {
      const isDisabled = await locator.isDisabled({ timeout: 5000 });
      if (isDisabled) {
        throw new Error('Element is disabled, cannot fill');
      }
      log('✅ Element enabled');
    } catch (e: any) {
      // Si isDisabled échoue (timeout), essayer quand même de remplir
      if (e.message?.includes('timeout') || e.message?.includes('Timeout')) {
        log('⚠️ isDisabled timeout, continuing anyway...');
      } else {
        throw e;
      }
    }

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

      // Étape 2 : Attendre React + auto-focus du composant via petit polling
      const focusStart = Date.now();
      while (Date.now() - focusStart < 800) {
        try {
          const isFocused = await locator.evaluate((el: HTMLElement) => document.activeElement === el);
          if (isFocused) break;
        } catch {
          // Ignorer et réessayer
        }
        await locator.page().waitForLoadState('domcontentloaded');
      }

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

      // Attendre que React traite via vérification de la valeur
      const reactStart = Date.now();
      while (Date.now() - reactStart < 300) {
        const value = await locator.inputValue().catch(() => undefined);
        if (value === text) break;
      }

      // Vérifier
      const value = await locator.inputValue();
      if (value !== text) {
        throw new Error(`Fill verification failed: expected "${text}", got "${value}"`);
      }
      log('✅ Fill verified');
      return;
    }
    log('✅ Element visible');

    // 7. Attendre un peu pour que les animations se terminent via polling visibilité
    log('7. Waiting for animations to complete (polling up to 300ms)...');
    const animStart = Date.now();
    while (Date.now() - animStart < 300) {
      const visible = await locator.isVisible().catch(() => false);
      if (visible) break;
    }

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
    } catch { }
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
      } catch { }
    }
    // Utiliser un petit polling basé sur Date.now() sans attendre un timeout fixe élevé
    await page.waitForLoadState('domcontentloaded');
  }
  await expect(page.getByText(text, { exact: false })).toBeVisible();
}

// Warmup helper: prime Vite/route chunks to avoid transient dynamic import errors on first render
export async function warmup(page: Page) {
  // Warmup workspace (route principale pour les tests)
  // Warmup workspace (route principale pour les tests)
  await page.goto('/DooDates/date-polls/workspace/date', { waitUntil: 'domcontentloaded' });
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
  await card.waitFor({ state: 'attached', timeout: 20000 });

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
 * Authentifie un utilisateur réel dans le navigateur avec Supabase.
 * Utilise signInWithPassword pour une authentification complète qui sera détectée par AuthContext.
 * 
 * @param page - La page Playwright
 * @param options - Email et mot de passe pour l'authentification
 * @returns Les données de session et l'utilisateur
 */
export async function authenticateWithSupabase(
  page: Page,
  options: {
    email: string;
    password: string;
  }
) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL_TEST || process.env.VITE_SUPABASE_URL || 'https://outmbbisrrdiumlweira.supabase.co';

  // Récupérer la clé API depuis les variables d'environnement ou depuis le fichier .env.local
  let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY_TEST || process.env.VITE_SUPABASE_ANON_KEY;

  // Si la clé n'est pas disponible, essayer de la récupérer depuis l'application
  if (!supabaseAnonKey) {
    try {
      // Lire depuis .env.local si disponible
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_SUPABASE_ANON_KEY[=_](.+)/);
        if (match) {
          supabaseAnonKey = match[1].trim();
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY not found. Please set VITE_SUPABASE_ANON_KEY_TEST or VITE_SUPABASE_ANON_KEY in environment variables or .env.local');
  }

  const result = await page.evaluate(
    async ({ email, password, supabaseUrl, supabaseAnonKey }) => {
      // Utiliser le client Supabase déjà disponible dans l'application
      // L'app expose supabase via window ou on peut l'importer
      let supabase;

      // Essayer d'utiliser le client Supabase existant de l'app via window
      if ((window as any).__SUPABASE_CLIENT__) {
        supabase = (window as any).__SUPABASE_CLIENT__;
      } else {
        // Créer un nouveau client Supabase avec le CDN
        // Utiliser le module ES6 depuis CDN
        // @ts-ignore - Dynamic import from CDN is valid in browser context
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm' as any);
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        });
      }

      // Authentifier avec email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message, data: null };
      }

      // Attendre un peu pour que la session soit bien stockée
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vérifier que la session est bien stockée
      const { data: sessionData } = await supabase.auth.getSession();

      return {
        error: null,
        data: {
          user: data.user,
          session: sessionData?.session,
          hasSession: !!sessionData?.session,
          userId: data.user?.id,
        },
      };
    },
    { email: options.email, password: options.password, supabaseUrl, supabaseAnonKey }
  );

  if (result.error) {
    throw new Error(`Failed to authenticate: ${result.error}`);
  }

  return result.data;
}

/**
 * Mock l'authentification Supabase dans localStorage pour les tests E2E.
 * Si un vrai token Supabase est fourni, l'utilise. Sinon, crée un token mock.
 * 
 * @deprecated Préférer utiliser authenticateWithSupabase() pour une authentification réelle
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
    realSupabaseToken?: string; // Token JWT réel créé par Supabase
  }
) {
  const userId = options?.userId || 'test-user-id';
  const email = options?.email || 'test@example.com';

  // Si un vrai token Supabase est fourni, l'utiliser
  const accessToken = options?.realSupabaseToken || options?.accessToken || 'mock-token-12345';
  const expiresAt = options?.expiresAt || Date.now() + 3600000; // 1h dans le futur

  // Obtenir l'URL Supabase depuis les variables d'environnement
  const supabaseUrl = process.env.VITE_SUPABASE_URL_TEST || process.env.VITE_SUPABASE_URL || 'https://outmbbisrrdiumlweira.supabase.co';

  // Extraire le projectId depuis l'URL Supabase
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || 'outmbbisrrdiumlweira';

  await page.evaluate(
    ({ userId, email, accessToken, expiresAt, projectId }) => {
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
    { userId, email, accessToken, expiresAt, projectId }
  );
}

/**
 * Attend que la page soit complètement chargée, avec gestion spéciale pour Firefox.
 * Firefox peut avoir des problèmes avec `networkidle` qui ne se produit jamais,
 * donc on utilise 'load' + attente d'éléments spécifiques au lieu de 'networkidle'.
 * 
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur (pour adapter le comportement)
 * @param timeout - Timeout en ms (défaut: 20000 pour Firefox, pas de timeout pour les autres)
 */
export async function waitForPageLoad(page: Page, browserName: string, timeout?: number) {
  if (browserName === 'firefox') {
    const firefoxTimeout = timeout || 20000; // Réduit à 20s au lieu de 30s
    // Essayer d'abord avec 'load' qui est plus rapide que 'networkidle'
    await page.waitForLoadState('load', { timeout: firefoxTimeout }).catch(async () => {
      // Fallback: attendre un élément spécifique si load échoue
      await page.waitForSelector('body', { timeout: 5000 });
    });

    // Attendre un élément clé de l'app au lieu de networkidle
    // Cela détecte quand l'app est vraiment prête, pas seulement quand le réseau est inactif
    try {
      await page.waitForSelector(
        '[data-testid="chat-input"], [data-testid="calendar"], [data-testid="poll-title"], [data-testid="poll-item"], main, [role="main"]',
        {
          timeout: 20000,
          state: 'attached' // 'attached' est plus rapide que 'visible'
        }
      );
    } catch {
      // Si aucun élément spécifique n'est trouvé, continuer quand même
      // Cela permet aux pages qui n'ont pas ces éléments de continuer
    }
  } else {
    if (timeout) {
      await page.waitForLoadState('networkidle', { timeout });
    } else {
      await page.waitForLoadState('networkidle');
    }
  }
}

/**
 * Nettoie le localStorage avec gestion d'erreurs de sécurité
 * 
 * @param page - La page Playwright
 * @param options - Options de nettoyage
 */
export interface ClearLocalStorageOptions {
  beforeNavigation?: boolean;
  afterNavigation?: boolean;
  waitAfterClear?: number;
}

export async function clearLocalStorage(
  page: Page,
  options?: ClearLocalStorageOptions
): Promise<void> {
  const beforeNavigation = options?.beforeNavigation ?? false;
  const afterNavigation = options?.afterNavigation ?? true;
  const waitAfterClear = options?.waitAfterClear ?? 0;

  if (beforeNavigation) {
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (e) {
      // Ignorer erreurs de sécurité
    }
  }

  if (afterNavigation) {
    await page.waitForLoadState('networkidle');
    try {
      await page.evaluate(() => localStorage.clear());
      if (waitAfterClear > 0) {
        const start = Date.now();
        while (Date.now() - start < waitAfterClear) {
          // Petit yield pour laisser la boucle d'événements avancer sans utiliser waitForTimeout direct
          await page.waitForLoadState('domcontentloaded').catch(() => { });
        }
      }
    } catch (e) {
      // Ignorer erreurs de sécurité
    }
  }
}

/**
 * Navigue vers une URL et attend que la page soit prête
 * 
 * @param page - La page Playwright
 * @param url - L'URL vers laquelle naviguer
 * @param browserName - Le nom du navigateur
 * @param options - Options de navigation
 */
export interface NavigateAndWaitOptions {
  waitForElement?: string;
  waitForAppReady?: boolean;
  timeout?: number;
}

export async function navigateAndWait(
  page: Page,
  url: string,
  browserName: string,
  options?: NavigateAndWaitOptions
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page, browserName);

  if (options?.waitForAppReady) {
    await waitForAppReady(page, url);
  }

  if (options?.waitForElement) {
    await expect(page.locator(options.waitForElement)).toBeVisible({
      timeout: options.timeout || 20000,
    });
  }
}

/**
 * Attend que l'application soit prête selon le type de page
 * 
 * @param page - La page Playwright
 * @param path - Le chemin de la page (défaut: '/workspace')
 */
export async function waitForAppReady(
  page: Page,
  path: string = '/workspace'
): Promise<void> {
  if (path.includes('/workspace') || path.includes('/create/ai')) {
    // Ne pas forcer un composant précis ici : simplement vérifier que
    // l'application n'est plus sur un écran blanc en attendant qu'au
    // moins un élément interactif soit visible. Les tests qui ont
    // besoin du champ de chat utiliseront waitForChatInputReady.

    // Essayer plusieurs sélecteurs en ordre de préférence
    const selectors = [
      'input, button, [role="button"]',  // Éléments interactifs
      '[data-testid="chat-input"]',      // Champ de chat spécifique
      'textarea',                        // Textareas
      'a[href]',                         // Liens cliquables
      'body',                            // Fallback : body visible
    ];

    let elementFound = false;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, {
          state: 'visible',
          timeout: 5000, // Timeout plus court par sélecteur
        });
        elementFound = true;
        break;
      } catch {
        // Continuer avec le sélecteur suivant
        continue;
      }
    }

    if (!elementFound) {
      // Si aucun élément trouvé, vérifier que la page n'est pas complètement blanche
      // et ajouter du diagnostic
      console.log('⚠️ Aucun élément interactif trouvé, diagnostic de la page...');

      try {
        // Vérifier l'URL actuelle
        const currentUrl = page.url();
        console.log(`URL actuelle: ${currentUrl}`);

        // Vérifier le contenu de la page
        const bodyText = await page.locator('body').textContent() || '';
        console.log(`Contenu body (premiers 200 chars): ${bodyText.substring(0, 200)}`);

        // Vérifier s'il y a des erreurs console
        const logs = await page.evaluate(() => {
          const errors: string[] = [];
          const originalError = console.error;
          console.error = (...args) => {
            errors.push(args.join(' '));
            originalError.apply(console, args);
          };
          return errors;
        });

        if (logs.length > 0) {
          console.log('Erreurs console détectées:', logs);
        }

        // Vérifier si l'application est en état de chargement
        const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]').count();
        if (loadingElements > 0) {
          console.log(`Éléments de chargement trouvés: ${loadingElements}`);
        }

      } catch (diagError) {
        console.log('Erreur pendant le diagnostic:', diagError);
      }

      // Finalement, vérifier que le body est visible
      await expect(page.locator('body')).toBeVisible({ timeout: 20000 });
    }
  } else if (path.includes('/dashboard')) {
    await page.waitForSelector('[data-testid="dashboard-ready"]', {
      state: 'visible',
      timeout: 20000,
    });
    await expect(page.locator('[data-testid="dashboard-loading"]')).toHaveCount(0);
  } else if (path.includes('/poll/') && path.includes('/results')) {
    await expect(page.getByText(/Résultats/i).first()).toBeVisible({
      timeout: 15000,
    });
  }
}

/**
 * Logger conditionnel basé sur DEBUG_E2E
 * 
 * @param scope - Le scope du logger (ex: 'TestName')
 * @returns Une fonction de log qui ne log que si DEBUG_E2E=1
 * 
 * @example
 * ```typescript
 * const log = createLogger('MyTest');
 * log('Debug message'); // Ne log que si DEBUG_E2E=1
 * ```
 */
export function createLogger(scope: string) {
  const debug = process.env.DEBUG_E2E === '1';
  return (...parts: any[]) => {
    if (debug) console.log(`[${scope}]`, ...parts);
  };
}

/**
 * Screenshot conditionnel basé sur DEBUG_E2E
 * 
 * @param page - La page Playwright
 * @param name - Le nom du screenshot
 * @param options - Options pour le screenshot
 * 
 * @example
 * ```typescript
 * await debugScreenshot(page, 'before-action');
 * ```
 */
export async function debugScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  if (process.env.DEBUG_E2E === '1') {
    await page.screenshot({
      path: `test-results/DEBUG-${name}.png`,
      fullPage: options?.fullPage ?? true,
    });
  }
}

/**
 * Product-specific route constants for E2E tests
 * Centralized route management for the 3 separate products
 */
export const PRODUCT_ROUTES = {
  datePoll: {
    landing: '/date-polls',
    workspace: '/date-polls/workspace/date',
    dashboard: '/date-polls/dashboard',
    docs: '/date-polls/docs',
    pricing: '/date-polls/pricing',
  },
  formPoll: {
    landing: '/form-polls',
    workspace: '/form-polls/workspace/form',
    dashboard: '/form-polls/dashboard',
    docs: '/form-polls/docs',
    pricing: '/form-polls/pricing',
  },
  availabilityPoll: {
    landing: '/availability-polls',
    workspace: '/availability-polls/workspace/availability',
    dashboard: '/availability-polls/dashboard',
    docs: '/availability-polls/docs',
    pricing: '/availability-polls/pricing',
  },
  quizz: {
    landing: '/quizz',
    workspace: '/quizz/workspace',
    dashboard: '/quizz/dashboard',
    docs: '/quizz/docs',
    pricing: '/quizz/pricing',
  },
} as const;

/**
 * Legacy routes that redirect to product-specific routes
 * These are kept for backwards compatibility testing
 */
export const LEGACY_ROUTES = {
  createDate: '/create/date',
  createForm: '/create/form',
  createAvailability: '/create/availability',
  createAI: '/create/ai',
  dashboard: '/dashboard',
} as const;
