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

  test.skip("Creator Only: should show results to creator and deny access to others", async ({
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

  test.skip("Voters Only: should restrict results until the user has voted", async ({
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
      dates: [{ date: "2024-01-01", id: "d1", timeSlots: [] }],
    });

    const resultsUrl = `/poll/${pollSlug}/results`;
    const voteUrl = `/poll/${pollSlug}`;

    // 2. Simuler un votant
    await page.close();

    const voterPage = await context.newPage();
    const voterId = `dev-voter-${Date.now()}`;

    await voterPage.addInitScript((id) => {
      window.localStorage.setItem("doodates_device_id", id);
    }, voterId);

    await voterPage.goto(resultsUrl);
    await waitForNetworkIdle(voterPage, { browserName });

    // Devrait être restreint avant de voter
    await expect(voterPage.locator("text=voter pour voir les résultats")).toBeVisible();

    // Aller voter
    await voterPage.goto(voteUrl);
    await waitForNetworkIdle(voterPage, { browserName });

    // Scénario de vote
    await voterPage.locator('button:has-text("Oui")').first().click();
    await voterPage.locator("#voter-name-input").fill("Votant Test");
    await voterPage
      .locator('button:has-text("Soumettre"), button:has-text("Valider"), button[type="submit"]')
      .first()
      .click();

    // Attendre la confirmation
    await expect(voterPage.locator("text=/merci|enregistré/i")).toBeVisible();

    // Maintenant les résultats devraient être accessibles
    await voterPage.goto(resultsUrl);
    await waitForNetworkIdle(voterPage, { browserName });
    await expect(voterPage.getByTestId("results-title")).toBeVisible();

    await voterPage.close();
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

  test.skip("should enforce access control for form polls", async ({
    page,
    context,
    browserName,
  }) => {
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
