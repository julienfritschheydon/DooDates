import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  onMenuOpen?: () => void;
  className?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuOpen, className }) => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4",
        className,
      )}
    >
      {/* Logo DooDates à gauche + bouton menu */}
      <div className="flex items-center gap-3">
        {/* Bouton menu - visible uniquement sur mobile */}
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Ouvrir le menu"
            data-testid="topnav-button"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logo DooDates */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-white font-semibold">DooDates</span>
        </Link>
      </div>

      {/* Espace vide à droite pour équilibre */}
      <div className="w-9 md:hidden" />
    </nav>
  );
};
