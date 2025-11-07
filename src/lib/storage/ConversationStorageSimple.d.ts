/**
 * Simple Conversation Storage - Using shared storage utilities
 * DooDates - Conversation History System
 */
import type { Conversation, ConversationMessage } from "../../types/conversation";
/**
 * Get all conversations
 */
export declare function getConversations(): Conversation[];
/**
 * Save all conversations
 */
export declare function saveConversations(conversations: Conversation[]): void;
/**
 * Add a new conversation
 */
export declare function addConversation(conversation: Conversation): void;
/**
 * Get conversation by ID
 */
export declare function getConversation(id: string): Conversation | null;
/**
 * Update conversation
 */
export declare function updateConversation(conversation: Conversation): void;
/**
 * Delete conversation
 */
export declare function deleteConversation(id: string): void;
/**
 * Get messages for a conversation
 */
export declare function getMessages(conversationId: string): ConversationMessage[];
/**
 * Save messages for a conversation
 */
export declare function saveMessages(conversationId: string, messages: ConversationMessage[]): void;
/**
 * Add messages to a conversation (append)
 */
export declare function addMessages(conversationId: string, newMessages: ConversationMessage[]): void;
/**
 * Delete messages for a conversation
 */
export declare function deleteMessages(conversationId: string): void;
/**
 * Get conversation with its messages
 */
export declare function getConversationWithMessages(id: string): {
    conversation: Conversation;
    messages: ConversationMessage[];
} | null;
/**
 * Create a new conversation with first message
 */
export declare function createConversation(data: {
    title: string;
    firstMessage: string;
    userId?: string;
}): Conversation;
/**
 * Clear all conversation data
 */
export declare function clearAll(): void;
/**
 * Export all data for debugging
 */
export declare function exportData(): {
    conversations: Conversation[];
    messages: Record<string, ConversationMessage[]>;
};
