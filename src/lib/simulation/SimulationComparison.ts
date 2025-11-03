/**
 * SimulationComparison - Comparaison Simulation vs Réalité
 *
 * Compare les résultats de simulation avec les vraies réponses
 * pour mesurer la précision et améliorer les personas.
 */

import { logger } from "../logger";
import { getFormResponses, getPollBySlugOrId } from "../pollStorage";
import type { SimulationResult, SimulationMetrics } from "../../types/simulation";

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// STOCKAGE
// ============================================================================

const STORAGE_KEY = "doodates_simulation_comparisons";

/**
 * Sauvegarde une comparaison
 */
function saveComparison(comparison: SimulationComparison): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const comparisons: SimulationComparison[] = stored ? JSON.parse(stored) : [];
    comparisons.push(comparison);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
    logger.info(`Comparison saved: ${comparison.id}`, "general");
  } catch (error) {
    logger.error("Failed to save comparison", "general", { error });
  }
}

/**
 * Récupère toutes les comparaisons
 */
export function getAllComparisons(): SimulationComparison[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error("Failed to load comparisons", "general", { error });
    return [];
  }
}

/**
 * Récupère la comparaison pour un poll
 */
export function getComparisonByPollId(pollId: string): SimulationComparison | null {
  const comparisons = getAllComparisons();
  return comparisons.find((c) => c.pollId === pollId) || null;
}

// ============================================================================
// CALCUL MÉTRIQUES RÉELLES
// ============================================================================

/**
 * Calcule les métriques réelles à partir des vraies réponses
 */
function calculateActualMetrics(pollId: string): SimulationMetrics {
  const poll = getPollBySlugOrId(pollId);
  const responses = getFormResponses(pollId);

  if (!poll || !responses || responses.length === 0) {
    return {
      totalResponses: 0,
      avgCompletionRate: 0,
      avgTotalTime: 0,
      dropoffRate: 1,
      questionMetrics: [],
    };
  }

  const totalQuestions = poll.questions?.length || 0;
  if (totalQuestions === 0) {
    return {
      totalResponses: responses.length,
      avgCompletionRate: 0,
      avgTotalTime: 0,
      dropoffRate: 1,
      questionMetrics: [],
    };
  }

  // Calculer taux de complétion moyen
  const completionRates = responses.map((resp) => {
    const answeredQuestions = resp.items.filter((item) => {
      if (item.value === null || item.value === undefined) return false;
      if (typeof item.value === "string" && item.value.trim() === "") return false;
      if (Array.isArray(item.value) && item.value.length === 0) return false;
      return true;
    }).length;
    return answeredQuestions / totalQuestions;
  });

  const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / responses.length;

  // Calculer temps moyen (estimation basée sur timestamps)
  const avgTotalTime =
    responses.reduce((sum, resp) => {
      const created = new Date(resp.created_at).getTime();
      // Estimation : 10s par question répondue
      const answeredCount = resp.items.filter((item) => item.value !== null).length;
      return sum + answeredCount * 10;
    }, 0) / responses.length;

  // Calculer taux d'abandon
  const dropoffRate = 1 - avgCompletionRate;

  // Métriques par question
  const questionMetrics = (poll.questions || []).map((question, index) => {
    const questionResponses = responses.filter((resp) =>
      resp.items.some((item) => item.questionId === question.id && item.value !== null),
    );

    const responseRate = questionResponses.length / responses.length;
    const avgTimeSpent = 10; // Estimation fixe pour simplifier

    // Taux d'abandon après cette question
    const dropoffAfter =
      responses.filter((resp) => {
        const questionIndex = resp.items.findIndex((item) => item.questionId === question.id);
        return questionIndex >= 0 && questionIndex === resp.items.length - 1;
      }).length / responses.length;

    return {
      questionId: question.id,
      responseRate,
      avgTimeSpent,
      dropoffRate: dropoffAfter,
    };
  });

  return {
    totalResponses: responses.length,
    avgCompletionRate,
    avgTotalTime,
    dropoffRate,
    questionMetrics,
  };
}

// ============================================================================
// CALCUL PRÉCISION
// ============================================================================

/**
 * Calcule le score de précision entre deux valeurs
 * Retourne un score de 0 à 100
 */
function calculateAccuracy(predicted: number, actual: number): number {
  if (predicted === 0 && actual === 0) return 100;
  if (predicted === 0 || actual === 0) return 0;

  const error = Math.abs(predicted - actual);
  const maxValue = Math.max(predicted, actual);
  const accuracy = Math.max(0, 100 - (error / maxValue) * 100);

  return Math.round(accuracy);
}

// ============================================================================
// COMPARAISON PRINCIPALE
// ============================================================================

/**
 * Compare une simulation avec les résultats réels
 */
export function compareSimulationWithReality(
  pollId: string,
  simulation: SimulationResult,
): SimulationComparison {
  logger.info(`Comparing simulation ${simulation.id} with reality for poll ${pollId}`, "general");

  // Calculer métriques réelles
  const actualMetrics = calculateActualMetrics(pollId);

  // Calculer précision
  const completionRateAccuracy = calculateAccuracy(
    simulation.metrics.avgCompletionRate,
    actualMetrics.avgCompletionRate,
  );

  const totalTimeAccuracy = calculateAccuracy(
    simulation.metrics.avgTotalTime,
    actualMetrics.avgTotalTime,
  );

  const dropoffRateAccuracy = calculateAccuracy(
    simulation.metrics.dropoffRate,
    actualMetrics.dropoffRate,
  );

  // Score global (moyenne pondérée)
  const overallAccuracy = Math.round(
    completionRateAccuracy * 0.4 + totalTimeAccuracy * 0.3 + dropoffRateAccuracy * 0.3,
  );

  const comparison: SimulationComparison = {
    id: `comparison-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    pollId,
    simulationId: simulation.id,
    comparedAt: new Date().toISOString(),
    predicted: simulation.metrics,
    actual: actualMetrics,
    accuracy: {
      completionRate: completionRateAccuracy,
      totalTime: totalTimeAccuracy,
      dropoffRate: dropoffRateAccuracy,
      overall: overallAccuracy,
    },
  };

  // Sauvegarder
  saveComparison(comparison);

  logger.info(`Comparison completed: ${overallAccuracy}% accuracy`, "general", { comparison });

  return comparison;
}

/**
 * Récupère la dernière simulation pour un poll
 */
export function getLastSimulation(pollId: string): SimulationResult | null {
  try {
    const stored = localStorage.getItem("doodates_simulations");
    if (!stored) return null;

    const simulations: SimulationResult[] = JSON.parse(stored);
    const pollSimulations = simulations.filter((s) => s.config.pollId === pollId);

    if (pollSimulations.length === 0) return null;

    // Trier par date décroissante et retourner la plus récente
    return pollSimulations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  } catch (error) {
    logger.error("Failed to get last simulation", "general", { error });
    return null;
  }
}
