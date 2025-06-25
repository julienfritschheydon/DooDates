import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    console.log("🔄 Début de la déconnexion...");

    try {
      // Timeout pour éviter les blocages
      const signOutPromise = signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout déconnexion")), 5000),
      );

      const { error } = (await Promise.race([
        signOutPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("❌ Erreur de déconnexion:", error);
        // Forcer la déconnexion locale même en cas d'erreur
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
      } else {
        console.log("✅ Déconnexion réussie");
        // Nettoyer le stockage local
        localStorage.clear();
        sessionStorage.clear();
        // Redirection après déconnexion
        window.location.href = "/";
      }
    } catch (err) {
      console.error("❌ Erreur lors de la déconnexion:", err);
      console.log("🔄 Forçage de la déconnexion locale...");

      // En cas d'erreur, forcer la déconnexion côté client
      localStorage.clear();
      sessionStorage.clear();

      // Redirection forcée
      window.location.href = "/";
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        <User className="w-4 h-4 text-gray-600" />
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {user.user_metadata?.full_name || user.email}
          </div>
          <div className="text-gray-600">{user.email}</div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-1"
      >
        <LogOut className="w-3 h-3" />
        Déconnexion
      </Button>
    </div>
  );
}
