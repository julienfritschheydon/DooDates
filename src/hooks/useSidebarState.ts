import { useState, useCallback } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { logger } from "@/lib/logger";

/**
 * Hook pour gérer l'état du sidebar (ouvert/fermé)
 * Utilisé par les layouts produits pour une gestion cohérente
 */
export const useSidebarState = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // État initial : ouvert sur desktop (>= 768px), fermé sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true; // fallback SSR: ouvert
    }
    return window.innerWidth >= 768;
  });

  // Fonctions centralisées pour gérer l'état
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      logger.info("Sidebar toggled", "dashboard", { prev, next, isMobile });
      return next;
    });
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    logger.info("Sidebar closed", "dashboard", { isMobile });
    setIsSidebarOpen(false);
  }, [isMobile]);

  return { 
    isSidebarOpen, 
    toggleSidebar, 
    closeSidebar, 
    isMobile 
  };
};
