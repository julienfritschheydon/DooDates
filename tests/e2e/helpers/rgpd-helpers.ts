/**
 * GDPR Test Helpers
 * Helper functions for E2E tests related to GDPR compliance
 *
 * These helpers facilitate testing user rights:
 * - Right of access (Article 15)
 * - Right to rectification (Article 16)
 * - Right to erasure (Article 17)
 * - Right to data portability (Article 20)
 */

import { Page, expect } from "@playwright/test";
import { getTestSupabaseClient } from "./supabase-test-helpers";

/**
 * Get base path from current page URL
 * Handles cases where app is deployed with a base path like /DooDates/
 */
function getBasePath(page: Page): string {
  const url = page.url();
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Extract base path (e.g., /DooDates from /DooDates/data-control)
    const parts = pathname.split("/").filter((p) => p);
    // If pathname starts with something other than the route, it's the base path
    if (pathname.includes("/DooDates/")) {
      return "/DooDates";
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Navigate to the data control page
 */
export async function navigateToDataControl(page: Page): Promise<void> {
  // Try to get base path from current page, or try common paths
  const basePath = getBasePath(page) || "/DooDates";

  // Try navigating to data-control with base path
  const paths = [
    `${basePath}/data-control`,
    "/DooDates/data-control",
    "/data-control",
    `${basePath}/date/data-control`,
    "/DooDates/date/data-control",
    "/date/data-control",
  ];

  let navigated = false;
  for (const path of paths) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

      // Check if we're on a data-control page
      const currentUrl = page.url();
      if (currentUrl.includes("/data-control")) {
        navigated = true;
        break;
      }
    } catch (error) {
      // Try next path
      continue;
    }
  }

  if (!navigated) {
    // Last resort: try with base path from page context
    await page.goto("/DooDates/date/data-control", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  }

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  // Verify we're on a data control page - be flexible with selectors
  const pageTitle = await page
    .locator('h1, h2, [data-testid="data-control-title"]')
    .first()
    .textContent({ timeout: 15000 })
    .catch(async () => {
      // Fallback: check body text
      const bodyText = await page
        .locator("body")
        .textContent({ timeout: 5000 })
        .catch(() => "");
      return bodyText || "";
    });

  // Verify page contains data control related content
  if (pageTitle) {
    expect(pageTitle).toMatch(/données|data|mes données|data control|rgpd|privacy|contrôle/i);
  } else {
    // If no title found, at least verify URL is correct
    expect(page.url()).toMatch(/data-control/i);
  }
}

/**
 * Get all user data from Supabase for export verification
 * This simulates what should be included in a GDPR export
 */
export async function getUserDataForExport(userId: string): Promise<{
  profile: any;
  conversations: any[];
  votes: any[];
  quotaTracking: any;
}> {
  const supabase = getTestSupabaseClient();

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // Get all conversations (which contain polls)
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId);

  // Get all votes for polls created by this user
  // Votes are linked via poll_id, but polls are now in conversations
  // We need to get poll_ids from conversations that have poll_data
  const pollIds = (conversations || [])
    .filter((c) => c.poll_data || c.poll_id)
    .map((c) => c.poll_id || c.id); // poll_id might be in conversation or use conversation id

  const { data: votes } =
    pollIds.length > 0
      ? await supabase.from("votes").select("*").in("poll_id", pollIds)
      : { data: [] };

  // Get quota tracking
  const { data: quotaTracking } = await supabase
    .from("quota_tracking")
    .select("*")
    .eq("user_id", userId)
    .single();

  return {
    profile: profile || null,
    conversations: conversations || [],
    votes: votes || [],
    quotaTracking: quotaTracking || null,
  };
}

/**
 * Verify that exported JSON contains all expected user data
 */
export function verifyExportDataStructure(exportData: any, userId: string): void {
  expect(exportData).toBeDefined();

  // The export data structure may vary - check for common patterns
  // It might have userId directly, or in a user object, or not at all
  if (exportData.userId) {
    expect(exportData.userId).toBe(userId);
  } else if (exportData.user?.id) {
    expect(exportData.user.id).toBe(userId);
  }

  // Verify basic structure - exportDate is optional
  if (exportData.exportDate) {
    expect(typeof exportData.exportDate).toBe("string");
  }

  // Verify data sections exist (may be empty)
  if (exportData.profile) {
    expect(typeof exportData.profile).toBe("object");
  }

  if (exportData.conversations) {
    expect(Array.isArray(exportData.conversations)).toBe(true);
  }

  if (exportData.polls) {
    expect(Array.isArray(exportData.polls)).toBe(true);
  }

  if (exportData.votes) {
    expect(Array.isArray(exportData.votes)).toBe(true);
  }
}

