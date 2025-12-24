import React from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, Clock, Eye, Trash2, Settings, FileText, ChevronRight } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/shared/Footer";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/50 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates respecte votre vie privée et protège vos données personnelles
              en conformité avec le RGPD.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              Dernière mise à jour : 10 Décembre 2025
            </div>
          </div>

          {/* Contact DPO */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 mb-8 group hover:bg-blue-900/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-300">Contact DPO</h2>
            </div>
            <p className="text-blue-200">
              Pour exercer vos droits ou toute question sur vos données :{" "}
              <a
                href="mailto:privacy@doodates.com"
                className="font-semibold text-blue-400 underline decoration-blue-400/30 underline-offset-4 hover:decoration-blue-400 transition-all"
                aria-label="Contacter le DPO par email à privacy@doodates.com"
              >
                privacy@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Données collectées */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Données Collectées</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Sondages de dates</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Email (pour notifications)</li>
                    <li>Réponses aux sondages (dates choisies)</li>
                    <li>Données de création (titre, description)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Formulaires</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Nom, email (si champs obligatoires)</li>
                    <li>Réponses aux questions formulaires</li>
                    <li>Données de création et modification</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Chat IA</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Messages envoyés à l'IA</li>
                    <li>Contexte technique (navigateur, session)</li>
                    <li>Données transférées à Google Gemini (sous-traitant)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Durées de conservation */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Durées de Conservation</h2>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-4 mb-4">
                <p className="text-yellow-300 font-medium">
                  Règle simple : 12 mois maximum pour toutes les données
                </p>
              </div>

              <div className="space-y-2 text-gray-300">
                <p>• Conversations IA : 12 mois maximum</p>
                <p>• Logs techniques : 12 mois maximum</p>
                <p>• Réponses sondages : 12 mois après clôture</p>
                <p>• Comptes utilisateurs : 24 mois après inactivité</p>
                <p>• Purge automatique mensuelle programmée</p>
              </div>
            </section>

            {/* Droits RGPD */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Vos Droits RGPD</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Accès</h3>
                    <p className="text-gray-300 text-sm">
                      Export JSON de vos données via les paramètres ou email
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Modification</h3>
                    <p className="text-gray-300 text-sm">
                      Interface directe dans le chat et les paramètres
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Suppression</h3>
                    <p className="text-gray-300 text-sm">
                      Anonymisation immédiate ou suppression complète par email
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Opt-out</h3>
                    <p className="text-gray-300 text-sm">
                      Désactiver l'utilisation de vos données pour l'amélioration
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Fournisseur IA */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Fournisseur IA (Google Gemini)</h2>
              </div>

              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Statut :</strong> Sous-traitant avec clauses contractuelles types RGPD
                </p>
                <p>
                  <strong>Transferts :</strong> États-Unis avec garanties équivalentes (Privacy Shield)
                </p>
                <p>
                  <strong>Conservation :</strong> 30 jours maximum chez Google, 12 mois côté DooDates
                </p>
                <p>
                  <strong>Entraînement :</strong> Les données ne sont PAS utilisées pour entraîner les modèles
                </p>
                <p>
                  <strong>Sécurité :</strong> Chiffrement TLS 1.3 en transit, AES-256 au repos
                </p>
              </div>

              <div className="mt-4 p-4 bg-gray-700/50 rounded border border-gray-600">
                <p className="text-sm text-gray-300">
                  <strong>Documentation complète :</strong>{" "}
                  <a
                    href="/DooDates/docs/LEGAL/Politique-Confidentialite-IA.md"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Politique de Confidentialité IA
                  </a>
                </p>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Actions Rapides</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Link
                  to="/settings"
                  className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">Gérer mes préférences</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique s'applique à tous les produits DooDates :
              Sondages de dates, Formulaires, Quizz, et Chat IA
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/terms" className="hover:text-gray-300">
                Conditions Générales d'Utilisation
              </Link>
              <span>•</span>
              <Link to="/contact" className="hover:text-gray-300">
                Contact
              </Link>
              <span>•</span>
              <Link to="/about" className="hover:text-gray-300">
                À propos
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

export default Privacy;
