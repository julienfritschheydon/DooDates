import React, { useEffect, useState } from "react";
import { AvailabilityPollsSidebar } from "./AvailabilityPollsSidebar";
import { Menu, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { logger } from "@/lib/logger";

interface AvailabilityPollsLayoutProps {
  children: React.ReactNode;
}

export const AvailabilityPollsLayout: React.FC<AvailabilityPollsLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar toggle button - mobile only */}
      <button
        onClick={() =>
          setIsSidebarOpen((prev) => {
            const next = !prev;
            logger.info("AvailabilityPollsLayout sidebar toggle click", "dashboard", {
              prev,
              next,
              isMobile,
            });
            return next;
          })
        }
        className="fixed top-4 left-4 z-40 p-2 bg-[#1a1a1a] text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>

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
            <AvailabilityPollsSidebar onClose={() => setIsSidebarOpen(false)} className="h-full" />

            {/* Close Button inside Sidebar (optional, but good for UX) */}
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
      {!isMobile && isSidebarOpen && <AvailabilityPollsSidebar />}

      <main
        className="flex-1 overflow-y-auto h-screen w-full"
        onClick={() => {
          if (isMobile && isSidebarOpen) {
            logger.info("AvailabilityPollsLayout main click close", "dashboard", {
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
