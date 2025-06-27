import { useParams, useNavigate } from "react-router-dom";
import { VotingInterface } from "@/components/voting/VotingInterface";
import TopNav from "../components/TopNav";

const Vote = () => {
  const { pollId, pollSlug, adminToken } = useParams<{
    pollId?: string;
    pollSlug?: string;
    adminToken?: string;
  }>();
  const navigate = useNavigate();

  // Déterminer l'ID du sondage (soit pollId pour /vote/:pollId, soit pollSlug pour /admin/:pollSlug/:adminToken)
  const actualPollId = pollId || pollSlug;

  if (!actualPollId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <TopNav />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              URL invalide
            </h2>
            <p className="text-gray-600 mb-4">
              L'identifiant du sondage est manquant.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      {/* VotingInterface maintenant gère l'affichage du message admin en interne */}
      <VotingInterface
        pollId={actualPollId}
        onBack={() => navigate("/")}
        adminToken={adminToken}
      />
    </div>
  );
};

export default Vote;
