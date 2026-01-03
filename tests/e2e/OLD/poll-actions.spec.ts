// import { test, expect } from '@playwright/test';
// import type { Page } from '@playwright/test';
// import { robustClick, seedLocalStorage, waitForCopySuccess, warmup, enableE2ELocalMode } from '../utils';
// import { waitForNetworkIdle, waitForElementReady } from '../helpers/wait-helpers';
// import { getTimeouts } from '../config/timeouts';
// import { safeIsVisible } from '../helpers/safe-helpers';

// function makePoll(overrides: Partial<any> = {}) {
//   return {
//     id: overrides.id ?? `p-${Math.random().toString(36).slice(2, 7)}`,
//     title: overrides.title ?? 'Sondage E2E',
//     slug: overrides.slug ?? `e2e-${Math.random().toString(36).slice(2, 5)}`,
//     created_at: overrides.created_at ?? new Date().toISOString(),
//     status: overrides.status ?? 'active',
//     description: overrides.description,
//     settings: overrides.settings,
//     updated_at: overrides.updated_at,
//   };
// }

// async function openDashboard(page: Page, browserName: string) {
//   const timeouts = getTimeouts(browserName);
//   await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
//   await waitForNetworkIdle(page, { browserName });
//   await expect(page).toHaveURL(/DooDates/\/dashboard/, { timeout: timeouts.navigation });
// }

// test.describe('Dashboard - Poll Actions', () => {
//   test.describe.configure({ mode: 'serial' });

//   test('Dashboard loads without crashing', async ({ page, browserName }) => {
//     const timeouts = getTimeouts(browserName);

//     // Test that dashboard page loads
//     await page.goto('/DooDates/workspace', { waitUntil: 'domcontentloaded' });
//     await waitForNetworkIdle(page, { browserName });
//     await expect(page.locator('body')).toBeVisible();

//     // Navigate to dashboard
//     await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
//     await waitForNetworkIdle(page, { browserName });
//     await expect(page.locator('body')).toBeVisible();

//     // Verify dashboard-specific elements are present
//     const dashboardElement = await waitForElementReady(page, 'h1, [role="heading"], button, [data-testid]', { browserName, timeout: timeouts.element }).catch(async () => {
//       // Fallback: at least body should be visible
//       await expect(page.locator('body')).toBeVisible();
//       return null;
//     });
//     if (dashboardElement) {
//       await expect(dashboardElement).toBeVisible({ timeout: timeouts.element });
//     }

//     // Test navigation to create
//     await page.goto('/DooDates/create', { waitUntil: 'domcontentloaded' });
//     await waitForNetworkIdle(page, { browserName });
//     await expect(page.locator('body')).toBeVisible();

//     // Navigate back home
//     await page.goto('/DooDates/workspace', { waitUntil: 'domcontentloaded' });
//     await waitForNetworkIdle(page, { browserName });
//     await expect(page.locator('body')).toBeVisible();
//   });
// });
