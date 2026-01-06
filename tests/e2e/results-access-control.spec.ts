import { test, expect } from "@playwright/test";
import { createPollInStorage } from "./helpers/poll-helpers";
import { waitForNetworkIdle } from "./helpers/wait-helpers";
import { setupGeminiMock } from "./global-setup";

test.describe("Date Poll Results Access Control", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Naviguer vers l'origine correcte avant de manipuler le storage
    await setupGeminiMock(page);
    await page.goto("/workspace", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
  });

  test("Creator Only: should show results to creator and deny access to others", async ({
    page,
    context,
    browserName,
  }) => {
    const pollSlug = `test-date-creator-only-${Date.now()}`;
    const deviceId = `dev-creator-${Date.now()}`;

    // 1. Injecter le poll en storage
    await createPollInStorage(page, {
      slug: pollSlug,
      title: "Test Date Creator Only",
      type: "date",
      resultsVisibility: "creator-only",
      creator_id: deviceId,
      dates: [{ date: "2024-01-01", timeSlots: [] }],
    });

    // 2. Vérifier que le créateur voit les résultats
    const resultsUrl = `/poll/${pollSlug}/results`;
    await page.goto(resultsUrl, { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    await expect(page.getByTestId("results-title")).toBeVisible();
    await expect(page.locator("text=Accès restreint")).not.toBeVisible();

    // 3. Simuler un visiteur (nouvel onglet avec device-id différent)
    await page.close(); // Fermer créateur

    const visitorPage = await context.newPage();
    const visitorId = `dev-visitor-${Date.now()}`;

    // Utiliser addInitScript pour définir le storage AVANT le chargement de la page
    await visitorPage.addInitScript((id) => {
      window.localStorage.setItem("doodates_device_id", id);
    }, visitorId);

    await visitorPage.goto(resultsUrl);
    await waitForNetworkIdle(visitorPage, { browserName });

    await expect(visitorPage.locator("text=Accès restreint")).toBeVisible();
    await expect(visitorPage.locator("text=Seul le créateur")).toBeVisible();
    await visitorPage.close();
  });

  test("Voters Only: should restrict results until the user has voted", async ({
    page,
    context,
    browserName,
  }) => {
    const pollSlug = `test-date-voters-only-${Date.now()}`;
    const creatorId = `dev-creator-${Date.now()}`;

    // 1. Injecter le poll en storage
    await createPollInStorage(page, {
      slug: pollSlug,
      title: "Test Date Voters Only",
      type: "date",
      resultsVisibility: "voters",
      creator_id: creatorId,
      dates: [
        {
          date: "2024-01-01",
          id: "d1",
          timeSlots: [
            { hour: 10, minute: 0, enabled: true },
            { hour: 14, minute: 0, enabled: true },
          ],
        },
      ],
    });

    const resultsUrl = `/poll/${pollSlug}/results`;

    // 2. Créateur peut voir les résultats (même sans avoir voté)
    await page.goto(resultsUrl, { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
    await expect(page.getByTestId("results-title")).toBeVisible();
    await expect(page.locator("text=Accès restreint")).not.toBeVisible();

    // 3. Visiteur ne peut PAS voir les résultats (n'a pas voté)
    await page.close();

    const visitorPage = await context.newPage();
    const visitorId = `dev-visitor-${Date.now()}`;

    await visitorPage.addInitScript((id) => {
      window.localStorage.setItem("doodates_device_id", id);
    }, visitorId);

    await visitorPage.goto(resultsUrl);
    await waitForNetworkIdle(visitorPage, { browserName });

    // Devrait voir le message de restriction
    await expect(visitorPage.locator("text=/voter pour voir les résultats/i")).toBeVisible();
    await expect(visitorPage.getByTestId("results-title")).not.toBeVisible();

    await visitorPage.close();
  });

  test("Public: should allow everyone to see results", async ({ page, context, browserName }) => {
    const pollSlug = `test-date-public-${Date.now()}`;
    const creatorId = `dev-creator-${Date.now()}`;

    await createPollInStorage(page, {
      slug: pollSlug,
      title: "Test Date Public",
      type: "date",
      resultsVisibility: "public",
      creator_id: creatorId,
      dates: [{ date: "2024-01-01", timeSlots: [] }],
    });

    const resultsUrl = `/poll/${pollSlug}/results`;

    // Créateur voit
    await page.goto(resultsUrl);
    await waitForNetworkIdle(page, { browserName });
    await expect(page.getByTestId("results-title")).toBeVisible();

    // Visiteur voit
    await page.close();

    const visitorPage = await context.newPage();
    const visitorId = `dev-visitor-${Date.now()}`;

    await visitorPage.addInitScript((id) => {
      window.localStorage.setItem("doodates_device_id", id);
    }, visitorId);

    await visitorPage.goto(resultsUrl);
    await waitForNetworkIdle(visitorPage, { browserName });
    await expect(visitorPage.getByTestId("results-title")).toBeVisible();

    await visitorPage.close();
  });
});

test.describe("Form Poll Results Access Control", () => {
  test.beforeEach(async ({ page, browserName }) => {
    await setupGeminiMock(page);
    await page.goto("/workspace", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
  });

  test("should enforce access control for form polls", async ({ page, context, browserName }) => {
    const pollSlug = `test-form-creator-only-${Date.now()}`;
    const creatorId = `dev-creator-${Date.now()}`;

    // 1. Injecter
    await createPollInStorage(page, {
      slug: pollSlug,
      title: "Test Form Access Control",
      type: "form",
      resultsVisibility: "creator-only",
      creator_id: creatorId,
      questions: [
        {
          id: "q1",
          kind: "single",
          title: "Question 1",
          options: [{ id: "o1", label: "Option 1" }],
        },
      ],
    });

    const resultsUrl = `/poll/${pollSlug}/results`;

    // 2. Créateur voit
    await page.goto(resultsUrl);
    await waitForNetworkIdle(page, { browserName });
    await expect(page.getByTestId("results-title")).toBeVisible();

    // 3. Autre ne voit pas
    await page.close();

    const visitorPage = await context.newPage();
    const visitorId = `dev-visitor-${Date.now()}`;

    await visitorPage.addInitScript((id) => {
      window.localStorage.setItem("doodates_device_id", id);
    }, visitorId);

    await visitorPage.goto(resultsUrl);
    await waitForNetworkIdle(visitorPage, { browserName });
    await expect(visitorPage.locator("text=Accès restreint")).toBeVisible();

    await visitorPage.close();
  });
});
