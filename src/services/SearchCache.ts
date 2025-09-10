/**
 * LRU Cache implementation for search results optimization
 * DooDates - Conversation History System
 */

import type { CacheEntry, CacheOptions } from '../types/search';

export class SearchCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: CacheOptions = { maxSize: 100, ttl: 5 * 60 * 1000 }) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  /**
   * Get cached entry if valid
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count and move to end (LRU)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set cache entry with LRU eviction
   */
  set(key: string, data: T): void {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 1
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern, 'i');
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Generate cache key from filters and query
   */
  static generateKey(query: string, filters: Record<string, any>): string {
    const filterStr = JSON.stringify(filters, Object.keys(filters).sort());
    return `${query}:${filterStr}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return {
      size: this.cache.size,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0
    };
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
