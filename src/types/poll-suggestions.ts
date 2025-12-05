// Types partagés pour les suggestions de sondages
// Ce fichier centralise les définitions de types utilisées dans toute l'application
// SOURCE DE VÉRITÉ : Les types sont définis dans les services et ré-exportés ici

// Re-export from services (single source of truth)
export type {
  FormQuestion,
  FormPollSuggestion,
} from "../lib/ai/products/form/FormPollService";

export type { DatePollSuggestion } from "../lib/ai/products/date/DatePollService";

// Alias pour la compatibilité avec le code existant
import type { FormQuestion as FormQuestionType } from "../lib/ai/products/form/FormPollService";
export type AnyFormQuestion = FormQuestionType;

export type QuestionType =
  | "text"
  | "multiple"
  | "single"
  | "long-text"
  | "rating"
  | "nps"
  | "matrix"
  | "date";

// Import des types pour construire PollSuggestion
import type { FormPollSuggestion } from "../lib/ai/products/form/FormPollService";
import type { DatePollSuggestion } from "../lib/ai/products/date/DatePollService";

export type PollSuggestion = FormPollSuggestion | DatePollSuggestion;

export interface GeminiResponse {
  success: boolean;
  data?: PollSuggestion;
  message: string;
  error?: string;
}

// Type guard pour vérifier si une suggestion est un formulaire
export function isFormPollSuggestion(suggestion: PollSuggestion): suggestion is FormPollSuggestion {
  return suggestion.type === "form";
}

// Type guard pour vérifier si une suggestion est un sondage de dates
export function isDatePollSuggestion(suggestion: PollSuggestion): suggestion is DatePollSuggestion {
  return (
    suggestion.type === "date" || suggestion.type === "datetime" || suggestion.type === "custom"
  );
}
