import React, { useState } from "react";
import {
  Shield,
  Settings,
  FileText,
  Download,
  Trash2,
  Clock,
  Mail,
  Eye,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/layout/TopNav";

type TabType = "settings" | "privacy" | "data";

interface ProductSettingsProps {
  productName: string;
  productType: "date" | "form" | "availability" | "quizz";
}

export const ProductSettings: React.FC<ProductSettingsProps> = ({ productName, productType }) => {
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Définir les couleurs de gradient par produit
  const getProductGradient = () => {
    switch (productType) {
      case "date":
        return "from-blue-500 to-cyan-400"; // Bleu clair (calendrier)
      case "form":
        return "from-purple-500 to-pink-500"; // Violet/Rose (formulaires)
      case "availability":
        return "from-green-500 to-emerald-400"; // Vert (disponibilité)
      case "quizz":
        return "from-orange-500 to-yellow-400"; // Orange/Jaune (quizz)
      default:
        return "from-blue-500 to-purple-600"; // Défaut
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Vos données sont en cours d'export...",
      duration: 2000,
    });
  };

  const handleDeleteData = () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.",
      )
    ) {
      toast({
        title: "Suppression en cours",
        description: "Vos données sont en cours de suppression...",
        duration: 2000,
      });
    }
  };

  // Helper pour les couleurs dynamiques
  const getProductColor = (type: string) => {
    switch (type) {
      case "date":
        return "blue";
      case "form":
        return "purple";
      case "availability":
        return "green";
      case "quizz":
        return "amber";
      default:
        return "blue";
    }
  };

  const color = getProductColor(productType);
  // Maps de classes pour remplacer les injections dynamiques complexes non standards
  const activeTabClasses = {
    date: "bg-blue-600 text-white shadow-lg",
    form: "bg-purple-600 text-white shadow-lg",
    availability: "bg-green-600 text-white shadow-lg",
    quizz: "bg-amber-600 text-white shadow-lg",
  };

  const toggleBgClasses = {
    date: "peer-checked:bg-blue-600",
    form: "peer-checked:bg-purple-600",
    availability: "peer-checked:bg-green-600",
    quizz: "peer-checked:bg-amber-600",
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getProductGradient()} rounded-full mb-4`}
            >
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
            <p className="text-gray-400">{productName}</p>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-2 mb-8 bg-gray-800 p-1 rounded-lg border border-gray-700 overflow-x-auto"
            role="tablist"
            aria-label="Paramètres du produit"
          >
            <button
              type="button"
              role="tab"
              id="tab-settings"
              aria-selected={activeTab === "settings"}
              aria-controls="panel-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeTab === "settings"
                  ? activeTabClasses[productType as keyof typeof activeTabClasses]
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              data-testid="productsettings-tabsettings"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Paramètres
            </button>
            <button
              type="button"
              role="tab"
              id="tab-privacy"
              aria-selected={activeTab === "privacy"}
              aria-controls="panel-privacy"
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeTab === "privacy"
                  ? activeTabClasses[productType as keyof typeof activeTabClasses]
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              data-testid="productsettings-tabprivacy"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Confidentialité
            </button>
            <button
              type="button"
              role="tab"
              id="tab-data"
              aria-selected={activeTab === "data"}
              aria-controls="panel-data"
              onClick={() => setActiveTab("data")}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeTab === "data"
                  ? activeTabClasses[productType as keyof typeof activeTabClasses]
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              data-testid="productsettings-tabdata"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Mes Données
            </button>
          </div>

          {/* Tab Content */}
          <div
            className="space-y-6"
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Préférences générales</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-white">Notifications email</h3>
                        <p className="text-sm text-gray-400">
                          Recevoir des notifications par email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked
                          aria-label="Activer les notifications email"
                        />
                        <div
                          className={`w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${color}-300/30 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${toggleBgClasses[productType as keyof typeof toggleBgClasses]}`}
                        ></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Conservation des données</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="data-retention-select"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Durée de conservation
                      </label>
                      <select
                        id="data-retention-select"
                        aria-label="Durée de conservation des données"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>30 jours (recommandé)</option>
                        <option>12 mois</option>
                        <option>Indéfiniment</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Eye className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Données collectées</h2>
                      <p className="text-gray-300 mb-4">
                        Nous collectons uniquement les données nécessaires au fonctionnement du
                        service.
                      </p>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Email (pour notifications)</li>
                        <li>Réponses aux sondages</li>
                        <li>Données de création (titre, description)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Lock className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Utilisation des données</h2>
                      <p className="text-gray-300 mb-4">
                        Vos données sont utilisées uniquement pour :
                      </p>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Créer et gérer vos sondages</li>
                        <li>Envoyer des notifications (si activées)</li>
                        <li>Améliorer notre service</li>
                      </ul>
                      <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
                        <p className="text-sm text-blue-200">
                          <strong>Important :</strong> Nous ne vendons jamais vos données à des
                          tiers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Durées de conservation</h2>
                      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-4 mb-4">
                        <p className="text-yellow-300 font-medium">
                          Règle simple : 12 mois maximum pour toutes les données
                        </p>
                      </div>
                      <ul className="text-gray-300 space-y-2">
                        <li>• Conversations IA : 12 mois maximum</li>
                        <li>• Sondages : 12 mois après clôture</li>
                        <li>• Comptes inactifs : 24 mois</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Vos droits RGPD</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex gap-3">
                          <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-white">Accès</h3>
                            <p className="text-gray-300 text-sm">Export de vos données</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-white">Suppression</h3>
                            <p className="text-gray-300 text-sm">Suppression complète</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Control Tab */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <div>
                      <h2 className="text-lg font-semibold text-blue-300">Vos droits RGPD</h2>
                      <p className="text-sm text-blue-200">
                        Vous avez un contrôle total sur vos données personnelles
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Download className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-2">Exporter mes données</h2>
                      <p className="text-gray-300 mb-4">
                        Téléchargez toutes vos données au format JSON
                      </p>
                      <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        data-testid="productsettings-button"
                      >
                        <Download className="w-4 h-4 inline mr-2" />
                        Exporter mes données
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border-2 border-red-700/50 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Trash2 className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-2">Supprimer mes données</h2>
                      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-300 font-semibold mb-1">Action irréversible</p>
                            <p className="text-red-200 text-sm">
                              Cette action supprimera définitivement toutes vos données.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        data-testid="productsettings-button"
                      >
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        Supprimer toutes mes données
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact DPO */}
          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
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

export default ProductSettings;
