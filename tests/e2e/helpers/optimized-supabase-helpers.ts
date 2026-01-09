/**
 * Optimized versions of Supabase test helpers with performance caching
 * These functions replace the original helpers with cached versions
 */

import { getTestSupabaseClient } from "./supabase-test-helpers";
import { testPerformanceOptimizer } from "./test-performance-optimizer";

/**
 * Optimized version of getUserQuotas with caching
 */
export async function getUserQuotasOptimized(userId: string) {
  const supabase = getTestSupabaseClient();
  return testPerformanceOptimizer.getUserQuotas(userId, supabase);
}

/**
 * Optimized version of isBetaKeyActive with caching
 */
export async function isBetaKeyActiveOptimized(code: string): Promise<boolean> {
  const supabase = getTestSupabaseClient();
  const data = await testPerformanceOptimizer.getBetaKeyStatus(code, supabase);
  return data ? data.status === "active" : false;
}

/**
 * Batch multiple user quota queries for better performance
 */
export async function batchGetUserQuotas(userIds: string[]) {
  const supabase = getTestSupabaseClient();

  const queries = userIds.map(
    (userId) => () => testPerformanceOptimizer.getUserQuotas(userId, supabase),
  );

  return testPerformanceOptimizer.batchQueries(queries);
}

/**
 * Batch multiple beta key status checks
 */
export async function batchCheckBetaKeys(codes: string[]) {
  const supabase = getTestSupabaseClient();

  const queries = codes.map(
    (code) => () => testPerformanceOptimizer.getBetaKeyStatus(code, supabase),
  );

  return testPerformanceOptimizer.batchQueries(queries);
}

/**
 * Warm up performance caches before running tests
 */
export async function warmUpTestCaches(userIds?: string[]) {
  const supabase = getTestSupabaseClient();
  return testPerformanceOptimizer.warmUpCaches(supabase, userIds);
}

/**
 * Get performance metrics for debugging
 */
export function getTestPerformanceMetrics() {
  return testPerformanceOptimizer.getMetrics();
}

/**
 * Clear all performance caches (useful between test suites)
 */
export function clearTestPerformanceCaches() {
  testPerformanceOptimizer.clearAllCaches();
}
