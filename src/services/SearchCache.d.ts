/**
 * LRU Cache implementation for search results optimization
 * DooDates - Conversation History System
 */
import type { CacheOptions } from "../types/search";
export declare class SearchCache<T> {
  private cache;
  private readonly maxSize;
  private readonly ttl;
  constructor(options?: CacheOptions);
  /**
   * Get cached entry if valid
   */
  get(key: string): T | null;
  /**
   * Set cache entry with LRU eviction
   */
  set(key: string, data: T): void;
  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern?: string): void;
  /**
   * Generate cache key from filters and query
   */
  static generateKey(query: string, filters: Record<string, unknown>): string;
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
  };
  /**
   * Clear expired entries
   */
  cleanup(): void;
}
