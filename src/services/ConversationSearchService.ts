/**
 * Conversation search service with caching and optimization
 * DooDates - Conversation History System
 */

import type { Conversation } from "../types/conversation";
import type { SearchFilters, SearchOptions, SearchResult, SearchHighlight } from "../types/search";
import { SearchCache } from "./SearchCache";

export class ConversationSearchService {
  private regexCache = new Map<string, RegExp>();
  private resultCache = new SearchCache<SearchResult>();

  constructor() {
    // Cleanup expired cache entries every 5 minutes
    setInterval(
      () => {
        this.resultCache.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Main search method with caching
   */
  search(
    conversations: Conversation[],
    filters: SearchFilters,
    options: SearchOptions = {},
  ): SearchResult {
    const { minQueryLength = 1 } = options;
    const query = (filters.query || "").trim();

    // Generate cache key
    const cacheKey = SearchCache.generateKey(query, {
      ...filters,
      conversationCount: conversations.length,
    });

    // Try to get from cache first
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    const result = this.performSearch(conversations, filters, options);

    // Cache the result if it's a meaningful search
    if (query.length >= minQueryLength || Object.keys(filters).length > 1) {
      this.resultCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Perform the actual search without caching
   */
  private performSearch(
    conversations: Conversation[],
    filters: SearchFilters,
    options: SearchOptions,
  ): SearchResult {
    const query = (filters.query || "").trim();
    const { minQueryLength = 1 } = options;

    // Early return for invalid queries
    if (query && query.length < minQueryLength) {
      return {
        conversations: [],
        totalCount: 0,
        query,
        filters,
        highlights: {},
        isLoading: false,
        error: null,
      };
    }

    try {
      // Apply filters first
      const filteredConversations = this.applyFilters(conversations, filters);

      // If no search query, return filtered results
      if (!query) {
        return {
          conversations: filteredConversations,
          totalCount: filteredConversations.length,
          query,
          filters,
          highlights: {},
          isLoading: false,
          error: null,
        };
      }

      // Perform text search with highlighting
      const searchResults: Conversation[] = [];
      const highlights: Record<string, SearchHighlight[]> = {};

      filteredConversations.forEach((conversation) => {
        const { matches, highlights: convHighlights } = this.searchConversation(
          conversation,
          query,
          options,
        );

        if (matches) {
          searchResults.push(conversation);
          if (convHighlights.length > 0) {
            highlights[conversation.id] = convHighlights;
          }
        }
      });

      return {
        conversations: searchResults,
        totalCount: searchResults.length,
        query,
        filters,
        highlights,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        conversations: [],
        totalCount: 0,
        query,
        filters,
        highlights: {},
        isLoading: false,
        error: error instanceof Error ? error : new Error("Search failed"),
      };
    }
  }

  /**
   * Apply filters to conversations
   */
  private applyFilters(conversations: Conversation[], filters: SearchFilters): Conversation[] {
    return conversations.filter((conversation) => {
      // Status filter
      if (filters.status && filters.status !== "all" && conversation.status !== filters.status) {
        return false;
      }

      // Favorite filter
      if (filters.isFavorite !== undefined && conversation.isFavorite !== filters.isFavorite) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const { from, to } = filters.dateRange;
        const conversationDate = conversation.createdAt;

        if (from && conversationDate < from) return false;
        if (to && conversationDate > to) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) =>
          conversation.tags.some((convTag) => convTag.toLowerCase().includes(tag.toLowerCase())),
        );
        if (!hasAllTags) return false;
      }

      // Related poll filter
      if (filters.hasRelatedPoll !== undefined) {
        const hasRelatedPoll = Boolean(conversation.relatedPollId);
        if (hasRelatedPoll !== filters.hasRelatedPoll) return false;
      }

      return true;
    });
  }

  /**
   * Search text fields in a conversation
   */
  private searchConversation(
    conversation: Conversation,
    query: string,
    options: SearchOptions,
  ): { matches: boolean; highlights: SearchHighlight[] } {
    if (!query.trim()) return { matches: true, highlights: [] };

    const highlights: SearchHighlight[] = [];
    let matches = false;

    // Search in title
    const titleHighlights = this.highlightMatches(conversation.title, query, options);
    if (titleHighlights.length > 0) {
      matches = true;
      highlights.push(...titleHighlights.map((h) => ({ ...h, field: "title" as const })));
    }

    // Search in first message
    const messageHighlights = this.highlightMatches(conversation.firstMessage, query, options);
    if (messageHighlights.length > 0) {
      matches = true;
      highlights.push(
        ...messageHighlights.map((h) => ({
          ...h,
          field: "firstMessage" as const,
        })),
      );
    }

    // Search in tags
    const tagsText = conversation.tags.join(" ");
    const tagHighlights = this.highlightMatches(tagsText, query, options);
    if (tagHighlights.length > 0) {
      matches = true;
      highlights.push(...tagHighlights.map((h) => ({ ...h, field: "tags" as const })));
    }

    return { matches, highlights };
  }

  /**
   * Highlight matches in text with caching
   */
  private highlightMatches(text: string, query: string, options: SearchOptions): SearchHighlight[] {
    if (!query.trim() || !text) return [];

    const { caseSensitive = false } = options;
    const regex = this.getOrCreateRegex(query, caseSensitive);
    const highlights: SearchHighlight[] = [];
    let match;

    // Reset regex lastIndex for global regex
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      highlights.push({
        field: "title", // Will be overridden by caller
        text: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
        start: match.index,
        end: match.index + match[0].length,
      });

      // Prevent infinite loop for zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    return highlights;
  }

  /**
   * Get or create cached regex
   */
  private getOrCreateRegex(query: string, caseSensitive: boolean): RegExp {
    const cacheKey = `${query}:${caseSensitive}`;

    if (this.regexCache.has(cacheKey)) {
      return this.regexCache.get(cacheKey)!;
    }

    const escaped = this.escapeRegExp(query.trim());
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escaped, flags);

    // Limit regex cache size
    if (this.regexCache.size >= 50) {
      const firstKey = this.regexCache.keys().next().value;
      if (firstKey) {
        this.regexCache.delete(firstKey);
      }
    }

    this.regexCache.set(cacheKey, regex);
    return regex;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Invalidate cache (useful when conversations are updated)
   */
  invalidateCache(pattern?: string): void {
    this.resultCache.invalidate(pattern);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { results: { size: number; hitRate: number }; regex: number } {
    return {
      results: this.resultCache.getStats(),
      regex: this.regexCache.size,
    };
  }
}
