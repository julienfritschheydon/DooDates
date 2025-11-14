import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ClipboardList, Sparkles, X, Bot, Clock } from "lucide-react";
import { PollTypeCard } from "../components/polls/PollTypeCard";
import { CreatePageLayout } from "../components/layout/CreatePageLayout";

export default function CreateChooser() {
  const navigate = useNavigate();
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePreload = (path: string) => {
    // Précharger après 300ms de hover pour éviter les préchargements accidentels
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
    preloadTimeoutRef.current = setTimeout(() => {
      // Précharger PollCreator pour toutes les routes de création
      if (
        (path === "/create/date" || path === "/create/form" || path === "/create/availability") &&
        typeof (window as Window & { preloadPollCreator?: () => void }).preloadPollCreator ===
          "function"
      ) {
        (window as Window & { preloadPollCreator: () => void }).preloadPollCreator();
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  const pollTypes = [
    {
      to: "/create/ai?type=date",
      testId: "poll-type-date-ai",
      title: "Sondage de dates avec l'IA",
      description: "Décrivez votre sondage en langage naturel.",
      features: [
        "Création conversationnelle",
        "Génération automatique",
        "Optimisation intelligente",
      ],
      icon: Bot,
      iconBgClass: "bg-gradient-to-br from-purple-500 to-blue-500",
      iconColorClass: "text-white",
      hoverBorderClass: "hover:border-purple-600",
      focusRingClass: "focus:ring-2 focus:ring-purple-600",
      ctaColorClass: "text-purple-400",
      badge: "ai" as const,
      popular: true,
    },
    {
      to: "/create/date",
      testId: "poll-type-date",
      title: "Sondage de dates manuelle",
      description: "Proposez des jours et horaires précis.",
      features: ["Sélection calendrier", "Créneaux horaires", "Résultats agrégés"],
      icon: Calendar,
      iconBgClass: "bg-blue-50",
      iconColorClass: "text-blue-600",
      hoverBorderClass: "hover:border-blue-600",
      focusRingClass: "focus:ring-2 focus:ring-blue-600",
      ctaColorClass: "text-blue-600",
      preload: true,
    },
    {
      to: "/create/ai?type=form",
      testId: "poll-type-form-ai",
      title: "Formulaire avec l'IA",
      description: "Décrivez votre formulaire, l'IA génère les questions.",
      features: ["Génération automatique", "Types adaptés", "Optimisation"],
      icon: Sparkles,
      iconBgClass: "bg-gradient-to-br from-purple-500 to-blue-500",
      iconColorClass: "text-white",
      hoverBorderClass: "hover:border-purple-600",
      focusRingClass: "focus:ring-2 focus:ring-purple-600",
      ctaColorClass: "text-purple-400",
      badge: "ai" as const,
    },
    {
      to: "/create/form",
      testId: "poll-type-form",
      title: "Formulaire manuel",
      description: "Questions à choix unique/multiples ou texte libre.",
      features: ["Questions personnalisées", "Choix multiples", "Résultats automatiques"],
      icon: ClipboardList,
      iconBgClass: "bg-violet-50",
      iconColorClass: "text-violet-600",
      hoverBorderClass: "hover:border-violet-600",
      focusRingClass: "focus:ring-2 focus:ring-violet-600",
      ctaColorClass: "text-violet-600",
    },
    {
      to: "/create/availability",
      testId: "poll-type-availability",
      title: "Sondage Disponibilités",
      description:
        "Vos clients indiquent leurs disponibilités, vous proposez les créneaux optimaux.",
      features: ["Parsing conversationnel", "Optimisation agenda", "Création événements"],
      icon: Clock,
      iconBgClass: "bg-green-50",
      iconColorClass: "text-green-600",
      hoverBorderClass: "hover:border-green-600",
      focusRingClass: "focus:ring-2 focus:ring-green-600",
      ctaColorClass: "text-green-600",
      badge: "new" as const,
    },
  ];

  return (
    <CreatePageLayout>
      <div className="flex items-center justify-center min-h-full p-6">
        <main className="max-w-7xl w-full mx-auto relative">
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          <h1 className="text-3xl font-bold mb-2 text-white">Sélectionnez votre type de sondage</h1>
          <p className="text-gray-400 mb-8">
            Choisissez la méthode de création qui vous convient le mieux.
          </p>

          {/* Grille responsive : 1 colonne mobile, 2 colonnes tablette, 5 colonnes desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {pollTypes.map((pollType) => (
              <PollTypeCard
                key={pollType.testId}
                {...pollType}
                onMouseEnter={pollType.preload ? () => handlePreload(pollType.to) : undefined}
                onMouseLeave={pollType.preload ? handleMouseLeave : undefined}
                badge={pollType.popular ? "popular" : pollType.badge}
              />
            ))}
          </div>
        </main>
      </div>
    </CreatePageLayout>
  );
}
