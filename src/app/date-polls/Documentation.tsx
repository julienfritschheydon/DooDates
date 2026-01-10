import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BarChart3,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Bell,
} from "lucide-react";

/**
 * Page de documentation pour DooDates1 (Sondages de Dates)
 * Style moderne inspiré de la documentation Quiz
 */
export default function DatePollsDocumentation() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navigation Header */}
      <header className="border-b border-blue-900/20 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <Link to="/date" className="text-xl font-bold text-blue-400">
                Sondages de Dates
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/date/dashboard"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/date/documentation" className="text-blue-400 font-medium">
                Documentation
              </Link>
              <Link to="/date/pricing" className="text-gray-400 hover:text-white transition-colors">
                Tarifs
              </Link>
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                ← DooDates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Guide complet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-blue-400">Sondages de Dates</span>
          </h1>
          <p className="text-lg text-gray-400">
            Trouvez le meilleur créneau pour vos événements en quelques clics
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
            Démarrage rapide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  1
                </div>
                <h3 className="font-semibold">Créer un sondage</h3>
              </div>
              <p className="text-sm text-gray-400">
                Décrivez votre événement à l'IA : "Réunion d'équipe mardi ou jeudi après-midi" ou
                créez manuellement via le calendrier.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <h3 className="font-semibold">Sélectionner les dates</h3>
              </div>
              <p className="text-sm text-gray-400">
                Cliquez sur les dates dans le calendrier interactif. Ajoutez des créneaux horaires
                si besoin (matin, après-midi, soir).
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  3
                </div>
                <h3 className="font-semibold">Partager le lien</h3>
              </div>
              <p className="text-sm text-gray-400">
                Copiez le lien du sondage et envoyez-le à vos participants par email, message ou
                tout autre moyen.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  4
                </div>
                <h3 className="font-semibold">Choisir la meilleure date</h3>
              </div>
              <p className="text-sm text-gray-400">
                Consultez les résultats en temps réel. L'outil identifie automatiquement le créneau
                avec le plus de disponibilités.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">🎯 Fonctionnalités</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Assistant IA</h3>
                <p className="text-sm text-gray-400">
                  Décrivez votre besoin en langage naturel : "Déjeuner d'équipe vendredi ou samedi
                  midi". L'IA génère automatiquement les dates, horaires et le titre du sondage.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Créneaux horaires flexibles</h3>
                <p className="text-sm text-gray-400">
                  Ajoutez des plages horaires pour chaque date. Cliquez sur la grille horaire pour
                  sélectionner les créneaux souhaités. Choisissez la granularité (15min, 30min, 1h).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">3 niveaux de disponibilité</h3>
                <p className="text-sm text-gray-400">
                  Les participants indiquent : 🟢 Disponible, 🟡 Peut-être (si nécessaire), ou 🔴
                  Indisponible. Visualisez d'un coup d'œil qui peut quand.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Meilleure date automatique</h3>
                <p className="text-sm text-gray-400">
                  L'algorithme identifie le créneau optimal avec le plus de disponibilités. Vue
                  matricielle et pourcentages pour chaque option.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cas d'usage */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">💼 Cas d'usage</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-2">🤝 Réunions d'équipe</h4>
              <p className="text-sm text-gray-400">
                Sprint planning, rétrospectives, points hebdomadaires.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-2">🍽️ Événements sociaux</h4>
              <p className="text-sm text-gray-400">Dîners, sorties entre amis, after-works.</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-2">🎉 Événements familiaux</h4>
              <p className="text-sm text-gray-400">Anniversaires, fêtes, réunions de famille.</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-2">📞 Rendez-vous pro</h4>
              <p className="text-sm text-gray-400">Entretiens, consultations, démos clients.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Comment ajouter des créneaux horaires ?</h4>
              <p className="text-sm text-gray-400">
                Après avoir sélectionné une date, une grille horaire apparaît. Cliquez sur les
                créneaux souhaités dans la grille. Vous pouvez changer la granularité (15min, 30min,
                1h).
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Puis-je modifier un sondage après publication ?</h4>
              <p className="text-sm text-gray-400">
                Oui, vous pouvez ajouter des dates/horaires et prolonger la deadline. Évitez de
                supprimer des options qui ont déjà reçu des votes.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comment gérer les fuseaux horaires ?</h4>
              <p className="text-sm text-gray-400">
                Actuellement, les horaires sont affichés dans le fuseau horaire du créateur. Pour
                les événements internationaux, nous recommandons de préciser le fuseau dans le titre
                ou la description (ex: "Horaires en heure de Paris").
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Les votes peuvent-ils être anonymes ?</h4>
              <p className="text-sm text-gray-400">
                Oui, dans les paramètres vous pouvez activer les votes anonymes. Par défaut, les
                noms des participants sont visibles.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/date/dashboard"
              className="block text-blue-400 hover:text-blue-300 transition-colors"
            >
              → Tableau de bord
            </Link>
            <Link
              to="/workspace/date"
              className="block text-blue-400 hover:text-blue-300 transition-colors"
            >
              → Créer un sondage
            </Link>
            <Link
              to="/date/pricing"
              className="block text-blue-400 hover:text-blue-300 transition-colors"
            >
              → Tarifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
