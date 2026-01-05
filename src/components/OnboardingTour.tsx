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
  LayoutDashboard,
  Clock,
  BarChart3,
  Settings,
  ExternalLink,
  Calendar,
  FileText,
  HelpCircle,
  Plus,
  DollarSign,
  Book,
} from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import { Link } from "react-router-dom";

interface OnboardingStep {
  title: string;
  description: string | React.ReactNode;
  icon: React.ReactNode;
  content?: React.ReactNode;
  docLink?: string;
  docLabel?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Bienvenue sur DooDates !",
    description:
      "Créez des sondages et formulaires en parlant naturellement. Pas d'interface compliquée, juste une conversation.",
    icon: <MessageSquare className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "Navigation : Menu de gauche",
    description: "Découvrez les fonctionnalités principales accessibles depuis le menu :",
    icon: <LayoutDashboard className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-4">
        {/* Visualisation du menu avec numéros */}
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 relative pl-8">
          <div className="bg-[#1a1a1a] p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">DooDates</h3>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2 bg-[#1a1a1a]">
            {/* Bouton 1 */}
            <div className="relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                1
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg pointer-events-none" data-testid="onboardingtour-button">
                <Sparkles className="w-5 h-5" />
                <span>Créer avec IA</span>
              </button>
            </div>

            {/* Bouton 2 */}
            <div className="relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                2
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] rounded-lg pointer-events-none" data-testid="onboardingtour-button">
                <Plus className="w-5 h-5" />
                <span>Créer sans IA</span>
              </button>
            </div>

