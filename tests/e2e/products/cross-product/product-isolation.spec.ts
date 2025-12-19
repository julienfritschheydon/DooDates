import { test, expect } from '@playwright/test';
import { setupAllMocks } from '../../global-setup';
import { createPollInLocalStorage, createPollsAndVerifyInDashboard } from '../../helpers/poll-storage-helpers';
import { PRODUCT_ROUTES, enableE2ELocalMode } from '../../utils';

test.describe('Cross-Product Isolation', () => {
    test.beforeEach(async ({ page }) => {
        await setupAllMocks(page);
        await enableE2ELocalMode(page);

        // Seed one poll of each type
        const datePoll = {
            id: 'test-date-poll',
            slug: 'test-date-poll',
            title: 'Test Date Poll',
            type: 'date' as const,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator_id: 'test-device-id', // Match default E2E device ID
            settings: {
                selectedDates: ['2025-01-01'],
            },
        };

        const formPoll = {
            id: 'test-form-poll',
            slug: 'test-form-poll',
            title: 'Test Form Poll',
            type: 'form' as const,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator_id: 'test-device-id',
        };

        const availabilityPoll = {
            id: 'test-availability-poll',
            slug: 'test-availability-poll',
            title: 'Test Availability Poll',
            type: 'availability' as const,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator_id: 'test-device-id',
        };

        // We need to navigate to a page first to access localStorage
        await page.goto(PRODUCT_ROUTES.datePoll.landing);

        await createPollInLocalStorage(page, datePoll);
        await createPollInLocalStorage(page, formPoll);
        await createPollInLocalStorage(page, availabilityPoll);
    });

    test('Date Polls Dashboard should only show Date Polls', async ({ page, browserName }) => {
        await createPollsAndVerifyInDashboard(
            page,
            browserName,
            [], // Polls déjà créés dans beforeEach
            PRODUCT_ROUTES.datePoll.dashboard,
            ['Test Date Poll'],
            ['Test Form Poll', 'Test Availability Poll']
        );
    });

    test('Form Polls Dashboard should only show Form Polls', async ({ page, browserName }) => {
        await createPollsAndVerifyInDashboard(
            page,
            browserName,
            [], // Polls déjà créés dans beforeEach
            PRODUCT_ROUTES.formPoll.dashboard,
            ['Test Form Poll'],
            ['Test Date Poll', 'Test Availability Poll']
        );
    });

    test('Availability Polls Dashboard should only show Availability Polls', async ({ page, browserName }) => {
        await createPollsAndVerifyInDashboard(
            page,
            browserName,
            [], // Polls déjà créés dans beforeEach
            PRODUCT_ROUTES.availabilityPoll.dashboard,
            ['Test Availability Poll'],
            ['Test Date Poll', 'Test Form Poll']
        );
    });
});
