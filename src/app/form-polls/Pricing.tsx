import React from "react";
import { Link } from "react-router-dom";
import { ProductButton } from "@/components/products/ProductButton";
import { Check } from "lucide-react";

export default function FormPollsPricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <header className="border-b border-violet-900/20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/form" className="text-2xl font-bold text-violet-400">
                DooDates2
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                to="/form/dashboard"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/form/pricing" className="text-violet-400 font-medium">
                Tarifs
              </Link>
              <Link
                to="/form/documentation"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                Accueil DooDates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-white mb-4">Tarifs DooDates2</h1>
            <p className="text-xl text-gray-400">Des formulaires puissants pour tous vos besoins</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-violet-900/30">
              <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-violet-400">0€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">3 formulaires par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Jusqu'à 50 réponses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Questions basiques</span>
                </li>
              </ul>
              <ProductButton
                product="form"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-violet-900/30 text-violet-400 rounded-lg font-medium hover:bg-violet-900/50 transition-colors"
              >
                Commencer gratuitement
              </ProductButton>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 rounded-2xl p-8 border-2 border-violet-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Populaire
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-violet-400">12€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Formulaires illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Réponses illimitées</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Tous types de questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Logique conditionnelle</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Export des données</span>
                </li>
              </ul>
              <ProductButton
                product="form"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                Passer à Pro
              </ProductButton>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-violet-900/30">
              <h3 className="text-2xl font-bold text-white mb-2">Entreprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-violet-400">Sur mesure</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Tout de Pro +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Branding personnalisé</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Webhooks</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Support dédié</span>
                </li>
              </ul>
              <ProductButton
                product="form"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-violet-900/30 text-violet-400 rounded-lg font-medium hover:bg-violet-900/50 transition-colors"
              >
                Nous contacter
              </ProductButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
