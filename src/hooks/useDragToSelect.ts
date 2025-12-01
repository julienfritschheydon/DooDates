import { useState, useEffect, useCallback } from "react";

export interface UseDragToSelectOptions<T> {
  /**
   * Fonction appelée quand le drag se termine avec les items sélectionnés
   */
  onDragEnd: (draggedItems: Set<string>, startItem: T | null) => void;

  /**
   * Fonction pour obtenir la clé unique d'un item
   */
  getItemKey: (item: T) => string;

  /**
   * Fonction pour calculer tous les items entre deux items (inclusive)
   */
  getItemsInRange: (startItem: T, endItem: T) => T[];

  /**
   * Fonction pour vérifier si un item peut être dragué (optionnel)
   */
  canDragItem?: (item: T) => boolean;

  /**
   * Désactiver le drag sur mobile
   */
  disableOnMobile?: boolean;
}

export interface UseDragToSelectReturn {
  isDragging: boolean;
  draggedItems: Set<string>;
  handleDragStart: (item: any, e: React.PointerEvent) => void;
  handleDragMove: (item: any, e?: React.PointerEvent) => void;
  handleDragEnd: () => void;
  isDraggedOver: (itemKey: string) => boolean;
  isLongPressActive: boolean;
}

/**
 * Hook réutilisable pour implémenter le drag-to-select sur n'importe quel type d'items
 *
 * @example
 * // Pour des dates
 * const { isDragging, draggedItems, handleDragStart, handleDragMove, handleDragEnd } = useDragToSelect({
 *   onDragEnd: (items, start) => { ... },
 *   getItemKey: (date) => formatDate(date),
 *   getItemsInRange: (start, end) => getDatesInRange(start, end),
 * });
 *
 * @example
 * // Pour des créneaux horaires
 * const { isDragging, draggedItems, handleDragStart, handleDragMove, handleDragEnd } = useDragToSelect({
 *   onDragEnd: (items) => { ... },
 *   getItemKey: (slot) => `${slot.hour}-${slot.minute}`,
 *   getItemsInRange: (start, end) => getTimeSlotsInRange(start, end),
 * });
 */
