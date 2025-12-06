import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  LayoutGrid,
  Table,
  Tag,
  Folder,
  X,
  Plus,
  CheckSquare,
  Calendar,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { FilterType, DashboardPoll, ContentTypeFilter } from "./types";
import { getStatusLabel } from "./utils";
import { getAllTags, createTag, Tag as TagType } from "@/lib/storage/TagStorage";
import { getAllFolders, createFolder, Folder as FolderType } from "@/lib/storage/FolderStorage";
import { useToast } from "@/hooks/use-toast";

export type ViewMode = "grid" | "table";

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  contentTypeFilter: ContentTypeFilter;
  onContentTypeFilterChange: (filter: ContentTypeFilter) => void;
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
  hideContentTypeFilter?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  contentTypeFilter,
  onContentTypeFilterChange,
  viewMode,
  onViewModeChange,
  selectedTags,
  onTagsChange,
  selectedFolderId,
  onFolderChange,
  selectedIdsCount,
  onSelectAll,
  onClearSelection,
  hasItems,
  hideContentTypeFilter = false,
}) => {
  const filters: FilterType[] = ["all", "draft", "active", "closed", "archived"];
  const contentTypeFilters: { value: ContentTypeFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "Tous", icon: null },
    { value: "conversations", label: "Conversations", icon: <MessageSquare className="w-4 h-4" /> },
    { value: "date", label: "Sondages dates", icon: <Calendar className="w-4 h-4" /> },
    { value: "availability", label: "Disponibilités", icon: <Calendar className="w-4 h-4" /> },
    { value: "form", label: "Formulaires", icon: <ClipboardList className="w-4 h-4" /> },
  ];
  const [tags, setTags] = useState<TagType[]>(getAllTags());
  const [folders, setFolders] = useState<FolderType[]>(getAllFolders());
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  // Fermer les menus en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setShowFolderMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = createTag(newTagName);
      setTags(getAllTags());
      setNewTagName("");
      setShowTagMenu(false);
      toast({
        title: "Tag créé",
        description: `Le tag "${newTag.name}" a été créé.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de créer le tag.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    try {
      const newFolder = createFolder(newFolderName);
      setFolders(getAllFolders());
      setNewFolderName("");
      setShowFolderMenu(false);
      toast({
        title: "Dossier créé",
        description: `Le dossier "${newFolder.name}" a été créé.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible de créer le dossier.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getFilterColor = (type: ContentTypeFilter) => {
    switch (type) {
      case "form":
        return {
          activeBg: "bg-violet-500",
          activeBorder: "border-violet-400",
          shadow: "shadow-violet-500/30",
          text: "text-violet-500",
          border: "border-violet-500",
          hoverBg: "hover:bg-violet-600",
          bg: "bg-violet-600",
        };
      case "availability":
        return {
          activeBg: "bg-emerald-500",
          activeBorder: "border-emerald-400",
          shadow: "shadow-emerald-500/30",
          text: "text-emerald-500",
          border: "border-emerald-500",
          hoverBg: "hover:bg-emerald-700",
          bg: "bg-emerald-600",
        };
      default: // date, all, conversations
        return {
          activeBg: "bg-blue-500",
          activeBorder: "border-blue-400",
          shadow: "shadow-blue-500/30",
          text: "text-blue-500",
          border: "border-blue-500",
          hoverBg: "hover:bg-blue-700",
          bg: "bg-blue-600",
        };
    }
  };

  const currentTheme = getFilterColor(contentTypeFilter);

  return (
    <div className="mb-6 space-y-4">
      {/* Ligne 1: Recherche + Actions principales (Vue + Sélectionner) */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une conversation ou un sondage..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-[#1e1e1e] border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="search-conversations"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions principales: Vue + Sélectionner */}
        <div className="flex items-center gap-3">
          {/* Toggle Grid/Table */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] border border-gray-700 rounded-lg p-1">
            <button
              data-testid="view-toggle-grid"
              onClick={() => onViewModeChange("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? `${currentTheme.activeBg} text-white`
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
              title="Vue grille"
              aria-label="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              data-testid="view-toggle-table"
              onClick={() => onViewModeChange("table")}
              className={`hidden md:block p-2 rounded transition-colors ${
                viewMode === "table"
                  ? `${currentTheme.activeBg} text-white`
                  : "text-gray-300 hover:bg-[#2a2a2a]"
              }`}
              title="Vue table"
              aria-label="Vue table"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* Bouton Sélectionner */}
          {hasItems && (
            <button
              onClick={selectedIdsCount > 0 ? onClearSelection : onSelectAll}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border ${
                selectedIdsCount > 0
                  ? `${currentTheme.bg} ${currentTheme.hoverBg} text-white ${currentTheme.border}`
                  : "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white border-gray-700"
              }`}
              title={selectedIdsCount > 0 ? "Désélectionner tout" : "Sélectionner tout"}
              data-testid="selection-toggle-button"
            >
              <CheckSquare className="w-5 h-5" />
              <span className="hidden sm:inline">
                {selectedIdsCount > 0 ? `${selectedIdsCount} sélectionné(s)` : "Sélectionner"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2: Filtres type de contenu */}
      {!hideContentTypeFilter && (
        <div className="flex flex-wrap gap-3 items-center">
          {/* Filtres par type de contenu */}
          <div className="flex gap-2 flex-wrap">
            {contentTypeFilters.map(({ value, label, icon }) => {
              const theme = getFilterColor(value);
              return (
                <button
                  key={value}
                  data-testid={`content-type-filter-${value}`}
                  onClick={() => onContentTypeFilterChange(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    contentTypeFilter === value
                      ? `${theme.activeBg} text-white border-2 ${theme.activeBorder} shadow-lg ${theme.shadow} scale-105 font-semibold`
                      : "bg-[#1e1e1e] text-gray-300 hover:bg-[#3c4043] border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ligne 3: Filtres statut + Tags + Dossiers */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtres par statut */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              data-testid={`status-filter-${f}`}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? `${currentTheme.activeBg} text-white border-2 ${currentTheme.activeBorder} shadow-lg ${currentTheme.shadow} scale-105 font-semibold`
                  : "bg-[#1e1e1e] text-gray-300 hover:bg-[#3c4043] border border-gray-700 hover:border-gray-600"
              }`}
            >
              {f === "all" ? "Tous" : getStatusLabel(f as DashboardPoll["status"])}
            </button>
          ))}
        </div>

        {/* Tags et Dossiers */}
        {/* Filtre par Tags */}
        <div className="relative" ref={tagMenuRef}>
          <button
            onClick={() => setShowTagMenu(!showTagMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedTags.length > 0
                ? `${currentTheme.activeBg} text-white ${currentTheme.border}`
                : "bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] border-gray-700"
            }`}
          >
            <Tag className="w-4 h-4" />
            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>

          {showTagMenu && (
            <div
              className="absolute top-full left-0 mt-2 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-gray-700">
                <input
                  type="text"
                  placeholder="Nouveau tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateTag();
                  }}
                  className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 ${currentTheme.bg} ${currentTheme.hoverBg} text-white rounded text-sm`}
                >
                  <Plus className="w-3 h-3" />
                  Créer
                </button>
              </div>
              <div className="p-2 space-y-1">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] rounded cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTag(tag.name);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded"
                    />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm text-gray-300">{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">Aucun tag disponible</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filtre par Dossier */}
        <div className="relative" ref={folderMenuRef}>
          <button
            onClick={() => setShowFolderMenu(!showFolderMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedFolderId
                ? `${currentTheme.activeBg} text-white ${currentTheme.border}`
                : "bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] border-gray-700"
            }`}
          >
            <Folder className="w-4 h-4" />
            {selectedFolderId
              ? folders.find((f) => f.id === selectedFolderId)?.name || "Dossier"
              : "Tous les dossiers"}
          </button>

          {showFolderMenu && (
            <div
              className="absolute top-full left-0 mt-2 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-gray-700">
                <input
                  type="text"
                  placeholder="Nouveau dossier..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFolder();
                  }}
                  className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 ${currentTheme.bg} ${currentTheme.hoverBg} text-white rounded text-sm`}
                >
                  <Plus className="w-3 h-3" />
                  Créer
                </button>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderChange(undefined);
                    setShowFolderMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    !selectedFolderId
                      ? `${currentTheme.bg} text-white`
                      : "text-gray-300 hover:bg-[#2a2a2a]"
                  }`}
                >
                  Tous les dossiers
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFolderChange(folder.id);
                      setShowFolderMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedFolderId === folder.id
                        ? `${currentTheme.bg} text-white`
                        : "text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <span>{folder.icon}</span>
                    <span>{folder.name}</span>
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">Aucun dossier disponible</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tags sélectionnés - affichage */}
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedTags.map((tagName) => {
              const tag = tags.find((t) => t.name === tagName);
              return (
                <span
                  key={tagName}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${currentTheme.bg} text-white`}
                  style={{ backgroundColor: tag?.color || undefined }}
                >
                  {tagName}
                  <button
                    onClick={() => toggleTag(tagName)}
                    className="hover:bg-black/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
