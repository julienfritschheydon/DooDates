/**
 * ConversationHeader Component
 * Header avec badges bidirectionnels et navigation pour conversations
 */
import type { Conversation } from "../../types/conversation";
export interface ConversationHeaderProps {
  /** The conversation to display */
  conversation: Conversation;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom className */
  className?: string;
}
export declare function ConversationHeader({
  conversation,
  language,
  onResume,
  onViewPoll,
  compact,
  className,
}: ConversationHeaderProps): import("react/jsx-runtime").JSX.Element;
export default ConversationHeader;
