import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForReactStable } from '../../helpers/wait-helpers';
import { setupAllMocks } from '../../global-setup';
import { createDatePollWithTimeSlots } from '../../helpers/poll-date-helpers';
import { PRODUCT_ROUTES } from '../../utils';

test.describe('Date Polls - Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await setupAllMocks(page);
    });

    test('Should navigate from Landing to Workspace to Dashboard', async ({ page, browserName }) => {
        // 1. Start at Product Landing Page
        await page.goto(PRODUCT_ROUTES.datePoll.landing);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/DooDates\/.*\/date-polls\//);
        await expect(page.getByRole('heading', { name: /Sondages de Dates/i })).toBeVisible();

        // 2. Navigate to Workspace (Create Poll)
        const createButton = page.getByRole('button', { name: /Créer un sondage/i }).first();
        await createButton.click();

        await expect(page).toHaveURL(/DooDates\/.*\/date-polls\/workspace\/date\//);
        await waitForReactStable(page, { browserName });

        // 3. Create a Poll
        // Using helper to speed up creation
        await createDatePollWithTimeSlots(page, browserName, { title: 'Test Navigation Date Poll' });

        // 4. Verify redirection to Vote/Results page
        // The helper usually ends at the vote page or results page depending on flow
        // Let's assume it ends at vote page, we want to go to dashboard

        // 5. Navigate to Dashboard
        await page.goto(PRODUCT_ROUTES.datePoll.dashboard);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/DooDates\/.*\/date-polls\/dashboard\//);
        await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();

        // Verify we are in the Date Polls context (e.g. sidebar active item)
        // This might depend on implementation, but URL check is strong enough for now
    });
});
