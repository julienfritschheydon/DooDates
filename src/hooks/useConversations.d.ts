import { Conversation, ConversationMessage, ConversationError, ConversationSearchFilters } from "../types/conversation";
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
export declare function useConversations(config?: UseConversationsConfig): {
    conversations: ConversationListState;
    useConversation: (conversationId: string) => ConversationState;
    createConversation: {
        mutate: import("@tanstack/react-query").UseMutateFunction<Conversation, Error, CreateConversationData, {
            previousConversations: unknown;
        }>;
        mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<Conversation, Error, CreateConversationData, {
            previousConversations: unknown;
        }>;
        isLoading: boolean;
        isError: boolean;
        isSuccess: boolean;
        error: ConversationError | undefined;
        reset: () => void;
    };
    updateConversation: {
        mutate: import("@tanstack/react-query").UseMutateFunction<{
            updatedAt: Date;
            title: string;
            status: import("../types/conversation").ConversationStatus;
            isFavorite: boolean;
            favorite_rank?: number;
            tags: string[];
            relatedPollId?: string;
            id: string;
            createdAt: Date;
            firstMessage: string;
            messageCount: number;
            pollId?: string;
            pollType?: "date" | "form" | null;
            pollStatus?: "draft" | "active" | "closed" | "archived";
            metadata?: import("../types/conversation").ConversationMetadata;
            userId?: string;
        }, Error, {
            id: string;
            updates: UpdateConversationData;
        }, {
            previousConversations: unknown;
            previousConversation: unknown;
        }>;
        mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<{
            updatedAt: Date;
            title: string;
            status: import("../types/conversation").ConversationStatus;
            isFavorite: boolean;
            favorite_rank?: number;
            tags: string[];
            relatedPollId?: string;
            id: string;
            createdAt: Date;
            firstMessage: string;
            messageCount: number;
            pollId?: string;
            pollType?: "date" | "form" | null;
            pollStatus?: "draft" | "active" | "closed" | "archived";
            metadata?: import("../types/conversation").ConversationMetadata;
            userId?: string;
        }, Error, {
            id: string;
            updates: UpdateConversationData;
        }, {
            previousConversations: unknown;
            previousConversation: unknown;
        }>;
        isLoading: boolean;
        isError: boolean;
        isSuccess: boolean;
        error: ConversationError | undefined;
        reset: () => void;
    };
    deleteConversation: {
        mutate: import("@tanstack/react-query").UseMutateFunction<string, Error, string, {
            previousConversations: unknown;
        }>;
        mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<string, Error, string, {
            previousConversations: unknown;
        }>;
        isLoading: boolean;
        isError: boolean;
        isSuccess: boolean;
        error: ConversationError | undefined;
        reset: () => void;
    };
    addMessage: {
        mutate: import("@tanstack/react-query").UseMutateFunction<{
            id: string;
            timestamp: Date;
            conversationId: string;
            role: import("../types/conversation").MessageRole;
            content: string;
            metadata?: import("../types/conversation").MessageMetadata;
        }, Error, {
            conversationId: string;
            message: ConversationMessage;
        }, {
            previousMessages: unknown;
            previousConversation: unknown;
        }>;
        mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<{
            id: string;
            timestamp: Date;
            conversationId: string;
            role: import("../types/conversation").MessageRole;
            content: string;
            metadata?: import("../types/conversation").MessageMetadata;
        }, Error, {
            conversationId: string;
            message: ConversationMessage;
        }, {
            previousMessages: unknown;
            previousConversation: unknown;
        }>;
        isLoading: boolean;
        isError: boolean;
        isSuccess: boolean;
        error: ConversationError | undefined;
        reset: () => void;
    };
    loadMore: () => void;
    refresh: () => Promise<void>;
    searchConversations: (query: string) => Promise<Conversation[]>;
    reorderFavorite: (conversationId: string, newRank: number) => Promise<void>;
    isLoadingMore: boolean;
    canLoadMore: boolean;
    isRefreshing: boolean;
    config: {
        pageSize: number;
        enableRealtime: boolean;
        enableOptimisticUpdates: boolean;
        filters: ConversationSearchFilters;
        sortBy: "title" | "createdAt" | "updatedAt";
        sortOrder: "desc" | "asc";
    };
};
