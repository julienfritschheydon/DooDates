import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Info,
  Trash2,
  ExternalLink,
  FileText,
  Brain,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
  Copy,
  ChevronDown,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { DashboardFilters, ViewMode } from "@/components/dashboard/DashboardFilters";
import { ConversationCard } from "@/components/dashboard/ConversationCard";
import { DashboardTableView } from "@/components/dashboard/DashboardTableView";
import { filterConversationItems } from "@/components/dashboard/utils";
import { FilterType } from "@/components/dashboard/types";
import { logger } from "@/lib/logger";
import { logError } from "@/lib/error-handling";
import { useFreemiumQuota } from "@/hooks/useFreemiumQuota";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { usePollDeletionCascade } from "@/hooks/usePollDeletionCascade";
import { buildAbsoluteUrl } from "@/lib/baseUrlUtils";
import { useToast } from "@/hooks/use-toast";
import TopNavGemini from "@/components/prototype/TopNavGemini";
import { useViewportItems } from "@/hooks/useViewportItems";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getProductConfig, getThemeClasses, type ProductType } from "@/config/products.config";
// Import quizz-specific functions
import {
  getQuizz,
  deleteQuizzById,
  getQuizzResponses,
  getQuizzResults,
  type Quizz,
} from "@/lib/products/quizz/quizz-service";
import { cn } from "@/lib/utils";

interface ProductDashboardProps {
  productType: ProductType;
}

// Quizz sort options
type QuizzSortBy = "recent" | "popular" | "score";

