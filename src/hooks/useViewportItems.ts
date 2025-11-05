import { useState, useEffect } from "react";

export type ViewMode = "grid" | "table";

interface UseViewportItemsOptions {
  viewMode: ViewMode;
  minItems?: number;
  maxItems?: number;
}

/**
 * Hook pour calculer dynamiquement le nombre d'items par page selon le viewport
 * 
 * @param viewMode - Mode de vue ("grid" ou "table")
 * @param minItems - Nombre minimum d'items par page (défaut: 6)
 * @param maxItems - Nombre maximum d'items par page (défaut: 24)
 * @returns Nombre d'items par page calculé
 */
export function useViewportItems({
  viewMode,
  minItems = 6,
  maxItems = 24,
}: UseViewportItemsOptions): number {
  const [itemsPerPage, setItemsPerPage] = useState<number>(minItems);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Hauteur disponible approximative (viewport - header - filters - pagination - margins)
      // Header: ~200px, Filters: ~100px, Pagination: ~80px, Margins: ~40px
      const headerHeight = 200;
      const filtersHeight = 100;
      const paginationHeight = 80;
      const margins = 40;
      const availableHeight = viewportHeight - headerHeight - filtersHeight - paginationHeight - margins;

      if (viewMode === "table") {
        // Table: ~50px par ligne (hauteur approximative d'une ligne de tableau)
        const rowHeight = 50;
        const calculatedItems = Math.floor(availableHeight / rowHeight);
        
        // Ajustements selon la largeur d'écran
        if (viewportWidth < 768) {
          // Mobile: 8-10 items
          return Math.max(minItems, Math.min(calculatedItems, 10));
        } else if (viewportWidth < 1024) {
          // Tablet: 12-15 items
          return Math.max(12, Math.min(calculatedItems, 15));
        } else {
          // Desktop: 18-24 items
          return Math.max(18, Math.min(calculatedItems, maxItems));
        }
      } else {
        // Grid: dépend du nombre de colonnes et de la hauteur des cards
        const cardHeight = 280; // Hauteur approximative d'une card
        const gap = 24; // gap-6 = 24px
        
        let cols: number;
        if (viewportWidth < 768) {
          cols = 1;
        } else if (viewportWidth < 1024) {
          cols = 2;
        } else {
          cols = 3;
        }

        const rows = Math.floor((availableHeight + gap) / (cardHeight + gap));
        const calculatedItems = cols * rows;

        // Ajustements selon la largeur d'écran
        if (viewportWidth < 768) {
          // Mobile: 6-8 items
          return Math.max(minItems, Math.min(calculatedItems, 8));
        } else if (viewportWidth < 1024) {
          // Tablet: 8-12 items
          return Math.max(8, Math.min(calculatedItems, 12));
        } else {
          // Desktop: 12-18 items
          return Math.max(12, Math.min(calculatedItems, 18));
        }
      }
    };

    // Calcul initial
    setItemsPerPage(calculateItemsPerPage());

    // Recalculer lors du redimensionnement
    const handleResize = () => {
      setItemsPerPage(calculateItemsPerPage());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode, minItems, maxItems]);

  return itemsPerPage;
}
