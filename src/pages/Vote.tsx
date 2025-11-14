import { useParams, useNavigate } from "react-router-dom";
import { VotingInterface } from "@/components/voting/VotingInterface";
import React from "react";
import { getPollBySlugOrId } from "@/lib/pollStorage";
import { X } from "lucide-react";
import FormPollVote from "@/components/polls/FormPollVote";

const Vote = () => {
  const { pollId, pollSlug, adminToken, slug } = useParams<{
    pollId?: string;
    pollSlug?: string;
    adminToken?: string;
    slug?: string;
  }>();
  const navigate = useNavigate();

  // Déterminer l'ID du sondage (soit pollId pour /vote/:pollId, soit pollSlug pour /poll/:pollSlug/results/:adminToken, soit slug pour /poll/:slug)
  const actualPollId = pollId || pollSlug || slug;

  if (!actualPollId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 pb-8">
        <div className="pt-20">
          <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">URL invalide</h2>
              <p className="text-gray-600 mb-4">L'identifiant du sondage est manquant.</p>
              <button
                onClick={() => navigate("/")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Router vers le bon flux selon le type de sondage
  const p = getPollBySlugOrId(actualPollId);
  if (p?.type === "form") {
    return <FormPollVote idOrSlug={actualPollId} />;
  }

  if (p?.type === "availability") {
    const AvailabilityPollVote = React.lazy(() => import("./AvailabilityPollVote"));
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-white">Chargement...</div>
          </div>
        }
      >
        <AvailabilityPollVote />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Bouton retour en haut à droite */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-24 right-4 z-50 p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
        title="Retour"
        aria-label="Retour"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="pt-20">
        {/* VotingInterface gère l'affichage pour admin en interne */}
        <VotingInterface
          pollId={actualPollId}
          onBack={() => navigate("/")}
          adminToken={adminToken}
        />
      </div>
    </div>
  );
};

export default Vote;