export function useDragToSelect<T>({
  onDragEnd,
  getItemKey,
  getItemsInRange,
  canDragItem,
  disableOnMobile = false,
}: UseDragToSelectOptions<T>): UseDragToSelectReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartItem, setDragStartItem] = useState<T | null>(null);
  const [draggedItems, setDraggedItems] = useState<Set<string>>(new Set());
  const [hasMoved, setHasMoved] = useState(false);

  // État pour la détection de direction (mobile)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragDirection, setDragDirection] = useState<"horizontal" | "vertical" | null>(null);

  // État pour le long press (mobile/tablette)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressActivated, setIsLongPressActivated] = useState(false);

  // Vérifier si on est sur mobile
  const isMobile = useCallback(() => {
    return disableOnMobile && window.innerWidth < 768; // md breakpoint
  }, [disableOnMobile]);

  // Gérer le début du drag
  const handleDragStart = useCallback(
    (item: T, e: React.PointerEvent) => {
      // Vérifier si l'item peut être dragué
      if (canDragItem && !canDragItem(item)) return;

      // Sur mobile/tablette avec touch, utiliser le long press
      if (e.pointerType === "touch") {
        // Empêcher le comportement par défaut immédiatement
        e.preventDefault();
        e.stopPropagation();

        setDragStartPos({ x: e.clientX, y: e.clientY });
        setDragDirection(null);
        setIsLongPressActivated(false);

        // Démarrer le timer de long press (500ms)
        const timer = setTimeout(() => {
          const itemKey = getItemKey(item);
          setIsLongPressActivated(true);
          setIsDragging(true);
          setDragStartItem(item);
          setDraggedItems(new Set([itemKey]));
          setHasMoved(false);

          // Feedback haptique si disponible
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, 500);

        setLongPressTimer(timer);
        return;
      }

      // Desktop : comportement normal
      // Pour la souris, on n'empêche pas le comportement par défaut (click)
      // car on veut que le onClick fonctionne si on ne drag pas
      if (e.pointerType !== "mouse") {
        e.preventDefault();
      }
      e.stopPropagation();

      setIsDragging(true);
      setDragStartItem(item);
      setDraggedItems(new Set([getItemKey(item)]));
      setHasMoved(false);
    },
    [canDragItem, getItemKey],
  );

  // Gérer le drag en cours
  const handleDragMove = useCallback(
    (item: T, e?: React.PointerEvent) => {
      // Sur mobile/tablette avec touch
      if (e && e.pointerType === "touch") {
        // Si le doigt bouge avant la fin du long press, annuler le timer
        if (longPressTimer && !isLongPressActivated && dragStartPos) {
          const deltaX = Math.abs(e.clientX - dragStartPos.x);
          const deltaY = Math.abs(e.clientY - dragStartPos.y);

          // Si mouvement > 10px, c'est un scroll, pas un long press
          if (deltaX > 10 || deltaY > 10) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
            setDragStartPos(null);
            return;
          }
        }

        // Si le long press n'est pas encore activé, ne rien faire
        if (!isLongPressActivated) {
          return;
        }

        // Empêcher le scroll pendant le drag
        e.preventDefault();
        e.stopPropagation();
      }

      if (!isDragging || !dragStartItem) return;

      // Marquer qu'on a bougé (différencier du simple clic)
      const currentKey = getItemKey(item);
      const startKey = getItemKey(dragStartItem);

      if (currentKey !== startKey) {
        setHasMoved(true);
      }

      // Calculer tous les items dans le range
      const itemsInRange = getItemsInRange(dragStartItem, item);
      const itemKeys = new Set(itemsInRange.map(getItemKey));

      setDraggedItems(itemKeys);
    },
    [
      isDragging,
      dragStartItem,
      dragStartPos,
      longPressTimer,
      isLongPressActivated,
      getItemKey,
      getItemsInRange,
    ],
  );

  // Gérer la fin du drag
  const handleDragEnd = useCallback(() => {
    // Nettoyer le timer de long press si présent
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isDragging) {
      // Reset des états même si pas de drag actif
      setDragStartPos(null);
      setIsLongPressActivated(false);
      return;
    }

    // Si on n'a pas bougé, c'est un simple clic, ne pas appeler onDragEnd
    // SAUF si c'est un long press mobile (dans ce cas, on veut sélectionner la case initiale)
    if (draggedItems.size > 0 && (hasMoved || isLongPressActivated)) {
      onDragEnd(draggedItems, dragStartItem);
    }

    setIsDragging(false);
    setDragStartItem(null);
    setDraggedItems(new Set());
    setHasMoved(false);
    setDragStartPos(null);
    setDragDirection(null);
    setIsLongPressActivated(false);
  }, [
    isDragging,
    draggedItems,
    hasMoved,
    dragStartItem,
    onDragEnd,
    longPressTimer,
    isLongPressActivated,
  ]);

  // Vérifier si un item est survolé pendant le drag
  const isDraggedOver = useCallback(
    (itemKey: string) => {
      return isDragging && draggedItems.has(itemKey);
    },
    [isDragging, draggedItems],
  );

  // Bloquer le scroll quand le long press est activé (mobile/tablette)
  useEffect(() => {
    if (isLongPressActivated) {
      // Empêcher le scroll pendant le drag
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      // Bloquer les événements touch natifs (crucial pour Android)
      const preventTouch = (e: TouchEvent) => {
        e.preventDefault();
      };

      // Utiliser {passive: false} pour pouvoir appeler preventDefault()
      document.addEventListener("touchmove", preventTouch, { passive: false });

      return () => {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        document.removeEventListener("touchmove", preventTouch);
      };
    }
  }, [isLongPressActivated]);

  // Gérer le relâchement du pointeur en dehors de la zone
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [isDragging, handleDragEnd]);

  return {
    isDragging,
    draggedItems,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDraggedOver,
    isLongPressActive: isLongPressActivated,
  };
}
