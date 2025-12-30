import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer la documentation selon le produit courant
  const getDocumentationUrl = () => {
    const pathname = location.pathname;

    if (pathname.includes("/date-polls")) {
      return "/docs/01-Guide-Demarrage-Rapide#sondages-de-dates";
    } else if (pathname.includes("/form-polls")) {
      return "/docs/01-Guide-Demarrage-Rapide#formulaires";
    } else if (pathname.includes("/availability-polls")) {
      return "/docs/01-Guide-Demarrage-Rapide#sondages-de-disponibilite";
    } else if (pathname.includes("/quizz")) {
      return "/docs/01-Guide-Demarrage-Rapide#quizz";
    } else if (pathname.includes("/workspace")) {
      return "/docs/01-Guide-Demarrage-Rapide#workspace-ia";
    } else {
      return "/docs"; // Documentation générale
    }
  };

  return (
    <nav className="h-16 flex items-center justify-center px-4 relative" data-testid="top-nav">
      {/* Logo centré comme Gemini */}
      <h1 className="text-xl font-medium text-white" data-testid="app-logo">
        DooDates
      </h1>

      {/* Icônes à droite comme Gemini - Position absolue */}
      <div className="absolute right-4 flex items-center gap-2">
        {/* Sélecteur de langue - Drapeau français uniquement pour l'instant */}
        <button
          className="p-4 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
          data-testid="language-selector"
          aria-label="Langue"
          title="Français"
        >
          <span className="text-2xl">🇫🇷</span>
        </button>

        {/* Bouton Documentation */}
        <button
          onClick={() => window.open(getDocumentationUrl(), "_blank")}
          className="p-4 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
          data-testid="docs-button"
          aria-label="Documentation"
          title="Voir la documentation"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </button>

        {/* Bouton Aide - Onboarding désactivé temporairement */}
        {/* <button
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
        </button> */}
        {/* Settings icon */}
        <button
          className="p-4 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
          data-testid="settings-button"
          aria-label="Settings"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Account icon */}
        <button
          className="p-4 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
          data-testid="account-button"
          aria-label="Account"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default TopNavGemini;
