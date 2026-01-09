/**
 * Standardized RGPD helpers with TestContext interface
 * Provides backward compatibility while migrating to the new pattern
 */

import { Page } from "@playwright/test";
import { getTestSupabaseClient } from "./supabase-test-helpers";
import type { TestContext } from "./test-context";
import {
  dismissOnboarding as dismissOnboardingOriginal,
  navigateToDataControl as navigateToDataControlOriginal,
  triggerDataExport as triggerDataExportOriginal,
  navigateToSettings as navigateToSettingsOriginal,
  triggerAccountDeletion as triggerAccountDeletionOriginal,
  waitForDownload as waitForDownloadOriginal,
} from "./rgpd-helpers";

/**
 * Helper to dismiss onboarding if present
 * @deprecated Use dismissOnboardingWithContext instead. Migration in progress.
 */
export async function dismissOnboarding(page: Page): Promise<void> {
  return dismissOnboardingWithContext({ page, browserName: "chromium" });
}

/**
 * Standardized version with TestContext
 */
export async function dismissOnboardingWithContext(context: TestContext): Promise<void> {
  const { page } = context;
  try {
    const skipButton = page
      .locator(
        '[data-testid="skip-intro"], button:has-text("Passer l\'intro"), button:has-text("Skip intro")',
      )
      .first();
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
      await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
    }
  } catch (e) {
    // Ignore errors if button not found
  }
}

/**
 * Navigate to the data control page
 * @deprecated Use navigateToDataControlWithContext instead. Migration in progress.
 */
export async function navigateToDataControl(page: Page): Promise<void> {
  return navigateToDataControlWithContext({ page, browserName: "chromium" });
}

/**
 * Standardized version with TestContext
 */
export async function navigateToDataControlWithContext(context: TestContext): Promise<void> {
  const { page } = context;
  // Capture browser logs to terminal for white screen debugging
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[RGPD-DEBUG]")) {
      console.log(`[BROWSER-RGPD] ${msg.type()}: ${text}`);
    }
  });

  await page.goto("/data-control", { waitUntil: "domcontentloaded" });
}

/**
 * Trigger data export from the UI
 * @deprecated Use triggerDataExportWithContext instead. Migration in progress.
 */
export async function triggerDataExport(page: Page): Promise<void> {
  return triggerDataExportWithContext({ page, browserName: "chromium" });
}

/**
 * Standardized version with TestContext
 */
export async function triggerDataExportWithContext(context: TestContext): Promise<void> {
  const { page } = context;
  // Find and click the export button - try multiple selectors
  const exportButton = page
    .locator(
      'button:has-text("Exporter"), button:has-text("Export"), button:has-text("Télécharger"), [data-testid="export-button"]',
    )
    .first();

  if (await exportButton.isVisible({ timeout: 5000 })) {
    await exportButton.click();
    console.log("[RGPD] Data export triggered");
  } else {
    console.log("[RGPD] Export button not found, trying alternative selectors");
    // Try alternative selectors
    const altButton = page
      .locator("button")
      .filter({ hasText: /export|télécharger/i })
      .first();
    if (await altButton.isVisible({ timeout: 3000 })) {
      await altButton.click();
      console.log("[RGPD] Data export triggered via alternative selector");
    }
  }
}

/**
 * Navigate to settings page for profile modification
 * @deprecated Use navigateToSettingsWithContext instead. Migration in progress.
 */
export async function navigateToSettings(page: Page): Promise<void> {
  return navigateToSettingsWithContext({ page, browserName: "chromium" });
}

/**
 * Standardized version with TestContext
 */
export async function navigateToSettingsWithContext(context: TestContext): Promise<void> {
  const { page } = context;
  // Capture browser logs for debugging
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[SETTINGS-DEBUG]")) {
      console.log(`[BROWSER-SETTINGS] ${msg.type()}: ${text}`);
    }
  });

  await page.goto("/date/settings", { waitUntil: "domcontentloaded" });
}

/**
 * Trigger account deletion from the UI
 * @deprecated Use triggerAccountDeletionWithContext instead. Migration in progress.
 */
export async function triggerAccountDeletion(page: Page): Promise<void> {
  return triggerAccountDeletionWithContext({ page, browserName: "chromium" });
}

/**
 * Standardized version with TestContext
 */
export async function triggerAccountDeletionWithContext(context: TestContext): Promise<void> {
  const { page } = context;
  await navigateToDataControlWithContext(context);

  // Find and click the delete account button - try multiple selectors
  const deleteButton = page
    .locator(
      'button:has-text("Supprimer mon compte"), button:has-text("Delete account"), [data-testid="delete-account-button"]',
    )
    .first();

  if (await deleteButton.isVisible({ timeout: 5000 })) {
    await deleteButton.click();
    console.log("[RGPD] Account deletion triggered");
  } else {
    console.log("[RGPD] Delete account button not found");
  }
}

/**
 * Wait for download to complete and get the downloaded file content
 * @deprecated Use waitForDownloadWithContext instead. Migration in progress.
 */
export async function waitForDownload(page: Page, timeout: number = 10000): Promise<string | null> {
  return waitForDownloadWithContext({ page, browserName: "chromium" }, { timeout });
}

/**
 * Standardized version with TestContext
 */
export async function waitForDownloadWithContext(
  context: TestContext,
  options?: { timeout?: number },
): Promise<string | null> {
  const { page } = context;
  const actualTimeout = options?.timeout || 10000;

  // Wait for download event
  const downloadPromise = page.waitForEvent("download", { timeout: actualTimeout });

  try {
    const download = await downloadPromise;
    console.log(`[RGPD] Download started: ${download.suggestedFilename()}`);

    // Get the download content
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks).toString("utf-8");
    console.log(`[RGPD] Download completed: ${content.length} characters`);

    return content;
  } catch (error) {
    console.log(`[RGPD] Download failed or timeout: ${error}`);
    return null;
  }
}

// Re-export all original functions for backward compatibility
export {
  // Keep original functions for backward compatibility
  navigateToDataControlOriginal,
  triggerDataExportOriginal,
  navigateToSettingsOriginal,
  triggerAccountDeletionOriginal,
  waitForDownloadOriginal,
  // Original functions that don't need context
  getTestSupabaseClient,
};
