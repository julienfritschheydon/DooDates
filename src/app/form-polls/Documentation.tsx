import React from "react";
import { Link } from "react-router-dom";

/**
 * Page de documentation pour DooDates2 (Formulaires)
 */
export default function FormPollsDocumentation() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/form-polls"
                        className="text-purple-600 dark:text-purple-400 hover:underline mb-4 inline-block"
                    >
                        ← Retour à DooDates2
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Documentation - Formulaires
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Tout ce que vous devez savoir pour créer et gérer vos formulaires
                    </p>
                </div>

                {/* Table of Contents */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        📚 Table des Matières
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <a
                            href="/Docs/products/form-polls/01-Guide-Demarrage-Rapide.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                🚀 Guide de Démarrage Rapide
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Créez votre premier formulaire en 5 minutes
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
                            href="/Docs/USER-DOCUMENTATION/05b-Commandes-IA-Formulaires.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                🤖 Commandes IA pour Formulaires
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Créer des formulaires avec l'IA
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
                                Analyser les réponses
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
                                Gérer tous vos formulaires
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
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        🔗 Liens Rapides
                    </h2>
                    <div className="space-y-2">
                        <Link
                            to="/form-polls/dashboard"
                            className="block text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            → Tableau de bord
                        </Link>
                        <Link
                            to="/form-polls/workspace/form"
                            className="block text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            → Créer un formulaire
                        </Link>
                        <Link
                            to="/form-polls/pricing"
                            className="block text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            → Tarifs
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
