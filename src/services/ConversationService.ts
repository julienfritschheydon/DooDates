/**
 * ConversationService - Business logic for conversation management
 * Extracted from hooks to improve separation of concerns
 */

import type { Conversation, ConversationMessage } from "../types/conversation";
import type { UseAutoSaveReturn } from "../hooks/useAutoSave";
import { logError, ErrorFactory } from "../lib/error-handling";
import { logger } from "../lib/logger";

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
   * Accepts both 'resume' and 'conversationId' URL parameters
   */
  static async resumeFromUrl(autoSave: UseAutoSaveReturn): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null> {
    const urlParams = new URLSearchParams(window.location.search);
    // Accept both 'resume' (from dashboard) and 'conversationId' (from other parts of the app)
    const resumeId = urlParams.get("resume") || urlParams.get("conversationId");

    try {
      logger.debug("ConversationService.resumeFromUrl", "conversation", {
        url: window.location.href,
        search: window.location.search,
        resumeId,
        hasAutoSave: !!autoSave,
        hasResumeFunction: !!autoSave?.resumeConversation,
      });

      if (!resumeId) {
        logger.debug(
          "No resume ID found in URL (checked both 'resume' and 'conversationId' params)",
          "conversation",
        );
        return null;
      }

      logger.info("Attempting to resume conversation", "conversation", { resumeId });

      // First, set the conversation ID in autoSave (loads conversation from Supabase if logged in)
      const conversation = await autoSave.resumeConversation(resumeId);
      logger.info("Conversation loaded from autoSave", "conversation", {
        title: conversation?.title || "null",
        userId: conversation?.userId,
        hasConversation: !!conversation,
      });

      if (!conversation) {
        logger.warn("Conversation not found", "conversation", { resumeId });
        return null;
      }

      // Get messages: Try Supabase first if user is logged in, then fallback to localStorage
      // Determine userId: use conversation.userId if available
      // If conversation.userId is undefined but conversation exists and comes from Supabase,
      // we need to get the userId from Supabase directly
      let effectiveUserId = conversation.userId;

      // If userId is undefined but conversation exists, try to get it from Supabase
      // This happens when conversation.userId is not set in the Conversation object
      // but the conversation exists in Supabase with a user_id
      if (!effectiveUserId || effectiveUserId === "guest") {
        try {
          const { getConversation: getSupabaseConversation } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          // Try to get the conversation from Supabase to extract userId
          // We need to query Supabase directly since we don't have access to user context here
          // Check if conversation ID is a UUID (Supabase format) vs conv_ (localStorage format)
          const isSupabaseId =
            resumeId && !resumeId.startsWith("conv_") && !resumeId.startsWith("temp-");

          if (isSupabaseId) {
            // Query Supabase directly to get user_id
            const { supabaseSelect } = await import("../lib/supabaseApi");
            const data = await supabaseSelect<Record<string, unknown>>(
              "conversations",
              {
                id: `eq.${resumeId}`,
                select: "user_id",
              },
              { timeout: 5000 },
            );

            if (data && data.length > 0 && data[0].user_id) {
              effectiveUserId = data[0].user_id as string;
              logger.debug("UserId récupéré depuis Supabase (requête directe)", "conversation", {
                resumeId,
                userId: effectiveUserId,
              });
            }
          }
        } catch (error) {
          logger.debug(
            "Impossible de récupérer userId depuis Supabase, utilisation fallback",
            "conversation",
            {
              resumeId,
              error,
            },
          );
          // Ignore error, will fallback to localStorage
        }
      }

      logger.info("Starting message loading process", "conversation", {
        resumeId,
        conversationUserId: conversation.userId,
        effectiveUserId,
        isGuest: effectiveUserId === "guest" || !effectiveUserId,
      });
      let messages: ConversationMessage[] = [];

      // Check if user is logged in (effectiveUserId is set and not "guest")
      if (effectiveUserId && effectiveUserId !== "guest") {
        try {
          logger.debug("Loading messages from Supabase", "conversation", {
            resumeId,
            userId: effectiveUserId,
            conversationMessageCount: conversation.messageCount,
          });
          const { getMessages: getSupabaseMessages } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          logger.info("Calling getSupabaseMessages...", "conversation", {
            resumeId,
            userId: effectiveUserId,
            expectedMessageCount: conversation.messageCount,
          });
          messages = await getSupabaseMessages(resumeId, effectiveUserId);
          logger.info("✅ Messages loaded from Supabase", "conversation", {
            resumeId,
            messageCount: messages.length,
            expectedCount: conversation.messageCount,
            messagesMatch: messages.length === conversation.messageCount,
            messages: messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content.substring(0, 50),
            })),
          });

          // Vérifier incohérence entre messageCount et nombre réel de messages
          if (conversation.messageCount > 0 && messages.length !== conversation.messageCount) {
            logger.error(
              "⚠️ INCOHÉRENCE DÉTECTÉE: Nombre de messages ne correspond pas",
              "conversation",
              {
                resumeId,
                userId: conversation.userId,
                messagesLoaded: messages.length,
                messageCountInConversation: conversation.messageCount,
                difference: conversation.messageCount - messages.length,
                messageIds: messages.map((m) => m.id),
              },
            );

            // Invalidate cache and retry loading from Supabase
            logger.info(
              "Tentative de rechargement depuis Supabase après détection d'incohérence",
              "conversation",
              {
                resumeId,
                userId: effectiveUserId,
              },
            );

            // Clear memory cache to force reload from Supabase
            const { messageCache } = await import("../lib/storage/ConversationStorageSupabase");
            messageCache.delete(resumeId);

            // Retry loading from Supabase
            try {
              const retryMessages = await getSupabaseMessages(resumeId, effectiveUserId);
              if (retryMessages.length === conversation.messageCount) {
                logger.info("✅ Rechargement réussi, incohérence corrigée", "conversation", {
                  resumeId,
                  messageCount: retryMessages.length,
                });
                messages = retryMessages;
              } else {
                logger.warn("⚠️ Rechargement n'a pas résolu l'incohérence", "conversation", {
                  resumeId,
                  retryMessageCount: retryMessages.length,
                  expectedCount: conversation.messageCount,
                });
              }
            } catch (retryError) {
              logger.error("❌ Échec du rechargement depuis Supabase", "conversation", {
                resumeId,
                error: retryError,
              });
            }
          }

          // Cache messages in localStorage for offline access
          const { saveMessages: saveLocalMessages } = await import(
            "../lib/storage/ConversationStorageSimple"
          );
          saveLocalMessages(resumeId, messages);
          logger.debug("Messages mis en cache localStorage", "conversation", {
            resumeId,
            cachedMessageCount: messages.length,
          });
        } catch (supabaseError) {
          logger.error(
            "❌ Failed to load messages from Supabase, trying localStorage",
            "conversation",
            {
              resumeId,
              error: supabaseError,
              errorMessage:
                supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
            },
          );
          // Fallback to localStorage if Supabase fails
          const { getMessages: getLocalMessages } = await import(
            "../lib/storage/ConversationStorageSimple"
          );
          const localMessages = getLocalMessages(resumeId);
          logger.warn("⚠️ Utilisation cache localStorage (fallback)", "conversation", {
            resumeId,
            messageCount: localMessages.length,
            expectedCount: conversation.messageCount,
            warning:
              "Les messages peuvent être obsolètes si la conversation a été modifiée dans un autre navigateur",
          });
          messages = localMessages;
        }
      } else {
        // Guest mode: use localStorage only
        logger.debug("Loading messages from localStorage (guest mode)", "conversation", {
          resumeId,
        });
        const { getMessages: getLocalMessages } = await import(
          "../lib/storage/ConversationStorageSimple"
        );
        messages = getLocalMessages(resumeId);
      }

      logger.info("🎉 Resume result - Returning to caller", "conversation", {
        success: true,
        messageCount: messages.length,
        conversationTitle: conversation.title,
        hasMessages: messages.length > 0,
      });

      return {
        conversation,
        messages,
      };
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
    autoSave: UseAutoSaveReturn,
    setMessages: (messages: Message[]) => void,
  ): Promise<void> {
    try {
      const result = await this.resumeFromUrl(autoSave);

      if (result && result.conversation && result.messages) {
        logger.info("Resuming conversation from URL", "conversation", {
          title: result.conversation.title,
        });

        const messages = result.messages;

        if (messages && messages.length > 0) {
          const chatMessages = this.convertMessagesToChat(messages);
          setMessages(chatMessages);
          logger.info("Resumed conversation", "conversation", {
            title: result.conversation.title,
            messageCount: chatMessages.length,
          });
        } else {
          const resumeMessage = this.createResumeMessage(result.conversation.title);
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
