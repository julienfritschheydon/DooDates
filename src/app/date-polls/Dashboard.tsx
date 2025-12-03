import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Info, Trash2, ExternalLink, FileText, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { DashboardFilters, ViewMode } from "@/components/dashboard/DashboardFilters";
import { ConversationCard } from "@/components/dashboard/ConversationCard";
import { DashboardTableView } from "@/components/dashboard/DashboardTableView";
import { filterConversationItems } from "@/components/dashboard/utils";
import { FilterType } from "@/components/dashboard/types";
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

const DatePollsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterType>("all");
    // Force filter to 'date'
    const contentTypeFilter = "date";
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const { status: quotaStatus } = useFreemiumQuota();
    const { deleteConversation } = useConversations();
    const { deletePollWithCascade } = usePollDeletionCascade();
    const { toast } = useToast();

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            return "grid";
        }
        const saved = localStorage.getItem("dashboard_view_preference");
        return (saved === "grid" || saved === "table" ? saved : "grid") as ViewMode;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const { conversationItems, loading } = useDashboardData(refreshKey);
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
                <h1 role="heading" className="text-3xl font-bold tracking-tight text-white">
                    Vos Sondages de Dates
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400">
                    Gérez vos sondages et planifiez vos événements.
                </p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pb-8">
            <div className="pt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderHeader()}

                    {/* Filters - Simplified for product view */}
                    <DashboardFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filter={filter}
                        onFilterChange={setFilter}
                        contentTypeFilter="date" // Fixed
                        onContentTypeFilterChange={() => { }} // No-op
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
                        hideContentTypeFilter={true} // Need to ensure this prop exists or is handled
                    />

                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700 mt-6">
                            <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">
                                {searchQuery || filter !== "all" ? "Aucun résultat" : "Aucun sondage de dates"}
                            </h3>
                            <p className="text-gray-400 mb-6">
                                {searchQuery || filter !== "all"
                                    ? "Essayez avec d'autres critères"
                                    : "Créez votre premier sondage pour commencer"}
                            </p>
                            <button
                                onClick={() => navigate("/create/date")}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Créer un sondage
                            </button>
                        </div>
                    ) : viewMode === "table" ? (
                        <DashboardTableView
                            items={paginatedItems}
                            selectedIds={selectedIds}
                            onToggleSelection={toggleSelection}
                            onRefresh={() => setRefreshKey((prev) => prev + 1)}
                        />
                    ) : (
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
                    {filteredItems.length > 0 && totalPages > 1 && (
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
                                    {/* Simplified pagination logic for brevity */}
                                    <PaginationItem>
                                        <span className="px-4">Page {currentPage} sur {totalPages}</span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                            }}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
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
    );
};

export default DatePollsDashboard;
