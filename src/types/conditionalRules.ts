/**
 * Types pour les questions conditionnelles dans les Form Polls
 * Permet d'afficher/masquer des questions basé sur les réponses précédentes
 */

export type ConditionalOperator = "equals" | "contains" | "notEquals" | "isEmpty" | "isNotEmpty";

export interface ConditionalRule {
  /**
   * ID de la question à afficher/masquer
   */
  questionId: string;

  /**
   * ID de la question dont dépend cette règle
   */
  dependsOn: string;

  /**
   * Condition d'affichage
   */
  showIf: {
    operator: ConditionalOperator;
    /**
     * Valeur(s) attendue(s) pour la condition
     * - Pour "equals": une seule valeur (string)
     * - Pour "contains": une ou plusieurs valeurs (string[])
     * - Pour "isEmpty"/"isNotEmpty": undefined
     */
    value?: string | string[];
  };
}

/**
 * Validation des règles conditionnelles
 */
export interface ConditionalValidation {
  /**
   * Vérifie qu'il n'y a pas de dépendances circulaires
   * Exemple: Q1 → Q2 → Q1 (invalide)
   */
  hasCircularDependency: (rules: ConditionalRule[], questionId: string) => boolean;

  /**
   * Vérifie qu'une question dépend d'une question qui la précède
   */
  dependsOnPreviousQuestion: (
    rules: ConditionalRule[],
    questions: Array<{ id: string }>,
    questionId: string
  ) => boolean;

  /**
   * Vérifie qu'une valeur existe dans les options de la question
   */
  valueExistsInOptions: (
    questionId: string,
    value: string,
    questions: Array<{ id: string; options?: Array<{ label: string }> }>
  ) => boolean;
}

/**
 * Évaluation runtime des règles conditionnelles
 */
export interface ConditionalEvaluator {
  /**
   * Évalue si une question doit être affichée
   * @param questionId ID de la question à évaluer
   * @param rules Règles conditionnelles
   * @param answers Réponses actuelles {questionId: value(s)}
   * @returns true si la question doit être affichée
   */
  shouldShowQuestion: (
    questionId: string,
    rules: ConditionalRule[],
    answers: Record<string, string | string[]>
  ) => boolean;

  /**
   * Évalue une règle spécifique
   */
  evaluateRule: (
    rule: ConditionalRule,
    answers: Record<string, string | string[]>
  ) => boolean;
}
