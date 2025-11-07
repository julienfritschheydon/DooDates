/**
 * ConversationPreview Component
 * DooDates - Conversation History System
 */
import type { Conversation } from "../../types/conversation";
export interface ConversationPreviewProps {
  /** The conversation to preview */
  conversation: Conversation | null;
  /** Whether the preview modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}
export declare function ConversationPreview({
  conversation,
  isOpen,
  onClose,
  onResume,
  onViewPoll,
  language,
  className,
}: ConversationPreviewProps): import("react/jsx-runtime").JSX.Element;
