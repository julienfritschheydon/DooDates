import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Info, Trash2, ExternalLink, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardData } from "./dashboard/useDashboardData";
import { DashboardFilters, ViewMode } from "./dashboard/DashboardFilters";
import { ConversationCard } from "./dashboard/ConversationCard";
import { DashboardTableView } from "./dashboard/DashboardTableView";
import { filterConversationItems, getThemeColors } from "./dashboard/utils";
import { FilterType, ContentTypeFilter } from "./dashboard/types";
import { logger } from "@/lib/logger";
import { useFreemiumQuota } from "@/hooks/useFreemiumQuota";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { usePollDeletionCascade } from "@/hooks/usePollDeletionCascade";
import { useToast } from "@/hooks/use-toast";
import { useViewportItems } from "@/hooks/useViewportItems";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { AlertTriangle } from "lucide-react";
import { CreatePageLayout } from "./layout/CreatePageLayout";
import TopNavGemini from "@/components/prototype/TopNavGemini";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterType>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>("all");

  // Initialiser la recherche depuis l'URL si présent (support des liens depuis l'admin)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { status: quotaStatus, guestQuota } = useFreemiumQuota();
  const { deleteConversation } = useConversations();
  const { deletePollWithCascade } = usePollDeletionCascade();
  const { toast } = useToast();

  // Vue mode avec persistance localStorage
  // Sur mobile (< 768px), forcer toujours "grid"
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Vérifier si on est sur mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "grid";
    }
    const saved = localStorage.getItem("dashboard_view_preference");
    return (saved === "grid" || saved === "table" ? saved : "grid") as ViewMode;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const { conversationItems, loading, reload } = useDashboardData(refreshKey);

  // Calcul itemsPerPage selon viewport
  const itemsPerPage = useViewportItems({ viewMode });

  // Forcer vue grille sur mobile (< 768px)
  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth < 768 && viewMode === "table") {
        setViewMode("grid");
      }
    };

    // Vérifier au montage et lors du redimensionnement
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, [viewMode]);

  // Sauvegarder préférence vue
  useEffect(() => {
    localStorage.setItem("dashboard_view_preference", viewMode);
  }, [viewMode]);

  // Écouter l'événement de création de poll
  useEffect(() => {
    const handlePollCreated = () => {
      logger.info("Poll created, refreshing dashboard", "poll");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("pollCreated", handlePollCreated);
    return () => window.removeEventListener("pollCreated", handlePollCreated);
  }, []);

  // États pour tags et dossiers
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);

  // Appliquer les filtres
  const filteredItems = useMemo(
    () =>
      filterConversationItems(
        conversationItems,
        filter,
        searchQuery,
        selectedTags.length > 0 ? selectedTags : undefined,
        selectedFolderId,
        contentTypeFilter,
      ),
    [conversationItems, filter, searchQuery, selectedTags, selectedFolderId, contentTypeFilter],
  );

  // Reset page à 1 lors changement filtres/recherche ou vue
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, contentTypeFilter, searchQuery, viewMode]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Réinitialiser currentPage si elle dépasse totalPages (ex: itemsPerPage change)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Pagination des items filtrés
  const paginatedItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    if (itemsPerPage <= 0) return filteredItems; // Fallback si itemsPerPage invalide

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Gestion de la sélection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    // Sélectionner uniquement les items de la page courante
    setSelectedIds(new Set(paginatedItems.map((item) => item.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Suppression en masse
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedIds.size} élément(s) ?\n\nNote: Les conversations et sondages liés seront également supprimés.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of selectedIds) {
        const item = conversationItems.find((i) => i.id === id);
        if (!item) continue;

        try {
          if (item.poll) {
            // Supprimer le poll et sa conversation
            await deletePollWithCascade(item.poll.id, { deleteConversation: true });
          } else {
            // Supprimer uniquement la conversation
            await deleteConversation.mutateAsync(id);
          }
          successCount++;
        } catch (error) {
          logger.error("Failed to delete item", error);
          errorCount++;
        }
      }

      // Notification
      if (successCount > 0) {
        toast({
          title: "Suppression réussie",
          description: `${successCount} élément(s) supprimé(s)${errorCount > 0 ? `, ${errorCount} échec(s)` : ""}.`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer les éléments sélectionnés.",
          variant: "destructive",
        });
      }

      // Rafraîchir et nettoyer
      clearSelection();
      setRefreshKey((prev) => prev + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderHeader = () => (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 role="heading" className="text-3xl font-bold tracking-tight text-white">
          Tableau de bord
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Pilotez vos conversations, sondages et analyses IA en un clin d'œil.
        </p>
      </div>
    </div>
  );

  // Récupérer les couleurs du thème actuel
  const theme = useMemo(() => {
    return getThemeColors(contentTypeFilter);
  }, [contentTypeFilter]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
        data-testid="dashboard-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <CreatePageLayout>
      <div className="min-h-screen bg-[#0a0a0a] pb-8" data-testid="dashboard-ready">
        <div className="pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">{renderHeader()}</div>

            {/* Quota indicator */}
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border mb-6 ${
                quotaStatus.conversations.isNearLimit
                  ? "bg-orange-900/20 border-orange-500/50"
                  : `${theme.bg} ${theme.border}`
              }`}
            >
              <Info
                className={`w-5 h-5 ${
                  quotaStatus.conversations.isNearLimit ? "text-orange-400" : theme.text
                }`}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity group"
                      onClick={() => navigate("/dashboard/journal")}
                    >
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                        <span className="font-semibold">
                          {quotaStatus.conversations.used + quotaStatus.aiMessages.used}/
                          {quotaStatus.conversations.limit + quotaStatus.aiMessages.limit}
                        </span>{" "}
                        crédits utilisés
                        <span
                          className={`ml-2 ${theme.text} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          → Voir le journal
                        </span>
                        {!user && (
                          <span className={`ml-2 ${theme.text}`}>
                            • Créez un compte pour synchroniser vos données
                          </span>
                        )}
                      </p>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quotaStatus.conversations.isNearLimit ||
                            quotaStatus.aiMessages.isNearLimit
                              ? "bg-orange-500"
                              : theme.progressBg
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.max(
                                quotaStatus.conversations.percentage,
                                quotaStatus.aiMessages.percentage,
                              ),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cliquez pour voir le journal de consommation des crédits</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/dashboard/journal")}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${theme.buttonText}`}
                  title="Voir le journal de consommation"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Journal</span>
                </button>

                <button
                  onClick={() => navigate("/pricing")}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${theme.buttonText}`}
                  title="Voir les quotas et tarifs"
                >
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">En savoir plus</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Filtres */}
            <DashboardFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filter={filter}
              onFilterChange={setFilter}
              contentTypeFilter={contentTypeFilter}
              onContentTypeFilterChange={setContentTypeFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              selectedFolderId={selectedFolderId}
              onFolderChange={setSelectedFolderId}
              selectedIdsCount={selectedIds.size}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              hasItems={filteredItems.length > 0}
            />

            {/* Contenu selon vue */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">
                  {searchQuery || filter !== "all" ? "Aucun résultat" : "Aucune conversation"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || filter !== "all"
                    ? "Essayez avec d'autres critères"
                    : "Commencez une conversation avec l'IA pour créer des sondages"}
                </p>
              </div>
            ) : viewMode === "table" ? (
              <DashboardTableView
                items={paginatedItems}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map((item) => (
                  <ConversationCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelection={() => toggleSelection(item.id)}
                    onRefresh={() => setRefreshKey((prev) => prev + 1)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && totalPages > 1 && (
              <div className="mt-8 mb-8" id="dashboard-pagination">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {(() => {
                      const pages: (number | "ellipsis")[] = [];
                      const maxVisible = 7;

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        pages.push(1);

                        let start = Math.max(2, currentPage - 1);
                        let end = Math.min(totalPages - 1, currentPage + 1);

                        if (currentPage <= 3) {
                          start = 2;
                          end = 4;
                        }

                        if (currentPage >= totalPages - 2) {
                          start = totalPages - 3;
                          end = totalPages - 1;
                        }

                        if (start > 2) {
                          pages.push("ellipsis");
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        if (end < totalPages - 1) {
                          pages.push("ellipsis");
                        }

                        pages.push(totalPages);
                      }

                      return pages.map((page, index) => {
                        if (page === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      });
                    })()}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={
                          currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="text-center mt-4 text-sm text-gray-400">
                  Page {currentPage} sur {totalPages} ({filteredItems.length} élément
                  {filteredItems.length > 1 ? "s" : ""})
                </div>
              </div>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
                <span className="text-white font-medium">
                  {selectedIds.size} élément(s) sélectionné(s)
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={isDeleting}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CreatePageLayout>
  );
};

export default Dashboard;
