import React, { useEffect, useState } from "react";
import { QuizzSidebar } from "./QuizzSidebar";
import { Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { logger } from "@/lib/logger";

interface QuizzLayoutProps {
  children: React.ReactNode;
}

export const QuizzLayout: React.FC<QuizzLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Bouton hamburger fixe, toujours cliquable, positionné à droite du sidebar quand ouvert */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsSidebarOpen((prev) => {
            const next = !prev;
            logger.info("QuizzLayout sidebar toggle click", "dashboard", {
              prev,
              next,
              isMobile,
            });
            return next;
          });
        }}
        className={`fixed top-4 z-50 p-2 bg-[#1a1a1a] text-white rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 ${
          isSidebarOpen ? "left-[272px]" : "left-4"
        }`}
        aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar gauche, présent sur tous les écrans */}
      <aside
        className={`h-screen bg-[#0a0a0a] overflow-y-auto transition-all duration-300 z-40 ${
          isSidebarOpen ? "w-64" : "w-0"
        }`}
      >
        {isSidebarOpen && <QuizzSidebar onClose={() => setIsSidebarOpen(false)} className="h-full" />}
      </aside>

      {/* Zone contenu */}
      <main
        className="flex-1 overflow-y-auto h-screen w-full"
        onClick={() => {
          if (isSidebarOpen) {
            logger.info("QuizzLayout main click close", "dashboard", {
              isMobile,
              isSidebarOpen,
            });
            setIsSidebarOpen(false);
          }
        }}
      >
        {children}
      </main>
    </div>
  );
};
