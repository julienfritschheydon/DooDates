/**
 * Component Props Types for Conversation Components
 * DooDates - Conversation History System
 */

import type { Conversation, ConversationSearchFilters } from "../../types/conversation";

export type ConversationSortBy = "createdAt" | "updatedAt" | "title" | "messageCount";
export type SortOrder = "asc" | "desc";

export interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  sortBy: ConversationSortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: ConversationSortBy, sortOrder: SortOrder) => void;
  onPreviewConversation: (conversation: Conversation) => void;
  onResumeConversation?: (conversationId: string) => void;
  onViewPoll?: (pollId: string) => void;
  onCreateConversation?: () => void;
  language?: "fr" | "en";
  compact?: boolean;
}

export interface ConversationSearchProps {
  filters: ConversationSearchFilters;
  onFiltersChange: (filters: ConversationSearchFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  language?: "fr" | "en";
  compact?: boolean;
}

export interface ConversationActionsProps {
  conversation: Conversation;
  onRename?: (conversationId: string, newTitle: string) => void;
  onDelete?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  onToggleArchive?: (conversationId: string) => void;
  onResume?: (conversationId: string) => void;
  onViewPoll?: (pollId: string) => void;
  onCopyLink?: (conversationId: string) => void;
  onExport?: (conversationId: string, format: "json" | "txt" | "pdf") => void;
  mode?: "dropdown" | "inline";
  language?: "fr" | "en";
  compact?: boolean;
}

export interface ConversationPreviewProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  onResume: (conversationId: string) => void;
  onViewPoll?: (pollId: string) => void;
  language?: "fr" | "en";
}

// Extended Message interface for preview component
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
