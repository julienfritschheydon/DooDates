import { test, expect } from '@playwright/test';
import { getTimeouts } from './helpers/browser-utils';
import { waitForElementReady } from './helpers/wait-helpers';

test.describe('Mobile Drag and Drop', () => {
  test.beforeEach(async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // Utiliser la route /create/date qui est définie dans l'application
    await page.goto("/create/date");
    await waitForElementReady(page, '[data-testid="draggable-item"]', { 
      browserName, 
      timeout: timeouts.element 
    });
  });

  test('should reorder items with drag and drop', async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    const timeouts = getTimeouts(browserName);
    const firstItem = page.locator('[data-testid="draggable-item"]').first();
    const thirdItem = page.locator('[data-testid="draggable-item"]').nth(2);
    
    // Get initial order
    const firstItemText = await firstItem.textContent();
    const thirdItemText = await thirdItem.textContent();
    
    // Perform drag and drop
    await firstItem.hover();
    await page.mouse.down();
    
    // Move to the position after the third item
    const thirdItemBox = await thirdItem.boundingBox();
    if (thirdItemBox) {
      await page.mouse.move(
        thirdItemBox.x + thirdItemBox.width / 2,
        thirdItemBox.y + thirdItemBox.height / 2,
        { steps: 10 }
      );
    }
    
    await page.mouse.up();
    
    // Verify the order has changed
    const newFirstItemText = await page.locator('[data-testid="draggable-item"]').first().textContent();
    expect(newFirstItemText).not.toBe(firstItemText);
  });

  test('should show visual feedback during drag', async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    const firstItem = page.locator('[data-testid="draggable-item"]').first();
    
    // Start dragging
    await firstItem.hover();
    await page.mouse.down();
    
    // Verify visual feedback
    await expect(page.locator(".drag-preview")).toBeVisible();
    
    // Clean up
    await page.mouse.up();
  });
});
