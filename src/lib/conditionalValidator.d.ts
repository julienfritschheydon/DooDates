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
export declare function hasCircularDependency(rules: ConditionalRule[], questionId: string, visited?: Set<string>): boolean;
/**
 * Vérifie qu'une question conditionnelle dépend d'une question qui la précède
 * (une question ne peut pas dépendre d'une question suivante)
 *
 * @param rules Règles conditionnelles
 * @param questions Liste des questions dans l'ordre
 * @param questionId ID de la question à vérifier
 * @returns true si la question dépend d'une question précédente (valide)
 */
export declare function dependsOnPreviousQuestion(rules: ConditionalRule[], questions: Array<{
    id: string;
}>, questionId: string): boolean;
/**
 * Vérifie qu'une valeur existe dans les options d'une question
 *
 * @param questionId ID de la question
 * @param value Valeur à vérifier
 * @param questions Liste des questions avec leurs options
 * @returns true si la valeur existe dans les options
 */
export declare function valueExistsInOptions(questionId: string, value: string, questions: Array<{
    id: string;
    options?: Array<{
        label: string;
    }>;
}>): boolean;
/**
 * Vérifie qu'une valeur est contenue dans au moins une option (correspondance partielle)
 *
 * @param questionId ID de la question
 * @param value Valeur à vérifier (peut être partielle)
 * @param questions Liste des questions avec leurs options
 * @returns true si la valeur est contenue dans au moins une option
 */
export declare function valueContainedInOptions(questionId: string, value: string, questions: Array<{
    id: string;
    options?: Array<{
        label: string;
    }>;
}>): boolean;
/**
 * Valide toutes les règles conditionnelles d'un formulaire
 *
 * @param rules Règles conditionnelles
 * @param questions Questions du formulaire
 * @returns Tableau des erreurs de validation
 */
export declare function validateConditionalRules(rules: ConditionalRule[], questions: Array<{
    id: string;
    title: string;
    options?: Array<{
        label: string;
    }>;
}>): string[];
