import { test, expect } from '@playwright/test';

test.describe('UI Consistency and Navigation', () => {
    test('Date Polls Dashboard has Quota section', async ({ page }) => {
        await page.goto("/http://localhost:8080/DooDates/date-polls/dashboard");
        // Check for Quota section text
        await expect(page.getByText("crédits utilisés")).toBeVisible();
        await expect(page.getByText("Voir le journal")).toBeVisible();
        // Check for Journal button using title since text is hidden on mobile
        await expect(page.getByTitle('Voir le journal de consommation')).toBeVisible();
    });

    test('Form Polls Dashboard has Quota section', async ({ page }) => {
        await page.goto("/http://localhost:8080/DooDates/form-polls/dashboard");
        await expect(page.getByText("crédits utilisés")).toBeVisible();
        await expect(page.getByText("Voir le journal")).toBeVisible();
        await expect(page.getByTitle('Voir le journal de consommation')).toBeVisible();
    });

    test('Availability Polls Dashboard has Quota section', async ({ page }) => {
        await page.goto("/http://localhost:8080/DooDates/availability-polls/dashboard");
        await expect(page.getByText("crédits utilisés")).toBeVisible();
        await expect(page.getByText("Voir le journal")).toBeVisible();
        await expect(page.getByTitle('Voir le journal de consommation')).toBeVisible();
    });

    test('AICreationWorkspace Dashboard link points to correct dashboard', async ({ page }) => {
        // Navigate to Date Poll creation
        await page.goto("/http://localhost:8080/DooDates/workspace/date");

        // Check if "Tableau de bord" is visible. If not, try toggling sidebar.
        if (!await page.getByText("Tableau de bord").isVisible()) {
            await page.getByTestId('sidebar-toggle').click();
        }
        await expect(page.getByText("Tableau de bord")).toBeVisible();

        // Check "Tableau de bord" link
        await page.getByText("Tableau de bord").click();
        await expect(page).toHaveURL(/DooDates\/.*\/date-polls\/dashboard/);
    });

    test('AICreationWorkspace Form Dashboard link points to correct dashboard', async ({ page }) => {
        await page.goto("/http://localhost:8080/DooDates/workspace/form");

        // Check if "Tableau de bord" is visible. If not, try toggling sidebar.
        if (!await page.getByText("Tableau de bord").isVisible()) {
            await page.getByTestId('sidebar-toggle').click();
        }
        await expect(page.getByText("Tableau de bord")).toBeVisible();

        await page.getByText("Tableau de bord").click();
        await expect(page).toHaveURL(\/DooDates\/.*\\/form-polls\\/dashboard\/);
    });
});
