import type { ConditionalRule } from "../types/conditionalRules";

/**
 * Évalue une règle conditionnelle
 *
 * @param rule Règle à évaluer
 * @param answers Réponses actuelles {questionId: value(s)}
 * @returns true si la condition est remplie
 */
export function evaluateRule(
  rule: ConditionalRule,
  answers: Record<string, string | string[]>,
): boolean {
  const answer = answers[rule.dependsOn];

  switch (rule.showIf.operator) {
    case "equals": {
      if (!rule.showIf.value) return false;
      const expectedValue = Array.isArray(rule.showIf.value)
        ? rule.showIf.value[0]
        : rule.showIf.value;

      if (Array.isArray(answer)) {
        // Pour choix multiple, vérifier si la valeur est dans le tableau
        return answer.some(
          (a) =>
            typeof a === "string" &&
            typeof expectedValue === "string" &&
            a.trim().toLowerCase() === expectedValue.trim().toLowerCase(),
        );
      }
      // Comparaison case-insensitive et sans espaces inutiles
      return (
        typeof answer === "string" &&
        typeof expectedValue === "string" &&
        answer.trim().toLowerCase() === expectedValue.trim().toLowerCase()
      );
    }

    case "contains": {
      if (!rule.showIf.value) return false;
      const searchText = Array.isArray(rule.showIf.value)
        ? rule.showIf.value[0]
        : rule.showIf.value;

      if (Array.isArray(answer)) {
        // Pour choix multiple, vérifier si au moins une réponse contient le texte recherché
        return answer.some(
          (ans) =>
            typeof ans === "string" &&
            typeof searchText === "string" &&
            ans.toLowerCase().includes(searchText.toLowerCase()),
        );
      }
      // Pour choix unique ou texte, vérifier si la réponse contient le texte recherché
      return (
        typeof answer === "string" &&
        typeof searchText === "string" &&
        answer.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    case "notEquals": {
      if (!rule.showIf.value) return false;
      const expectedValue = Array.isArray(rule.showIf.value)
        ? rule.showIf.value[0]
        : rule.showIf.value;

      if (Array.isArray(answer)) {
        return !answer.some(
          (a) =>
            typeof a === "string" &&
            typeof expectedValue === "string" &&
            a.trim().toLowerCase() === expectedValue.trim().toLowerCase(),
        );
      }
      return !(
        typeof answer === "string" &&
        typeof expectedValue === "string" &&
        answer.trim().toLowerCase() === expectedValue.trim().toLowerCase()
      );
    }

    case "isEmpty": {
      if (!answer) return true;
      if (Array.isArray(answer)) return answer.length === 0;
      return answer === "";
    }

    case "isNotEmpty": {
      if (!answer) return false;
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== "";
    }

    default:
      return false;
  }
}

/**
 * Détermine si une question doit être affichée
 *
 * @param questionId ID de la question à évaluer
 * @param rules Règles conditionnelles
 * @param answers Réponses actuelles
 * @returns true si la question doit être affichée
 */
export function shouldShowQuestion(
  questionId: string,
  rules: ConditionalRule[],
  answers: Record<string, string | string[]>,
): boolean {
  // Trouver les règles pour cette question
  const questionRules = rules.filter((r) => r.questionId === questionId);

  // Si pas de règle, la question s'affiche toujours
  if (questionRules.length === 0) {
    return true;
  }

  // Toutes les règles doivent être vraies (AND logique)
  return questionRules.every((rule) => evaluateRule(rule, answers));
}

/**
 * Obtient la liste des questions visibles basée sur les réponses actuelles
 *
 * @param questions Liste de toutes les questions
 * @param rules Règles conditionnelles
 * @param answers Réponses actuelles
 * @returns IDs des questions visibles
 */
export function getVisibleQuestionIds(
  questions: Array<{ id: string }>,
  rules: ConditionalRule[],
  answers: Record<string, string | string[]>,
): string[] {
  return questions
    .filter((q) => shouldShowQuestion(q.id, rules, answers))
    .map((q) => q.id);
}

/**
 * Nettoie les réponses des questions masquées
 * (pour éviter de soumettre des réponses à des questions qui ne sont plus visibles)
 *
 * @param answers Réponses actuelles
 * @param visibleQuestionIds IDs des questions visibles
 * @returns Réponses nettoyées
 */
export function cleanHiddenAnswers(
  answers: Record<string, string | string[]>,
  visibleQuestionIds: string[],
): Record<string, string | string[]> {
  const cleaned: Record<string, string | string[]> = {};

  for (const questionId of visibleQuestionIds) {
    if (answers[questionId]) {
      cleaned[questionId] = answers[questionId];
    }
  }

  return cleaned;
}
