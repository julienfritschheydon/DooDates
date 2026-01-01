/**
 * Supabase Integration Tests
 *
 * Ce test utilise la page /diagnostic/supabase pour valider
 * l'intégration Supabase dans un environnement de production.
 *
 * Il vérifie:
 * - Connexion Supabase
 * - Authentification
 * - Opérations CRUD sur les tables principales
 */

import { test, expect } from "@playwright/test";

// Skip tous ces tests car ils nécessitent un setup Supabase spécifique
// TODO: Réactiver ces tests quand la page /diagnostic/supabase sera prête pour l'E2E
test.describe.skip("Supabase Integration", () => {
  test.setTimeout(60000); // 60s pour les opérations Supabase

  // Skip sur mobile jusqu'à ce que /diagnostic/supabase soit optimisé pour mobile
  test.skip(({ isMobile }) => isMobile, 'Diagnostic page not optimized for mobile yet');

  test("should have all Supabase tests passing", async ({ page }) => {
    // Naviguer vers la page de diagnostic (utilise baseURL de playwright.config.ts)
    await page.goto("//DooDates/diagnostic/supabase", {
      waitUntil: "networkidle",
    });

    // Attendre que tous les tests se terminent
    // Le premier test (Connexion) devrait se terminer rapidement
    await page.waitForSelector('[data-test-status="success"], [data-test-status="error"]', {
      timeout: 10000,
    });

    // Attendre que TOUS les tests soient terminés (pas de "pending")
    await page.waitForFunction(
      () => {
        const results = document.querySelectorAll('[data-test-status]');
        if (results.length === 0) return false;

        const allCompleted = Array.from(results).every((el) => {
          const status = el.getAttribute("data-test-status");
          return status === "success" || status === "error";
        });

        return allCompleted;
      },
      { timeout: 30000 },
    );

    // Récupérer tous les résultats de tests
    const testResults = await page.$$eval("[data-test-status]", (elements) =>
      elements.map((el) => ({
        name: el.getAttribute("data-test-name") || "Unknown",
        status: el.getAttribute("data-test-status"),
        message: el.textContent?.trim() || "",
      })),
    );

    console.log("📊 Résultats des tests Supabase:", testResults);

    // Vérifier qu'il y a au moins quelques tests
    expect(testResults.length).toBeGreaterThanOrEqual(5);

    // Compter les succès et échecs
    const successCount = testResults.filter((r) => r.status === "success").length;
    const errorCount = testResults.filter((r) => r.status === "error").length;

    console.log(`✅ Succès: ${successCount}/${testResults.length}`);
    console.log(`❌ Échecs: ${errorCount}/${testResults.length}`);

    // Les tests critiques doivent passer
    const criticalTests = [
      "1. Connexion Supabase",
      "2. Statut d'authentification",
      "3. Lecture table profiles",
    ];

    for (const testName of criticalTests) {
      const result = testResults.find((r) => r.name === testName);
      expect(result, `Test critique "${testName}" non trouvé`).toBeDefined();
      expect(result!.status, `Test critique "${testName}" a échoué: ${result!.message}`).toBe(
        "success",
      );
    }

    // Au moins 80% des tests doivent réussir
    const successRate = successCount / testResults.length;
    expect(successRate, `Taux de succès trop bas: ${(successRate * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(
      0.8,
    );

    // Si des tests échouent, afficher les détails
    if (errorCount > 0) {
      const errors = testResults.filter((r) => r.status === "error");
      console.warn("⚠️ Tests en échec:", errors);
    }
  });

  test("should not have timeout errors", async ({ page }) => {
    await page.goto("//DooDates/diagnostic/supabase", {
      waitUntil: "networkidle",
    });

    // Attendre la fin des tests
    await page.waitForFunction(
      () => {
        const results = document.querySelectorAll('[data-test-status]');
        if (results.length === 0) return false;
        return Array.from(results).every((el) => {
          const status = el.getAttribute("data-test-status");
          return status === "success" || status === "error";
        });
      },
      { timeout: 30000 },
    );

    // Vérifier qu'aucun test n'a de timeout
    const timeoutTests = await page.$$eval("[data-test-status]", (elements) =>
      elements
        .filter((el) => {
          const message = el.textContent || "";
          return message.includes("Timeout") || message.includes("timeout");
        })
        .map((el) => ({
          name: el.getAttribute("data-test-name"),
          message: el.textContent?.trim(),
        })),
    );

    expect(
      timeoutTests.length,
      `${timeoutTests.length} test(s) ont timeout: ${JSON.stringify(timeoutTests)}`,
    ).toBe(0);
  });

  test("should display test results in a readable format", async ({ page }) => {
    await page.goto("//DooDates/diagnostic/supabase");

    // Vérifier que la page a un titre
    await expect(page.locator("h1, h2").first()).toContainText("Supabase");

    // Vérifier qu'il y a des résultats de tests visibles
    const resultsVisible = await page.locator("[data-test-status]").count();
    expect(resultsVisible).toBeGreaterThan(0);

    // Vérifier que chaque test a un nom et un statut
    const testElements = await page.$$('[data-test-status]');
    for (const element of testElements) {
      const name = await element.getAttribute("data-test-name");
      const status = await element.getAttribute("data-test-status");

      expect(name).toBeTruthy();
      expect(status).toMatch(/^(pending|success|error)$/);
    }
  });
});

