import {
  Conversation,
  ConversationMessage,
  ConversationError,
  StorageProvider,
} from "../types/conversation";
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
export declare function useConversationStorage(config?: UseConversationStorageConfig): {
  storageMode: StorageMode;
  conversations: {
    data: Conversation[];
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    refetch: (
      options?: import("@tanstack/query-core").RefetchOptions,
    ) => Promise<import("@tanstack/query-core").QueryObserverResult<Conversation[], Error>>;
  };
  useConversation: (
    conversationId: string,
  ) => import("@tanstack/react-query").UseQueryResult<Conversation, Error>;
  useMessages: (
    conversationId: string,
  ) => import("@tanstack/react-query").UseQueryResult<ConversationMessage[], Error>;
  createConversation: {
    mutate: import("@tanstack/react-query").UseMutateFunction<
      Conversation,
      Error,
      Omit<Conversation, "id" | "createdAt" | "updatedAt">,
      unknown
    >;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<
      Conversation,
      Error,
      Omit<Conversation, "id" | "createdAt" | "updatedAt">,
      unknown
    >;
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    isSuccess: boolean;
    reset: () => void;
  };
  updateConversation: {
    mutate: import("@tanstack/react-query").UseMutateFunction<
      Conversation,
      Error,
      {
        id: string;
        updates: Partial<Conversation>;
      },
      unknown
    >;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<
      Conversation,
      Error,
      {
        id: string;
        updates: Partial<Conversation>;
      },
      unknown
    >;
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    isSuccess: boolean;
    reset: () => void;
  };
  deleteConversation: {
    mutate: import("@tanstack/react-query").UseMutateFunction<string, Error, string, unknown>;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<
      string,
      Error,
      string,
      unknown
    >;
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    isSuccess: boolean;
    reset: () => void;
  };
  addMessage: {
    mutate: import("@tanstack/react-query").UseMutateFunction<
      ConversationMessage,
      Error,
      {
        conversationId: string;
        message: ConversationMessage;
      },
      unknown
    >;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<
      ConversationMessage,
      Error,
      {
        conversationId: string;
        message: ConversationMessage;
      },
      unknown
    >;
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    isSuccess: boolean;
    reset: () => void;
  };
  clearAllData: {
    mutate: import("@tanstack/react-query").UseMutateFunction<void, Error, void, unknown>;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<void, Error, void, unknown>;
    isLoading: boolean;
    isError: boolean;
    error: ConversationError | undefined;
    isSuccess: boolean;
    reset: () => void;
  };
  invalidateCache: (type?: "conversations" | "messages" | "all") => void;
  refreshFromStorage: () => Promise<void>;
  switchProvider: (provider: StorageProvider) => Promise<void>;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  quota: {
    used: number;
    limit: number;
    remaining: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
  canCreateConversation: boolean;
  shouldShowQuotaWarning: boolean;
};
