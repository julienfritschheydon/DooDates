import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForReactStable } from '../../helpers/wait-helpers';
import { setupAllMocks } from '../../global-setup';
import { robustFill, PRODUCT_ROUTES } from '../../utils';

test.describe('Form Polls - Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await setupAllMocks(page);
    });

    test('Should navigate from Landing to Workspace to Dashboard', async ({ page, browserName }) => {
        // 1. Start at Product Landing Page
        await page.goto(PRODUCT_ROUTES.formPoll.landing);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/form-polls/);
        // Title might vary, check for "Formulaires" or similar
        await expect(page.getByRole('heading', { name: /Formulaires/i })).toBeVisible();

        // 2. Navigate to Workspace (Create Poll)
        const createButton = page.getByRole('button', { name: /Créer un formulaire/i }).first();
        await createButton.click();

        await expect(page).toHaveURL(/.*\/form-polls\/workspace\/form/);
        await waitForReactStable(page, { browserName });

        // 3. Create a Poll via AI
        const chatInput = page.locator('[data-testid="chat-input"]');
        await expect(chatInput).toBeVisible();

        await robustFill(chatInput, 'Crée un questionnaire avec 1 question');
        await chatInput.press('Enter');

        // Wait for success message
        await expect(page.getByText(/(Voici votre questionnaire|Formulaire créé)/i)).toBeVisible({ timeout: 30000 });

        // Click "Create" button in the chat response
        const createFormButton = page.locator('[data-testid="create-form-button"]');
        await expect(createFormButton).toBeVisible();
        await createFormButton.click();

        // Wait for preview
        await expect(page.locator('[data-poll-preview]')).toBeVisible();

        // 4. Navigate to Dashboard
        await page.goto(PRODUCT_ROUTES.formPoll.dashboard);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/.*\/form-polls\/dashboard/);
        await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
    });
});
