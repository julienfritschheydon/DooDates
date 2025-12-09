import React from "react";
import { Link } from "react-router-dom";
import { ProductButton } from "@/components/products/ProductButton";
import { Check, Sparkles } from "lucide-react";

export default function QuizzPricing() {
  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-300">Tarifs simples</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4">
              Tarifs <span className="text-amber-400">Quiz</span>
            </h1>
            <p className="text-xl text-gray-400">
              L'aide aux devoirs intelligente, accessible à tous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-amber-400">0€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Parfait pour découvrir et tester avec vos enfants
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">5 quiz par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Génération depuis photo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Dictée vocale</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Partage de liens</span>
                </li>
              </ul>
              <Link
                to="/quizz/create"
                className="block w-full py-3 px-6 bg-amber-900/30 text-amber-400 rounded-xl font-medium hover:bg-amber-900/50 transition-colors text-center"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-2xl p-8 border-2 border-amber-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                Populaire
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Famille</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-amber-400">4,99€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Pour un usage régulier avec plusieurs enfants
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Quiz illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Validation IA avancée</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Historique des scores</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Profils enfants multiples</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Support prioritaire</span>
                </li>
              </ul>
              <ProductButton
                product="quizz"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl font-medium hover:from-amber-400 hover:to-yellow-400 transition-colors"
              >
                Passer à Famille
              </ProductButton>
            </div>

            {/* School Plan */}
            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">École</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-amber-400">Sur mesure</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Pour les établissements scolaires et les enseignants
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Tout de Famille +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Classes & groupes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Tableau de bord enseignant</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Export des résultats</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Formation incluse</span>
                </li>
              </ul>
              <ProductButton
                product="quizz"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-amber-900/30 text-amber-400 rounded-xl font-medium hover:bg-amber-900/50 transition-colors"
              >
                Nous contacter
              </ProductButton>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Questions sur les tarifs
            </h2>
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                <h4 className="font-medium text-white mb-2">Puis-je annuler à tout moment ?</h4>
                <p className="text-sm text-gray-400">
                  Oui, vous pouvez annuler votre abonnement à tout moment. Vous conservez l'accès
                  jusqu'à la fin de la période payée.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                <h4 className="font-medium text-white mb-2">Y a-t-il une période d'essai ?</h4>
                <p className="text-sm text-gray-400">
                  Le plan gratuit vous permet de tester toutes les fonctionnalités avec 5 quiz par
                  mois. C'est notre façon de vous laisser essayer avant de vous engager.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                <h4 className="font-medium text-white mb-2">
                  Les quiz créés sont-ils conservés si je change de plan ?
                </h4>
                <p className="text-sm text-gray-400">
                  Oui, tous vos quiz et résultats sont conservés quel que soit votre plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
