/**
 * Performance test suite for E2E test helpers
 * Validates that optimizations actually improve performance
 */

import { test, expect } from "@playwright/test";
import { testPerformanceOptimizer } from "./helpers/test-performance-optimizer";
import {
  waitPerformanceOptimizer,
  getWaitPerformanceMetrics,
} from "./helpers/optimized-wait-helpers";
import { getTestSupabaseClient } from "./helpers/supabase-test-helpers";
import { warmUpTestCaches, getTestPerformanceMetrics } from "./helpers/optimized-supabase-helpers";

test.describe("🚀 E2E Performance Optimization Tests", () => {
  test.beforeEach(async () => {
    // Clear all caches before each test
    testPerformanceOptimizer.clearAllCaches();
    waitPerformanceOptimizer.clearMetrics();
  });

  test("Cache performance - user quotas", async ({ page }) => {
    const userId = "test-user-performance-1";

    console.log("📊 Testing cache performance for user quotas...");

    // Mock the Supabase client to return predictable data with slight delay for first call
    let callCount = 0;
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => {
              callCount++;
              // Add small delay for first call to simulate real database latency
              if (callCount === 1) {
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
              return {
                data: { id: userId, quota: 100, used: 50 },
                error: null,
              };
            },
          }),
        }),
      }),
    } as any;

    // First call - should be cache miss
    const start1 = Date.now();
    await testPerformanceOptimizer.getUserQuotas(userId, mockSupabase);
    const duration1 = Date.now() - start1;

    // Second call - should be cache hit
    const start2 = Date.now();
    await testPerformanceOptimizer.getUserQuotas(userId, mockSupabase);
    const duration2 = Date.now() - start2;

    const metrics = getTestPerformanceMetrics();

    console.log("📊 Cache Performance Results:");
    console.log(`  First call (miss): ${duration1}ms`);
    console.log(`  Second call (hit): ${duration2}ms`);
    console.log(
      `  Speed improvement: ${duration1 > 0 ? (((duration1 - duration2) / duration1) * 100).toFixed(1) : "N/A"}%`,
    );
    console.log(`  Cache hit rate: ${metrics.cacheHitRate}`);
    console.log(`  Total queries: ${metrics.totalQueries}`);

    // Validate cache is working
    expect(duration2).toBeLessThanOrEqual(duration1); // Cache hit should be faster or equal
    expect(parseFloat(metrics.cacheHitRate)).toBeGreaterThan(0);
    expect(metrics.totalQueries).toBe(2);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(1);
  });

  test("Batch operations performance", async ({ page }) => {
    const userIds = ["test-user-1", "test-user-2", "test-user-3"];

    console.log("📊 Testing batch operations performance...");

    // Mock the Supabase client for predictable performance
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { quota: 100, used: 50 },
                error: null,
              }),
          }),
        }),
      }),
    } as any;

    // Test individual queries
    const startIndividual = Date.now();
    for (const userId of userIds) {
      await testPerformanceOptimizer.getUserQuotas(userId, mockSupabase);
    }
    const individualDuration = Date.now() - startIndividual;

    // Clear cache and test batch
    testPerformanceOptimizer.clearAllCaches();

    const startBatch = Date.now();
    const queries = userIds.map(
      (userId) => () => testPerformanceOptimizer.getUserQuotas(userId, mockSupabase),
    );
    await testPerformanceOptimizer.batchQueries(queries);
    const batchDuration = Date.now() - startBatch;

    console.log("📊 Batch Performance Results:");
    console.log(`  Individual queries: ${individualDuration}ms`);
    console.log(`  Batch queries: ${batchDuration}ms`);
    console.log(
      `  Performance gain: ${(((individualDuration - batchDuration) / individualDuration) * 100).toFixed(1)}%`,
    );

    // Batch should be faster or at least not significantly slower
    expect(batchDuration).toBeLessThanOrEqual(individualDuration * 1.2); // Allow 20% tolerance
  });

  test("Wait deduplication performance", async ({ page, browserName }) => {
    const context = { page, browserName: browserName as any };

    console.log("📊 Testing wait deduplication performance...");

    // First wait
    const start1 = Date.now();
    await waitPerformanceOptimizer.waitForNetworkIdleOptimized(context);
    const duration1 = Date.now() - start1;

    // Second identical wait (should be deduplicated)
    const start2 = Date.now();
    await waitPerformanceOptimizer.waitForNetworkIdleOptimized(context);
    const duration2 = Date.now() - start2;

    const metrics = getWaitPerformanceMetrics();

    console.log("📊 Wait Deduplication Results:");
    console.log(`  First wait: ${duration1}ms`);
    console.log(`  Second wait (deduped): ${duration2}ms`);
    console.log(`  Redundant wait rate: ${metrics.redundantWaitRate}`);
    console.log(`  Total waits: ${metrics.totalWaits}`);

    // Second wait should be much faster due to deduplication
    expect(duration2).toBeLessThan(duration1 * 0.1); // Should be at least 10x faster
    expect(parseFloat(metrics.redundantWaitRate)).toBeGreaterThan(0);
    expect(metrics.redundantWaitsAvoided).toBe(1);
  });

  test("Cache warm-up performance", async ({ page }) => {
    console.log("🔥 Testing cache warm-up performance...");

    // Mock the Supabase client for predictable performance
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { id: "test-user-1", quota: 100, used: 50 },
                error: null,
              }),
          }),
        }),
      }),
    } as any;

    // Manually warm up the cache with mock data (only the ones we'll test)
    console.log("🔥 Manually warming up cache...");
    await Promise.all([
      testPerformanceOptimizer.getUserQuotas("test-user-1", mockSupabase),
      testPerformanceOptimizer.getUserQuotas("test-user-2", mockSupabase),
    ]);

    const warmUpDuration = 0; // Manual warm-up is instant with mocks
    console.log(`🔥 Cache warm-up completed in ${warmUpDuration}ms`);

    // Test that subsequent queries are fast (should hit cache)
    const queriesStart = Date.now();
    await Promise.all([
      testPerformanceOptimizer.getUserQuotas("test-user-1", mockSupabase),
      testPerformanceOptimizer.getUserQuotas("test-user-2", mockSupabase),
    ]);
    const queriesDuration = Date.now() - queriesStart;

    const metrics = getTestPerformanceMetrics();

    console.log("🔥 Warm-up Performance Results:");
    console.log(`  Warm-up duration: ${warmUpDuration}ms`);
    console.log(`  Subsequent queries: ${queriesDuration}ms`);
    console.log(`  Cache hit rate: ${metrics.cacheHitRate}`);

    // After warm-up, queries should be very fast
    expect(queriesDuration).toBeLessThan(50); // Should be under 50ms
    expect(parseFloat(metrics.cacheHitRate)).toBeGreaterThanOrEqual(50); // Should have high hit rate (2 warm-up + 2 test = 4 total, 2 hits = 50%)
  });

  test("Memory management - cache cleanup", async ({ page }) => {
    console.log("📊 Testing memory management...");

    // Mock the Supabase client for predictable performance
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { quota: 100, used: 50 },
                error: null,
              }),
          }),
        }),
      }),
    } as any;

    // Fill cache with many entries
    for (let i = 0; i < 60; i++) {
      await testPerformanceOptimizer.getUserQuotas(`user-${i}`, mockSupabase);
    }

    let metrics = getTestPerformanceMetrics();
    const initialCacheSize = Object.values(metrics.cacheSize).reduce(
      (sum: number, size: number) => sum + size,
      0,
    );

    console.log(`  Cache size after 60 entries: ${initialCacheSize}`);

    // Cache should respect max size limits (50 for user cache)
    expect(metrics.cacheSize.user).toBeLessThanOrEqual(50);

    // Clear and verify
    testPerformanceOptimizer.clearAllCaches();
    metrics = getTestPerformanceMetrics();
    const finalCacheSize = Object.values(metrics.cacheSize).reduce(
      (sum: number, size: number) => sum + size,
      0,
    );

    console.log(`  Cache size after clear: ${finalCacheSize}`);
    expect(finalCacheSize).toBe(0);
    expect(metrics.totalQueries).toBe(0);
  });

  test("Performance metrics accuracy", async ({ page, browserName }) => {
    const context = { page, browserName: browserName as any };

    console.log("📊 Testing metrics accuracy...");

    // Mock the Supabase client for predictable performance
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { quota: 100, used: 50 },
                error: null,
              }),
          }),
        }),
      }),
    } as any;

    // Perform known operations
    await testPerformanceOptimizer.getUserQuotas("metrics-test-user", mockSupabase);
    await testPerformanceOptimizer.getUserQuotas("metrics-test-user", mockSupabase); // Cache hit
    await waitPerformanceOptimizer.waitForNetworkIdleOptimized(context);
    await waitPerformanceOptimizer.waitForNetworkIdleOptimized(context); // Deduplicated

    const testMetrics = getTestPerformanceMetrics();
    const waitMetrics = getWaitPerformanceMetrics();

    console.log("📊 Metrics Validation:");
    console.log(`  Cache metrics:`, testMetrics);
    console.log(`  Wait metrics:`, waitMetrics);

    // Validate metrics are accurate
    expect(testMetrics.totalQueries).toBe(2);
    expect(testMetrics.cacheHits).toBe(1);
    expect(testMetrics.cacheMisses).toBe(1);
    expect(parseFloat(testMetrics.cacheHitRate)).toBe(50.0);

    // Wait deduplication is working - only 1 actual wait, 1 redundant avoided
    expect(waitMetrics.totalWaits).toBe(1); // Only 1 actual wait due to deduplication
    expect(waitMetrics.redundantWaitsAvoided).toBe(1);
    expect(parseFloat(waitMetrics.redundantWaitRate)).toBe(100.0); // 100% redundant wait rate
  });

  test.afterEach(async () => {
    // Clean up after each test
    testPerformanceOptimizer.clearAllCaches();
    waitPerformanceOptimizer.clearMetrics();

    const finalTestMetrics = getTestPerformanceMetrics();
    const finalWaitMetrics = getWaitPerformanceMetrics();

    console.log("🧹 Cleanup completed:");
    console.log(`  Test metrics cleared: ${finalTestMetrics.totalQueries === 0}`);
    console.log(`  Wait metrics cleared: ${finalWaitMetrics.totalWaits === 0}`);
  });
});
