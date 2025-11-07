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
export declare function useViewportItems({
  viewMode,
  minItems,
  maxItems,
}: UseViewportItemsOptions): number;
export {};
