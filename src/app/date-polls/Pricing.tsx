import React from "react";
import { Link } from "react-router-dom";
import { ProductButton } from "@/components/products/ProductButton";
import { Check } from "lucide-react";

export default function DatePollsPricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <header className="border-b border-blue-900/20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/date-polls" className="text-2xl font-bold text-blue-400">
                DooDates1
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                to="/date-polls/dashboard"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/date-polls/pricing" className="text-blue-400 font-medium">
                Tarifs
              </Link>
              <Link
                to="/date-polls/documentation"
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
            <h1 className="text-4xl font-extrabold text-white mb-4">Tarifs DooDates1</h1>
            <p className="text-xl text-gray-300">Choisissez le plan qui correspond à vos besoins</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-blue-900/30 shadow-lg hover:shadow-blue-900/10 transition-shadow">
              <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-400">0€</span>
                <span className="text-gray-300">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">5 sondages par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Jusqu'à 10 participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Créneaux horaires basiques</span>
                </li>
              </ul>
              <ProductButton
                product="date"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-blue-900/30 text-blue-400 rounded-lg font-medium hover:bg-blue-900/50 transition-colors"
              >
                Commencer gratuitement
              </ProductButton>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-2xl p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Populaire
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-400">9€</span>
                <span className="text-gray-300">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Sondages illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Participants illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Créneaux horaires avancés</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Intégration calendrier</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Support prioritaire</span>
                </li>
              </ul>
              <ProductButton
                product="date"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Passer à Pro
              </ProductButton>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-blue-900/30 shadow-lg hover:shadow-blue-900/10 transition-shadow">
              <h3 className="text-2xl font-bold text-white mb-2">Entreprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-400">Sur mesure</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Tout de Pro +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">SSO / SAML</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">API dédiée</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 font-medium tracking-wide">Support 24/7</span>
                </li>
              </ul>
              <ProductButton
                product="date"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-blue-900/30 text-blue-400 rounded-lg font-medium hover:bg-blue-900/50 transition-colors"
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
