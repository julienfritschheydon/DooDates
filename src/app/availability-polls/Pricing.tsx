import React from "react";
import { Link } from "react-router-dom";
import { ProductButton } from "@/components/products/ProductButton";
import { Check } from "lucide-react";

export default function AvailabilityPollsPricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Header */}
      <header className="border-b border-emerald-900/20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/availability" className="text-2xl font-bold text-emerald-400">
                DooDates3
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                to="/availability/dashboard"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Tableau de bord
              </Link>
              <Link to="/availability/pricing" className="text-emerald-400 font-medium">
                Tarifs
              </Link>
              <Link
                to="/availability/documentation"
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
            <h1 className="text-4xl font-extrabold text-white mb-4">Tarifs DooDates3</h1>
            <p className="text-xl text-gray-400">Synchronisez vos équipes en toute simplicité</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-emerald-900/30">
              <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-emerald-400">0€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">3 grilles par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Jusqu'à 5 participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Vue semaine</span>
                </li>
              </ul>
              <ProductButton
                product="availability"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-emerald-900/30 text-emerald-400 rounded-lg font-medium hover:bg-emerald-900/50 transition-colors"
              >
                Commencer gratuitement
              </ProductButton>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 rounded-2xl p-8 border-2 border-emerald-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Populaire
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-emerald-400">15€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Grilles illimitées</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Participants illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Fuseaux horaires</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Sync calendrier</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Notifications auto</span>
                </li>
              </ul>
              <ProductButton
                product="availability"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Passer à Pro
              </ProductButton>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-emerald-900/30">
              <h3 className="text-2xl font-bold text-white mb-2">Entreprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-emerald-400">Sur mesure</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Tout de Pro +</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Intégration Outlook/Google</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Gestion d'équipes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">SLA garanti</span>
                </li>
              </ul>
              <ProductButton
                product="availability"
                variantRole="primary"
                size="lg"
                className="w-full py-3 px-6 bg-emerald-900/30 text-emerald-400 rounded-lg font-medium hover:bg-emerald-900/50 transition-colors"
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
