import React from "react";
import { Link } from "react-router-dom";
import {
  Headphones,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Github,
  TrendingUp,
  FileText,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/shared/Footer";

export const SupportPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-4">
              <Headphones className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Politique de Support</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates s'engage à fournir un support de qualité à tous ses utilisateurs.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              Dernière mise à jour : Janvier 2026
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-300">Contact Support</h2>
            </div>
            <p className="text-purple-200">
              Pour toute demande de support :{" "}
              <a href="mailto:support@doodates.com" className="font-semibold underline">
                support@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Canaux de Contact */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Canaux de Contact</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Support Email</h3>
                  <p className="text-gray-300">
                    <a href="mailto:support@doodates.com" className="text-blue-400 underline">
                      support@doodates.com
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Support In-App</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Page d'aide : <code className="bg-gray-900 px-2 py-1 rounded">/help</code></li>
                    <li>Feedback : <code className="bg-gray-900 px-2 py-1 rounded">/feedback</code></li>
                    <li>Chat IA intégré (questions générales)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">GitHub Issues (Public)</h3>
                  <p className="text-gray-300">
                    Suivi transparent des bugs et feature requests via GitHub Issues.
                  </p>
                </div>
              </div>
            </section>

            {/* Délais de Réponse */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Délais de Réponse Engagés</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-red-900/30 border border-red-700/50 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-red-300">Priorité Critique</h3>
                  </div>
                  <p className="text-red-200 text-sm mb-2">
                    <strong>Traitement prioritaire immédiat</strong>
                  </p>
                  <p className="text-red-200 text-sm">
                    Application inaccessible, perte de données, problème de sécurité, erreur bloquante
                  </p>
                </div>
                <div className="bg-orange-900/30 border border-orange-700/50 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-orange-300">Priorité Haute</h3>
                  </div>
                  <p className="text-orange-200 text-sm mb-2">
                    <strong>Traitement prioritaire</strong>
                  </p>
                  <p className="text-orange-200 text-sm">
                    Fonctionnalité principale non fonctionnelle, problème de performance significatif
                  </p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-blue-300">Priorité Normale</h3>
                  </div>
                  <p className="text-blue-200 text-sm mb-2">
                    <strong>Traitement standard</strong>
                  </p>
                  <p className="text-blue-200 text-sm">
                    Questions sur l'utilisation, demandes d'information, suggestions
                  </p>
                </div>
                <div className="bg-gray-700/50 border border-gray-600 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-300">Priorité Basse</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">
                    <strong>Traitement au fil de l'eau</strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Feature requests, améliorations UX, optimisations non critiques
                  </p>
                </div>
              </div>
            </section>

            {/* Processus de Traitement */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Processus de Traitement</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Réception</h3>
                    <p className="text-gray-300 text-sm">
                      Accusé de réception automatique, attribution d'un numéro de ticket, classification
                      de la priorité
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Analyse et diagnostic</h3>
                    <p className="text-gray-300 text-sm">
                      Reproduction du problème, investigation technique, communication si délai &gt; 48h
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Résolution</h3>
                    <p className="text-gray-300 text-sm">
                      Développement et test du correctif, déploiement en production, vérification avec
                      l'utilisateur
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Suivi</h3>
                    <p className="text-gray-300 text-sm">
                      Demande de confirmation de résolution, intégration des retours pour prévention
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Système de Suivi Transparent */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Github className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Système de Suivi Transparent</h2>
              </div>
              <div className="space-y-3 text-gray-300">
                <p>
                  Tous les bugs sont suivis publiquement via <strong>GitHub Issues</strong> pour une
                  transparence totale.
                </p>
                <div>
                  <h3 className="font-semibold text-white mb-2">Types d'issues :</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>🐛 Bug : Problème technique à corriger</li>
                    <li>✨ Feature : Nouvelle fonctionnalité demandée</li>
                    <li>📝 Documentation : Amélioration de la documentation</li>
                    <li>🔒 Security : Problème de sécurité (privé si nécessaire)</li>
                  </ul>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4 mt-4">
                  <p className="text-blue-200 text-sm">
                    <strong>Métriques publiques :</strong> Taux de résolution, délai moyen de résolution,
                    taux de satisfaction (publiées après le lancement public)
                  </p>
                </div>
              </div>
            </section>

            {/* Taux de Résolution - Interne -> Section supprimée pour le public */}

            {/* Types de Demandes */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Types de Demandes</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Support Technique</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Bugs et erreurs</li>
                    <li>Problèmes de performance</li>
                    <li>Compatibilité navigateurs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Support Fonctionnel</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Questions d'utilisation</li>
                    <li>Explication des fonctionnalités</li>
                    <li>Questions sur les quotas</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Support Compte</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Problèmes de connexion</li>
                    <li>Demandes RGPD</li>
                    <li>Questions facturation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Support Sécurité</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Signalement de vulnérabilités</li>
                    <li>
                      Contact :{" "}
                      <a href="mailto:security@doodates.com" className="text-blue-400 underline">
                        security@doodates.com
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-6 border border-purple-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Actions Rapides</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Link
                  to="/security"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">Politique de Sécurité</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">Politique de Confidentialité</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique s'applique à tous les produits DooDates : Sondages de dates, Formulaires,
              Quizz, et Chat IA
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/security" className="hover:text-gray-300">
                Sécurité
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-gray-300">
                Confidentialité
              </Link>
              <span>•</span>
              <Link to="/contact" className="hover:text-gray-300">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Footer global */}
      <Footer />
    </div>
  );
};

export default SupportPolicy;

