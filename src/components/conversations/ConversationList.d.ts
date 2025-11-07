/**
 * ConversationList Component
 * DooDates - Conversation History System
 */
import type { Conversation } from "../../types/conversation";
export interface ConversationListProps {
  /** Conversations to display */
  conversations?: Conversation[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user renames conversation */
  onRename?: (conversationId: string, newTitle: string) => void;
  /** Callback when user deletes conversation */
  onDelete?: (conversationId: string) => void;
  /** Callback when user toggles favorite status */
  onToggleFavorite?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Callback when user wants to create new conversation */
  onCreateNew?: () => void;
  /** Current user's language preference */
  language?: "fr" | "en";
  /** Whether to show search and filters */
  showSearch?: boolean;
  /** Whether to use compact card layout */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Height for virtualized list */
  height?: number;
}
export declare function ConversationList({
  conversations,
  isLoading,
  error,
  onResume,
  onRename,
  onDelete,
  onToggleFavorite,
  onViewPoll,
  onCreateNew,
  language,
  showSearch,
  compact,
  className,
  height,
}: ConversationListProps): import("react/jsx-runtime").JSX.Element;
