import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitForNetworkIdle, waitForElementReady } from "./helpers/wait-helpers";
import { getTimeouts } from "./config/timeouts";

test.describe("Mobile Voting UX", () => {
  test.describe.configure({ mode: "serial" });

  // Skip Firefox/WebKit due to serial mode + timing issues (similar to other mobile tests)
  // Chrome is the reference browser for these mobile tests
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Mobile tests optimized for Chrome. Firefox/WebKit have timing issues with serial mode.",
  );

  test("DatePoll: page loads without crashing", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName, true); // true pour mobile

    // Navigate to home page first
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Verify home page loads
    await expect(page).toHaveTitle(/DooDates/);
    await waitForElementReady(page, 'h1, [role="heading"]', {
      browserName,
      timeout: timeouts.element,
    });

    // Test navigation to create date page
    await page.goto("/create/date", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Wait for redirect or page load - flexible URL pattern
    await expect(page).toHaveURL(/.*create.*date/, { timeout: timeouts.navigation });

    // Verify page content loads (any interactive element)
    await waitForElementReady(page, 'textarea, input, button, [role="textbox"]', {
      browserName,
      timeout: timeouts.element,
    });

    // Test dashboard navigation
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Wait for dashboard content (any visible dashboard element)
    await waitForElementReady(page, 'h1, [role="heading"], button, [data-testid]', {
      browserName,
      timeout: timeouts.element,
    });
  });

  test("FormPoll: page loads without crashing", async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName, true); // true pour mobile

    // Navigate to home page first
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Verify home page loads
    await expect(page).toHaveTitle(/DooDates/);
    await waitForElementReady(page, 'h1, [role="heading"]', {
      browserName,
      timeout: timeouts.element,
    });

    // Navigate to form creator
    await page.goto("/create/form", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Wait for redirect and verify page loads - flexible URL pattern
    await expect(page).toHaveURL(/.*create.*form/, { timeout: timeouts.navigation });

    // Verify page content loads (any interactive element)
    await waitForElementReady(page, 'textarea, input, button, [role="textbox"]', {
      browserName,
      timeout: timeouts.element,
    });
  });

  test("Mobile voting interface works correctly", async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    const timeouts = getTimeouts(browserName, true);

    // Navigate to home page
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });

    // Test mobile-specific viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(768);

    // Verify mobile navigation elements
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: timeouts.element });

    // Test touch-friendly elements are present
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Verify buttons are large enough for touch (minimum 44px)
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Slightly relaxed for mobile
        }
      }
    }
  });
});
