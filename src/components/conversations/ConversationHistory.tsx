/**
 * ConversationHistory Component
 * Main container for the conversation history system
 * DooDates - Conversation History System
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AlertCircle, RefreshCw, MessageSquare, Search, Eye, Database } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { ConversationList } from "./ConversationList";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationPreview } from "./ConversationPreview";
import { useConversations } from "../../hooks/useConversations";
import { useConversationSearch } from "../../hooks/useConversationSearch";
import { logError, ErrorFactory } from "../../lib/error-handling";
import type { Conversation, ConversationSearchFilters } from "../../types/conversation";
import { enrichConversationsWithStats } from "../../lib/conversationFilters";
import { logger } from "../../lib/logger";

// Additional types for sorting and UI
export type ConversationSortBy = "createdAt" | "updatedAt" | "title" | "messageCount";
export type SortOrder = "asc" | "desc";

interface ConversationHistoryProps {
  /** Language for UI text */
  language?: "fr" | "en";
  /** Callback when user wants to resume a conversation */
  onResumeConversation?: (conversationId: string) => void;
  /** Callback when user wants to view a poll */
  onViewPoll?: (pollId: string) => void;
  /** Callback when user wants to create a new conversation */
  onCreateConversation?: () => void;
  /** Initial filters to apply */
  initialFilters?: Partial<ConversationSearchFilters>;
  /** Compact mode for smaller screens */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