export const ProductDashboard: React.FC<ProductDashboardProps> = ({ productType }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const contentTypeFilter = productType;
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { status: quotaStatus } = useFreemiumQuota();
  const { deleteConversation } = useConversations();
  const { deletePollWithCascade } = usePollDeletionCascade();
  const { toast } = useToast();

  const config = getProductConfig(productType);
  const theme = getThemeClasses(config.theme);
  const Icon = config.icon;
  const isQuizz = productType === "quizz";

  // Quizz-specific state
  const [quizzList, setQuizzList] = useState<Quizz[]>([]);
  const [quizzLoading, setQuizzLoading] = useState(isQuizz);
  const [quizzSortBy, setQuizzSortBy] = useState<QuizzSortBy>("recent");

  // Load quizz data
  useEffect(() => {
    if (isQuizz) {
      setQuizzLoading(true);
      try {
        const data = getQuizz();
        setQuizzList(data);
      } catch (error) {
        logError(error as Error, {
          operation: "loadQuizz",
          component: "ProductDashboard",
        });
      } finally {
        setQuizzLoading(false);
      }
    }
  }, [isQuizz, refreshKey]);

  // Quizz global stats
  const quizzGlobalStats = useMemo(() => {
    if (!isQuizz) return null;
    let totalResponses = 0;
    let totalScore = 0;
    let responseCount = 0;

    quizzList.forEach((quiz) => {
      const responses = getQuizzResponses(quiz.id);
      totalResponses += responses.length;
      responses.forEach((r) => {
        totalScore += r.percentage;
        responseCount++;
      });
    });

    return {
      totalQuizz: quizzList.length,
      totalResponses,
      averageScore: responseCount > 0 ? Math.round(totalScore / responseCount) : 0,
    };
  }, [isQuizz, quizzList]);

  // Filtered and sorted quizz
  const filteredQuizz = useMemo(() => {
    if (!isQuizz) return [];
    let result = [...quizzList];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(query) || q.description?.toLowerCase().includes(query),
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (quizzSortBy) {
        case "popular":
          return getQuizzResponses(b.id).length - getQuizzResponses(a.id).length;
        case "score": {
          const aResults = getQuizzResults(a.id);
          const bResults = getQuizzResults(b.id);
          return bResults.averagePercentage - aResults.averagePercentage;
        }
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [isQuizz, quizzList, searchQuery, quizzSortBy]);

  const handleQuizzDelete = (id: string, title: string) => {
    if (confirm(`Supprimer le quiz "${title}" ?`)) {
      deleteQuizzById(id);
      setRefreshKey((prev) => prev + 1);
      toast({ title: "Quiz supprimé" });
    }
  };

  const handleCopyQuizzLink = (slug: string) => {
    const url = buildAbsoluteUrl(`quizz/${slug}/vote`);
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié !" });
  };

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "grid";
    }
    const saved = localStorage.getItem("dashboard_view_preference");
    return (saved === "grid" || saved === "table" ? saved : "grid") as ViewMode;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const { conversationItems, loading: conversationLoading } = useDashboardData(refreshKey);
  const loading = isQuizz ? quizzLoading : conversationLoading;
  const itemsPerPage = useViewportItems({ viewMode });

  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth < 768 && viewMode === "table") {
        setViewMode("grid");
      }
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("dashboard_view_preference", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handlePollCreated = () => {
      logger.info("Poll created, refreshing dashboard", "poll");
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener("pollCreated", handlePollCreated);
    return () => window.removeEventListener("pollCreated", handlePollCreated);
  }, []);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, viewMode]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    if (itemsPerPage <= 0) return filteredItems;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Pagination for quizz
  const quizzTotalPages = Math.ceil(filteredQuizz.length / itemsPerPage);
  const paginatedQuizz = useMemo(() => {
    if (!isQuizz || filteredQuizz.length === 0) return [];
    if (itemsPerPage <= 0) return filteredQuizz;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredQuizz.slice(startIndex, endIndex);
  }, [isQuizz, filteredQuizz, currentPage, itemsPerPage]);

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
    setSelectedIds(new Set(paginatedItems.map((item) => item.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

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
            await deletePollWithCascade(item.poll.id, { deleteConversation: true });
          } else {
            await deleteConversation.mutateAsync(id);
          }
          successCount++;
        } catch (error) {
          logger.error("Failed to delete item", error);
          errorCount++;
        }
      }

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

      clearSelection();
      setRefreshKey((prev) => prev + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderHeader = () => (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 role="heading" className="text-xl sm:text-3xl font-bold tracking-tight text-white">
          {config.dashboardTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400 hidden sm:block">
          {config.dashboardDescription}
        </p>
      </div>
    </div>
  );

  // Quizz Stats Cards
  const renderQuizzStats = () => {
    if (!isQuizz || !quizzGlobalStats) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-900/30 rounded-lg">
              <Brain className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Quiz créés</p>
              <p className="text-2xl font-bold text-white">{quizzGlobalStats.totalQuizz}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Réponses totales</p>
              <p className="text-2xl font-bold text-white">{quizzGlobalStats.totalResponses}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-900/30 rounded-lg">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Score moyen</p>
              <p className="text-2xl font-bold text-white">{quizzGlobalStats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Quizz Card
  const renderQuizzCard = (quiz: Quizz) => {
    const responses = getQuizzResponses(quiz.id);
    const results = getQuizzResults(quiz.id);

    return (
      <div
        key={quiz.id}
        className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-amber-500/50 transition-colors group"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
            {quiz.title}
          </h3>
          <div className="flex gap-1 flex-shrink-0">
            {responses.length > 0 && (
              <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full">
                {responses.length}
              </span>
            )}
            <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded-full">
              {quiz.questions?.length || 0}Q
            </span>
          </div>
        </div>

        {quiz.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{quiz.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{responses.length}</span>
          </div>
          {results.averagePercentage > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>{Math.round(results.averagePercentage)}%</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(quiz.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/vote`)}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-amber-900/30 text-amber-400 rounded-lg hover:bg-amber-900/50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Tester
          </button>
          <button
            onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/results`)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 transition-colors"
            title="Voir les résultats"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCopyQuizzLink(quiz.slug || quiz.id)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
            title="Copier le lien"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleQuizzDelete(quiz.id, quiz.title)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Quizz Table View
  const renderQuizzTable = () => {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden mt-6">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Quiz</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 hidden sm:table-cell">
                Questions
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 hidden md:table-cell">
                Réponses
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 hidden md:table-cell">
                Score moy.
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 hidden lg:table-cell">
                Créé le
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedQuizz.map((quiz) => {
              const responses = getQuizzResponses(quiz.id);
              const results = getQuizzResults(quiz.id);

              return (
                <tr key={quiz.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{quiz.title}</p>
                      {quiz.description && (
                        <p className="text-sm text-gray-400 line-clamp-1">{quiz.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-300 hidden sm:table-cell">
                    {quiz.questions?.length || 0}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-300 hidden md:table-cell">
                    {responses.length}
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-sm font-medium",
                        results.averagePercentage >= 75
                          ? "bg-green-900/50 text-green-400"
                          : results.averagePercentage >= 50
                            ? "bg-amber-900/50 text-amber-400"
                            : results.averagePercentage > 0
                              ? "bg-red-900/50 text-red-400"
                              : "bg-gray-700/50 text-gray-400",
                      )}
                    >
                      {results.averagePercentage > 0
                        ? `${Math.round(results.averagePercentage)}%`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-400 text-sm hidden lg:table-cell">
                    {new Date(quiz.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/vote`)}
                        className="p-2 text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors"
                        title="Tester"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/quizz/${quiz.slug || quiz.id}/results`)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Résultats"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyQuizzLink(quiz.slug || quiz.id)}
                        className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copier le lien"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuizzDelete(quiz.id, quiz.title)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.loading}`}></div>
      </div>
    );
  }

  // Unified items count and pagination for quizz vs other products
  const effectiveItems = isQuizz ? filteredQuizz : filteredItems;
  const effectivePaginatedItems = isQuizz ? paginatedQuizz : paginatedItems;
  const effectiveTotalPages = isQuizz ? quizzTotalPages : totalPages;
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8" data-testid="dashboard-ready">
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderHeader()}

          {/* Mobile Stats Toggle */}
          <div className="sm:hidden mb-4">
            <button
              onClick={() => setIsStatsOpen(!isStatsOpen)}
              className="w-full flex items-center justify-between p-2 border border-gray-700 rounded-md bg-[#1e1e1e] text-gray-300"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Statistiques & Quotas</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isStatsOpen ? "rotate-180" : "",
                )}
              />
            </button>
          </div>

          <div className={cn(isStatsOpen ? "block" : "hidden sm:block")}>
            {/* Quizz-specific stats (only for quizz) */}
            {renderQuizzStats()}

            {/* Quota indicator */}
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border mb-6 ${
                quotaStatus.conversations.isNearLimit
                  ? "bg-orange-900/20 border-orange-500/50"
                  : theme.quotaBg
              }`}
            >
              <Info
                className={`w-5 h-5 ${
                  quotaStatus.conversations.isNearLimit ? "text-orange-400" : theme.quotaText
                }`}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity group"
                      onClick={() => navigate(config.journalRoute)}
                    >
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                        <span className="font-semibold">
                          {quotaStatus.conversations.used}/{quotaStatus.conversations.limit}
                        </span>{" "}
                        crédits utilisés
                        <span
                          className={`ml-2 ${theme.quotaText} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          → Voir le journal
                        </span>
                        {!user && (
                          <span className={`ml-2 ${theme.quotaText}`}>
                            • Créez un compte pour synchroniser vos données
                          </span>
                        )}
                      </p>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quotaStatus.conversations.isNearLimit ? "bg-orange-500" : theme.quotaBar
                          }`}
                          style={{
                            width: `${Math.min(quotaStatus.conversations.percentage, 100)}%`,
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
                  onClick={() => navigate(config.journalRoute)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${theme.quotaHover}`}
                  title="Voir le journal de consommation"
                  aria-label="Voir le journal de consommation"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Journal</span>
                </button>

                <button
                  onClick={() => navigate(config.pricingRoute)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${theme.quotaHover}`}
                  title="Voir les quotas et tarifs"
                  aria-label="Voir les quotas et tarifs"
                >
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">En savoir plus</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters - Standard for all, with quizz sort option */}
          <DashboardFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
            contentTypeFilter={contentTypeFilter}
            onContentTypeFilterChange={() => {}}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            selectedFolderId={selectedFolderId}
            onFolderChange={setSelectedFolderId}
            selectedIdsCount={selectedIds.size}
            onSelectAll={isQuizz ? undefined : selectAll}
            onClearSelection={isQuizz ? undefined : clearSelection}
            hasItems={effectiveItems.length > 0}
            hideContentTypeFilter={true}
          />

          {/* Quizz sort option (additional control for quizz) */}
          {isQuizz && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">Trier par:</span>
              <select
                aria-label="Trier les quiz par"
                value={quizzSortBy}
                onChange={(e) => setQuizzSortBy(e.target.value as QuizzSortBy)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="recent">Plus récents</option>
                <option value="popular">Plus populaires</option>
                <option value="score">Meilleur score</option>
              </select>
            </div>
          )}

          {/* Content - Empty state */}
          {effectiveItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700 mt-6">
              <Icon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchQuery || filter !== "all" ? "Aucun résultat" : config.emptyStateTitle}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || filter !== "all"
                  ? "Essayez avec d'autres critères"
                  : config.emptyStateDescription}
              </p>
              <button
                onClick={() => navigate(config.createRoute)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.button} focus:ring-${config.theme}-500`}
              >
                {config.emptyStateButtonLabel}
              </button>
            </div>
          ) : isQuizz ? (
            /* Quizz-specific content rendering */
            viewMode === "table" ? (
              renderQuizzTable()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {paginatedQuizz.map((quiz) => renderQuizzCard(quiz))}
              </div>
            )
          ) : viewMode === "table" ? (
            /* Standard table view */
            <DashboardTableView
              items={paginatedItems}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              onRefresh={() => setRefreshKey((prev) => prev + 1)}
            />
          ) : (
            /* Standard grid view */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
          {effectiveItems.length > 0 && effectiveTotalPages > 1 && (
            <div className="mt-8 mb-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 text-gray-400">
                      Page {currentPage} sur {effectiveTotalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < effectiveTotalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === effectiveTotalPages ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Bulk selection bar (not for quizz) */}
        {!isQuizz && selectedIds.size > 0 && (
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
  );
};
