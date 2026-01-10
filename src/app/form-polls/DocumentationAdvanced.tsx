import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  ListChecks,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Brain,
  Star,
  HelpCircle,
  BookOpen,
  Eye,
  Mail,
} from "lucide-react";

/**
 * Page de documentation avancée pour les Formulaires
 * Contenu détaillé migré depuis FullGuide.md
 */
export default function FormPollsDocumentationAdvanced() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navigation Header */}
      <header className="border-b border-purple-900/20 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <Link to="/form" className="text-xl font-bold text-purple-400">
                Formulaires
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/form/documentation"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                ← Documentation
              </Link>
              <Link
                to="/form/dashboard"
                className="text-gray-400 hover:text-purple-400 transition-colors"
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
            to="/form/documentation"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la documentation
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 ml-4">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Guide avancé</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-purple-400">Avancée</span>
          </h1>
          <p className="text-lg text-gray-400">
            Types de questions, logique conditionnelle, Analytics IA et plus
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">📑 Sommaire</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <a href="#types" className="text-purple-400 hover:text-purple-300">
              1. Types de questions (8)
            </a>
            <a href="#logique" className="text-purple-400 hover:text-purple-300">
              2. Logique conditionnelle
            </a>
            <a href="#multistep" className="text-purple-400 hover:text-purple-300">
              3. Mode multi-étapes
            </a>
            <a href="#simulation" className="text-purple-400 hover:text-purple-300">
              4. Simulation de réponses
            </a>
            <a href="#analytics" className="text-purple-400 hover:text-purple-300">
              5. Analytics IA
            </a>
            <a href="#visibilite" className="text-purple-400 hover:text-purple-300">
              6. Visibilité des résultats
            </a>
            <a href="#checklist" className="text-purple-400 hover:text-purple-300">
              7. Checklist publication
            </a>
            <a href="#depannage" className="text-purple-400 hover:text-purple-300">
              8. Dépannage
            </a>
          </div>
        </div>

        {/* Section 1: Types de questions */}
        <div id="types" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <ListChecks className="w-6 h-6 text-purple-400" />
            Types de questions (8)
          </h2>

          <div className="space-y-6">
            {/* Choix unique */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">1. Choix Unique (Radio)</h3>
              <p className="text-sm text-gray-400 mb-3">Sélectionner une seule option</p>
              <pre className="bg-black/30 rounded-lg p-3 text-sm text-gray-300">
                {`Question : Quelle est votre boisson préférée ?
⚫ Café
○ Thé
○ Jus de fruits
○ Eau`}
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                Usage : Préférences exclusives, classification, Oui/Non
              </p>
            </div>

            {/* Choix multiple */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">2. Choix Multiple (Checkboxes)</h3>
              <p className="text-sm text-gray-400 mb-3">Sélectionner plusieurs options</p>
              <pre className="bg-black/30 rounded-lg p-3 text-sm text-gray-300">
                {`Question : Quels langages maîtrisez-vous ?
☑ JavaScript
☑ Python
☐ Java
☑ TypeScript`}
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                Config : Min/Max sélections, option "Autre"
              </p>
            </div>

            {/* Texte */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-medium text-purple-300 mb-2">3. Texte Court</h3>
                <p className="text-sm text-gray-400">Réponse sur une ligne (300 car.)</p>
                <p className="text-xs text-gray-400 mt-2">
                  Validation : Email, Téléphone, URL, Nombre
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-medium text-purple-300 mb-2">4. Texte Long</h3>
                <p className="text-sm text-gray-400">Réponse multiligne (2000 car.)</p>
                <p className="text-xs text-gray-400 mt-2">
                  Usage : Commentaires, suggestions, témoignages
                </p>
              </div>
            </div>

            {/* Rating et NPS */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" /> 5. Rating
                </h3>
                <p className="text-sm text-gray-400">Note de 1 à 5 étoiles</p>
                <p className="text-lg mt-2">★★★★☆ (4/5)</p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-medium text-purple-300 mb-2">6. NPS (0-10)</h3>
                <p className="text-sm text-gray-400">Net Promoter Score</p>
                <p className="text-xs text-gray-400 mt-2">
                  Promoteurs (9-10) - Détracteurs (0-6) = Score NPS
                </p>
              </div>
            </div>

            {/* Matrix */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">7. Matrix (Likert Scale)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Évaluer plusieurs items sur la même échelle
              </p>
              <pre className="bg-black/30 rounded-lg p-3 text-sm text-gray-300 overflow-x-auto">
                {`                    Mauvais | Moyen | Bon | Excellent
Qualité produit        ○       ○      ⚫       ○
Rapport qualité/prix   ○       ⚫      ○       ○
Service client         ○       ○      ○       ⚫`}
              </pre>
            </div>

            {/* Date */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">8. Date (Calendrier)</h3>
              <p className="text-sm text-gray-400">Sélection de dates et horaires avec grille</p>
              <p className="text-xs text-gray-400 mt-2">
                Granularité : 15min, 30min, 1h | Options : Peut-être, Anonyme
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Logique conditionnelle */}
        <div id="logique" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            Logique conditionnelle
          </h2>

          <p className="text-gray-400 mb-4">
            Afficher ou masquer des questions selon les réponses précédentes.
          </p>

          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <p className="text-purple-400 text-sm mb-2">Exemple :</p>
            <pre className="text-sm text-gray-300">
              {`Q1. Êtes-vous satisfait de notre service ?
    ○ Oui
    ⚫ Non
    ○ Neutre

Si "Non" → Afficher Q2
Si "Oui" → Afficher Q3

Q2. [Visible si Q1 = Non]
    Que pouvons-nous améliorer ?

Q3. [Visible si Q1 = Oui]
    Nous recommanderiez-vous ? (NPS 0-10)`}
            </pre>
          </div>

          <h3 className="text-lg font-medium mb-3">Logique ET (AND)</h3>
          <div className="p-4 bg-purple-500/10 rounded-lg mb-6">
            <pre className="text-sm text-gray-300">
              {`Afficher Q5 si :
  (Q1 = "Non" ET Q2 contient "Prix")

→ Q5 visible seulement si les DEUX conditions sont vraies`}
            </pre>
            <p className="text-xs text-gray-400 mt-3">
              ⚠️ Note : Seule la logique ET est supportée actuellement. Toutes les conditions
              doivent être vraies pour afficher la question.
            </p>
          </div>

          <h3 className="text-lg font-medium mb-3">Bonnes pratiques</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-sm text-gray-400">✅ Max 3 niveaux de profondeur</p>
              <p className="text-sm text-gray-400">✅ Testez toutes les branches</p>
              <p className="text-sm text-gray-400">✅ Questions conditionnelles = optionnelles</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400 mb-2" />
              <p className="text-sm text-gray-400">❌ Boucles infinies</p>
              <p className="text-sm text-gray-400">❌ Plus de 5 règles par question</p>
              <p className="text-sm text-gray-400">❌ Conditions sur texte libre</p>
            </div>
          </div>
        </div>

        {/* Section 3: Multi-étapes */}
        <div id="multistep" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-400" />
            Mode Multi-Étapes
          </h2>

          <p className="text-gray-400 mb-4">Une question par écran avec barre de progression.</p>

          <h3 className="text-lg font-medium mb-3">Statistiques DooDates</h3>
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            <div className="p-4 bg-purple-500/10 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-400">+15%</p>
              <p className="text-sm text-gray-400">Taux de complétion</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-400">-20%</p>
              <p className="text-sm text-gray-400">Temps par question</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-400">90%</p>
              <p className="text-sm text-gray-400">Préférence mobile</p>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3">Quand l'utiliser ?</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm text-gray-400">✅ Formulaires longs (10+ questions)</p>
              <p className="text-sm text-gray-400">✅ Public mobile-first</p>
              <p className="text-sm text-gray-400">✅ Questions nécessitant réflexion</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <p className="text-sm text-gray-400">❌ Formulaires courts (&lt; 5 questions)</p>
              <p className="text-sm text-gray-400">❌ Besoin de vue d'ensemble</p>
              <p className="text-sm text-gray-400">❌ Questions interdépendantes</p>
            </div>
          </div>
        </div>

        {/* Section 4: Simulation */}
        <div
          id="simulation"
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            Simulation de réponses IA
          </h2>

          <p className="text-gray-400 mb-4">
            Génération de réponses fictives mais réalistes pour tester votre formulaire.
          </p>

          <h3 className="text-lg font-medium mb-3">Pourquoi simuler ?</h3>
          <div className="grid gap-2 mb-6">
            <div className="p-2 bg-white/[0.02] rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Vérifier la logique conditionnelle</span>
            </div>
            <div className="p-2 bg-white/[0.02] rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Aperçu des graphiques de résultats</span>
            </div>
            <div className="p-2 bg-white/[0.02] rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Estimer la durée de complétion</span>
            </div>
            <div className="p-2 bg-white/[0.02] rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Détecter les questions ambiguës</span>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3">Paramètres</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <p className="text-lg font-bold">20</p>
              <p className="text-xs text-gray-400">Rapide</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center border-2 border-purple-500">
              <p className="text-lg font-bold">50</p>
              <p className="text-xs text-gray-400">Recommandé</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <p className="text-lg font-bold">100</p>
              <p className="text-xs text-gray-400">Complet</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Quota : 1 simulation (50 réponses) = 1 crédit IA. Données supprimées après 24h.
          </p>
        </div>

        {/* Section 5: Analytics IA */}
        <div id="analytics" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Analytics IA
          </h2>

          <p className="text-gray-400 mb-4">
            Système d'analyse automatique qui détecte tendances, corrélations et insights.
          </p>

          <h3 className="text-lg font-medium mb-3">5 types d'insights</h3>
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="text-sm font-medium text-purple-300">📈 Tendances générales</h4>
              <p className="text-xs text-gray-400">
                "78% des répondants sont satisfaits (+15% vs dernier trimestre)"
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="text-sm font-medium text-purple-300">🔗 Corrélations</h4>
              <p className="text-xs text-gray-400">
                "NPS ≥ 9 → mentionnent 'rapidité' (corrélation 0.87)"
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="text-sm font-medium text-purple-300">🚨 Anomalies</h4>
              <p className="text-xs text-gray-400">"15 nov : satisfaction 32% (vs moyenne 76%)"</p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="text-sm font-medium text-purple-300">👥 Segmentation</h4>
              <p className="text-xs text-gray-400">
                "25-34 ans : 2x plus susceptibles de recommander"
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <h4 className="text-sm font-medium text-purple-300">🎯 Points d'amélioration</h4>
              <p className="text-xs text-gray-400">
                "'Délai livraison' = 64% commentaires négatifs"
              </p>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-3">Quotas par plan</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="p-3 bg-white/[0.02] rounded-lg text-center">
              <p className="text-lg font-bold">100</p>
              <p className="text-xs text-gray-400">Invité</p>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg text-center">
              <p className="text-lg font-bold">1000</p>
              <p className="text-xs text-gray-400">Gratuit</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <p className="text-lg font-bold">∞</p>
              <p className="text-xs text-gray-400">Pro</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <p className="text-lg font-bold">∞+</p>
              <p className="text-xs text-gray-400">Premium</p>
            </div>
          </div>
        </div>

        {/* Section 6: Visibilité */}
        <div
          id="visibilite"
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Eye className="w-6 h-6 text-purple-400" />
            Visibilité des résultats
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">🔒 Moi uniquement (par défaut)</h3>
              <p className="text-sm text-gray-400">Seul le créateur voit les résultats.</p>
              <p className="text-xs text-gray-400 mt-1">
                Usage : Enquêtes RH, feedback confidentiel
              </p>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">
                👥 Personnes ayant voté (recommandé)
              </h3>
              <p className="text-sm text-gray-400">
                Créateur + votants peuvent voir les résultats.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Usage : Sondages de groupe, décisions d'équipe
              </p>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <h3 className="font-medium text-purple-300 mb-2">🌍 Public</h3>
              <p className="text-sm text-gray-400">Tout le monde peut voir (même sans voter).</p>
              <p className="text-xs text-gray-400 mt-1">
                ⚠️ Attention : peut créer un biais de réponses
              </p>
            </div>
          </div>
        </div>

        {/* Section 7: Checklist */}
        <div id="checklist" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-purple-400" />
            Checklist avant publication
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">📝 Contenu</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>☐ Titre clair et engageant</p>
                <p>☐ Description avec durée estimée</p>
                <p>☐ Pas de fautes d'orthographe</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">🏗️ Structure</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>☐ Ordre logique (facile → difficile)</p>
                <p>☐ Maximum 15 questions</p>
                <p>☐ Questions obligatoires ≤ 30%</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">🔧 Technique</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>☐ Simulation effectuée (30+ réponses)</p>
                <p>☐ Prévisualisation mobile testée</p>
                <p>☐ Temps de complétion &lt; 5 minutes</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">📤 Diffusion</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>☐ Lien de partage testé</p>
                <p>☐ Message d'accompagnement rédigé</p>
                <p>☐ Deadline configurée</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Dépannage */}
        <div id="depannage" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            Dépannage
          </h2>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2 text-yellow-400">⚠️ "Vous avez déjà voté"</h4>
              <p className="text-sm text-gray-400 mb-2">Cause : Cookie de vote déjà présent</p>
              <ul className="text-sm text-gray-400 list-disc list-inside">
                <li>Cliquez sur "Modifier mon vote"</li>
                <li>Ou supprimez les cookies de doodates.com</li>
                <li>Ou utilisez un autre appareil/navigateur</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-yellow-400">
                ⚠️ Questions conditionnelles invisibles
              </h4>
              <p className="text-sm text-gray-400 mb-2">Cause : Logique mal configurée</p>
              <ul className="text-sm text-gray-400 list-disc list-inside">
                <li>Vérifiez la condition exacte (= vs ≠)</li>
                <li>Testez en mode aperçu</li>
                <li>Attention aux options "Neutre" oubliées</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-yellow-400">⚠️ "Quota IA épuisé"</h4>
              <p className="text-sm text-gray-400">
                Solutions : Attendez le reset (1er du mois), passez en Pro, ou désactivez les
                insights automatiques.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/form/documentation"
              className="block text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Documentation simple
            </Link>
            <Link
              to="/form/dashboard"
              className="block text-purple-400 hover:text-purple-300 transition-colors"
            >
              → Tableau de bord
            </Link>
            <Link
              to="/workspace/form"
              className="block text-purple-400 hover:text-purple-300 transition-colors"
            >
              → Créer un formulaire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
