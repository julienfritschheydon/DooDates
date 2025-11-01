import React from "react";
import { useOnboarding } from "../../hooks/useOnboarding";

/**
 * TopNav style Gemini pour l'interface AI_FIRST_UX
 *
 * Caractéristiques :
 * - Pas de fond coloré (transparent)
 * - Logo à gauche
 * - Icônes settings et account à droite
 * - Bouton Aide pour relancer l'onboarding
 * - Pas de burger icon (il est dans la sidebar)
 */
const TopNavGemini = () => {
  const { startOnboarding } = useOnboarding();

  return (
    <nav className="h-14 flex items-center justify-center px-4 relative" data-testid="top-nav">
      {/* Logo centré comme Gemini */}
      <h1 className="text-xl font-medium text-white" data-testid="app-logo">
        DooDates
      </h1>

      {/* Icônes à droite comme Gemini - Position absolue */}
      <div className="absolute right-4 flex items-center gap-3">
        {/* Bouton Aide */}
        <button
          onClick={startOnboarding}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          data-testid="help-button"
          aria-label="Aide"
          title="Voir le tour guidé"
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {/* Settings icon */}
        <button
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          data-testid="settings-button"
          aria-label="Settings"
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Account icon */}
        <button
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          data-testid="account-button"
          aria-label="Account"
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default TopNavGemini;
