/**
 * SimulationService - Génération de réponses simulées
 *
 * Service principal pour simuler des réponses à un questionnaire
 * en utilisant des personas et optionnellement Gemini pour les questions texte.
 */
import type { SimulationConfig, SimulationResult } from "../../types/simulation";
interface Question {
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
}
/**
 * Simule les réponses pour un questionnaire
 */
export declare function simulate(
  config: SimulationConfig,
  questions: Question[],
): Promise<SimulationResult>;
export {};
