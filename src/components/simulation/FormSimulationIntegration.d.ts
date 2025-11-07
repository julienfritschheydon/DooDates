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
  /** Variant du bouton */
  buttonVariant?: "primary" | "secondary";
}
export declare function FormSimulationIntegration({
  pollId,
  pollTitle,
  questions,
  userTier,
  buttonVariant,
}: FormSimulationIntegrationProps): import("react/jsx-runtime").JSX.Element;
export {};
