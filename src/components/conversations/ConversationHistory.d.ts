/**
 * ConversationHistory Component
 * Main container for the conversation history system
 * DooDates - Conversation History System
 */
import React from "react";
import type { ConversationSearchFilters } from "../../types/conversation";
export type ConversationSortBy = "createdAt" | "updatedAt" | "title" | "messageCount";
export type SortOrder = "asc" | "desc";
interface ConversationHistoryProps {
    /** Language for UI text */
    language?: "fr" | "en";
    /** Callback when user wants to resume a conversation */
    onResumeConversation?: (conversationId: string) => void;
    /** Callback when user wants to view a poll */
    onViewPoll?: (pollId: string) => void;
    /** Callback when user wants to create a new conversation */
    onCreateConversation?: () => void;
    /** Initial filters to apply */
    initialFilters?: Partial<ConversationSearchFilters>;
    /** Compact mode for smaller screens */
    compact?: boolean;
    /** Custom CSS class */
    className?: string;
}
export declare const ConversationHistory: React.FC<ConversationHistoryProps>;
export default ConversationHistory;
