import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Page de création de sondage de dates
 * Redirige vers /create/ai?type=date pour utiliser l'expérience IA existante
 */
export default function DateCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  useEffect(() => {
    // Rediriger vers l'expérience IA avec le type date
    const newUrl = editId ? `/create/ai?type=date&edit=${editId}` : `/create/ai?type=date`;
    navigate(newUrl, { replace: true });
  }, [navigate, editId]);

  return null;
}
