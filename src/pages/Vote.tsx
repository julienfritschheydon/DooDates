import { useParams, useNavigate } from "react-router-dom";
import { VotingInterface } from "@/components/voting/VotingInterface";
import React from "react";
import { getPollBySlugOrId } from "@/lib/pollStorage";
import { X } from "lucide-react";
import FormPollVote from "@/components/polls/FormPollVote";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import TopNavGemini from "@/components/prototype/TopNavGemini";

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
                data-testid="vote-back-home"
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
  
  // Déterminer la landing page selon le type de poll
  const getProductLanding = (pollType?: string) => {
    switch (pollType) {
      case "form":
        return "/form-polls";
      case "availability":
        return "/availability-polls";
      case "date":
      default:
        return "/date-polls";
    }
  };

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
      {/* Bouton retour en haut à droite - discret */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="icon"
              className="fixed top-4 right-4 z-50 p-2 bg-[#1e1e1e]/80 hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700/50 backdrop-blur-sm"
              aria-label="Retour"
              data-testid="vote-back"
            >
              <X className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Retour</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="pt-20">
        {/* VotingInterface gère l'affichage pour admin en interne */}
        <VotingInterface
          pollId={actualPollId}
          onBack={() => navigate(getProductLanding(p?.type))}
          adminToken={adminToken}
        />
      </div>
    </div>
  );
};

export default Vote;
