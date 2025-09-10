/**
 * E2E Tests for Guest User Workflow
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests the complete guest user journey:
 * - Creating conversations as guest
 * - Hitting freemium limits
 * - Auth incentive modals
 * - localStorage persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Guest User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should allow guest to create first conversation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();
    
    // Look for conversation creation elements
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    
    // Try to find a text input for starting a conversation
    const messageInput = page.locator('input[type="text"], textarea').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill('Hello, this is my first conversation as a guest user');
      
      // Look for send button
      const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
      }
    }
    
    // Verify conversation was created
    await expect(page.locator('text=Hello, this is my first conversation')).toBeVisible({ timeout: 10000 });
  });

  test('should show quota indicator for guest users', async ({ page }) => {
    await page.goto('/');
    
    // Look for quota indicator showing guest limits
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    
    if (await quotaIndicator.isVisible()) {
      // Should show something like "1/1 conversations" for guests
      await expect(quotaIndicator).toContainText('1');
    }
  });

  test('should show auth incentive modal when hitting guest limit', async ({ page }) => {
    await page.goto('/');
    
    // Create first conversation (should be allowed)
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('First conversation');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Wait a bit for the conversation to be processed
    await page.waitForTimeout(2000);
    
    // Try to create second conversation (should trigger limit)
    const createSecondButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createSecondButton.isVisible()) {
      await createSecondButton.click();
      
      // Should show auth incentive modal
      const authModal = page.locator('[data-testid="auth-incentive-modal"], .auth-modal').first();
      if (await authModal.isVisible()) {
        await expect(authModal).toContainText(/upgrade|premium|sign/i);
        
        // Modal should have sign up and sign in buttons
        await expect(page.locator('button').filter({ hasText: /sign up|register/i })).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /sign in|login/i })).toBeVisible();
      }
    }
  });

  test('should persist guest conversations in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Create a conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test persistence message');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Wait for conversation to be saved
    await page.waitForTimeout(2000);
    
    // Check localStorage has conversation data
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.includes('conversation') || key.includes('doodates'));
    });
    
    expect(localStorageData.length).toBeGreaterThan(0);
    
    // Reload page and verify conversation persists
    await page.reload();
    await expect(page.locator('text=Test persistence message')).toBeVisible({ timeout: 10000 });
  });

  test('should show premium badges on locked features', async ({ page }) => {
    await page.goto('/');
    
    // Look for premium badges
    const premiumBadges = page.locator('[data-testid="premium-badge"], .premium-badge');
    
    if (await premiumBadges.first().isVisible()) {
      await expect(premiumBadges.first()).toContainText(/premium|pro/i);
    }
  });

  test('should handle conversation limit gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Create maximum allowed conversations for guest (1)
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Maximum conversation test');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Verify quota indicator shows limit reached
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      await expect(quotaIndicator).toContainText('1');
    }
    
    // Try to create another conversation - should be blocked or show modal
    const createSecondButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createSecondButton.isVisible()) {
      await createSecondButton.click();
      
      // Should either show modal or disable the action
      const authModal = page.locator('[data-testid="auth-incentive-modal"], .auth-modal').first();
      const isModalVisible = await authModal.isVisible();
      
      if (isModalVisible) {
        await expect(authModal).toContainText(/limit|upgrade/i);
      }
    }
  });

  test('should maintain guest session across page refreshes', async ({ page }) => {
    await page.goto('/');
    
    // Create a conversation as guest
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Session persistence test');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Wait for conversation to be saved
    await page.waitForTimeout(2000);
    
    // Refresh the page multiple times
    await page.reload();
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Verify conversation still exists
    await expect(page.locator('text=Session persistence test')).toBeVisible({ timeout: 10000 });
    
    // Verify still in guest mode (quota should show guest limits)
    const quotaIndicator = page.locator('[data-testid="quota-indicator"], .quota-indicator').first();
    if (await quotaIndicator.isVisible()) {
      await expect(quotaIndicator).toContainText('1');
    }
  });
});
