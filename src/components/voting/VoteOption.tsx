import React from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Check, X, HelpCircle, ArrowRight, ArrowLeft, Star } from "lucide-react";
import { SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { triggerHaptic } from "./utils/voteUtils";
import { logger } from "@/lib/logger";

interface VoteOptionProps {
  option: SwipeOption;
  index: number;
  userVote: VoteType;
  userHasVoted: boolean;
  currentSwipe: VoteType | null;
  handleVote: (optionId: string, voteType: VoteType) => void;
  handleSwipe: (optionId: string, direction: number) => void;
  handleOptionDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    optionId: string,
  ) => void;
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
  currentSwipe,
  handleVote,
  handleSwipe,
  handleOptionDragEnd,
  getStatsWithUser,
  getExistingStats,
  getRanking,
  anyUserHasVoted,
}) => {
  const controls = useAnimation();
  const rank = getRanking("all")[option.id];

  logger.debug("Option ranking", "vote", { optionId: option.id, rank });

  // Badge pour le 1er : plus visible qu'une bordure
  const getRankingBadge = (rank: number) => {
    // Ne pas afficher le badge s'il n'y a aucun vote
    const stats = getStatsWithUser(option.id);
    const hasAnyVotes = stats.yes > 0 || stats.maybe > 0 || stats.no > 0;

    if (!hasAnyVotes) return null;

    // Compter combien d'options ont le même rang
    const allRankings = getRanking("all");
    const optionsWithSameRank = Object.values(allRankings).filter((r) => r === rank).length;

    // Cas 1 : Un seul premier → Badge "1er" bleu
    if (rank === 1 && optionsWithSameRank === 1) {
      return (
        <div className="absolute -top-3 -left-3 z-30 bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border-2 border-white">
          <span className="text-white text-xs font-bold"> 1er </span>
        </div>
      );
    }

    // Cas 2 : Deux ex aequo en première position → Badge "2ème" orange
    if (rank === 1 && optionsWithSameRank === 2) {
      return (
        <div className="absolute -top-3 -left-3 z-30 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border-2 border-white">
          <span className="text-white text-xs font-bold"> 2ème </span>
        </div>
      );
    }

    // Cas 3 : Trois ex aequo en première position → Badge "3ème" jaune
    if (rank === 1 && optionsWithSameRank === 3) {
      return (
        <div className="absolute -top-3 -left-3 z-30 bg-yellow-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border-2 border-white">
          <span className="text-white text-xs font-bold"> 3ème </span>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      key={option.id}
      className={`bg-[#1e1e1e] rounded-xl shadow-md p-4 mb-4 relative ${
        rank === 1 ? "border-2 border-blue-400" : ""
      }`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(e, info) => handleOptionDragEnd(e, info, option.id)}
      animate={controls}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge pour le 1er rang */}
      {getRankingBadge(rank)}

      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2">
          <span className="font-semibold text-white">
            {/* Afficher le label du groupe si disponible, sinon la date normale */}
            {option.date_group_label || formatDate(option.option_date)}
          </span>
          {/* Afficher les time slots uniquement pour les dates individuelles */}
          {!option.date_group_label && option.time_slots && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{formatTime(option.time_slots)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 relative">
        {/* Flèches positionnées par rapport à la grille des boutons */}
        {index === 0 && !anyUserHasVoted && (
          <>
            {/* Flèche bleue à GAUCHE du bouton OUI */}
            <motion.div
              className="absolute z-20"
              style={{
                left: "-40px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
              animate={{
                opacity: [2, 1, 2],
                x: [25, 10, 25],
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
                delay: 0.2,
              }}
            >
              <div className="bg-blue-500/20 border border-blue-300 rounded-full p-2 shadow-lg">
                <ArrowLeft className="w-4 h-4 text-blue-600" />
              </div>
            </motion.div>
          </>
        )}

        {/* BOUTON YES (OUI) */}
        <button
          onClick={() => handleVote(option.id, "yes" as VoteType)}
          className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
            (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
              ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <Check
              className={`w-5 h-5 mb-1 ${
                (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
                  ? "text-blue-700"
                  : "text-blue-600"
              }`}
            />
            {getStatsWithUser(option.id).yes > 0 && (
              <span
                className={`text-sm font-bold ${
                  (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
                    ? "text-blue-700"
                    : "text-blue-600"
                }`}
              >
                {getStatsWithUser(option.id).yes}
              </span>
            )}
          </div>

          {/* SYSTÈME DOUBLE COUCHE - Barres de progression */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsYes = getExistingStats(option.id).yes;
            const ajoutVoteUtilisateur = 1;

            return (
              <>
                {/* COUCHE 1 : Barre de fond */}
                <motion.div
                  className="absolute inset-0 bg-blue-200/30"
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: votesExistantsYes / totalVotants,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: "bottom" }}
                />

                {/* COUCHE 2 : Barre de surbrillance */}
                {(userVote === "yes" && userHasVoted) || currentSwipe === "yes" ? (
                  <motion.div
                    className="absolute bg-blue-500/75"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      left: 0,
                      right: 0,
                      bottom: `${(votesExistantsYes / totalVotants) * 100}%`,
                    }}
                  />
                ) : null}
              </>
            );
          })()}
        </button>

        {/* BOUTON MAYBE (PEUT-ÊTRE) */}
        <button
          onClick={() => handleVote(option.id, "maybe" as VoteType)}
          className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
            (userVote === "maybe" && userHasVoted) ||
            currentSwipe === "maybe" ||
            (!userHasVoted && userVote === "maybe")
              ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <HelpCircle
              className={`w-5 h-5 mb-1 ${
                (userVote === "maybe" && userHasVoted) ||
                currentSwipe === "maybe" ||
                (!userHasVoted && userVote === "maybe")
                  ? "text-orange-700"
                  : "text-orange-600"
              }`}
            />
            {getStatsWithUser(option.id).maybe > 0 && (
              <span
                className={`text-sm font-bold ${
                  (userVote === "maybe" && userHasVoted) ||
                  currentSwipe === "maybe" ||
                  (!userHasVoted && userVote === "maybe")
                    ? "text-orange-700"
                    : "text-orange-600"
                }`}
              >
                {getStatsWithUser(option.id).maybe}
              </span>
            )}
          </div>

          {/* SYSTÈME DOUBLE COUCHE - Barres de progression */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsMaybe = getExistingStats(option.id).maybe;
            const ajoutVoteUtilisateur = 1;

            return (
              <>
                {/* COUCHE 1 : Barre de fond */}
                <motion.div
                  className="absolute inset-0 bg-orange-200/30"
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: votesExistantsMaybe / totalVotants,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: "bottom" }}
                />

                {/* COUCHE 2 : Barre de surbrillance */}
                {(userVote === "maybe" && userHasVoted) ||
                currentSwipe === "maybe" ||
                (!userHasVoted && userVote === "maybe") ? (
                  <motion.div
                    className="absolute bg-orange-500/75"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      left: 0,
                      right: 0,
                      bottom: `${(votesExistantsMaybe / totalVotants) * 100}%`,
                    }}
                  />
                ) : null}
              </>
            );
          })()}
        </button>

        {/* BOUTON NO (NON) */}
        <button
          onClick={() => handleVote(option.id, "no" as VoteType)}
          className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
            (userVote === "no" && userHasVoted) || currentSwipe === "no"
              ? "bg-red-50 border-red-500 ring-2 ring-red-400"
              : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <X
              className={`w-5 h-5 mb-1 ${
                (userVote === "no" && userHasVoted) || currentSwipe === "no"
                  ? "text-red-700"
                  : "text-red-600"
              }`}
            />
            {getStatsWithUser(option.id).no > 0 && (
              <span
                className={`text-sm font-bold ${
                  (userVote === "no" && userHasVoted) || currentSwipe === "no"
                    ? "text-red-700"
                    : "text-red-600"
                }`}
              >
                {getStatsWithUser(option.id).no}
              </span>
            )}
          </div>

          {/* SYSTÈME DOUBLE COUCHE - Barres de progression */}
          {(() => {
            const totalVotants =
              getExistingStats(option.id).yes +
                getExistingStats(option.id).maybe +
                getExistingStats(option.id).no || 1;
            const votesExistantsNo = getExistingStats(option.id).no;
            const ajoutVoteUtilisateur = 1;

            return (
              <>
                {/* COUCHE 1 : Barre de fond */}
                <motion.div
                  className="absolute inset-0 bg-red-200/30"
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: votesExistantsNo / totalVotants,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: "bottom" }}
                />

                {/* COUCHE 2 : Barre de surbrillance */}
                {(userVote === "no" && userHasVoted) || currentSwipe === "no" ? (
                  <motion.div
                    className="absolute bg-red-500/75"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(ajoutVoteUtilisateur / totalVotants) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      left: 0,
                      right: 0,
                      bottom: `${(votesExistantsNo / totalVotants) * 100}%`,
                    }}
                  />
                ) : null}
              </>
            );
          })()}
        </button>
      </div>
    </motion.div>
  );
};

export default VoteOption;
