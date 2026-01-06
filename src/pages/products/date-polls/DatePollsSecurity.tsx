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

export const DatePollsSecurity: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/date/dashboard")}
              className="text-gray-400 hover:text-white"
              data-testid="datepollssecurity-navigate"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/50 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Sécurité des Sondages de Dates</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates s'engage à protéger la sécurité et la confidentialité de vos sondages de
              dates.
            </p>
            <div className="mt-6 text-sm text-gray-500">Dernière mise à jour : Janvier 2026</div>
          </div>

          {/* Contact Sécurité Spécifique */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-300">Contact Sécurité Sondages</h2>
            </div>
            <p className="text-blue-200">
              Pour signaler une vulnérabilité spécifique aux sondages de dates :{" "}
              <a href="mailto:date-security@doodates.com" className="font-semibold underline">
                date-security@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Architecture de Sécurité */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Sécurité de l'Infrastructure</h2>
              </div>
              <p className="text-gray-300 mb-4">
                Nos sondages de dates bénéficient d'une infrastructure robuste et isolée.
              </p>
              <div className="bg-gray-900/50 rounded p-4 font-mono text-sm text-gray-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Isolation des données par sondage via Supabase RLS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Validation stricte des votes et des dates en backend</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Protection contre les injections et le spam sur les votes</span>
                </div>
              </div>
            </section>

            {/* Chiffrement */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Chiffrement des Sondages</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Transit & Repos</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>TLS 1.3 pour tous les échanges de votes</li>
                    <li>Chiffrement AES-256 des titres et options de sondages</li>
                    <li>Anonymisation des participants sur demande du créateur</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Signalement de Vulnérabilités */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Signalement Spécifique</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Si vous découvrez un moyen de bypasser un quota ou de voter plusieurs fois
                  anormalement :
                </p>
                <p className="text-gray-300">
                  Email :{" "}
                  <a href="mailto:date-security@doodates.com" className="text-blue-400 underline">
                    date-security@doodates.com
                  </a>
                </p>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Liens Utiles</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/date/privacy")}
                  className="flex items-center justify-between p-3 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  data-testid="datepollssecurity-navigate"
                >
                  <span className="font-medium">Confidentialité des Sondages</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/date/data-control")}
                  className="flex items-center justify-between p-3 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  data-testid="datepollssecurity-navigate"
                >
                  <span className="font-medium">Contrôle des Données</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique est spécifique au produit <strong>DooDates Sondages de Dates</strong>.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="mailto:date-support@doodates.com" className="hover:text-gray-300">
                Support
              </a>
              <span>•</span>
              <a href="mailto:date-privacy@doodates.com" className="hover:text-gray-300">
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatePollsSecurity;
