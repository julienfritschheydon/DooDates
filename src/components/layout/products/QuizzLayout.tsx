import React, { useState } from "react";
import { QuizzSidebar } from "./QuizzSidebar";
import { Menu, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface QuizzLayoutProps {
  children: React.ReactNode;
}

export const QuizzLayout: React.FC<QuizzLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          {/* Hamburger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 bg-[#1a1a1a] text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar Panel */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <QuizzSidebar onClose={() => setIsSidebarOpen(false)} className="h-full" />

            {/* Close Button inside Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && <QuizzSidebar />}

      <main className="flex-1 overflow-y-auto h-screen w-full">{children}</main>
    </div>
  );
};
