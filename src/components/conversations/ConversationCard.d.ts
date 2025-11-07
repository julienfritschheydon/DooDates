/**
 * ConversationCard Component
 * DooDates - Conversation History System
 */
import type { Conversation } from "../../types/conversation";
import type { EnrichedConversation } from "../../lib/conversationFilters";
export interface ConversationCardProps {
    /** Conversation data (peut être enrichie avec stats) */
    conversation: Conversation | EnrichedConversation;
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
    /** Callback when user wants to view results */
    onViewResults?: (pollId: string) => void;
    /** Current user's language preference */
    language?: "fr" | "en";
    /** Whether the card is in compact mode */
    compact?: boolean;
    /** Custom className */
    className?: string;
}
export declare function ConversationCard({ conversation, onResume, onRename, onDelete, onToggleFavorite, onViewPoll, onViewResults, language, compact, className, }: ConversationCardProps): import("react/jsx-runtime").JSX.Element;
