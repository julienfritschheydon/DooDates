import React, { useState, useCallback } from "react";
import { Check, X, HelpCircle } from "lucide-react";

// Import components
import VoteCompletionScreen from "./VoteCompletionScreen";
import VoterForm from "./VoterForm";
import PollHeader from "./PollHeader";
import VoteOption from "./VoteOption";
import VoteOptionDesktop from "./VoteOptionDesktop";

// Import types and utilities
import { logger } from "@/lib/logger";
import { VoterInfo, FormErrors, VoteType } from "./utils/types";

// Import custom hooks
import { useVoting } from "../../hooks/useVoting";
import { useIsDesktop } from "../../hooks/useIsDesktop";

interface VotingSwipeProps {
  pollId: string;
  onBack?: () => void;
  onVoteSubmitted?: () => void;
  onViewResults?: () => void;
}

const VotingSwipe: React.FC<VotingSwipeProps> = ({
  pollId,
  onBack,
  onVoteSubmitted,
  onViewResults,
}) => {
  // Détecter si on est sur desktop
  const isDesktop = useIsDesktop();

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

  // États locaux pour l'interface
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isVoteComplete, setIsVoteComplete] = useState(false);

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

      logger.debug("getStatsWithUser", "vote", {
        optionId,
        existingStats: result,
        userVote: votes[optionId],
        userHasVoted: userHasVoted[optionId],
      });

      // Ajouter le vote utilisateur s'il existe (même si userHasVoted est false)
      // Car en mode swipe, userHasVoted peut ne pas être à jour
      if (votes[optionId]) {
        result[votes[optionId]]++;
        logger.debug("Vote utilisateur ajouté", "vote", {
          voteType: votes[optionId],
          newTotal: result,
        });
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
    const canSeeResults =
      poll?.resultsVisibility === "public" || poll?.resultsVisibility === "voters";
    return (
      <VoteCompletionScreen
        onBack={handleBack}
        onViewResults={canSeeResults && onViewResults ? onViewResults : undefined}
      />
    );
  }

  // Calculer le nombre de votes par type
  const userTotalVotes = Object.values(userHasVoted).filter(Boolean).length;
  const remainingVotes = options.length - userTotalVotes;

  // Calculer le pourcentage de progression
  const progressPercent = (userTotalVotes / options.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] pb-8">
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
      <div className="flex-1 overflow-y-auto">
        {/* Liste des options */}
        {isDesktop ? (
          /* Vue Desktop : Tableau */
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto">
              <h3 className="text-sm font-medium text-gray-400">Options disponibles</h3>
              <div className="text-xs text-gray-500">Cliquez sur les boutons pour voter</div>
            </div>
            <div className="flex justify-center">
              <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden max-w-3xl w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-[#252525]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 min-w-[200px]">
                        Date
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Oui"
                      >
                        <Check className="w-4 h-4 text-blue-500 mx-auto" />
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Peut-être"
                      >
                        <HelpCircle className="w-4 h-4 text-orange-500 mx-auto" />
                      </th>
                      <th
                        className="px-2 py-3 text-center text-xs font-medium text-gray-400 w-24"
                        aria-label="Non"
                      >
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((option, index) => (
                      <VoteOptionDesktop
                        key={option.id}
                        option={option}
                        index={index}
                        userVote={votes[option.id]}
                        userHasVoted={userHasVoted[option.id]}
                        handleVote={(optionId: string, voteType: VoteType) => {
                          logger.debug("Vote cliqué", "vote", { optionId, voteType });
                          handleVote(optionId, voteType);
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

                              logger.debug("Ranking option", "vote", {
                                optionId: option.id,
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
                              logger.debug("Option ranked", "vote", {
                                optionId: option.id,
                                rank: currentRank,
                                score: option.score,
                              });
                            });

                            return rankings;
                          }
                          return {};
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bouton de validation - directement après le tableau */}
            {!showForm && (
              <div className="flex justify-center mt-4 max-w-3xl mx-auto">
                <button
                  className="px-6 py-2.5 text-sm rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowForm(true)}
                  data-testid="open-voter-form"
                >
                  {remainingVotes > 0 && userTotalVotes > 0
                    ? `Envoyer mes votes (${userTotalVotes}/${options.length})`
                    : "Envoyer mes votes"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Vue Mobile : Cartes empilées */
          <div className="px-4 space-y-1.5 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-medium text-gray-400">Options disponibles</h3>
              <div className="text-xs text-gray-500">Swipez pour voter</div>
            </div>

            {options.map((option, index) => (
              <VoteOption
                key={option.id}
                option={option}
                index={index}
                userVote={votes[option.id]}
                userHasVoted={userHasVoted[option.id]}
                handleVote={(optionId: string, voteType: VoteType) => {
                  logger.debug("Vote cliqué", "vote", { optionId, voteType });
                  handleVote(optionId, voteType);
                }}
                getStatsWithUser={getStatsWithUser}
                getExistingStats={getExistingStats}
                getRanking={(type: string) => {
                  if (type === "all") {
                    const optionsWithScores = options.map((option) => {
                      const stats = getStatsWithUser(option.id);
                      const score = stats.yes * 2 + stats.maybe - stats.no;
                      return {
                        id: option.id,
                        score,
                      };
                    });

                    optionsWithScores.sort((a, b) => b.score - a.score);

                    const rankings: Record<string, number> = {};
                    let currentRank = 1;

                    optionsWithScores.forEach((option, index) => {
                      if (index > 0 && option.score < optionsWithScores[index - 1].score) {
                        currentRank = index + 1;
                      }
                      rankings[option.id] = currentRank;
                    });

                    return rankings;
                  }
                  return {};
                }}
                anyUserHasVoted={Object.values(userHasVoted).some((voted) => voted)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bouton de validation - mobile uniquement (desktop est dans le tableau) */}
      {!showForm && !isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e1e1e] border-t border-gray-700 shadow-lg">
          <button
            className="w-full py-4 rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
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
