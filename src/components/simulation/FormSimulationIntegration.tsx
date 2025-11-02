/**
 * FormSimulationIntegration - Composant d'intégration complet pour FormPollCreator
 *
 * Utilisation :
 * <FormSimulationIntegration
 *   pollTitle={draft.title}
 *   questions={draft.questions}
 *   userTier="pro"
 * />
 */

import { useFormSimulation } from "../../hooks/useFormSimulation";
import { SimulationButton } from "./SimulationButton";
import { SimulationModal } from "./SimulationModal";
import { SimulationProgress } from "./SimulationProgress";
import { SimulationReport } from "./SimulationReport";
import type { UserTier } from "../../types/simulation";

interface FormSimulationIntegrationProps {
  /** ID du poll */
  pollId: string;

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

  /** Variant du bouton */
  buttonVariant?: "primary" | "secondary";
}

export function FormSimulationIntegration({
  pollId,
  pollTitle,
  questions,
  userTier,
  buttonVariant = "secondary",
}: FormSimulationIntegrationProps) {
  const simulation = useFormSimulation({
    pollTitle,
    questions,
    userTier,
  });

  // Ne rien afficher si pas de questions
  if (questions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bouton */}
      <SimulationButton
        onClick={simulation.openSimulation}
        remainingSimulations={simulation.remainingSimulations}
        disabled={!simulation.canLaunchSimulation}
        variant={buttonVariant}
      />

      {/* Modal configuration */}
      {simulation.showModal && (
        <SimulationModal
          pollId={pollId}
          detectedContext={simulation.detectedContext}
          userTier={userTier}
          onStart={simulation.startSimulation}
          onClose={simulation.closeModal}
          remainingSimulations={simulation.remainingSimulations}
        />
      )}

      {/* Progress */}
      {simulation.isRunning && simulation.configuredVolume > 0 && (
        <SimulationProgress
          total={simulation.configuredVolume}
          current={Math.round((simulation.progress / 100) * simulation.configuredVolume)}
          elapsedTime={simulation.elapsedTime}
        />
      )}

      {/* Rapport */}
      {simulation.result && !simulation.isRunning && (
        <SimulationReport
          result={simulation.result}
          questions={questions}
          onClose={simulation.reset}
          isPro={userTier === "pro" || userTier === "enterprise"}
          pollId={pollId}
        />
      )}
    </>
  );
}
