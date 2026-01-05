import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./utils";
import {
  waitForNetworkIdle,
  waitForReactStable,
  waitForElementReady,
} from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";

/**
 * Tests E2E pour la documentation en mode PRODUCTION (avec base path /)
 *
 * Ces tests simulent l'environnement GitHub Pages où l'app est servie depuis /
 *
 * Pour tester localement:
 * 1. Build production: npm run build
 * 2. Serve avec base path: npx serve dist -s -p 4173 --listen
 * 3. Configurer Playwright pour utiliser http://localhost:4173/ comme baseURL
 *
 * OU utiliser le script: npm run test:docs:production
 */

test.describe("Documentation - Production Build Tests", () => {
  // Ces tests nécessitent un serveur de production avec base path
  // Ils sont skippés par défaut et doivent être exécutés manuellement
  // avec: npx playwright test docs-production.spec.ts --project=chromium

  test.skip("Documentation works with production base path / @production", async ({
    page,
    browserName,
  }) => {
    const guard = attachConsoleGuard(page, {
      allowlist: [
        /Importing a module script failed\./i,
        /error loading dynamically imported module/i,
      ],
    });

    try {
      // Simuler l'environnement GitHub Pages avec base path
      const basePath = "/DooDates";

      const timeouts = getTimeouts(browserName);
      // Naviguer vers la documentation avec le base path
      await page.goto(`${basePath}/docs`, { waitUntil: "domcontentloaded" });

      // Attendre que la page soit complètement chargée
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network }).catch(() => {});
      await waitForReactStable(page, { browserName });

      // Vérifier que l'URL contient le base path
      await expect(page).toHaveURL(new RegExp(`.*${basePath}/docs`));

      // Vérifier que le contenu est visible
      const content = page
        .getByText(/Documentation DooDates/i)
        .or(page.getByText(/Bienvenue dans la documentation/i));
      await waitForElementReady(
        page,
        "text=/Documentation DooDates/i, text=/Bienvenue dans la documentation/i",
        { browserName, timeout: timeouts.element },
      );

      // Vérifier qu'il n'y a pas d'erreurs 404 pour les assets
      const failedRequests: string[] = [];
      page.on("response", (response) => {
        if (response.status() >= 400) {
          failedRequests.push(`${response.url()} - ${response.status()}`);
        }
      });

      // Naviguer vers un document spécifique
      await page.goto(`${basePath}/docs/01-Guide-Demarrage-Rapide`, {
        waitUntil: "domcontentloaded",
      });
      await waitForNetworkIdle(page, { browserName, timeout: timeouts.network });

      // Vérifier qu'il n'y a pas d'erreurs 404 pour les assets JS/CSS
      const asset404s = failedRequests.filter(
        (req) => (req.includes(".js") || req.includes(".css")) && !req.includes("non-existent"),
      );

      if (asset404s.length > 0) {
        console.error("Erreurs 404 pour les assets:", asset404s);
        throw new Error(`Assets non trouvés: ${asset404s.join(", ")}`);
      }

      // Vérifier que le document se charge
      const loader = page.locator("[class*='animate-spin']");
      await loader.waitFor({ state: "hidden", timeout: timeouts.element }).catch(() => {});

      const docContent = await waitForElementReady(
        page,
        '.docs-content, .prose, [class*="prose"]',
        { browserName, timeout: timeouts.element },
      );
      await expect(docContent.first()).toBeVisible();

      await guard.assertClean();
    } finally {
      guard.stop();
    }
  });
});
