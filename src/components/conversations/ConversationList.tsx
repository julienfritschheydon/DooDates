/**
 * ConversationList Component
 * DooDates - Conversation History System
 */

import React, { useMemo, useState, useCallback } from "react";
import { MessageCircle, Search, Plus, Filter, SortAsc, SortDesc, Loader2 } from "lucide-react";

import { ConversationCard } from "./ConversationCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import { useConversationSearch } from "../../hooks/useConversationSearch";
import type { Conversation, ConversationStatus } from "../../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationListProps {
  /** Conversations to display */
  conversations?: Conversation[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user renames conversation */
  onRename?: (conversationId: string, newTitle: string) => void;
  /** Callback when user deletes conversation */
  onDelete?: (conversationId: string) => void;
  /** Callback when user toggles favorite status */
  onToggleFavorite?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Callback when user wants to create new conversation */
  onCreateNew?: () => void;
  /** Current user's language preference */
  language?: "fr" | "en";
  /** Whether to show search and filters */
  showSearch?: boolean;
  /** Whether to use compact card layout */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Height for virtualized list */
  height?: number;
}

type SortOption = "updatedAt" | "createdAt" | "title" | "messageCount";
type SortOrder = "asc" | "desc";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sorts conversations based on criteria
 */
function sortConversations(
  conversations: Conversation[],
  sortBy: SortOption,
  sortOrder: SortOrder,
): Conversation[] {
  return [...conversations].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "updatedAt":
      case "createdAt":
        comparison = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "messageCount":
        comparison = a.messageCount - b.messageCount;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
}

/**
 * Gets status filter options with counts
 */
function getStatusFilterOptions(conversations: Conversation[]) {
  const counts = conversations.reduce(
    (acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    },
    {} as Record<ConversationStatus, number>,
  );

  return [
    {
      value: "all",
      label: `Toutes (${conversations.length})`,
      count: conversations.length,
    },
    {
      value: "active",
      label: `En cours (${counts.active || 0})`,
      count: counts.active || 0,
    },
    {
      value: "completed",
      label: `Terminées (${counts.completed || 0})`,
      count: counts.completed || 0,
    },
    {
      value: "archived",
      label: `Archivées (${counts.archived || 0})`,
      count: counts.archived || 0,
    },
  ];
}

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

function ConversationSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("p-4 border rounded-lg space-y-3", compact && "p-3 space-y-2")}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      <Skeleton className={cn("h-4 w-full", compact && "h-3")} />
      <Skeleton className={cn("h-4 w-2/3", compact && "h-3")} />
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({
  onCreateNew,
  isFiltered = false,
}: {
  onCreateNew?: () => void;
  isFiltered?: boolean;
}) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation trouvée</h3>
        <p className="text-gray-500 mb-4 max-w-sm">
          Essayez de modifier vos critères de recherche ou de filtrage pour voir plus de résultats.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation pour le moment</h3>
      <p className="text-gray-500 mb-6 max-w-sm">
        Commencez votre première conversation avec l'IA pour créer des sondages intelligents.
      </p>
      {onCreateNew && (
        <Button onClick={onCreateNew} className="gap-2" data-testid="conversation-list-new">
          <Plus className="h-4 w-4" />
          Nouvelle conversation
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationList({
  conversations = [],
  isLoading = false,
  error = null,
  onResume,
  onRename,
  onDelete,
  onToggleFavorite,
  onViewPoll,
  onCreateNew,
  language = "fr",
  showSearch = true,
  compact = false,
  className,
  height = 600,
}: ConversationListProps) {
  // Local state for sorting and filtering
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Search functionality
  const {
    conversations: searchResults,
    setQuery,
    setFilters,
    clearSearch,
    query,
    totalCount,
    isLoading: isSearching,
  } = useConversationSearch({
    status: statusFilter === "all" ? undefined : statusFilter,
    isFavorite: showFavoritesOnly ? true : undefined,
  });

  // Use search results if search is active AND search is enabled, otherwise use provided conversations
  const displayConversations = useMemo(() => {
    const baseConversations = showSearch && query ? searchResults : conversations;
    return sortConversations(baseConversations, sortBy, sortOrder);
  }, [searchResults, conversations, query, sortBy, sortOrder, showSearch]);

  // Status filter options with counts
  const statusOptions = useMemo(() => getStatusFilterOptions(conversations), [conversations]);

  // Handlers
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery],
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const status = value as ConversationStatus | "all";
      setStatusFilter(status);
      setFilters({
        status: status === "all" ? undefined : status,
        isFavorite: showFavoritesOnly ? true : undefined,
      });
    },
    [setFilters, showFavoritesOnly],
  );

  const handleToggleFavorites = useCallback(() => {
    const newValue = !showFavoritesOnly;
    setShowFavoritesOnly(newValue);
    setFilters({
      status: statusFilter === "all" ? undefined : statusFilter,
      isFavorite: newValue ? true : undefined,
    });
  }, [showFavoritesOnly, setFilters, statusFilter]);

  const handleSortChange = useCallback(
    (newSortBy: SortOption) => {
      if (newSortBy === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(newSortBy);
        setSortOrder("desc");
      }
    },
    [sortBy],
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
    setShowFavoritesOnly(false);
    clearSearch();
  }, [clearSearch]);

  // Calculate item height based on compact mode (kept for potential future use)
  const itemHeight = compact ? 120 : 160;

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {showSearch && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        )}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ConversationSkeleton key={i} compact={compact} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-4">
          <MessageCircle className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500 mb-4">
          {error.message || "Une erreur est survenue lors du chargement des conversations."}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          data-testid="conversation-list-retry"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const hasActiveFilters = statusFilter !== "all" || showFavoritesOnly || Boolean(query);
  const isEmpty = displayConversations.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {showSearch && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans les conversations..."
              className="pl-10"
              onChange={(e) => handleSearchChange(e.target.value)}
              value={query || ""}
            />
            {(isSearching || isLoading) && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-auto min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favorites Filter */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFavorites}
              className="gap-2"
             data-testid="conversationlist--favoris">
              ⭐ Favoris
            </Button>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="conversationlist-button">
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  Trier
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSortChange("updatedAt")}>
                  Dernière modification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                  Date de création
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("title")}>Titre</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("messageCount")}>
                  Nombre de messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
               data-testid="conversationlist-effacer-filtres">
                Effacer filtres
              </Button>
            )}

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-500">
              {displayConversations.length} conversation
              {displayConversations.length > 1 ? "s" : ""}
              {query && ` trouvée${displayConversations.length > 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
      )}

      {/* Conversations List - Grille responsive (Session 2) */}
      {isEmpty ? (
        <EmptyState onCreateNew={onCreateNew} isFiltered={hasActiveFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayConversations.map((conversation, index) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onResume={onResume}
              onRename={onRename}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onViewPoll={onViewPoll}
              language={language}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
