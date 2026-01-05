import React from "react";
import { Check } from "lucide-react";
import { THEMES, type Theme } from "../../lib/themes";

interface ThemeSelectorProps {
  selectedThemeId: string;
  onThemeChange: (themeId: string) => void;
}

/**
 * Composant ThemeSelector
 * Sélecteur visuel de thèmes pour les formulaires
 */
export function ThemeSelector({ selectedThemeId, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Thème visuel</h3>
        <span className="text-xs text-gray-400">Gratuit</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedThemeId === theme.id}
            onSelect={() => onThemeChange(theme.id)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Le thème sera appliqué à votre formulaire lors du vote
      </p>
    </div>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative p-3 rounded-lg border-2 transition-all text-left flex-shrink-0 w-40 snap-center sm:w-auto ${
        isSelected
          ? "border-purple-500 bg-purple-900/20"
          : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
      }`}
     data-testid="themeselector-button">
      {/* Badge sélectionné */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Nom du thème */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-white">{theme.name}</h4>
        <p className="text-xs text-gray-400">{theme.description}</p>
      </div>

      {/* Aperçu des couleurs */}
      <div className="flex gap-1.5 mt-3">
        <div
          className="w-8 h-8 rounded border border-gray-600"
          style={{ backgroundColor: theme.preview.primary }}
          title="Couleur principale"
        />
        <div
          className="w-8 h-8 rounded border border-gray-600"
          style={{ backgroundColor: theme.preview.secondary }}
          title="Couleur secondaire"
        />
        <div
          className="w-8 h-8 rounded border border-gray-600"
          style={{ backgroundColor: theme.preview.background }}
          title="Arrière-plan"
        />
      </div>
    </button>
  );
}
