import React from "react";
import { motion } from "framer-motion";
import { Check, X, HelpCircle } from "lucide-react";
import { SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { logger } from "@/lib/logger";

interface VoteOptionDesktopProps {
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
}

const VoteOptionDesktop: React.FC<VoteOptionDesktopProps> = ({
  option,
  index,
  userVote,
  userHasVoted,
  handleVote,
  getStatsWithUser,
  getExistingStats,
  getRanking,
}) => {
  const rank = getRanking("all")[option.id];

  logger.debug("Option ranking", "vote", { optionId: option.id, rank });

  // Badge pour le classement de popularité
  const getRankingBadge = (rank: number) => {
    const stats = getStatsWithUser(option.id);
    const hasAnyVotes = stats.yes > 0 || stats.maybe > 0 || stats.no > 0;

    // Toujours afficher le badge si c'est le premier rang, même sans votes (pour cohérence visuelle)
    const allRankings = getRanking("all");

    // Si c'est le premier rang, afficher le badge
    if (rank === 1) {
      return (
        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold border border-white/50 flex-shrink-0">
          1
        </div>
      );
    }

    return null;
  };

  const stats = getStatsWithUser(option.id);
  const existingStats = getExistingStats(option.id);
  const totalVotants = existingStats.yes + existingStats.maybe + existingStats.no || 1;

  return (
    <tr
      className={`border-b border-gray-700/50 hover:bg-[#252525] transition-colors ${
        rank === 1 ? "bg-[#1a2a3a]/20" : ""
      }`}
    >
      {/* Colonne Date */}
      <td className="px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-2.5">
          {getRankingBadge(rank)}
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-white leading-tight">
              {option.date_group_label || formatDate(option.option_date)}
            </span>
            {!option.date_group_label && option.time_slots && (
              <span className="text-xs text-gray-500 mt-0.5">{formatTime(option.time_slots)}</span>
            )}
          </div>
        </div>
      </td>

      {/* Colonne Bouton OUI */}
      <td className="px-2 py-3 w-24">
        <button
          onClick={() => handleVote(option.id, "yes" as VoteType)}
          className={`w-full relative overflow-hidden rounded-md px-3 py-2.5 transition-all border-2 ${
            userVote === "yes" && userHasVoted
              ? "bg-blue-500/30 border-blue-500 ring-1 ring-blue-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535] hover:border-blue-500/50"
          }`}
          title="Oui"
        >
          <div className="flex items-center justify-center gap-2">
            <Check
              className={`w-4 h-4 ${
                userVote === "yes" && userHasVoted ? "text-blue-300" : "text-blue-500"
              }`}
            />
            {stats.yes > 0 && (
              <span
                className={`text-xs font-bold ${
                  userVote === "yes" && userHasVoted ? "text-blue-300" : "text-blue-500"
                }`}
              >
                {stats.yes}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {existingStats.yes > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-blue-500/60"
              initial={{ width: 0 }}
              animate={{
                width: `${(existingStats.yes / totalVotants) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </button>
      </td>

      {/* Colonne Bouton PEUT-ÊTRE */}
      <td className="px-2 py-3 w-24">
        <button
          onClick={() => handleVote(option.id, "maybe" as VoteType)}
          className={`w-full relative overflow-hidden rounded-md px-3 py-2.5 transition-all border-2 ${
            (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
              ? "bg-orange-500/30 border-orange-500 ring-1 ring-orange-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535] hover:border-orange-500/50"
          }`}
          title="Peut-être"
        >
          <div className="flex items-center justify-center gap-2">
            <HelpCircle
              className={`w-4 h-4 ${
                (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
                  ? "text-orange-300"
                  : "text-orange-500"
              }`}
            />
            {stats.maybe > 0 && (
              <span
                className={`text-xs font-bold ${
                  (userVote === "maybe" && userHasVoted) || (!userHasVoted && userVote === "maybe")
                    ? "text-orange-300"
                    : "text-orange-500"
                }`}
              >
                {stats.maybe}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {existingStats.maybe > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-orange-500/60"
              initial={{ width: 0 }}
              animate={{
                width: `${(existingStats.maybe / totalVotants) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </button>
      </td>

      {/* Colonne Bouton NON */}
      <td className="px-2 py-3 w-24">
        <button
          onClick={() => handleVote(option.id, "no" as VoteType)}
          className={`w-full relative overflow-hidden rounded-md px-3 py-2.5 transition-all border-2 ${
            userVote === "no" && userHasVoted
              ? "bg-red-500/30 border-red-500 ring-1 ring-red-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#353535] hover:border-red-500/50"
          }`}
          title="Non"
        >
          <div className="flex items-center justify-center gap-2">
            <X
              className={`w-4 h-4 ${
                userVote === "no" && userHasVoted ? "text-red-300" : "text-red-500"
              }`}
            />
            {stats.no > 0 && (
              <span
                className={`text-xs font-bold ${
                  userVote === "no" && userHasVoted ? "text-red-300" : "text-red-500"
                }`}
              >
                {stats.no}
              </span>
            )}
          </div>

          {/* Barre de progression horizontale */}
          {existingStats.no > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-red-500/60"
              initial={{ width: 0 }}
              animate={{
                width: `${(existingStats.no / totalVotants) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </button>
      </td>
    </tr>
  );
};

export default VoteOptionDesktop;
