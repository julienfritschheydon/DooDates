/**
 * Helpers pour le setup initial des tests E2E
 * Factorise le code répétitif de beforeEach dans les tests
 */

import { Page } from "@playwright/test";
import { setupAllMocksWithoutNavigation, setupGeminiMock } from "../global-setup";
import {
  enableE2ELocalMode,
  waitForPageLoad,
  warmup,
  attachConsoleGuard,
  type ConsoleGuard,
  clearLocalStorage,
  waitForAppReady,
  getDefaultConsoleGuardAllowlist,
} from "../utils";

export interface TestSetupOptions {
  /** Nettoyer localStorage avant/après navigation */
  clearLocalStorage?: boolean | { beforeNavigation?: boolean; afterNavigation?: boolean };
  /** Activer le mode E2E local */
  enableE2ELocalMode?: boolean;
  /** Effectuer un warmup de la page */
  warmup?: boolean;
  /** Configuration du console guard */
  consoleGuard?: {
    enabled?: boolean;
    allowlist?: RegExp[];
  };
  /** Configuration de la navigation */
  navigation?: {
    path?: string;
    waitForReady?: boolean;
  };
  /** Configuration des mocks */
  mocks?: {
    gemini?: boolean;
    supabase?: boolean;
    all?: boolean;
  };
}

/**
 * Setup complet de l'environnement de test avec toutes les options configurables
 *
 * @param page - La page Playwright
 * @param browserName - Le nom du navigateur
 * @param options - Options de configuration
 * @returns Le console guard si activé, null sinon
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page, browserName }) => {
 *   const guard = await setupTestEnvironment(page, browserName, {
 *     clearLocalStorage: true,
 *     enableE2ELocalMode: true,
 *     warmup: true,
 *     consoleGuard: { enabled: true },
 *     navigation: { path: '/workspace', waitForReady: true },
 *     mocks: { all: true },
 *   });
 *
 *   try {
 *     // Test logic
 *   } finally {
 *     await guard?.assertClean();
 *     guard?.stop();
 *   }
 * });
 * ```
 */
export async function setupTestEnvironment(
  page: Page,
  browserName: string,
  options?: TestSetupOptions,
): Promise<ConsoleGuard | null> {
  // 1. Setup mocks (doit être fait AVANT toute navigation)
  // Forcer les mocks si E2E_FORCE_MOCKS=true (pour les hooks Git)
  if (process.env.E2E_FORCE_MOCKS === "true") {
    console.log("🔧 E2E_FORCE_MOCKS détecté - Activation des mocks Gemini");
    await setupGeminiMock(page);
  } else if (options?.mocks?.all) {
    await setupAllMocksWithoutNavigation(page);
  } else if (options?.mocks?.gemini) {
    await setupGeminiMock(page);
  }
  // Si aucun mock spécifié, ne pas en configurer (le test peut le faire lui-même)

  // 2. Enable E2E local mode (doit être fait AVANT toute navigation)
  if (options?.enableE2ELocalMode !== false) {
    await enableE2ELocalMode(page);
  }

  // 3. Clear localStorage avant navigation si demandé
  const clearLS = options?.clearLocalStorage;
  const clearBeforeNav =
    typeof clearLS === "object" ? clearLS.beforeNavigation !== false : clearLS === true;

  if (clearBeforeNav) {
    await clearLocalStorage(page, { beforeNavigation: true });
  }

  // 4. Navigate
  const path = options?.navigation?.path || "/workspace";
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPageLoad(page, browserName);

  // 5. Clear localStorage après navigation si demandé
  const clearAfterNav =
    typeof clearLS === "object" ? clearLS.afterNavigation !== false : clearLS === true;

  if (clearAfterNav && !clearBeforeNav) {
    await clearLocalStorage(page, { afterNavigation: true });
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForPageLoad(page, browserName);
  }

  // 6. Warmup
  if (options?.warmup) {
    await warmup(page);
  }

  // 7. Console guard
  let guard: ConsoleGuard | null = null;
  if (options?.consoleGuard?.enabled !== false) {
    const { getDefaultConsoleGuardAllowlist } = await import("../utils");
    guard = attachConsoleGuard(page, {
      allowlist: [
        ...getDefaultConsoleGuardAllowlist(),
        ...(options?.consoleGuard?.allowlist || []),
      ],
    });
  }

  // 8. Wait for app ready
  if (options?.navigation?.waitForReady !== false) {
    await waitForAppReady(page, path);
  }

  return guard;
}
