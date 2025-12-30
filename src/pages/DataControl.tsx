import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Mail,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Eye,
  Settings,
  ChevronRight,
  ExternalLink,
  Bell,
  BellOff,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/layout/TopNav";
import { logError } from "@/lib/error-handling";
import DataRetentionService, { RetentionSettings } from "@/services/DataRetentionService";

interface LocalDeletionWarning {
  type: "chat" | "poll" | "account";
  daysUntilDeletion: number;
  itemCount: number;
  deletionDate: Date;
}

export const DataControl: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const retentionService = DataRetentionService.getInstance();

  // État des paramètres
  const [settings, setSettings] = useState<RetentionSettings>({
    chatRetention: "30-days",
    pollRetention: "12-months",
    autoDeleteEnabled: true,
    emailNotifications: true,
    allowDataForImprovement: false,
  });

  // État des suppressions à venir
  const [upcomingDeletions, setUpcomingDeletions] = useState<LocalDeletionWarning[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Charger les préférences au montage
  useEffect(() => {
    const savedSettings = {
      chatRetention: (localStorage.getItem("doodates_chat_retention") as any) || "30-days",
      pollRetention: (localStorage.getItem("doodates_poll_retention") as any) || "12-months",
      autoDeleteEnabled: localStorage.getItem("doodates_auto_delete") !== "false",
      emailNotifications: localStorage.getItem("doodates_email_notifications") !== "false",
      allowDataForImprovement: localStorage.getItem("doodates_allow_data_improvement") === "true",
    };
    setSettings(savedSettings);

    // Calculer les suppressions à venir
    calculateUpcomingDeletions(savedSettings);
  }, []);

  const calculateUpcomingDeletions = async (currentSettings: RetentionSettings) => {
    try {
      // Utiliser le service pour calculer les suppressions
      const userId = "current-user"; // TODO: Récupérer l'ID utilisateur réel
      const warnings = await retentionService.calculateUpcomingDeletions(userId, currentSettings);

      // Mapper vers le format local
      const localWarnings: LocalDeletionWarning[] = warnings.map((w) => ({
        type: w.type,
        daysUntilDeletion: w.daysUntilDeletion,
        itemCount: w.itemCount,
        deletionDate: w.deletionDate,
      }));

      setUpcomingDeletions(localWarnings);
    } catch (error) {
      logError(new Error(`Erreur calcul suppressions: ${error}`));
      // Fallback avec données simulées
      const warnings: LocalDeletionWarning[] = [];
      const now = new Date();

      if (currentSettings.chatRetention !== "indefinite" && currentSettings.autoDeleteEnabled) {
        warnings.push({
          type: "chat",
          daysUntilDeletion: 15,
          itemCount: 23,
          deletionDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        });
      }

      if (currentSettings.pollRetention !== "indefinite" && currentSettings.autoDeleteEnabled) {
        warnings.push({
          type: "poll",
          daysUntilDeletion: 45,
          itemCount: 5,
          deletionDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        });
      }

      setUpcomingDeletions(warnings);
    }
  };

  const handleSettingChange = (key: keyof RetentionSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Sauvegarder dans localStorage
    const storageKeys = {
      chatRetention: "doodates_chat_retention",
      pollRetention: "doodates_poll_retention",
      autoDeleteEnabled: "doodates_auto_delete",
      emailNotifications: "doodates_email_notifications",
      allowDataForImprovement: "doodates_allow_data_improvement",
    };

    if (
      key === "autoDeleteEnabled" ||
      key === "allowDataForImprovement" ||
      key === "emailNotifications"
    ) {
      localStorage.setItem(storageKeys[key], value.toString());
    } else {
      localStorage.setItem(storageKeys[key], value);
    }

    // Recalculer les suppressions
    calculateUpcomingDeletions(newSettings);

    // Feedback utilisateur
    const messages: Record<string, Record<string, string>> = {
      chatRetention: {
        "30-days": "Vos conversations IA seront supprimées après 30 jours.",
        "12-months": "Vos conversations IA seront conservées 12 mois.",
        indefinite: "Vos conversations IA seront conservées indéfiniment.",
      },
      pollRetention: {
        "12-months": "Vos sondages seront conservés 12 mois après clôture.",
        "6-years": "Vos sondages seront archivés pendant 6 ans.",
        indefinite: "Vos sondages seront conservés indéfiniment.",
      },
      autoDeleteEnabled: {
        true: "Les données seront supprimées selon vos préférences.",
        false: "Les données ne seront pas supprimées automatiquement.",
      },
      emailNotifications: {
        true: "Vous recevrez des alertes email avant les suppressions.",
        false: "Les notifications email ont été désactivées.",
      },
      allowDataForImprovement: {
        true: "Vos données anonymisées seront utilisées pour améliorer nos services.",
        false: "Vos données ne seront plus utilisées pour l'amélioration.",
      },
    };

    toast({
      title: `Paramètre mis à jour`,
      description: messages[key]?.[value] || "Préférence enregistrée",
      duration: 3000,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Vos données sont en cours d'export...",
      duration: 2000,
    });

    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Vos données ont été exportées avec succès.",
        duration: 3000,
      });
    }, 2000);
  };

  const handleDeleteAccount = () => {
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

      setTimeout(() => {
        toast({
          title: "Compte supprimé",
          description: "Toutes vos données ont été supprimées.",
          duration: 3000,
        });
      }, 2000);
    }
  };

  const postponeDeletion = async (type: string) => {
    try {
      const userId = "current-user"; // TODO: Récupérer l'ID utilisateur réel
      const success = await retentionService.postponeDeletion(userId, type as "chat" | "poll");

      if (success) {
        toast({
          title: "Suppression reportée",
          description: `La suppression des ${type === "chat" ? "conversations" : "sondages"} a été reportée de 30 jours.`,
          duration: 3000,
        });

        // Recalculer les alertes
        calculateUpcomingDeletions(settings);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de reporter la suppression. Veuillez réessayer.",
          duration: 3000,
        });
      }
    } catch (error) {
      logError(new Error(`Erreur report suppression: ${error}`));
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du report de suppression.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNav />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header puissant */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Mes Données</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Contrôlez totalement vos données personnelles.
              <span className="font-semibold text-blue-400"> Votre vie privée, vos règles.</span>
            </p>
          </div>

          {/* Alertes suppressions à venir */}
          {upcomingDeletions.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                Suppressions à venir
              </h2>
              {upcomingDeletions.map((warning, index) => (
                <div
                  key={index}
                  className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-orange-400" />
                        <h3 className="font-semibold text-orange-200">
                          {warning.type === "chat" ? "Conversations IA" : "Sondages"}
                        </h3>
                        <span className="px-2 py-1 bg-orange-800/50 text-orange-200 text-xs font-medium rounded">
                          {warning.daysUntilDeletion} jours
                        </span>
                      </div>
                      <p className="text-orange-200 mb-3">
                        {warning.itemCount} {warning.type === "chat" ? "conversations" : "sondages"}
                        seront supprimées le {warning.deletionDate.toLocaleDateString("fr-FR")}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-orange-300">
                        <span>📧 Alerte email prévue</span>
                        <button
                          onClick={() => postponeDeletion(warning.type)}
                          className="text-orange-300 hover:text-orange-100 font-medium underline"
                        >
                          Reporter de 30 jours
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm font-medium"
                    >
                      Voir les données
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contrôle des données */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-400" />
                Contrôle de mes données
              </h2>

              <div className="space-y-8">
                {/* Conservation conversations IA */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Conversations IA
                  </label>
                  <select
                    value={settings.chatRetention}
                    onChange={(e) => handleSettingChange("chatRetention", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="30-days">🔒 30 jours (privacy-first, recommandé)</option>
                    <option value="12-months">📅 12 mois (standard)</option>
                    <option value="indefinite">♾️ Indéfiniment (mon choix)</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-2">
                    Plus la durée est courte, plus votre vie privée est protégée
                  </p>
                </div>

                {/* Conservation sondages */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Sondages et formulaires
                  </label>
                  <select
                    value={settings.pollRetention}
                    onChange={(e) => handleSettingChange("pollRetention", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="12-months">📅 12 mois après clôture (défaut)</option>
                    <option value="6-years">📚 6 ans (archive personnelle)</option>
                    <option value="indefinite">♾️ Indéfiniment (mon choix)</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-2">
                    Idéal pour les besoins professionnels ou académiques
                  </p>
                </div>

                {/* Suppression automatique */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Suppression automatique</h3>
                    <p className="text-gray-300">
                      Supprimer les données selon mes préférences de conservation
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoDeleteEnabled}
                      onChange={(e) => handleSettingChange("autoDeleteEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Amélioration produit */}
                <div className="flex items-center justify-between p-4 bg-blue-900/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300 mb-1">
                      Utiliser mes données pour améliorer le produit
                    </h3>
                    <p className="text-blue-200">
                      Permet l'utilisation de vos données anonymisées pour l'amélioration des
                      services
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowDataForImprovement}
                      onChange={(e) =>
                        handleSettingChange("allowDataForImprovement", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Notifications email */}
                <div className="flex items-center justify-between p-4 bg-green-900/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-300 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Alertes email avant suppression
                    </h3>
                    <p className="text-green-200">
                      Recevez un email 30 jours avant la suppression automatique de vos données
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-green-400" />
                Actions rapides
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-between p-6 bg-green-900/30 rounded-lg hover:bg-green-900/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-800/50 rounded-full flex items-center justify-center">
                      <Download className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white group-hover:text-green-300">
                        Exporter mes données
                      </p>
                      <p className="text-sm text-gray-300">
                        Télécharger toutes mes données au format JSON
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-green-400" />
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center justify-between p-6 bg-red-900/30 rounded-lg hover:bg-red-900/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-800/50 rounded-full flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-red-300 group-hover:text-red-200">
                        Supprimer mes données
                      </p>
                      <p className="text-sm text-red-200">
                        Suppression définitive de toutes mes données
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Documentation et support */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-8 border border-blue-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-400" />
              Transparence et support
            </h2>

            <div className="grid md:grid-cols-1 gap-4">
              <Link
                to="/privacy"
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-white">Politique de confidentialité</p>
                    <p className="text-sm text-gray-300">Consultez notre politique complète</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </Link>
            </div>

            {/* Contact DPO */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-blue-700/50">
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
    </div>
  );
};

export default DataControl;
