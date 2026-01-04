import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AvailabilityPollsPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/availability/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
          <p className="text-gray-600">DooDates - Sondages de Disponibilité</p>
          <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 16 décembre 2024</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Votre vie privée est notre priorité
              </h2>
              <p className="text-gray-700">
                DooDates - Sondages de Disponibilité vous permet de trouver les créneaux horaires
                qui conviennent à tous les participants. Cette politique explique comment nous
                collectons, utilisons et protégeons vos données personnelles.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Eye className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">Données collectées</h2>
          </div>
          <div className="space-y-4 ml-10">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pour les organisateurs :</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Adresse email (si vous créez un compte)</li>
                <li>Titre et description de vos sondages de disponibilité</li>
                <li>Créneaux horaires proposés (dates et heures)</li>
                <li>Paramètres de configuration (fuseau horaire, durée, limites)</li>
                <li>Historique de création et modifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pour les participants :</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Nom (optionnel, peut être anonyme)</li>
                <li>Créneaux de disponibilité sélectionnés</li>
                <li>Préférences de créneaux (si activées)</li>
                <li>Commentaires (optionnels)</li>
                <li>Adresse IP (pour prévenir les abus)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">Utilisation de vos données</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-700 mb-3">Nous utilisons vos données uniquement pour :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Créer et gérer vos sondages de disponibilité</li>
              <li>Permettre aux participants d'indiquer leurs disponibilités</li>
              <li>Calculer et afficher les créneaux optimaux</li>
              <li>Afficher les résultats et statistiques de participation</li>
              <li>Envoyer des notifications de rappel (si activées)</li>
              <li>Améliorer notre service et corriger les bugs</li>
              <li>Prévenir les abus et garantir la sécurité</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Important :</strong> Vos disponibilités personnelles ne sont visibles que
                par l'organisateur du sondage. Nous ne vendons jamais vos données.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">Intelligence Artificielle</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-700 mb-3">
              Si vous utilisez notre assistant IA pour créer des sondages :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Vos conversations avec l'IA sont traitées par Google Gemini</li>
              <li>Les données sont chiffrées en transit</li>
              <li>Nous ne conservons que le résultat final (le sondage créé)</li>
              <li>L'historique des conversations est stocké localement</li>
              <li>Les disponibilités des participants ne sont JAMAIS envoyées à l'IA</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Download className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">Vos droits (RGPD)</h2>
          </div>
          <div className="ml-10">
            <p className="text-gray-700 mb-3">Conformément au RGPD, vous avez le droit de :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
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
                <strong>Retirer</strong> vos disponibilités d'un sondage
              </li>
            </ul>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/availability/data-control")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Gérer mes données
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <h2 className="text-xl font-semibold text-gray-900">Suppression et conservation</h2>
          </div>
          <div className="ml-10">
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Sondages actifs : conservés tant que vous ne les supprimez pas</li>
              <li>Sondages supprimés : effacés immédiatement</li>
              <li>Comptes inactifs : supprimés après 2 ans (avec notification)</li>
              <li>Logs de sécurité : conservés 90 jours maximum</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Questions ou préoccupations ?
          </h2>
          <p className="text-gray-700 mb-4">
            Pour toute question concernant cette politique de confidentialité :
          </p>
          <div className="space-y-2 text-gray-700">
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
