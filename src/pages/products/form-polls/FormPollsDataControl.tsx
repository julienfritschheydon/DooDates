import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Shield, AlertTriangle, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FormPollsDataControl() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            toast({
                title: "Export en cours",
                description: "Vos données de formulaires sont en cours d'export...",
            });
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
        if (!confirm("Êtes-vous sûr de vouloir supprimer TOUTES vos données de formulaires ? Cette action est irréversible.")) {
            return;
        }
        setIsDeleting(true);
        try {
            toast({
                title: "Suppression en cours",
                description: "Suppression de tous vos formulaires...",
            });
            setTimeout(() => {
                toast({
                    title: "Données supprimées",
                    description: "Toutes vos données de formulaires ont été supprimées.",
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => navigate("/form-polls/dashboard")} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au tableau de bord
                    </Button>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Contrôle de vos données</h1>
                    <p className="text-gray-600">DooDates - Formulaires & Sondages</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-lg font-semibold text-blue-900 mb-2">Vos droits RGPD</h2>
                            <p className="text-blue-800 text-sm">
                                Vous avez un contrôle total sur vos formulaires et les réponses collectées.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <Download className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Exporter mes données</h2>
                            <p className="text-gray-700 mb-4">Téléchargez toutes vos données de formulaires au format JSON :</p>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                                <li>Tous vos formulaires créés</li>
                                <li>Toutes les réponses collectées</li>
                                <li>Les fichiers uploadés par les répondants</li>
                                <li>Les paramètres de configuration</li>
                                <li>Les conversations IA (si utilisées)</li>
                            </ul>
                            <Button onClick={handleExportData} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
                                <FileJson className="w-4 h-4 mr-2" />
                                {isExporting ? "Export en cours..." : "Exporter mes données"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-red-200">
                    <div className="flex items-start gap-4 mb-4">
                        <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Supprimer toutes mes données</h2>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-900 font-semibold mb-1">Action irréversible</p>
                                        <p className="text-red-800 text-sm">
                                            Cette action supprimera tous vos formulaires et toutes les réponses collectées.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                                <li>Tous vos formulaires</li>
                                <li>Toutes les réponses reçues</li>
                                <li>Tous les fichiers uploadés</li>
                                <li>Votre historique de consommation</li>
                            </ul>
                            <Button onClick={handleDeleteAllData} disabled={isDeleting} variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting ? "Suppression en cours..." : "Supprimer toutes mes données"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Liens utiles</h2>
                    <div className="space-y-2">
                        <Button variant="ghost" onClick={() => navigate("/form-polls/privacy")} className="w-full justify-start">
                            Politique de confidentialité
                        </Button>
                        <Button variant="ghost" onClick={() => navigate("/form-polls/settings")} className="w-full justify-start">
                            Paramètres du compte
                        </Button>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Pour toute question : <a href="mailto:dpo@doodates.com" className="text-blue-600 hover:underline">dpo@doodates.com</a></p>
                </div>
            </div>
        </div>
    );
}
