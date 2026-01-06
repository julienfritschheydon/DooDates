import React from "react";
import { motion } from "framer-motion";
import { Check, X, HelpCircle } from "lucide-react";
import { VoteType } from "./utils/types";
import VoteStats from "./VoteStats";

interface VoteButtonProps {
  voteType: VoteType;
  optionId: string;
  count: number;
  isActive: boolean;
  userHasVoted: boolean;
  currentSwipe: VoteType | null;
  existingVotes: number;
  totalVotes: number;
  onClick: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  voteType,
  optionId,
  count,
  isActive,
  userHasVoted,
  currentSwipe,
  existingVotes,
  totalVotes,
  onClick,
}) => {
  // Configuration based on vote type
  const config = {
    yes: {
      icon: (
        <Check
          className={`w-5 h-5 mb-1 ${isActive || currentSwipe === "yes" ? "text-blue-700" : "text-blue-600"}`}
        />
      ),
      textColor: isActive || currentSwipe === "yes" ? "text-blue-700" : "text-blue-600",
      bgColor:
        isActive || currentSwipe === "yes"
          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400"
          : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]",
      barColor: "bg-blue-200/30",
      highlightColor: "bg-blue-500/75",
    },
    no: {
      icon: (
        <X
          className={`w-5 h-5 mb-1 ${isActive || currentSwipe === "no" ? "text-red-700" : "text-red-600"}`}
        />
      ),
      textColor: isActive || currentSwipe === "no" ? "text-red-700" : "text-red-600",
      bgColor:
        isActive || currentSwipe === "no"
          ? "bg-red-50 border-red-500 ring-2 ring-red-400"
          : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]",
      barColor: "bg-red-200/30",
      highlightColor: "bg-red-500/75",
    },
    maybe: {
      icon: (
        <HelpCircle
          className={`w-5 h-5 mb-1 ${isActive || currentSwipe === "maybe" ? "text-orange-700" : "text-orange-600"}`}
        />
      ),
      textColor: isActive || currentSwipe === "maybe" ? "text-orange-700" : "text-orange-600",
      bgColor:
        isActive || currentSwipe === "maybe"
          ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400"
          : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]",
      barColor: "bg-orange-200/30",
      highlightColor: "bg-orange-500/75",
    },
  };

  const buttonConfig = config[voteType];

  // Logique pour déterminer si le bouton est actif
  // Pour "maybe", il y a un cas spécial où il est actif par défaut
  const isButtonActive =
    isActive || currentSwipe === voteType || (voteType === "maybe" && !userHasVoted);

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${isButtonActive ? buttonConfig.bgColor : buttonConfig.bgColor.replace("bg-", "hover:bg-")}`}
      data-testid="votebutton-button"
    >
      <div className="flex flex-col items-center text-center relative z-10">
        {buttonConfig.icon}
        <span
          className={`text-sm font-bold ${isButtonActive ? buttonConfig.textColor : buttonConfig.textColor.replace("text-", "hover:text-")}`}
        >
          {count}
        </span>
      </div>

      {/* Background bar */}
      <motion.div
        className={`absolute inset-0 ${buttonConfig.barColor}`}
        initial={{ scaleY: 0 }}
        animate={{
          scaleY: totalVotes > 0 ? existingVotes / totalVotes : 0,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "bottom" }}
      />

      {/* Highlight bar for user vote */}
      {isButtonActive && (
        <motion.div
          className={buttonConfig.highlightColor}
          initial={{ height: 0 }}
          animate={{
            height: `${(1 / totalVotes) * 100}%`,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${(existingVotes / totalVotes) * 100}%`,
          }}
        />
      )}

      {/* Statistiques de vote avec système double couche */}
      <VoteStats
        voteType={voteType}
        isActive={isActive}
        existingVotes={existingVotes}
        totalVotes={totalVotes}
        userSwipe={currentSwipe}
        userHasVoted={userHasVoted}
      />
    </button>
  );
};

export default VoteButton;
