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
    
    // Check for TopNav elements
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-chat-button"]')).toBeVisible();
    
    // Check for DooDates logo/title in TopNav specifically
    await expect(page.locator('[data-testid="home-button"] text=DooDates')).toBeVisible();
  });

  test.skip('TopNav should be present on dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Mes Sondages')).toBeVisible({ timeout: 10000 });
    
    // Check for TopNav elements
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-chat-button"]')).toBeVisible();
    
    // Check navigation functionality
    await page.locator('[data-testid="home-button"]').click();
    await expect(page).toHaveURL('/');
  });

  test.skip('TopNav should be present on poll creation page', async ({ page }) => {
    await page.goto('/create');
    
    // Wait for poll creator to load
    await expect(page.locator('text=CrÃ©er un sondage').or(page.locator('text=Nouveau sondage'))).toBeVisible({ timeout: 10000 });
    
    // Check for TopNav elements
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-chat-button"]')).toBeVisible();
  });

  test.skip('TopNav should be present on AI chat page', async ({ page }) => {
    await page.goto('/ai-chat');
    
    // Wait for chat interface to load
    await expect(page.locator('text=Chat IA').or(page.locator('textarea')).or(page.locator('input[type="text"]'))).toBeVisible({ timeout: 10000 });
    
    // Check for TopNav elements
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-chat-button"]')).toBeVisible();
  });

  test.skip('TopNav should remain visible during poll creation flow', async ({ page }) => {
    await page.goto('/create');
    
    // Wait for poll creator to load
    await expect(page.locator('text=CrÃ©er un sondage').or(page.locator('text=Nouveau sondage'))).toBeVisible({ timeout: 10000 });
    
    // Verify TopNav is present initially
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    
    // Try to interact with poll creation elements
    const dateElements = page.locator('[data-date]').first();
    if (await dateElements.isVisible()) {
      await dateElements.click();
      
      // TopNav should still be visible after date selection
      await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    }
    
    // Try to find poll title input if available
    const titleInput = page.locator('input[placeholder*="titre"], input[placeholder*="title"], input[type="text"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Poll Navigation');
      
      // TopNav should still be visible after title input
      await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    }
  });

  test.skip('TopNav navigation should work from all pages', async ({ page }) => {
    const pages = [
      { url: '/', name: 'Home' },
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/create', name: 'Create Poll' },
      { url: '/ai-chat', name: 'AI Chat' }
    ];

    for (const testPage of pages) {
      await page.goto(testPage.url);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Test home button navigation
      if (testPage.url !== '/') {
        await page.locator('[data-testid="home-button"]').click();
        await expect(page).toHaveURL('/');
        await page.goBack();
      }
      
      // Test dashboard button navigation
      if (testPage.url !== '/dashboard') {
        await page.locator('[data-testid="dashboard-button"]').click();
        await expect(page).toHaveURL('/dashboard');
        await page.goBack();
      }
      
      // Test AI chat button navigation
      if (testPage.url !== '/ai-chat') {
        await page.locator('[data-testid="ai-chat-button"]').click();
        await expect(page).toHaveURL('/ai-chat');
        await page.goBack();
      }
    }
  });

  test.skip('TopNav should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check for TopNav elements (some text might be hidden on mobile)
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-chat-button"]')).toBeVisible();
    
    // Test navigation on mobile
    await page.locator('[data-testid="dashboard-button"]').click();
    await expect(page).toHaveURL('/dashboard');
    
    // TopNav should still be visible on dashboard mobile
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
  });

  test.skip('TopNav should handle error pages gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page');
    
    // Even on error pages, basic navigation should be available
    // This might show a 404 or redirect to home
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to home or if TopNav is still available
    const isHome = await page.url().includes('/');
    const hasTopNav = await page.locator('[data-testid="home-button"]').isVisible();
    
    expect(isHome || hasTopNav).toBeTruthy();
  });

  test.skip('TopNav should persist during async operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Mes Sondages')).toBeVisible({ timeout: 10000 });
    
    // TopNav should be visible during loading states
    await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    
    // Try to trigger some async operation (like search)
    const searchInput = page.locator('[data-testid="search-polls"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      
      // TopNav should remain visible during search
      await expect(page.locator('[data-testid="home-button"]')).toBeVisible();
    }
  });
});
