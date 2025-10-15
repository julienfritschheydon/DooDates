/**
 * E2E Performance Tests
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests performance with large datasets:
 * - Many conversations handling
 * - Large message volumes
 * - Memory usage monitoring
 * - Response time validation
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test.skiptest('should handle large number of conversations efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated user with high limits
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'perf-test-user', email: 'perf@test.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    const startTime = Date.now();
    
    // Create multiple conversations rapidly
    for (let i = 1; i <= 20; i++) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(`Performance test conversation ${i}`);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      // Small delay to prevent overwhelming
      await page.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (30 seconds for 20 conversations)
    expect(totalTime).toBeLessThan(30000);
    
    // Verify conversations are accessible
    const conversationElements = page.locator('[data-testid="conversation"], .conversation');
    const count = await conversationElements.count();
    expect(count).toBeGreaterThan(10); // Should have created multiple conversations
  });

  test.skiptest('should maintain performance with large messages', async ({ page }) => {
    await page.goto('/');
    
    // Create conversation with progressively larger messages
    const messageSizes = [100, 1000, 5000, 10000]; // Characters
    
    for (const size of messageSizes) {
      const startTime = Date.now();
      
      const largeMessage = 'A'.repeat(size) + ` (${size} chars)`;
      
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(largeMessage);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      // Wait for message to be processed
      await expect(page.locator(`text=${size} chars`)).toBeVisible({ timeout: 10000 });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process within reasonable time (5 seconds per message)
      expect(processingTime).toBeLessThan(5000);
    }
  });

  test.skiptest('should handle rapid user interactions without lag', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Rapid clicking and typing simulation
    for (let i = 0; i < 50; i++) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click({ timeout: 100 });
      }
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.type('Quick test', { delay: 10 });
        await messageInput.clear();
      }
      
      // Very short delay
      await page.waitForTimeout(20);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should handle rapid interactions smoothly (under 10 seconds)
    expect(totalTime).toBeLessThan(10000);
    
    // UI should still be responsive
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    await expect(createButton).toBeVisible();
  });

  test.skiptest('should efficiently load existing conversations on startup', async ({ page }) => {
    // Pre-populate localStorage with many conversations
    await page.goto('/');
    await page.evaluate(() => {
      const conversations = [];
      for (let i = 1; i <= 100; i++) {
        conversations.push({
          id: `conv-${i}`,
          title: `Conversation ${i}`,
          messages: [
            { role: 'user', content: `Message ${i}`, timestamp: Date.now() - i * 1000 }
          ],
          createdAt: Date.now() - i * 1000,
          updatedAt: Date.now() - i * 1000
        });
      }
      localStorage.setItem('doodates_conversations', JSON.stringify(conversations));
    });
    
    const startTime = Date.now();
    
    // Reload page to trigger conversation loading
    await page.reload();
    
    // Wait for conversations to load
    await expect(page.locator('text=Conversation 1')).toBeVisible({ timeout: 15000 });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Should load 100 conversations within 15 seconds
    expect(loadTime).toBeLessThan(15000);
    
    // Verify multiple conversations are visible
    const conversationCount = await page.locator('text=/Conversation \\d+/').count();
    expect(conversationCount).toBeGreaterThan(5);
  });

  test.skiptest('should handle memory efficiently with long session', async ({ page }) => {
    await page.goto('/');
    
    // Simulate long user session with many operations
    for (let session = 1; session <= 10; session++) {
      // Create conversation
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(`Long session message ${session}`);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      await page.waitForTimeout(500);
      
      // Navigate around
      await page.reload();
      await page.waitForTimeout(500);
      
      // Check memory usage periodically
      if (session % 5 === 0) {
        const memoryUsage = await page.evaluate(() => {
          return {
            usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
            totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
          };
        });
        
        // Memory should not grow excessively (under 100MB)
        if (memoryUsage.usedJSHeapSize > 0) {
          expect(memoryUsage.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
        }
      }
    }
    
    // App should still be responsive after long session
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    await expect(createButton).toBeVisible();
  });

  test.skiptest('should handle concurrent operations efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'concurrent-test-user', email: 'concurrent@test.com' },
        access_token: 'mock-token'
      }));
    });
    await page.reload();
    
    const startTime = Date.now();
    
    // Simulate concurrent operations
    const operations = [];
    
    for (let i = 1; i <= 10; i++) {
      operations.push(
        (async () => {
          const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
          if (await createButton.isVisible()) {
            await createButton.click();
            
            const messageInput = page.locator('input[type="text"], textarea').first();
            if (await messageInput.isVisible()) {
              await messageInput.fill(`Concurrent message ${i}`);
              
              const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
              if (await sendButton.isVisible()) {
                await sendButton.click();
              }
            }
          }
        })()
      );
    }
    
    // Execute all operations concurrently
    await Promise.all(operations);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should handle concurrent operations efficiently (under 20 seconds)
    expect(totalTime).toBeLessThan(20000);
    
    // Verify some conversations were created
    const conversationElements = page.locator('[data-testid="conversation"], .conversation');
    const count = await conversationElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skiptest('should maintain UI responsiveness during heavy operations', async ({ page }) => {
    await page.goto('/');
    
    // Start heavy operation (create many conversations)
    const heavyOperation = async () => {
      for (let i = 1; i <= 30; i++) {
        const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
        if (await createButton.isVisible()) {
          await createButton.click();
          
          const messageInput = page.locator('input[type="text"], textarea').first();
          if (await messageInput.isVisible()) {
            await messageInput.fill(`Heavy operation message ${i}`);
            
            const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
            if (await sendButton.isVisible()) {
              await sendButton.click();
            }
          }
        }
        await page.waitForTimeout(50);
      }
    };
    
    // Start heavy operation without waiting
    const heavyPromise = heavyOperation();
    
    // Test UI responsiveness during heavy operation
    await page.waitForTimeout(1000); // Let heavy operation start
    
    // UI should still be responsive
    const startTime = Date.now();
    
    const testButton = page.locator('button').first();
    if (await testButton.isVisible()) {
      await testButton.click();
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // UI should respond quickly even during heavy operations (under 2 seconds)
    expect(responseTime).toBeLessThan(2000);
    
    // Wait for heavy operation to complete
    await heavyPromise;
  });
});
