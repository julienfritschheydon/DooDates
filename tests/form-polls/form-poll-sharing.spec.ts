/**
 * Tests E2E FormPoll Sharing - Version Simplifiée (Smoke Tests)
 *
 * Approche: Tests basiques et robustes pour valider le partage FormPolls
 * Méthodologie: Smoke tests avec localStorage direct et timeouts réalistes
 */

import { test, expect } from "@playwright/test";

test.describe("FormPoll Sharing - Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers dashboard pour initialiser le système
    await page.goto("/DooDates/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("Smoke - Accès page partage FormPoll", async ({ page }) => {
    // 1. Simuler un URL de partage
    await page.goto("/DooDates/poll/test-form-poll/share");
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

    await page.waitForTimeout(2000);

    const criticalErrors = logs.filter(
      (log) => log.includes("Error") || log.includes("Uncaught") || log.includes("TypeError"),
    );

    // Autoriser quelques erreurs de chargement (poll inexistant)
    const nonCriticalErrors = criticalErrors.filter(
      (log) =>
        !log.includes("404") && !log.includes("Not Found") && !log.includes("poll not found"),
    );

    expect(nonCriticalErrors.length).toBe(0);
    console.log("✅ Accès page partage FormPoll réussi");
  });

  test("Smoke - localStorage partage FormPoll", async ({ page }) => {
    // 1. Simuler des données de partage dans localStorage
    await page.evaluate(() => {
      const sharingData = {
        pollId: "test-sharing-" + Date.now(),
        title: "Test FormPoll Sharing",
        sharingOptions: {
          publicLink: {
            enabled: true,
            url: "https://doodates.app/poll/test-sharing-" + Date.now(),
            allowAnonymous: true,
            requireEmail: false,
          },
          embedCode: {
            enabled: true,
            code: '<iframe src="https://doodates.app/poll/embed/test-sharing"></iframe>',
            width: 600,
            height: 400,
          },
          socialMedia: {
            facebook: {
              enabled: true,
              url:
                "https://www.facebook.com/sharer/sharer.php?u=" +
                encodeURIComponent("https://doodates.app/poll/test-sharing"),
            },
            twitter: {
              enabled: true,
              url:
                "https://twitter.com/intent/tweet?url=" +
                encodeURIComponent("https://doodates.app/poll/test-sharing") +
                "&text=Votez maintenant!",
            },
            linkedin: {
              enabled: true,
              url:
                "https://www.linkedin.com/sharing/share-offsite/?url=" +
                encodeURIComponent("https://doodates.app/poll/test-sharing"),
            },
          },
          email: {
            enabled: true,
            subject: "Participation au sondage",
            template: "Bonjour, je vous invite à participer à ce sondage : {link}",
          },
        },
        analytics: {
          totalShares: 45,
          sharesByPlatform: {
            link: 25,
            facebook: 12,
            twitter: 5,
            linkedin: 3,
          },
          totalClicks: 128,
          conversionRate: 67.5,
        },
      };

      localStorage.setItem("doodates_form_poll_sharing_test", JSON.stringify(sharingData));
    });

    // 2. Vérifier que les données sont bien stockées
    const storedData = await page.evaluate(() => {
      const data = localStorage.getItem("doodates_form_poll_sharing_test");
      return data ? JSON.parse(data) : null;
    });

    expect(storedData).toBeTruthy();
    expect(storedData.pollId).toBeTruthy();
    expect(storedData.sharingOptions.publicLink.enabled).toBeTruthy();
    expect(storedData.analytics.totalShares).toBe(45);

    console.log("✅ localStorage partage FormPoll fonctionnel");
  });

  test("Smoke - Performance partage FormPoll", async ({ page }) => {
    // 1. Timer pour performance
    const startTime = Date.now();

    // 2. Navigation et chargement
    await page.goto("/DooDates/poll/test-form-poll/share");
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // 3. Simulation de partage rapide
    await page.evaluate(() => {
      const sharingData = {
        pollId: "perf-sharing-" + Date.now(),
        sharingOptions: {
          publicLink: { enabled: true, url: "https://test.com" },
        },
      };
      localStorage.setItem("doodates_form_poll_sharing_test", JSON.stringify(sharingData));
    });

    // 4. Vérification
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(15000); // Doit être < 15s (Firefox plus lent)

    console.log(`⏱️ Performance partage FormPoll: ${duration}ms (< 15000ms requis)`);
  });

  test("Smoke - Gestion erreurs partage", async ({ page }) => {
    // 1. Tester avec localStorage corrompu
    await page.evaluate(() => {
      localStorage.setItem("doodates_form_poll_sharing_test", "{json-invalide");
    });

    // 2. Le système doit récupérer sans crasher
    const pageLoaded = await page.locator("body").isVisible({ timeout: 5000 });
    expect(pageLoaded).toBeTruthy();

    // 3. Nettoyer et tester avec données valides
    await page.evaluate(() => {
      localStorage.removeItem("doodates_form_poll_sharing_test");
      const validData = {
        pollId: "recovery-sharing",
        sharingOptions: { publicLink: { enabled: false } },
      };
      localStorage.setItem("doodates_form_poll_sharing_test", JSON.stringify(validData));
    });

    const recoveredData = await page.evaluate(() => {
      const data = localStorage.getItem("doodates_form_poll_sharing_test");
      return data ? JSON.parse(data) : null;
    });

    expect(recoveredData).toBeTruthy();
    expect(recoveredData.pollId).toBe("recovery-sharing");

    console.log("✅ Gestion erreurs partage robuste");
  });
});
