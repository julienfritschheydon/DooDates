/**
 * Conversation search service with caching and optimization
 * DooDates - Conversation History System
 */
import type { Conversation } from "../types/conversation";
import type { SearchFilters, SearchOptions, SearchResult } from "../types/search";
export declare class ConversationSearchService {
  private regexCache;
  private resultCache;
  constructor();
  /**
   * Main search method with caching
   */
  search(
    conversations: Conversation[],
    filters: SearchFilters,
    options?: SearchOptions,
  ): SearchResult;
  /**
   * Perform the actual search without caching
   */
  private performSearch;
  /**
   * Apply filters to conversations
   */
  private applyFilters;
  /**
   * Search text fields in a conversation
   */
  private searchConversation;
  /**
   * Highlight matches in text with caching
   */
  private highlightMatches;
  /**
   * Get or create cached regex
   */
  private getOrCreateRegex;
  /**
   * Escape special regex characters
   */
  private escapeRegExp;
  /**
   * Invalidate cache (useful when conversations are updated)
   */
  invalidateCache(pattern?: string): void;
  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    results: {
      size: number;
      hitRate: number;
    };
    regex: number;
  };
}
