/**
 * useSimulation - Hook pour gérer les simulations
 *
 * Orchestre le lancement, la progression et l'affichage des résultats
 * d'une simulation de réponses.
 */

import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { SimulationConfig, SimulationResult, SimulationContext } from "../types/simulation";
import { simulate } from "../lib/simulation/SimulationService";
import { consumeSimulationCredits } from "../lib/quotaTracking";

interface UseSimulationOptions {
  /** ID du poll */
  pollId: string;

  /** Questions du poll */
  questions: Array<{
    id: string;
    title: string;
    type: "single" | "multiple" | "text" | "long-text" | "matrix";
    required?: boolean;
    options?: Array<{ id: string; label: string }>;
    matrixRows?: Array<{ id: string; label: string }>;
    matrixColumns?: Array<{ id: string; label: string }>;
    matrixType?: "single" | "multiple";
  }>;

  /** Contexte détecté */
  detectedContext: SimulationContext;
}

interface UseSimulationReturn {
  /** État de la simulation */
  isRunning: boolean;

  /** Résultat de la simulation */
  result: SimulationResult | null;

  /** Progression (0-100) */
  progress: number;

  /** Nombre de réponses générées */
  currentResponses: number;

  /** Volume configuré */
  configuredVolume: number;

  /** Temps écoulé (ms) */
  elapsedTime: number;

  /** Lancer une simulation */
  startSimulation: (config: SimulationConfig) => Promise<void>;

  /** Réinitialiser */
  reset: () => void;

  /** Erreur éventuelle */
  error: Error | null;
}

export function useSimulation({
  pollId,
  questions,
  detectedContext,
}: UseSimulationOptions): UseSimulationReturn {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentResponses, setCurrentResponses] = useState(0);
  const [configuredVolume, setConfiguredVolume] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const startSimulation = useCallback(
    async (config: SimulationConfig) => {
      setIsRunning(true);
      setProgress(0);
      setCurrentResponses(0);
      setConfiguredVolume(config.volume);
      setElapsedTime(0);
      setError(null);
      setResult(null);

      const startTime = Date.now();
      let progressInterval: NodeJS.Timeout;

      try {
        // Simuler progression (mise à jour toutes les 100ms)
        progressInterval = setInterval(() => {
          setElapsedTime(Date.now() - startTime);
          // Progression estimée (sera mise à jour par le vrai résultat)
          setProgress((prev) => Math.min(prev + 2, 95));
        }, 100);

        // Lancer la simulation
        const simulationResult = await simulate(config, questions);

        // Consommer les crédits pour la simulation (5 crédits selon la doc)
        consumeSimulationCredits(user?.id, pollId, simulationResult.id);

        // Arrêter l'interval
        clearInterval(progressInterval);

        // Finaliser
        setProgress(100);
        setCurrentResponses(simulationResult.respondents.length);
        setElapsedTime(simulationResult.generationTime);
        setResult(simulationResult);
      } catch (err) {
        clearInterval(progressInterval!);
        setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      } finally {
        setIsRunning(false);
      }
    },
    [questions, pollId, user?.id],
  );

  const reset = useCallback(() => {
    setIsRunning(false);
    setResult(null);
    setProgress(0);
    setCurrentResponses(0);
    setElapsedTime(0);
    setError(null);
  }, []);

  return {
    isRunning,
    result,
    progress,
    currentResponses,
    configuredVolume,
    elapsedTime,
    startSimulation,
    reset,
    error,
  };
}
