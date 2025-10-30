import type { ConditionalRule } from "../types/conditionalRules";

/**
 * Détecte les dépendances circulaires dans les règles conditionnelles
 * Exemple: Q1 → Q2 → Q3 → Q1 (invalide)
 *
 * @param rules Règles conditionnelles
 * @param questionId ID de la question à vérifier
 * @param visited Questions déjà visitées (pour détecter les boucles)
 * @returns true si une dépendance circulaire est détectée
 */
export function hasCircularDependency(
  rules: ConditionalRule[],
  questionId: string,
  visited: Set<string> = new Set(),
): boolean {
  // Si la question est déjà visitée, on a une boucle
  if (visited.has(questionId)) {
    return true;
  }

  // Trouver les règles où cette question est la dépendance
  const dependentRules = rules.filter((r) => r.questionId === questionId);

  if (dependentRules.length === 0) {
    // Pas de dépendance, pas de boucle
    return false;
  }

  // Marquer comme visitée
  const newVisited = new Set(visited);
  newVisited.add(questionId);

  // Vérifier récursivement chaque dépendance
  for (const rule of dependentRules) {
    if (hasCircularDependency(rules, rule.dependsOn, newVisited)) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie qu'une question conditionnelle dépend d'une question qui la précède
 * (une question ne peut pas dépendre d'une question suivante)
 *
 * @param rules Règles conditionnelles
 * @param questions Liste des questions dans l'ordre
 * @param questionId ID de la question à vérifier
 * @returns true si la question dépend d'une question précédente (valide)
 */
export function dependsOnPreviousQuestion(
  rules: ConditionalRule[],
  questions: Array<{ id: string }>,
  questionId: string,
): boolean {
  const questionIndex = questions.findIndex((q) => q.id === questionId);
  if (questionIndex === -1) return false;

  const rule = rules.find((r) => r.questionId === questionId);
  if (!rule) return true; // Pas de règle = pas de problème

  const dependsOnIndex = questions.findIndex((q) => q.id === rule.dependsOn);
  if (dependsOnIndex === -1) return false;

  // La question dépendante doit être AVANT la question conditionnelle
  return dependsOnIndex < questionIndex;
}

/**
 * Vérifie qu'une valeur existe dans les options d'une question
 *
 * @param questionId ID de la question
 * @param value Valeur à vérifier
 * @param questions Liste des questions avec leurs options
 * @returns true si la valeur existe dans les options
 */
export function valueExistsInOptions(
  questionId: string,
  value: string,
  questions: Array<{ id: string; options?: Array<{ label: string }> }>,
): boolean {
  const question = questions.find((q) => q.id === questionId);
  if (!question || !question.options) return false;

  return question.options.some((opt) => opt.label === value);
}

/**
 * Vérifie qu'une valeur est contenue dans au moins une option (correspondance partielle)
 *
 * @param questionId ID de la question
 * @param value Valeur à vérifier (peut être partielle)
 * @param questions Liste des questions avec leurs options
 * @returns true si la valeur est contenue dans au moins une option
 */
export function valueContainedInOptions(
  questionId: string,
  value: string,
  questions: Array<{ id: string; options?: Array<{ label: string }> }>,
): boolean {
  const question = questions.find((q) => q.id === questionId);
  if (!question || !question.options) return true; // Pour texte libre, pas de validation

  // Vérifier si au moins une option contient la valeur recherchée
  return question.options.some((opt) => opt.label.toLowerCase().includes(value.toLowerCase()));
}

/**
 * Valide toutes les règles conditionnelles d'un formulaire
 *
 * @param rules Règles conditionnelles
 * @param questions Questions du formulaire
 * @returns Tableau des erreurs de validation
 */
export function validateConditionalRules(
  rules: ConditionalRule[],
  questions: Array<{
    id: string;
    title: string;
    options?: Array<{ label: string }>;
  }>,
): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    const question = questions.find((q) => q.id === rule.questionId);
    const dependsOnQuestion = questions.find((q) => q.id === rule.dependsOn);

    if (!question) {
      errors.push(`Règle invalide : question ${rule.questionId} introuvable`);
      continue;
    }

    if (!dependsOnQuestion) {
      errors.push(`Règle "${question.title}" : question dépendante ${rule.dependsOn} introuvable`);
      continue;
    }

    // Vérifier dépendance circulaire
    if (hasCircularDependency(rules, rule.questionId)) {
      errors.push(`Règle "${question.title}" : dépendance circulaire détectée`);
    }

    // Vérifier que la dépendance est avant
    if (!dependsOnPreviousQuestion(rules, questions, rule.questionId)) {
      errors.push(`Règle "${question.title}" : doit dépendre d'une question précédente`);
    }

    // Vérifier que les valeurs existent
    if (rule.showIf.operator === "equals" && rule.showIf.value) {
      const value = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
      if (!valueExistsInOptions(rule.dependsOn, value, questions)) {
        errors.push(
          `Règle "${question.title}" : valeur "${value}" introuvable dans "${dependsOnQuestion.title}"`,
        );
      }
    }

    if (rule.showIf.operator === "notEquals" && rule.showIf.value) {
      const value = Array.isArray(rule.showIf.value) ? rule.showIf.value[0] : rule.showIf.value;
      if (!valueExistsInOptions(rule.dependsOn, value, questions)) {
        errors.push(
          `Règle "${question.title}" : valeur "${value}" introuvable dans "${dependsOnQuestion.title}"`,
        );
      }
    }

    if (rule.showIf.operator === "contains" && rule.showIf.value) {
      const values = Array.isArray(rule.showIf.value) ? rule.showIf.value : [rule.showIf.value];
      for (const value of values) {
        // Pour "contains", vérifier correspondance partielle
        if (!valueContainedInOptions(rule.dependsOn, value, questions)) {
          errors.push(
            `Règle "${question.title}" : aucune option ne contient "${value}" dans "${dependsOnQuestion.title}"`,
          );
        }
      }
    }
  }

  return errors;
}
