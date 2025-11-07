/**
 * ContextDetectionService - Détection automatique du contexte du questionnaire
 */
import type { SimulationContext } from "../../types/simulation";
/**
 * Détecte le contexte d'un questionnaire
 */
export declare function detectContext(title: string, questions: Array<{
    title: string;
    type: string;
}>): SimulationContext;
