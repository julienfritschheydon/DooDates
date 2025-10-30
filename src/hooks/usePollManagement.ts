/**
 * Hook de gestion de l'affichage et de la conversion des créateurs de polls.
 * 
 * Gère l'état d'affichage du PollCreator (Date ou Form) et la conversion
 * des suggestions Gemini en formats utilisables par les créateurs.
 * 
 * @example
 * ```tsx
 * const pollManagement = usePollManagement();
 * 
 * // Ouvrir le créateur avec une suggestion
 * pollManagement.openPollCreator(geminiSuggestion);
 * 
 * // Vérifier le type
 * if (pollManagement.isFormPoll) {
 *   const draft = pollManagement.getFormDraft();
 * }
 * 
 * // Fermer le créateur
 * pollManagement.closePollCreator();
 * ```
 * 
 * @module hooks/usePollManagement
 */

import { useState, useCallback } from "react";
import type { PollSuggestion, FormPollSuggestion } from "../lib/gemini";
import type { FormPollDraft, AnyFormQuestion } from "../components/polls/FormPollCreator";

/**
 * Convertit une suggestion Gemini de Form Poll en draft utilisable par FormPollCreator.
 * 
 * @param suggestion - Suggestion Gemini à convertir
 * @returns Draft formaté pour FormPollCreator
 */
const convertFormSuggestionToDraft = (suggestion: FormPollSuggestion): FormPollDraft => {
  const uid = () => Math.random().toString(36).slice(2, 10);

  const questions: AnyFormQuestion[] = suggestion.questions.map((q) => {
    const baseQuestion = {
      id: uid(),
      title: q.text,
      required: q.required || false,
    };

    switch (q.type) {
      case "single":
        return {
          ...baseQuestion,
          type: "single" as const,
          options: (q.options || []).map((opt) => ({ id: uid(), label: opt })),
        };
      case "multiple":
        return {
          ...baseQuestion,
          type: "multiple" as const,
          options: (q.options || []).map((opt) => ({ id: uid(), label: opt })),
        };
      case "text":
        return {
          ...baseQuestion,
          type: "text" as const,
        };
      default:
        return {
          ...baseQuestion,
          type: "text" as const,
        };
    }
  });

  return {
    id: uid(),
    type: "form" as const,
    title: suggestion.title || "Nouveau questionnaire",
    questions,
  };
};

/**
 * Hook de gestion des créateurs de polls (Date et Form).
 * 
 * @returns Objet avec état et fonctions de gestion
 * @returns {boolean} showPollCreator - Indique si le créateur est affiché
 * @returns {PollSuggestion | null} selectedPollData - Données du poll sélectionné
 * @returns {boolean} isFormPoll - True si c'est un Form Poll
 * @returns {Function} openPollCreator - Ouvre le créateur avec des données
 * @returns {Function} closePollCreator - Ferme le créateur
 * @returns {Function} getFormDraft - Récupère le draft Form converti
 */
export function usePollManagement() {
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedPollData, setSelectedPollData] = useState<PollSuggestion | null>(null);

  /**
   * Ouvre le créateur de poll avec les données fournies.
   * 
   * @param pollData - Suggestion de poll à afficher
   */
  const openPollCreator = useCallback((pollData: PollSuggestion) => {
    console.log("🔍 Opening poll creator with data:", pollData);
    setSelectedPollData(pollData);
    setShowPollCreator(true);
  }, []);

  const closePollCreator = useCallback(() => {
    setShowPollCreator(false);
    setSelectedPollData(null);
  }, []);

  const getFormDraft = useCallback((): FormPollDraft | null => {
    if (!selectedPollData || selectedPollData.type !== "form") {
      return null;
    }
    return convertFormSuggestionToDraft(selectedPollData as FormPollSuggestion);
  }, [selectedPollData]);

  return {
    showPollCreator,
    selectedPollData,
    openPollCreator,
    closePollCreator,
    getFormDraft,
    isFormPoll: selectedPollData?.type === "form",
  };
}
