import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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

  // Query keys
  const queryKeys = {
    conversations: ["conversations", user?.id || "guest", filters, sortBy, sortOrder] as const,
    conversation: (id: string) => ["conversation", user?.id || "guest", id] as const,
    messages: (conversationId: string) =>
      ["messages", user?.id || "guest", conversationId] as const,
    infinite: ["conversations-infinite", user?.id || "guest", filters, sortBy, sortOrder] as const,
  };

  // Conversations list query with pagination
  const conversationsQuery = useInfiniteQuery({
    queryKey: queryKeys.infinite,
    queryFn: async ({ pageParam = 0 }) => {
      try {
        console.log("[useConversations] Chargement conversations depuis localStorage...");
        const conversations = ConversationStorage.getConversations();
        console.log("[useConversations] Conversations chargées:", conversations.length);

        // Convertir les dates string en Date objects
        const conversationsWithDates = conversations.map((conv) => ({
          ...conv,
          createdAt: typeof conv.createdAt === "string" ? new Date(conv.createdAt) : conv.createdAt,
          updatedAt: typeof conv.updatedAt === "string" ? new Date(conv.updatedAt) : conv.updatedAt,
        }));

        // Apply filters
        let filteredConversations = conversationsWithDates.filter((conv) => {
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

  // Single conversation hook
  const useConversation = useCallback(
    (conversationId: string) => {
      const conversationQuery = useQuery({
        queryKey: queryKeys.conversation(conversationId),
        queryFn: () => ConversationStorage.getConversation(conversationId),
        staleTime: 1000 * 60 * 2,
      });

      const messagesQuery = useQuery({
        queryKey: queryKeys.messages(conversationId),
        queryFn: () => ConversationStorage.getMessages(conversationId),
        staleTime: 1000 * 60 * 2,
      });

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
    [queryKeys],
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

      // Create conversation using simple storage
      return ConversationStorage.createConversation({
        title: conversationData.title,
        firstMessage: conversationData.firstMessage,
        userId: user?.id || "guest",
      });
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

      queryClient.setQueryData(queryKeys.infinite, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === 0
              ? {
                  ...page,
                  conversations: [optimisticConversation, ...page.conversations],
                  totalCount: page.totalCount + 1,
                }
              : page,
          ),
        };
      });

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
      queryClient.setQueryData(queryKeys.infinite, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            conversations: page.conversations.map((conv: Conversation) =>
              conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv,
            ),
          })),
        };
      });

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
      ConversationStorage.deleteConversation(conversationId);
      return conversationId;
    },
    onMutate: async (conversationId) => {
      if (!enableOptimisticUpdates) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.infinite });

      const previousConversations = queryClient.getQueryData(queryKeys.infinite);

      // Optimistically remove conversation
      queryClient.setQueryData(queryKeys.infinite, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            conversations: page.conversations.filter(
              (conv: Conversation) => conv.id !== conversationId,
            ),
            totalCount: page.totalCount - 1,
          })),
        };
      });

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

      ConversationStorage.addMessages(conversationId, [messageWithId]);

      // Update conversation message count
      const conversation = ConversationStorage.getConversation(conversationId);
      if (conversation) {
        ConversationStorage.updateConversation({
          ...conversation,
          messageCount: conversation.messageCount + 1,
          updatedAt: new Date(),
        });
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

    const handleRealtimeUpdate = (payload: any) => {
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
    logger.debug("Real-time sync would be enabled here", "conversation", {
      userId: user.id,
    });

    return () => {
      // Cleanup real-time subscriptions
      logger.debug("Real-time sync cleanup", "conversation");
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
