/**
 * SimulationModal - Modal pour lancer une simulation
 *
 * Permet de configurer et lancer une simulation de réponses
 * pour tester un questionnaire avant de l'envoyer.
 */
import type { SimulationConfig, SimulationContext, UserTier } from "../../types/simulation";
interface SimulationModalProps {
  /** ID du poll à simuler */
  pollId: string;
  /** Contexte auto-détecté */
  detectedContext: SimulationContext;
  /** Tier utilisateur */
  userTier: UserTier;
  /** Callback au lancement */
  onStart: (config: SimulationConfig) => void;
  /** Callback fermeture */
  onClose: () => void;
  /** Simulations restantes ce mois */
  remainingSimulations: number;
}
export declare function SimulationModal({
  pollId,
  detectedContext,
  userTier,
  onStart,
  onClose,
  remainingSimulations,
}: SimulationModalProps): import("react/jsx-runtime").JSX.Element;
export {};
