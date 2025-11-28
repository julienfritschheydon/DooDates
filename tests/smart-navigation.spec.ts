/**
 * 🎭 Tests E2E Playwright - Navigation Intelligente
 * 
 * Test simple suivant le pattern des autres tests E2E qui fonctionnent
 */

import { test, expect } from "@playwright/test";
import { setupTestEnvironment } from "./e2e/helpers/test-setup";
import { withConsoleGuard } from "./e2e/utils";

test.describe("Navigation Intelligente - E2E", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Utiliser le même setup que les autres tests E2E
    await setupTestEnvironment(page, browserName, {
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: {
        enabled: true,
        allowlist: [
          /Importing a module script failed\./i,
          /error loading dynamically imported module/i,
          /The above error occurred in one of your React components/i,
          /The above error occurred in the .* component/i,
          /Erreur préchargement/i,
          /calendrier JSON/i,
          /TimeSlot Functions/i,
          /Sondage avec slug .* non trouvé/i,
          /DooDatesError/i,
          /\[vite\] Failed to reload.*\.css/i,
          /\[vite\] Failed to reload \/src\/index\.css/i,
          /vite.*reload.*css/i,
          /Can't find variable: requestIdleCallback/i,
          /requestIdleCallback is not defined/i,
          /Access to fetch.*has been blocked by CORS policy/i,
          /No 'Access-Control-Allow-Origin' header/i,
          /No dates selected for poll creation/i,
          /Erreur lors de la sauvegarde/i,
        ],
      },
      mocks: { gemini: true },
      navigation: { path: "/DooDates/dashboard" } // Commencer depuis dashboard
    });

    // Activer les logs de navigation spécifiques
    await page.evaluate(() => {
      localStorage.setItem("debug_smart_navigation", "true");
    });
  });

  test("Test simple - Navigation dashboard vers workspace", async ({ page }) => {
    await withConsoleGuard(page, async () => {
      // 1. Vérifier qu'on est sur le dashboard
      await expect(page.locator("body")).toBeVisible();
      
      // 2. Cliquer sur "Créer un nouveau formulaire"
      await page.locator('[data-testid="create-form-poll"]').click();
      
      // 3. Vérifier qu'on arrive dans le workspace
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      
      // 4. Vérifier les logs de navigation
      const logs = [];
      page.on("console", (msg) => {
        if (msg.text().includes("Smart navigation")) {
          logs.push(msg.text());
        }
      });
      
      // Attendre un peu pour les logs
      await page.waitForTimeout(1000);
      
      // Vérifier qu'il y a des logs de navigation
      expect(logs.length).toBeGreaterThan(0);
      
      console.log("✅ Test de navigation simple réussi");
    });
  });

  test("Test navigation - Dashboard vers date poll", async ({ page }) => {
    await withConsoleGuard(page, async () => {
      // 1. Cliquer sur "Créer un nouveau sondage"
      await page.locator('[data-testid="create-date-poll"]').click();
      
      // 2. Vérifier qu'on arrive dans le workspace pour les dates
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      
      console.log("✅ Test navigation date poll réussi");
    });
  });
});
