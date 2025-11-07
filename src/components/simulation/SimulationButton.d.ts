/**
 * SimulationButton - Bouton pour lancer une simulation
 * À intégrer dans FormPollCreator
 */
interface SimulationButtonProps {
  /** Callback au clic */
  onClick: () => void;
  /** Simulations restantes */
  remainingSimulations: number;
  /** Désactivé */
  disabled?: boolean;
  /** Variant */
  variant?: "primary" | "secondary";
}
export declare function SimulationButton({
  onClick,
  remainingSimulations,
  disabled,
  variant,
}: SimulationButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
