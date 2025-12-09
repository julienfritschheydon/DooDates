import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "./utils/voteUtils";
import { logger } from "@/lib/logger";
import { useVoting } from "@/hooks/useVoting";
import VotingSwipe from "./VotingSwipe";
import { VoteResults } from "./VoteResults";
import { Poll } from "@/lib/supabase-fetch";

interface VotingInterfaceProps {
  pollId: string;
  onBack?: () => void;
  adminToken?: string;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({ pollId, onBack, adminToken }) => {
  const [showResults, setShowResults] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { poll, options, votes, loading, error, totalVotes } = useVoting(pollId);

  logger.debug("VotingInterface - État", "vote", {
    pollId,
    optionsCount: options?.length,
    votesCount: votes?.length,
    loading,
    hasError: !!error,
  });

  // Détecter si l'utilisateur est admin
  useEffect(() => {
    if (adminToken) {
      // Vérifier si le token admin est valide
      // Dans une implémentation réelle, on ferait une vérification côté serveur
      setIsAdmin(true);
    }
  }, [adminToken]);

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
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sondage introuvable</h2>
          <p className="text-gray-600 mb-4">
            {error || "Ce sondage n'existe pas ou n'est plus actif."}
          </p>
          {onBack && (
            <Button onClick={onBack} size="sm" className="px-6 py-2">
              Retour
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // Afficher la bannière admin si l'utilisateur est admin
  const AdminBanner = () => {
    if (!isAdmin) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <div className="flex items-center gap-2 text-blue-700">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-medium">
            Mode administrateur activé. Vous pouvez gérer ce sondage.
          </span>
        </div>
      </motion.div>
    );
  };

  // Afficher les erreurs
  const ErrorBanner = () => {
    if (!error) return null;

    return (
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
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Bannière admin si applicable */}
      <AdminBanner />

      {/* Affichage des erreurs */}
      <ErrorBanner />

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
          <VotingSwipe
            pollId={pollId}
            onBack={() => (isAdmin ? setShowResults(true) : onBack && onBack())}
            onViewResults={() => setShowResults(true)}
            onVoteSubmitted={() => {
              // Optionnel: action à effectuer après soumission du vote
              logger.info("Vote soumis", "vote");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
