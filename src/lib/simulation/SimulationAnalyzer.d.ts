/**
 * SimulationAnalyzer - Analyse des résultats et détection de problèmes
 *
 * Analyse les réponses simulées pour détecter les problèmes potentiels
 * dans le questionnaire (biais, abandon, questions complexes, etc.)
 */
import type { SimulationResult } from "../../types/simulation";
/**
 * Analyse les résultats de simulation et détecte les problèmes
 */
export declare function analyzeSimulation(result: SimulationResult, questions?: Array<{
    id: string;
    type: string;
    title: string;
    required?: boolean;
    options?: Array<{
        id: string;
        label: string;
    }>;
    matrixRows?: Array<{
        id: string;
        label: string;
    }>;
}>): Promise<SimulationResult>;
