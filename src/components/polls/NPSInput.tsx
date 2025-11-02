import React from "react";

interface NPSInputProps {
  value: number | null;
  onChange: (value: number) => void;
  required?: boolean;
}

/**
 * Composant NPSInput
 * Net Promoter Score : échelle 0-10
 * 0-6 = Détracteurs (rouge)
 * 7-8 = Passifs (jaune)
 * 9-10 = Promoteurs (vert)
 */
export function NPSInput({ value, onChange, required = false }: NPSInputProps) {
  const items = Array.from({ length: 11 }, (_, i) => i);

  const getColor = (num: number) => {
    if (num <= 6) return "detractor"; // Rouge
    if (num <= 8) return "passive"; // Jaune
    return "promoter"; // Vert
  };

  const getButtonClass = (num: number) => {
    const isSelected = value === num;
    const category = getColor(num);

    if (isSelected) {
      if (category === "detractor") return "bg-red-500 text-white scale-110 shadow-lg";
      if (category === "passive") return "bg-yellow-500 text-white scale-110 shadow-lg";
      return "bg-green-500 text-white scale-110 shadow-lg";
    }

    // Non sélectionné
    if (category === "detractor") return "bg-red-50 text-red-700 hover:bg-red-100";
    if (category === "passive") return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
    return "bg-green-50 text-green-700 hover:bg-green-100";
  };

  const getCategoryLabel = () => {
    if (value === null) return null;
    const category = getColor(value);
    if (category === "detractor") return { label: "Détracteur", color: "text-red-600" };
    if (category === "passive") return { label: "Passif", color: "text-yellow-600" };
    return { label: "Promoteur", color: "text-green-600" };
  };

  const categoryInfo = getCategoryLabel();

  return (
    <div className="space-y-4" data-testid="nps-input">
      {/* Échelle NPS 0-10 */}
      <div className="py-4">
        <div className="grid grid-cols-11 gap-1 sm:gap-2 max-w-2xl mx-auto">
          {items.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-full aspect-square rounded-lg font-semibold text-xs sm:text-base transition-all ${getButtonClass(num)}`}
              data-testid={`nps-button-${num}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Labels explicatifs */}
      <div className="flex justify-between text-xs sm:text-sm text-gray-600 px-2">
        <span className="text-red-600 font-medium">Pas du tout probable</span>
        <span className="text-green-600 font-medium">Très probable</span>
      </div>

      {/* Catégorie sélectionnée */}
      {categoryInfo && (
        <div className="text-center" data-testid="nps-category-display">
          <p className="text-sm text-gray-500">
            Votre score : <span className="font-semibold text-purple-600">{value}/10</span>
          </p>
          <p className={`text-sm font-medium ${categoryInfo.color}`}>{categoryInfo.label}</p>
        </div>
      )}


      {/* Légende NPS */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center mb-2 font-medium">
          Net Promoter Score (NPS)
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <p className="text-red-600 font-medium">0-6</p>
            <p className="text-gray-500">Détracteurs</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
            <p className="text-yellow-600 font-medium">7-8</p>
            <p className="text-gray-500">Passifs</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
            <p className="text-green-600 font-medium">9-10</p>
            <p className="text-gray-500">Promoteurs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
