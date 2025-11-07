/**
 * SimulationComparison - Comparaison Simulation vs Réalité
 *
 * Compare les résultats de simulation avec les vraies réponses
 * pour mesurer la précision et améliorer les personas.
 */
import type { SimulationResult, SimulationMetrics } from "../../types/simulation";
export interface SimulationComparison {
    /** ID unique de la comparaison */
    id: string;
    /** ID du poll */
    pollId: string;
    /** ID de la simulation comparée */
    simulationId: string;
    /** Date de comparaison */
    comparedAt: string;
    /** Métriques prédites (simulation) */
    predicted: SimulationMetrics;
    /** Métriques réelles */
    actual: SimulationMetrics;
    /** Scores de précision */
    accuracy: {
        /** Précision taux de complétion (0-100) */
        completionRate: number;
        /** Précision temps total (0-100) */
        totalTime: number;
        /** Précision taux d'abandon (0-100) */
        dropoffRate: number;
        /** Score global de précision (0-100) */
        overall: number;
    };
}
/**
 * Récupère toutes les comparaisons
 */
export declare function getAllComparisons(): SimulationComparison[];
/**
 * Récupère la comparaison pour un poll
 */
export declare function getComparisonByPollId(pollId: string): SimulationComparison | null;
/**
 * Compare une simulation avec les résultats réels
 */
export declare function compareSimulationWithReality(pollId: string, simulation: SimulationResult): SimulationComparison;
/**
 * Récupère la dernière simulation pour un poll
 */
export declare function getLastSimulation(pollId: string): SimulationResult | null;
