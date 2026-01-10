import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizzPollsPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/quizz/dashboard")}
            className="mb-4"
            data-testid="quizzpollsprivacy-navigate"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
          <p className="text-gray-600">DooDates - Quiz & Évaluations</p>
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
                DooDates - Quiz & Évaluations vous permet de créer des quiz, questionnaires et
                évaluations. Cette politique explique comment nous collectons, utilisons et
                protégeons vos données personnelles.
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
              <h3 className="font-semibold text-gray-900 mb-2">Pour les créateurs de quiz :</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Adresse email (si vous créez un compte)</li>
                <li>Titre et description de vos quiz</li>
                <li>Questions, réponses et corrections configurées</li>
                <li>Paramètres de notation et feedback</li>
                <li>Historique de création et modifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pour les participants :</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Nom ou email (selon configuration du quiz)</li>
                <li>Réponses aux questions</li>
                <li>Score et résultats obtenus</li>
                <li>Temps de réponse par question</li>
                <li>Horodatage de soumission</li>
                <li>Adresse IP (pour prévenir la triche)</li>
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
              <li>Créer et gérer vos quiz et évaluations</li>
              <li>Collecter et corriger les réponses des participants</li>
              <li>Calculer les scores et générer les résultats</li>
              <li>Afficher les statistiques de performance</li>
              <li>Exporter les résultats au format CSV/Excel</li>
              <li>Envoyer des notifications de résultats (si activées)</li>
              <li>Améliorer notre service et corriger les bugs</li>
              <li>Prévenir la triche et garantir l'équité</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Important :</strong> Les résultats des quiz vous appartiennent. Nous ne les
                utilisons pas à des fins commerciales et ne les partageons jamais avec des tiers
                sans votre consentement.
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
              Si vous utilisez notre assistant IA pour créer des quiz :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Vos conversations avec l'IA sont traitées par Google Gemini</li>
              <li>Les données sont chiffrées en transit</li>
              <li>Nous ne conservons que le résultat final (le quiz créé)</li>
              <li>L'historique des conversations est stocké localement</li>
              <li>Les réponses des participants ne sont JAMAIS envoyées à l'IA</li>
              <li>L'IA peut aider à générer des questions mais ne corrige pas les réponses</li>
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
                <strong>Exporter</strong> vos quiz et résultats (CSV, JSON)
              </li>
              <li>
                <strong>Demander</strong> la suppression de vos résultats à un quiz
              </li>
            </ul>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/quizz/data-control")}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="quizzpollsprivacy-grer-mes-donnes"
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
              <li>Quiz actifs : conservés tant que vous ne les supprimez pas</li>
              <li>Résultats : conservés avec le quiz parent</li>
              <li>Quiz supprimés : effacés immédiatement avec tous les résultats</li>
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
              <strong>Email :</strong> quizz-privacy@doodates.com
            </p>
            <p>
              <strong>DPO :</strong> quizz-privacy@doodates.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
