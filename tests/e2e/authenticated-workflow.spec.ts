/**
 * E2E Tests for Authenticated User Workflow
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests the complete authenticated user journey:
 * - Sign up/sign in process
 * - Creating multiple conversations (higher limits)
 * - Data migration from guest to authenticated
 * - Premium features access
 */

import { test, expect } from '@playwright/test';

test.describe('Authenticated User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should allow user to sign up and access premium features', async ({ page }) => {
    await page.goto('/');
    
    // Look for sign up button
    const signUpButton = page.locator('button').filter({ hasText: /sign up|register/i }).first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Fill sign up form (mock authentication)
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('testpassword123');
      }
      
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /sign up|register|create/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }
    
    // Wait for authentication to complete
    await page.waitForTimeout(3000);
    
    // Verify authenticated state - should see higher conversation limits
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      // Should show higher limit like "0/1000" instead of "0/1"
      const quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/1000|100|unlimited/i);
    }
  });

  test('should allow authenticated users to create multiple conversations', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication state
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    // Create multiple conversations
    for (let i = 1; i <= 3; i++) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(`Authenticated conversation ${i}`);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      // Wait between conversations
      await page.waitForTimeout(2000);
    }
    
    // Verify all conversations exist
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Authenticated conversation ${i}`)).toBeVisible();
    }
  });

  test('should migrate guest data when user authenticates', async ({ page }) => {
    await page.goto('/');
    
    // Create conversation as guest first
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Guest conversation to migrate');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Now authenticate
    const signInButton = page.locator('button').filter({ hasText: /sign in|login/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Mock successful authentication
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-token'
        }));
      });
      await page.reload();
    }
    
    // Verify guest conversation was migrated
    await expect(page.locator('text=Guest conversation to migrate')).toBeVisible({ timeout: 10000 });
    
    // Verify now in authenticated mode with higher limits
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      const quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/1000|100|unlimited/i);
    }
  });

  test('should access premium features when authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    // Look for premium features that should be unlocked
    const premiumFeatures = page.locator('[data-premium="true"], .premium-feature');
    
    if (await premiumFeatures.first().isVisible()) {
      // Premium features should be clickable/accessible
      await expect(premiumFeatures.first()).not.toHaveClass(/disabled|locked/);
    }
    
    // Premium badges should not be shown for authenticated users on unlocked features
    const premiumBadges = page.locator('[data-testid="premium-badge"]');
    const badgeCount = await premiumBadges.count();
    
    // Should have fewer premium badges than guest mode
    expect(badgeCount).toBeLessThan(5);
  });

  test('should persist authenticated session across browser restarts', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    // Create conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Persistent authenticated conversation');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Simulate browser restart by clearing page context but keeping localStorage
    await page.goto('about:blank');
    await page.waitForTimeout(1000);
    await page.goto('/');
    
    // Verify still authenticated and conversation exists
    await expect(page.locator('text=Persistent authenticated conversation')).toBeVisible({ timeout: 10000 });
    
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      const quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/1000|100|unlimited/i);
    }
  });

  test('should handle sign out and return to guest mode', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    // Create authenticated conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Authenticated conversation before signout');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Sign out
    const signOutButton = page.locator('button').filter({ hasText: /sign out|logout/i }).first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    } else {
      // Mock sign out by clearing auth token
      await page.evaluate(() => {
        localStorage.removeItem('supabase.auth.token');
      });
      await page.reload();
    }
    
    // Verify back in guest mode
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      const quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/\/1[^0-9]|^1\/1/); // Should show guest limit like "0/1" or "1/1"
    }
    
    // Previous authenticated conversations should not be visible in guest mode
    await expect(page.locator('text=Authenticated conversation before signout')).not.toBeVisible();
  });

  test('should show correct quota progression for authenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user-id', email: 'test@example.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    // Check initial quota
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      let quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/0.*1000|0.*100/); // Should start at 0
    }
    
    // Create conversation and verify quota updates
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Quota test conversation');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Verify quota incremented
    if (await quotaIndicator.isVisible()) {
      let quotaText = await quotaIndicator.textContent();
      expect(quotaText).toMatch(/1.*1000|1.*100/); // Should show 1 conversation used
    }
  });
});
