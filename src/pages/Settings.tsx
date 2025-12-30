import React from "react";
import { Shield, Mail, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="settings-title">
              Paramètres
            </h1>
            <p className="text-gray-400">Gérez vos préférences et vos données personnelles</p>
          </div>

          {/* Carte principale : Contrôle des données */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-xl shadow-sm border border-blue-700/50 mb-6 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Contrôle total de vos données</h2>
                  <p className="text-gray-300">
                    Gérez la conservation, l'export et la suppression de vos données
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/data-control")}
                className="w-full flex items-center justify-between p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all group border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-800/50 transition-colors">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white text-lg">🔒 Mes Données</p>
                    <p className="text-gray-300">
                      Contrôlez la durée de conservation, recevez des alertes avant suppression,
                      exportez ou supprimez toutes vos données
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Autres paramètres */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Autres options</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/privacy"
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-white">Politique de confidentialité</p>
                    <p className="text-sm text-gray-400">Consultez notre politique complète</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
          </div>

          {/* Contact DPO */}
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-blue-300">Contact DPO</p>
                <p className="text-sm text-blue-200">
                  Pour toute question sur vos données :{" "}
                  <a href="mailto:privacy@doodates.com" className="underline hover:text-white">
                    privacy@doodates.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
