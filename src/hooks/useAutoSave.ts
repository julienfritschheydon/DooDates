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
  pollSuggestion?: import("../lib/gemini").PollSuggestion; // Deprecated - use metadata.pollSuggestion instead
  metadata?: {
    pollGenerated?: boolean;
    pollSuggestion?: import("../lib/gemini").PollSuggestion;
    [key: string]: unknown;
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
  addMessage: (message: AutoSaveMessage) => Promise<void>;
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
    (message: string, data?: Record<string, unknown>) => {
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

      // Obtenir userId : utiliser user?.id si disponible, sinon chercher dans localStorage
      let effectiveUserId = user?.id;
      if (!effectiveUserId) {
        try {
          const { getSupabaseSessionFromLocalStorage } = await import("../lib/supabaseApi");
          const session = getSupabaseSessionFromLocalStorage();
          effectiveUserId = session?.user?.id || undefined;
          if (effectiveUserId) {
            logger.debug(
              "UserId récupéré depuis localStorage (user?.id non disponible)",
              "conversation",
              {
                userId: effectiveUserId,
              },
            );
          }
        } catch (error) {
          logger.debug("Impossible de récupérer userId depuis localStorage", "conversation", error);
        }
      }

      console.log(`[${timestamp}] [${requestId}] 🆕 createConversation DÉBUT`, {
        hasUser: !!user?.id,
        userId: user?.id || "guest",
        effectiveUserId: effectiveUserId || "guest",
        messageLength: firstMessage.content?.length || 0,
      });
      log("Creating new conversation");

      try {
        // Create conversation - save to Supabase if logged in, otherwise localStorage
        let result: Conversation | null = null;

        // TEMPORAIRE: Désactiver Supabase si timeout fréquent
        const DISABLE_SUPABASE_CONVERSATIONS =
          import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS === "true";

        if (!DISABLE_SUPABASE_CONVERSATIONS && effectiveUserId) {
          console.log(
            `[${timestamp}] [${requestId}] 🆕 Utilisateur connecté - création conversation...`,
          );

          // CRÉER IMMÉDIATEMENT EN LOCALSTORAGE (rapide, non-bloquant)
          const conversationData = {
            title:
              firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
            firstMessage: firstMessage.content,
            userId: effectiveUserId,
          };

          result = ConversationStorage.createConversation(conversationData);
          if (!result || !result.id) {
            throw ErrorFactory.storage(
              "Failed to create conversation: ConversationStorage.createConversation returned null or missing id",
              "La création de conversation a échoué",
            );
          }
          console.log(
            `[${timestamp}] [${requestId}] ✅ Conversation créée en localStorage (immédiat):`,
            {
              id: result.id,
            },
          );

          // Synchroniser avec Supabase en arrière-plan (non-bloquant)
          (async () => {
            try {
              console.log(
                `[${timestamp}] [${requestId}] 🔄 Synchronisation Supabase en arrière-plan...`,
              );
              const { createConversation: createSupabaseConversation } = await import(
                "../lib/storage/ConversationStorageSupabase"
              );

              // Timeout de 5 secondes pour la synchronisation
              const syncTimeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(
                  () => reject(new Error("Timeout: Supabase sync took more than 5 seconds")),
                  5000,
                );
              });

              const syncPromise = createSupabaseConversation(
                {
                  title: conversationData.title,
                  status: "active",
                  firstMessage: conversationData.firstMessage,
                  messageCount: 0,
                  isFavorite: false,
                  tags: [],
                  metadata: {},
                  userId: effectiveUserId,
                },
                effectiveUserId,
              );

              const supabaseResult = await Promise.race([syncPromise, syncTimeoutPromise]);
              if (!supabaseResult || !supabaseResult.id) {
                throw ErrorFactory.storage(
                  "Synchronisation Supabase échouée: résultat invalide ou manquant",
                  supabaseResult === undefined
                    ? "La synchronisation Supabase a retourné undefined"
                    : "La synchronisation Supabase a retourné un résultat sans ID"
                );
              }
              console.log(
                `[${timestamp}] [${requestId}] ✅ Conversation synchronisée avec Supabase:`,
                {
                  id: supabaseResult.id,
                  oldId: result.id,
                },
              );

              // Mettre à jour l'ID Supabase dans localStorage et refs
              result.id = supabaseResult.id;
              ConversationStorage.addConversation(result);
              // Mettre à jour la ref pour que addMessage puisse trouver l'UUID
              currentConversationRef.current = result;
              setConversationId(supabaseResult.id);
              console.log(
                `[${timestamp}] [${requestId}] 🔄 Refs mises à jour avec UUID Supabase:`,
                {
                  refId: currentConversationRef.current?.id,
                  conversationId: supabaseResult.id,
                },
              );
            } catch (syncError) {
              logError(
                ErrorFactory.storage(
                  "Erreur synchronisation Supabase (non-bloquant)",
                  "Une erreur est survenue lors de la synchronisation avec Supabase",
                ),
                { metadata: { originalError: syncError, requestId, timestamp } },
              );
              // La conversation reste en localStorage, c'est OK
            }
          })();
        } else {
          // Guest mode or Supabase disabled: use localStorage only
          if (DISABLE_SUPABASE_CONVERSATIONS) {
            console.log(
              `[${timestamp}] [${requestId}] 🆕 Supabase désactivé - création localStorage...`,
            );
          } else {
            console.log(`[${timestamp}] [${requestId}] 🆕 Mode invité - création localStorage...`);
          }

          // Créer la conversation seulement si quota OK
          result = ConversationStorage.createConversation({
            title:
              firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? "..." : ""),
            firstMessage: firstMessage.content,
            userId: "guest",
          });

          if (!result || !result.id) {
            throw ErrorFactory.storage(
              "Failed to create conversation: ConversationStorage.createConversation returned null or missing id",
              "La création de conversation a échoué",
            );
          }
        }

        // Vérification finale que result est valide
        if (!result || !result.id) {
          const errorMsg =
            result === null
              ? "Failed to create conversation: result is null"
              : "Failed to create conversation: result is missing id";
          throw ErrorFactory.storage(errorMsg, "La création de conversation a échoué");
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
          if (!conversation || !conversation.id) {
            logError(
              ErrorFactory.storage(
                "Échec création conversation",
                "La création de conversation a échoué",
              ),
              { metadata: { conversation, requestId, timestamp } },
            );
            throw ErrorFactory.storage(
              "Failed to create conversation: conversation is null or missing id",
              "La création de conversation a échoué",
            );
          }
          activeConversationId = conversation.id;
          console.log(`[${timestamp}] [${requestId}] 💾 Conversation créée:`, {
            conversationId: activeConversationId,
          });
        }

        // Get conversation to check ownership first
        console.log(`[${timestamp}] [${requestId}] 💾 Récupération conversation...`);
        let conversation = ConversationStorage.getConversation(activeConversationId);
        console.log(`[${timestamp}] [${requestId}] 💾 Conversation récupérée:`, {
          id: conversation?.id,
          userId: conversation?.userId,
          title: conversation?.title,
          firstMessage: conversation?.firstMessage,
        });

        // If conversation ID is in conv_ format and we're saving to Supabase,
        // check if the conversation has been updated with a UUID from Supabase sync
        let supabaseConversationId = activeConversationId;
        if (activeConversationId.startsWith("conv_") && user?.id) {
          console.log(
            `[${timestamp}] [${requestId}] 🔍 Détection ID conv_ - recherche UUID Supabase...`,
          );

          // Check if conversation was updated with UUID from Supabase sync
          const updatedConversation = currentConversationRef.current;
          console.log(`[${timestamp}] [${requestId}] 🔍 Vérification currentConversationRef:`, {
            refId: updatedConversation?.id,
            refUserId: updatedConversation?.userId,
            refFirstMessage: updatedConversation?.firstMessage,
            activeId: activeConversationId,
            idsMatch: updatedConversation?.id === activeConversationId,
            isUUID: updatedConversation?.id && !updatedConversation.id.startsWith("conv_"),
          });

          if (
            updatedConversation &&
            updatedConversation.id !== activeConversationId &&
            !updatedConversation.id.startsWith("conv_")
          ) {
            console.log(
              `[${timestamp}] [${requestId}] 🔄 Conversation ID mis à jour avec UUID Supabase (via ref):`,
              {
                oldId: activeConversationId,
                newId: updatedConversation.id,
              },
            );
            supabaseConversationId = updatedConversation.id;
            conversation = updatedConversation;
            activeConversationId = updatedConversation.id;
          } else {
            // Try to find the Supabase conversation by first_message
            // La synchronisation Supabase peut être en cours, donc on essaie plusieurs fois
            // OPTIMISATION: Réduire le délai et le nombre de tentatives pour accélérer
            console.log(
              `[${timestamp}] [${requestId}] 🔍 Recherche dans Supabase par firstMessage...`,
            );
            let matchingConversation = null;
            const maxRetries = 2; // Réduit de 3 à 2 tentatives
            const retryDelay = 100; // Réduit de 200ms à 100ms pour accélérer

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                const { getConversations } = await import(
                  "../lib/storage/ConversationStorageSupabase"
                );
                const supabaseConversations = await getConversations(user.id);
                console.log(
                  `[${timestamp}] [${requestId}] 🔍 Tentative ${attempt}/${maxRetries} - Conversations Supabase trouvées:`,
                  {
                    count: supabaseConversations.length,
                    ids: supabaseConversations.map((c) => ({
                      id: c.id,
                      firstMessage: c.firstMessage?.substring(0, 50),
                    })),
                  },
                );

                matchingConversation = supabaseConversations.find(
                  (c) => c.firstMessage === conversation?.firstMessage && c.userId === user.id,
                );

                console.log(
                  `[${timestamp}] [${requestId}] 🔍 Tentative ${attempt}/${maxRetries} - Conversation correspondante:`,
                  {
                    found: !!matchingConversation,
                    id: matchingConversation?.id,
                    firstMessage: matchingConversation?.firstMessage?.substring(0, 50),
                    localFirstMessage: conversation?.firstMessage?.substring(0, 50),
                    messagesMatch:
                      matchingConversation?.firstMessage === conversation?.firstMessage,
                  },
                );

                if (matchingConversation && !matchingConversation.id.startsWith("conv_")) {
                  console.log(
                    `[${timestamp}] [${requestId}] 🔍 Conversation Supabase trouvée par firstMessage (tentative ${attempt}):`,
                    {
                      oldId: activeConversationId,
                      newId: matchingConversation.id,
                    },
                  );
                  supabaseConversationId = matchingConversation.id;
                  // Update local conversation with UUID
                  if (conversation) {
                    conversation.id = matchingConversation.id;
                    ConversationStorage.updateConversation(conversation);
                    currentConversationRef.current = conversation;
                    setConversationId(matchingConversation.id);
                  }
                  activeConversationId = matchingConversation.id;
                  break; // Sortir de la boucle si trouvé
                } else if (attempt < maxRetries) {
                  console.log(
                    `[${timestamp}] [${requestId}] ⏳ Attente ${retryDelay}ms avant nouvelle tentative...`,
                  );
                  await new Promise((resolve) => setTimeout(resolve, retryDelay));
                } else {
                  console.log(
                    `[${timestamp}] [${requestId}] ⚠️ Aucune conversation Supabase correspondante trouvée après ${maxRetries} tentatives - utilisation ID temporaire`,
                  );
                  // Si pas trouvé après les tentatives, utiliser l'ID temporaire
                  // La synchronisation Supabase mettra à jour l'ID plus tard
                }
              } catch (lookupError) {
                logError(
                  ErrorFactory.storage(
                    `Erreur lors de la recherche de conversation Supabase (tentative ${attempt})`,
                    "Une erreur est survenue lors de la recherche de conversation",
                  ),
                  { metadata: { originalError: lookupError, requestId, timestamp, attempt } },
                );
                if (attempt < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, retryDelay));
                }
              }
            }
          }
        } else {
          console.log(`[${timestamp}] [${requestId}] 💾 Pas de résolution UUID nécessaire:`, {
            startsWithConv: activeConversationId.startsWith("conv_"),
            hasUser: !!user?.id,
          });
        }

        // Convert and save this single message immediately (use resolved conversation ID)
        console.log(`[${timestamp}] [${requestId}] 💾 Conversion message...`);
        const convertedMessage = convertMessage(message, activeConversationId);

        // Save to Supabase if logged in and owned by user
        // TEMPORAIRE: Désactiver Supabase si timeout fréquent (à réactiver une fois Supabase configuré)
        const DISABLE_SUPABASE_CONVERSATIONS =
          import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS === "true";

        const shouldSaveToSupabase =
          !DISABLE_SUPABASE_CONVERSATIONS &&
          user?.id &&
          conversation?.userId === user.id &&
          !supabaseConversationId.startsWith("conv_"); // Only save if we have a valid UUID

        console.log(`[${timestamp}] [${requestId}] 💾 Vérification conditions Supabase:`, {
          DISABLE_SUPABASE_CONVERSATIONS,
          hasUser: !!user?.id,
          userId: user?.id,
          conversationId: activeConversationId,
          supabaseConversationId,
          conversationExists: !!conversation,
          conversationUserId: conversation?.userId,
          userIdMatch: conversation?.userId === user?.id,
          hasValidUUID: !supabaseConversationId.startsWith("conv_"),
          condition1_disabled: DISABLE_SUPABASE_CONVERSATIONS,
          condition2_hasUser: !!user?.id,
          condition3_userIdMatch: conversation?.userId === user?.id,
          condition4_validUUID: !supabaseConversationId.startsWith("conv_"),
          shouldSaveToSupabase,
        });

        if (shouldSaveToSupabase) {
          console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde Supabase...`);
          try {
            const { addMessages: addSupabaseMessages } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            // Augmenter le timeout à 10 secondes pour Supabase
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(
                () => reject(new Error("Timeout: Supabase addMessages a pris plus de 10 secondes")),
                10000,
              );
            });

            const addPromise = addSupabaseMessages(
              supabaseConversationId,
              [convertedMessage],
              user.id,
            );

            console.log(`[${timestamp}] [${requestId}] 💾 Attente réponse Supabase...`);
            await Promise.race([addPromise, timeoutPromise]);
            console.log(
              `[${timestamp}] [${requestId}] ✅ Sauvegarde Supabase terminée avec succès`,
            );
          } catch (supabaseError) {
            const errorMessage =
              supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
            logError(
              ErrorFactory.storage(
                "Erreur Supabase",
                "Une erreur est survenue lors de la sauvegarde dans Supabase",
              ),
              { metadata: { originalError: supabaseError, requestId, timestamp } },
            );

            logError(
              ErrorFactory.storage(
                "Erreur Supabase lors de l'ajout du message",
                "Le message sera sauvegardé localement",
              ),
              {
                operation: "useAutoSave.addMessage",
                conversationId: activeConversationId,
                metadata: { requestId, userId: user.id, error: supabaseError, errorMessage },
              },
            );
            logger.error(
              "Erreur lors de l'ajout du message dans Supabase, utilisation de localStorage",
              "conversation",
              { error: supabaseError, errorMessage },
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
    [log, conversationId, createConversation, convertMessage, triggerTitleGeneration, user?.id],
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
    [log, user?.id],
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
  }, [log]);

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
