import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  MessageSquare,
  ListChecks,
  PenLine,
  Star,
} from "lucide-react";

/**
 * Page de documentation pour DooDates2 (Formulaires)
 * Style moderne inspiré de la documentation Quiz
 */
export default function FormPollsDocumentation() {
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
              <Link to="/form-polls" className="text-xl font-bold text-purple-400">
                Formulaires
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/form/dashboard"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/form/documentation" className="text-purple-400 font-medium">
                Documentation
              </Link>
              <Link
                to="/form/pricing"
                className="text-gray-400 hover:text-white transition-colors"
              >
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Guide complet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-purple-400">Formulaires</span>
          </h1>
          <p className="text-lg text-gray-400">
            Créez des enquêtes et questionnaires professionnels avec l'aide de l'IA
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Démarrage rapide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  1
                </div>
                <h3 className="font-semibold">Décrire votre besoin</h3>
              </div>
              <p className="text-sm text-gray-400">
                Dites à l'IA ce que vous voulez : "Créer une enquête de satisfaction client" ou
                "Questionnaire d'inscription à un événement".
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  2
                </div>
                <h3 className="font-semibold">Génération automatique</h3>
              </div>
              <p className="text-sm text-gray-400">
                L'IA génère les questions pertinentes avec les types de réponses adaptés (choix,
                texte, échelle, NPS...).
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  3
                </div>
                <h3 className="font-semibold">Personnaliser</h3>
              </div>
              <p className="text-sm text-gray-400">
                Modifiez les questions, ajoutez des champs obligatoires, activez la logique
                conditionnelle ou le mode multi-étapes.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  4
                </div>
                <h3 className="font-semibold">Analyser les réponses</h3>
              </div>
              <p className="text-sm text-gray-400">
                Visualisez les résultats avec graphiques automatiques. L'IA Analytics détecte les
                tendances et génère des insights.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">🎯 Fonctionnalités</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Génération IA</h3>
                <p className="text-sm text-gray-400">
                  Décrivez votre objectif et l'IA crée un formulaire complet avec les bonnes
                  questions. Économisez des heures de conception.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">8 types de questions</h3>
                <p className="text-sm text-gray-400">
                  Choix unique, choix multiples, texte court/long, échelle de notation, NPS (0-10),
                  matrice Likert, et sélection de dates.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Logique conditionnelle</h3>
                <p className="text-sm text-gray-400">
                  Affichez des questions selon les réponses précédentes. Si "Non satisfait" →
                  afficher "Que pouvons-nous améliorer ?".
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics IA</h3>
                <p className="text-sm text-gray-400">
                  Insights automatiques, détection de tendances, corrélations et recommandations.
                  Posez des questions sur vos données en langage naturel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Types de questions */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">📝 Types de questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">Choix unique</h4>
              <p className="text-sm text-gray-400">Une seule réponse possible (radio buttons).</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">Choix multiples</h4>
              <p className="text-sm text-gray-400">Plusieurs réponses possibles (checkboxes).</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">Texte court / long</h4>
              <p className="text-sm text-gray-400">Réponse libre sur une ligne ou plusieurs.</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">Rating ★★★★★</h4>
              <p className="text-sm text-gray-400">Note de 1 à 5 étoiles.</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">NPS (0-10)</h4>
              <p className="text-sm text-gray-400">Net Promoter Score pour mesurer la fidélité.</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <h4 className="font-medium text-purple-300 mb-2">Matrice Likert</h4>
              <p className="text-sm text-gray-400">Évaluer plusieurs items sur la même échelle.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Comment fonctionne la logique conditionnelle ?</h4>
              <p className="text-sm text-gray-400">
                Créez des règles "Si Q1 = Non → Afficher Q2". Combinez plusieurs conditions avec ET
                (toutes doivent être vraies). Testez avec la prévisualisation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Qu'est-ce que le mode multi-étapes ?</h4>
              <p className="text-sm text-gray-400">
                Une question par écran avec barre de progression. Améliore le taux de complétion de
                +15% sur mobile.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Puis-je exporter les résultats ?</h4>
              <p className="text-sm text-gray-400">
                Oui, export en CSV, PDF, JSON ou Markdown. Les graphiques sont générés
                automatiquement pour les questions à choix.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Combien de réponses pour des insights fiables ?</h4>
              <p className="text-sm text-gray-400">
                10-30 réponses : tendances générales. 30-100 : bonne fiabilité. 100+ : insights très
                précis avec corrélations.
              </p>
            </div>
          </div>
        </div>

        {/* Documentation avancée */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">📚 Aller plus loin</h2>
          <p className="text-gray-400 mb-4">
            Consultez la documentation avancée pour des guides détaillés sur les 8 types de
            questions, la logique conditionnelle, les Analytics IA, la simulation de réponses, et
            plus encore.
          </p>
          <Link
            to="/form/documentation/advanced"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            Documentation avancée →
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
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
            <Link
              to="/form/pricing"
              className="block text-purple-400 hover:text-purple-300 transition-colors"
            >
              → Tarifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
