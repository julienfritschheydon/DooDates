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

export const QuizzPollsSecurity: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/quizz/dashboard")}
              className="text-gray-400 hover:text-white"
              data-testid="quizzpollssecurity-navigate"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-900/50 rounded-full mb-4">
              <Shield className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Sécurité des Quizz</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              DooDates s'engage à protéger l'intégrité et la sécurité de vos quizz.
            </p>
            <div className="mt-6 text-sm text-gray-500">Dernière mise à jour : Janvier 2026</div>
          </div>

          {/* Contact Sécurité Spécifique */}
          <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-orange-300">Contact Sécurité Quizz</h2>
            </div>
            <p className="text-orange-200">
              Pour signaler une vulnérabilité spécifique aux quizz :{" "}
              <a href="mailto:quizz-security@doodates.com" className="font-semibold underline">
                quizz-security@doodates.com
              </a>
            </p>
          </div>

          {/* Sections principales */}
          <div className="space-y-8">
            {/* Architecture de Sécurité */}
            <section className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-white">Intégrité des Quizz</h2>
              </div>
              <p className="text-gray-300 mb-4">
                La sécurité des quizz garantit l'équité et la protection des réponses.
              </p>
              <div className="bg-gray-900/50 rounded p-4 font-mono text-sm text-gray-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Protection contre la triche et le multi-vote</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Validation des scores côté serveur uniquement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Chiffrement des bonnes réponses avant soumission</span>
                </div>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-lg p-6 border border-orange-700/50">
              <h2 className="text-xl font-bold text-white mb-4">Liens Utiles</h2>
              <div className="grid md:grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/quizz/privacy")}
                  className="flex items-center justify-between p-3 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  data-testid="quizzpollssecurity-navigate"
                >
                  <span className="font-medium">Confidentialité des Quizz</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </section>
          </div>

          {/* Footer intégré */}
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
            <p className="mb-4">
              Cette politique est spécifique au produit <strong>DooDates Quizz</strong>.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="mailto:quizz-support@doodates.com" className="hover:text-gray-300">
                Support
              </a>
              <span>•</span>
              <a href="mailto:quizz-privacy@doodates.com" className="hover:text-gray-300">
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizzPollsSecurity;
