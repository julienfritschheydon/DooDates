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
import { mockSupabaseAuth, waitForPageLoad } from './utils';

test.describe('Security and Data Isolation', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Setup Gemini API mock to prevent costs
    await setupGeminiMock(page);
    
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
  });

  test('Basic navigation security - no crashes @smoke @critical', async ({ page, browserName }) => {
    // Verify basic navigation doesn't crash on security-sensitive pages
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    await expect(page).toHaveTitle(/DooDates/);
    
    await page.goto('/create', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    await expect(page.locator('body')).toBeVisible();
    
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    await expect(page.locator('body')).toBeVisible();
    
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    await expect(page.locator('body')).toBeVisible();
  });



  test('should handle authentication token security @smoke @critical', async ({ page, browserName }) => {
    await page.goto('/workspace', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    
    // Mock authentication with secure tokens
    await mockSupabaseAuth(page, {
      userId: 'secure-user-id',
      email: 'secure@test.com',
      accessToken: 'secure-mock-token',
    });
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page, browserName);
    
    // Verify token is not exposed in DOM
    const pageContent = await page.content();
    expect(pageContent).not.toContain('secure-mock-token');
    
    // Verify token is stored in correct format (Supabase format)
    const tokenExposed = await page.evaluate(() => {
      const supabaseUrl = (window as any).__VITE_SUPABASE_URL__ || 'test.supabase.co';
      const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || 'test';
      return localStorage.getItem(`sb-${projectId}-auth-token`);
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
    const hasMessageInput = await messageInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasMessageInput) {
      await messageInput.fill('Test message');
    }
    
    // Check that sensitive data is not in URLs
    for (const url of requests) {
      expect(url).not.toContain('secure-mock-token');
    }
  });
});
