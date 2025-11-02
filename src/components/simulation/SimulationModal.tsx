/**
 * SimulationModal - Modal pour lancer une simulation
 *
 * Permet de configurer et lancer une simulation de réponses
 * pour tester un questionnaire avant de l'envoyer.
 */

import { useState } from "react";
import { X, Play, Sparkles } from "lucide-react";
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

export function SimulationModal({
  pollId,
  detectedContext,
  userTier,
  onStart,
  onClose,
  remainingSimulations,
}: SimulationModalProps) {
  const [volume, setVolume] = useState<number>(10);
  const [context, setContext] = useState<SimulationContext>(detectedContext);
  const [useGemini, setUseGemini] = useState<boolean>(true);

  // Limites selon tier
  const maxVolume = {
    free: 10,
    pro: 50,
    enterprise: 100,
  }[userTier];

  const canOverrideContext = userTier !== "free";
  const hasGeminiAccess = true; // Tous les tiers ont accès

  const handleStart = () => {
    const config: SimulationConfig = {
      pollId,
      volume,
      context,
      useGemini,
    };
    onStart(config);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Tester avec l'IA</h2>
              <p className="text-sm text-gray-400">
                {remainingSimulations} simulation{remainingSimulations > 1 ? "s" : ""} restante
                {remainingSimulations > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de réponses
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max={maxVolume}
                step="5"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-purple-600"
              />
              <span className="text-lg font-semibold text-white w-12 text-right">{volume}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Maximum : {maxVolume} réponses ({userTier})
            </p>
          </div>

          {/* Contexte */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contexte du questionnaire
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as SimulationContext)}
              disabled={!canOverrideContext}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              <option value="event">Événement (soirée, mariage)</option>
              <option value="feedback">Feedback (satisfaction)</option>
              <option value="leisure">Loisirs (amis, famille)</option>
              <option value="association">Association (club, groupe)</option>
              <option value="research">Recherche (étude)</option>
            </select>
            {!canOverrideContext && (
              <p className="text-xs text-gray-400 mt-1">
                Contexte auto-détecté. Upgrade Pro pour modifier.
              </p>
            )}
          </div>

          {/* Gemini */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="use-gemini"
              checked={useGemini}
              onChange={(e) => setUseGemini(e.target.checked)}
              disabled={!hasGeminiAccess}
              className="mt-1 accent-purple-600"
            />
            <div className="flex-1">
              <label
                htmlFor="use-gemini"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Utiliser Gemini pour les questions texte
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Génère des réponses ultra-réalistes avec l'IA.
                {!hasGeminiAccess && " (Pro uniquement)"}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>💡 Astuce :</strong> La simulation détecte automatiquement les problèmes
              (biais, abandon, questions trop longues) et vous donne des recommandations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-[#1a1a1a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleStart}
            disabled={remainingSimulations === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            <Play className="w-4 h-4" />
            Lancer la simulation
          </button>
        </div>
      </div>
    </div>
  );
}
