import { useLocation } from "react-router-dom";
import { AICreationWorkspace } from "@/components/prototype/AICreationWorkspace";

/**
 * Page Workspace
 *
 * Nouvelle page pour l'UX IA-First
 * Chat principal + Éditeur conditionnel avec état partagé
 * ConversationProvider est maintenant au niveau App.tsx
 *
 * Gère les routes typées :
 * - /workspace → type déterminé par IA
 * - /workspace/date → type=date
 * - /workspace/form → type=form
 * - /workspace/availability → type=availability
 */
export default function WorkspacePage() {
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const typeFromPath = pathParts[2] || null; // /workspace/date → "date"

  // Extraire le type de l'URL ou des paramètres de recherche
  const searchParams = new URLSearchParams(location.search);
  const typeFromQuery = searchParams.get("type");

  // Priorité : type depuis le path > type depuis query > null (déterminé par IA)
  const pollType = typeFromPath || typeFromQuery || null;

  return (
    <AICreationWorkspace pollTypeFromUrl={pollType as "date" | "form" | "availability" | null} />
  );
}
