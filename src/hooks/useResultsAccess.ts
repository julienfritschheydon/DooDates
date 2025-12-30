import { useAuth } from "@/contexts/AuthContext";
import { Poll } from "@/lib/pollStorage";

export type ResultsAccessStatus =
  | { allowed: true }
  | { allowed: false; reason: "not-creator" | "not-voted" | "restricted"; message: string };

/**
 * Hook pour vérifier l'accès aux résultats d'un sondage
 * Basé sur le paramètre `resultsVisibility` dans les settings
 */
export function useResultsAccess(
  poll: Poll | null,
  hasVoted: boolean = false,
): ResultsAccessStatus {
  const { user } = useAuth();

  if (!poll) {
    return { allowed: true }; // Pas de poll = pas de restriction (loading state)
  }

  // Récupérer la visibilité des résultats (défaut: public)
  const visibility =
    (poll.settings as { resultsVisibility?: string })?.resultsVisibility || "public";

  // Mode "Public" : tout le monde peut voir
  if (visibility === "public") {
    return { allowed: true };
  }

  // Vérifier si l'utilisateur est le créateur
  const isCreator = user?.id === poll.creator_id;

  // Mode "Créateur uniquement"
  if (visibility === "creator-only") {
    if (!user) {
      return {
        allowed: false,
        reason: "restricted",
        message:
          "Seul le créateur peut voir les résultats. Connectez-vous si vous êtes le créateur.",
      };
    }
    if (!isCreator) {
      return {
        allowed: false,
        reason: "not-creator",
        message: "Seul le créateur de ce sondage peut voir les résultats.",
      };
    }
    return { allowed: true };
  }

  // Mode "Participants après vote"
  if (visibility === "voters") {
    // Le créateur peut toujours voir
    if (isCreator) {
      return { allowed: true };
    }

    // Les autres doivent avoir voté
    if (!hasVoted) {
      return {
        allowed: false,
        reason: "not-voted",
        message: "Vous devez voter pour voir les résultats de ce sondage.",
      };
    }

    return { allowed: true };
  }

  // Fallback: autoriser l'accès par défaut
  return { allowed: true };
}
