/**
 * Hook centralisé pour la création de formulaires
 * Utilisé par FormPollCreator (manuel) et EditorStateProvider (IA)
 */
import type { Poll } from "@/lib/pollStorage";
export interface FormQuestion {
  id: string;
  type: string;
  title: string;
  required?: boolean;
  options?: Array<{
    id: string;
    label: string;
    isOther?: boolean;
  }>;
  maxChoices?: number;
  placeholder?: string;
  maxLength?: number;
  matrixRows?: Array<{ id: string; label: string }>;
  matrixColumns?: Array<{ id: string; label: string }>;
  matrixType?: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
  ratingScale?: number;
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: "email" | "phone" | "url" | "number" | "date";
}
export interface CreateFormPollParams {
  title: string;
  description?: string;
  questions: FormQuestion[];
  settings?: {
    allowAnonymousResponses?: boolean;
    expiresAt?: string;
  };
}
export declare function useFormPollCreation(): {
  createFormPoll: (params: CreateFormPollParams) => Promise<{
    poll?: Poll;
    error?: string;
  }>;
};
