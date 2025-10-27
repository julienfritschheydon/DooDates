import React from "react";
import { Search } from "lucide-react";
import { FilterType } from "./types";
import { getStatusLabel } from "./utils";

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
}) => {
  const filters: FilterType[] = [
    "all",
    "draft",
    "active",
    "closed",
    "archived",
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une conversation ou un sondage..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="search-conversations"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-[#1e1e1e] text-gray-300 hover:bg-[#3c4043] border border-gray-700"
              }`}
            >
              {f === "all" ? "Tous" : getStatusLabel(f as any)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
