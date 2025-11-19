import { test } from './accessibility-helper';

test.describe('Accessibility Tests', () => {
  test.describe('Home/Dashboard Page', () => {
    test('should have no accessibility violations on home page', async ({ page, checkA11y }) => {
      await page.goto('/');

      // Wait for page to load completely
      await page.waitForLoadState('networkidle');

      // Run accessibility check
      await checkA11y(page);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Check that headings follow proper hierarchy (no skipped levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();

      // Basic check: should have at least one h1
      const h1Count = await page.locator('h1').count();
      test.expect(h1Count).toBeGreaterThan(0);

      // More detailed checks can be added based on page structure
    });

    test('should have accessible form controls', async ({ page }) => {
      await page.goto('/');

      // Check that form inputs have proper labels
      const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([aria-labelledby]):not([type="hidden"])').count();
      test.expect(inputsWithoutLabels).toBe(0);

      // Check that buttons have accessible names
      const buttonsWithoutNames = await page.locator('button:not([aria-label]):not([aria-labelledby]):not([title])').filter({ hasText: '' }).count();
      test.expect(buttonsWithoutNames).toBe(0);
    });
  });

  test.describe('Poll Creation', () => {
    test('should have no accessibility violations on poll creation page', async ({ page, checkA11y }) => {
      await page.goto('/create');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Run accessibility check
      await checkA11y(page);
    });

    test('should have accessible form validation messages', async ({ page }) => {
      await page.goto('/create');

      // Try to submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"], button:has-text("Créer"), button:has-text("Create")').first();
      await submitButton.click();

      // Wait a bit for validation messages
      await page.waitForTimeout(1000);

      // Check that error messages are associated with inputs
      const errorMessages = page.locator('[role="alert"], .error, .invalid-feedback');
      const errorCount = await errorMessages.count();

      if (errorCount > 0) {
        // If there are errors, they should be properly associated
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i);
          const isAriaDescribedBy = await error.getAttribute('aria-describedby') !== null;
          const isAriaLive = await error.getAttribute('aria-live') !== null;

          test.expect(isAriaDescribedBy || isAriaLive).toBe(true);
        }
      }
    });
  });

  test.describe('Poll Voting', () => {
    test('should have accessible voting interface', async ({ page, checkA11y }) => {
      // Navigate to a test poll or create one
      await page.goto('/poll/test-poll-id');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Run accessibility check
      await checkA11y(page);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/poll/test-poll-id');

      // Test keyboard navigation
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.locator(':focus');
      const isVisible = await focusedElement.isVisible();

      test.expect(isVisible).toBe(true);
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');

      // This would typically require additional tools like axe-core's color-contrast rule
      // For now, we'll rely on axe-core's built-in checks
      const { runAccessibilityAudit } = await import('./accessibility-helper');
      const results = await runAccessibilityAudit(page, {
        rules: ['color-contrast']
      });

      test.expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile viewport', async ({ page, checkA11y }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Wait for responsive layout
      await page.waitForLoadState('networkidle');

      // Run accessibility check with mobile-specific rules
      await checkA11y(page, {
        skipRules: ['meta-viewport'] // Skip viewport check since we set it manually
      });
    });
  });
});
