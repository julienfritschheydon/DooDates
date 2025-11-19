import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Page de création de formulaire
 * Redirige vers /create/ai?type=form pour utiliser l'expérience IA existante
 */
export default function FormCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  useEffect(() => {
    // Rediriger vers l'expérience IA avec le type form
    const newUrl = editId ? `/create/ai?type=form&edit=${editId}` : `/create/ai?type=form`;
    navigate(newUrl, { replace: true });
  }, [navigate, editId]);

  return null;
}
