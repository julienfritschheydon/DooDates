/**
 * SimulationProgress - Barre de progression pendant la simulation
 * 
 * Affiche la progression en temps réel pendant la génération
 * des réponses simulées.
 */

import { Loader2, Users, MessageSquare } from "lucide-react";

interface SimulationProgressProps {
  /** Nombre total de réponses à générer */
  total: number;
  
  /** Nombre de réponses générées */
  current: number;
  
  /** Temps écoulé (ms) */
  elapsedTime?: number;
}

export function SimulationProgress({
  total,
  current,
  elapsedTime
}: SimulationProgressProps) {
  const progress = (current / total) * 100;
  const remaining = total - current;

  // Estimation temps restant (basé sur temps écoulé)
  const estimatedTimeRemaining = elapsedTime && current > 0
    ? ((elapsedTime / current) * remaining) / 1000
    : null;

  const remainingTime = estimatedTimeRemaining !== null && estimatedTimeRemaining > 0
    ? Math.ceil(estimatedTimeRemaining)
    : null;

  const percentage = Math.round(progress);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-xl max-w-md w-full p-8 border border-gray-700">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          Génération en cours...
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          L'IA simule les réponses de {total} participants
        </p>

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {current} / {total} réponses
            </span>
            <span className="text-white font-semibold">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {remainingTime !== null && (
            <p className="text-xs text-gray-400 text-center">
              Temps restant estimé : {remainingTime}s
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <p className="text-xs text-blue-300 text-center">
            Ne fermez pas cette fenêtre pendant la génération
          </p>
        </div>
      </div>
    </div>
  );
}
