/**
 * ConversationSearch Component
 * DooDates - Conversation History System
 */
import type { ConversationStatus } from "../../types/conversation";
export interface SearchFilters {
  /** Search query for full-text search */
  query?: string;
  /** Filter by conversation status */
  status?: ConversationStatus | "all";
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
export interface ConversationSearchProps {
  /** Current search filters */
  filters?: SearchFilters;
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchFilters) => void;
  /** Available tags for filtering */
  availableTags?: string[];
  /** Show advanced filters */
  showAdvancedFilters?: boolean;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}
export declare function ConversationSearch({
  filters,
  onFiltersChange,
  availableTags,
  showAdvancedFilters,
  placeholder,
  language,
  className,
}: ConversationSearchProps): import("react/jsx-runtime").JSX.Element;
