import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers/rgpd-helpers";

test.describe("Main Landing Page", () => {
  test("should display the main landing page with 3 product cards", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");
    await dismissOnboarding(page);

    // Check for title
    await expect(page.getByText("Planifiez simplement")).toBeVisible();

    // Check for Date Polls card
    const datePollsCard = page.getByRole("link", { name: /Sondages de Dates/i });
    await expect(datePollsCard).toBeVisible();
    await expect(datePollsCard).toHaveAttribute("href", /.*\/date/);

    // Check for Form Polls card
    const formPollsCard = page.getByRole("link", { name: /Formulaires/i });
    await expect(formPollsCard).toBeVisible();
    await expect(formPollsCard).toHaveAttribute("href", /.*\/form/);

    // Check for Availability Polls card
    const availabilityPollsCard = page.getByRole("link", { name: /Disponibilités/i });
    await expect(availabilityPollsCard).toBeVisible();
    await expect(availabilityPollsCard).toHaveAttribute("href", /.*\/availability/);
  });

  test("should navigate to Date Polls", async ({ page, browserName }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("link", { name: /Sondages de Dates/i }).click();
  });

  test("should navigate to Form Polls", async ({ page, browserName }) => {
    await page.goto("/");
    await dismissOnboarding(page);

    // Attendre que le lien soit interactif
    const link = page.getByRole("link", { name: /Formulaires/i });
    await expect(link).toBeVisible();
    await link.click();
    // Peut rediriger vers /form
    await expect(page).toHaveURL(/.*form/);
  });

  test("should navigate to Availability Polls", async ({ page, browserName }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.goto("/");
    await dismissOnboarding(page);
    const link = page.locator('a[href="/availability"]');
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await link.click();
    // Peut rediriger vers /availability ou /availability-polls
    await expect(page).toHaveURL(/.*availability/);
  });
});
