import React from "react";

interface NPSResultsProps {
  responses: number[]; // Tableau des scores (0-10)
}

/**
 * Composant NPSResults
 * Calcule et affiche le score NPS avec segments
 * NPS = % Promoteurs - % Détracteurs
 */
export function NPSResults({ responses }: NPSResultsProps) {
  if (responses.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">Aucune réponse pour le moment</p>
      </div>
    );
  }

  // Calcul des segments
  const detractors = responses.filter((score) => score <= 6).length;
  const passives = responses.filter((score) => score >= 7 && score <= 8).length;
  const promoters = responses.filter((score) => score >= 9).length;
  const total = responses.length;

  const detractorsPercent = Math.round((detractors / total) * 100);
  const passivesPercent = Math.round((passives / total) * 100);
  const promotersPercent = Math.round((promoters / total) * 100);

  // Calcul du NPS : % Promoteurs - % Détracteurs
  const npsScore = promotersPercent - detractorsPercent;

  // Interprétation du score
  const getInterpretation = (score: number) => {
    if (score >= 70) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 50) return { label: "Très bon", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 30) return { label: "Bon", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 0) return { label: "Acceptable", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (score >= -30) return { label: "À améliorer", color: "text-orange-600", bg: "bg-orange-50" };
    return { label: "Critique", color: "text-red-600", bg: "bg-red-50" };
  };

  const interpretation = getInterpretation(npsScore);

  // Distribution des scores
  const distribution = Array.from({ length: 11 }, (_, i) => {
    const count = responses.filter((score) => score === i).length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { score: i, count, percent };
  });

  return (
    <div className="space-y-6" data-testid="nps-results">
      {/* Score NPS principal */}
      <div
        className={`p-6 rounded-xl ${interpretation.bg} border-2 border-${interpretation.color.replace("text-", "")}`}
        data-testid="nps-score-display"
      >
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-2">Net Promoter Score</p>
          <div className={`text-6xl font-bold ${interpretation.color}`}>
            {npsScore > 0 ? "+" : ""}
            {npsScore}
          </div>
          <p className={`text-lg font-semibold mt-2 ${interpretation.color}`}>
            {interpretation.label}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {total} réponse{total > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Segments */}
      <div className="grid grid-cols-3 gap-4">
        {/* Détracteurs */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200" data-testid="nps-detractors">
          <div className="text-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
            <p className="text-2xl font-bold text-red-600">{detractorsPercent}%</p>
            <p className="text-sm font-medium text-red-700 mt-1">Détracteurs</p>
            <p className="text-xs text-gray-600 mt-1">
              {detractors} / {total}
            </p>
            <p className="text-xs text-gray-500 mt-1">Score 0-6</p>
          </div>
        </div>

        {/* Passifs */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200" data-testid="nps-passives">
          <div className="text-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-2"></div>
            <p className="text-2xl font-bold text-yellow-600">{passivesPercent}%</p>
            <p className="text-sm font-medium text-yellow-700 mt-1">Passifs</p>
            <p className="text-xs text-gray-600 mt-1">
              {passives} / {total}
            </p>
            <p className="text-xs text-gray-500 mt-1">Score 7-8</p>
          </div>
        </div>

        {/* Promoteurs */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200" data-testid="nps-promoters">
          <div className="text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-2xl font-bold text-green-600">{promotersPercent}%</p>
            <p className="text-sm font-medium text-green-700 mt-1">Promoteurs</p>
            <p className="text-xs text-gray-600 mt-1">
              {promoters} / {total}
            </p>
            <p className="text-xs text-gray-500 mt-1">Score 9-10</p>
          </div>
        </div>
      </div>

      {/* Distribution détaillée */}
      <div className="p-4 bg-gray-50 rounded-lg" data-testid="nps-distribution">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribution des scores</h4>
        <div className="space-y-2">
          {distribution.map(({ score, count, percent }) => (
            <div key={score} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 w-8">{score}</span>
              <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    score <= 6 ? "bg-red-500" : score <= 8 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-16 text-right">
                {count} ({percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explication NPS */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Comment interpréter le NPS ?</h4>
        <p className="text-xs text-blue-800 leading-relaxed">
          Le Net Promoter Score mesure la probabilité de recommandation. Il se calcule en
          soustrayant le % de détracteurs au % de promoteurs. Un score positif est bon, au-dessus de
          50 est excellent.
        </p>
      </div>
    </div>
  );
}
