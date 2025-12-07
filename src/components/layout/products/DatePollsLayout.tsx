import React, { useCallback, useState } from "react";
import { DatePollsSidebar } from "./DatePollsSidebar";
import { Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { logger } from "@/lib/logger";

interface DatePollsLayoutProps {
  children: React.ReactNode;
}

export const DatePollsLayout: React.FC<DatePollsLayoutProps> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // État initial : ouvert sur desktop, fermé sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay mobile - ferme le sidebar au click */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={closeSidebar}
          aria-label="Fermer le menu"
        />
      )}

      {/* Bouton hamburger - position calculée avec CSS variable */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 p-2 bg-[#1a1a1a] text-white rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 ${
          isSidebarOpen ? "left-[272px]" : "left-4"
        }`}
        aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar - toujours monté, caché avec CSS */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#0a0a0a] overflow-y-auto transition-all duration-300 z-40 ${
          isSidebarOpen 
            ? "w-64 opacity-100" 
            : "w-0 opacity-0"
        }`}
      >
        <DatePollsSidebar 
          onClose={closeSidebar} 
          className={`h-full ${!isSidebarOpen ? 'pointer-events-none' : ''}`} 
        />
      </aside>

      {/* Zone contenu - pas de onClick, l'overlay gère la fermeture */}
      <main
        className={`flex-1 overflow-y-auto h-screen w-full transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
};
