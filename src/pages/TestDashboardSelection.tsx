import React, { useState } from "react";

/**
 * Page de test ISOLÉE - Teste UNIQUEMENT la sélection avec border bleu
 * 
 * Cette page reproduit juste l'interaction de sélection :
 * - Une carte avec checkbox
 * - Border bleu quand sélectionnée
 * - Rien d'autre pour éviter les interférences
 */
const TestDashboardSelection: React.FC = () => {
  const [isSelected, setIsSelected] = useState(false);

  const toggleSelection = () => {
    setIsSelected((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          Test Dashboard Selection (ISOLÉ)
        </h1>
        <p className="text-gray-400 mb-6">
          Test UNIQUEMENT la sélection de cartes et le border bleu - Rien d'autre
        </p>

        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-white font-semibold mb-2">
            État: {isSelected ? (
              <span className="text-green-400">✅ SÉLECTIONNÉE</span>
            ) : (
              <span className="text-gray-400">❌ NON SÉLECTIONNÉE</span>
            )}
          </p>
        </div>

        {/* Carte de test minimaliste - juste la sélection */}
        <div
          className={`bg-[#3c4043] rounded-lg shadow-sm border transition-all cursor-pointer relative p-4 ${
            isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-700"
          }`}
          data-testid="poll-item"
        >
          {/* Checkbox de sélection - Simplifié pour que le clic fonctionne */}
          <div
            className="absolute top-4 right-4 z-10"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection();
            }}
          >
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-blue-600 border-blue-600"
                  : "bg-transparent border-gray-500 hover:border-blue-400"
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          <div className="pr-8">
            <h3 className="text-white font-semibold">Test Conversation</h3>
            <p className="text-gray-400 text-sm">Test isolé - Sélection uniquement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboardSelection;

