/**
 * Search types for conversation search functionality
 * DooDates - Conversation History System
 */

import type { Conversation, ConversationStatus } from './conversation';

// ============================================================================
// SEARCH INTERFACES
// ============================================================================

export interface SearchFilters {
  /** Search query for full-text search */
  query?: string;
  /** Filter by conversation status */
  status?: ConversationStatus | 'all';
  /** Filter by favorite status */
  isFavorite?: boolean;
  /** Filter by date range */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  /** Filter by tags */
  tags?: string[];
  /** Filter by related poll existence */
  hasRelatedPoll?: boolean;
}

export interface SearchOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Case sensitive search */
  caseSensitive?: boolean;
  /** Search in message content (requires loading messages) */
  searchMessages?: boolean;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

export interface SearchResult {
  /** Matching conversations */
  conversations: Conversation[];
  /** Total count of matches */
  totalCount: number;
  /** Search query used */
  query: string;
  /** Applied filters */
  filters: SearchFilters;
  /** Search highlights for each conversation */
  highlights: Record<string, SearchHighlight[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

export interface SearchHighlight {
  /** Field where match was found */
  field: 'title' | 'firstMessage' | 'tags' | 'messages';
  /** Highlighted text with markers */
  text: string;
  /** Start position of match */
  start: number;
  /** End position of match */
  end: number;
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export interface CacheOptions {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}
