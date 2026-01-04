import { Page, BrowserContext } from "@playwright/test";

export const E2E_CONFIG = {
  // Active le mode E2E dans l'application
  async enableE2EMode(context: BrowserContext): Promise<void> {
    await context.addInitScript(async () => {
      // Attendre que le body soit disponible
      await new Promise<void>((resolve) => {
        const checkBody = () => {
          if (document && document.body) {
            document.body.classList.add("e2e-testing");
            resolve();
          } else {
            requestAnimationFrame(checkBody);
          }
        };
        checkBody();
      });

      // Définir le flag global pour les tests E2E
      (window as any).__IS_E2E_TESTING__ = true;

      // Forcer le mode développement pour désactiver certaines fonctionnalités en test
      if (typeof process !== "undefined" && process.env) {
        process.env.NODE_ENV = "test";
      }
    });
  },

  // Configure le contexte pour les tests E2E
  async setupE2EContext(context: BrowserContext): Promise<void> {
    // Activer le mode E2E
    await this.enableE2EMode(context);

    // Désactiver les animations pour des tests plus stables
    await context.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    });
  },

  // Configuration par défaut pour les tests E2E
  testSetup: {
    // Désactive les timeouts pour les tests lents
    timeout: 120000, // 2 minutes
    // Ignore les erreurs de console courantes dans les tests
    ignoreConsoleErrors: [
      /GoogleGenerativeAI/, // Erreurs de l'API Gemini
      /ResizeObserver/, // Erreurs courantes de redimensionnement
      /^The .*? API is not supported on this platform/, // APIs non supportées en test
    ],
  },
};

// Fonction utilitaire pour attendre que l'application soit prête
export async function waitForAppReady(page: Page): Promise<void> {
  // Attendre que l'application soit chargée
  await page.waitForFunction(
    () => document.readyState === "complete" && (window as any).__APP_READY__ === true,
  );

  // Attendre que les chargements initiaux soient terminés
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {}); // Petit délai supplémentaire
}

// Fonction pour désactiver les quotas en mode test
export async function disableQuotaChecks(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Désactive les vérifications de quota
    localStorage.setItem("e2e", "1");
    localStorage.setItem("dev-local-mode", "1");
  });
}
