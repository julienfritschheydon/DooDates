import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Users, Clock, Calendar, AlertCircle } from "lucide-react";
import { VoteGrid } from "./VoteGrid";
import { VoteActions } from "./VoteActions";
import { VoteResults } from "./VoteResults";
import { useVoting } from "@/hooks/useVoting";

interface VotingInterfaceProps {
  pollId: string;
  onBack?: () => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  pollId,
  onBack,
}) => {
  const [showResults, setShowResults] = useState(false);

  const {
    poll,
    options,
    votes,
    currentVote,
    userHasVoted,
    voterInfo,
    loading,
    submitting,
    error,
    setVoterInfo,
    updateVote,
    submitVote,
    hasVotes,
    totalVotes,
  } = useVoting(pollId);

  // Haptic feedback pour mobile
  const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Gérer le changement de vote avec haptic feedback
  const handleVoteChange = (
    optionId: string,
    value: "yes" | "no" | "maybe",
  ) => {
    updateVote(optionId, value);
    triggerHaptic("light");
  };

  // Gérer la soumission avec haptic feedback
  const handleSubmit = async () => {
    triggerHaptic("medium");
    const success = await submitVote();
    if (success) {
      triggerHaptic("heavy");
      setShowResults(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du sondage...</p>
        </motion.div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sondage introuvable
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Ce sondage n'existe pas ou n'est plus actif."}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Mobile */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50"
      >
        <div className="flex items-center justify-between p-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
          )}

          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-800 truncate">
              {poll.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {options.length} option{options.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowResults(!showResults)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Clock className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </motion.header>

      {/* Affichage des erreurs */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showResults ? (
          <VoteResults
            key="results"
            poll={poll}
            options={options}
            votes={votes}
            onBack={() => setShowResults(false)}
          />
        ) : (
          <motion.div
            key="voting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-6"
          >
            {/* Description du sondage */}
            {poll.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 rounded-2xl p-4 shadow-sm"
              >
                <p className="text-gray-600 text-sm leading-relaxed">
                  {poll.description}
                </p>
              </motion.div>
            )}

            {/* Grille de vote */}
            <VoteGrid
              options={options}
              votes={votes}
              currentVote={currentVote}
              userHasVoted={userHasVoted}
              onVoteChange={handleVoteChange}
              onHaptic={triggerHaptic}
            />

            {/* Actions de vote */}
            <VoteActions
              voterInfo={voterInfo}
              onVoterInfoChange={setVoterInfo}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              hasVotes={hasVotes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
