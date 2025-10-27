import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X } from "lucide-react";
import { useDashboardData } from "./dashboard/useDashboardData";
import { DashboardFilters } from "./dashboard/DashboardFilters";
import { ConversationCard } from "./dashboard/ConversationCard";
import { filterConversationItems } from "./dashboard/utils";
import { FilterType } from "./dashboard/types";

const DashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { conversationItems, loading, reload } = useDashboardData(refreshKey);

  // Écouter l'événement de création de poll
  useEffect(() => {
    const handlePollCreated = () => {
      console.log("📢 Poll created, refreshing...");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("pollCreated", handlePollCreated);
    return () => window.removeEventListener("pollCreated", handlePollCreated);
  }, []);

  // Appliquer les filtres
  const filteredItems = filterConversationItems(
    conversationItems,
    filter,
    searchQuery,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pt-20">
        {/* Indicateur Mode Développement Local */}
        <div className="bg-amber-900/20 border-l-4 border-amber-500 p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-200">
                🚧 <strong>Mode Développement Local</strong> - Les données sont
                stockées localement (localStorage)
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              Mes conversations
            </h1>

            {/* Bouton fermer */}
            <button
              onClick={() => navigate("/")}
              className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
              title="Retour à l'accueil"
              data-testid="close-dashboard"
            >
              <X className="w-6 h-6" />
            </button>
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
                {searchQuery || filter !== "all"
                  ? "Aucun résultat"
                  : "Aucune conversation"}
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
                  onRefresh={() => setRefreshKey((prev) => prev + 1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
