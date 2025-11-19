import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import * as ConversationStorage from "../lib/storage/ConversationStorageSimple";
import { useAuth } from "../contexts/AuthContext";
import {
  Conversation,
  ConversationMessage,
  ConversationError,
  ConversationSearchFilters,
  ConversationSearchResult,
  CONVERSATION_LIMITS,
} from "../types/conversation";
import { isE2ETestingEnvironment } from "@/lib/e2e-detection";
import { ErrorSeverity, ErrorCategory } from "../lib/error-handling";
import {
  sortConversations,
  updateFavoriteRank,
  getNextFavoriteRank,
} from "../services/sort-comparator";

/**
 * Conversation operation states
 */
export interface ConversationOperationState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error?: ConversationError;
}

/**
 * Conversation list state with pagination
 */
export interface ConversationListState extends ConversationOperationState {
  conversations: Conversation[];
  totalCount: number;
  hasMore: boolean;
  isEmpty: boolean;
}

/**
 * Single conversation state
 */
export interface ConversationState extends ConversationOperationState {
  conversation?: Conversation;
  messages: ConversationMessage[];
  messageCount: number;
}

/**
 * Conversation creation data
 */
export interface CreateConversationData {
  title?: string;
  firstMessage: string;
  metadata?: {
    aiModel?: string;
    language?: "fr" | "en";
    userAgent?: string;
  };
}

/**
 * Conversation update data
 */
export interface UpdateConversationData {
  title?: string;
  status?: "active" | "completed" | "archived";
  isFavorite?: boolean;
  favorite_rank?: number;
  tags?: string[];
  relatedPollId?: string;
}

/**
 * Configuration for useConversations hook
 */
