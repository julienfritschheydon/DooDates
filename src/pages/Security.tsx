import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ChevronRight,
  Server,
  Key,
  Users,
} from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/shared/Footer";

export const Security: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Politique de Sécurité</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates s'engage à protéger la sécurité et la confidentialité des données de ses
              utilisateurs.
            </p>
            <div className="mt-6 text-sm text-gray-500">Dernière mise à jour : Janvier 2026</div>
          </div>

          {/* Contact Sécurité */}
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-green-300">Contact Sécurité</h2>
            </div>
            <p className="text-green-200">
              Pour signaler une vulnérabilité :{" "}
              <a href="mailto:security@doodates.com" className="font-semibold underline">
                security@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Architecture de Sécurité */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Architecture de Sécurité</h2>
              </div>
              <p className="text-gray-300 mb-4">
                DooDates utilise une <strong>architecture de défense en profondeur</strong> avec
                plusieurs couches de sécurité.
              </p>
              <div className="bg-gray-900/50 rounded p-4 font-mono text-sm text-gray-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Client : Token JWT Supabase, aucun appel API direct</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Edge Functions : Vérification JWT, quotas, rate limiting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Base de données : RLS activé, chiffrement AES-256</span>
                </div>
              </div>
            </section>

            {/* Chiffrement */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Chiffrement</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">En Transit</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>TLS 1.3 pour toutes les communications</li>
                    <li>HTTPS obligatoire avec redirection automatique</li>
                    <li>HSTS activé</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Au Repos</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Chiffrement AES-256 natif Supabase</li>
                    <li>Backups chiffrés avec clés gérées par Supabase</li>
                    <li>Mots de passe hachés avec bcrypt</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Authentification & Autorisation */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Authentification & Autorisation</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Authentification</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Supabase Auth (GoTrue) : Email/mot de passe, OAuth</li>
                    <li>Tokens JWT avec expiration courte (15 minutes)</li>
                    <li>Refresh tokens avec rotation automatique</li>
                    <li>2FA planifiée</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Autorisation</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Row Level Security (RLS) activé sur toutes les tables</li>
                    <li>Contrôle d'accès granulaire par utilisateur</li>
                    <li>Permissions différenciées (créateur, participant, invité)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Signalement de Vulnérabilités */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Signalement de Vulnérabilités</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Comment signaler ?</h3>
                  <p className="text-gray-300 mb-2">
                    Email :{" "}
                    <a href="mailto:security@doodates.com" className="text-blue-400 underline">
                      security@doodates.com
                    </a>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Sujet :{" "}
                    <code className="bg-gray-900 px-2 py-1 rounded">
                      [SECURITY] Description brève
                    </code>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Processus de traitement</h3>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Accusé de réception</strong> : Sous 24 heures
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Évaluation</strong> : Sous 48h (critiques) ou 7 jours
                        (non-critiques)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Correction</strong> : Développement et test d'un correctif
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Déploiement</strong> : Mise en production
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/50 rounded p-4">
                  <p className="text-blue-200 text-sm">
                    <strong>Engagements :</strong> Réponse rapide (&lt; 48h critiques),
                    confidentialité, reconnaissance dans le hall of fame, pas de poursuites pour
                    chercheurs de bonne foi.
                  </p>
                </div>
              </div>
            </section>

            {/* Mesures Anti-Abus */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Mesures Anti-Abus</h2>
              </div>
              <div className="space-y-3 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-1">Protection des Quotas</h3>
                  <p className="text-sm">
                    Vérification serveur (impossible de bypass), transactions atomiques, rate
                    limiting par utilisateur et IP.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Protection contre le Spam</h3>
                  <p className="text-sm">
                    Cooldowns, validation des données, blacklist si nécessaire.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Protection des Données</h3>
                  <p className="text-sm">
                    Minimisation, pseudonymisation, anonymisation disponible pour les utilisateurs.
                  </p>
                </div>
              </div>
            </section>

            {/* Bonnes Pratiques */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">
                  Bonnes Pratiques pour les Utilisateurs
                </h2>
              </div>
              <div className="space-y-3 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-1">Protection de votre compte</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Utilisez un mot de passe fort et unique</li>
                    <li>Activez la 2FA si disponible</li>
                    <li>Déconnectez-vous sur les appareils partagés</li>
                    <li>Ne cliquez pas sur des liens suspects</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Partage de sondages</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Évitez de partager des informations personnelles sensibles</li>
                    <li>Utilisez la fonction d'anonymisation si nécessaire</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Audits de Sécurité */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Audits de Sécurité</h2>
              </div>
              <div className="space-y-3 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-1">Audits internes</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Révision trimestrielle des pratiques de sécurité</li>
                    <li>Tests de pénétration réguliers (planifiés)</li>
                    <li>Scan de dépendances automatisé (GitHub Dependabot)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Audits externes</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Encouragement des audits par la communauté</li>
                    <li>Audit professionnel planifié (post-lancement)</li>
                    <li>Certifications visées : ISO 27001, SOC 2 Type II</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Historique des Failles */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Historique des Failles Corrigées</h2>
              </div>
              <div className="bg-gray-900/50 rounded p-4">
                <p className="text-gray-400 text-sm text-center">
                  Aucune faille signalée à ce jour
                </p>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-6 border border-green-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Actions Rapides</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">Politique de Confidentialité</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  to="/support-policy"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">Politique de Support</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique s'applique à tous les produits DooDates : Sondages de dates,
              Formulaires, Quizz, et Chat IA
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/privacy" className="hover:text-gray-300">
                Confidentialité
              </Link>
              <span>•</span>
              <Link to="/support-policy" className="hover:text-gray-300">
                Support
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

export default Security;
