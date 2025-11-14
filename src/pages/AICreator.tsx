import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WorkspaceLayoutPrototype } from "@/components/prototype/WorkspaceLayoutPrototype";

/**
 * Page de création avec IA
 * Redirige vers le workspace IA avec le type de sondage spécifié dans l'URL
 */
export default function AICreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // "date" ou "form"

  useEffect(() => {
    // Si un type est spécifié, on peut l'utiliser pour pré-remplir le contexte
    // Pour l'instant, on redirige simplement vers le workspace
    // Le workspace gérera la création via le chat IA
  }, [type]);

  // Afficher le workspace IA directement
  return <WorkspaceLayoutPrototype />;
}
