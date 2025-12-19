import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Shield, AlertTriangle, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DatePollsDataControl() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            // TODO: Implémenter l'export réel des données
            toast({
                title: "Export en cours",
                description: "Vos données de sondages de dates sont en cours d'export...",
            });

            // Simuler l'export
            setTimeout(() => {
                toast({
                    title: "Export terminé",
                    description: "Vos données ont été téléchargées avec succès.",
                });
                setIsExporting(false);
            }, 2000);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'exporter vos données.",
                variant: "destructive",
            });
            setIsExporting(false);
        }
    };

    const handleDeleteAllData = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer TOUTES vos données de sondages de dates ? Cette action est irréversible.")) {
            return;
        }

        setIsDeleting(true);
        try {
            // TODO: Implémenter la suppression réelle
            toast({
                title: "Suppression en cours",
                description: "Suppression de tous vos sondages de dates...",
            });

            setTimeout(() => {
                toast({
                    title: "Données supprimées",
                    description: "Toutes vos données de sondages de dates ont été supprimées.",
                });
                setIsDeleting(false);
            }, 2000);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer vos données.",
                variant: "destructive",
            });
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/date-polls/dashboard")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au tableau de bord
                    </Button>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Contrôle de vos données
                    </h1>
                    <p className="text-gray-400">DooDates - Sondages de Dates</p>
                </div>

                {/* Informations RGPD */}
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-lg font-semibold text-blue-300 mb-2">
                                Vos droits RGPD
                            </h2>
                            <p className="text-blue-200 text-sm">
                                Conformément au Règlement Général sur la Protection des Données (RGPD),
                                vous avez un contrôle total sur vos données personnelles. Cette page vous
                                permet d'exercer vos droits.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exporter mes données */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <Download className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Exporter mes données
                            </h2>
                            <p className="text-gray-300 mb-4">
                                Téléchargez toutes vos données de sondages de dates au format JSON.
                                Cela inclut :
                            </p>
                            <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                                <li>Tous vos sondages de dates créés</li>
                                <li>Les votes et réponses reçus</li>
                                <li>Les paramètres de configuration</li>
                                <li>L'historique de modifications</li>
                                <li>Les conversations IA (si utilisées)</li>
                            </ul>
                            <Button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                {isExporting ? "Export en cours..." : "Exporter mes données"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Supprimer mes données */}
                <div className="bg-gray-800 rounded-lg shadow-sm border-2 border-red-700/50 p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <Trash2 className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Supprimer toutes mes données
                            </h2>
                            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-900 font-semibold mb-1">
                                            Action irréversible
                                        </p>
                                        <p className="text-red-800 text-sm">
                                            Cette action supprimera définitivement tous vos sondages de dates,
                                            votes reçus, et données associées. Cette opération ne peut pas être annulée.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">
                                Seront supprimés :
                            </p>
                            <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                                <li>Tous vos sondages de dates</li>
                                <li>Tous les votes et commentaires reçus</li>
                                <li>Votre historique de consommation de crédits</li>
                                <li>Vos conversations IA liées aux sondages de dates</li>
                            </ul>
                            <Button
                                onClick={handleDeleteAllData}
                                disabled={isDeleting}
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting ? "Suppression en cours..." : "Supprimer toutes mes données"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Liens utiles */}
                <div className="bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Liens utiles
                    </h2>
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/date-polls/privacy")}
                            className="w-full justify-start"
                        >
                            Politique de confidentialité
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/date-polls/settings")}
                            className="w-full justify-start"
                        >
                            Paramètres du compte
                        </Button>
                    </div>
                </div>

                {/* Contact */}
                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>
                        Pour toute question concernant vos données :{" "}
                        <a href="mailto:dpo@doodates.com" className="text-blue-600 hover:underline">
                            dpo@doodates.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
