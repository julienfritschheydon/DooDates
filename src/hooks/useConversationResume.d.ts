/**
 * useConversationResume Hook
 * Handle conversation resumption via URL parameters
 * DooDates - Conversation History System
 */
import type { Conversation } from "../types/conversation";
export interface UseConversationResumeReturn {
  /** Whether a conversation is being resumed */
  isResuming: boolean;
  /** The resumed conversation data */
  resumedConversation: Conversation | null;
  /** Error during resume process */
  resumeError: string | null;
  /** Manually resume a conversation by ID */
  resumeById: (conversationId: string) => Promise<void>;
  /** Clear resume state */
  clearResume: () => void;
}
export declare const useConversationResume: () => UseConversationResumeReturn;
