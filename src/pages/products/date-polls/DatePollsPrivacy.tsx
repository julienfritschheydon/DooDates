import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DatePollsPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            data-testid="back-to-dashboard-button"
            onClick={() => navigate("/date/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Politique de confidentialité</h1>
          <p className="text-gray-400">DooDates - Sondages de Dates</p>
          <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 décembre 2024</p>
        </div>

        {/* Introduction */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Votre vie privée est notre priorité
              </h2>
              <p className="text-gray-300">
                DooDates - Sondages de Dates vous permet de créer et gérer des sondages pour trouver
                les meilleures dates pour vos événements. Cette politique explique comment nous
                collectons, utilisons et protégeons vos données personnelles.
              </p>
            </div>
          </div>
        </div>

        {/* Données collectées */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Eye className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-white">Données collectées</h2>
          </div>
          <div className="space-y-4 ml-10">
            <div>
              <h3 className="font-semibold text-white mb-2">Pour les créateurs de sondages :</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Adresse email (si vous créez un compte)</li>
                <li>Titre et description de vos sondages de dates</li>
                <li>Options de dates proposées</li>
                <li>Paramètres de configuration (dates limites, visibilité)</li>
                <li>Historique de création et modifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Pour les participants :</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Nom (optionnel, peut être anonyme)</li>
                <li>Choix de dates sélectionnées</li>
                <li>Commentaires (optionnels)</li>
                <li>Adresse IP (pour prévenir les abus)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Utilisation des données */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Lock className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-white">Utilisation de vos données</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-300 mb-3">Nous utilisons vos données uniquement pour :</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Créer et gérer vos sondages de dates</li>
              <li>Permettre aux participants de voter sur les dates proposées</li>
              <li>Afficher les résultats et statistiques de participation</li>
              <li>Envoyer des notifications (si activées)</li>
              <li>Améliorer notre service et corriger les bugs</li>
              <li>Prévenir les abus et garantir la sécurité</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Important :</strong> Nous ne vendons jamais vos données à des tiers. Vos
                sondages de dates restent privés sauf si vous choisissez de les partager.
              </p>
            </div>
          </div>
        </div>

        {/* IA et données */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-white">Intelligence Artificielle</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-300 mb-3">
              Si vous utilisez notre assistant IA pour créer des sondages de dates :
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Vos conversations avec l'IA sont traitées par Google Gemini</li>
              <li>Les données sont chiffrées en transit</li>
              <li>Nous ne conservons que le résultat final (le sondage créé)</li>
              <li>L'historique des conversations est stocké localement dans votre navigateur</li>
              <li>Vous pouvez supprimer vos conversations à tout moment</li>
            </ul>
          </div>
        </div>

        {/* Vos droits */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Download className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-white">Vos droits (RGPD)</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-300 mb-3">Conformément au RGPD, vous avez le droit de :</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                <strong>Accéder</strong> à toutes vos données personnelles
              </li>
              <li>
                <strong>Rectifier</strong> vos informations inexactes
              </li>
              <li>
                <strong>Supprimer</strong> votre compte et toutes vos données
              </li>
              <li>
                <strong>Exporter</strong> vos données au format JSON
              </li>
              <li>
                <strong>Limiter</strong> le traitement de vos données
              </li>
              <li>
                <strong>Vous opposer</strong> au traitement de vos données
              </li>
            </ul>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/date/data-control")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Gérer mes données
              </Button>
            </div>
          </div>
        </div>

        {/* Suppression des données */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Trash2 className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-white">Suppression et conservation</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-300 mb-3">Conservation des données :</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Sondages actifs : conservés tant que vous ne les supprimez pas</li>
              <li>Sondages supprimés : effacés immédiatement de notre base de données</li>
              <li>
                Comptes inactifs : supprimés après 2 ans d'inactivité (avec notification préalable)
              </li>
              <li>Logs de sécurité : conservés 90 jours maximum</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Questions ou préoccupations ?</h2>
          <p className="text-gray-300 mb-4">
            Pour toute question concernant cette politique de confidentialité ou vos données
            personnelles, contactez-nous :
          </p>
          <div className="space-y-2 text-gray-300">
            <p>
              <strong>Email :</strong> privacy@doodates.com
            </p>
            <p>
              <strong>DPO :</strong> dpo@doodates.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
