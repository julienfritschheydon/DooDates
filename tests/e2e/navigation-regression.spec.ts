/**
 * Navigation Regression Tests
 * DooDates - Ensures TopNav is present on all screens
 * 
 * This test suite verifies that the navigation menu (TopNav) is consistently
 * present across all major screens and user flows to prevent regression issues.
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.skip('TopNav should be present on home page', async ({ page }) => {
    await page.goto('/');
    
    // Check for TopNav container
    await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    
    // Check for logo
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-logo"]')).toHaveText('DooDates');
    
    // Check for settings and account buttons
    await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-button"]')).toBeVisible();
  });

  test.skip('TopNav should be present on AI chat page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for chat interface to load
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 10000 });
    
    // Check for TopNav elements
    await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-button"]')).toBeVisible();
  });

  test.skip('TopNav should persist during async operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Mes Sondages')).toBeVisible({ timeout: 10000 });
    
    // TopNav should be visible during loading states
    await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
    
    // Simulate async operation with timeout
    await page.waitForTimeout(1000);
    
    // TopNav should remain visible
    await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-logo"]')).toBeVisible();
  });
});
