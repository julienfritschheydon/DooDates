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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
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
 */
export async function deleteTestUser(userId: string) {
  // This requires Supabase service role key which should NOT be exposed in client-side code
  // For proper implementation, create a backend endpoint that handles user deletion
  // or use Supabase Admin API
  console.warn("deleteTestUser: Requires backend implementation with service role key");

  // Placeholder implementation
  // In production tests, you would call your backend API:
  // await fetch('/api/test/delete-user', { method: 'POST', body: JSON.stringify({ userId }) });
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
 * @returns Beta key code
 */
export async function createTestBetaKey(
  code?: string,
  durationMonths: number = 3,
): Promise<string> {
  const supabase = getTestSupabaseClient();

  // This would typically call an RPC function with admin permissions
  // For testing, you may need to manually create keys in the test database

  console.warn("createTestBetaKey: Requires admin implementation or manual setup");

  // Placeholder - in real tests, you would either:
  // 1. Have pre-created test keys in the database
  // 2. Call an admin API endpoint to create keys
  // 3. Use Supabase service role to insert directly

  return code || "BETA-TEST-XXXX-YYYY";
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
