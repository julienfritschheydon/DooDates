import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowLeft,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Mail,
  Keyboard,
  Smartphone,
  HelpCircle,
  Lightbulb,
  BookOpen,
} from "lucide-react";

/**
 * Page de documentation avancée pour les Sondages de Dates
 * Contenu détaillé migré depuis FullGuide.md
 */
export default function DatePollsDocumentationAdvanced() {
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
              <Link to="/date-polls" className="text-xl font-bold text-blue-400">
                Sondages de Dates
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/date-polls/documentation"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                ← Documentation
              </Link>
              <Link
                to="/date-polls/dashboard"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Tableau de bord
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/date-polls/documentation"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la documentation
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 ml-4">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Guide avancé</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-blue-400">Avancée</span>
          </h1>
          <p className="text-lg text-gray-400">
            Guide complet avec tous les détails techniques et cas d'usage
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">📑 Sommaire</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <a href="#selection" className="text-blue-400 hover:text-blue-300">
              1. Sélection de dates
            </a>
            <a href="#horaires" className="text-blue-400 hover:text-blue-300">
              2. Gestion des horaires
            </a>
            <a href="#vote" className="text-blue-400 hover:text-blue-300">
              3. Voter sur un sondage
            </a>
            <a href="#resultats" className="text-blue-400 hover:text-blue-300">
              4. Analyser les résultats
            </a>
            <a href="#finaliser" className="text-blue-400 hover:text-blue-300">
              5. Finaliser et confirmer
            </a>
            <a href="#modifier" className="text-blue-400 hover:text-blue-300">
              6. Modifier un sondage
            </a>
            <a href="#conseils" className="text-blue-400 hover:text-blue-300">
              7. Conseils et astuces
            </a>
            <a href="#faq" className="text-blue-400 hover:text-blue-300">
              8. FAQ détaillée
            </a>
          </div>
        </div>

        {/* Section 1: Sélection de dates */}
        <div id="selection" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            Sélection de dates
          </h2>

          <h3 className="text-lg font-medium mb-3">Interface Calendrier</h3>
          <pre className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 mb-6 overflow-x-auto">
            {`┌─────────────────────────────────────────────┐
│  ◀ Novembre 2025 ▶                          │
├─────────────────────────────────────────────┤
│  L   M   M   J   V   S   D                  │
│                  1   2   3                   │
│  4   5   6  [7] [8]  9  10                  │ ← Cliquez pour sélectionner
│ 11 [12] 13 [14] 15  16  17                  │
│ 18  19  20  21  22  23  24                  │
│ 25  26  27  28  29  30                      │
└─────────────────────────────────────────────┘`}
          </pre>

          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            Raccourcis clavier
          </h3>
          <div className="grid gap-2 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">←</kbd>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">→</kbd>
              <span className="text-gray-400">Naviguer entre les mois</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">Espace</kbd>
              <span className="text-gray-400">Sélectionner/désélectionner la date active</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-sm">Ctrl</kbd>
              <span className="text-gray-400">+ Clic : Sélection multiple non-continue</span>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3">Sélection rapide</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              • <strong>Clic simple</strong> : Sélectionne la date entière (toute la journée)
            </li>
            <li>
              • <strong>Clic + Glisser</strong> : Sélectionne une plage de dates (ex: 12 → 15)
            </li>
          </ul>
        </div>

        {/* Section 2: Horaires */}
        <div id="horaires" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            Gestion des horaires
          </h2>

          <h3 className="text-lg font-medium mb-3">Créneaux prédéfinis</h3>
          <div className="grid gap-3 md:grid-cols-2 mb-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-2xl">🌅</span>
              <h4 className="font-medium text-blue-300">Matin</h4>
              <p className="text-sm text-gray-400">9h - 12h</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-2xl">☀️</span>
              <h4 className="font-medium text-blue-300">Après-midi</h4>
              <p className="text-sm text-gray-400">14h - 17h</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-2xl">🌙</span>
              <h4 className="font-medium text-blue-300">Soir</h4>
              <p className="text-sm text-gray-400">18h - 21h</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-2xl">🌍</span>
              <h4 className="font-medium text-blue-300">Toute la journée</h4>
              <p className="text-sm text-gray-400">8h - 18h</p>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3">Copier les horaires</h3>
          <p className="text-gray-400 mb-3">
            Après avoir configuré les horaires d'une date, vous pouvez les copier vers d'autres
            dates :
          </p>
          <pre className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
            {`Mardi 12 nov : 9h-11h, 14h-16h
  ↓
[Copier vers d'autres dates]
  ☑ Mercredi 13 nov
  ☑ Jeudi 14 nov`}
          </pre>
        </div>

        {/* Section 3: Vote */}
        <div id="vote" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            Voter sur un sondage
          </h2>

          <h3 className="text-lg font-medium mb-3">3 niveaux de disponibilité</h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-300">🟢 Disponible</h4>
                <p className="text-sm text-gray-400">Cliquez 1 fois → "Je suis disponible"</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-300">🟡 Peut-être</h4>
                <p className="text-sm text-gray-400">
                  Cliquez 2 fois → "Je peux me libérer si nécessaire"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-red-300">🔴 Indisponible</h4>
                <p className="text-sm text-gray-400">
                  Cliquez 3 fois → "Je ne suis pas disponible"
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            Interface mobile
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 bg-white/[0.02] rounded-lg text-center">
              <span className="text-2xl">←</span>
              <p className="text-sm text-gray-400 mt-1">Swipe gauche</p>
              <p className="text-xs text-red-400">Indisponible</p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg text-center">
              <span className="text-2xl">↔</span>
              <p className="text-sm text-gray-400 mt-1">Tap</p>
              <p className="text-xs text-yellow-400">Peut-être</p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg text-center">
              <span className="text-2xl">→</span>
              <p className="text-sm text-gray-400 mt-1">Swipe droite</p>
              <p className="text-xs text-green-400">Disponible</p>
            </div>
          </div>
        </div>

        {/* Section 4: Résultats */}
        <div id="resultats" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Analyser les résultats
          </h2>

          <h3 className="text-lg font-medium mb-3">Vue matricielle</h3>
          <pre className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 mb-6 overflow-x-auto">
            {`                   12/11  12/11  14/11
                   9h-11h 14h-16h 14h-16h
Alice Martin        ✓      ✓      ✓
Bob Chen            ✓      ✓      ✓
Claire Dubois       ✓      ✓      ✓
Grace Kim           ✗      ✓      ✗
Henry Taylor        ✗      ✗      ✗

Légende : ✓ Disponible | ? Peut-être | ✗ Indisponible`}
          </pre>

          <h3 className="text-lg font-medium mb-3">Statistiques détaillées</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <p className="text-gray-400 text-sm">📊 Participation</p>
              <p className="text-lg font-semibold">8/8 (100%)</p>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <p className="text-gray-400 text-sm">⏱️ Temps moyen de vote</p>
              <p className="text-lg font-semibold">42 secondes</p>
            </div>
          </div>
        </div>

        {/* Section 5: Finaliser */}
        <div id="finaliser" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-400" />
            Finaliser et confirmer
          </h2>

          <h3 className="text-lg font-medium mb-3">Notification automatique</h3>
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <p className="text-blue-400 text-sm mb-2">📧 Email envoyé à tous les participants :</p>
            <pre className="text-sm text-gray-300">
              {`Objet : ✅ Réunion Sprint Planning confirmée

La réunion a été fixée au :
📅 Mardi 12 novembre 2025
⏰ 14h00 - 16h00
📍 Salle de conf A

Ajoutez-le à votre calendrier :
• Google Calendar : [Lien]
• Outlook : [Lien]
• iCal : [Télécharger .ics]`}
            </pre>
          </div>

          <h3 className="text-lg font-medium mb-3">Actions post-confirmation</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="font-medium text-blue-300">1. Clôturer le sondage</h4>
              <p className="text-sm text-gray-400">
                Plus de votes possibles, lien inactif, résultats figés
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="font-medium text-blue-300">2. Envoyer des rappels</h4>
              <p className="text-sm text-gray-400">
                24h avant : "N'oubliez pas !" / 1h avant : "La réunion commence bientôt"
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="font-medium text-blue-300">3. Créer un événement récurrent</h4>
              <p className="text-sm text-gray-400">
                Générer un nouveau sondage pour chaque occurrence
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Modifier */}
        <div id="modifier" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            Modifier un sondage
          </h2>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
              <h4 className="font-medium text-green-300">✅ Autorisé</h4>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• Ajouter des dates/horaires</li>
                <li>• Prolonger la deadline</li>
                <li>• Changer la description</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mb-2" />
              <h4 className="font-medium text-yellow-300">⚠️ Déconseillé</h4>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• Supprimer des dates</li>
                <li>• Changer les horaires</li>
              </ul>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400 mb-2" />
              <h4 className="font-medium text-red-300">❌ Bloqué</h4>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• Supprimer dates avec 5+ votes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 7: Conseils */}
        <div id="conseils" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-blue-400" />
            Conseils et astuces
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">1. Nombre de créneaux optimal</h3>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-green-400 font-bold">✅ 3-5 créneaux</p>
                  <p className="text-xs text-gray-400">Idéal</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                  <p className="text-yellow-400 font-bold">⚠️ 6-10 créneaux</p>
                  <p className="text-xs text-gray-400">Acceptable</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg text-center">
                  <p className="text-red-400 font-bold">❌ 10+ créneaux</p>
                  <p className="text-xs text-gray-400">Trop complexe</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">2. Espacer les options</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">❌ Mauvais</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lundi 9h-11h, Lundi 11h-13h, Lundi 13h-15h
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">✅ Bon</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lundi 9h-11h, Mercredi 14h-16h, Vendredi 10h-12h
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">3. Deadline appropriée</h3>
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-blue-400 font-mono">Deadline = Date événement - (3 à 7 jours)</p>
                <p className="text-sm text-gray-400 mt-2">
                  Exemple : Événement le 15 novembre → Deadline le 8 novembre
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: FAQ */}
        <div id="faq" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            FAQ détaillée
          </h2>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Puis-je créer un sondage récurrent ?</h4>
              <p className="text-sm text-gray-400 mb-2">Pas directement, mais vous pouvez :</p>
              <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
                <li>Créer le premier sondage</li>
                <li>Après finalisation, cliquer "Dupliquer"</li>
                <li>Modifier les dates pour la prochaine occurrence</li>
                <li>Partager à nouveau</li>
              </ol>
              <p className="text-sm text-blue-400 mt-2">
                💡 Astuce : Utilisez l'IA : "Crée un sondage comme le précédent mais pour la semaine
                prochaine"
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Comment gérer les fuseaux horaires ?</h4>
              <p className="text-sm text-gray-400 mb-2">
                DooDates détecte automatiquement votre fuseau horaire.
              </p>
              <p className="text-sm text-gray-400">
                Pour événements internationaux : Ajoutez dans la description "⏰ Horaires en UTC+1
                (Paris)"
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Puis-je limiter le nombre de participants ?</h4>
              <p className="text-sm text-gray-400">
                Oui : Paramètres → "Nombre max de participants" → 10. Après 10 votes, le lien
                devient inactif avec le message "Sondage complet".
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/date-polls/documentation"
              className="block text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Documentation simple
            </Link>
            <Link
              to="/date-polls/dashboard"
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
          </div>
        </div>
      </div>
    </div>
  );
}
