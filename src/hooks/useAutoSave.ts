/**
 * useAutoSave Hook
 * Automatic conversation persistence for chat sessions
 * DooDates - Conversation History System
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as ConversationStorage from '../lib/storage/ConversationStorageSimple';
import type { Conversation, ConversationMessage } from '../types/conversation';

export interface AutoSaveMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any;
}

export interface UseAutoSaveOptions {
  /** Enable debug logging */
  debug?: boolean;
}

export interface UseAutoSaveReturn {
  conversationId: string | null;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  addMessage: (message: AutoSaveMessage) => void;
  startNewConversation: (title?: string) => Promise<string>;
  resumeConversation: (id: string) => Promise<Conversation | null>;
  getCurrentConversation: () => Promise<{ conversation: Conversation; messages: ConversationMessage[] } | null>;
  clearConversation: () => void;
  getRealConversationId: () => string | null;
}

/**
 * Hook for automatic conversation saving with localStorage
 */
export function useAutoSave(opts: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const { user } = useAuth();
  const {
    debug = false
  } = opts;

  // State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs
  const currentConversationRef = useRef<Conversation | null>(null);

  // Debug logging
  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`🔄 AutoSave: ${message}`, data || '');
    }
  }, [debug]);

  // Convert AutoSaveMessage to ConversationMessage
  const convertMessage = useCallback((msg: AutoSaveMessage, conversationId: string): ConversationMessage => ({
    id: msg.id,
    conversationId,
    role: msg.isAI ? 'assistant' : 'user',
    content: msg.content,
    timestamp: msg.timestamp,
    metadata: msg.pollSuggestion ? { 
      pollGenerated: true,
      ...msg.pollSuggestion 
    } : undefined
  }), []);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: AutoSaveMessage): Promise<Conversation> => {
    log('Creating new conversation');
    
    try {
      const result = ConversationStorage.createConversation({
        title: firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : ''),
        firstMessage: firstMessage.content,
        userId: user?.id || 'guest'
      });
      currentConversationRef.current = result;
      setConversationId(result.id);
      log('Conversation created', { id: result.id, title: result.title });
      return result;
    } catch (error) {
      log('Error creating conversation', { error });
      throw error;
    }
  }, [user?.id, log]);




  // Add message and save immediately (simplified architecture)
  const addMessage = useCallback(async (message: AutoSaveMessage) => {
    log('Saving message immediately', { messageId: message.id });
    
    try {
      // Get current conversation ID
      let activeConversationId = currentConversationRef.current?.id || conversationId;
      
      // Create conversation if needed (for temp conversations)
      if (!activeConversationId || activeConversationId.startsWith('temp-')) {
        const conversation = await createConversation(message);
        activeConversationId = conversation.id;
      }
      
      // Convert and save this single message immediately
      const convertedMessage = convertMessage(message, activeConversationId);
      ConversationStorage.addMessages(activeConversationId, [convertedMessage]);
      
      // Verify it was saved
      const allMessages = ConversationStorage.getMessages(activeConversationId);
      setLastSaved(new Date());
      log('Message saved immediately', { messageId: message.id, totalMessages: allMessages.length });
      
    } catch (error) {
      console.error('Failed to save message immediately:', error);
      log('Error saving message', { error, messageId: message.id });
    }
  }, [log, conversationId, createConversation, convertMessage]);

  // Resume conversation by ID
  const resumeConversation = useCallback(async (id: string): Promise<Conversation | null> => {
    log('Attempting to resume conversation', { id });

    try {

      // Add small delay to ensure localStorage is synchronized
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use ConversationStorage directly
      
      const conversation = ConversationStorage.getConversation(id);
      
      
      if (conversation) {
        
        setConversationId(id);
        setLastSaved(new Date());
        currentConversationRef.current = conversation;
        
        // Conversation resumed successfully
        return conversation;
      } else {
        
        return null;
      }
    } catch (error) {
      log('Error resuming conversation', { conversationId: id, error });
      throw error;
    }
  }, [conversationId, log]);

  // Get current conversation with messages
  const getCurrentConversation = useCallback(async (): Promise<{ conversation: Conversation; messages: ConversationMessage[] } | null> => {
    if (!conversationId) return null;
    
    try {
      return ConversationStorage.getConversationWithMessages(conversationId);
    } catch (error) {
      log('Error getting current conversation', { conversationId, error });
      return null;
    }
  }, [conversationId, log]);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    log('Clearing conversation');
    
    setConversationId(null);
    setLastSaved(null);
    currentConversationRef.current = null;
  }, [log]);

  // Start new conversation (lazy - only sets up state, actual creation happens on first message)
  const startNewConversation = useCallback(async (): Promise<string> => {
    
    log('Starting new conversation session');
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(tempId);
    setLastSaved(new Date());
    
    log('New conversation session ready', { tempId });
    return tempId;
  }, [log, conversationId]);

  // Get real conversation ID (non-temporary)
  const getRealConversationId = useCallback((): string | null => {
    if (!conversationId || conversationId.startsWith('temp-')) {
      return currentConversationRef.current?.id || null;
    }
    return conversationId;
  }, [conversationId]);




  return {
    conversationId,
    isAutoSaving,
    lastSaved,
    addMessage,
    startNewConversation,
    resumeConversation,
    getCurrentConversation,
    clearConversation,
    getRealConversationId
  };
}
