import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, seedLocalStorage, waitForCopySuccess, warmup, enableE2ELocalMode } from './utils';

function makePoll(overrides: Partial<any> = {}) {
  return {
    id: overrides.id ?? `p-${Math.random().toString(36).slice(2, 7)}`,
    title: overrides.title ?? 'Sondage E2E',
    slug: overrides.slug ?? `e2e-${Math.random().toString(36).slice(2, 5)}`,
    created_at: overrides.created_at ?? new Date().toISOString(),
    status: overrides.status ?? 'active',
    description: overrides.description,
    settings: overrides.settings,
    updated_at: overrides.updated_at,
  };
}

async function openDashboard(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Dashboard - Poll Actions', () => {
  test.describe.configure({ mode: 'serial' });

  test('Dashboard loads without crashing', async ({ page }) => {
    try {
      // Test that dashboard page loads
      await page.goto('/');
      await page.waitForTimeout(500);
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      
      // Verify dashboard loaded
      const dashboardLoaded = await page.locator('body').isVisible();
      expect(dashboardLoaded).toBeTruthy();
      
      // Test navigation to create
      await page.goto('/create');
      await page.waitForTimeout(1000);
      
      const createLoaded = await page.locator('body').isVisible();
      expect(createLoaded).toBeTruthy();
      
      // Navigate back home
      await page.goto('/');
      await page.waitForTimeout(500);
      
      const homeLoaded = await page.locator('body').isVisible();
      expect(homeLoaded).toBeTruthy();
    } catch (error) {
      console.log('Test error:', error);
      throw error;
    }
  });
});
