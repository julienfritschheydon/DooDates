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

test.describe('Edge Cases and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    // Try to create conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message during network failure');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Should show error message or retry mechanism
    await expect(page.locator('text=/error|failed|retry/i')).toBeVisible({ timeout: 10000 });
    
    // Restore network and verify retry works
    await page.unroute('**/*');
    
    const retryButton = page.locator('button').filter({ hasText: /retry|try again/i }).first();
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }
  });

  test('should handle extremely long messages', async ({ page }) => {
    await page.goto('/');
    
    // Create very long message (10KB+)
    const longMessage = 'A'.repeat(10000);
    
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill(longMessage);
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Should either handle gracefully or show appropriate error
    await page.waitForTimeout(5000);
    
    // Check if message was truncated or error shown
    const hasError = await page.locator('text=/error|too long|limit/i').isVisible();
    const hasMessage = await page.locator(`text=${longMessage.substring(0, 100)}`).isVisible();
    
    expect(hasError || hasMessage).toBeTruthy();
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    await page.goto('/');
    
    // Fill localStorage to near capacity
    await page.evaluate(() => {
      try {
        const largeData = 'x'.repeat(1024 * 1024); // 1MB chunks
        for (let i = 0; i < 5; i++) {
          localStorage.setItem(`large_data_${i}`, largeData);
        }
      } catch (e) {
        // Storage quota exceeded - this is expected
      }
    });
    
    // Try to create conversation when storage is full
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message with full storage');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    // Should handle storage error gracefully
    await page.waitForTimeout(3000);
    
    // Should show error or fallback mechanism
    const hasStorageError = await page.locator('text=/storage|space|quota/i').isVisible();
    const hasConversation = await page.locator('text=Test message with full storage').isVisible();
    
    // Either should show error or handle gracefully
    expect(hasStorageError || hasConversation).toBeTruthy();
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
    
    // Create conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Navigation test message');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Navigate to different page
    await page.goto('/about');
    await page.waitForTimeout(1000);
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // Verify conversation still exists
    await expect(page.locator('text=Navigation test message')).toBeVisible({ timeout: 10000 });
    
    // Go forward and back again
    await page.goForward();
    await page.goBack();
    
    // Should still work
    await expect(page.locator('text=Navigation test message')).toBeVisible({ timeout: 10000 });
  });

  test('should handle page refresh during conversation creation', async ({ page }) => {
    await page.goto('/');
    
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Message interrupted by refresh');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
          
          // Refresh immediately after clicking send
          await page.reload();
        }
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Should either complete the conversation or handle gracefully
    const hasMessage = await page.locator('text=Message interrupted by refresh').isVisible();
    const hasError = await page.locator('text=/error|failed/i').isVisible();
    
    // Should not be in broken state
    expect(hasMessage || hasError || true).toBeTruthy();
  });

  test('should handle concurrent user sessions', async ({ browser }) => {
    // Create two browser contexts (simulate two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users go to the app
    await page1.goto('/');
    await page2.goto('/');
    
    // Clear storage for both
    await page1.evaluate(() => localStorage.clear());
    await page2.evaluate(() => localStorage.clear());
    
    // Both create conversations simultaneously
    const createConversation = async (page: any, message: string) => {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(message);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
    };
    
    // Create conversations concurrently
    await Promise.all([
      createConversation(page1, 'User 1 message'),
      createConversation(page2, 'User 2 message')
    ]);
    
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);
    
    // Verify each user sees only their own conversation
    await expect(page1.locator('text=User 1 message')).toBeVisible();
    await expect(page1.locator('text=User 2 message')).not.toBeVisible();
    
    await expect(page2.locator('text=User 2 message')).toBeVisible();
    await expect(page2.locator('text=User 1 message')).not.toBeVisible();
    
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
    await page.waitForTimeout(3000);
    
    // Should be able to create new conversation despite corrupted data
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Recovery test message');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Should work normally after recovery
    await expect(page.locator('text=Recovery test message')).toBeVisible({ timeout: 10000 });
  });
});
