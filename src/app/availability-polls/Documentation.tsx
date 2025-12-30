import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Grid3X3,
  Target,
} from "lucide-react";

/**
 * Page de documentation pour DooDates3 (Sondages de Disponibilité)
 * Style moderne inspiré de la documentation Quiz
 */
export default function AvailabilityPollsDocumentation() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navigation Header */}
      <header className="border-b border-green-900/20 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-400 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-white" />
              </div>
              <Link to="/availability-polls" className="text-xl font-bold text-green-400">
                Disponibilités
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/availability-polls/dashboard"
                className="text-gray-300 hover:text-green-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/workspace/availability" className="text-green-400 font-medium">
                Documentation
              </Link>
              <Link
                to="/availability-polls/pricing"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Tarifs
              </Link>
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                ← DooDates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300">Guide complet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-green-400">Disponibilités</span>
          </h1>
          <p className="text-lg text-gray-300">
            Trouvez les créneaux communs de votre équipe avec une grille visuelle
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-green-400" />
            Démarrage rapide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  1
                </div>
                <h3 className="font-semibold">Définir la période</h3>
              </div>
              <p className="text-sm text-gray-300">
                Choisissez les dates de début et fin, ainsi que les plages horaires (ex: 9h-18h,
                heures de travail uniquement).
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  2
                </div>
                <h3 className="font-semibold">Configurer la durée</h3>
              </div>
              <p className="text-sm text-gray-300">
                Définissez la durée du créneau recherché (30min, 1h, 2h...) et l'intervalle entre
                les créneaux.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  3
                </div>
                <h3 className="font-semibold">Partager aux participants</h3>
              </div>
              <p className="text-sm text-gray-300">
                Envoyez le lien. Chaque participant indique ses disponibilités sur la grille en
                cliquant sur les créneaux.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  4
                </div>
                <h3 className="font-semibold">Identifier le créneau optimal</h3>
              </div>
              <p className="text-sm text-gray-300">
                La heatmap affiche les créneaux par couleur. L'outil suggère automatiquement le
                meilleur créneau.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">🎯 Fonctionnalités</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Grille visuelle</h3>
                <p className="text-sm text-gray-300">
                  Vue calendrier avec tous les créneaux affichés. Cliquez pour indiquer votre
                  disponibilité. Visualisez d'un coup d'œil les disponibilités communes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Heatmap automatique</h3>
                <p className="text-sm text-gray-300">
                  Plus un créneau est disponible, plus il est coloré. Identifiez instantanément les
                  zones de consensus.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Plages horaires flexibles</h3>
                <p className="text-sm text-gray-300">
                  Limitez aux heures de travail (9h-18h) ou personnalisez. Définissez la granularité
                  (15min, 30min, 1h).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Suivi des participants</h3>
                <p className="text-sm text-gray-300">
                  Voyez les disponibilités envoyées par le client. Proposez des créneaux optimisés
                  basés sur l'analyse IA de leur disponibilité.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Différence avec Date Polls */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">📊 Disponibilités vs Sondages de Dates</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h4 className="font-medium text-green-300 mb-3">📆 Sondages de Disponibilité</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Grille avec tous les créneaux</li>
                <li>• Durée fixe recherchée (ex: 2h)</li>
                <li>• Idéal pour trouver un créneau récurrent</li>
                <li>• Heatmap visuelle</li>
              </ul>
            </div>
            <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-3">📅 Sondages de Dates</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Options de dates spécifiques</li>
                <li>• Créneaux choisis par le créateur</li>
                <li>• Idéal pour un événement ponctuel</li>
                <li>• Vote simple (oui/peut-être/non)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-green-400" />
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Comment limiter aux heures de travail ?</h4>
              <p className="text-sm text-gray-300">
                Lors de la création, définissez la plage horaire (ex: 9h-18h). Seuls ces créneaux
                apparaîtront dans la grille.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comment fonctionne le suivi des réponses ?</h4>
              <p className="text-sm text-gray-300">
                Le tableau de bord affiche les disponibilités envoyées par le client. L'IA analyse
                le texte et propose automatiquement les meilleurs créneaux.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comment gérer plusieurs fuseaux horaires ?</h4>
              <p className="text-sm text-gray-300">
                Actuellement, les horaires sont affichés dans le fuseau horaire du créateur. Pour
                les équipes internationales, précisez le fuseau dans le titre ou la description (ex:
                "Horaires en heure de Paris").
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">
                Quelle est la différence avec un sondage de dates ?
              </h4>
              <p className="text-sm text-gray-300">
                Le sondage de disponibilités montre TOUS les créneaux possibles sur une période. Le
                sondage de dates propose des options spécifiques choisies par le créateur.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/availability-polls/dashboard"
              className="block text-green-400 hover:text-green-300 transition-colors"
            >
              → Tableau de bord
            </Link>
            <Link
              to="/workspace/availability"
              className="block text-green-400 hover:text-green-300 transition-colors"
            >
              → Créer un sondage
            </Link>
            <Link
              to="/availability-polls/pricing"
              className="block text-green-400 hover:text-green-300 transition-colors"
            >
              → Tarifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
