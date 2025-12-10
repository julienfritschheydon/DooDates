import React from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, Clock, Eye, Trash2, Settings, FileText, ChevronRight } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              DooDates respecte votre vie privée et protège vos données personnelles 
              en conformité avec le RGPD.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              Dernière mise à jour : 10 Décembre 2025
            </div>
          </div>

          {/* Contact DPO */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-900">Contact DPO</h2>
            </div>
            <p className="text-blue-800">
              Pour exercer vos droits ou toute question sur vos données :{" "}
              <a href="mailto:privacy@doodates.com" className="font-semibold underline">
                privacy@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Données collectées */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Données Collectées</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sondages de dates</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Email (pour notifications)</li>
                    <li>Réponses aux sondages (dates choisies)</li>
                    <li>Données de création (titre, description)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Formulaires</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Nom, email (si champs obligatoires)</li>
                    <li>Réponses aux questions formulaires</li>
                    <li>Données de création et modification</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Chat IA</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Messages envoyés à l'IA</li>
                    <li>Contexte technique (navigateur, session)</li>
                    <li>Données transférées à Google Gemini (sous-traitant)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Durées de conservation */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Durées de Conservation</h2>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                <p className="text-yellow-800 font-medium">
                  Règle simple : 12 mois maximum pour toutes les données
                </p>
              </div>
              
              <div className="space-y-2 text-gray-600">
                <p>• Conversations IA : 12 mois maximum</p>
                <p>• Logs techniques : 12 mois maximum</p>
                <p>• Réponses sondages : 12 mois après clôture</p>
                <p>• Comptes utilisateurs : 24 mois après inactivité</p>
                <p>• Purge automatique mensuelle programmée</p>
              </div>
            </section>

            {/* Droits RGPD */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Vos Droits RGPD</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Accès</h3>
                    <p className="text-gray-600 text-sm">
                      Export JSON de vos données via les paramètres ou email
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Modification</h3>
                    <p className="text-gray-600 text-sm">
                      Interface directe dans le chat et les paramètres
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Suppression</h3>
                    <p className="text-gray-600 text-sm">
                      Anonymisation immédiate ou suppression complète par email
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Opt-out</h3>
                    <p className="text-gray-600 text-sm">
                      Désactiver l'utilisation de vos données pour l'amélioration
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Fournisseur IA */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Fournisseur IA (Google Gemini)</h2>
              </div>
              
              <div className="space-y-3 text-gray-600">
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
              
              <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-700">
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
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <Link 
                  to="/settings"
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">Gérer mes préférences</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                
                <a 
                  href="/DooDates/docs/LEGAL/RGPD-Audit-Complet.md"
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="font-medium text-gray-900">Voir l'audit RGPD complet</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p className="mb-4">
              Cette politique s'applique à tous les produits DooDates : 
              Sondages de dates, Formulaires, Quizz, et Chat IA
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/terms" className="hover:text-gray-700">
                Conditions Générales d'Utilisation
              </Link>
              <span>•</span>
              <Link to="/contact" className="hover:text-gray-700">
                Contact
              </Link>
              <span>•</span>
              <Link to="/about" className="hover:text-gray-700">
                À propos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
