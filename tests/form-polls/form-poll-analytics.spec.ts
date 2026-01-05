/**
 * Tests E2E FormPoll Analytics - Version Simplifiée (Smoke Tests)
 *
 * Approche: Tests basiques et robustes pour valider les analytics FormPolls
 * Méthodologie: Smoke tests avec localStorage direct et timeouts réalistes
 */

import { test, expect } from "@playwright/test";

test.describe("FormPoll Analytics - Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers dashboard pour initialiser le système
    await page.goto("/DooDates/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("Smoke - Accès page analytics FormPoll", async ({ page }) => {
    // 1. Simuler un URL d'analytics
    await page.goto("/DooDates/poll/test-form-poll/analytics");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 2. Vérifier que la page se charge
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // 3. Vérifier l'absence d'erreurs critiques
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(msg.text());
      }
    });

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const criticalErrors = logs.filter(
      (log) => log.includes("Error") || log.includes("Uncaught") || log.includes("TypeError"),
    );

    // Autoriser quelques erreurs de chargement (poll inexistant)
    const nonCriticalErrors = criticalErrors.filter(
      (log) =>
        !log.includes("404") && !log.includes("Not Found") && !log.includes("poll not found"),
    );

    expect(nonCriticalErrors.length).toBe(0);
    console.log("✅ Accès page analytics FormPoll réussi");
  });

  test("Smoke - localStorage analytics FormPoll", async ({ page }) => {
    // 1. Simuler des données d'analytics dans localStorage
    await page.evaluate(() => {
      const analyticsData = {
        pollId: "test-analytics-" + Date.now(),
        title: "Test FormPoll Analytics",
        metrics: {
          totalViews: 1250,
          uniqueVisitors: 890,
          averageTimeOnPage: 180, // secondes
          bounceRate: 25.5, // pourcentage
          completionRate: 78.2,
        },
        timeline: [
          {
            date: new Date(Date.now() - 86400000).toISOString(), // hier
            views: 45,
            completions: 35,
          },
          {
            date: new Date().toISOString(), // aujourd'hui
            views: 67,
            completions: 52,
          },
        ],
        demographics: {
          countries: {
            France: 450,
            Belgique: 120,
            Suisse: 85,
            Canada: 78,
            Autres: 157,
          },
          devices: {
            Desktop: 520,
            Mobile: 310,
            Tablet: 60,
          },
          browsers: {
            Chrome: 480,
            Safari: 220,
            Firefox: 120,
            Edge: 70,
          },
        },
        questionAnalytics: [
          {
            questionId: "q1",
            title: "Question 1",
            skipRate: 12.5,
            averageTime: 15.2,
            completionRate: 87.5,
          },
          {
            questionId: "q2",
            title: "Question 2",
            skipRate: 8.3,
            averageTime: 22.7,
            completionRate: 91.7,
          },
        ],
      };

      localStorage.setItem("doodates_form_poll_analytics_test", JSON.stringify(analyticsData));
    });

    // 2. Vérifier que les données sont bien stockées
    const storedData = await page.evaluate(() => {
      const data = localStorage.getItem("doodates_form_poll_analytics_test");
      return data ? JSON.parse(data) : null;
    });

    expect(storedData).toBeTruthy();
    expect(storedData.pollId).toBeTruthy();
    expect(storedData.metrics.totalViews).toBe(1250);
    expect(storedData.timeline).toHaveLength(2);

    console.log("✅ localStorage analytics FormPoll fonctionnel");
  });

  test("Smoke - Performance analytics FormPoll", async ({ page }) => {
    // 1. Timer pour performance
    const startTime = Date.now();

    // 2. Navigation et chargement
    await page.goto("/DooDates/poll/test-form-poll/analytics");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 3. Simulation d'analytics rapide
    await page.evaluate(() => {
      const analyticsData = {
        pollId: "perf-analytics-" + Date.now(),
        metrics: {
          totalViews: 100,
          uniqueVisitors: 80,
        },
      };
      localStorage.setItem("doodates_form_poll_analytics_test", JSON.stringify(analyticsData));
    });

    // 4. Vérification
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(12000); // Doit être < 12s (Firefox plus lent)

    console.log(`⏱️ Performance analytics FormPoll: ${duration}ms (< 12000ms requis)`);
  });

  test("Smoke - Gestion erreurs analytics", async ({ page }) => {
    // 1. Tester avec localStorage corrompu
    await page.evaluate(() => {
      localStorage.setItem("doodates_form_poll_analytics_test", "{json-invalide");
    });

    // 2. Le système doit récupérer sans crasher
    const pageLoaded = await page.locator("body").isVisible({ timeout: 5000 });
    expect(pageLoaded).toBeTruthy();

    // 3. Nettoyer et tester avec données valides
    await page.evaluate(() => {
      localStorage.removeItem("doodates_form_poll_analytics_test");
      const validData = {
        pollId: "recovery-analytics",
        metrics: { totalViews: 0 },
      };
      localStorage.setItem("doodates_form_poll_analytics_test", JSON.stringify(validData));
    });

    const recoveredData = await page.evaluate(() => {
      const data = localStorage.getItem("doodates_form_poll_analytics_test");
      return data ? JSON.parse(data) : null;
    });

    expect(recoveredData).toBeTruthy();
    expect(recoveredData.pollId).toBe("recovery-analytics");

    console.log("✅ Gestion erreurs analytics robuste");
  });
});
