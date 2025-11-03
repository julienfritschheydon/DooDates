import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X, Info, Trash2, CheckSquare } from "lucide-react";
import { useDashboardData } from "./dashboard/useDashboardData";
import { DashboardFilters } from "./dashboard/DashboardFilters";
import { ConversationCard } from "./dashboard/ConversationCard";
import { filterConversationItems } from "./dashboard/utils";
import { FilterType } from "./dashboard/types";
import { logger } from "@/lib/logger";
import { useFreemiumQuota } from "@/hooks/useFreemiumQuota";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { usePollDeletionCascade } from "@/hooks/usePollDeletionCascade";
import { useToast } from "@/hooks/use-toast";
import { QuotaExplanation } from "@/components/ui/QuotaExplanation";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { status: quotaStatus } = useFreemiumQuota();
  const { deleteConversation } = useConversations();
  const { deletePollWithCascade } = usePollDeletionCascade();
  const { toast } = useToast();

  const { conversationItems, loading, reload } = useDashboardData(refreshKey);

  // Écouter l'événement de création de poll
  useEffect(() => {
    const handlePollCreated = () => {
      logger.info("Poll created, refreshing dashboard", "poll");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("pollCreated", handlePollCreated);
    return () => window.removeEventListener("pollCreated", handlePollCreated);
  }, []);

  // Appliquer les filtres
  const filteredItems = filterConversationItems(conversationItems, filter, searchQuery);

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
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                Mes conversations
              </h1>

              <div className="flex items-center gap-2">
                {/* Bouton sélection multiple */}
                {filteredItems.length > 0 && (
                  <button
                    onClick={selectedIds.size > 0 ? clearSelection : selectAll}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border ${
                      selectedIds.size > 0
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                        : "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white border-gray-700"
                    }`}
                    title={selectedIds.size > 0 ? "Désélectionner tout" : "Sélectionner tout"}
                  >
                    <CheckSquare className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      {selectedIds.size > 0 ? `${selectedIds.size} sélectionné(s)` : "Sélectionner"}
                    </span>
                  </button>
                )}

                {/* Bouton fermer */}
                <button
                  onClick={() => {
                    // Nettoyer l'état du poll en cours avant de retourner à l'accueil
                    localStorage.removeItem("editor_poll");
                    navigate("/", { replace: true });
                  }}
                  className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
                  title="Retour à l'accueil"
                  data-testid="close-dashboard"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quota indicator */}
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                quotaStatus.conversations.isNearLimit
                  ? "bg-orange-900/20 border-orange-500/50"
                  : "bg-blue-900/20 border-blue-500/50"
              }`}
            >
              <Info
                className={`w-5 h-5 ${
                  quotaStatus.conversations.isNearLimit ? "text-orange-400" : "text-blue-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">
                    {quotaStatus.conversations.used}/{quotaStatus.conversations.limit}
                  </span>{" "}
                  conversations utilisées
                  {!user && (
                    <span className="ml-2 text-blue-400">
                      • Créez un compte pour synchroniser vos données
                    </span>
                  )}
                </p>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quotaStatus.conversations.isNearLimit ? "bg-orange-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(quotaStatus.conversations.percentage, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Bouton d'explication des quotas */}
              <QuotaExplanation />
            </div>
          </div>

          {/* Filtres */}
          <DashboardFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
          />

          {/* Grille de cartes */}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
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
        </div>

        {/* Barre d'actions flottante */}
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

export default Dashboard;
