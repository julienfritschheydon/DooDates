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
import { logError, ErrorFactory } from "@/lib/error-handling";

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
      const requestId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${requestId}] 🆕 createConversation DÉBUT`, {
        hasUser: !!user?.id,
        userId: user?.id || "guest",
        messageLength: firstMessage.content?.length || 0,
      });
      log("Creating new conversation");

      try {
        // Create conversation - save to Supabase if logged in, otherwise localStorage
        let result: Conversation;

        // TEMPORAIRE: Désactiver Supabase si timeout fréquent
        const DISABLE_SUPABASE_CONVERSATIONS =
          import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS === "true";

        if (!DISABLE_SUPABASE_CONVERSATIONS && user?.id) {
          console.log(
            `[${timestamp}] [${requestId}] 🆕 Utilisateur connecté - création Supabase...`,
          );
          try {
            // VÉRIFIER ET CONSOMMER QUOTA AVANT de créer
            console.log(`[${timestamp}] [${requestId}] 🆕 Vérification quota AVANT création...`);
            const { incrementConversationCreated } = await import("../lib/quotaTracking");
            await incrementConversationCreated(user.id);
            console.log(`[${timestamp}] [${requestId}] 🆕 Quota vérifié et incrémenté`);

            console.log(`[${timestamp}] [${requestId}] 🆕 Import ConversationStorageSupabase...`);
            const { createConversation: createSupabaseConversation } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            console.log(`[${timestamp}] [${requestId}] 🆕 Appel createSupabaseConversation...`);
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
            console.log(`[${timestamp}] [${requestId}] 🆕 Conversation Supabase créée:`, {
              id: result.id,
            });
            // Also save to localStorage as cache
            ConversationStorage.addConversation(result);
          } catch (supabaseError) {
            logError(
              ErrorFactory.storage(
                "Erreur Supabase, fallback localStorage",
                "La conversation sera sauvegardée localement",
              ),
              {
                operation: "useAutoSave.createConversation",
                metadata: { requestId, userId: user.id, error: supabaseError },
              },
            );
            logger.error(
              "Erreur lors de la création dans Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Fallback to localStorage
            console.log(
              `[${timestamp}] [${requestId}] 🆕 Vérification quota AVANT création (fallback)...`,
            );
            const { incrementConversationCreated: incrementFallback } = await import(
              "../lib/quotaTracking"
            );
            await incrementFallback(user.id);
            console.log(`[${timestamp}] [${requestId}] 🆕 Quota vérifié (fallback)`);

            console.log(`[${timestamp}] [${requestId}] 🆕 Création localStorage (fallback)...`);
            result = ConversationStorage.createConversation({
              title:
                firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
              firstMessage: firstMessage.content,
              userId: user.id,
            });
          }
        } else {
          // Guest mode or Supabase disabled: use localStorage only
          if (DISABLE_SUPABASE_CONVERSATIONS) {
            console.log(
              `[${timestamp}] [${requestId}] 🆕 Supabase désactivé - création localStorage...`,
            );
          } else {
            console.log(`[${timestamp}] [${requestId}] 🆕 Mode invité - création localStorage...`);
          }

          // VÉRIFIER ET CONSOMMER QUOTA AVANT de créer la conversation
          console.log(
            `[${timestamp}] [${requestId}] 🆕 Vérification quota guest AVANT création...`,
          );
          const { incrementConversationCreated } = await import("../lib/quotaTracking");
          await incrementConversationCreated("guest");
          console.log(`[${timestamp}] [${requestId}] 🆕 Quota guest vérifié et incrémenté`);

          // Créer la conversation seulement si quota OK
          result = ConversationStorage.createConversation({
            title:
              firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
            firstMessage: firstMessage.content,
            userId: "guest",
          });
        }

        console.log(`[${timestamp}] [${requestId}] 🆕 Mise à jour refs...`);
        currentConversationRef.current = result;
        setConversationId(result.id);
        console.log(`[${timestamp}] [${requestId}] ✅ createConversation TERMINÉ`, {
          conversationId: result.id,
          title: result.title,
        });
        log("Conversation created", { id: result.id, title: result.title });
        return result;
      } catch (error) {
        // Détecter si c'est une erreur de quota
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isQuotaError =
          errorMessage.includes("limit reached") || errorMessage.includes("Credit limit");

        logError(
          ErrorFactory.storage(
            isQuotaError ? "Limite de conversations atteinte" : "Erreur dans createConversation",
            isQuotaError
              ? "Vous avez atteint la limite de 5 conversations en mode invité"
              : "Impossible de créer la conversation",
          ),
          {
            operation: "useAutoSave.createConversation",
            metadata: { requestId, userId: user?.id, error, isQuotaError },
          },
        );
        log("Error creating conversation", { error, isQuotaError });
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
      const requestId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${requestId}] 💾 useAutoSave.addMessage DÉBUT`, {
        messageId: message.id,
      });
      log("Saving message immediately", { messageId: message.id });

      try {
        // Get current conversation ID
        let activeConversationId = currentConversationRef.current?.id || conversationId;
        console.log(`[${timestamp}] [${requestId}] 💾 Conversation ID actuelle:`, {
          activeConversationId,
        });

        // Create conversation if needed (for temp conversations)
        if (!activeConversationId || activeConversationId.startsWith("temp-")) {
          console.log(`[${timestamp}] [${requestId}] 💾 Création conversation nécessaire...`);
          const conversation = await createConversation(message);
          activeConversationId = conversation.id;
          console.log(`[${timestamp}] [${requestId}] 💾 Conversation créée:`, {
            conversationId: activeConversationId,
          });
        }

        // Convert and save this single message immediately
        console.log(`[${timestamp}] [${requestId}] 💾 Conversion message...`);
        const convertedMessage = convertMessage(message, activeConversationId);

        // Get conversation to check ownership
        console.log(`[${timestamp}] [${requestId}] 💾 Récupération conversation...`);
        const conversation = ConversationStorage.getConversation(activeConversationId);

        // Save to Supabase if logged in and owned by user
        // TEMPORAIRE: Désactiver Supabase si timeout fréquent (à réactiver une fois Supabase configuré)
        const DISABLE_SUPABASE_CONVERSATIONS =
          import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS === "true";

        console.log(`[${timestamp}] [${requestId}] 💾 Vérification conditions Supabase:`, {
          DISABLE_SUPABASE_CONVERSATIONS,
          hasUser: !!user?.id,
          userId: user?.id,
          conversationUserId: conversation?.userId,
          userIdMatch: conversation?.userId === user?.id,
        });

        if (!DISABLE_SUPABASE_CONVERSATIONS && user?.id && conversation?.userId === user.id) {
          console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde Supabase...`);
          try {
            const { addMessages: addSupabaseMessages } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            // Ajouter un timeout pour éviter les blocages
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Timeout: Supabase addMessages a pris plus de 3 secondes")),
                3000,
              );
            });

            const addPromise = addSupabaseMessages(
              activeConversationId,
              [convertedMessage],
              user.id,
            );
            await Promise.race([addPromise, timeoutPromise]);
            console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde Supabase terminée`);
          } catch (supabaseError) {
            logError(
              ErrorFactory.storage(
                "Erreur Supabase lors de l'ajout du message",
                "Le message sera sauvegardé localement",
              ),
              {
                operation: "useAutoSave.addMessage",
                conversationId: activeConversationId,
                metadata: { requestId, userId: user.id, error: supabaseError },
              },
            );
            logger.error(
              "Erreur lors de l'ajout du message dans Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Continue with localStorage
          }
        } else {
          if (DISABLE_SUPABASE_CONVERSATIONS) {
            console.log(
              `[${timestamp}] [${requestId}] 💾 Supabase conversations désactivé (VITE_DISABLE_SUPABASE_CONVERSATIONS=true)`,
            );
          } else {
            console.log(
              `[${timestamp}] [${requestId}] 💾 Pas de sauvegarde Supabase (guest ou pas de user)`,
            );
          }
        }

        // Always save to localStorage as cache
        console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde localStorage...`);
        ConversationStorage.addMessages(activeConversationId, [convertedMessage]);

        // Verify it was saved
        const allMessages = ConversationStorage.getMessages(activeConversationId) || [];
        setLastSaved(new Date());
        console.log(
          `[${timestamp}] [${requestId}] 💾 Message sauvegardé, total: ${allMessages.length}`,
        );
        log("Message saved immediately", {
          messageId: message.id,
          totalMessages: allMessages.length,
        });

        // Trigger title generation with debounce (1.5s)
        console.log(`[${timestamp}] [${requestId}] 💾 Déclenchement génération titre...`);
        triggerTitleGeneration(activeConversationId, allMessages);
        console.log(`[${timestamp}] [${requestId}] ✅ useAutoSave.addMessage TERMINÉ`);
      } catch (error) {
        logError(
          ErrorFactory.storage("Erreur dans addMessage", "Impossible de sauvegarder le message"),
          {
            operation: "useAutoSave.addMessage",
            metadata: { requestId, messageId: message.id, error },
          },
        );
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
