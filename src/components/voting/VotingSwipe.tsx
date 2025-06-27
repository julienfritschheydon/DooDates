import React, { useState, useRef, useEffect } from "react";
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
  ShieldCheck
} from "lucide-react";

// Import components
import VoteButton from "./VoteButton";
import VoteCompletionScreen from "./VoteCompletionScreen";
import VoterForm from "./VoterForm";
import PollHeader from "./PollHeader";
import VoteOption from "./VoteOption";

// Import types and utilities
import { SwipeOption, SwipeVote, VoterInfo, FormErrors, VoteType, Poll } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { triggerHaptic } from "./utils/voteUtils";

// Import custom hooks
import useVotingService from "./hooks/useVotingService";

interface VotingSwipeProps {
  pollId: string;
  onBack?: () => void;
  onVoteSubmitted?: () => void;
}

const VotingSwipe: React.FC<VotingSwipeProps> = ({
  pollId,
  onBack,
  onVoteSubmitted,
}) => {
  // Utiliser le hook useVotingService pour gérer toute la logique métier
  const {
    poll,
    options,
    existingVotes,
    votes,
    userHasVoted,
    currentSwipe,
    isLoading,
    isSubmitting,
    showForm,
    voterInfo,
    formErrors,
    isVoteComplete,
    getExistingStats,
    getStatsWithUser,
    getRanking,
    handleVote,
    handleSwipe,
    handleOptionDragEnd,
    updateCurrentSwipe,
    showVoterForm,
    hideVoterForm,
    setVoterInfoData,
    handleSubmit,
    getVoteText
  } = useVotingService({ pollId, onVoteSubmitted });

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
  const totalVotes = Object.values(userHasVoted).filter(Boolean).length;
  const remainingVotes = options.length - totalVotes;

  // Calculer le pourcentage de progression
  const progressPercent = (totalVotes / options.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* En-tête avec titre et bouton retour */}
      <PollHeader 
        poll={poll}
        existingVotes={existingVotes}
        onBack={handleBack}
        totalVotes={totalVotes}
        remainingVotes={remainingVotes}
        progressPercent={progressPercent}
      />

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Liste swipable des options */}
        <div className="px-6 space-y-3 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Options disponibles
            </h3>
            <div className="text-sm text-gray-500">Swipez pour voter</div>
          </div>
          
          {options.map((option, index) => (
            <VoteOption
              key={option.id}
              option={option}
              index={index}
              userVote={votes[option.id]}
              userHasVoted={userHasVoted[option.id]}
              currentSwipe={currentSwipe[option.id]}
              handleVote={handleVote}
              handleSwipe={handleSwipe}
              handleOptionDragEnd={handleOptionDragEnd}
              getStatsWithUser={getStatsWithUser}
              getExistingStats={getExistingStats}
              getRanking={getRanking}
              anyUserHasVoted={Object.values(userHasVoted).some((voted) => voted)}
            />
          ))}
        </div>
      </div>

      {/* Bouton flottant pour valider - caché quand le formulaire est affiché */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <button
            className="w-full py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            onClick={showVoterForm}
          >
            {remainingVotes > 0 && totalVotes > 0 ? (
              `Envoyer mes votes (${totalVotes}/${options.length})`
            ) : (
              "Envoyer mes votes"
            )}
          </button>
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <VoterForm
          onSubmit={handleSubmit}
          onBack={hideVoterForm}
          onCancel={hideVoterForm}
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
