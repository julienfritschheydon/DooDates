import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { SignInForm } from "../auth/SignInForm";
import { SignUpForm } from "../../pages/Auth";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({ open, onOpenChange, defaultMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Fermer automatiquement le modal après connexion réussie
  useEffect(() => {
    if (user && !loading && open) {
      // Petit délai pour laisser le temps à l'utilisateur de voir le succès
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, open, onOpenChange]);

  const handleAuthSuccess = () => {
    // Fermer le modal après authentification réussie
    onOpenChange(false);
    // La redirection sera gérée automatiquement par AuthContext via onAuthStateChange
    // Pas besoin de navigate() ici, le composant parent gérera la redirection
  };

  // Si l'utilisateur est déjà connecté, afficher un message
  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déjà connecté</DialogTitle>
            <DialogDescription>Vous êtes déjà connecté en tant que {user.email}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Si vous souhaitez vous déconnecter, utilisez le bouton de déconnexion dans le menu
              utilisateur.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "signin" ? "Connexion" : "Inscription"}</DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Connectez-vous à votre compte DooDates"
              : "Créez votre compte DooDates"}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {mode === "signin" ? (
            <SignInForm onSuccess={handleAuthSuccess} onSwitchToSignUp={() => setMode("signup")} />
          ) : (
            <SignUpForm onSuccess={handleAuthSuccess} onSwitchToSignIn={() => setMode("signin")} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
