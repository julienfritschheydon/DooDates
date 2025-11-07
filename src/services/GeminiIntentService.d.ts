/**
 * Gemini Intent Service - Détection d'intentions via IA
 *
 * Utilisé comme fallback quand les patterns regex ne matchent pas.
 * Permet de gérer toutes les formulations naturelles.
 *
 * Réutilise EnhancedGeminiService pour éviter la duplication.
 */
import type { Poll } from "../lib/pollStorage";
import type { FormPollAction } from "@/reducers/formPollReducer";
export interface AIIntentResult {
  isModification: boolean;
  action: FormPollAction["type"] | null;
  payload: unknown;
  confidence: number;
  explanation?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  modifiedQuestionId?: string;
}
/**
 * Détecte l'intention de modification via Gemini
 */
export declare class GeminiIntentService {
  /**
   * Détecte l'intention pour un Form Poll
   */
  static detectFormIntent(userMessage: string, currentPoll: Poll): Promise<AIIntentResult | null>;
  /**
   * Construit le contexte du poll pour Gemini
   */
  private static buildPollContext;
  /**
   * Log un gap détecté pour améliorer les regex plus tard
   */
  static logMissingPattern(userMessage: string, detectedIntent: AIIntentResult): void;
}
