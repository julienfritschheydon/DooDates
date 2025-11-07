/**
 * useSimulation - Hook pour gérer les simulations
 *
 * Orchestre le lancement, la progression et l'affichage des résultats
 * d'une simulation de réponses.
 */
import type { SimulationConfig, SimulationResult, SimulationContext } from "../types/simulation";
interface UseSimulationOptions {
  /** ID du poll */
  pollId: string;
  /** Questions du poll */
  questions: Array<{
    id: string;
    title: string;
    type: "single" | "multiple" | "text" | "long-text" | "matrix";
    required?: boolean;
    options?: Array<{
      id: string;
      label: string;
    }>;
    matrixRows?: Array<{
      id: string;
      label: string;
    }>;
    matrixColumns?: Array<{
      id: string;
      label: string;
    }>;
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
export declare function useSimulation({
  pollId,
  questions,
  detectedContext,
}: UseSimulationOptions): UseSimulationReturn;
export {};
