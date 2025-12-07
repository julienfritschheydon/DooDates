import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Home, List, Settings, User, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/modals/AuthModal";
import { getProductConfig, getThemeClasses, type ProductType } from "@/config/products.config";

interface ProductSidebarProps {
  productType: ProductType;
  onClose?: () => void;
  className?: string;
}

export const ProductSidebar: React.FC<ProductSidebarProps> = ({
  productType,
  onClose,
  className,
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const config = getProductConfig(productType);
  const theme = getThemeClasses(config.theme);
  const Icon = config.icon;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div
      className={cn("w-64 bg-[#1a1a1a] border-r border-gray-800 h-screen flex flex-col", className)}
    >
      <div className="p-6 border-b border-gray-800">
        <Link to={config.baseRoute} className="flex items-center gap-2" onClick={handleLinkClick}>
          <div className={cn("p-2 rounded-lg", theme.bg)}>
            <Icon className={cn("w-6 h-6", theme.text)} />
          </div>
          <span className="font-bold text-xl text-white">{config.namePlural}</span>
        </Link>
      </div>

      <div className="p-4">
        <Link
          to={config.createRoute}
          data-testid={`create-${productType}-poll`}
          onClick={handleLinkClick}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 px-4 text-white rounded-lg font-medium transition-colors shadow-sm",
            theme.button,
          )}
        >
          <Plus className="w-5 h-5" />
          {config.createLabel}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link
          to={config.dashboardRoute}
          onClick={handleLinkClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive(config.dashboardRoute)
              ? cn(theme.bg, theme.text)
              : "text-gray-400 hover:bg-gray-800 hover:text-white",
          )}
        >
          <Home className="w-5 h-5" />
          Tableau de bord
        </Link>
        {/* Lien historique enfants pour Quizz uniquement */}
        {productType === "quizz" && (
          <Link
            to="/quizz/history"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive("/quizz/history")
                ? cn(theme.bg, theme.text)
                : "text-gray-400 hover:bg-gray-800 hover:text-white",
            )}
          >
            <Users className="w-5 h-5" />
            Historique enfants
          </Link>
        )}
        {productType !== "quizz" && (
          <Link
            to={config.listRoute}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(config.listRoute) && location.pathname !== config.baseRoute
                ? cn(theme.bg, theme.text)
                : location.pathname === config.baseRoute ||
                    location.pathname === config.baseRoute + "/"
                  ? cn(theme.bg, theme.text)
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
            )}
          >
            <List className="w-5 h-5" />
            {config.listLabel}
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-1">
        <Link
          to={config.settingsRoute}
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          Paramètres
        </Link>
      </div>

      {/* User Menu / Connexion */}
      <div className="p-3 border-t border-gray-800">
        {user ? (
          <div
            className={cn(
              "px-3 py-3 rounded-xl border",
              theme.gradientFrom,
              theme.gradientTo,
              theme.borderGradient,
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  theme.avatarGradient,
                )}
              >
                <span className="text-sm font-semibold text-white">
                  {(user.user_metadata?.full_name || user.email?.split("@")[0] || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={config.settingsRoute}
                onClick={handleLinkClick}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium text-gray-200 hover:text-white rounded-lg transition-all flex items-center justify-center gap-1.5 border",
                  theme.settingsButton,
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  if (onClose) onClose();
                }}
                className="flex-1 px-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400">Invité</p>
                <p className="text-xs text-gray-500">Non connecté</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthModalOpen(true);
                if (onClose) onClose();
              }}
              className={cn(
                "w-full px-3 py-2.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg",
                theme.authButton,
                theme.authShadow,
              )}
            >
              Se connecter
            </button>
          </div>
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};
