/**
 * ConversationService - Business logic for conversation management
 * Extracted from hooks to improve separation of concerns
 */
import type { Conversation, ConversationMessage } from "../types/conversation";
import type { UseAutoSaveReturn } from "../hooks/useAutoSave";
export interface PollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[];
  }>;
  type: "date" | "datetime" | "custom";
  participants?: string[];
}
export interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: PollSuggestion;
}
export declare class ConversationService {
  /**
   * Resume conversation from URL parameter
   */
  static resumeFromUrl(autoSave: UseAutoSaveReturn): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null>;
  /**
   * Convert conversation messages to chat interface format
   */
  static convertMessagesToChat(messages: ConversationMessage[]): Message[];
  /**
   * Create resume message for empty conversations
   */
  static createResumeMessage(conversationTitle: string): Message;
  /**
   * Load resumed conversation and convert to messages
   */
  static loadResumedConversation(
    autoSave: UseAutoSaveReturn,
    setMessages: (messages: Message[]) => void,
  ): Promise<void>;
}
