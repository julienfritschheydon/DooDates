/**
 * useAutoSave Hook
 * Automatic conversation persistence for chat sessions
 * DooDates - Conversation History System
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as ConversationStorage from "../lib/storage/ConversationStorageSimple";
import { generateConversationTitle, shouldRegenerateTitle } from "../lib/services/titleGeneration";
import type { Conversation, ConversationMessage } from "../types/conversation";
import { ConversationError } from "../types/conversation";
import { logger } from "@/lib/logger";

export interface AutoSaveMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any; // Deprecated - use metadata.pollSuggestion instead
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
export function useAutoSave(opts: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const { user } = useAuth();
  const { debug = false } = opts;

  // State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs
  const currentConversationRef = useRef<Conversation | null>(null);
  const titleGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging (reduced for production)
  const log = useCallback(
    (message: string, data?: any) => {
      if (debug && message.includes("Error")) {
        logger.debug(`AutoSave: ${message}`, "conversation", data || {});
      }
    },
    [debug],
  );

  // Convert AutoSaveMessage to ConversationMessage
  const convertMessage = useCallback(
    (msg: AutoSaveMessage, conversationId: string): ConversationMessage => ({
      id: msg.id,
      conversationId,
      role: msg.isAI ? "assistant" : "user",
      content: msg.content,
      timestamp: msg.timestamp,
      // PRIORITÉ 1: Utiliser metadata si fourni (nouveau format)
      // PRIORITÉ 2: Reconstruire depuis pollSuggestion (ancien format, rétrocompatibilité)
      metadata: msg.metadata
        ? msg.metadata
        : msg.pollSuggestion
          ? {
              pollGenerated: true,
              ...msg.pollSuggestion,
            }
          : undefined,
    }),
    [],
  );

  // Create new conversation
  const createConversation = useCallback(
    async (firstMessage: AutoSaveMessage): Promise<Conversation> => {
      log("Creating new conversation");

      try {
        // Create conversation - save to Supabase if logged in, otherwise localStorage
        let result: Conversation;

        if (user?.id) {
          try {
            const { createConversation: createSupabaseConversation } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            result = await createSupabaseConversation(
              {
                title:
                  firstMessage.content.slice(0, 50) +
                  (firstMessage.content.length > 50 ? "..." : ""),
                status: "active",
                firstMessage: firstMessage.content,
                messageCount: 0,
                isFavorite: false,
                tags: [],
                metadata: {},
                userId: user.id,
              },
              user.id,
            );
            // Also save to localStorage as cache
            ConversationStorage.addConversation(result);
          } catch (supabaseError) {
            logger.error(
              "Erreur lors de la création dans Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Fallback to localStorage
            result = ConversationStorage.createConversation({
              title:
                firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
              firstMessage: firstMessage.content,
              userId: user.id,
            });
          }
        } else {
          // Guest mode: use localStorage only
          result = ConversationStorage.createConversation({
            title:
              firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
            firstMessage: firstMessage.content,
            userId: "guest",
          });
        }

        currentConversationRef.current = result;
        setConversationId(result.id);
        log("Conversation created", { id: result.id, title: result.title });
        return result;
      } catch (error) {
        log("Error creating conversation", { error });
        throw error;
      }
    },
    [user?.id, log],
  );

  // Title generation with debounce
  const triggerTitleGeneration = useCallback(
    (conversationId: string, messages: ConversationMessage[]) => {
      // Clear existing timeout
      if (titleGenerationTimeoutRef.current) {
        clearTimeout(titleGenerationTimeoutRef.current);
      }

      // Set new timeout for 1.5s debounce
      titleGenerationTimeoutRef.current = setTimeout(async () => {
        try {
          const conversation = ConversationStorage.getConversation(conversationId);
          if (!conversation) return;

          // Check if we should regenerate title
          // Consider title custom if it doesn't match auto-generated patterns
          const isAutoGeneratedTitle =
            conversation.title.startsWith("Conversation du") ||
            conversation.title.startsWith("New conversation") ||
            conversation.title.startsWith("Nouvelle conversation") ||
            conversation.title.length <= 50; // Auto-generated titles are typically short
          const hasCustomTitle = !isAutoGeneratedTitle;

          if (shouldRegenerateTitle(conversation.title, hasCustomTitle, messages.length)) {
            log("Generating new title", {
              conversationId,
              messageCount: messages.length,
            });

            const titleResult = generateConversationTitle(messages, {
              language: "fr",
            });
            if (titleResult.success) {
              // Update conversation with new title
              const updatedConversation = {
                ...conversation,
                title: titleResult.title,
                updatedAt: new Date(),
              };

              // Save to Supabase if logged in and owned by user
              if (conversation.userId && conversation.userId !== "guest") {
                try {
                  const { updateConversation: updateSupabaseConversation } = await import(
                    "../lib/storage/ConversationStorageSupabase"
                  );
                  // Get user ID from conversation or useAuth
                  const userId = conversation.userId;
                  if (userId && userId !== "guest") {
                    await updateSupabaseConversation(updatedConversation, userId);
                  }
                } catch (supabaseError) {
                  logger.error(
                    "Erreur lors de la mise à jour du titre dans Supabase",
                    "conversation",
                    supabaseError,
                  );
                  // Continue with localStorage
                }
              }

              // Get all conversations, update the specific one, and save back
              const allConversations = ConversationStorage.getConversations();
              const updatedConversations = allConversations.map((conv) =>
                conv.id === conversationId ? updatedConversation : conv,
              );
              ConversationStorage.saveConversations(updatedConversations);

              log("Title updated", {
                conversationId,
                newTitle: titleResult.title,
              });
            }
          }
        } catch (error) {
          log("Error generating title", { conversationId, error });
        }
      }, 1500); // 1.5s debounce
    },
    [log],
  );

  // Add message and save immediately (simplified architecture)
  const addMessage = useCallback(
    async (message: AutoSaveMessage) => {
      log("Saving message immediately", { messageId: message.id });

      try {
        // Get current conversation ID
        let activeConversationId = currentConversationRef.current?.id || conversationId;

        // Create conversation if needed (for temp conversations)
        if (!activeConversationId || activeConversationId.startsWith("temp-")) {
          const conversation = await createConversation(message);
          activeConversationId = conversation.id;
        }

        // Convert and save this single message immediately
        const convertedMessage = convertMessage(message, activeConversationId);

        // Get conversation to check ownership
        const conversation = ConversationStorage.getConversation(activeConversationId);

        // Save to Supabase if logged in and owned by user
        if (user?.id && conversation?.userId === user.id) {
          try {
            const { addMessages: addSupabaseMessages } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            await addSupabaseMessages(activeConversationId, [convertedMessage], user.id);
          } catch (supabaseError) {
            logger.error(
              "Erreur lors de l'ajout du message dans Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Continue with localStorage
          }
        }

        // Always save to localStorage as cache
        ConversationStorage.addMessages(activeConversationId, [convertedMessage]);

        // Verify it was saved
        const allMessages = ConversationStorage.getMessages(activeConversationId) || [];
        setLastSaved(new Date());
        log("Message saved immediately", {
          messageId: message.id,
          totalMessages: allMessages.length,
        });

        // Trigger title generation with debounce (1.5s)
        triggerTitleGeneration(activeConversationId, allMessages);
      } catch (error) {
        logger.error("Failed to save message immediately", "conversation", error);
        log("Error saving message", { error, messageId: message.id });
      }
    },
    [log, conversationId, createConversation, convertMessage, triggerTitleGeneration],
  );

  // Resume conversation by ID
  const resumeConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      log("Attempting to resume conversation", { id });

      try {
        // Add small delay to ensure localStorage is synchronized
        await new Promise((resolve) => setTimeout(resolve, 100));

        let conversation: Conversation | null = null;

        // Try Supabase first if logged in
        if (user?.id) {
          try {
            const { getConversation: getSupabaseConversation } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            conversation = await getSupabaseConversation(id, user.id);
            if (conversation) {
              // Also cache in localStorage
              ConversationStorage.updateConversation(conversation);
            }
          } catch (supabaseError) {
            logger.error(
              "Erreur lors du chargement depuis Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Fallback to localStorage
          }
        }

        // Fallback to localStorage if not found in Supabase
        if (!conversation) {
          conversation = ConversationStorage.getConversation(id);
        }

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
        log("Error resuming conversation", { conversationId: id, error });
        throw error;
      }
    },
    [conversationId, log, user?.id],
  );

  // Get current conversation with messages
  const getCurrentConversation = useCallback(async (): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null> => {
    if (!conversationId) return null;

    try {
      return ConversationStorage.getConversationWithMessages(conversationId);
    } catch (error) {
      log("Error getting current conversation", { conversationId, error });
      return null;
    }
  }, [conversationId, log]);

  // Clear current conversation
  const clearConversation = useCallback(() => {
    log("Clearing conversation");

    setConversationId(null);
    setLastSaved(null);
    currentConversationRef.current = null;
  }, [log]);

  // Start new conversation (lazy - only sets up state, actual creation happens on first message)
  const startNewConversation = useCallback(async (): Promise<string> => {
    log("Starting new conversation session");

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(tempId);
    setLastSaved(new Date());

    log("New conversation session ready", { tempId });
    return tempId;
  }, [log, conversationId]);

  // Get real conversation ID (non-temporary)
  const getRealConversationId = useCallback((): string | null => {
    if (!conversationId || conversationId.startsWith("temp-")) {
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
    getRealConversationId,
  };
}
