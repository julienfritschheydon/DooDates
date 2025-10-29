/**
 * ConversationService - Business logic for conversation management
 * Extracted from hooks to improve separation of concerns
 */

import type { Conversation, ConversationMessage } from "../types/conversation";
import { logError, ErrorFactory } from "../lib/error-handling";

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

export class ConversationService {
  /**
   * Resume conversation from URL parameter
   */
  static async resumeFromUrl(autoSave: any): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get("resume");

    try {
      console.log("🔍 ConversationService.resumeFromUrl:", {
        url: window.location.href,
        search: window.location.search,
        resumeId,
        hasAutoSave: !!autoSave,
        hasResumeFunction: !!autoSave?.resumeConversation,
      });

      if (!resumeId) {
        console.log("❌ No resume ID found in URL");
        return null;
      }

      console.log("🔄 Attempting to resume conversation:", resumeId);

      // First, set the conversation ID in autoSave
      const conversation = await autoSave.resumeConversation(resumeId);
      console.log(
        "📝 Conversation loaded:",
        conversation ? conversation.title : "null",
      );

      if (!conversation) {
        console.log("❌ Conversation not found");
        return null;
      }

      // Import storage directly to get messages (avoid state timing issue)
      const { getConversationWithMessages } = await import(
        "../lib/storage/ConversationStorageSimple"
      );
      const result = getConversationWithMessages(resumeId);

      console.log(
        "✅ Resume result:",
        result ? `Success - ${result.messages.length} messages` : "Failed",
      );
      return result;
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error resuming conversation from URL",
          "Erreur lors de la reprise de conversation",
        ),
        {
          component: "ConversationService",
          operation: "resumeConversationFromUrl",
          conversationId: resumeId || "unknown",
        },
      );
      return null;
    }
  }

  /**
   * Convert conversation messages to chat interface format
   */
  static convertMessagesToChat(messages: ConversationMessage[]): Message[] {
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      isAI: msg.role === "assistant",
      timestamp: new Date(msg.timestamp),
      // PRIORITÉ 1: Utiliser pollSuggestion complet si disponible (nouveau format)
      // PRIORITÉ 2: Reconstruire depuis les champs individuels (ancien format, rétrocompatibilité)
      pollSuggestion: msg.metadata?.pollSuggestion
        ? msg.metadata.pollSuggestion
        : msg.metadata?.pollGenerated && msg.metadata?.title
          ? ({
              title: msg.metadata.title,
              description: msg.metadata.description,
              dates: msg.metadata.dates || [],
              timeSlots: msg.metadata.timeSlots,
              type: msg.metadata.type || "date",
              participants: msg.metadata.participants,
            } as PollSuggestion)
          : undefined,
    }));
  }

  /**
   * Create resume message for empty conversations
   */
  static createResumeMessage(conversationTitle: string): Message {
    return {
      id: `resumed-${Date.now()}`,
      content: `📝 Conversation reprise: "${conversationTitle}"`,
      isAI: true,
      timestamp: new Date(),
    };
  }

  /**
   * Load resumed conversation and convert to messages
   */
  static async loadResumedConversation(
    autoSave: any,
    setMessages: (messages: Message[]) => void,
  ): Promise<void> {
    try {
      const result = await this.resumeFromUrl(autoSave);

      if (result && result.conversation && result.messages) {
        console.log(
          "🔄 Resuming conversation from URL:",
          result.conversation.title,
        );

        const messages = result.messages;

        if (messages && messages.length > 0) {
          const chatMessages = this.convertMessagesToChat(messages);
          setMessages(chatMessages);
          console.log(
            `✅ Resumed conversation: ${result.conversation.title} with ${chatMessages.length} messages`,
          );
        } else {
          const resumeMessage = this.createResumeMessage(
            result.conversation.title,
          );
          setMessages([resumeMessage]);
        }
      }
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error loading resumed conversation",
          "Erreur lors du chargement de la conversation reprise",
        ),
        {
          component: "ConversationService",
          operation: "loadResumedConversation",
        },
      );
    }
  }
}
