// Types partagés pour les suggestions de sondages
// Ce fichier centralise les définitions de types utilisées dans toute l'application

// Alias pour la compatibilité avec le code existant
export type AnyFormQuestion = FormQuestion;

export type QuestionType = 
  | 'text' 
  | 'multiple' 
  | 'single' 
  | 'long-text' 
  | 'rating' 
  | 'nps' 
  | 'matrix'
  | 'date';  // Ajout du type 'date' pour la compatibilité

export interface FormQuestion {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'long-text' | 'rating' | 'nps' | 'matrix' | 'date';
  text: string;
  title: string;
  required: boolean;
  options?: string[];
  maxChoices?: number;
  placeholder?: string;
  maxLength?: number;
  ratingScale?: number;
  ratingStyle?: 'numbers' | 'stars' | 'emojis';
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: 'email' | 'phone' | 'url' | 'number' | 'date';
  matrixRows?: Array<{ id: string; label: string }>;
  matrixColumns?: Array<{ id: string; label: string }>;
  matrixType?: 'single' | 'multiple';
  matrixColumnsNumeric?: boolean;
  selectedDates?: string[];
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  timeGranularity?: '15min' | '30min' | '1h';
  allowMaybeVotes?: boolean;
  allowAnonymousVotes?: boolean;
}

export interface FormPollSuggestion {
  title: string;
  description?: string;
  questions: FormQuestion[];
  type: 'form';
  conditionalRules?: any[]; // TODO: Définir un type plus précis
}

export interface DatePollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[];
  }>;
  dateGroups?: Array<{
    dates: string[];
    label: string;
    type: 'custom' | 'weekend' | 'week' | 'fortnight' | 'range';
  }>;
  type: 'date' | 'datetime' | 'custom';
  participants?: string[];
}

export type PollSuggestion = FormPollSuggestion | DatePollSuggestion;

export interface GeminiResponse {
  success: boolean;
  data?: PollSuggestion;
  message: string;
  error?: string;
}

// Type guard pour vérifier si une suggestion est un formulaire
export function isFormPollSuggestion(suggestion: PollSuggestion): suggestion is FormPollSuggestion {
  return suggestion.type === 'form';
}

// Type guard pour vérifier si une suggestion est un sondage de dates
export function isDatePollSuggestion(suggestion: PollSuggestion): suggestion is DatePollSuggestion {
  return suggestion.type === 'date' || suggestion.type === 'datetime' || suggestion.type === 'custom';
}
