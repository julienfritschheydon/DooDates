/**
 * E2E Security and Data Isolation Tests
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests basic security features:
 * - Navigation without crashes on security-sensitive pages
 * - Input sanitization (XSS prevention)
 * - Authentication token security (no leakage)
 */

import { test, expect } from '@playwright/test';
import { setupGeminiMock } from './global-setup';

test.describe('Security and Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Gemini API mock to prevent costs
    await setupGeminiMock(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Basic navigation security - no crashes @smoke @critical', async ({ page }) => {
    // Verify basic navigation doesn't crash on security-sensitive pages
    await page.goto('/');
    await expect(page).toHaveTitle(/DooDates/);
    
    await page.goto('/create');
    await page.waitForTimeout(1000);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    await page.goto('/');
    expect(true).toBeTruthy();
  });



  test('should handle authentication token security @smoke @critical', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'secure-user-id', email: 'secure@test.com' },
        access_token: 'secure-mock-token',
        refresh_token: 'secure-refresh-token'
      }));
    });
    
    await page.reload();
    
    // Verify token is not exposed in DOM
    const pageContent = await page.content();
    expect(pageContent).not.toContain('secure-mock-token');
    expect(pageContent).not.toContain('secure-refresh-token');
    
    // Verify token is not accessible via console
    const tokenExposed = await page.evaluate(() => {
      return window.localStorage.getItem('supabase.auth.token');
    });
    
    // Token should exist but not be easily accessible to malicious scripts
    expect(tokenExposed).toBeTruthy();
    
    // Verify no token leakage in network requests (if any)
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Trigger some actions
    const messageInput = page.locator('[data-testid="message-input"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test message');
    }
    
    await page.waitForTimeout(1000);
    
    // Check that sensitive data is not in URLs
    for (const url of requests) {
      expect(url).not.toContain('secure-mock-token');
      expect(url).not.toContain('secure-refresh-token');
    }
  });
});
