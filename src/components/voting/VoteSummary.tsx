import React from "react";
import { SwipeOption, VoteType } from "./utils/types";
import { formatDate, formatTime } from "./utils/dateUtils";

interface VoteSummaryProps {
  options: SwipeOption[];
  votes: Record<string, VoteType>;
  userHasVoted: Record<string, boolean>;
  getVoteText: (vote: VoteType) => string;
}

export const VoteSummary: React.FC<VoteSummaryProps> = ({
  options,
  votes,
  userHasVoted,
  getVoteText,
}) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
      <h3 className="font-semibold text-white mb-3">
        Résumé de mes votes :
      </h3>
      <div className="space-y-2 text-sm">
        {options.map((option) => {
          const vote = votes[option.id];
          const hasVoted = userHasVoted[option.id];
          const voteLabel = getVoteText(vote);
          const voteColor =
            vote === "yes"
              ? "text-green-400"
              : vote === "no"
                ? "text-red-400"
                : "text-orange-400";

          return (
            <div key={option.id} className="flex justify-between items-center">
              <span className="text-gray-300">
                {formatDate(option.option_date)} •{" "}
                {formatTime(option.time_slots)}
              </span>
              <span
                className={`font-medium ${hasVoted ? voteColor : "text-gray-500"}`}
              >
                {hasVoted ? voteLabel : "🤔 Peut-être"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoteSummary;
