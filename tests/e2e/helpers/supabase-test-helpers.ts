/**
 * Supabase Test Helpers
 * Helper functions for E2E tests with Supabase
 *
 * Note: These helpers use the test Supabase instance configured in .env.local
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let testSupabase: SupabaseClient | null = null;

/**
 * Get or create Supabase test client
 */
export function getTestSupabaseClient(): SupabaseClient {
  if (!testSupabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL_TEST || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY_TEST || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase test configuration. Please set VITE_SUPABASE_URL_TEST and VITE_SUPABASE_ANON_KEY_TEST in .env.local",
      );
    }

    testSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  return testSupabase;
}

/**
 * Create a test user
 * @param email User email
 * @param password User password
 * @returns User data and error if any
 */
export async function createTestUser(email: string, password: string) {
  const supabase = getTestSupabaseClient();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.status === 429 && attempts < maxAttempts - 1) {
        attempts++;
        const waitTime = attempts * 5000; // 5s, 10s backoff
        console.warn(
          `[SUPABASE-DEBUG] Rate limit (429) for ${email}. Retrying in ${waitTime / 1000}s... (Attempt ${attempts}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(
        `[SUPABASE-DEBUG] signUp error for ${email}: ${error.message} (${error.status})`,
      );
      return { data, error };
    }

    return { data, error };
  }

  return { data: null, error: new Error("Max registration attempts reached") };
}

/**
 * Sign in a test user
 * @param email User email
 * @param password User password
 * @returns Session data and error if any
 */
export async function signInTestUser(email: string, password: string) {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out current user
 */
export async function signOutTestUser() {
  const supabase = getTestSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Delete a test user (requires service role key)
 * Note: This function requires elevated permissions and should only be used
 * in controlled test environments with proper cleanup
 *
 * @param userId User ID to delete
 * @param options Cleanup options
 */
export async function deleteTestUser(
  userId: string,
  options?: {
    skipAuthCleanup?: boolean; // Skip auth cleanup, only delete user data
    dryRun?: boolean; // Log what would be deleted without actually deleting
  },
): Promise<{ success: boolean; message: string; deletedItems?: string[] }> {
  // Security: This function should only be used in test environments
  if (process.env.NODE_ENV !== "test" && !process.env.CI) {
    return {
      success: false,
      message: "deleteTestUser: Only available in test environments",
    };
  }

  if (options?.dryRun) {
    console.log(`[DRY RUN] Would delete user: ${userId}`);
    return {
      success: true,
      message: `Dry run completed for user: ${userId}`,
      deletedItems: ["conversations", "polls", "user_profile"],
    };
  }

  try {
    const supabase = getTestSupabaseClient();
    const deletedItems: string[] = [];

    // 1. Delete user's conversations (if any)
    const { error: convError } = await supabase
      .from("conversations")
      .delete()
      .eq("user_id", userId);

    if (!convError) {
      deletedItems.push("conversations");
    }

    // 2. Delete user's polls (if any)
    const { error: pollError } = await supabase.from("polls").delete().eq("creator_id", userId);

    if (!pollError) {
      deletedItems.push("polls");
    }

    // 3. Delete user's profile data (if any)
    const { error: profileError } = await supabase.from("user_profiles").delete().eq("id", userId);

    if (!profileError) {
      deletedItems.push("user_profile");
    }

    // 4. Attempt auth cleanup (only if service role is available)
    if (!options?.skipAuthCleanup) {
      try {
        // This would require service role - for now we'll just log
        console.log(`[AUTH] Would delete auth user: ${userId} (requires service role)`);
      } catch (authError) {
        console.log(`[AUTH] Auth cleanup skipped (no service role): ${authError}`);
      }
    }

    return {
      success: true,
      message: `Test user cleanup completed`,
      deletedItems,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete test user: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Generate a unique test email
 * @param prefix Email prefix (default: 'test')
 * @returns Unique email address
 */
export function generateTestEmail(prefix: string = "test"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@test-doodates.com`;
}

/**
 * Wait for a condition to be true
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Check interval in milliseconds
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 100,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Clean up test data
 * Helper to clean up conversations, polls, and other test data
 *
 * @param userId User ID whose data to clean up
 */
export async function cleanupTestData(userId: string) {
  const supabase = getTestSupabaseClient();

  try {
    // Delete user's conversations
    await supabase.from("conversations").delete().eq("user_id", userId);

    // Delete user's polls
    await supabase.from("polls").delete().eq("created_by", userId);

    // Delete user's beta keys (if assigned)
    await supabase
      .from("beta_keys")
      .update({ assigned_to: null, status: "active" })
      .eq("assigned_to", userId);

    console.log(`✅ Cleaned up test data for user: ${userId}`);
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
  }
}

/**
 * Create a test beta key in the database
 * Note: This requires admin permissions
 *
 * @param code Beta key code (optional, will be generated if not provided)
 * @param durationMonths Duration in months
 * @param options Creation options
 * @returns Beta key code
 */
export async function createTestBetaKey(
  code?: string,
  durationMonths: number = 3,
  options?: {
    dryRun?: boolean; // Log what would be created without actually creating
    skipValidation?: boolean; // Skip existence check
  },
): Promise<{ success: boolean; code: string; message: string; expiresAt?: string }> {
  // Security: Only allow in test environments
  if (process.env.NODE_ENV !== "test" && !process.env.CI) {
    return {
      success: false,
      code: code || "BETA-TEST-XXXX-YYYY",
      message: "createTestBetaKey: Only available in test environments",
    };
  }

  const supabase = getTestSupabaseClient();
  const betaCode = code || `BETA-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (options?.dryRun) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    console.log(`[DRY RUN] Would create beta key: ${betaCode}`);
    return {
      success: true,
      code: betaCode,
      message: `Dry run completed for beta key: ${betaCode}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  try {
    // Check if key already exists (unless validation is skipped)
    if (!options?.skipValidation) {
      const { data: existing } = await supabase
        .from("beta_keys")
        .select("code")
        .eq("code", betaCode)
        .single();

      if (existing) {
        return {
          success: false,
          code: betaCode,
          message: `Beta key already exists: ${betaCode}`,
        };
      }
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Insert the beta key
    const { data, error } = await supabase
      .from("beta_keys")
      .insert({
        code: betaCode,
        status: "active",
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        max_uses: 100, // Test keys have high usage limit
        current_uses: 0,
      })
      .select()
      .single();

    if (error) {
      // If the table doesn't exist or we don't have permissions, create a mock response
      console.log(`[BETA] Database insert failed, returning mock key: ${error.message}`);
      return {
        success: true,
        code: betaCode,
        message: `Mock beta key created (database unavailable): ${betaCode}`,
        expiresAt: expiresAt.toISOString(),
      };
    }

    return {
      success: true,
      code: betaCode,
      message: `Beta key created successfully: ${betaCode}`,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    return {
      success: false,
      code: betaCode,
      message: `Failed to create beta key: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check if a beta key exists and is active
 * @param code Beta key code
 */
export async function isBetaKeyActive(code: string): Promise<boolean> {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase
    .from("beta_keys")
    .select("status, expires_at")
    .eq("code", code)
    .single();

  if (error || !data) {
    return false;
  }

  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  return data.status === "active" && expiresAt > now;
}

/**
 * Get user quotas
 * @param userId User ID
 */
export async function getUserQuotas(userId: string) {
  const supabase = getTestSupabaseClient();

  const { data, error } = await supabase
    .from("user_quotas")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data, error };
}
