import { useState, useEffect, useRef } from "react";

export type ViewMode = "grid" | "table";

interface UseViewportItemsOptions {
  viewMode: ViewMode;
  minItems?: number;
  maxItems?: number;
}

/**
 * Hook pour calculer dynamiquement le nombre d'items par page selon le viewport
 * Optimisé pour éviter les reflows forcés avec debounce et requestAnimationFrame
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
  // Calcul initial immédiat pour éviter le délai du premier rendu
  const calculateInitial = () => {
    if (typeof window === "undefined") return minItems;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const headerHeight = 200;
    const filtersHeight = 100;
    const paginationHeight = 80;
    const margins = 40;
    const availableHeight =
      viewportHeight - headerHeight - filtersHeight - paginationHeight - margins;

    if (viewMode === "table") {
      const rowHeight = 50;
      const calculatedItems = Math.floor(availableHeight / rowHeight);

      if (viewportWidth < 768) {
        return Math.max(minItems, Math.min(calculatedItems, 10));
      } else if (viewportWidth < 1024) {
        return Math.max(12, Math.min(calculatedItems, 15));
      } else {
        return Math.max(18, Math.min(calculatedItems, maxItems));
      }
    } else {
      const cardHeight = 280;
      const gap = 24;

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

      if (viewportWidth < 768) {
        return Math.max(minItems, Math.min(calculatedItems, 8));
      } else if (viewportWidth < 1024) {
        return Math.max(8, Math.min(calculatedItems, 12));
      } else {
        return Math.max(12, Math.min(calculatedItems, 18));
      }
    }
  };

  const [itemsPerPage, setItemsPerPage] = useState<number>(calculateInitial);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      // Utiliser requestAnimationFrame pour éviter les reflows forcés
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Hauteur disponible approximative (viewport - header - filters - pagination - margins)
        // Header: ~200px, Filters: ~100px, Pagination: ~80px, Margins: ~40px
        const headerHeight = 200;
        const filtersHeight = 100;
        const paginationHeight = 80;
        const margins = 40;
        const availableHeight =
          viewportHeight - headerHeight - filtersHeight - paginationHeight - margins;

        let calculated: number;

        if (viewMode === "table") {
          // Table: ~50px par ligne (hauteur approximative d'une ligne de tableau)
          const rowHeight = 50;
          const calculatedItems = Math.floor(availableHeight / rowHeight);

          // Ajustements selon la largeur d'écran
          if (viewportWidth < 768) {
            // Mobile: 8-10 items
            calculated = Math.max(minItems, Math.min(calculatedItems, 10));
          } else if (viewportWidth < 1024) {
            // Tablet: 12-15 items
            calculated = Math.max(12, Math.min(calculatedItems, 15));
          } else {
            // Desktop: 18-24 items
            calculated = Math.max(18, Math.min(calculatedItems, maxItems));
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
            calculated = Math.max(minItems, Math.min(calculatedItems, 8));
          } else if (viewportWidth < 1024) {
            // Tablet: 8-12 items
            calculated = Math.max(8, Math.min(calculatedItems, 12));
          } else {
            // Desktop: 12-18 items
            calculated = Math.max(12, Math.min(calculatedItems, 18));
          }
        }

        setItemsPerPage(calculated);
      });
    };

    // Calcul initial
    calculateItemsPerPage();

    // Recalculer lors du redimensionnement avec debounce pour éviter les reflows
    const handleResize = () => {
      // Nettoyer le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce pour éviter trop de recalculs pendant le resize
      timeoutRef.current = setTimeout(() => {
        calculateItemsPerPage();
      }, 150);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [viewMode, minItems, maxItems]);

  return itemsPerPage;
}
