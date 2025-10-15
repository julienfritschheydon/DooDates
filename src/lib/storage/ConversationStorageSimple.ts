/**
 * Simple Conversation Storage - Using shared storage utilities
 * DooDates - Conversation History System
 */

import type { Conversation, ConversationMessage } from '../../types/conversation';
import {
  readFromStorage,
  writeToStorage,
  addToStorage,
  findById,
  updateInStorage,
  deleteFromStorage,
  clearStorage,
  readRecordStorage,
  writeRecordStorage,
  addRecords,
  deleteRecords
} from './storageUtils';

const CONVERSATIONS_KEY = 'doodates-conversations';
const MESSAGES_KEY = 'doodates-messages';

// Memory cache for robustness
const conversationCache = new Map<string, Conversation>();
const messageCache = new Map<string, ConversationMessage[]>();

/**
 * Get all conversations
 */
export function getConversations(): Conversation[] {
  return readFromStorage(CONVERSATIONS_KEY, conversationCache, []);
}

/**
 * Save all conversations
 */
export function saveConversations(conversations: Conversation[]): void {
  writeToStorage(CONVERSATIONS_KEY, conversations, conversationCache);
}

/**
 * Add a new conversation
 */
export function addConversation(conversation: Conversation): void {
  addToStorage(CONVERSATIONS_KEY, conversation, conversationCache);
}

/**
 * Get conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  return findById(id, CONVERSATIONS_KEY, conversationCache);
}

/**
 * Update conversation
 */
export function updateConversation(conversation: Conversation): void {
  updateInStorage(CONVERSATIONS_KEY, conversation, conversationCache);
}

/**
 * Delete conversation
 */
export function deleteConversation(id: string): void {
  deleteFromStorage(CONVERSATIONS_KEY, id, conversationCache);
  deleteMessages(id);
}

/**
 * Get messages for a conversation
 */
export function getMessages(conversationId: string): ConversationMessage[] {
  return readRecordStorage(MESSAGES_KEY, messageCache, conversationId);
}

/**
 * Save messages for a conversation
 */
export function saveMessages(conversationId: string, messages: ConversationMessage[]): void {
  writeRecordStorage(MESSAGES_KEY, messageCache, conversationId, messages);
}

/**
 * Add messages to a conversation (append)
 */
export function addMessages(conversationId: string, newMessages: ConversationMessage[]): void {
  // Get existing messages and add new ones
  const existingMessages = getMessages(conversationId);
  const updatedMessages = [...existingMessages, ...newMessages];
  
  // Save messages first
  saveMessages(conversationId, updatedMessages);
  
  // Update message count in conversation
  const conversation = getConversation(conversationId);
  if (conversation) {
    const allMessages = getMessages(conversationId);
    updateConversation({
      ...conversation,
      messageCount: allMessages.length,
      updatedAt: new Date()
    });
  }
}

/**
 * Delete messages for a conversation
 */
export function deleteMessages(conversationId: string): void {
  // Update conversation to reset message count before deleting
  const conversation = getConversation(conversationId);
  if (conversation) {
    updateConversation({
      ...conversation,
      messageCount: 0,
      updatedAt: new Date()
    });
  }
  
  // Delete the messages
  deleteRecords(MESSAGES_KEY, messageCache, conversationId);
}

/**
 * Get conversation with its messages
 */
export function getConversationWithMessages(id: string): { conversation: Conversation; messages: ConversationMessage[] } | null {
  const conversation = getConversation(id);
  if (!conversation) return null;
  
  const messages = getMessages(id);
  return { conversation, messages };
}

/**
 * Create a new conversation with first message
 */
export function createConversation(data: {
  title: string;
  firstMessage: string;
  userId?: string;
}): Conversation {
  const now = new Date();
  const conversation: Conversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    firstMessage: data.firstMessage.slice(0, 100),
    messageCount: 0,
    isFavorite: false,
    tags: [],
    userId: data.userId || 'guest'
  };
  
  addConversation(conversation);
  return conversation;
}

/**
 * Clear all conversation data
 */
export function clearAll(): void {
  clearStorage([CONVERSATIONS_KEY, MESSAGES_KEY], [conversationCache, messageCache]);
}

/**
 * Export all data for debugging
 */
export function exportData(): { conversations: Conversation[]; messages: Record<string, ConversationMessage[]> } {
  const conversations = getConversations();
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(MESSAGES_KEY) : null;
  const messages = raw ? (JSON.parse(raw) as Record<string, ConversationMessage[]>) : {};
  
  return { conversations, messages };
}
