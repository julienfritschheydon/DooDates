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
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate to dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      
      // Test navigation to create
      await page.goto('/create', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      
      // Navigate back home
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      console.log('Test error:', error);
      throw error;
    }
  });
});
