import type { ConditionalRule } from "../types/conditionalRules";
/**
 * Évalue une règle conditionnelle
 *
 * @param rule Règle à évaluer
 * @param answers Réponses actuelles {questionId: value(s)}
 * @returns true si la condition est remplie
 */
export declare function evaluateRule(
  rule: ConditionalRule,
  answers: Record<string, string | string[]>,
): boolean;
/**
 * Détermine si une question doit être affichée
 *
 * @param questionId ID de la question à évaluer
 * @param rules Règles conditionnelles
 * @param answers Réponses actuelles
 * @returns true si la question doit être affichée
 */
export declare function shouldShowQuestion(
  questionId: string,
  rules: ConditionalRule[],
  answers: Record<string, string | string[]>,
): boolean;
/**
 * Obtient la liste des questions visibles basée sur les réponses actuelles
 *
 * @param questions Liste de toutes les questions
 * @param rules Règles conditionnelles
 * @param answers Réponses actuelles
 * @returns IDs des questions visibles
 */
export declare function getVisibleQuestionIds(
  questions: Array<{
    id: string;
  }>,
  rules: ConditionalRule[],
  answers: Record<string, string | string[]>,
): string[];
/**
 * Nettoie les réponses des questions masquées
 * (pour éviter de soumettre des réponses à des questions qui ne sont plus visibles)
 *
 * @param answers Réponses actuelles
 * @param visibleQuestionIds IDs des questions visibles
 * @returns Réponses nettoyées
 */
export declare function cleanHiddenAnswers(
  answers: Record<string, string | string[]>,
  visibleQuestionIds: string[],
): Record<string, string | string[]>;
