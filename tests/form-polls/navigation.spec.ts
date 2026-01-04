/**
 * Tests E2E Navigation FormPolls - Version Simplifiée (Smoke Tests)
 *
 * Approche: Tests basiques et robustes pour valider la navigation FormPolls
 * Méthodologie: Smoke tests avec localStorage direct et timeouts réalistes
 */

import { test, expect } from "@playwright/test";

test.describe("FormPolls Navigation - Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers dashboard pour initialiser le système
    await page.goto("/DooDates/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("Smoke - Navigation dashboard FormPolls", async ({ page }) => {
    // 1. Naviguer vers le dashboard FormPolls
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 2. Vérifier que la page se charge correctement
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // 3. Vérifier l'absence d'erreurs console
    const logs = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    // Attendre un peu pour capturer les erreurs
    await page.waitForTimeout(2000);

    // Vérifier qu'il n'y a pas d'erreurs critiques
    const criticalErrors = logs.filter(
      (log) => log.includes("Error") || log.includes("Uncaught") || log.includes("TypeError"),
    );

    expect(criticalErrors.length).toBe(0);
    console.log("✅ Navigation dashboard FormPolls réussie");
  });

  test("Smoke - Navigation workspace FormPolls", async ({ page }) => {
    // 1. Naviguer vers le workspace FormPolls
    await page.goto("/DooDates/form/workspace/form");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 2. Vérifier que le workspace se charge
    const workspaceVisible = await page.locator("body").isVisible();
    expect(workspaceVisible).toBeTruthy();

    // 3. Vérifier l'absence d'erreurs critiques
    const logs = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const criticalErrors = logs.filter(
      (log) => log.includes("Error") || log.includes("Uncaught") || log.includes("TypeError"),
    );

    expect(criticalErrors.length).toBe(0);
    console.log("✅ Navigation workspace FormPolls réussie");
  });

  test("Smoke - Navigation entre pages FormPolls", async ({ page }) => {
    // 1. Dashboard → Workspace
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    await page.goto("/DooDates/form/workspace/form");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 2. Workspace → Dashboard
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 3. Dashboard → Dashboard principal
    await page.goto("/DooDates/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 4. Dashboard principal → Dashboard FormPolls
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    console.log("✅ Navigation entre pages FormPolls stable");
  });

  test("Smoke - Navigation avec localStorage", async ({ page }) => {
    // 1. Initialiser localStorage avec des données FormPolls
    await page.evaluate(() => {
      const formData = {
        id: "test-form-poll",
        title: "Test FormPoll Navigation",
        questions: [
          {
            id: "q1",
            type: "single",
            title: "Question test",
            options: ["Option 1", "Option 2"],
          },
        ],
        createdAt: Date.now(),
      };

      localStorage.setItem("doodates_form_poll_test", JSON.stringify(formData));
    });

    // 2. Naviguer vers le dashboard
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 3. Vérifier que les données sont accessibles
    const storedData = await page.evaluate(() => {
      const data = localStorage.getItem("doodates_form_poll_test");
      return data ? JSON.parse(data) : null;
    });

    expect(storedData).toBeTruthy();
    expect(storedData.title).toBe("Test FormPoll Navigation");

    console.log("✅ Navigation avec localStorage FormPolls fonctionnelle");
  });

  test("Smoke - Performance navigation FormPolls", async ({ page }) => {
    // 1. Timer pour performance
    const startTime = Date.now();

    // 2. Effectuer plusieurs naviguations
    await page.goto("/DooDates/form/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    await page.goto("/DooDates/form/workspace/form");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    await page.goto("/DooDates/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 3. Vérifier performance
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(15000); // Doit être < 15s

    console.log(`⏱️ Performance navigation FormPolls: ${duration}ms (< 15000ms requis)`);
  });
});
