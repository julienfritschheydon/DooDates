/**
 * SimulationButton - Bouton pour lancer une simulation
 * À intégrer dans FormPollCreator
 */

import { Sparkles } from "lucide-react";

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

export function SimulationButton({
  onClick,
  remainingSimulations,
  disabled = false,
  variant = "secondary",
}: SimulationButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled || remainingSimulations === 0}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
        ${
          isPrimary
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "border border-gray-700 text-gray-300 hover:bg-gray-800"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Sparkles className="w-4 h-4" />
      <span>Tester avec l'IA</span>
      {remainingSimulations > 0 && (
        <span
          className={`
          text-xs px-2 py-0.5 rounded-full
          ${isPrimary ? "bg-purple-500" : "bg-purple-600 text-white"}
        `}
        >
          {remainingSimulations}
        </span>
      )}
    </button>
  );
}
