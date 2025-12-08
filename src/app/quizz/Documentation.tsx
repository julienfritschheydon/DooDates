import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Camera,
  Mic,
  Trophy,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BookOpen,
} from "lucide-react";

/**
 * Page de documentation pour les Quiz (Aide aux Devoirs)
 */
export default function QuizzDocumentation() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navigation Header */}
      <header className="border-b border-amber-900/20 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <Link to="/quizz" className="text-xl font-bold text-amber-400">
                Quiz
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/quizz/dashboard"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/quizz/documentation" className="text-amber-400 font-medium">
                Documentation
              </Link>
              <Link
                to="/quizz/pricing"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">Guide complet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Documentation <span className="text-amber-400">Quiz</span>
          </h1>
          <p className="text-lg text-gray-400">
            Tout ce que vous devez savoir pour créer des quiz éducatifs interactifs
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Démarrage rapide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  1
                </div>
                <h3 className="font-semibold">Créer un quiz</h3>
              </div>
              <p className="text-sm text-gray-400">
                Allez sur "Créer un Quiz" et choisissez votre méthode : photo d'exercice ou
                description textuelle.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  2
                </div>
                <h3 className="font-semibold">Génération IA</h3>
              </div>
              <p className="text-sm text-gray-400">
                L'IA Gemini analyse votre contenu et génère automatiquement des questions avec les
                bonnes réponses.
              </p>
              <img
                src="/docs/images/quizz-creation.png"
                alt="Génération de Quiz par IA"
                className="mt-4 rounded-lg border border-white/10 w-full"
              />
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  3
                </div>
                <h3 className="font-semibold">Partager le lien</h3>
              </div>
              <p className="text-sm text-gray-400">
                Copiez le lien du quiz et envoyez-le à votre enfant. Il peut jouer depuis n'importe
                quel appareil.
              </p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  4
                </div>
                <h3 className="font-semibold">Voir les résultats</h3>
              </div>
              <p className="text-sm text-gray-400">
                Consultez les scores et le détail des réponses dans le tableau de bord.
              </p>
              <img
                src="/docs/images/quizz-play.png"
                alt="Interface de jeu Quiz"
                className="mt-4 rounded-lg border border-white/10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">🎯 Fonctionnalités</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Photo → Quiz</h3>
                <p className="text-sm text-gray-400">
                  Prenez en photo un exercice scolaire. L'IA extrait automatiquement les questions
                  et les transforme en quiz interactif. Fonctionne avec les maths, le français, les
                  sciences et plus encore.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dictée vocale</h3>
                <p className="text-sm text-gray-400">
                  Les enfants peuvent répondre en parlant au lieu de taper. Idéal pour les plus
                  jeunes ou pour les réponses longues. Compatible avec la plupart des navigateurs.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Feedback motivant</h3>
                <p className="text-sm text-gray-400">
                  Après chaque réponse, un feedback immédiat indique si c'est correct avec une
                  explication. À la fin, un score avec des messages d'encouragement et des confettis
                  pour les bons scores (≥75%).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Validation intelligente</h3>
                <p className="text-sm text-gray-400">
                  Pour les réponses textuelles, le système tolère les fautes de frappe, les accents
                  manquants et les variations mineures. Pour les questions complexes, l'IA Gemini
                  peut valider les réponses de manière contextuelle.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Types de questions */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">📝 Types de questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="font-medium text-amber-300 mb-2">Choix unique</h4>
              <p className="text-sm text-gray-400">
                Une seule bonne réponse parmi plusieurs options.
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="font-medium text-amber-300 mb-2">Choix multiple</h4>
              <p className="text-sm text-gray-400">Plusieurs bonnes réponses possibles.</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="font-medium text-amber-300 mb-2">Réponse texte</h4>
              <p className="text-sm text-gray-400">
                L'enfant tape sa réponse. Comparaison flexible.
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="font-medium text-amber-300 mb-2">Réponse IA</h4>
              <p className="text-sm text-gray-400">
                Pour les réponses complexes validées par Gemini.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Comment fonctionne l'extraction depuis photo ?</h4>
              <p className="text-sm text-gray-400">
                L'IA Gemini Vision analyse l'image et extrait le texte visible. Elle identifie les
                exercices et les transforme en questions pédagogiques adaptées.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Les quiz sont-ils sauvegardés ?</h4>
              <p className="text-sm text-gray-400">
                Oui, tous les quiz sont sauvegardés localement dans votre navigateur. Vous pouvez
                les retrouver dans le tableau de bord.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comment partager un quiz ?</h4>
              <p className="text-sm text-gray-400">
                Cliquez sur "Copier le lien" dans la liste des quiz ou sur l'écran de résultats. Le
                lien peut être envoyé par message, email ou QR code.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">La dictée vocale ne fonctionne pas ?</h4>
              <p className="text-sm text-gray-400">
                La dictée vocale utilise l'API Web Speech. Elle fonctionne sur Chrome, Edge et la
                plupart des navigateurs modernes. Safari iOS peut avoir des limitations.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">🔗 Liens Rapides</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/quizz/dashboard"
              className="block text-amber-400 hover:text-amber-300 transition-colors"
            >
              → Tableau de bord
            </Link>
            <Link
              to="/quizz/create"
              className="block text-amber-400 hover:text-amber-300 transition-colors"
            >
              → Créer un quiz
            </Link>
            <Link
              to="/quizz/pricing"
              className="block text-amber-400 hover:text-amber-300 transition-colors"
            >
              → Tarifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
