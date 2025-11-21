import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationMessage, CONVERSATION_STATUS, MessageRole } from '../types/conversation';
import { logger } from './logger';

const STORAGE_KEY = 'doodates_conversations';

interface StoredConversationData {
  conversations: Conversation[];
  messages: ConversationMessage[];
}

const readConversations = (): StoredConversationData => {
  if (typeof window === 'undefined') return { conversations: [], messages: [] };
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { conversations: [], messages: [] };
  } catch (error) {
    logger.error('Error reading conversations from storage', 'conversation', { error });
    return { conversations: [], messages: [] };
  }
};

const writeConversations = (data: StoredConversationData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Error writing conversations to storage', 'conversation', { error });
  }
};

export const conversationStorage = {
  /**
   * Get all conversations
   */
  getConversations(): Conversation[] {
    return readConversations().conversations;
  },

  /**
   * Get a conversation by ID
   */
  getConversation(id: string): Conversation | undefined {
    const { conversations } = readConversations();
    return conversations.find(conv => conv.id === id);
  },

  /**
   * Create a new conversation
   */
  createConversation(partial: Partial<Conversation> = {}): Conversation {
    const now = new Date().toISOString();
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'Nouvelle conversation',
      status: CONVERSATION_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      firstMessage: '',
      messageCount: 0,
      isFavorite: false,
      tags: [],
      ...partial,
    };

    const data = readConversations();
    writeConversations({
      conversations: [...data.conversations, newConversation],
      messages: data.messages,
    });

    return newConversation;
  },

  /**
   * Update an existing conversation
   */
  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    const data = readConversations();
    const index = data.conversations.findIndex(conv => conv.id === id);
    
    if (index === -1) return null;

    const updatedAt = new Date().toISOString();
    const updatedConversation = {
      ...data.conversations[index],
      ...updates,
      updatedAt,
    };

    const newConversations = [...data.conversations];
    newConversations[index] = updatedConversation;
    
    writeConversations({
      conversations: newConversations,
      messages: data.messages,
    });
    
    return updatedConversation;
  },

  /**
   * Delete a conversation and its messages
   */
  deleteConversation(id: string): boolean {
    const data = readConversations();
    const newConversations = data.conversations.filter(conv => conv.id !== id);
    
    if (newConversations.length < data.conversations.length) {
      // Also delete associated messages
      const newMessages = data.messages.filter(msg => msg.conversationId !== id);
      
      writeConversations({
        conversations: newConversations,
        messages: newMessages,
      });
      
      return true;
    }
    
    return false;
  },

  /**
   * Add a message to a conversation
   */
  addMessage(conversationId: string, role: string, content: string): ConversationMessage | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;

    const timestamp = new Date().toISOString();
    const message: ConversationMessage = {
      id: uuidv4(),
      conversationId,
      role: role as MessageRole,
      content,
      timestamp,
    };

    const data = readConversations();
    const updatedAt = new Date().toISOString();
    const updatedConversation = {
      ...conversation,
      updatedAt,
      messageCount: conversation.messageCount + 1,
    };

    // Update conversation in the list
    const updatedConversations = data.conversations.map(conv => 
      conv.id === conversationId ? updatedConversation : conv
    );

    writeConversations({
      conversations: updatedConversations,
      messages: [...data.messages, message],
    });

    return message;
  },

  /**
   * Get all messages for a conversation
   */
  getMessages(conversationId: string): ConversationMessage[] {
    const { messages } = readConversations();
    return messages.filter(msg => msg.conversationId === conversationId);
  },
};
