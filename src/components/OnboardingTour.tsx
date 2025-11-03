import React from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Sparkles,
  Edit3,
  Share2,
  BookOpen,
} from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Bienvenue sur DooDates !",
    description:
      "Créez des sondages et formulaires en parlant naturellement. Pas d'interface compliquée, juste une conversation.",
    icon: <MessageSquare className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "L'IA génère votre questionnaire",
    description:
      "En quelques secondes, notre IA comprend votre besoin et crée un sondage ou formulaire professionnel adapté.",
    icon: <Sparkles className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "Modifiez en langage naturel",
    description:
      'Besoin d\'ajuster ? Demandez simplement : "Ajoute une question sur...", "Change l\'ordre", etc.',
    icon: <Edit3 className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "Publiez et partagez en 1 clic",
    description:
      "Votre questionnaire est prêt ! Partagez le lien et collectez les réponses. Export gratuit sans limite.",
    icon: <Share2 className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "Besoin d'aide ?",
    description:
      "Consultez notre documentation complète pour découvrir toutes les fonctionnalités et bonnes pratiques.",
    icon: <BookOpen className="w-12 h-12 text-purple-600" />,
  },
];

/**
 * Composant OnboardingTour
 * Modal interactif avec 4 étapes pour guider les nouveaux utilisateurs
 */
export function OnboardingTour() {
  const { isOpen, currentStep, nextStep, previousStep, skipOnboarding, completeOnboarding } =
    useOnboarding();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isDocStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleGoToDocs = () => {
    completeOnboarding();
    navigate("/docs");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header avec bouton fermer */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={skipOnboarding}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer le tour guidé"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu de l'étape */}
        <div className="p-6 sm:p-8 pt-12 text-center">
          {/* Icône */}
          <div className="flex justify-center mb-6">{step.icon}</div>

          {/* Titre */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{step.title}</h2>

          {/* Description */}
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
            {step.description}
          </p>

          {/* Indicateurs de progression */}
          <div className="flex justify-center gap-2 mb-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-purple-600"
                    : index < currentStep
                      ? "w-2 bg-purple-400"
                      : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Bouton Précédent */}
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                isFirstStep ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Bouton Passer / Voir la doc */}
            {!isLastStep && (
              <button
                onClick={skipOnboarding}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm sm:text-base transition-colors"
              >
                Passer
              </button>
            )}

            {isDocStep && (
              <button
                onClick={handleGoToDocs}
                className="text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                Voir la doc
              </button>
            )}

            {/* Bouton Suivant / Commencer */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm sm:text-base hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              {isLastStep ? "Commencer" : "Suivant"}
              {!isLastStep && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Footer avec compteur */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500">
          Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
        </div>
      </div>
    </div>
  );
}
