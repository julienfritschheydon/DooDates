import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { guestEmailService } from "@/lib/guestEmailService";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Bannière d'avertissement pour les utilisateurs invités
 * Affiche un message encourageant la connexion pour la sauvegarde des données
 */
export const GuestWarningBanner: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const STORAGE_KEY = "doodates_hide_guest_warning";

  useEffect(() => {
    const isHidden = localStorage.getItem(STORAGE_KEY) === "true";
    if (isHidden) {
      setIsVisible(false);
      return;
    }

    if (!user) {
      // 1. Charger l'email
      guestEmailService.getGuestEmail().then((email) => {
        setHasEmail(!!email);
        setIsVisible(true);
      });

      // 2. Calculer le temps restant (basé sur 365 jours de rétention)
      const firstSeen = localStorage.getItem("doodates_guest_first_seen");
      if (firstSeen) {
        const firstSeenDate = new Date(firstSeen);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - firstSeenDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, 365 - diffDays));
      } else {
        localStorage.setItem("doodates_guest_first_seen", new Date().toISOString());
        setDaysRemaining(365);
      }
    } else {
      setIsVisible(false);
    }
  }, [user, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!isVisible || user) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#1e1e1e] border border-orange-900/40 rounded-xl shadow-2xl p-5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -z-10" />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1" id="banner-title">
              Mode Invité : Données Temporelles
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {hasEmail
                ? `Vos données sont protégées. Suppression automatique prévue dans ${daysRemaining ?? 365} jours. Connectez-vous pour une sauvegarde permanente.`
                : `Pas d'email renseigné. Vos données seront supprimées dans ${daysRemaining ?? 365} jours sans préavis.`}
            </p>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 h-8 font-medium"
                onClick={() => (window.location.href = "/auth/signup")}
              >
                Créer un compte
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <button
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                onClick={handleClose}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
