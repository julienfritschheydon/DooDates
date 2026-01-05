import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, X, Loader2 } from "lucide-react";
import { usePollExistence } from "@/hooks/usePollExistence";

interface PollLinkProps {
  pollId: string;
  pollType?: "date" | "form" | "quizz" | "availability";
}

/**
 * Composant pour afficher un lien intelligent vers un sondage
 * - Affiche un loader pendant la vérification
 * - Affiche un lien cliquable si le sondage existe
 * - Affiche un badge "Supprimé" si le sondage n'existe plus
 */
export function PollLink({ pollId, pollType }: PollLinkProps) {
  const { exists, poll } = usePollExistence(pollId);
  const navigate = useNavigate();

  if (exists === null) {
    return (
      <span className="text-gray-400 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Vérification...
      </span>
    );
  }

  if (!exists) {
    return (
      <span className="text-gray-500 flex items-center gap-1">
        <X className="w-3 h-3" />
        Sondage supprimé
      </span>
    );
  }

  const getRoute = () => {
    const baseType = pollType || poll?.type || "date";

    // Utiliser le slug du poll si disponible, sinon utiliser pollId directement
    // (pollId peut être soit un ID soit un slug)
    const identifier = poll?.slug || pollId;

    // Les date polls utilisent /poll/:slug/results (sans préfixe date-polls)
    // Les autres types utilisent /:type-polls/:slug/results
    if (baseType === "date") {
      return `/poll/${identifier}/results`;
    }

    const productType =
      baseType === "form"
        ? "form-polls"
        : baseType === "quizz"
          ? "quizz-polls"
          : "availability-polls";

    return `/${productType}/${identifier}/results`;
  };

  return (
    <button
      onClick={() => navigate(getRoute())}
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 text-sm"
     data-testid="polllink-navigate">
      <ExternalLink className="w-3 h-3" />
      Voir le sondage
    </button>
  );
}
