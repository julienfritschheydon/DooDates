import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { robustClick, waitForCopySuccess, warmup, enableE2ELocalMode, waitForPageLoad } from './utils';
import { waitForNetworkIdle, waitForElementReady } from './helpers/wait-helpers';
import { getTimeouts } from './config/timeouts';
import { navigateToWorkspace } from './helpers/chat-helpers';

// Helper: navigate month carousel until a given date is visible (used on mobile views)
async function openMonthContaining(page: Page, dateStr: string, browserName: string) {
  const timeouts = getTimeouts(browserName);
  const target = page.locator(`[data-date="${dateStr}"]`).first();
  for (let i = 0; i < 6; i++) {
    if (await target.isVisible()) return;
    const nextBtn = page.locator('svg[data-lucide="chevron-right"]').locator('xpath=ancestor::button[1]');
    if (await nextBtn.count()) {
      await robustClick(nextBtn);
      // Wait for the calendar to update after clicking next month
      await waitForElementReady(page, '[data-date]', { browserName, timeout: timeouts.element });
    } else {
      break;
    }
  }
  await expect(target, `Date ${dateStr} should be visible after month navigation`).toBeVisible({ timeout: getTimeouts(browserName).element });
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
    const timeouts = getTimeouts(browserName, true); // true pour mobile
    
    // Test that create pages load successfully - navigate to workspace first
    await navigateToWorkspace(page, browserName, 'default');
    await expect(page).toHaveTitle(/DooDates/);
    
    // Navigate to create date page (redirige vers /create/ai?type=date)
    await page.goto('/DooDates/create/date', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    
    // Wait for redirect to /create/ai?type=date and verify AICreationWorkspace loads
    await expect(page).toHaveURL(/\/create\/ai.*type=date/, { timeout: timeouts.navigation });
    
    // Verify AICreationWorkspace loads (chat interface or workspace content)
    await waitForElementReady(page, 'textarea, input, button, [role="textbox"]', { browserName, timeout: timeouts.element });

    // Test dashboard navigation
    await page.goto('/DooDates/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    
    // Wait for dashboard content to load (any visible dashboard element)
    await waitForElementReady(page, 'h1, [role="heading"], button, [data-testid]', { browserName, timeout: timeouts.element });
    
    // Test navigation back home - use navigateToWorkspace for consistency
    await navigateToWorkspace(page, browserName, 'default');
    
    // Wait for home page content (title or main heading)
    await waitForElementReady(page, 'h1, [role="heading"]', { browserName, timeout: timeouts.element });
  });

  test('FormPoll: page loads without crashing', async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName, true); // true pour mobile
    
    // Test that form poll creator loads - navigate to workspace first
    await navigateToWorkspace(page, browserName, 'default');
    await expect(page).toHaveTitle(/DooDates/);
    
    // Navigate to form creator (redirige vers /create/ai?type=form)
    await page.goto('/DooDates/create/form', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, { browserName });
    
    // Wait for redirect to /create/ai?type=form and verify AICreationWorkspace loads
    await expect(page).toHaveURL(/\/create\/ai.*type=form/, { timeout: timeouts.navigation });
    
    // Verify AICreationWorkspace loads (chat interface or workspace content)
    await waitForElementReady(page, 'textarea, input, button, [role="textbox"]', { browserName, timeout: timeouts.element });
    
    // Test navigation back - use navigateToWorkspace for consistency
    await navigateToWorkspace(page, browserName, 'default');
    
    // Wait for home page content (title or main heading)
    await waitForElementReady(page, 'h1, [role="heading"]', { browserName, timeout: timeouts.element });
  });
});
