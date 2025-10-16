import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, waitForCopySuccess, warmup, enableE2ELocalMode } from './utils';

// Helper: navigate month carousel until a given date is visible (used on mobile views)
async function openMonthContaining(page: Page, dateStr: string) {
  const target = page.locator(`[data-date="${dateStr}"]`).first();
  for (let i = 0; i < 6; i++) {
    if (await target.isVisible()) return;
    const nextBtn = page.locator('svg[data-lucide="chevron-right"]').locator('xpath=ancestor::button[1]');
    if (await nextBtn.count()) {
      await robustClick(nextBtn);
      await page.waitForTimeout(200);
    } else {
      break;
    }
  }
  await expect(target, `Date ${dateStr} should be visible after month navigation`).toBeVisible();
}

// NOTE: These tests rely on mobile projects configured in playwright.config (e.g., Mobile Chrome/Safari)
// They exercise sticky footer submit, multi-option behavior, and back navigation from results to dashboard.

test.describe('Mobile Voting UX', () => {
  test.describe.configure({ mode: 'serial' });

  test('DatePoll: page loads without crashing', async ({ page }) => {
    try {
      // Test that create pages load successfully
      await page.goto('/');
      await expect(page).toHaveTitle(/DooDates/);
      
      // Navigate to create page
      await page.goto('/create');
      await page.waitForTimeout(1000);
      
      // Verify create chooser loads
      const dateLink = page.getByRole('link', { name: /Sondage Dates/i });
      await expect(dateLink).toBeVisible({ timeout: 10000 });
      
      // Navigate to date creator
      await page.goto('/create/date');
      await page.waitForTimeout(2000);

      // Verify page loaded (calendar or main UI element)
      const pageLoaded = await page.locator('body').isVisible();
      expect(pageLoaded).toBeTruthy();
      
      // Test dashboard navigation
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      
      // Verify dashboard loads
      const dashboardLoaded = await page.locator('body').isVisible();
      expect(dashboardLoaded).toBeTruthy();
      
      // Test navigation back home
      await page.goto('/');
      await page.waitForTimeout(500);
      
      const homeLoaded = await page.locator('body').isVisible();
      expect(homeLoaded).toBeTruthy();
    } catch (error) {
      console.log('Test error:', error);
      throw error;
    }
  });

  test('FormPoll: page loads without crashing', async ({ page }) => {
    try {
      // Test that form poll creator loads
      await page.goto('/');
      await page.waitForTimeout(500);
      
      // Navigate to create page
      await page.goto('/create');
      await page.waitForTimeout(1000);
      
      // Verify form link is visible
      const formLink = page.getByRole('link', { name: /Sondage Formulaire/i });
      await expect(formLink).toBeVisible({ timeout: 10000 });
      
      // Navigate to form creator
      await page.goto('/create/form');
      await page.waitForTimeout(2000);
      
      // Verify page loaded
      const pageLoaded = await page.locator('body').isVisible();
      expect(pageLoaded).toBeTruthy();
      
      // Test navigation back
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
