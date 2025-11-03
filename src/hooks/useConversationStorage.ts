import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import * as ConversationStorageSimple from "../lib/storage/ConversationStorageSimple";
// ConversationStorageSupabase will be implemented in Task 1.3
// import { ConversationStorageSupabase } from '../lib/storage/ConversationStorageSupabase';
import { ConversationMigrationService } from "../lib/storage/ConversationMigrationService";
import { useAuth } from "../contexts/AuthContext";
import {
  Conversation,
  ConversationMessage,
  ConversationError,
  StorageProvider,
  CONVERSATION_LIMITS,
} from "../types/conversation";
import {
  handleError,
  ErrorFactory,
  logError,
  ErrorSeverity,
  ErrorCategory,
} from "../lib/error-handling";

/**
 * Storage mode detection result
 */
export interface StorageMode {
  provider: StorageProvider;
  isAuthenticated: boolean;
  isGuest: boolean;
  canMigrate: boolean;
  quotaInfo: {
    used: number;
    limit: number;
    remaining: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
}

/**
 * Storage operation result with error handling
 */
export interface StorageResult<T> {
  data?: T;
  error?: ConversationError;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Configuration for useConversationStorage hook
 */
export interface UseConversationStorageConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  enableAutoMigration?: boolean;
  enableCache?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Hook for managing conversation storage with automatic provider detection
 * Provides abstraction between localStorage and Supabase with caching and error handling
 */
export function useConversationStorage(config: UseConversationStorageConfig = {}) {
  const {
    supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "",
    supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "",
    enableAutoMigration = true,
    enableCache = true,
    cacheTime = 1000 * 60 * 5, // 5 minutes
    staleTime = 1000 * 60 * 2, // 2 minutes
    retryAttempts = 3,
    retryDelay = 1000,
  } = config;

  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Storage instances
  const [localStorage] = useState(() => {
    logger.debug("Using localStorage for guest user", "conversation");
    return ConversationStorageSimple;
  });
  const [supabaseStorage] = useState(
    () =>
      // ConversationStorageSupabase will be implemented in Task 1.3
      // supabaseUrl && supabaseKey
      //   ? new ConversationStorageSupabase(supabaseUrl, supabaseKey)
      //   : null
      null,
  );

  // Storage mode detection
  const storageMode = useMemo((): StorageMode => {
    const isAuthenticated = !!user && !authLoading;
    const isGuest = !user && !authLoading;
    const provider: StorageProvider =
      isAuthenticated && supabaseStorage ? "supabase" : "localStorage";

    // Get quota information
    const conversations = ConversationStorageSimple.getConversations();
    const conversationCount = conversations.length || 0;
    const limit = isGuest
      ? CONVERSATION_LIMITS.GUEST_MAX_CONVERSATIONS
      : CONVERSATION_LIMITS.AUTHENTICATED_MAX_CONVERSATIONS;
    const used = conversationCount;
    const remaining = Math.max(0, limit - used);
    const isNearLimit = remaining <= 2;
    const isAtLimit = remaining <= 0;

    // Check if migration is possible
    const canMigrate = isGuest && conversationCount > 0 && supabaseStorage !== null;

    return {
      provider,
      isAuthenticated,
      isGuest,
      canMigrate,
      quotaInfo: {
        used,
        limit,
        remaining,
        isNearLimit,
        isAtLimit,
      },
    };
  }, [user, authLoading, supabaseStorage, localStorage]);

  // Get active storage instance
  const activeStorage = useMemo(() => {
    return storageMode.provider === "supabase" && supabaseStorage
      ? supabaseStorage
      : {
          createConversation: async (
            conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
          ) => {
            try {
              // Use the createConversation method instead of manual creation
              return await ConversationStorageSimple.createConversation(conversation);
            } catch (error) {
              const processedError = handleError(
                error,
                {
                  component: "useConversationStorage",
                  operation: "createConversation",
                },
                "Erreur lors de la création de la conversation",
              );

              logError(processedError, {
                component: "useConversationStorage",
                operation: "createConversation",
              });

              throw processedError;
            }
          },
          getConversations: () => {
            return ConversationStorageSimple.getConversations();
          },
          getConversation: (id: string) => {
            return ConversationStorageSimple.getConversation(id);
          },
          getMessages: (conversationId: string) => {
            return ConversationStorageSimple.getMessages(conversationId);
          },
          saveMessages: async (conversationId: string, messages: ConversationMessage[]) => {
            // Verify conversation exists before attempting to save messages
            const conversation = await ConversationStorageSimple.getConversation(conversationId);
            if (!conversation) {
              const availableConversations = await ConversationStorageSimple.getConversations();
              const verificationError = ErrorFactory.validation(
                "Conversation non trouvée avant sauvegarde des messages",
              );

              logError(verificationError, {
                component: "useConversationStorage",
                operation: "saveMessages",
              });
              throw new ConversationError(
                `Cannot save messages: conversation ${conversationId} not found`,
                "CONVERSATION_NOT_FOUND_BEFORE_MESSAGE_SAVE",
                ErrorSeverity.HIGH,
                ErrorCategory.STORAGE,
                { conversationId },
              );
            }

            logger.debug("Conversation verified before saving messages", "conversation", {
              conversationId,
              conversationTitle: conversation.title,
              messageCount: messages.length,
            });

            return ConversationStorageSimple.saveMessages(conversationId, messages);
          },
          deleteConversation: (id: string) => ConversationStorageSimple.deleteConversation(id),
        };
  }, [storageMode.provider, supabaseStorage]);

  // Query keys
  const queryKeys = {
    conversations: ["conversations", storageMode.provider, user?.id || "guest"] as const,
    conversation: (id: string) =>
      ["conversation", storageMode.provider, user?.id || "guest", id] as const,
    messages: (conversationId: string) =>
      ["messages", storageMode.provider, user?.id || "guest", conversationId] as const,
    quota: ["quota", storageMode.provider, user?.id || "guest"] as const,
  };

  // Auto-migration effect
  useEffect(() => {
    if (enableAutoMigration && storageMode.canMigrate && storageMode.isAuthenticated) {
      const performAutoMigration = async () => {
        try {
          const migrationNeeded = await ConversationMigrationService.isMigrationNeeded();
          if (migrationNeeded && supabaseUrl && supabaseKey) {
            const migrationService = new ConversationMigrationService(supabaseUrl, supabaseKey, {
              batchSize: 3,
              validateBeforeUpload: true,
              enableRollback: true,
              retryAttempts: 2,
            });

            const result = await migrationService.migrate();
            if (result.success) {
              // Invalidate all queries to refresh with migrated data
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
              queryClient.invalidateQueries({ queryKey: ["messages"] });
            }
          }
        } catch (error) {
          logError(
            ErrorFactory.storage("Auto-migration failed", "Échec de la migration automatique"),
            {
              component: "useConversationStorage",
              metadata: { originalError: error },
            },
          );
        }
      };

      performAutoMigration();
    }
  }, [
    storageMode.canMigrate,
    storageMode.isAuthenticated,
    enableAutoMigration,
    supabaseUrl,
    supabaseKey,
    queryClient,
  ]);

  // Conversations query
  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      try {
        return await activeStorage.getConversations();
      } catch (error) {
        throw new ConversationError(
          "Failed to fetch conversations",
          "FETCH_ERROR",
          ErrorSeverity.MEDIUM,
          ErrorCategory.STORAGE,
          {
            metadata: { originalError: error, provider: storageMode.provider },
          },
        );
      }
    },
    enabled: enableCache && !authLoading,
    staleTime,
    gcTime: cacheTime,
    retry: retryAttempts,
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 10000),
  });

  // Single conversation query
  const useConversation = useCallback(
    (conversationId: string) => {
      return useQuery({
        queryKey: queryKeys.conversation(conversationId),
        queryFn: async () => {
          try {
            return await activeStorage.getConversation(conversationId);
          } catch (error) {
            throw new ConversationError(
              `Failed to fetch conversation ${conversationId}`,
              "FETCH_ERROR",
              ErrorSeverity.MEDIUM,
              ErrorCategory.STORAGE,
              {
                conversationId,
                metadata: {
                  originalError: error,
                  provider: storageMode.provider,
                },
              },
            );
          }
        },
        enabled: enableCache && !!conversationId && !authLoading,
        staleTime,
        gcTime: cacheTime,
        retry: retryAttempts,
      });
    },
    [
      activeStorage,
      storageMode.provider,
      enableCache,
      authLoading,
      staleTime,
      cacheTime,
      retryAttempts,
    ],
  );

  // Messages query
  const useMessages = useCallback(
    (conversationId: string) => {
      return useQuery({
        queryKey: queryKeys.messages(conversationId),
        queryFn: async () => {
          try {
            return await activeStorage.getMessages(conversationId);
          } catch (error) {
            throw new ConversationError(
              `Failed to fetch messages for conversation ${conversationId}`,
              "FETCH_ERROR",
              ErrorSeverity.MEDIUM,
              ErrorCategory.STORAGE,
              {
                conversationId,
                metadata: {
                  originalError: error,
                  provider: storageMode.provider,
                },
              },
            );
          }
        },
        enabled: enableCache && !!conversationId && !authLoading,
        staleTime,
        gcTime: cacheTime,
        retry: retryAttempts,
      });
    },
    [
      activeStorage,
      storageMode.provider,
      enableCache,
      authLoading,
      staleTime,
      cacheTime,
      retryAttempts,
    ],
  );

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">) => {
      // Check quota before creating
      if (storageMode.quotaInfo.isAtLimit) {
        throw new ConversationError(
          "Quota de conversations dépassé",
          "QUOTA_EXCEEDED",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          { metadata: { quotaInfo: storageMode.quotaInfo } },
        );
      }

      try {
        const result = await activeStorage.createConversation(conversation);
        return result;
      } catch (error) {
        throw new ConversationError(
          "Failed to create conversation",
          "CREATE_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          {
            metadata: { originalError: error, provider: storageMode.provider },
          },
        );
      }
    },
    onSuccess: (newConversation) => {
      // Update conversations cache
      queryClient.setQueryData(queryKeys.conversations, (old: Conversation[] | undefined) => {
        return old ? [newConversation, ...old] : [newConversation];
      });

      // Invalidate conversations query to force refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });

      // Update quota cache
      queryClient.invalidateQueries({ queryKey: queryKeys.quota });
    },
    retry: retryAttempts,
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Conversation> }) => {
      try {
        return await activeStorage.getConversation(id);
      } catch (error) {
        throw new ConversationError(
          `Failed to update conversation ${id}`,
          "UPDATE_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          {
            conversationId: id,
            metadata: { originalError: error, provider: storageMode.provider },
          },
        );
      }
    },
    onSuccess: (updatedConversation) => {
      // Update conversations cache
      queryClient.setQueryData(queryKeys.conversations, (old: Conversation[] | undefined) => {
        return (
          old?.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv)) ||
          []
        );
      });

      // Update single conversation cache
      queryClient.setQueryData(queryKeys.conversation(updatedConversation.id), updatedConversation);
    },
    retry: retryAttempts,
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        await activeStorage.deleteConversation(conversationId);
        return conversationId;
      } catch (error) {
        throw new ConversationError(
          `Failed to delete conversation ${conversationId}`,
          "DELETE_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          {
            conversationId,
            metadata: { originalError: error, provider: storageMode.provider },
          },
        );
      }
    },
    onSuccess: (deletedId) => {
      // Remove from conversations cache
      queryClient.setQueryData(queryKeys.conversations, (old: Conversation[] | undefined) => {
        return old?.filter((conv) => conv.id !== deletedId) || [];
      });

      // Remove conversation and messages caches
      queryClient.removeQueries({
        queryKey: queryKeys.conversation(deletedId),
      });
      queryClient.removeQueries({ queryKey: queryKeys.messages(deletedId) });

      // Update quota cache
      queryClient.invalidateQueries({ queryKey: queryKeys.quota });
    },
    retry: retryAttempts,
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: ConversationMessage;
    }) => {
      try {
        // Update conversation's message count and updatedAt
        queryClient.setQueryData(queryKeys.conversations, (old: Conversation[] | undefined) => {
          return (
            old?.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messageCount: conv.messageCount + 1,
                    updatedAt: new Date(),
                  }
                : conv,
            ) || []
          );
        });

        // Return the message with conversationId for the onSuccess callback
        return message;
      } catch (error) {
        const processedError = handleError(
          error,
          {
            component: "useConversationStorage",
            operation: "saveMessages",
            conversationId,
          },
          "Erreur lors de la sauvegarde des messages",
        );

        logError(processedError, {
          component: "useConversationStorage",
          operation: "saveMessages",
          conversationId,
        });

        throw new ConversationError(
          `Failed to add message to conversation ${conversationId}`,
          "CREATE_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          { conversationId, metadata: { originalError: processedError } },
        );
      }
    },
    retry: retryAttempts,
  });

  // Clear all data mutation
  const clearAllDataMutation = useMutation({
    mutationFn: async () => {
      try {
        await activeStorage.clearAllData();
      } catch (error) {
        throw new ConversationError(
          "Failed to clear all data",
          "DELETE_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.STORAGE,
          {
            metadata: { originalError: error, provider: storageMode.provider },
          },
        );
      }
    },
    onSuccess: () => {
      // Clear all caches
      queryClient.removeQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.quota });
    },
    retry: retryAttempts,
  });

  // Manual cache invalidation
  const invalidateCache = useCallback(
    (type?: "conversations" | "messages" | "all") => {
      switch (type) {
        case "conversations":
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          break;
        case "messages":
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          break;
        default:
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      }
    },
    [queryClient, queryKeys.quota],
  );

  // Force refresh from storage
  const refreshFromStorage = useCallback(async () => {
    invalidateCache("all");
    await queryClient.refetchQueries({ queryKey: queryKeys.conversations });
  }, [invalidateCache, queryClient, queryKeys.conversations]);

  // Switch storage provider (for testing/debugging)
  const switchProvider = useCallback(
    async (provider: StorageProvider) => {
      if (provider === "supabase" && !supabaseStorage) {
        throw new ConversationError(
          "Supabase storage not available",
          "CONFIGURATION_ERROR",
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          { metadata: { provider } },
        );
      }

      // This would require re-initializing the hook with different config
      // For now, just invalidate caches
      invalidateCache("all");
    },
    [supabaseStorage, invalidateCache],
  );

  return {
    // Storage mode information
    storageMode,

    // Data queries
    conversations: {
      data: conversationsQuery.data || [],
      isLoading: conversationsQuery.isLoading,
      isError: conversationsQuery.isError,
      error: conversationsQuery.error as ConversationError | undefined,
      refetch: conversationsQuery.refetch,
    },

    // Query hooks for components
    useConversation,
    useMessages,

    // Mutations
    createConversation: {
      mutate: createConversationMutation.mutate,
      mutateAsync: createConversationMutation.mutateAsync,
      isLoading: createConversationMutation.isPending,
      isError: createConversationMutation.isError,
      error: createConversationMutation.error as ConversationError | undefined,
      isSuccess: createConversationMutation.isSuccess,
      reset: createConversationMutation.reset,
    },

    updateConversation: {
      mutate: updateConversationMutation.mutate,
      mutateAsync: updateConversationMutation.mutateAsync,
      isLoading: updateConversationMutation.isPending,
      isError: updateConversationMutation.isError,
      error: updateConversationMutation.error as ConversationError | undefined,
      isSuccess: updateConversationMutation.isSuccess,
      reset: updateConversationMutation.reset,
    },

    deleteConversation: {
      mutate: deleteConversationMutation.mutate,
      mutateAsync: deleteConversationMutation.mutateAsync,
      isLoading: deleteConversationMutation.isPending,
      isError: deleteConversationMutation.isError,
      error: deleteConversationMutation.error as ConversationError | undefined,
      isSuccess: deleteConversationMutation.isSuccess,
      reset: deleteConversationMutation.reset,
    },

    addMessage: {
      mutate: addMessageMutation.mutate,
      mutateAsync: addMessageMutation.mutateAsync,
      isLoading: addMessageMutation.isPending,
      isError: addMessageMutation.isError,
      error: addMessageMutation.error as ConversationError | undefined,
      isSuccess: addMessageMutation.isSuccess,
      reset: addMessageMutation.reset,
    },

    clearAllData: {
      mutate: clearAllDataMutation.mutate,
      mutateAsync: clearAllDataMutation.mutateAsync,
      isLoading: clearAllDataMutation.isPending,
      isError: clearAllDataMutation.isError,
      error: clearAllDataMutation.error as ConversationError | undefined,
      isSuccess: clearAllDataMutation.isSuccess,
      reset: clearAllDataMutation.reset,
    },

    // Cache management
    invalidateCache,
    refreshFromStorage,

    // Utilities
    switchProvider,

    // Computed properties
    isLoading: authLoading || conversationsQuery.isLoading,
    hasError: conversationsQuery.isError,
    isEmpty: conversationsQuery.data?.length === 0,

    // Quota information
    quota: storageMode.quotaInfo,
    canCreateConversation: !storageMode.quotaInfo.isAtLimit,
    shouldShowQuotaWarning: storageMode.quotaInfo.isNearLimit,
  };
}
