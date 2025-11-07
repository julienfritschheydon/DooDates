/**
 * useAutoSave Hook
 * Automatic conversation persistence for chat sessions
 * DooDates - Conversation History System
 */
import type { Conversation, ConversationMessage } from "../types/conversation";
export interface AutoSaveMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any;
  metadata?: {
    pollGenerated?: boolean;
    pollSuggestion?: any;
    [key: string]: any;
  };
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
  getCurrentConversation: () => Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null>;
  clearConversation: () => void;
  getRealConversationId: () => string | null;
}
/**
 * Hook for automatic conversation saving with localStorage
 */
export declare function useAutoSave(opts?: UseAutoSaveOptions): UseAutoSaveReturn;
