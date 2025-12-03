import React from "react";
import { Link } from "react-router-dom";

/**
 * Page de documentation pour DooDates3 (Sondages de Disponibilité)
 */
export default function AvailabilityPollsDocumentation() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/availability-polls"
                        className="text-green-600 dark:text-green-400 hover:underline mb-4 inline-block"
                    >
                        ← Retour à DooDates3
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Documentation - Sondages de Disponibilité
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Tout ce que vous devez savoir pour trouver les disponibilités communes
                    </p>
                </div>

                {/* Table of Contents */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        📚 Table des Matières
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <a
                            href="/Docs/products/availability-polls/01-Guide-Demarrage-Rapide.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                🚀 Guide de Démarrage Rapide
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Créez votre premier sondage en 5 minutes
                            </p>
                        </a>

                        <a
                            href="/Docs/USER-DOCUMENTATION/02-Concepts-Base.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                📖 Concepts de Base
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Comprendre les fondamentaux
                            </p>
                        </a>

                        <a
                            href="/Docs/USER-DOCUMENTATION/05-Assistant-IA.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                🤖 Assistant IA
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Maîtriser les commandes IA
                            </p>
                        </a>

                        <a
                            href="/Docs/USER-DOCUMENTATION/06-Gestion-Resultats.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                📊 Gestion des Résultats
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Analyser les disponibilités
                            </p>
                        </a>

                        <a
                            href="/Docs/USER-DOCUMENTATION/07-Tableau-Bord.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                🎯 Tableau de Bord
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Gérer tous vos sondages
                            </p>
                        </a>

                        <a
                            href="/Docs/USER-DOCUMENTATION/08-FAQ.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                ❓ FAQ
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Questions fréquentes
                            </p>
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        🔗 Liens Rapides
                    </h2>
                    <div className="space-y-2">
                        <Link
                            to="/availability-polls/dashboard"
                            className="block text-green-600 dark:text-green-400 hover:underline"
                        >
                            → Tableau de bord
                        </Link>
                        <Link
                            to="/availability-polls/workspace/availability"
                            className="block text-green-600 dark:text-green-400 hover:underline"
                        >
                            → Créer un sondage
                        </Link>
                        <Link
                            to="/availability-polls/pricing"
                            className="block text-green-600 dark:text-green-400 hover:underline"
                        >
                            → Tarifs
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
