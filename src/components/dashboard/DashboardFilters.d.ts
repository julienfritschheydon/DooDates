import React from "react";
import { FilterType } from "./types";
export type ViewMode = "grid" | "table";
interface DashboardFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    selectedFolderId: string | null | undefined;
    onFolderChange: (folderId: string | null | undefined) => void;
    selectedIdsCount: number;
    onSelectAll: () => void;
    onClearSelection: () => void;
    hasItems: boolean;
}
export declare const DashboardFilters: React.FC<DashboardFiltersProps>;
export {};