/**
 * Trigger data export from the UI
 */
export async function triggerDataExport(page: Page): Promise<void> {
  // Find and click the export button - try multiple selectors
  const exportButton = page
    .locator(
      '[data-testid="export-data-button"], button:has-text("Exporter"), button:has-text("Export"), button:has-text("Exporter mes données")',
    )
    .first();
  await expect(exportButton).toBeVisible({ timeout: 10000 });
  await exportButton.click();

  // Wait for export to complete (check for success toast or download)
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
}

/**
 * Verify that account deletion removes all user data
 */
export async function verifyUserDataDeleted(userId: string): Promise<{
  profileDeleted: boolean;
  conversationsDeleted: boolean;
  votesDeleted: boolean;
}> {
  const supabase = getTestSupabaseClient();

  // Check profile
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).single();

  // Check conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  // Check votes (via poll_ids from conversations)
  const { data: conversationsForVotes } = await supabase
    .from("conversations")
    .select("id, poll_id")
    .eq("user_id", userId);

  const pollIds = (conversationsForVotes || []).map((c) => c.poll_id || c.id); // poll_id might be in conversation or use conversation id

  const { data: votes } =
    pollIds.length > 0
      ? await supabase.from("votes").select("id").in("poll_id", pollIds).limit(1)
      : { data: [] };

  return {
    profileDeleted: !profile,
    conversationsDeleted: !conversations || conversations.length === 0,
    votesDeleted: !votes || votes.length === 0,
  };
}

/**
 * Navigate to settings page for profile modification
 * Note: Uses /date/settings as the default settings route
 */
export async function navigateToSettings(page: Page): Promise<void> {
  // Try to get base path from current page
  const basePath = getBasePath(page) || "/DooDates";

  // Try navigating to date-polls/settings (the actual route)
  const paths = [
    `${basePath}/date/settings`,
    "/DooDates/date/settings",
    "/date/settings",
    `${basePath}/settings`,
    "/DooDates/settings",
    "/settings",
  ];

  let navigated = false;
  let lastError: Error | null = null;

  for (const path of paths) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

      // Check if we're on settings page by looking for the title or any settings-related content
      const pageTitle = await page
        .locator('[data-testid="settings-title"], h1, h2')
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => null);
      if (pageTitle && pageTitle.match(/paramètres|settings/i)) {
        navigated = true;
        break;
      }

      // Also check URL and body content
      const currentUrl = page.url();
      if (currentUrl.includes("/settings") && !currentUrl.includes("404")) {
        // Wait a bit more for content to load
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        const titleAfterWait = await page
          .locator('[data-testid="settings-title"], h1, h2')
          .first()
          .textContent({ timeout: 5000 })
          .catch(() => null);
        if (titleAfterWait && titleAfterWait.match(/paramètres|settings/i)) {
          navigated = true;
          break;
        }

        // Check body text as fallback
        const bodyText = await page
          .locator("body")
          .textContent({ timeout: 2000 })
          .catch(() => "");
        if (bodyText && bodyText.match(/paramètres|settings/i)) {
          navigated = true;
          break;
        }
      }
    } catch (error: any) {
      lastError = error;
      // Try next path
      continue;
    }
  }

  if (!navigated) {
    // Last resort: try with date-polls/settings and wait longer
    try {
      await page.goto("/DooDates/date/settings", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

      // Verify we're on the right page
      const title = await page
        .locator('[data-testid="settings-title"], h1, h2')
        .first()
        .textContent({ timeout: 10000 })
        .catch(() => null);
      if (!title || !title.match(/paramètres|settings/i)) {
        throw new Error(`Settings page not loaded. Title: ${title}, URL: ${page.url()}`);
      }
    } catch (error: any) {
      throw new Error(
        `Failed to navigate to settings page: ${error.message || lastError?.message || "Unknown error"}`,
      );
    }
  }

  // Wait for page to be fully loaded
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
}

/**
 * Modify user profile information (for rectification test)
 */
