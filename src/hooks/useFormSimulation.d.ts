/**
 * useFormSimulation - Hook pour intégrer la simulation dans FormPollCreator
 */
import type { SimulationConfig, UserTier } from "../types/simulation";
interface UseFormSimulationProps {
    /** Titre du poll */
    pollTitle: string;
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
    /** Tier utilisateur */
    userTier: UserTier;
}
export declare function useFormSimulation({ pollTitle, questions, userTier }: UseFormSimulationProps): {
    openSimulation: () => void;
    startSimulation: (config: SimulationConfig) => Promise<void>;
    closeModal: () => void;
    isRunning: boolean;
    result: import("../types/simulation").SimulationResult | null;
    progress: number;
    currentResponses: number;
    configuredVolume: number;
    elapsedTime: number;
    reset: () => void;
    error: Error | null;
    showModal: boolean;
    detectedContext: import("../types/simulation").SimulationContext;
    quota: import("../types/simulation").SimulationQuota;
    remainingSimulations: number;
    canLaunchSimulation: boolean;
};
export {};