            {/* Bouton 3 */}
            <div className="relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                3
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] rounded-lg pointer-events-none" data-testid="onboardingtour-button">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span>Tableau de bord</span>
              </button>
            </div>

            {/* Bouton 4 */}
            <div className="relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                4
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] rounded-lg pointer-events-none" data-testid="onboardingtour-button">
                <DollarSign className="w-5 h-5" />
                <span>Tarifs</span>
              </button>
            </div>

            {/* Bouton 5 */}
            <div className="relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                5
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 bg-[#2a2a2a] rounded-lg pointer-events-none" data-testid="onboardingtour-button">
                <Book className="w-5 h-5" />
                <span>Documentation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="space-y-2 text-left bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="font-semibold text-gray-900 mb-2">Légende :</div>
          <div className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-purple-600">1.</span> Créer avec IA - Créez des
              sondages en parlant naturellement
            </div>
            <div>
              <span className="font-semibold text-purple-600">2.</span> Créer sans IA - Créez
              manuellement un sondage ou formulaire
            </div>
            <div>
              <span className="font-semibold text-purple-600">3.</span> Tableau de bord - Vue
              d'ensemble de tous vos sondages
            </div>
            <div>
              <span className="font-semibold text-purple-600">4.</span> Tarifs - Consultez nos
              offres et tarifs
            </div>
            <div>
              <span className="font-semibold text-purple-600">5.</span> Documentation - Accédez aux
              guides et tutoriels
            </div>
          </div>
        </div>
      </div>
    ),
    docLink: "/docs/10-Tableau-Bord",
    docLabel: "En savoir plus sur le tableau de bord",
  },
  {
    title: "Créer avec l'IA",
    description:
      "L'IA génère votre questionnaire en quelques secondes. Parlez-lui naturellement de ce dont vous avez besoin.",
    icon: <Sparkles className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-3 text-left">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="font-semibold text-gray-900 mb-2">💬 Interface de chat</div>
          <div className="text-sm text-gray-700">
            Tapez ou dictez votre demande : "Je veux organiser une réunion d'équipe la semaine
            prochaine"
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="font-semibold text-gray-900 mb-2">⚡ Création automatique</div>
          <div className="text-sm text-gray-700">
            L'IA comprend votre besoin et crée un sondage ou formulaire adapté en quelques secondes
          </div>
        </div>
      </div>
    ),
    docLink: "/docs/05-Assistant-IA",
    docLabel: "Guide complet de l'Assistant IA",
  },
  {
    title: "Interface : Sondage de dates",
    description: "Créez des sondages pour organiser des réunions et événements :",
    icon: <Calendar className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-4 text-left">
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
          {/* Image avec numéros superposés */}
          <img
            src={`${import.meta.env.BASE_URL}onboarding/poll-creation.png`}
            alt="Interface de création de sondage de dates"
            className="w-full h-auto"
            onError={(e) => {
              // Fallback si l'image n'existe pas encore
              (e.target as HTMLImageElement).style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "p-8 bg-gray-100 text-center text-gray-500";
              fallback.textContent = "Image de l'interface de création de sondage";
              (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
            }}
          />
          {/* Numéros annotés */}
          <div className="absolute top-4 left-8">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </div>
            <div className="ml-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
              Titre du sondage
            </div>
          </div>
          <div className="absolute top-40 left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <div className="ml-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
              Calendrier
            </div>
          </div>
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              3
            </div>
            <div className="ml-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
              Plages horaires
            </div>
          </div>
        </div>
      </div>
    ),
    docLink: "/docs/03-Sondages-Dates",
    docLabel: "Guide des sondages de dates",
  },
  {
    title: "Interface : Formulaire / Questionnaire",
    description: "Créez des enquêtes, sondages d'opinion et quiz :",
    icon: <FileText className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-4 text-left">
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
          {/* Image avec numéros superposés */}
          <img
            src={`${import.meta.env.BASE_URL}onboarding/form-creation.png`}
            alt="Interface de création de formulaire"
            className="w-full h-auto"
            onError={(e) => {
              // Fallback si l'image n'existe pas encore
              (e.target as HTMLImageElement).style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "p-8 bg-gray-100 text-center text-gray-500";
              fallback.textContent = "Image de l'interface de création de formulaire";
              (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
            }}
          />
          {/* Numéros annotés */}
          <div className="absolute top-24 left-8">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </div>
            <div className="ml-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
              Titre du formulaire
            </div>
          </div>
          <div className="absolute top-64 left-8">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <div className="ml-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
              Éditeur de questions
            </div>
          </div>
          <div className="absolute top-16 right-8">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              3
            </div>
            <div className="mr-2 mt-1 text-xs text-gray-700 bg-white/90 px-2 py-1 rounded text-right">
              Mode d'affichage
            </div>
          </div>
        </div>
      </div>
    ),
    docLink: "/docs/04-Formulaires-Questionnaires",
    docLabel: "Guide des formulaires",
  },
  {
    title: "Modifier en langage naturel",
    description: "Parlez à l'IA comme à un collègue pour modifier vos questionnaires :",
    icon: <Edit3 className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-4 text-left">
        {/* Mise en scène : Conversation */}
        <div className="bg-[#0a0a0a] rounded-lg border border-gray-700 p-4 space-y-3">
          {/* Message utilisateur */}
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">
              <div className="font-semibold mb-1">Vous</div>
              <div>"Ajoute une question sur les préférences de lieu"</div>
            </div>
          </div>

          {/* Message IA */}
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-[#1a1a1a] text-gray-200 rounded-lg px-4 py-2 text-sm border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-semibold">Assistant IA</span>
              </div>
              <div>✅ Question ajoutée ! "Quel lieu préférez-vous pour la réunion ?"</div>
            </div>
          </div>

          {/* Message utilisateur */}
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">
              <div className="font-semibold mb-1">Vous</div>
              <div>"Rends la question sur l'email obligatoire"</div>
            </div>
          </div>

          {/* Message IA */}
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-[#1a1a1a] text-gray-200 rounded-lg px-4 py-2 text-sm border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-semibold">Assistant IA</span>
              </div>
              <div>✅ Question modifiée ! La question sur l'email est maintenant obligatoire.</div>
            </div>
          </div>
        </div>

        {/* Exemples de commandes */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="font-semibold text-gray-900 mb-2">💬 Exemples de commandes :</div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">•</span>
              <span>"Ajoute une question sur..."</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">•</span>
              <span>"Change la question 2 en choix multiple"</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">•</span>
              <span>"Supprime la question 3"</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">•</span>
              <span>"Rends la question sur l'email obligatoire"</span>
            </div>
          </div>
        </div>
      </div>
    ),
    docLink: "/docs/05-Assistant-IA",
    docLabel: "Plus d'exemples de commandes",
  },
  {
    title: "Publier et partager",
    description:
      "Votre questionnaire est prêt ! Partagez le lien et collectez les réponses. Export gratuit sans limite.",
    icon: <Share2 className="w-12 h-12 text-purple-600" />,
    docLink: "/docs/09-Export-Partage",
    docLabel: "Guide du partage",
  },
  {
    title: "Documentation et aide",
    description:
      "Consultez notre documentation complète pour découvrir toutes les fonctionnalités et bonnes pratiques.",
    icon: <BookOpen className="w-12 h-12 text-purple-600" />,
    content: (
      <div className="space-y-3 text-left">
        <Link
          to="/docs"
          className="block p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 mb-1">📚 Documentation complète</div>
              <div className="text-sm text-gray-600">Guides, tutoriels, FAQ et plus encore</div>
            </div>
            <ExternalLink className="w-5 h-5 text-purple-600" />
          </div>
        </Link>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-900 mb-2">Guides recommandés :</div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              •{" "}
              <Link
                to="/docs/01-Guide-Demarrage-Rapide"
                className="text-purple-600 hover:underline"
              >
                Guide de démarrage rapide
              </Link>
            </div>
            <div>
              •{" "}
              <Link to="/docs/02-Concepts-Base" className="text-purple-600 hover:underline">
                Concepts de base
              </Link>
            </div>
            <div>
              •{" "}
              <Link to="/docs/11-Cas-Usage" className="text-purple-600 hover:underline">
                Cas d'usage pratiques
              </Link>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

/**
 * Composant OnboardingTour
 * Modal interactif avec plusieurs étapes pour guider les nouveaux utilisateurs
 * Inclut le parcours utilisateur, les éléments du menu, les interfaces de création et des liens vers la documentation
 */
export function OnboardingTour() {
  const { isOpen, currentStep, nextStep, previousStep, skipOnboarding, completeOnboarding } =
    useOnboarding();

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header avec bouton fermer */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={skipOnboarding}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer le tour guidé"
           data-testid="onboardingtour-button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu scrollable de l'étape */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-12">
          {/* Icône */}
          <div className="flex justify-center mb-6">{step.icon}</div>

          {/* Titre */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
            {step.title}
          </h2>

          {/* Description */}
          <div className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 text-center">
            {typeof step.description === "string" ? <p>{step.description}</p> : step.description}
          </div>

          {/* Contenu additionnel (menu, interfaces, etc.) */}
          {step.content && <div className="mb-6 sm:mb-8">{step.content}</div>}

          {/* Lien vers documentation */}
          {step.docLink && step.docLabel && (
            <div className="mb-6 sm:mb-8 text-center">
              <Link
                to={step.docLink}
                onClick={(e) => {
                  e.stopPropagation();
                  completeOnboarding();
                }}
                className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                <BookOpen className="w-4 h-4" />
                {step.docLabel}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Section fixe en bas avec indicateurs et boutons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          {/* Indicateurs de progression */}
          <div className="flex justify-center gap-2 pt-6 pb-4">
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
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-6 sm:px-8 pb-6">
            {/* Bouton Précédent */}
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                isFirstStep ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
              }`}
             data-testid="onboardingtour-button">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Bouton Passer */}
            {!isLastStep && (
              <button
                onClick={skipOnboarding}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm sm:text-base transition-colors"
               data-testid="onboardingtour-passer">
                Passer
              </button>
            )}

            {/* Bouton Suivant / Commencer */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm sm:text-base hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
             data-testid="onboardingtour-button">
              {isLastStep ? "Commencer" : "Suivant"}
              {!isLastStep && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>

          {/* Footer avec compteur */}
          <div className="bg-gray-50 px-8 py-3 text-center text-sm text-gray-500">
            Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}
