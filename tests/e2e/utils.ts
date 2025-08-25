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
  // Par défaut, ignorer les erreurs de presse-papiers fréquentes en headless
  const defaultAllow = [
    /Clipboard.*(denied|NotAllowed)/i,
    /Failed to execute 'writeText' on 'Clipboard'/i,
    /navigator\.clipboard/i,
    // Erreurs réseau externes non critiques (polices, CORS, SW) qui ne doivent pas faire échouer l'E2E
    /fonts\.gstatic\.com/i,
    /downloadable font: download failed/i,
    /Cross-Origin Request Blocked/i,
    /CORS request did not succeed/i,
    /ServiceWorker .*FetchEvent.*NetworkError/i,
    /sw\.js/i,
    // Test de connectivité Gemini (dev-only)
    /Erreur lors du test de connexion Gemini/i,
    /generativelanguage\.googleapis\.com/i,
    /access control checks/i,
    // WebKit + Vite dev sporadic module import error when navigating/tearing down
    /Importing a module script failed\./i,
  ];
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
