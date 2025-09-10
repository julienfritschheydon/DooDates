/**
 * Hook for searching and filtering conversations with optimized service layer
 * DooDates - Conversation History System
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './useDebounce.js';
import { useConversations } from './useConversations';
import { ConversationSearchService } from '../services/ConversationSearchService';
import type { SearchFilters, SearchOptions, SearchResult } from '../types/search';

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook for searching and filtering conversations with optimized service layer
 */
export function useConversationSearch(
  initialFilters: SearchFilters = {},
  options: SearchOptions = {}
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
} {
  const {
    debounceMs = 300,
    minQueryLength = 1
  } = options;
  
  // Search service instance (singleton per hook)
  const searchServiceRef = useRef<ConversationSearchService>();
  if (!searchServiceRef.current) {
    searchServiceRef.current = new ConversationSearchService();
  }
  
  // State management
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [rawQuery, setRawQuery] = useState(initialFilters.query || '');
  
  // Debounced query for performance
  const debouncedQuery = useDebounce(rawQuery, debounceMs);
  
  // Get all conversations
  const conversationsHook = useConversations();
  const allConversations = conversationsHook.conversations.conversations;
  const conversationsLoading = conversationsHook.conversations.isLoading;
  const conversationsError = conversationsHook.conversations.error;
  
  // Invalidate cache when conversations change
  useEffect(() => {
    if (!searchServiceRef.current || allConversations.length === 0) {
      return;
    }
    
    searchServiceRef.current.invalidateCache();
  }, [allConversations.length]);
  
  // Memoized search results using service
  const searchResult = useMemo(() => {
    const query = debouncedQuery.trim();
    const searchFilters = { ...filters, query };
    
    if (conversationsLoading) {
      return {
        conversations: [],
        totalCount: 0,
        query,
        filters: searchFilters,
        highlights: {},
        isLoading: true,
        error: null
      };
    }
    
    if (conversationsError) {
      return {
        conversations: [],
        totalCount: 0,
        query,
        filters: searchFilters,
        highlights: {},
        isLoading: false,
        error: conversationsError
      };
    }
    
    try {
      return searchServiceRef.current!.search(
        allConversations,
        searchFilters,
        options
      );
    } catch (error) {
      return {
        conversations: [],
        totalCount: 0,
        query,
        filters: searchFilters,
        highlights: {},
        isLoading: false,
        error: error instanceof Error ? error : new Error('Search failed')
      };
    }
  }, [debouncedQuery, filters, allConversations, conversationsLoading, conversationsError, options]);
  
  // Helper functions
  const setQuery = useCallback((query: string) => {
    setRawQuery(query);
    setFilters(prev => ({ ...prev, query }));
  }, []);
  
  const clearSearch = useCallback(() => {
    setRawQuery('');
    setFilters({});
  }, []);
  
  const getHighlightedText = useCallback((conversationId: string, field: string): string => {
    const highlights = searchResult.highlights[conversationId];
    if (!highlights) return '';
    
    const fieldHighlights = highlights.filter(h => h.field === field);
    if (fieldHighlights.length === 0) return '';
    
    // Return the first highlight's text
    return fieldHighlights[0].text;
  }, [searchResult.highlights]);
  
  const getCacheStats = useCallback(() => {
    return searchServiceRef.current?.getCacheStats() || { results: { size: 0, hitRate: 0 }, regex: 0 };
  }, []);
  
  return {
    ...searchResult,
    setFilters,
    setQuery,
    clearSearch,
    getHighlightedText,
    getCacheStats
  };
}