export interface UseConversationsConfig {
  pageSize?: number;
  enableRealtime?: boolean;
  enableOptimisticUpdates?: boolean;
  filters?: ConversationSearchFilters;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

/**
 * Hook for managing conversations with CRUD operations, state management, and real-time sync
 */
export function useConversations(config: UseConversationsConfig = {}) {
  const {
    pageSize = 20,
    enableRealtime = true,
    enableOptimisticUpdates = true,
    filters = {},
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = config;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query keys - memoized to prevent unnecessary re-renders
  const queryKeys = useMemo(
    () => ({
      conversations: ["conversations", user?.id || "guest", filters, sortBy, sortOrder] as const,
      conversation: (id: string) => ["conversation", user?.id || "guest", id] as const,
      messages: (conversationId: string) =>
        ["messages", user?.id || "guest", conversationId] as const,
      infinite: [
        "conversations-infinite",
        user?.id || "guest",
        filters,
        sortBy,
        sortOrder,
      ] as const,
    }),
    [user?.id, filters, sortBy, sortOrder],
  );

  // Conversations list query with pagination
  const conversationsQuery = useInfiniteQuery({
    queryKey: queryKeys.infinite,
    queryFn: async ({ pageParam = 0 }) => {
      try {
        let conversations: Conversation[] = [];

        // If user is logged in, load from Supabase
        // Vérifier si le mode E2E est désactivé explicitement
        const isE2EDetectionDisabled =
          typeof window !== "undefined" &&
          (window as Window & { __DISABLE_E2E_DETECTION__?: boolean }).__DISABLE_E2E_DETECTION__ ===
            true;

        const isE2ETestMode =
          typeof window !== "undefined" &&
          !isE2EDetectionDisabled &&
          (isE2ETestingEnvironment() ||
            (window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true);

        if (user?.id && !isE2ETestMode) {
          try {
            const { getConversations: getSupabaseConversations } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            const supabaseConversations = await getSupabaseConversations(user.id);
            logger.debug("Conversations chargées depuis Supabase", "conversation", {
              count: supabaseConversations.length,
              userId: user.id,
            });

            // Also get localStorage conversations for merge
            const localConversations = ConversationStorage.getConversations();
            logger.debug("Conversations chargées depuis localStorage", "conversation", {
              count: localConversations.length,
            });

            // Merge: Supabase is source of truth, but keep local if more recent
            const mergedMap = new Map<string, Conversation>();

            // Add Supabase conversations first
            supabaseConversations.forEach((conv) => {
              mergedMap.set(conv.id, conv);
            });

            // Add local conversations if they're more recent or not in Supabase
            localConversations.forEach((localConv) => {
              if (localConv.userId === user.id) {
                const existing = mergedMap.get(localConv.id);
                if (!existing) {
                  // Not in Supabase, add it
                  mergedMap.set(localConv.id, localConv);
                } else {
                  // Compare timestamps, keep the most recent
                  const localDate = new Date(localConv.updatedAt).getTime();
                  const supabaseDate = new Date(existing.updatedAt).getTime();
                  if (localDate > supabaseDate) {
                    mergedMap.set(localConv.id, localConv);
                  }
                }
              }
            });

            conversations = Array.from(mergedMap.values());
          } catch (supabaseError) {
            logger.error(
              "Erreur lors du chargement depuis Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
            // Fallback to localStorage
            conversations = ConversationStorage.getConversations();
          }
        } else {
          // Guest mode: use localStorage only
          conversations = ConversationStorage.getConversations();
        }

        logger.debug("Conversations chargées (après merge)", "conversation", {
          count: conversations.length,
          currentUserId: user?.id || "guest",
          conversations: conversations.map((c) => ({
            id: c.id,
            title: c.title,
            userId: c.userId,
          })),
        });

        // Convertir les dates string en Date objects
        const conversationsWithDates = conversations.map((conv) => ({
          ...conv,
          createdAt: typeof conv.createdAt === "string" ? new Date(conv.createdAt) : conv.createdAt,
          updatedAt: typeof conv.updatedAt === "string" ? new Date(conv.updatedAt) : conv.updatedAt,
        }));

        // Apply filters
        let filteredConversations = conversationsWithDates.filter((conv) => {
          // Filter by user ID: if user is logged in, only show their conversations
          // If user is guest, only show guest conversations (userId is undefined/null)
          if (user?.id) {
            // User is logged in: only show conversations with matching userId
            if (conv.userId !== user.id) return false;
          } else {
            // User is guest: only show guest conversations (no userId)
            if (conv.userId !== undefined && conv.userId !== null) return false;
          }

          if (filters.status && !filters.status.includes(conv.status)) return false;
          if (filters.isFavorite !== undefined && conv.isFavorite !== filters.isFavorite)
            return false;
          if (filters.hasRelatedPoll !== undefined) {
            const hasRelatedPoll = !!conv.relatedPollId;
            if (hasRelatedPoll !== filters.hasRelatedPoll) return false;
          }
          if (filters.dateFrom && conv.createdAt < filters.dateFrom) return false;
          if (filters.dateTo && conv.createdAt > filters.dateTo) return false;
          if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some((tag) => conv.tags.includes(tag));
            if (!hasMatchingTag) return false;
          }
          return true;
        });

        logger.debug("Conversations après filtrage", "conversation", {
          count: filteredConversations.length,
          filters,
          currentUserId: user?.id || "guest",
          conversations: filteredConversations.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            userId: c.userId,
          })),
        });

        // Apply unified sorting with favorites support
        filteredConversations = sortConversations(filteredConversations, {
          criteria: sortBy === "updatedAt" ? "activity" : sortBy,
          order: sortOrder,
          favoriteFirst: true,
        });

        // Paginate
        const start = pageParam * pageSize;
        const end = start + pageSize;
        const paginatedConversations = filteredConversations.slice(start, end);

        logger.debug("Conversations paginées", "conversation", {
          totalCount: filteredConversations.length,
          pageParam,
          pageSize,
          start,
          end,
          paginatedCount: paginatedConversations.length,
          hasMore: end < filteredConversations.length,
        });

        return {
          conversations: paginatedConversations,
          totalCount: filteredConversations.length,
          hasMore: end < filteredConversations.length,
          nextCursor: end < filteredConversations.length ? pageParam + 1 : undefined,
        };
      } catch (error) {
        logger.error("[useConversations] Erreur chargement", error);
        // En mode dev local, retourner un tableau vide au lieu de throw
        // pour éviter l'erreur "Vérifiez votre connexion internet"
        return {
          conversations: [],
          totalCount: 0,
          hasMore: false,
          nextCursor: undefined,
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten paginated data
  const conversationListState = useMemo((): ConversationListState => {
    const conversations =
      conversationsQuery.data?.pages.flatMap((page) => page.conversations) || [];
    const totalCount = conversationsQuery.data?.pages[0]?.totalCount || 0;
    const hasMore = conversationsQuery.hasNextPage || false;

    return {
      conversations,
      totalCount,
      hasMore,
      isEmpty: conversations.length === 0 && !conversationsQuery.isLoading,
      isLoading: conversationsQuery.isLoading,
      isError: conversationsQuery.isError,
      isSuccess: conversationsQuery.isSuccess,
      error: conversationsQuery.error as ConversationError | undefined,
    };
  }, [conversationsQuery]);

  // Single conversation hook factory
  // Note: This returns a function that creates query options, not a hook
  // Components should use useConversationById hook directly instead
  const getConversationQueryOptions = useCallback(
    (conversationId: string) => ({
      queryKey: queryKeys.conversation(conversationId),
      queryFn: async () => {
        if (user?.id) {
          try {
            const { getConversation: getSupabaseConversation } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            const supabaseConv = await getSupabaseConversation(conversationId, user.id);
            if (supabaseConv) {
              // Also cache in localStorage
              ConversationStorage.updateConversation(supabaseConv);
              return supabaseConv;
            }
          } catch (supabaseError) {
            logger.error(
              "Erreur lors du chargement depuis Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
          }
        }
        // Fallback to localStorage
        return ConversationStorage.getConversation(conversationId);
      },
      staleTime: 1000 * 60 * 2,
    }),
    [queryKeys, user?.id],
  );

  const getMessagesQueryOptions = useCallback(
    (conversationId: string) => ({
      queryKey: queryKeys.messages(conversationId),
      queryFn: async () => {
        if (user?.id) {
          try {
            const { getMessages: getSupabaseMessages } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            const supabaseMessages = await getSupabaseMessages(conversationId, user.id);
            if (supabaseMessages.length > 0) {
              // Also cache in localStorage
              ConversationStorage.saveMessages(conversationId, supabaseMessages);
              return supabaseMessages;
            }
          } catch (supabaseError) {
            logger.error(
              "Erreur lors du chargement des messages depuis Supabase, utilisation de localStorage",
              "conversation",
              supabaseError,
            );
          }
        }
        // Fallback to localStorage
        return ConversationStorage.getMessages(conversationId);
      },
      staleTime: 1000 * 60 * 2,
    }),
    [queryKeys, user?.id],
  );

  // Legacy API: useConversation - DEPRECATED
  // WARNING: This violates React hooks rules but is kept for backward compatibility
  // New code should use a separate hook that takes conversationId as a parameter
  const useConversation = useCallback(
    (conversationId: string) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const conversationQuery = useQuery(getConversationQueryOptions(conversationId));

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const messagesQuery = useQuery(getMessagesQueryOptions(conversationId));

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useMemo(
        (): ConversationState => ({
          conversation: conversationQuery.data || undefined,
          messages: messagesQuery.data || [],
          messageCount: messagesQuery.data?.length || 0,
          isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
          isError: conversationQuery.isError || messagesQuery.isError,
          isSuccess: conversationQuery.isSuccess && messagesQuery.isSuccess,
          error: (conversationQuery.error || messagesQuery.error) as ConversationError | undefined,
        }),
        [conversationQuery, messagesQuery],
      );
    },
    [getConversationQueryOptions, getMessagesQueryOptions],
  );

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: CreateConversationData) => {
      const conversationData = {
        title: data.title || data.firstMessage.slice(0, CONVERSATION_LIMITS.MAX_TITLE_LENGTH),
        status: "active" as const,
        firstMessage: data.firstMessage.slice(0, CONVERSATION_LIMITS.FIRST_MESSAGE_PREVIEW_LENGTH),
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {
          pollGenerated: false,
          errorOccurred: false,
          aiModel: data.metadata?.aiModel || "gemini-pro",
          language: data.metadata?.language || "fr",
          userAgent: data.metadata?.userAgent || navigator.userAgent,
        },
      };

      // VÉRIFIER ET CONSOMMER QUOTA AVANT de créer
      const { incrementConversationCreated } = await import("../lib/quotaTracking");
      await incrementConversationCreated(user?.id);

      // Create conversation - save to Supabase if logged in, otherwise localStorage
      if (user?.id) {
        try {
          const { createConversation: createSupabaseConversation } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          const conversation = await createSupabaseConversation(
            {
              ...conversationData,
              userId: user.id,
            },
            user.id,
          );
          // Also save to localStorage as cache
          ConversationStorage.addConversation(conversation);

          return conversation;
        } catch (supabaseError) {
          logger.error(
            "Erreur lors de la création dans Supabase, utilisation de localStorage",
            "conversation",
            supabaseError,
          );
          // Fallback to localStorage
        }
      }
      // Guest mode or fallback: use localStorage
      const conversation = ConversationStorage.createConversation({
        title: conversationData.title,
        firstMessage: conversationData.firstMessage,
        userId: user?.id || "guest",
      });

      return conversation;
    },
    onMutate: async (data) => {
      if (!enableOptimisticUpdates) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.infinite });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(queryKeys.infinite);

      // Optimistically update
      const optimisticConversation: Conversation = {
        id: `temp-${Date.now()}`,
        title: data.title || data.firstMessage.slice(0, CONVERSATION_LIMITS.MAX_TITLE_LENGTH),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessage: data.firstMessage.slice(0, CONVERSATION_LIMITS.FIRST_MESSAGE_PREVIEW_LENGTH),
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: {
          pollGenerated: false,
          errorOccurred: false,
          aiModel: data.metadata?.aiModel || "gemini-pro",
          language: data.metadata?.language || "fr",
          userAgent: data.metadata?.userAgent || navigator.userAgent,
        },
      };

      queryClient.setQueryData(
        queryKeys.infinite,
        (old: InfiniteData<{ conversations: Conversation[]; totalCount?: number }> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(
              (page: { conversations: Conversation[]; totalCount?: number }, index: number) =>
                index === 0
                  ? {
                      ...page,
                      conversations: [optimisticConversation, ...page.conversations],
                      totalCount: (page.totalCount || 0) + 1,
                    }
                  : page,
            ),
          };
        },
      );

      return { previousConversations };
    },
    onError: (error, data, context) => {
      if (enableOptimisticUpdates && context?.previousConversations) {
        queryClient.setQueryData(queryKeys.infinite, context.previousConversations);
      }
    },
    onSuccess: (newConversation) => {
      // Invalidate and refetch all conversation-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });

      // Force refetch of conversations list
      queryClient.refetchQueries({ queryKey: queryKeys.infinite });

      // Dispatch conversationsChanged event to notify other components
      logger.info(
        `🔔 Dispatching conversationsChanged event for conversation ${newConversation.id}`,
        "conversation",
      );
      const event = new CustomEvent("conversationsChanged", {
        detail: { action: "create", conversationId: newConversation.id },
      });
      window.dispatchEvent(event);
      logger.info(`✅ conversationsChanged event dispatched`, "conversation");
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateConversationData }) => {
      const conversation = ConversationStorage.getConversation(id);
      if (!conversation) {
        throw new ConversationError(
          "Conversation not found",
          "NOT_FOUND",
          ErrorSeverity.MEDIUM,
          ErrorCategory.VALIDATION,
          { conversationId: id },
        );
      }

      const finalUpdates = { ...updates };

      // Gérer favorite_rank automatiquement
      if (updates.isFavorite === true && !conversation.isFavorite) {
        // Nouveau favori - assigner le prochain rang disponible
        const allConversations = ConversationStorage.getConversations();
        finalUpdates.favorite_rank = getNextFavoriteRank(allConversations);
      } else if (updates.isFavorite === false && conversation.isFavorite) {
        // Retirer des favoris - supprimer le rang
        finalUpdates.favorite_rank = undefined;
      }

      const updatedConversation = {
        ...conversation,
        ...finalUpdates,
        updatedAt: new Date(),
      };

      // Save to Supabase if logged in
      if (user?.id && conversation.userId === user.id) {
        try {
          const { updateConversation: updateSupabaseConversation } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          await updateSupabaseConversation(updatedConversation, user.id);
        } catch (supabaseError) {
          logger.error(
            "Erreur lors de la mise à jour dans Supabase, utilisation de localStorage",
            "conversation",
            supabaseError,
          );
          // Continue with localStorage update
        }
      }

      // Always update localStorage as cache
      ConversationStorage.updateConversation(updatedConversation);
      return updatedConversation;
    },
    onMutate: async ({ id, updates }) => {
      if (!enableOptimisticUpdates) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.infinite });
      await queryClient.cancelQueries({ queryKey: queryKeys.conversation(id) });

      const previousConversations = queryClient.getQueryData(queryKeys.infinite);
      const previousConversation = queryClient.getQueryData(queryKeys.conversation(id));

      // Optimistically update conversations list
      queryClient.setQueryData(
        queryKeys.infinite,
        (old: InfiniteData<{ conversations: Conversation[] }> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: { conversations: Conversation[] }) => ({
              ...page,
              conversations: page.conversations.map((conv: Conversation) =>
                conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv,
              ),
            })),
          };
        },
      );

      // Optimistically update single conversation
      queryClient.setQueryData(queryKeys.conversation(id), (old: Conversation | undefined) => {
        if (!old) return old;
        return { ...old, ...updates, updatedAt: new Date() };
      });

      return { previousConversations, previousConversation };
    },
    onError: (error, { id }, context) => {
      if (enableOptimisticUpdates && context) {
        if (context.previousConversations) {
          queryClient.setQueryData(queryKeys.infinite, context.previousConversations);
        }
        if (context.previousConversation) {
          queryClient.setQueryData(queryKeys.conversation(id), context.previousConversation);
        }
      }
    },
    onSuccess: (updatedConversation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
      queryClient.setQueryData(queryKeys.conversation(updatedConversation.id), updatedConversation);
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Get conversation first to check ownership
      const conversation = ConversationStorage.getConversation(conversationId);

      // Delete from Supabase if logged in and owned by user
      if (user?.id && conversation?.userId === user.id) {
        try {
          const { deleteConversation: deleteSupabaseConversation } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          await deleteSupabaseConversation(conversationId, user.id);
        } catch (supabaseError) {
          logger.error(
            "Erreur lors de la suppression dans Supabase, utilisation de localStorage",
            "conversation",
            supabaseError,
          );
          // Continue with localStorage deletion
        }
      }

      // Always delete from localStorage
      ConversationStorage.deleteConversation(conversationId);
      return conversationId;
    },
    onMutate: async (conversationId) => {
      if (!enableOptimisticUpdates) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.infinite });

      const previousConversations = queryClient.getQueryData(queryKeys.infinite);

      // Optimistically remove conversation
      queryClient.setQueryData(
        queryKeys.infinite,
        (old: InfiniteData<{ conversations: Conversation[]; totalCount?: number }> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(
              (page: { conversations: Conversation[]; totalCount?: number }) => ({
                ...page,
                conversations: page.conversations.filter(
                  (conv: Conversation) => conv.id !== conversationId,
                ),
                totalCount: (page.totalCount || 0) - 1,
              }),
            ),
          };
        },
      );

      return { previousConversations };
    },
    onError: (error, conversationId, context) => {
      if (enableOptimisticUpdates && context?.previousConversations) {
        queryClient.setQueryData(queryKeys.infinite, context.previousConversations);
      }
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.conversation(deletedId),
      });
      queryClient.removeQueries({ queryKey: queryKeys.messages(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.infinite });

      // Dispatch conversationsChanged event to notify other components
      logger.info(
        `🔔 Dispatching conversationsChanged event for conversation ${deletedId}`,
        "conversation",
      );
      const event = new CustomEvent("conversationsChanged", {
        detail: { action: "delete", conversationId: deletedId },
      });
      window.dispatchEvent(event);
      logger.info(`✅ conversationsChanged event dispatched`, "conversation");
    },
  });

  // Add message to conversation
  const addMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ConversationMessage;
    }) => {
      const messageWithId = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        conversationId,
      };

      // Get conversation first to check ownership
      const conversation = ConversationStorage.getConversation(conversationId);

      // Save to Supabase if logged in and owned by user
      if (user?.id && conversation?.userId === user.id) {
        try {
          const { addMessages: addSupabaseMessages } = await import(
            "../lib/storage/ConversationStorageSupabase"
          );
          await addSupabaseMessages(conversationId, [messageWithId], user.id);
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
      ConversationStorage.addMessages(conversationId, [messageWithId]);

      // Update conversation message count
      if (conversation) {
        const updatedConversation = {
          ...conversation,
          messageCount: conversation.messageCount + 1,
          updatedAt: new Date(),
        };

        // Update in Supabase if logged in
        if (user?.id && conversation.userId === user.id) {
          try {
            const { updateConversation: updateSupabaseConversation } = await import(
              "../lib/storage/ConversationStorageSupabase"
            );
            await updateSupabaseConversation(updatedConversation, user.id);
          } catch (supabaseError) {
            logger.error(
              "Erreur lors de la mise à jour du message count dans Supabase",
              "conversation",
              supabaseError,
            );
          }
        }

        // Always update localStorage
        ConversationStorage.updateConversation(updatedConversation);
      }

      return messageWithId;
    },
    onMutate: async ({ conversationId, message }) => {
      if (!enableOptimisticUpdates) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.messages(conversationId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversation(conversationId),
      });

      const previousMessages = queryClient.getQueryData(queryKeys.messages(conversationId));
      const previousConversation = queryClient.getQueryData(queryKeys.conversation(conversationId));

      // Optimistic message
      const optimisticMessage: ConversationMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        timestamp: new Date(),
      };

      // Update messages
      queryClient.setQueryData(
        queryKeys.messages(conversationId),
        (old: ConversationMessage[] | undefined) => {
          return old ? [...old, optimisticMessage] : [optimisticMessage];
        },
      );

      // Update conversation message count and updatedAt
      queryClient.setQueryData(
        queryKeys.conversation(conversationId),
        (old: Conversation | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messageCount: old.messageCount + 1,
            updatedAt: new Date(),
          };
        },
      );

      return { previousMessages, previousConversation };
    },
    onError: (error, { conversationId }, context) => {
      if (enableOptimisticUpdates && context) {
        if (context.previousMessages) {
          queryClient.setQueryData(queryKeys.messages(conversationId), context.previousMessages);
        }
        if (context.previousConversation) {
          queryClient.setQueryData(
            queryKeys.conversation(conversationId),
            context.previousConversation,
          );
        }
      }
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(newMessage.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(newMessage.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
    },
  });

  // Real-time synchronization effect
  useEffect(() => {
    if (!enableRealtime || !user) {
      return;
    }

    // TODO: Implement Supabase real-time subscriptions when ConversationStorageSupabase is available
    // This would listen for INSERT, UPDATE, DELETE events on conversations and messages tables
    // and automatically update the query cache

    const handleRealtimeUpdate = (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new?: Conversation;
      old?: Conversation;
    }) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case "INSERT":
          queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
          break;
        case "UPDATE":
          queryClient.setQueryData(queryKeys.conversation(newRecord.id), newRecord);
          queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
          break;
        case "DELETE":
          queryClient.removeQueries({
            queryKey: queryKeys.conversation(oldRecord.id),
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
          break;
      }
    };

    // Placeholder for real-time subscription setup
    // Real-time sync will be implemented when Supabase storage is available

    return () => {
      // Cleanup real-time subscriptions
    };
  }, [enableRealtime, user, queryClient, queryKeys]);

  // Reorder favorite conversations
  const reorderFavorite = useCallback(
    async (conversationId: string, newRank: number) => {
      const allConversations = ConversationStorage.getConversations();
      const updatedConversations = updateFavoriteRank(allConversations, conversationId, newRank);

      // Update storage with new ranks
      const targetConversation = updatedConversations.find((conv) => conv.id === conversationId);
      if (targetConversation) {
        ConversationStorage.updateConversation(targetConversation);

        // Invalidate queries to trigger re-sort
        queryClient.invalidateQueries({ queryKey: queryKeys.infinite });
      }
    },
    [queryClient, queryKeys],
  );

  // Load more conversations
  const loadMore = useCallback(() => {
    if (conversationsQuery.hasNextPage && !conversationsQuery.isFetchingNextPage) {
      conversationsQuery.fetchNextPage();
    }
  }, [conversationsQuery]);

  // Refresh conversations
  const refresh = useCallback(async () => {
    await conversationsQuery.refetch();
  }, [conversationsQuery]);

  // Search conversations
  const searchConversations = useCallback(
    async (query: string): Promise<Conversation[]> => {
      const allConversations = conversationListState.conversations;

      if (!query.trim()) {
        return allConversations;
      }

      const searchTerm = query.toLowerCase();
      return allConversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchTerm) ||
          conv.firstMessage.toLowerCase().includes(searchTerm) ||
          conv.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );
    },
    [conversationListState.conversations],
  );

  return {
    // List state
    conversations: conversationListState,

    // Single conversation hook
    useConversation,

    // Operations
    createConversation: {
      mutate: createConversationMutation.mutate,
      mutateAsync: createConversationMutation.mutateAsync,
      isLoading: createConversationMutation.isPending,
      isError: createConversationMutation.isError,
      isSuccess: createConversationMutation.isSuccess,
      error: createConversationMutation.error as ConversationError | undefined,
      reset: createConversationMutation.reset,
    },

    updateConversation: {
      mutate: updateConversationMutation.mutate,
      mutateAsync: updateConversationMutation.mutateAsync,
      isLoading: updateConversationMutation.isPending,
      isError: updateConversationMutation.isError,
      isSuccess: updateConversationMutation.isSuccess,
      error: updateConversationMutation.error as ConversationError | undefined,
      reset: updateConversationMutation.reset,
    },

    deleteConversation: {
      mutate: deleteConversationMutation.mutate,
      mutateAsync: deleteConversationMutation.mutateAsync,
      isLoading: deleteConversationMutation.isPending,
      isError: deleteConversationMutation.isError,
      isSuccess: deleteConversationMutation.isSuccess,
      error: deleteConversationMutation.error as ConversationError | undefined,
      reset: deleteConversationMutation.reset,
    },

    addMessage: {
      mutate: addMessageMutation.mutate,
      mutateAsync: addMessageMutation.mutateAsync,
      isLoading: addMessageMutation.isPending,
      isError: addMessageMutation.isError,
      isSuccess: addMessageMutation.isSuccess,
      error: addMessageMutation.error as ConversationError | undefined,
      reset: addMessageMutation.reset,
    },

    // Utilities
    loadMore,
    refresh,
    searchConversations,
    reorderFavorite,

    // State flags
    isLoadingMore: conversationsQuery.isFetchingNextPage,
    canLoadMore: conversationsQuery.hasNextPage,
    isRefreshing: conversationsQuery.isRefetching,

    // Configuration
    config: {
      pageSize,
      enableRealtime,
      enableOptimisticUpdates,
      filters,
      sortBy,
      sortOrder,
    },
  };
}
