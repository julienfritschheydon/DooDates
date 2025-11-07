/**
 * Hook for searching and filtering conversations with optimized service layer
 * DooDates - Conversation History System
 */
import type { SearchFilters, SearchOptions, SearchResult } from "../types/search";
/**
 * Hook for searching and filtering conversations with optimized service layer
 */
export declare function useConversationSearch(
  initialFilters?: SearchFilters,
  options?: SearchOptions,
): SearchResult & {
  /** Update search filters */
  setFilters: (filters: SearchFilters) => void;
  /** Update search query */
  setQuery: (query: string) => void;
  /** Clear all filters and search */
  clearSearch: () => void;
  /** Get highlighted text for a conversation field */
  getHighlightedText: (conversationId: string, field: string) => string;
  /** Get cache statistics for debugging */
  getCacheStats: () => any;
};
