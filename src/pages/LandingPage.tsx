import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
  Bot,
  Clock,
  Users,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";

const useCases = [
  "les réunions d'équipe",
  "les rendez-vous clients",
  "les sessions de formation",
  "les événements communautaires",
  "les consultations médicales",
  "les entretiens de recrutement",
];

export default function LandingPage() {
  const [currentUseCase, setCurrentUseCase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUseCase((prev) => (prev + 1) % useCases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-white">
                DooDates
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                Tableau de bord
              </Link>
              <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Tarifs
              </Link>
              <Link to="/docs" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Planification simple conçue pour
          </h1>
          <div className="h-16 flex items-center justify-center mb-8">
            <p
              key={currentUseCase}
              className="text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 animate-fade-in"
            >
              {useCases[currentUseCase]}
            </p>
          </div>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Créez des sondages de dates, des formulaires ou des disponibilités en quelques clics.
            L'IA est toujours disponible pour vous aider.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/workspace/date"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-semibold text-lg shadow-lg"
            >
              Créer un sondage
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/workspace/form"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition-colors font-semibold text-lg shadow-lg"
            >
              Créer un formulaire
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/create/availability"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-semibold text-lg shadow-lg"
            >
              Créer une disponibilité
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Créez votre sondage avec l'IA</h3>
              <p className="text-gray-400">
                Décrivez simplement votre besoin en langage naturel. L'IA génère pour vous les
                questions, les types de sondages (dates, formulaires, disponibilités) et la logique
                intelligente.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Testez et partagez en quelques clics</h3>
              <p className="text-gray-400">
                Prévisualisez le sondage comme vos participants le verront, laissez l'IA suggérer
                des améliorations, puis partagez le lien en un clic.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Analysez les réponses avec l'IA</h3>
              <p className="text-gray-400">
                L'IA met en avant les tendances, détecte les points importants et vous aide à
                choisir rapidement le meilleur créneau ou la meilleure décision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="bg-[#1a1a1a] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Des cas d'usage pour tous les besoins
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Réunions d'équipe</h3>
              <p className="text-gray-400">
                Organisez vos stand-ups, rétrospectives et réunions de planning en quelques clics.
              </p>
            </div>
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Rendez-vous clients</h3>
              <p className="text-gray-400">
                Laissez vos clients choisir leurs créneaux de disponibilité pour simplifier la prise
                de rendez-vous.
              </p>
            </div>
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Formations</h3>
              <p className="text-gray-400">
                Planifiez vos sessions de formation en trouvant le créneau qui convient à tous les
                participants.
              </p>
            </div>
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <BarChart3 className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Sondages d'opinion</h3>
              <p className="text-gray-400">
                Collectez les avis de votre équipe ou de vos clients avec des formulaires
                personnalisés.
              </p>
            </div>
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <Calendar className="w-8 h-8 text-violet-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Événements</h3>
              <p className="text-gray-400">
                Organisez vos événements communautaires en trouvant la date qui convient au plus
                grand nombre.
              </p>
            </div>
            <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-lg">
              <Check className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Entretiens</h3>
              <p className="text-gray-400">
                Simplifiez la planification des entretiens de recrutement ou de consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">DooDates</h3>
              <p className="text-sm text-gray-400">
                Simplifiez la planification de vos réunions et événements.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/workspace/date"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Créer un sondage
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Tableau de bord
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Ressources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/docs"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Guide d'utilisation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/docs/14-FAQ"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/17-Resolution-Problemes"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Statut
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 DooDates. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
