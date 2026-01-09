/**
 * Performance optimization layer for E2E test helpers
 * Implements caching and query optimization to make tests faster and more reliable
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.config.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Performance optimization layer
class TestPerformanceOptimizer {
  private static instance: TestPerformanceOptimizer;

  // Caches for different data types
  private userCache = new SimpleCache<any>({ ttl: 300000, maxSize: 50 }); // 5 minutes
  private quotaCache = new SimpleCache<any>({ ttl: 300000, maxSize: 50 }); // 5 minutes
  private betaKeyCache = new SimpleCache<any>({ ttl: 600000, maxSize: 100 }); // 10 minutes
  private conversationCache = new SimpleCache<any>({ ttl: 60000, maxSize: 20 }); // 1 minute

  // Query deduplication
  private pendingQueries = new Map<string, Promise<any>>();

  // Performance metrics
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    queriesDeduped: 0,
    totalQueries: 0,
  };

  static getInstance(): TestPerformanceOptimizer {
    if (!TestPerformanceOptimizer.instance) {
      TestPerformanceOptimizer.instance = new TestPerformanceOptimizer();
    }
    return TestPerformanceOptimizer.instance;
  }

  /**
   * Get cached result or execute query
   */
  private async getCachedOrExecute<T>(
    cacheKey: string,
    cache: SimpleCache<T>,
    query: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      this.metrics.cacheHits++;
      this.metrics.totalQueries++;
      return cached;
    }

    // Check for duplicate query
    if (this.pendingQueries.has(cacheKey)) {
      this.metrics.queriesDeduped++;
      this.metrics.totalQueries++;
      return this.pendingQueries.get(cacheKey)!;
    }

    this.metrics.cacheMisses++;
    this.metrics.totalQueries++;

    // Execute query
    const promise = query();
    this.pendingQueries.set(cacheKey, promise);

    try {
      const result = await promise;

      // Cache the result
      cache.set(cacheKey, result);

      return result;
    } finally {
      // Clean up pending query
      this.pendingQueries.delete(cacheKey);
    }
  }

  /**
   * Get user data with caching
   */
  async getUserData(userId: string, supabase: SupabaseClient) {
    const cacheKey = `user_${userId}`;
    return this.getCachedOrExecute(cacheKey, this.userCache, async () => {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
      return data;
    });
  }

  /**
   * Get user quotas with caching
   */
  async getUserQuotas(userId: string, supabase: SupabaseClient) {
    const cacheKey = `quotas_${userId}`;
    return this.getCachedOrExecute(cacheKey, this.quotaCache, async () => {
      const { data } = await supabase
        .from("user_quotas")
        .select("*")
        .eq("user_id", userId)
        .single();
      return data;
    });
  }

  /**
   * Check beta key status with caching
   */
  async getBetaKeyStatus(code: string, supabase: SupabaseClient) {
    const cacheKey = `beta_key_${code}`;
    return this.getCachedOrExecute(cacheKey, this.betaKeyCache, async () => {
      const { data } = await supabase
        .from("beta_keys")
        .select("status, expires_at")
        .eq("code", code)
        .single();
      return data;
    });
  }

  /**
   * Get conversation data with short-term caching
   */
  async getConversationData(conversationId: string, supabase: SupabaseClient) {
    const cacheKey = `conversation_${conversationId}`;
    return this.getCachedOrExecute(cacheKey, this.conversationCache, async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      return data;
    });
  }

  /**
   * Batch multiple queries for better performance
   */
  async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    const results = await Promise.allSettled(queries);

    // Filter out rejected promises and return successful results
    const successfulResults: T[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        successfulResults.push((result as PromiseFulfilledResult<T>).value);
      }
    }

    return successfulResults;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const hitRate =
      this.metrics.totalQueries > 0
        ? ((this.metrics.cacheHits / this.metrics.totalQueries) * 100).toFixed(1)
        : "0.0";

    return {
      ...this.metrics,
      cacheHitRate: `${hitRate}%`,
      cacheSize: {
        user: this.userCache.size(),
        quota: this.quotaCache.size(),
        betaKey: this.betaKeyCache.size(),
        conversation: this.conversationCache.size(),
      },
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.userCache.clear();
    this.quotaCache.clear();
    this.betaKeyCache.clear();
    this.conversationCache.clear();
    this.pendingQueries.clear();

    // Reset metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      queriesDeduped: 0,
      totalQueries: 0,
    };
  }

  /**
   * Warm up caches with common data
   */
  async warmUpCaches(supabaseClient: SupabaseClient, commonUserIds?: string[]): Promise<void> {
    console.log("🔥 Warming up test performance caches...");

    const userIds = commonUserIds || ["test-user-1", "test-user-2"];

    const warmUpPromises = userIds.map(async (userId) => {
      try {
        await Promise.all([
          this.getUserData(userId, supabaseClient),
          this.getUserQuotas(userId, supabaseClient),
        ]);
      } catch (error) {
        console.log(`⚠️ Cache warm-up failed for user ${userId}:`, error);
      }
    });

    await Promise.all(warmUpPromises);

    const metrics = this.getMetrics();
    console.log("🔥 Cache warm-up complete:", metrics);
  }
}

// Export singleton instance
export const testPerformanceOptimizer = TestPerformanceOptimizer.getInstance();

// Export the class for testing
export { TestPerformanceOptimizer };