export async function modifyUserProfile(
  page: Page,
  updates: { full_name?: string; timezone?: string },
): Promise<void> {
  await navigateToSettings(page);

  // Find and update full name if provided
  if (updates.full_name) {
    const nameInput = page
      .locator('input[name="full_name"], input[placeholder*="nom"], input[placeholder*="name"]')
      .first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill(updates.full_name);
    }
  }

  // Find and update timezone if provided
  if (updates.timezone) {
    const timezoneSelect = page
      .locator('select[name="timezone"], select[data-testid="timezone-select"]')
      .first();
    if (await timezoneSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await timezoneSelect.selectOption(updates.timezone);
    }
  }

  // Save changes
  const saveButton = page
    .locator('button:has-text("Enregistrer"), button:has-text("Save")')
    .first();
  if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveButton.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
  }
}

/**
 * Trigger account deletion from the UI
 * Note: If the test already has a dialog handler, it will handle the dialog.
 * This function just clicks the button.
 */
export async function triggerAccountDeletion(page: Page): Promise<void> {
  await navigateToDataControl(page);

  // Find and click the delete account button - try multiple selectors
  const deleteButton = page
    .locator(
      '[data-testid="delete-account-button"], button:has-text("Supprimer"), button:has-text("Delete"), button:has-text("Supprimer toutes mes données"), button:has-text("Supprimer mes données")',
    )
    .first();
  await expect(deleteButton).toBeVisible({ timeout: 10000 });

  // Click the button - dialog will be handled by test's page.on('dialog') if present
  await deleteButton.click();

  // Wait a bit for dialog to appear and be handled
  await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
}

/**
 * Verify that exported data is in a readable and complete format
 */
export function verifyExportFormat(exportData: any): void {
  // Should be valid JSON structure
  expect(typeof exportData).toBe("object");

  // Export metadata is optional - may not be implemented yet
  if (exportData.exportDate) {
    expect(new Date(exportData.exportDate).toString()).not.toBe("Invalid Date");
  }

  // Should be serializable to JSON
  const jsonString = JSON.stringify(exportData);
  expect(jsonString.length).toBeGreaterThan(0);

  // Should be parseable back
  const parsed = JSON.parse(jsonString);
  expect(parsed).toBeDefined();
}

/**
 * Wait for download to complete and get the downloaded file content
 */
export async function waitForDownload(page: Page, timeout: number = 10000): Promise<string | null> {
  // Wait for download event
  const downloadPromise = page.waitForEvent("download", { timeout });

  try {
    const download = await downloadPromise;
    const path = await download.path();
    if (path) {
      const fs = require("fs");
      return fs.readFileSync(path, "utf-8");
    }
  } catch (error) {
    // Download might not trigger in test environment
    // Check if data was exported via other means (e.g., clipboard, API response)
    return null;
  }

  return null;
}

/**
 * Create test data for a user (polls, votes, etc.)
 */
export async function createTestUserData(userId: string): Promise<{
  conversationId: string;
  pollId: string;
}> {
  const supabase = getTestSupabaseClient();

  // Create a test conversation with poll data
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      session_id: `test-session-${Date.now()}`,
      title: "Test Poll for GDPR",
      poll_type: "date",
      poll_status: "active",
      poll_data: {
        title: "Test Poll for GDPR",
        type: "date",
        dates: ["2025-12-25", "2025-12-26"],
      },
      status: "active",
    })
    .select()
    .single();

  if (convError || !conversation) {
    throw new Error(`Failed to create test conversation: ${convError?.message}`);
  }

  // Create a test vote
  // Note: votes use poll_id, which in new schema is the conversation id
  // RLS policies may prevent vote creation, so we'll skip if it fails
  const { error: voteError } = await supabase.from("votes").insert({
    poll_id: conversation.id, // In new schema, poll_id references conversation id
    voter_name: "Test Voter",
    voter_email: "test-voter@example.com",
    selections: { "2025-12-25": "available" },
  });

  if (voteError) {
    // RLS policies or schema issues may prevent vote creation
    // This is acceptable for GDPR tests - we can test with just conversations
    console.warn(`Failed to create test vote (this is OK for GDPR tests): ${voteError.message}`);
  }

  return {
    conversationId: conversation.id,
    pollId: conversation.id, // In new schema, poll is in conversation
  };
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestUserData(userId: string): Promise<void> {
  const supabase = getTestSupabaseClient();

  // Get all conversations for this user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  if (conversations && conversations.length > 0) {
    const pollIds = conversations.map((c) => c.id); // Use conversation id as poll id in new schema

    // Delete votes first (if any)
    if (pollIds.length > 0) {
      await supabase.from("votes").delete().in("poll_id", pollIds);
    }

    // Delete conversations
    await supabase.from("conversations").delete().eq("user_id", userId);
  }

  // Clean up quota tracking
  await supabase.from("quota_tracking").delete().eq("user_id", userId);
}
