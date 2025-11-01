import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from "framer-motion";
import {
  ChevronLeft,
  TrendingUp,
  Users,
  Check,
  X,
  HelpCircle,
  ArrowUp,
  Star,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

// Import components
import VoteButton from "./VoteButton";
import VoteCompletionScreen from "./VoteCompletionScreen";
import VoterForm from "./VoterForm";
import PollHeader from "./PollHeader";
import VoteOption from "./VoteOption";

// Import types and utilities
import { logger } from "@/lib/logger";
import { SwipeOption, SwipeVote, VoterInfo, FormErrors, VoteType, Poll } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { triggerHaptic } from "./utils/voteUtils";

// Import custom hooks
import { useVoting } from "../../hooks/useVoting";

interface VotingSwipeProps {
  pollId: string;
  onBack?: () => void;
  onVoteSubmitted?: () => void;
}

const VotingSwipe: React.FC<VotingSwipeProps> = ({ pollId, onBack, onVoteSubmitted }) => {
  // Utiliser le hook useVoting pour gérer toute la logique métier
  const {
    poll,
    options,
    votes: existingVotes,
    currentVote: votes,
    userHasVoted,
    voterInfo,
    loading: isLoading,
    submitting: isSubmitting,
    error,
    setVoterInfo: setVoterInfoData,
    updateVote: handleVote,
    removeVote,
    submitVote: submitUserVote,
    getVoteStats,
    getBestOption,
    hasVotes,
    totalVotes: votesTotalCount,
  } = useVoting(pollId);

  // États locaux pour l'interface swipe
  const [currentSwipe, setCurrentSwipe] = useState<Record<string, VoteType | null>>({});
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isVoteComplete, setIsVoteComplete] = useState(false);

  // Fonctions utilitaires manquantes
  const handleSwipe = (optionId: string, direction: VoteType) => {
    setCurrentSwipe((prev) => ({ ...prev, [optionId]: direction }));
    // Appliquer immédiatement le vote
    handleVote(optionId, direction);
  };

  const handleOptionDragEnd = (optionId: string, direction: VoteType | null) => {
    if (direction) {
      handleVote(optionId, direction);
    }
    setCurrentSwipe((prev) => ({ ...prev, [optionId]: null }));
  };

  const updateCurrentSwipe = (optionId: string, direction: VoteType | null) => {
    setCurrentSwipe((prev) => ({ ...prev, [optionId]: direction }));
  };

  const showVoterForm = () => setShowForm(true);
  const hideVoterForm = () => setShowForm(false);

  // Stats SANS le vote utilisateur (pour les barres de fond)
  const getExistingStats = useCallback(
    (optionId: string) => {
      const stats = getVoteStats(optionId);
      return {
        yes: stats.counts.yes,
        maybe: stats.counts.maybe,
        no: stats.counts.no,
      };
    },
    [getVoteStats],
  );

  // Stats AVEC le vote utilisateur en cours (pour les chiffres affichés)
  const getStatsWithUser = useCallback(
    (optionId: string) => {
      const stats = getVoteStats(optionId);
      const result = {
        yes: stats.counts.yes,
        maybe: stats.counts.maybe,
        no: stats.counts.no,
      };

      console.log(`[STATS] getStatsWithUser(${optionId}):`, {
        existingStats: result,
        userVote: votes[optionId],
        userHasVoted: userHasVoted[optionId],
        allVotes: votes,
        allUserHasVoted: userHasVoted,
      });

      // Ajouter le vote utilisateur s'il existe (même si userHasVoted est false)
      // Car en mode swipe, userHasVoted peut ne pas être à jour
      if (votes[optionId]) {
        result[votes[optionId]]++;
        console.log(`[STATS] Vote utilisateur ajouté: ${votes[optionId]} → Nouveau total:`, result);
      }

      return result;
    },
    [getVoteStats, votes, userHasVoted],
  );

  const getRanking = () => getBestOption();

  const getVoteText = (vote: VoteType) => {
    switch (vote) {
      case "yes":
        return "Oui";
      case "no":
        return "Non";
      case "maybe":
        return "Peut-être";
      default:
        return "";
    }
  };

  const handleSubmit = async (voterInfo: VoterInfo) => {
    logger.debug("VotingSwipe handleSubmit appelé", "vote", {
      voterName: voterInfo.name,
      votesCount: Object.keys(votes).length,
    });
    setVoterInfoData(voterInfo);

    // Vérifier qu'il y a des votes à soumettre
    const hasVotesToSubmit = Object.keys(votes).length > 0;
    if (!hasVotesToSubmit) {
      logger.warn("Aucun vote à soumettre", "vote");
      setFormErrors({
        general: "Veuillez voter sur au moins une option avant de soumettre.",
      });
      return;
    }

    const success = await submitUserVote();
    if (success) {
      setIsVoteComplete(true);
      setShowForm(false);
      if (onVoteSubmitted) onVoteSubmitted();
    }
  };

  const resetVotes = () => {
    // Réinitialiser tous les votes
    options.forEach((option) => removeVote(option.id));
  };

  // Gérer le retour
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Rediriger vers la page d'accueil si onBack n'est pas fourni
      window.location.href = "/";
    }
  };

  // Si le chargement est en cours, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Si le vote est terminé, afficher l'écran de fin
  if (isVoteComplete) {
    return <VoteCompletionScreen onBack={handleBack} />;
  }

  // Calculer le nombre de votes par type
  const userTotalVotes = Object.values(userHasVoted).filter(Boolean).length;
  const remainingVotes = options.length - userTotalVotes;

  // Calculer le pourcentage de progression
  const progressPercent = (userTotalVotes / options.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* En-tête avec titre et bouton retour */}
      <PollHeader
        poll={
          poll
            ? {
                ...poll,
                description: poll.description || "",
                expires_at:
                  poll.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : null
        }
        existingVotes={existingVotes}
        onBack={handleBack}
        totalVotes={userTotalVotes}
        remainingVotes={remainingVotes}
        progressPercent={progressPercent}
      />

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Liste swipable des options */}
        <div className="px-6 space-y-3 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Options disponibles</h3>
            <div className="text-sm text-gray-400">Swipez pour voter</div>
          </div>

          {options.map((option, index) => (
            <VoteOption
              key={option.id}
              option={option}
              index={index}
              userVote={votes[option.id]}
              userHasVoted={userHasVoted[option.id]}
              currentSwipe={currentSwipe[option.id]}
              handleVote={(optionId: string, voteType: VoteType) => {
                logger.debug("Vote cliqué", "vote", { optionId, voteType });
                handleVote(optionId, voteType);
              }}
              handleSwipe={(optionId: string, direction: number) => {
                const voteType = direction > 0 ? "yes" : direction < 0 ? "no" : "maybe";
                handleSwipe(optionId, voteType);
              }}
              handleOptionDragEnd={(event: any, info: any, optionId: string) => {
                // SWIPE LOGIC - DOCUMENTATION
                // offset.x > 0 = swipe vers la DROITE
                // offset.x < 0 = swipe vers la GAUCHE
                //
                // DIRECTION CHOISIE (intuitive) :
                // - Swipe GAUCHE (offset.x < -100) = OUI (accepter, vers la gauche = positif)
                // - Swipe DROITE (offset.x > 100) = NON (rejeter, vers la droite = négatif)
                // - Petit mouvement = PEUT-ÊTRE (indécis)
                const direction =
                  info.offset.x < -100
                    ? "yes" // Swipe GAUCHE = OUI
                    : info.offset.x > 100
                      ? "no" // Swipe DROITE = NON
                      : null;
                handleOptionDragEnd(optionId, direction);
              }}
              getStatsWithUser={getStatsWithUser}
              getExistingStats={getExistingStats}
              getRanking={(type: string) => {
                if (type === "all") {
                  // RANKING LOGIC - DOCUMENTATION
                  // Calcul du score : (yes * 2) + maybe - no
                  // Plus le score est élevé, meilleur est le rang

                  // Calculer le score réel de chaque option (AVEC le vote utilisateur)
                  const optionsWithScores = options.map((option) => {
                    const stats = getStatsWithUser(option.id);
                    const score = stats.yes * 2 + stats.maybe - stats.no;

                    console.log(`[RANKING] Option ${option.id}:`, {
                      yes: stats.yes,
                      maybe: stats.maybe,
                      no: stats.no,
                      score,
                    });

                    return {
                      id: option.id,
                      score,
                    };
                  });

                  // Trier par score décroissant
                  optionsWithScores.sort((a, b) => b.score - a.score);

                  // Assigner les rangs (gérer les égalités)
                  const rankings: Record<string, number> = {};
                  let currentRank = 1;

                  optionsWithScores.forEach((option, index) => {
                    if (index > 0 && option.score < optionsWithScores[index - 1].score) {
                      currentRank = index + 1;
                    }
                    rankings[option.id] = currentRank;
                    console.log(
                      `[RANKING] Option ${option.id} = Rang ${currentRank} (score: ${option.score})`,
                    );
                  });

                  return rankings;
                }
                return {};
              }}
              anyUserHasVoted={Object.values(userHasVoted).some((voted) => voted)}
            />
          ))}
        </div>
      </div>

      {/* Bouton flottant pour valider - caché quand le formulaire est affiché */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e1e1e] border-t border-gray-700 shadow-lg">
          <button
            className="w-full py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setShowForm(true)}
            data-testid="open-voter-form"
          >
            {remainingVotes > 0 && userTotalVotes > 0
              ? `Envoyer mes votes (${userTotalVotes}/${options.length})`
              : "Envoyer mes votes"}
          </button>
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <VoterForm
          onSubmit={handleSubmit}
          onBack={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
          formErrors={formErrors}
          votes={votes}
          options={options}
          userHasVoted={userHasVoted}
          getVoteText={getVoteText}
          setVoterInfo={setVoterInfoData}
          voterInfo={voterInfo}
        />
      )}
    </div>
  );
};

export default VotingSwipe;
