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
