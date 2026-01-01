import { test, expect } from '@playwright/test';

test.describe('Main Landing Page', () => {
    test('should display the main landing page with 3 product cards', async ({ page }) => {
        await page.goto("//DooDates/");

        // Check for title
        await expect(page.getByText("Planifiez simplement")).toBeVisible();

        // Check for Date Polls card
        const datePollsCard = page.getByRole("link", { name: /Sondages de Dates/i });
        await expect(datePollsCard).toBeVisible();
        await expect(datePollsCard).toHaveAttribute('href', /.*\/date-polls/);

        // Check for Form Polls card
        const formPollsCard = page.getByRole("link", { name: /Formulaires/i });
        await expect(formPollsCard).toBeVisible();
        await expect(formPollsCard).toHaveAttribute('href', /.*\/form-polls/);

        // Check for Availability Polls card
        const availabilityPollsCard = page.getByRole("link", { name: /Disponibilités/i });
        await expect(availabilityPollsCard).toBeVisible();
        await expect(availabilityPollsCard).toHaveAttribute('href', /.*\/availability-polls/);
    });

    test('should navigate to Date Polls', async ({ page }) => {
        await page.goto("//DooDates/");
        await page.getByRole("link", { name: /Sondages de Dates/i }).click();
        await expect(page).toHaveURL(/DooDates/.*\/date-polls/);
    });

    test('should navigate to Form Polls', async ({ page }) => {
        await page.goto("//DooDates/");
        await page.getByRole("link", { name: /Formulaires/i }).click();
        await expect(page).toHaveURL(/DooDates/.*\/form-polls/);
    });

    test('should navigate to Availability Polls', async ({ page }) => {
        await page.goto("//DooDates/");
        await page.getByRole("link", { name: /Disponibilités/i }).click();
        await expect(page).toHaveURL(/DooDates/.*\/availability-polls/);
    });
});