const UI_TEXT = {
  fr: {
    title: "Historique des conversations",
    subtitle: "Gérez et consultez vos conversations passées",
    error: "Erreur lors du chargement des conversations",
    retry: "Réessayer",
    refreshing: "Actualisation...",
    noConversations: "Aucune conversation trouvée",
    createFirst: "Créer votre première conversation",
    searchPlaceholder: "Rechercher dans vos conversations...",
    loadingError: "Impossible de charger les conversations",
    networkError: "Erreur de connexion. Vérifiez votre connexion internet.",
    serverError: "Erreur serveur. Veuillez réessayer plus tard.",
    unknownError: "Une erreur inattendue s'est produite.",
  },
  en: {
    title: "Conversation History",
    subtitle: "Manage and view your past conversations",
    error: "Error loading conversations",
    retry: "Retry",
    refreshing: "Refreshing...",
    noConversations: "No conversations found",
    createFirst: "Create your first conversation",
    searchPlaceholder: "Search your conversations...",
    loadingError: "Unable to load conversations",
    networkError: "Connection error. Please check your internet connection.",
    serverError: "Server error. Please try again later.",
    unknownError: "An unexpected error occurred.",
  },
};

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  language = "fr",
  onResumeConversation,
  onViewPoll,
  onCreateConversation,
  initialFilters = {},
  compact = false,
  className = "",
}) => {
  const text = UI_TEXT[language];

  // State for preview modal
  const [previewConversation, setPreviewConversation] = useState<Conversation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // State for search and debug view
  const [searchQuery, setSearchQuery] = useState("");
  const [showDebugView, setShowDebugView] = useState(false);

  // State for list sorting
  const [sortBy, setSortBy] = useState<ConversationSortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Search and filter state
  const searchHook = useConversationSearch();
  const { query, setQuery, filters, setFilters, clearSearch } = searchHook;

  // Mock search results and states for now
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchResults: Conversation[] = [];
  const isSearching = false;
  const clearFilters = () => setFilters({});
  const hasActiveFilters = Object.keys(filters).length > 0;

  // No initialization needed with simple storage

  // Conversations data
  const conversationsHook = useConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rawConversations = conversationsHook.conversations.conversations || [];
  const isLoading = conversationsHook.conversations.isLoading;
  const isError = conversationsHook.conversations.isError;
  const error = conversationsHook.conversations.error;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refetch = conversationsHook.refresh || (() => {});
  const isRefetching = conversationsHook.isRefreshing || false;

  // Écouter les événements de création de conversation (Session 2)
  useEffect(() => {
    const handleConversationCreated = () => {
      logger.info("🔄 Conversation créée, rafraîchissement du Dashboard", "conversation");
      refetch();
    };

    window.addEventListener("conversation-created", handleConversationCreated);
    return () => window.removeEventListener("conversation-created", handleConversationCreated);
  }, [refetch]);

  // Mutations
  const deleteConversation = conversationsHook.deleteConversation;
  const updateConversation = conversationsHook.updateConversation;

  // Enrichir les conversations avec les stats des polls (Session 1 - Architecture centrée conversations)
  const conversations = useMemo(() => {
    return enrichConversationsWithStats(rawConversations);
  }, [rawConversations]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.id.toLowerCase().includes(query) ||
        (conv.tags && conv.tags.some((tag) => tag.toLowerCase().includes(query))),
    );
  }, [conversations, searchQuery]);

  // Get messages for debug view
  const getStoredMessages = useCallback((conversationId: string) => {
    try {
      const storageKey = "doodates-messages";
      const rawStorage = localStorage.getItem(storageKey);
      const allMessages = rawStorage ? JSON.parse(rawStorage) : {};
      return allMessages[conversationId] || [];
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to read messages from storage",
          "Erreur lors de la lecture des messages",
        ),
        {
          component: "ConversationHistory",
          conversationId,
          metadata: { originalError: error },
        },
      );
      return [];
    }
  }, []);

  // Debug logging
  logger.debug("ConversationHistory DEBUG", "conversation", {
    conversationsHookStructure: Object.keys(conversationsHook),
    conversationsProperty: conversationsHook.conversations,
    rawConversationsCount: rawConversations.length,
    rawConversations: rawConversations.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    conversationsCount: conversations.length,
    conversations: conversations.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    filteredConversationsCount: filteredConversations.length,
    filteredConversations: filteredConversations.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
    })),
    searchQuery,
    isLoading,
    isError,
    error: error?.message,
  });

  // Memoized display conversations
  const displayConversations = useMemo(() => {
    return query ? searchResults : conversations;
  }, [query, searchResults, conversations]);

  // Error message based on error type
  const errorMessage = useMemo(() => {
    if (!error) return text.unknownError;

    const errorString = error.toString().toLowerCase();
    if (errorString.includes("network") || errorString.includes("fetch")) {
      return text.networkError;
    }
    if (errorString.includes("server") || errorString.includes("500")) {
      return text.serverError;
    }
    return text.loadingError;
  }, [error, text]);

  // Handlers
  const handlePreviewConversation = useCallback((conversation: Conversation) => {
    setPreviewConversation(conversation);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewConversation(null);
  }, []);

  const handleResumeFromPreview = useCallback(
    (conversationId: string) => {
      handleClosePreview();
      onResumeConversation?.(conversationId);
    },
    [handleClosePreview, onResumeConversation],
  );

  const handleDelete = useCallback(
    (conversationId: string) => {
      if (deleteConversation) {
        deleteConversation.mutate(conversationId);
      }
    },
    [deleteConversation],
  );

  const handleRename = useCallback(
    (conversationId: string, newTitle: string) => {
      if (updateConversation) {
        updateConversation.mutate({
          id: conversationId,
          updates: { title: newTitle },
        });
      }
    },
    [updateConversation],
  );

  const handleToggleFavorite = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation && updateConversation) {
        updateConversation.mutate({
          id: conversationId,
          updates: { isFavorite: !conversation.isFavorite },
        });
      }
    },
    [conversations, updateConversation],
  );

  const handleViewPollFromPreview = useCallback(
    (pollId: string) => {
      onViewPoll?.(pollId);
    },
    [onViewPoll],
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSortChange = useCallback((newSortBy: ConversationSortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // Render error state
  if (isError) {
    return (
      <div className={`conversation-history ${className}`}>
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{text.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{text.subtitle}</p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          <div className="text-center">
            <Button
              onClick={handleRetry}
              variant="outline"
              className="gap-2"
              data-testid="conversationhistory-button"
            >
              <RefreshCw className="h-4 w-4" />
              {text.retry}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`conversation-history ${className}`}>
      <div className="space-y-6">
        {/* Conversation List - Simplifié (Session 2) */}
        <ConversationList
          conversations={filteredConversations}
          isLoading={isLoading}
          error={error}
          onResume={onResumeConversation}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
          onViewPoll={onViewPoll}
          onCreateNew={onCreateConversation}
          language={language}
          showSearch={false}
          compact={compact}
        />

        {/* Empty State for No Results */}
        {!isLoading && displayConversations.length === 0 && !hasActiveFilters && !query && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {text.noConversations}
            </h3>
            {onCreateConversation && (
              <Button
                onClick={onCreateConversation}
                variant="default"
                className="gap-2"
                data-testid="conversationhistory-button"
              >
                <MessageSquare className="h-4 w-4" />
                {text.createFirst}
              </Button>
            )}
          </div>
        )}

        {/* Preview Modal */}
        <ConversationPreview
          conversation={previewConversation}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onResume={handleResumeFromPreview}
          onViewPoll={handleViewPollFromPreview}
          language={language}
        />
      </div>
    </div>
  );
};

export default ConversationHistory;
