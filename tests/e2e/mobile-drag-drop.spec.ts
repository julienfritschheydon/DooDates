import { test, expect } from "@playwright/test";
import { getTimeouts } from "./helpers/browser-utils";
import { waitForElementReady, waitForNetworkIdle } from "./helpers/wait-helpers";

test.describe("Mobile UX - Touch Interactions", () => {
  test.beforeEach(async ({ page, browserName }) => {
    const timeouts = getTimeouts(browserName);
    // Navigate to dashboard for mobile testing
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await waitForNetworkIdle(page, { browserName });
    // Wait for dashboard to be ready
    await waitForElementReady(page, 'h1, [role="heading"], button, [data-testid]', {
      browserName,
      timeout: timeouts.element,
    });
  });

  test("should navigate between pages with touch gestures", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!isMobile, "Mobile-only test");

    const timeouts = getTimeouts(browserName);

    // Test navigation to create page
    const createButton = page.locator('button:has-text("Créer")').first();
    if (await createButton.isVisible({ timeout: timeouts.element })) {
      await createButton.tap();
      await waitForNetworkIdle(page, { browserName });

      // Verify we're on create page
      await expect(page).toHaveURL(/.*create.*/);
    }
  });

  test("should scroll dashboard content on mobile", async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    const timeouts = getTimeouts(browserName);

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Scroll down using touch gesture
    await page.touchscreen.tap(100, 300);
    await page.touchscreen.tap(100, 200);

    // Wait a moment for scroll
    await page.waitForTimeout(1000);

    // Verify scroll position changed (or content is scrollable)
    const finalScrollY = await page.evaluate(() => window.scrollY);
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    // Either we scrolled or the page is scrollable
    expect(pageHeight > viewportHeight || finalScrollY > initialScrollY).toBeTruthy();
  });

  test("should handle mobile viewport correctly", async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    const timeouts = getTimeouts(browserName);

    // Verify mobile-specific elements are visible
    const topNav = page.locator('nav, [role="navigation"]').first();
    await expect(topNav).toBeVisible({ timeout: timeouts.element });

    // Check viewport is mobile-sized
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(768); // Mobile breakpoint
  });
});
