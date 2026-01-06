import { Page, expect } from "@playwright/test";
import { waitForElementReady, waitForReactStable, waitForNetworkIdle } from "./wait-helpers";
import { type BrowserName } from "./poll-core-helpers";
import { safeIsVisible } from "./safe-helpers";

/**
 * Centralized helpers for Dashboard verification.
 * Provides robust scanning patterns to reduce flakiness.
 */

export interface VerifyDashboardPollOptions {
  route?: string; // e.g. "/dashboard", "/date/dashboard"
  title?: string;
  slug?: string;
  visible?: boolean; // default: true
  timeout?: number;
}

/**
 * Standard robust verification for a poll in any dashboard.
 */
export async function verifyPollVisibility(
  page: Page,
  browserName: BrowserName,
  options: VerifyDashboardPollOptions,
): Promise<void> {
  const { route = "/dashboard", title, slug, visible = true, timeout = 10000 } = options;

  if (page.url().indexOf(route) === -1) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }

  await waitForNetworkIdle(page, { browserName });
  await waitForReactStable(page, { browserName });

  if (visible) {
    if (title) {
      await verifyByTitle(page, browserName, title, timeout);
    }
    if (slug) {
      await verifyBySlug(page, browserName, slug, timeout);
    }
  } else {
    if (title) {
      const locator = page.getByText(title);
      await expect(locator).not.toBeVisible({ timeout: 5000 });
    }
    if (slug) {
      const locator = page.locator(`a[href*="/poll/${slug}"]`);
      await expect(locator).not.toBeVisible({ timeout: 5000 });
    }
  }
}

/**
 * Internal helper to verify by title with robust waiting
 */
async function verifyByTitle(
  page: Page,
  browserName: BrowserName,
  title: string,
  timeout: number,
): Promise<void> {
  console.log(`[DASHBOARD] Searching for poll title: "${title}"`);

  // 1. Wait for any poll item to be ready
  await waitForElementReady(page, '[data-testid="poll-item"]', {
    browserName,
    timeout,
  });

  // 2. Generic text scan (robust)
  const pollLocator = page.locator('[data-testid="poll-item"]').filter({ hasText: title }).first();
  await expect(pollLocator).toBeVisible({ timeout });
}

/**
 * Internal helper to verify by slug using the "Robust Scan" pattern
 */
async function verifyBySlug(
  page: Page,
  browserName: BrowserName,
  slug: string,
  timeout: number,
): Promise<void> {
  console.log(`[DASHBOARD] Searching for poll slug: "${slug}"`);

  // 1. Scan poll-items count
  const pollItems = page.locator('[data-testid="poll-item"]');
  const itemCount = await pollItems.count();

  // 2. Deep scan in each item
  for (let i = 0; i < itemCount; i++) {
    const item = pollItems.nth(i);
    const link = item.locator(`a[href*="/poll/${slug}"]`).first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`[DASHBOARD] ✅ Poll slug "${slug}" found in item #${i}`);
      return;
    }
  }

  // 3. Global scan fallback
  const anyLink = page.locator(`a[href*="/poll/${slug}"]`).first();
  if (await anyLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`[DASHBOARD] ✅ Poll slug "${slug}" found via global scan`);
    return;
  }

  // 4. Failure diagnostics
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean),
  );

  console.log(`[DASHBOARD] ❌ Slug "${slug}" not found. Link samples:`, hrefs.slice(0, 5));
  throw new Error(`Poll slug "${slug}" not found in dashboard.`);
}
