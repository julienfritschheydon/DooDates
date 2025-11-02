/**
 * useFormSimulation - Hook pour intégrer la simulation dans FormPollCreator
 */

import { useState, useCallback, useMemo } from "react";
import { useSimulation } from "./useSimulation";
import type { SimulationConfig, UserTier } from "../types/simulation";
import { detectContext } from "../lib/simulation/ContextDetectionService";
import {
  getQuotaForTier,
  getRemainingSimulations,
  canSimulate,
  incrementUsage,
} from "../lib/simulation/SimulationQuotaService";

interface UseFormSimulationProps {
  /** Titre du poll */
  pollTitle: string;

  /** Questions du poll */
  questions: Array<{
    id: string;
    title: string;
    type: "single" | "multiple" | "text" | "matrix";
    required?: boolean;
    options?: Array<{ id: string; label: string }>;
    matrixRows?: Array<{ id: string; label: string }>;
    matrixColumns?: Array<{ id: string; label: string }>;
    matrixType?: "single" | "multiple";
  }>;

  /** Tier utilisateur */
  userTier: UserTier;
}

export function useFormSimulation({ pollTitle, questions, userTier }: UseFormSimulationProps) {
  const [showModal, setShowModal] = useState(false);

  // Détection automatique du contexte
  const detectedContext = useMemo(() => {
    return detectContext(pollTitle, questions);
  }, [pollTitle, questions]);

  // Quotas
  const quota = useMemo(() => getQuotaForTier(userTier), [userTier]);
  const remainingSimulations = useMemo(() => getRemainingSimulations(userTier), [userTier]);
  const canLaunchSimulation = useMemo(() => canSimulate(userTier), [userTier]);

  // Hook simulation
  const simulation = useSimulation({
    pollId: "draft", // Sera remplacé par le vrai ID après création
    questions,
    detectedContext,
  });

  // Ouvrir le modal
  const openSimulation = useCallback(() => {
    if (canLaunchSimulation) {
      setShowModal(true);
    }
  }, [canLaunchSimulation]);

  // Lancer la simulation
  const startSimulation = useCallback(
    async (config: SimulationConfig) => {
      setShowModal(false);

      // Incrémenter le compteur
      incrementUsage(userTier);

      // Lancer la simulation
      await simulation.startSimulation(config);
    },
    [userTier, simulation],
  );

  // Fermer le modal
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    // État
    showModal,
    detectedContext,
    quota,
    remainingSimulations,
    canLaunchSimulation,

    // Simulation
    ...simulation,

    // Actions
    openSimulation,
    startSimulation,
    closeModal,
  };
}
