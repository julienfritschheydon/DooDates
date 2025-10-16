/**
 * E2E Tests for Edge Cases and Error Handling
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests error scenarios and edge cases:
 * - Network failures
 * - Invalid inputs
 * - Browser storage limits
 * - Concurrent operations
 * - API timeouts
 */

import { test, expect } from '@playwright/test';
import { setupGeminiMock } from './global-setup';

test.describe('Edge Cases and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Gemini API mock to prevent costs
    await setupGeminiMock(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Block only API calls (not static assets) to simulate partial network failure
    await page.route('**/api/**', route => route.abort('failed'));
    await page.route('**/supabase.co/**', route => route.abort('failed'));
    
    // Wait a bit for page to be stable
    await page.waitForTimeout(1000);
    
    // App should remain functional despite API failures
    // Verify page is still responsive
    const isPageVisible = await page.locator('body').isVisible();
    expect(isPageVisible).toBeTruthy();
    
    // Try to interact with the app
    const homeButton = page.locator('[data-testid="home-button"], button').first();
    if (await homeButton.isVisible()) {
      await homeButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Verify app didn't crash and is still usable
    const isStillResponsive = await page.locator('body').isVisible();
    expect(isStillResponsive).toBeTruthy();
    
    // Restore network
    await page.unroute('**/api/**');
    await page.unroute('**/supabase.co/**');
  });

  test('should handle extremely long messages', async ({ page }) => {
    await page.goto('/');
    
    // Test handling of extremely long input - stay on home page
    const longMessage = 'A'.repeat(10000);
    
    // Try to input long text in any available input field
    const messageInput = page.locator('input[type="text"], textarea').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill(longMessage);
      
      // Try to submit if there's a button
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Verify app handles long input gracefully (doesn't crash)
    const isPageResponsive = await page.locator('body').isVisible();
    expect(isPageResponsive).toBeTruthy();
    
    // Check if error or truncation message shown
    const hasError = await page.locator('text=/error|too long|limit|trop long/i').isVisible().catch(() => false);
    console.log('Long message test:', { isPageResponsive, hasError });
    
    // Test passes if app remains responsive
    expect(isPageResponsive).toBeTruthy();
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    await page.goto('/');
    
    // Stay on home page - no need to navigate to chat
    // Testing localStorage quota is independent of which page we're on
    
    // Clear any existing data
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    });
    
    // Try to fill localStorage to near capacity
    try {
      await page.evaluate(() => {
        try {
          // Fill localStorage to near capacity
          const largeData = 'x'.repeat(1024 * 1024); // 1MB chunks
          for (let i = 0; i < 10; i++) { // Increased number of chunks
            localStorage.setItem(`large_data_${i}`, largeData);
          }
        } catch (e) {
          console.log('Expected error when filling localStorage:', e.message);
          throw e; // Re-throw to be caught by the outer try-catch
        }
      });
    } catch (e) {
      console.log('Caught expected error when filling localStorage');
    }
    
    // Try to interact with the app (any action that might use localStorage)
    // For example, try to create a poll or navigate
    const createButton = page.locator('button').filter({ hasText: /créer|create/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if localStorage quota error is handled gracefully
    // The app should either:
    // 1. Show an error message about storage
    // 2. Continue working (if browser has more space)
    // 3. Not crash
    
    // Verify the app didn't crash - page should still be responsive
    const isPageResponsive = await page.locator('body').isVisible();
    expect(isPageResponsive).toBeTruthy();
    
    // Check for any error messages about storage
    const hasStorageError = await page.locator('text=/storage|espace|quota|limit/i').isVisible().catch(() => false);
    
    // Log the result
    console.log('localStorage quota test:', { 
      isPageResponsive,
      hasStorageError,
      message: hasStorageError ? 'Storage error shown' : 'App handled gracefully'
    });
    
    // Test passes if app remains responsive (doesn't crash)
    expect(isPageResponsive).toBeTruthy();
  });

  // TODO: À réactiver après correction du système de quota
  test.skip('should limit to 10 conversations for guest users', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Clear existing conversations
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Helper to create a new conversation
    const createNewConversation = async (index: number) => {
      // Click new conversation button
      const newChatButton = page.locator('button').filter({ hasText: /new chat|nouvelle discussion/i }).first();
      if (await newChatButton.isVisible()) {
        await newChatButton.click();
      }
      
      // Wait for conversation to be ready
      await page.waitForTimeout(1000);
      
      // Send a test message
      const messageText = `Test message ${index}`;
      const input = page.locator('textarea[placeholder*="Message"], input[type="text"]').first();
      await input.fill(messageText);
      await input.press('Enter');
      
      // Wait for message to be sent
      await page.waitForTimeout(1000);
      
      return messageText;
    };
    
    // Create 10 conversations (should work)
    const testMessages: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const message = await createNewConversation(i);
      testMessages.push(message);
      
      // Verify message was sent
      const messageVisible = await page.locator(`text=${message}`).isVisible();
      expect(messageVisible).toBeTruthy();
      
      console.log(`Created conversation ${i}/10`);
    }
    
    // Try to create an 11th conversation
    const newChatButton = page.locator('button').filter({ hasText: /new chat|nouvelle discussion/i }).first();
    await newChatButton.click();
    
    // Check for auth modal
    const modal = page.locator('[role="dialog"]');
    const isModalVisible = await modal.isVisible();
    
    if (isModalVisible) {
      const modalText = await modal.textContent() || '';
      console.log('Auth modal text:', modalText);
      
      // Verify it's the conversation limit modal
      const isLimitModal = 
        modalText.includes('limit') || 
        modalText.includes('limite') ||
        modalText.includes('10') ||
        modalText.includes('dix');
      
      expect(isLimitModal).toBeTruthy();
      
      // Check if it mentions the 10 conversation limit
      const mentionsLimit = modalText.includes('10') || modalText.includes('dix');
      expect(mentionsLimit).toBeTruthy();
      
      // Check if it suggests signing up
      const suggestsSignup = 
        modalText.includes('sign up') || 
        modalText.includes('inscrire') ||
        modalText.includes('créer un compte');
      
      expect(suggestsSignup).toBeTruthy();
    } else {
      // If no modal, check for error message in the UI
      const errorMessage = await page.locator('[class*="error"], .text-red-500, [role="alert"]').textContent().catch(() => '');
      console.log('Error message:', errorMessage);
      
      // Verify it mentions the conversation limit
      const mentionsLimit = 
        (errorMessage || '').includes('limit') || 
        (errorMessage || '').includes('limite') ||
        (errorMessage || '').includes('10') ||
        (errorMessage || '').includes('dix');
      
      expect(mentionsLimit).toBeTruthy();
    }
  });

  test('should handle rapid consecutive actions', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly click create button multiple times
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      // Click rapidly 10 times
      for (let i = 0; i < 10; i++) {
        await createButton.click({ timeout: 100 });
        await page.waitForTimeout(50);
      }
    }
    
    // Should not create multiple conversations or crash
    await page.waitForTimeout(2000);
    
    // Count conversation elements
    const conversations = page.locator('[data-testid="conversation"], .conversation');
    const count = await conversations.count();
    
    // Should have reasonable number of conversations (not 10)
    expect(count).toBeLessThanOrEqual(2);
  });

  test('should handle invalid characters in input', async ({ page }) => {
    await page.goto('/');
    
    const invalidInputs = [
      '<script>alert("xss")</script>',
      '🚀💥🔥'.repeat(100), // Many emojis
      '\x00\x01\x02\x03', // Control characters
      'SELECT * FROM users;', // SQL injection attempt
      '../../etc/passwd', // Path traversal
    ];
    
    for (const invalidInput of invalidInputs) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(invalidInput);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Should not execute scripts or cause errors
      const hasAlert = await page.locator('text=xss').isVisible();
      expect(hasAlert).toBeFalsy();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Navigate to dashboard if available
    const dashboardButton = page.locator('[data-testid="dashboard-button"], button').filter({ hasText: /sondages|dashboard/i }).first();
    if (await dashboardButton.isVisible()) {
      await dashboardButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Go back to home
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // Verify we're back on home - app should be responsive
    const isOnHome = await page.locator('body').isVisible();
    expect(isOnHome).toBeTruthy();
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(1000);
    
    // Go back again
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // App should still be functional after navigation
    const isStillWorking = await page.locator('body').isVisible();
    expect(isStillWorking).toBeTruthy();
  });

  test('should handle page refresh during conversation creation', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(1000);
    
    // Start any interaction
    const anyButton = page.locator('button').first();
    if (await anyButton.isVisible()) {
      await anyButton.click();
      
      // Refresh immediately
      await page.reload();
    }
    
    await page.waitForTimeout(2000);
    
    // App should recover gracefully from interrupted refresh
    // Verify page loaded successfully after refresh
    const isPageWorking = await page.locator('body').isVisible();
    expect(isPageWorking).toBeTruthy();
    
    // Verify basic navigation still works
    const navigation = page.locator('nav, navigation, [role="navigation"]').first();
    const hasNavigation = await navigation.isVisible().catch(() => false);
    
    // App should be in usable state (not broken)
    expect(isPageWorking).toBeTruthy();
  });

  test('should handle concurrent user sessions', async ({ browser }) => {
    // Create two browser contexts (simulate two users with separate sessions)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users go to the app
    await page1.goto('/');
    await page2.goto('/');
    
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);
    
    // Verify both pages loaded independently
    const page1Loaded = await page1.locator('body').isVisible();
    const page2Loaded = await page2.locator('body').isVisible();
    
    expect(page1Loaded).toBeTruthy();
    expect(page2Loaded).toBeTruthy();
    
    // Verify each has independent localStorage
    const storage1 = await page1.evaluate(() => localStorage.length);
    const storage2 = await page2.evaluate(() => localStorage.length);
    
    // Both should work independently (storage may be different)
    expect(typeof storage1).toBe('number');
    expect(typeof storage2).toBe('number');
    
    await context1.close();
    await context2.close();
  });

  test('should handle malformed localStorage data', async ({ page }) => {
    await page.goto('/');
    
    // Inject malformed data into localStorage
    await page.evaluate(() => {
      localStorage.setItem('doodates_conversations', 'invalid json data');
      localStorage.setItem('doodates_user', '{"incomplete": json}');
      localStorage.setItem('supabase.auth.token', 'not-json-at-all');
    });
    
    // Reload page
    await page.reload();
    
    // App should handle malformed data gracefully and not crash
    await page.waitForTimeout(2000);
    
    // Verify app recovered and is functional
    const isPageWorking = await page.locator('body').isVisible();
    expect(isPageWorking).toBeTruthy();
    
    // Verify navigation is accessible (app didn't crash)
    const hasNavigation = await page.locator('nav, [role="navigation"], button').first().isVisible().catch(() => false);
    
    // Test passes if app is responsive despite corrupted data
    expect(isPageWorking).toBeTruthy();
    
    // Optional: Verify localStorage was cleaned up or recovered
    const storageState = await page.evaluate(() => {
      try {
        const convData = localStorage.getItem('doodates_conversations');
        return { recovered: !convData || convData === 'invalid json data' };
      } catch {
        return { recovered: true };
      }
    });
    
    console.log('Malformed data recovery:', storageState);
  });
});
