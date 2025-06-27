import React from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Check, X, HelpCircle, ArrowRight, ArrowLeft, Star } from "lucide-react";
import { SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";
import { triggerHaptic } from "./utils/voteUtils";

interface VoteOptionProps {
  option: SwipeOption;
  index: number;
  userVote: VoteType;
  userHasVoted: boolean;
  currentSwipe: VoteType | null;
  handleVote: (optionId: string, voteType: VoteType) => void;
  handleSwipe: (optionId: string, direction: number) => void;
  handleOptionDragEnd: (event: any, info: PanInfo, optionId: string) => void;
  getStatsWithUser: (optionId: string) => { yes: number; maybe: number; no: number };
  getExistingStats: (optionId: string) => { yes: number; maybe: number; no: number };
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

  // Badge pour le 1er : plus visible qu'une bordure
  const getRankingBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute -top-3 -left-3 z-30 bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border-2 border-white">
          <span className="text-white text-xs font-bold"> 1er </span>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      key={option.id}
      className={`bg-white rounded-xl shadow-md p-4 mb-4 relative ${
        rank === 1 ? "border-2 border-green-400" : ""
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
        <div className="flex items-center justify-center gap-2 text-gray-800">
          <span className="font-semibold">
            {formatDate(option.option_date)}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            {formatTime(option.time_slots)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 relative">
        {/* Flèches positionnées par rapport à la grille des boutons */}
        {index === 0 && !anyUserHasVoted && (
          <>
            {/* Flèche verte à GAUCHE du bouton OUI */}
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
              <div className="bg-green-500/20 border border-green-300 rounded-full p-2 shadow-lg">
                <ArrowLeft className="w-4 h-4 text-green-600" />
              </div>
            </motion.div>

            {/* Flèche rouge à DROITE du bouton NON */}
            <motion.div
              className="absolute z-20"
              style={{
                right: "-40px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
              animate={{
                opacity: [2, 1, 2],
                x: [-25, -10, -25],
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
                delay: 1.2,
              }}
            >
              <div className="bg-red-500/20 border border-red-300 rounded-full p-2 shadow-lg">
                <ArrowRight className="w-4 h-4 text-red-600" />
              </div>
            </motion.div>
          </>
        )}

        {/* BOUTON YES (OUI) */}
        <button
          onClick={() => handleVote(option.id, "yes" as VoteType)}
          className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
            (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
              ? "bg-green-50 border-green-500 ring-2 ring-green-400"
              : "bg-white border-gray-200 hover:bg-green-50"
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <Check
              className={`w-5 h-5 mb-1 ${
                (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
                  ? "text-green-700"
                  : "text-green-600"
              }`}
            />
            <span
              className={`text-sm font-bold ${
                (userVote === "yes" && userHasVoted) || currentSwipe === "yes"
                  ? "text-green-700"
                  : "text-green-600"
              }`}
            >
              {getStatsWithUser(option.id).yes}
            </span>
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
                  className="absolute inset-0 bg-green-200/30"
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
                    className="absolute bg-green-500/75"
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
            (userVote === "maybe" && userHasVoted) || currentSwipe === "maybe" || (!userHasVoted && userVote === "maybe")
              ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400"
              : "bg-white border-gray-200 hover:bg-orange-50"
          }`}
        >
          <div className="flex flex-col items-center text-center relative z-10">
            <HelpCircle
              className={`w-5 h-5 mb-1 ${
                (userVote === "maybe" && userHasVoted) || currentSwipe === "maybe" || (!userHasVoted && userVote === "maybe")
                  ? "text-orange-700"
                  : "text-orange-600"
              }`}
            />
            <span
              className={`text-sm font-bold ${
                (userVote === "maybe" && userHasVoted) || currentSwipe === "maybe" || (!userHasVoted && userVote === "maybe")
                  ? "text-orange-700"
                  : "text-orange-600"
              }`}
            >
              {getStatsWithUser(option.id).maybe}
            </span>
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
              : "bg-white border-gray-200 hover:bg-red-50"
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
            <span
              className={`text-sm font-bold ${
                (userVote === "no" && userHasVoted) || currentSwipe === "no"
                  ? "text-red-700"
                  : "text-red-600"
              }`}
            >
              {getStatsWithUser(option.id).no}
            </span>
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
