/**
 * ConversationHistory Component
 * Main container for the conversation history system
 * DooDates - Conversation History System
 */

import React, { useState, useCallback, useMemo } from "react";
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
  const searchResults: Conversation[] = [];
  const isSearching = false;
  const clearFilters = () => setFilters({});
  const hasActiveFilters = Object.keys(filters).length > 0;

  // No initialization needed with simple storage

  // Conversations data
  const conversationsHook = useConversations();
  const conversations = conversationsHook.conversations.conversations || [];
  const isLoading = conversationsHook.conversations.isLoading;
  const isError = conversationsHook.conversations.isError;
  const error = conversationsHook.conversations.error;
  const refetch = conversationsHook.refresh || (() => {});
  const isRefetching = conversationsHook.isRefreshing || false;

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
  console.log("🔍 ConversationHistory DEBUG:", {
    conversationsHookStructure: Object.keys(conversationsHook),
    conversationsProperty: conversationsHook.conversations,
    conversationsCount: conversations.length,
    conversations: conversations.map((c) => ({ id: c.id, title: c.title })),
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
            <Button onClick={handleRetry} variant="outline" className="gap-2">
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
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{text.title}</h2>
          {!compact && <p className="text-gray-600 dark:text-gray-400 mt-1">{text.subtitle}</p>}
        </div>

        {/* Search Bar and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par titre ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebugView(!showDebugView)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showDebugView
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              <Database className="w-4 h-4" />
              Debug Storage
            </button>
          </div>
        </div>

        {/* Refresh Button */}
        {!isLoading && (
          <div className="flex justify-end">
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              {isRefetching ? text.refreshing : text.retry}
            </Button>
          </div>
        )}

        {/* Debug Storage View */}
        {showDebugView && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Debug Storage - Messages par conversation
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredConversations.map((conv) => {
                const storedMessages = getStoredMessages(conv.id);
                return (
                  <div key={conv.id} className="bg-white border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{conv.title}</h4>
                        <p className="text-xs text-gray-500">ID: {conv.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            storedMessages.length > 1
                              ? "bg-green-100 text-green-800"
                              : storedMessages.length === 1
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {storedMessages.length} messages
                        </span>
                        {onResumeConversation && (
                          <button
                            onClick={() => onResumeConversation(conv.id)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Reprendre
                          </button>
                        )}
                      </div>
                    </div>
                    {storedMessages.length > 0 && (
                      <div className="space-y-1">
                        {storedMessages.map((msg: any, idx: number) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-1 py-0.5 rounded text-xs ${
                                  msg.role === "user"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {msg.role === "user" ? "Utilisateur" : "IA"}
                              </span>
                              <span className="text-gray-500">{msg.id}</span>
                            </div>
                            <p className="text-gray-700 truncate">
                              {msg.content?.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversation List */}
        {!showDebugView && (
          <ConversationList
            conversations={filteredConversations}
            isLoading={isLoading}
            error={error}
            onResume={onResumeConversation}
            onViewPoll={onViewPoll}
            onCreateNew={onCreateConversation}
            language={language}
            showSearch={false}
            compact={compact}
          />
        )}

        {/* Empty State for No Results */}
        {!isLoading && displayConversations.length === 0 && !hasActiveFilters && !query && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {text.noConversations}
            </h3>
            {onCreateConversation && (
              <Button onClick={onCreateConversation} variant="default" className="gap-2">
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
