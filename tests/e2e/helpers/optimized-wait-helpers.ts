/**
 * Optimized wait helpers with performance improvements
 * Reduces redundant checks and implements smart waiting strategies
 */

import { Page } from "@playwright/test";
import {
  waitForElementReady,
  waitForNetworkIdle,
  waitForReactStable,
  waitForElementReadyWithContext,
  waitForNetworkIdleWithContext,
  waitForReactStableWithContext,
} from "./wait-helpers";
import type { TestContext } from "./test-context";

// Performance tracking for wait operations
interface WaitMetrics {
  totalWaits: number;
  averageWaitTime: number;
  redundantWaitsAvoided: number;
}

class WaitPerformanceOptimizer {
  private static instance: WaitPerformanceOptimizer;
  private metrics: WaitMetrics = {
    totalWaits: 0,
    averageWaitTime: 0,
    redundantWaitsAvoided: 0,
  };

  // Track recent wait operations to avoid redundant checks
  private recentWaits = new Map<string, number>();
  private readonly WAIT_DEDUPLICATION_WINDOW = 1000; // 1 second

  static getInstance(): WaitPerformanceOptimizer {
    if (!WaitPerformanceOptimizer.instance) {
      WaitPerformanceOptimizer.instance = new WaitPerformanceOptimizer();
    }
    return WaitPerformanceOptimizer.instance;
  }

  /**
   * Check if a wait operation is redundant (recently performed)
   */
  private isRedundantWait(key: string): boolean {
    const lastWait = this.recentWaits.get(key);
    if (!lastWait) return false;

    const now = Date.now();
    const timeSinceLastWait = now - lastWait;

    if (timeSinceLastWait < this.WAIT_DEDUPLICATION_WINDOW) {
      this.metrics.redundantWaitsAvoided++;
      return true;
    }

    return false;
  }

  /**
   * Record a wait operation
   */
  private recordWait(key: string, duration: number): void {
    this.recentWaits.set(key, Date.now());
    this.metrics.totalWaits++;

    // Update average wait time
    this.metrics.averageWaitTime =
      (this.metrics.averageWaitTime * (this.metrics.totalWaits - 1) + duration) /
      this.metrics.totalWaits;

    // Clean up old entries
    this.cleanupOldWaits();
  }

  /**
   * Clean up old wait records
   */
  private cleanupOldWaits(): void {
    const now = Date.now();
    const cutoff = now - this.WAIT_DEDUPLICATION_WINDOW * 2;

    for (const [key, timestamp] of this.recentWaits) {
      if (timestamp < cutoff) {
        this.recentWaits.delete(key);
      }
    }
  }

  /**
   * Optimized element ready check with deduplication
   */
  async waitForElementReadyOptimized(
    context: TestContext,
    selector: string,
    options?: { timeout?: number; state?: "visible" | "attached" | "hidden" },
  ): Promise<any> {
    const key = `element_${selector}_${options?.state || "visible"}`;
    const startTime = Date.now();

    // Check for redundant wait
    if (this.isRedundantWait(key)) {
      console.log(`⚡ Skipping redundant wait for: ${selector}`);
      return context.page.locator(selector).first();
    }

    // Perform the wait
    const result = await waitForElementReadyWithContext(context, selector, options);

    // Record metrics
    const duration = Date.now() - startTime;
    this.recordWait(key, duration);

    return result;
  }

  /**
   * Optimized network idle check with smart timeout
   */
  async waitForNetworkIdleOptimized(
    context: TestContext,
    options?: { timeout?: number; idleTime?: number },
  ): Promise<void> {
    const key = `network_idle_${context.browserName}`;
    const startTime = Date.now();

    // Check for redundant wait
    if (this.isRedundantWait(key)) {
      console.log(`⚡ Skipping redundant network idle wait for: ${context.browserName}`);
      return;
    }

    // Perform the wait with reduced timeout for subsequent waits
    const optimizedOptions = {
      ...options,
      timeout: Math.min(options?.timeout || 30000, 15000), // Cap at 15s for subsequent waits
    };

    await waitForNetworkIdleWithContext(context, optimizedOptions);

    // Record metrics
    const duration = Date.now() - startTime;
    this.recordWait(key, duration);
  }

  /**
   * Optimized React stability check
   */
  async waitForReactStableOptimized(
    context: TestContext,
    options?: { timeout?: number; maxWaitTime?: number },
  ): Promise<void> {
    const key = `react_stable_${context.browserName}`;
    const startTime = Date.now();

    // Check for redundant wait
    if (this.isRedundantWait(key)) {
      console.log(`⚡ Skipping redundant React stability wait for: ${context.browserName}`);
      return;
    }

    // Perform the wait
    await waitForReactStableWithContext(context, options);

    // Record metrics
    const duration = Date.now() - startTime;
    this.recordWait(key, duration);
  }

  /**
   * Batch multiple wait operations
   */
  async batchWaitOperations(
    context: TestContext,
    operations: Array<{
      type: "element" | "network" | "react";
      selector?: string;
      options?: any;
    }>,
  ): Promise<void> {
    const promises = operations.map((op) => {
      switch (op.type) {
        case "element":
          return this.waitForElementReadyOptimized(context, op.selector!, op.options);
        case "network":
          return this.waitForNetworkIdleOptimized(context, op.options);
        case "react":
          return this.waitForReactStableOptimized(context, op.options);
        default:
          throw new Error(`Unknown wait operation type: ${op.type}`);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): WaitMetrics & { redundantWaitRate: string } {
    const redundantRate =
      this.metrics.totalWaits > 0
        ? ((this.metrics.redundantWaitsAvoided / this.metrics.totalWaits) * 100).toFixed(1)
        : "0.0";

    return {
      ...this.metrics,
      redundantWaitRate: `${redundantRate}%`,
    };
  }

  /**
   * Clear all metrics and wait history
   */
  clearMetrics(): void {
    this.metrics = {
      totalWaits: 0,
      averageWaitTime: 0,
      redundantWaitsAvoided: 0,
    };
    this.recentWaits.clear();
  }
}

// Export singleton instance
export const waitPerformanceOptimizer = WaitPerformanceOptimizer.getInstance();

/**
 * Optimized wait functions with performance tracking
 */
export const waitForElementReadyOptimized =
  waitPerformanceOptimizer.waitForElementReadyOptimized.bind(waitPerformanceOptimizer);
export const waitForNetworkIdleOptimized =
  waitPerformanceOptimizer.waitForNetworkIdleOptimized.bind(waitPerformanceOptimizer);
export const waitForReactStableOptimized =
  waitPerformanceOptimizer.waitForReactStableOptimized.bind(waitPerformanceOptimizer);
export const batchWaitOperations =
  waitPerformanceOptimizer.batchWaitOperations.bind(waitPerformanceOptimizer);

/**
 * Get wait performance metrics
 */
export function getWaitPerformanceMetrics() {
  return waitPerformanceOptimizer.getMetrics();
}

/**
 * Clear wait performance metrics
 */
export function clearWaitPerformanceMetrics() {
  waitPerformanceOptimizer.clearMetrics();
}
