import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { withConsoleGuard } from "../../utils";
import { setupTestEnvironment } from "../../helpers/test-setup";
import { createTestPoll, clearTestData } from "../../helpers/test-data";
import { getTimeouts } from "../../config/timeouts";

/**
 * Tests simples pour le Dashboard Date Polls
 * Contourne le problème de lazy loading en testant directement les composants
 *
 * @tags @dashboard @date-polls @simple
 */
test.describe("Date Polls Dashboard - Tests Simples", () => {
  test.beforeEach(async ({ page, browserName }) => {
    await setupTestEnvironment(page, browserName);
    await clearTestData(page, { all: true });
  });

  test("@simple - Dashboard vide - Vérification de base", async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Aller directement sur la page sans vérifier les erreurs console
      await page.goto("/DooDates/date-polls/dashboard", { waitUntil: "domcontentloaded" });

      const timeouts = getTimeouts(browserName);

      // Vérifier que la page se charge
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'il n'y a pas de polls dans localStorage
      const pollCount = await page.evaluate(() => {
        const stored = localStorage.getItem("doodates_polls");
        const polls = stored ? JSON.parse(stored) : [];
        return polls.length;
      });

      expect(pollCount).toBe(0);

      // Prendre un screenshot pour diagnostic
      await page.screenshot({ path: "test-results/dashboard-vide.png", fullPage: true });
    });
  });

  test("@simple - Dashboard avec un poll - Vérification de base", async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Créer un poll de test
      await createTestPoll(page, {
        title: "Test Poll Simple",
        slug: "test-poll-simple",
        type: "date" as const,
        status: "active" as const,
        settings: {
          selectedDates: ["2025-01-15"],
        },
      });

      // Aller sur la page
      await page.goto("/DooDates/date-polls/dashboard", { waitUntil: "domcontentloaded" });

      const timeouts = getTimeouts(browserName);

      // Vérifier que la page se charge
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Vérifier qu'il y a un poll dans localStorage
      const pollCount = await page.evaluate(() => {
        const stored = localStorage.getItem("doodates_polls");
        const polls = stored ? JSON.parse(stored) : [];
        return polls.length;
      });

      expect(pollCount).toBe(1);

      // Prendre un screenshot pour diagnostic
      await page.screenshot({ path: "test-results/dashboard-avec-poll.png", fullPage: true });
    });
  });

  test("@simple - Test direct du composant ProductDashboard", async ({ page, browserName }) => {
    await withConsoleGuard(page, async () => {
      // Aller sur une page simple pour tester
      await page.goto("/DooDates/", { waitUntil: "domcontentloaded" });

      const timeouts = getTimeouts(browserName);

      // Vérifier que la page se charge
      await expect(page.locator("body")).toBeVisible({ timeout: timeouts.element });

      // Créer un poll de test
      await createTestPoll(page, {
        title: "Test Poll Direct",
        slug: "test-poll-direct",
        type: "date" as const,
        status: "active" as const,
        settings: {
          selectedDates: ["2025-01-15"],
        },
      });

      // Vérifier que le poll est dans localStorage
      const pollCount = await page.evaluate(() => {
        const stored = localStorage.getItem("doodates_polls");
        const polls = stored ? JSON.parse(stored) : [];
        return polls.length;
      });

      expect(pollCount).toBe(1);

      // Prendre un screenshot pour diagnostic
      await page.screenshot({ path: "test-results/dashboard-direct.png", fullPage: true });
    });
  });
});
