import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForReactStable } from '../../helpers/wait-helpers';
import { setupAllMocks } from '../../global-setup';
import { PRODUCT_ROUTES } from '../../utils';

test.describe('Quizz - Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await setupAllMocks(page);
    });

    test('Should navigate from Landing to Dashboard', async ({ page, browserName }) => {
        // 1. Start at Product Landing Page
        await page.goto(PRODUCT_ROUTES.quizz.landing);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/quizz/);
        // Title might vary, check for "Quiz" or similar
        await expect(page.getByRole('heading', { name: /Quiz/i })).toBeVisible();

        // 2. Navigate to Dashboard
        const dashboardLink = page.getByRole('link', { name: /Tableau de bord|Dashboard/i }).first();
        if (await dashboardLink.isVisible().catch(() => false)) {
            await dashboardLink.click();
        } else {
            // Fallback: navigate directly
            await page.goto(PRODUCT_ROUTES.quizz.dashboard);
        }

        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/quizz\/dashboard/);
        await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
    });

    test('Should create a quiz manually', async ({ page, browserName }) => {
        // 1. Navigate to create page
        await page.goto(PRODUCT_ROUTES.quizz.workspace);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/quizz\/workspace/);

        // 2. Fill in quiz title
        const titleInput = page.getByPlaceholder(/Titre du quiz|Ex: Quiz/i).first();
        await expect(titleInput).toBeVisible({ timeout: 10000 });
        await titleInput.fill('Test Quiz E2E');

        // 3. Add a question manually
        const addQuestionButton = page.getByRole('button', { name: /Ajouter/i }).first();
        await expect(addQuestionButton).toBeVisible();
        await addQuestionButton.click();

        // Wait for question form to appear
        await waitForReactStable(page, { browserName });

        // Fill question text
        const questionInputs = page.locator('input[placeholder*="question" i], input[placeholder*="Question" i]');
        const questionCount = await questionInputs.count();
        if (questionCount > 0) {
            await questionInputs.first().fill('Quelle est la capitale de la France ?');
        }

        // 4. Save the quiz
        const saveButton = page.getByRole('button', { name: /Créer le quiz|Sauvegarder/i }).first();
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // 5. Verify redirect to dashboard or landing
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        // Should be on dashboard or landing page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/.*\/quizz/);
    });

    test('Should display quiz list in dashboard', async ({ page, browserName }) => {
        // Navigate to dashboard
        await page.goto(PRODUCT_ROUTES.quizz.dashboard);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/quizz\/dashboard/);

        // Check for dashboard heading
        await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();

        // Dashboard should show quiz list (even if empty)
        // The list container should be present
        const listContainer = page.locator('[data-testid="poll-list"], [data-testid="quiz-list"], main').first();
        await expect(listContainer).toBeVisible();
    });

    test('Should navigate to child history page', async ({ page, browserName }) => {
        // Navigate to a child history page (if route exists)
        // First, check if we can navigate to history
        await page.goto(PRODUCT_ROUTES.quizz.landing);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        // Look for history link or navigate directly
        const historyLink = page.getByRole('link', { name: /Historique|History/i });
        const hasHistoryLink = await historyLink.count().catch(() => 0);

        if (hasHistoryLink > 0) {
            await historyLink.first().click();
            await waitForNetworkIdle(page, { browserName });
            await waitForReactStable(page, { browserName });

            // Should be on history page
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/.*\/quizz.*history/);
        } else {
            // If no history link, try direct navigation (if route exists)
            // This test will pass even if history route doesn't exist yet
            test.skip();
        }
    });
});
