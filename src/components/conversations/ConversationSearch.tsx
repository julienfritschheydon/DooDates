/**
 * ConversationSearch Component
 * DooDates - Conversation History System
 */

import React, { useState, useCallback } from "react";
import { Search, Filter, X, Calendar, Tag, Star, MessageCircle } from "lucide-react";

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
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { cn } from "../../lib/utils";
import type { ConversationStatus } from "../../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SearchFilters {
  /** Search query for full-text search */
  query?: string;
  /** Filter by conversation status */
  status?: ConversationStatus | "all";
  /** Filter by favorite status */
  isFavorite?: boolean;
  /** Filter by date range */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  /** Filter by tags */
  tags?: string[];
  /** Filter by related poll existence */
  hasRelatedPoll?: boolean;
}

export interface ConversationSearchProps {
  /** Current search filters */
  filters?: SearchFilters;
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchFilters) => void;
  /** Available tags for filtering */
  availableTags?: string[];
  /** Show advanced filters */
  showAdvancedFilters?: boolean;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts", labelEn: "All statuses" },
  { value: "active", label: "Actives", labelEn: "Active" },
  { value: "completed", label: "Terminées", labelEn: "Completed" },
  { value: "archived", label: "Archivées", labelEn: "Archived" },
] as const;

const QUICK_FILTERS = [
  { key: "isFavorite", label: "Favoris", labelEn: "Favorites", icon: Star },
  {
    key: "hasRelatedPoll",
    label: "Avec sondage",
    labelEn: "With poll",
    icon: MessageCircle,
  },
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getStatusLabel(status: string, language: "fr" | "en" = "fr"): string {
  const option = STATUS_OPTIONS.find((opt) => opt.value === status);
  return option ? (language === "fr" ? option.label : option.labelEn) : status;
}

function formatDateRange(
  dateRange: { from?: Date; to?: Date },
  language: "fr" | "en" = "fr",
): string {
  if (!dateRange.from && !dateRange.to) return "";

  const formatDate = (date: Date) => {
    return language === "fr"
      ? date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  if (dateRange.from && dateRange.to) {
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
  } else if (dateRange.from) {
    return language === "fr"
      ? `Depuis ${formatDate(dateRange.from)}`
      : `From ${formatDate(dateRange.from)}`;
  } else if (dateRange.to) {
    return language === "fr"
      ? `Jusqu'au ${formatDate(dateRange.to)}`
      : `Until ${formatDate(dateRange.to)}`;
  }

  return "";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationSearch({
  filters = {},
  onFiltersChange,
  availableTags = [],
  showAdvancedFilters = true,
  placeholder,
  language = "fr",
  className,
}: ConversationSearchProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  // Text content based on language
  const text = {
    searchPlaceholder:
      language === "fr" ? "Rechercher dans les conversations..." : "Search conversations...",
    filters: language === "fr" ? "Filtres" : "Filters",
    clearFilters: language === "fr" ? "Effacer les filtres" : "Clear filters",
    dateRange: language === "fr" ? "Période" : "Date range",
    tags: language === "fr" ? "Tags" : "Tags",
    apply: language === "fr" ? "Appliquer" : "Apply",
    cancel: language === "fr" ? "Annuler" : "Cancel",
    noFilters: language === "fr" ? "Aucun filtre actif" : "No active filters",
  };

  // Handle search query change
  const handleQueryChange = useCallback(
    (value: string) => {
      const newFilters = { ...filters, query: value || undefined };
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange],
  );

  // Handle status filter change
  const handleStatusChange = useCallback(
    (status: string) => {
      const newFilters = {
        ...filters,
        status: status === "all" ? undefined : (status as ConversationStatus),
      };
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange],
  );

  // Handle quick filter toggle
  const handleQuickFilterToggle = useCallback(
    (filterKey: string) => {
      const newFilters = {
        ...filters,
        [filterKey]: !filters[filterKey as keyof SearchFilters],
      };
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange],
  );

  // Handle date range change
  const handleDateRangeApply = useCallback(() => {
    const newFilters = {
      ...filters,
      dateRange: tempDateRange.from || tempDateRange.to ? tempDateRange : undefined,
    };
    onFiltersChange?.(newFilters);
    setIsDatePickerOpen(false);
  }, [filters, onFiltersChange, tempDateRange]);

  // Handle tag toggle
  const handleTagToggle = useCallback(
    (tag: string) => {
      const currentTags = filters.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];

      const newFilters = {
        ...filters,
        tags: newTags.length > 0 ? newTags : undefined,
      };
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange],
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange?.({});
    setTempDateRange({});
  }, [onFiltersChange]);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder || text.searchPlaceholder}
          value={filters.query || ""}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {filters.query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQueryChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            data-testid="conversationsearch-button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {language === "fr" ? option.label : option.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Filters */}
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = Boolean(filters[filter.key as keyof SearchFilters]);

          return (
            <Button
              key={filter.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilterToggle(filter.key)}
              className="flex items-center gap-1"
              data-testid="conversationsearch-button"
            >
              <Icon className="h-3 w-3" />
              {language === "fr" ? filter.label : filter.labelEn}
            </Button>
          );
        })}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                data-testid="conversationsearch-button"
              >
                <Filter className="h-3 w-3" />
                {text.filters}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Date Range Filter */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="flex-1">{text.dateRange}</span>
                    {filters.dateRange && (
                      <Badge variant="secondary" className="ml-2">
                        {formatDateRange(filters.dateRange, language)}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: tempDateRange.from || filters.dateRange?.from,
                      to: tempDateRange.to || filters.dateRange?.to,
                    }}
                    onSelect={(range) => {
                      setTempDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                  />
                  <div className="flex justify-end gap-2 p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempDateRange({});
                        setIsDatePickerOpen(false);
                      }}
                      data-testid="conversationsearch-button"
                    >
                      {text.cancel}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDateRangeApply}
                      data-testid="conversationsearch-button"
                    >
                      {text.apply}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-500">{text.tags}</div>
                  {availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={filters.tags?.includes(tag) || false}
                      onCheckedChange={() => handleTagToggle(tag)}
                    >
                      <Tag className="mr-2 h-3 w-3" />
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
            data-testid="conversationsearch-button"
          >
            <X className="h-3 w-3 mr-1" />
            {text.clearFilters}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.query && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />"{filters.query}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQueryChange("")}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.status && filters.status !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getStatusLabel(filters.status, language)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("all")}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.isFavorite && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {language === "fr" ? "Favoris" : "Favorites"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickFilterToggle("isFavorite")}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.hasRelatedPoll && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {language === "fr" ? "Avec sondage" : "With poll"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickFilterToggle("hasRelatedPoll")}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange(filters.dateRange, language)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange?.({ ...filters, dateRange: undefined })}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTagToggle(tag)}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                data-testid="conversationsearch-button"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
