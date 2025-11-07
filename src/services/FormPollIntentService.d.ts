/**
 * Form Poll Intent Detection Service
 *
 * Détecte les intentions de modification pour les FormPolls :
 * - Ajouter/supprimer des questions
 * - Modifier les options
 * - Changer le type de question
 * - Rendre une question requise/optionnelle
 */
import type { Poll } from "../lib/pollStorage";
import type { FormPollAction } from "@/reducers/formPollReducer";
export interface FormModificationIntent {
  isModification: boolean;
  action: FormPollAction["type"];
  payload: unknown;
  confidence: number;
  explanation?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  modifiedQuestionId?: string;
}
/**
 * Service de détection d'intentions pour Form Polls
 */
export declare class FormPollIntentService {
  /**
   * Détecte si le message contient une intention de modification de Form Poll
   */
  static detectIntent(message: string, currentPoll: Poll | null): FormModificationIntent | null;
}
