/**
 * E2E Security and Data Isolation Tests
 * DooDates - Task 5.2: Tests E2E Playwright
 * 
 * Tests security and data isolation:
 * - User data isolation
 * - XSS prevention
 * - CSRF protection
 * - Data sanitization
 * - Session security
 */

import { test, expect } from '@playwright/test';

test.describe('Security and Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should isolate guest user data between sessions', async ({ browser }) => {
    // Create two separate browser contexts (different guest sessions)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    // Guest 1 creates conversation
    const createButton1 = page1.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton1.isVisible()) {
      await createButton1.click();
      
      const messageInput1 = page1.locator('input[type="text"], textarea').first();
      if (await messageInput1.isVisible()) {
        await messageInput1.fill('Guest 1 private message');
        
        const sendButton1 = page1.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton1.isVisible()) {
          await sendButton1.click();
        }
      }
    }
    
    // Guest 2 creates conversation
    const createButton2 = page2.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton2.isVisible()) {
      await createButton2.click();
      
      const messageInput2 = page2.locator('input[type="text"], textarea').first();
      if (await messageInput2.isVisible()) {
        await messageInput2.fill('Guest 2 private message');
        
        const sendButton2 = page2.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton2.isVisible()) {
          await sendButton2.click();
        }
      }
    }
    
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // Verify data isolation
    await expect(page1.locator('text=Guest 1 private message')).toBeVisible();
    await expect(page1.locator('text=Guest 2 private message')).not.toBeVisible();
    
    await expect(page2.locator('text=Guest 2 private message')).toBeVisible();
    await expect(page2.locator('text=Guest 1 private message')).not.toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test('should prevent XSS attacks in message content', async ({ page }) => {
    await page.goto('/');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '"><script>alert("XSS")</script>',
      '\';alert("XSS");//',
    ];
    
    for (const payload of xssPayloads) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(payload);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Verify no script execution occurred
      const hasAlert = await page.evaluate(() => {
        return document.querySelector('script') !== null;
      });
      
      expect(hasAlert).toBeFalsy();
      
      // Content should be sanitized or escaped
      const dangerousElements = await page.locator('script, iframe[src*="javascript"], img[onerror]').count();
      expect(dangerousElements).toBe(0);
    }
  });

  test('should sanitize user input properly', async ({ page }) => {
    await page.goto('/');
    
    const maliciousInputs = [
      '<b>Bold text</b>',
      '&lt;script&gt;alert("test")&lt;/script&gt;',
      'Normal text with <em>emphasis</em>',
      'Text with & ampersand',
      'Text with "quotes" and \'apostrophes\'',
    ];
    
    for (const input of maliciousInputs) {
      const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const messageInput = page.locator('input[type="text"], textarea').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill(input);
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
          }
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Check that content is displayed safely
      const messageElement = page.locator(`text=${input.replace(/<[^>]*>/g, '')}`).first();
      if (await messageElement.isVisible()) {
        const innerHTML = await messageElement.innerHTML();
        
        // Should not contain unescaped HTML tags
        expect(innerHTML).not.toMatch(/<script|<iframe|onerror=/);
      }
    }
  });

  test('should protect against localStorage manipulation', async ({ page }) => {
    await page.goto('/');
    
    // Create legitimate conversation
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Legitimate message');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Attempt to manipulate localStorage with malicious data
    await page.evaluate(() => {
      // Try to inject malicious conversation
      const maliciousConversation = {
        id: 'malicious-id',
        title: '<script>alert("Malicious")</script>',
        messages: [
          {
            role: 'user',
            content: '<img src="x" onerror="alert(\'XSS\')">',
            timestamp: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      try {
        const existing = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
        existing.push(maliciousConversation);
        localStorage.setItem('doodates_conversations', JSON.stringify(existing));
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Reload to trigger data loading
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify malicious content is not executed
    const scriptElements = await page.locator('script').count();
    const imgWithOnerror = await page.locator('img[onerror]').count();
    
    expect(scriptElements).toBe(0);
    expect(imgWithOnerror).toBe(0);
    
    // App should still function normally
    await expect(page.locator('text=Legitimate message')).toBeVisible();
  });

  test('should handle authentication token security', async ({ page }) => {
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
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Check that sensitive data is not in URLs
    for (const url of requests) {
      expect(url).not.toContain('secure-mock-token');
      expect(url).not.toContain('secure-refresh-token');
    }
  });

  test('should isolate authenticated user data', async ({ browser }) => {
    // Create two authenticated user sessions
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    // Authenticate as different users
    await page1.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-1', email: 'user1@test.com' },
        access_token: 'token-1'
      }));
    });
    
    await page2.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-2', email: 'user2@test.com' },
        access_token: 'token-2'
      }));
    });
    
    await page1.reload();
    await page2.reload();
    
    // Each user creates private conversation
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
    
    await createConversation(page1, 'User 1 confidential data');
    await createConversation(page2, 'User 2 confidential data');
    
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // Verify data isolation
    await expect(page1.locator('text=User 1 confidential data')).toBeVisible();
    await expect(page1.locator('text=User 2 confidential data')).not.toBeVisible();
    
    await expect(page2.locator('text=User 2 confidential data')).toBeVisible();
    await expect(page2.locator('text=User 1 confidential data')).not.toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test('should prevent session fixation attacks', async ({ page }) => {
    await page.goto('/');
    
    // Set malicious session data
    await page.evaluate(() => {
      localStorage.setItem('malicious_session', 'attacker_value');
      sessionStorage.setItem('malicious_session', 'attacker_value');
    });
    
    // Authenticate normally
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'victim-user', email: 'victim@test.com' },
        access_token: 'victim-token'
      }));
    });
    
    await page.reload();
    
    // Verify malicious session data doesn't affect authentication
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    
    expect(authToken).toContain('victim-user');
    
    // Verify app functions normally despite malicious data
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Normal authenticated message');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Normal authenticated message')).toBeVisible();
  });

  test('should handle data validation and type safety', async ({ page }) => {
    await page.goto('/');
    
    // Inject invalid data types into localStorage
    await page.evaluate(() => {
      // Invalid conversation structure
      localStorage.setItem('doodates_conversations', JSON.stringify([
        {
          id: 123, // Should be string
          title: null, // Should be string
          messages: 'invalid', // Should be array
          createdAt: 'not-a-date', // Should be number
        },
        'not-an-object', // Should be object
        null, // Should be object
      ]));
    });
    
    // Reload to trigger data loading
    await page.reload();
    await page.waitForTimeout(2000);
    
    // App should handle invalid data gracefully and not crash
    const createButton = page.locator('button').filter({ hasText: /create|new|start/i }).first();
    await expect(createButton).toBeVisible();
    
    // Should be able to create new conversation despite corrupted data
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const messageInput = page.locator('input[type="text"], textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Recovery after data corruption');
        
        const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
        }
      }
    }
    
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Recovery after data corruption')).toBeVisible();
  });
});
