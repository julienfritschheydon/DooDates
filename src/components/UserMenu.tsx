import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { logger } from "@/lib/logger";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    logger.info("Début de la déconnexion", "auth");

    try {
      // Timeout pour éviter les blocages
      const signOutPromise = signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout déconnexion")), 5000),
      );

      const result = (await Promise.race([signOutPromise, timeoutPromise])) as { error?: Error | null };
      const { error } = result || { error: null };

      if (error) {
        logger.error("Erreur de déconnexion", "auth", error);
        // Forcer la déconnexion locale même en cas d'erreur
        localStorage.clear();
        sessionStorage.clear();
        // 🔧 FIX BUG #2: Utiliser BASE_URL pour GitHub Pages
        window.location.href = import.meta.env.BASE_URL || "/";
      } else {
        logger.info("Déconnexion réussie", "auth");
        // Nettoyer le stockage local
        localStorage.clear();
        sessionStorage.clear();
        // Redirection après déconnexion
        // 🔧 FIX BUG #2: Utiliser BASE_URL pour GitHub Pages
        window.location.href = import.meta.env.BASE_URL || "/";
      }
    } catch (err) {
      logger.error("Erreur lors de la déconnexion", "auth", err);
      logger.warn("Forçage de la déconnexion locale", "auth");

      // En cas d'erreur, forcer la déconnexion côté client
      localStorage.clear();
      sessionStorage.clear();

      // Redirection forcée
      // 🔧 FIX BUG #2: Utiliser BASE_URL pour GitHub Pages
      window.location.href = import.meta.env.BASE_URL || "/";
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg max-w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <div className="text-sm min-w-0 flex-1">
          <div className="font-medium text-gray-900 truncate">
            {user.user_metadata?.full_name || user.email}
          </div>
          <div className="text-gray-600 truncate">{user.email}</div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-1 flex-shrink-0 text-xs px-2 py-1"
      >
        <LogOut className="w-3 h-3" />
        <span className="hidden sm:inline">Déconnexion</span>
        <span className="sm:hidden">↗</span>
      </Button>
    </div>
  );
}
