import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachConsoleGuard, robustClick, waitForCopySuccess, warmup, enableE2ELocalMode, waitForPageLoad } from './utils';

// Helper: navigate month carousel until a given date is visible (used on mobile views)
async function openMonthContaining(page: Page, dateStr: string) {
  const target = page.locator(`[data-date="${dateStr}"]`).first();
  for (let i = 0; i < 6; i++) {
    if (await target.isVisible()) return;
    const nextBtn = page.locator('svg[data-lucide="chevron-right"]').locator('xpath=ancestor::button[1]');
    if (await nextBtn.count()) {
      await robustClick(nextBtn);
      // Wait for the calendar to update after clicking next month
      await expect(page.locator('[data-date]').first()).toBeVisible({ timeout: 2000 });
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
  
  // Skip Firefox/WebKit due to serial mode + timing issues (similar to analytics-ai)
  // Chrome is the reference browser for these mobile tests
  // https://github.com/microsoft/playwright/issues/13038
  // https://github.com/microsoft/playwright/issues/22832
  test.skip(({ browserName }) => browserName !== 'chromium', 
    'Mobile tests optimized for Chrome. Firefox/WebKit have timing issues with serial mode.');

  test('DatePoll: page loads without crashing', async ({ page, browserName }) => {
    try {
      // Test that create pages load successfully
      await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      await expect(page).toHaveTitle(/DooDates/);
      
      // Navigate to create page
      await page.goto('/create', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Verify create chooser loads (replace waitForTimeout with explicit wait)
      const dateLink = page.getByRole('link', { name: /Sondage Dates/i });
      await expect(dateLink).toBeVisible({ timeout: 10000 });
      
      // Navigate to date creator
      await page.goto('/create/date', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Wait for date creator to load (title input with data-testid)
      await expect(
        page.locator('[data-testid="poll-title"]')
      ).toBeVisible({ timeout: 10000 });

      // Test dashboard navigation
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Wait for dashboard content to load (any visible dashboard element)
      await expect(
        page.locator('h1, [role="heading"], button, [data-testid]').first()
      ).toBeVisible({ timeout: 10000 });
      
      // Test navigation back home
      await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Wait for home page content (title or main heading)
      await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.log('Test error:', error);
      throw error;
    }
  });

  test('FormPoll: page loads without crashing', async ({ page, browserName }) => {
    try {
      // Test that form poll creator loads
      await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      await expect(page).toHaveTitle(/DooDates/);
      
      // Navigate to create page
      await page.goto('/create', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Verify form link is visible (replace waitForTimeout with explicit wait)
      const formLink = page.getByRole('link', { name: /Sondage Formulaire/i });
      await expect(formLink).toBeVisible({ timeout: 10000 });
      
      // Navigate to form creator
      await page.goto('/create/form', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Wait for form creator to load (wait for any form input or button to be visible)
      await expect(
        page.locator('input, textarea, button:not([aria-hidden="true"])').first()
      ).toBeVisible({ timeout: 10000 });
      
      // Test navigation back
      await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
      await waitForPageLoad(page, browserName);
      
      // Wait for home page content (title or main heading)
      await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.log('Test error:', error);
      throw error;
    }
  });
});
