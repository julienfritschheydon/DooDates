import React from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const FormPollsSecurity: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/form/dashboard")}
              className="text-gray-400 hover:text-white"
              data-testid="formpollssecurity-navigate"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 rounded-full mb-4">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Sécurité des Formulaires</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates s'engage à protéger la sécurité et la confidentialité de vos formulaires.
            </p>
            <div className="mt-6 text-sm text-gray-500">Dernière mise à jour : Janvier 2026</div>
          </div>

          {/* Contact Sécurité Spécifique */}
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-300">
                Contact Sécurité Formulaires
              </h2>
            </div>
            <p className="text-purple-200">
              Pour signaler une vulnérabilité spécifique aux formulaires :{" "}
              <a href="mailto:form-security@doodates.com" className="font-semibold underline">
                form-security@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Architecture de Sécurité */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Sécurité des Données</h2>
              </div>
              <p className="text-gray-300 mb-4">
                Nos formulaires sont conçus avec une approche "Privacy by Design".
              </p>
              <div className="bg-gray-900/50 rounded p-4 font-mono text-sm text-gray-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Validation de schéma stricte pour chaque champ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Nettoyage des entrées pour prévenir les attaques XSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Limitation du nombre de réponses par IP/Utilisateur</span>
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
                  <h3 className="font-semibold text-white mb-2">Réponses chiffrées</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Réponses chiffrées au repos (AES-256)</li>
                    <li>Accès restreint au créateur du formulaire via RLS</li>
                    <li>Possibilité de chiffrer certains champs sensibles</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 rounded-lg p-6 border border-purple-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Liens Utiles</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/form/privacy")}
                  className="flex items-center justify-between p-3 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  data-testid="formpollssecurity-navigate"
                >
                  <span className="font-medium">Confidentialité des Formulaires</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique est spécifique au produit <strong>DooDates Formulaires</strong>.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="mailto:form-support@doodates.com" className="hover:text-gray-300">
                Support
              </a>
              <span>•</span>
              <a href="mailto:form-privacy@doodates.com" className="hover:text-gray-300">
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPollsSecurity;
