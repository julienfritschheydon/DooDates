import { test, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForReactStable, waitForElementReady } from '../../helpers/wait-helpers';
import { setupAllMocks } from '../../global-setup';
import { PRODUCT_ROUTES } from '../../utils';

test.describe('Availability Polls - Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await setupAllMocks(page);
    });

    test('Should navigate from Landing to Workspace to Dashboard', async ({ page, browserName }) => {
        // 1. Start at Product Landing Page
        await page.goto(PRODUCT_ROUTES.availabilityPoll.landing);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/DooDates/.*\/availability-polls/);
        // Title might vary, check for "Sondages de Disponibilité" or similar
        await expect(page.getByRole('heading', { name: /Synchronisez vos agendas/i })).toBeVisible();

        // 2. Navigate to Workspace (Create Poll)
        const createButton = page.getByRole('button', { name: /Créer une disponibilité/i }).first();
        await createButton.click();

        await expect(page).toHaveURL(/DooDates/.*\/availability-polls\/workspace\/availability/);
        await waitForReactStable(page, { browserName });

        // 3. Create a Poll Manually
        const titleInput = await waitForElementReady(page, 'input#title, input[placeholder*="Planification"], input[placeholder*="titre"]', { browserName });
        await titleInput.fill('Test Navigation Availability Poll');

        const createPollButton = await waitForElementReady(page, 'button:has-text("Créer le sondage"), button:has-text("Créer")', { browserName });
        await createPollButton.click({ force: true });

        // Wait for success screen
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });
        const successTitle = page.getByText('Sondage Disponibilités créé').or(page.getByText('Sondage créé')).first();
        await expect(successTitle).toBeVisible();

        // 4. Navigate to Dashboard
        await page.goto(PRODUCT_ROUTES.availabilityPoll.dashboard);
        await waitForNetworkIdle(page, { browserName });
        await waitForReactStable(page, { browserName });

        await expect(page).toHaveURL(/DooDates/.*\/availability-polls\/dashboard/);
        await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
    });
});
