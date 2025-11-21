import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationMessage, CONVERSATION_STATUS, MessageRole } from '../types/conversation';
import { logger } from './logger';

const STORAGE_KEY = 'doodates_conversations';

interface StoredConversationData {
  conversations: Conversation[];
  messages: ConversationMessage[];
}

const dateReviver = (key: string, value: any) => {
  if ((key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') && typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
};
const readConversations = (): StoredConversationData => {
  if (typeof window === 'undefined') return { conversations: [], messages: [] };

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { conversations: [], messages: [] };

    const parsed = JSON.parse(data, dateReviver);
    // Validation de la structure
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.conversations)) {
      return { conversations: [], messages: [] };
    }

    return parsed as StoredConversationData;
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
    const now = new Date();
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
    if (!data.conversations || !Array.isArray(data.conversations)) {
      logger.error('Invalid conversations data structure', 'conversation', { data });
      return null;
    }
    const index = data.conversations.findIndex(conv => conv.id === id);

    if (index === -1) return null;

    const updatedAt = new Date();
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

    const timestamp = new Date();
    const message: ConversationMessage = {
      id: uuidv4(),
      conversationId,
      role: role as MessageRole,
      content,
      timestamp,
    };

    const data = readConversations();
    const updatedAt = new Date();
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
