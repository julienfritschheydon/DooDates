import React from "react";
import { motion, useAnimation } from "framer-motion";
import { Check, X, HelpCircle } from "lucide-react";
import { SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { logger } from "@/lib/logger";

interface VoteOptionProps {
  option: SwipeOption;
  index: number;
  userVote: VoteType;
  userHasVoted: boolean;
  handleVote: (optionId: string, voteType: VoteType) => void;
  getStatsWithUser: (optionId: string) => {
    yes: number;
    maybe: number;
    no: number;
  };
  getExistingStats: (optionId: string) => {
    yes: number;
    maybe: number;
    no: number;
  };
  getRanking: (type: string) => Record<string, number> | number;
  anyUserHasVoted: boolean;
}

const VoteOption: React.FC<VoteOptionProps> = ({
  option,
  index,
  userVote,
  userHasVoted,
  handleVote,
  getStatsWithUser,
  getExistingStats,
  getRanking,
  anyUserHasVoted,
}) => {
  const controls = useAnimation();
  const rank = getRanking("all")[option.id];

  logger.debug("Option ranking", "vote", { optionId: option.id, rank });

  // Badge pour le classement de popularité - cohérent avec desktop
  const getRankingBadge = (rank: number) => {
    // Toujours afficher le badge si c'est le premier rang, même sans votes (pour cohérence visuelle)
    const allRankings = getRanking("all");

    // Si c'est le premier rang, afficher le badge
    if (rank === 1) {
      return (
        <div className="absolute -top-2 -left-2 z-30 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold border border-white/50 flex-shrink-0 shadow-sm">
          1
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      key={option.id}
      className={`bg-[#1e1e1e] rounded-lg shadow-md p-2 relative border border-gray-700 ${
        rank === 1 ? "border-blue-400/50" : ""
      }`}
      animate={controls}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge pour le 1er rang */}
      {getRankingBadge(rank)}

      <div className="text-center mb-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-white">
            {/* Afficher le label du groupe si disponible, sinon la date normale */}
            {option.date_group_label || formatDate(option.option_date)}
          </span>
          {/* Afficher les time slots uniquement pour les dates individuelles */}
          {!option.date_group_label && option.time_slots && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400">{formatTime(option.time_slots)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 relative">
        {/* BOUTON YES (OUI) */}
        <button
          onClick={() => handleVote(option.id, "yes" as VoteType)}
          className={`relative overflow-hidden rounded-md px-1 py-1.5 transition-all border-2 ${
            userVote === "yes" && userHasVoted
              ? "bg-blue-500/30 border-blue-500 ring-1 ring-blue-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535]"
          }`}
          data-testid={`vote-option-yes-${option.id}`}
        >
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <Check
              className={`w-4 h-4 ${
                userVote === "yes" && userHasVoted ? "text-blue-300" : "text-blue-500"
              }`}
            />
            {getStatsWithUser(option.id).yes > 0 && (
              <span
                className={`text-xs font-bold ${
                  userVote === "yes" && userHasVoted ? "text-blue-300" : "text-blue-500"
                }`}
              >
                {getStatsWithUser(option.id).yes}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsYes = getExistingStats(option.id).yes;

            return (
              <>
                {votesExistantsYes > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-blue-500/60"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(votesExistantsYes / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            );
          })()}
        </button>

        {/* BOUTON MAYBE (PEUT-ÊTRE) */}
        <button
          onClick={() => handleVote(option.id, "maybe" as VoteType)}
          className={`relative overflow-hidden rounded-md px-1 py-1.5 transition-all border-2 ${
            (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
              ? "bg-orange-500/30 border-orange-500 ring-1 ring-orange-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535]"
          }`}
          data-testid={`vote-option-maybe-${option.id}`}
        >
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <HelpCircle
              className={`w-4 h-4 ${
                (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
                  ? "text-orange-300"
                  : "text-orange-500"
              }`}
            />
            {getStatsWithUser(option.id).maybe > 0 && (
              <span
                className={`text-xs font-bold ${
                  (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
                    ? "text-orange-300"
                    : "text-orange-500"
                }`}
              >
                {getStatsWithUser(option.id).maybe}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsMaybe = getExistingStats(option.id).maybe;

            return (
              <>
                {votesExistantsMaybe > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-orange-500/60"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(votesExistantsMaybe / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            );
          })()}
        </button>

        {/* BOUTON NO (NON) */}
        <button
          onClick={() => handleVote(option.id, "no" as VoteType)}
          className={`relative overflow-hidden rounded-md px-1 py-1.5 transition-all border-2 ${
            userVote === "no" && userHasVoted
              ? "bg-red-500/30 border-red-500 ring-1 ring-red-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535]"
          }`}
          data-testid={`vote-option-no-${option.id}`}
        >
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <X
              className={`w-4 h-4 ${
                userVote === "no" && userHasVoted ? "text-red-300" : "text-red-500"
              }`}
            />
            {getStatsWithUser(option.id).no > 0 && (
              <span
                className={`text-xs font-bold ${
                  userVote === "no" && userHasVoted ? "text-red-300" : "text-red-500"
                }`}
              >
                {getStatsWithUser(option.id).no}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsNo = getExistingStats(option.id).no;

            return (
              <>
                {votesExistantsNo > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-red-500/60"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(votesExistantsNo / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            );
          })()}
        </button>
      </div>
    </motion.div>
  );
};

export default VoteOption;
