import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SidebarContent } from './SidebarContent';

/**
 * Sidebar responsive
 * 
 * Desktop (≥768px): Sidebar fixe 240px à gauche
 * Mobile (<768px): Burger menu top-left qui ouvre overlay sidebar
 */
export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const closeSidebar = () => setIsOpen(false);

  // Mobile: Burger button + Overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Burger button (top-left) */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md md:hidden hover:bg-gray-50 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Overlay sidebar */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeSidebar}
              aria-hidden="true"
            />

            {/* Sidebar panel */}
            <aside
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-xl md:hidden transform transition-transform duration-300"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              {/* Close button */}
              <button
                onClick={closeSidebar}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation content */}
              <SidebarContent onItemClick={closeSidebar} />
            </aside>
          </>
        )}
      </>
    );
  }

  // Desktop: Sidebar fixe
  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 hidden md:block">
      <SidebarContent />
    </aside>
  );
}
