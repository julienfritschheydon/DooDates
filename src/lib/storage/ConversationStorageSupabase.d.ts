/**
 * Supabase Conversation Storage
 * DooDates - Conversation History System
 *
 * Stores conversations and messages in Supabase for authenticated users
 * Provides synchronization across devices and persistence after logout
 */
import type { Conversation, ConversationMessage } from "../../types/conversation";
/**
 * Get all conversations for the current user
 */
export declare function getConversations(userId: string): Promise<Conversation[]>;
/**
 * Get a single conversation by ID
 */
export declare function getConversation(id: string, userId: string): Promise<Conversation | null>;
/**
 * Create a new conversation
 */
export declare function createConversation(
  conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
  userId: string,
): Promise<Conversation>;
/**
 * Update an existing conversation
 */
export declare function updateConversation(
  conversation: Conversation,
  userId: string,
): Promise<Conversation>;
/**
 * Delete a conversation
 */
export declare function deleteConversation(id: string, userId: string): Promise<void>;
/**
 * Get messages for a conversation
 */
export declare function getMessages(
  conversationId: string,
  userId: string,
): Promise<ConversationMessage[]>;
/**
 * Save messages for a conversation (replace all)
 */
export declare function saveMessages(
  conversationId: string,
  messages: ConversationMessage[],
  userId: string,
): Promise<void>;
/**
 * Add messages to a conversation (append)
 */
export declare function addMessages(
  conversationId: string,
  newMessages: ConversationMessage[],
  userId: string,
): Promise<void>;
/**
 * Get conversation with its messages
 */
export declare function getConversationWithMessages(
  id: string,
  userId: string,
): Promise<{
  conversation: Conversation;
  messages: ConversationMessage[];
} | null>;
/**
 * Clear local cache
 */
export declare function clearCache(): void;
