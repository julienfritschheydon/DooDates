/**
 * ConversationActions Component
 * DooDates - Conversation History System
 */
import type { Conversation } from "../../types/conversation";
export interface ConversationActionsProps {
  /** The conversation to perform actions on */
  conversation: Conversation;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user renames conversation */
  onRename?: (conversationId: string, newTitle: string) => void;
  /** Callback when user deletes conversation */
  onDelete?: (conversationId: string) => void;
  /** Callback when user toggles favorite status */
  onToggleFavorite?: (conversationId: string, isFavorite: boolean) => void;
  /** Callback when user archives/unarchives conversation */
  onToggleArchive?: (conversationId: string, isArchived: boolean) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Callback when user wants to share conversation */
  onShare?: (conversationId: string) => void;
  /** Callback when user wants to export conversation */
  onExport?: (conversationId: string, format: "json" | "txt" | "pdf") => void;
  /** Show as inline actions instead of dropdown */
  inline?: boolean;
  /** Show only primary actions */
  compact?: boolean;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}
export declare function ConversationActions({
  conversation,
  onResume,
  onRename,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
  onViewPoll,
  onShare,
  onExport,
  inline,
  compact,
  language,
  className,
}: ConversationActionsProps): import("react/jsx-runtime").JSX.Element;
