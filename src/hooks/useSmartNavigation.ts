/**
 * Hook React pour la navigation intelligente avec reset du chat
 * Implémente la logique de détermination et d'application des stratégies de reset
 */

import { useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { ChatResetService, type ResetStrategy } from "../services/ChatResetService";

interface UseSmartNavigationOptions {
  /** Callback appelé quand une stratégie de reset est appliquée */
  onResetStrategy?: (strategy: ResetStrategy) => void;
  /** Activer/désactiver le logging détaillé */
  debug?: boolean;
}

interface UseSmartNavigationReturn {
  /** Fonction de navigation intelligente */
  smartNavigate: (to: string, options?: { replace?: boolean }) => void;
  /** Stratégie de reset déterminée pour la navigation actuelle */
  currentResetStrategy: ResetStrategy | null;
  /** Appliquer manuellement une stratégie de reset */
  applyResetStrategy: (strategy: ResetStrategy) => Promise<void>;
}

/**
 * Hook pour gérer la navigation intelligente avec reset automatique du chat
 * selon le contexte de navigation (édition, changement de type, nouvelle création, etc.)
 */
export function useSmartNavigation(
  options: UseSmartNavigationOptions = {},
): UseSmartNavigationReturn {
  const { onResetStrategy, debug = false } = options;

  const location = useLocation();
  const navigate = useNavigate();
  const previousLocation = useRef<Location<any> | null>(null);
  const currentResetStrategy = useRef<ResetStrategy | null>(null);

  // Écouter les événements de reset de chat
  useEffect(() => {
    const handleChatReset = (event: CustomEvent<ResetStrategy>) => {
      const strategy = event.detail;
      currentResetStrategy.current = strategy;

      if (debug) {
        console.log("🔄 Chat reset event received:", strategy);
      }

      onResetStrategy?.(strategy);
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener("chat-reset", handleChatReset as EventListener);

    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener("chat-reset", handleChatReset as EventListener);
    };
  }, [onResetStrategy, debug]);

  /**
   * Navigation intelligente qui détermine et applique la stratégie de reset appropriée
   */
  const smartNavigate = useCallback(
    (to: string, navOptions: { replace?: boolean } = {}) => {
      // Créer un objet Location simulé pour la destination
      const toLocation = new URL(to, window.location.origin);
      const toLocationObj = {
        pathname: toLocation.pathname,
        search: toLocation.search,
        hash: toLocation.hash,
        href: toLocation.href,
        origin: toLocation.origin,
        protocol: toLocation.protocol,
        host: toLocation.host,
        hostname: toLocation.hostname,
        port: toLocation.port,
        ancestorOrigins: {
          length: 0,
          contains: () => false,
          item: () => null,
          [Symbol.iterator]: function* () {},
        } as DOMStringList,
        assign: () => {},
        replace: () => {},
        reload: () => {},
        toString: () => toLocation.href,
      } as unknown as Location;

      // Déterminer la stratégie de reset
      const strategy = ChatResetService.determineResetStrategy(
        previousLocation.current as Location | null,
        toLocationObj as Location,
        navOptions.replace ? "REPLACE" : "PUSH",
      );

      if (debug) {
        console.log("🧭 Smart navigation:", {
          from: previousLocation.current?.pathname,
          to: toLocationObj.pathname,
          strategy: strategy.reason,
        });
      }

      // Appliquer la stratégie si nécessaire
      if (strategy.shouldReset) {
        ChatResetService.applyResetStrategy(strategy);
      }

      // Naviguer
      if (navOptions.replace) {
        navigate(to, { replace: true });
      } else {
        navigate(to);
      }

      // Mettre à jour la location précédente
      previousLocation.current = location;
    },
    [location, navigate, debug],
  );

  /**
   * Appliquer manuellement une stratégie de reset
   */
  const applyResetStrategy = useCallback(
    async (strategy: ResetStrategy) => {
      if (debug) {
        console.log("🔄 Applying reset strategy manually:", strategy);
      }

      await ChatResetService.applyResetStrategy(strategy);
    },
    [debug],
  );

  // Mettre à jour la location précédente quand la location change
  useEffect(() => {
    if (location) {
      previousLocation.current = location;
    }
  }, [location]);

  return {
    smartNavigate,
    currentResetStrategy: currentResetStrategy.current,
    applyResetStrategy,
  };
}

export default useSmartNavigation;
