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
    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">
        Résumé de mes votes :
      </h3>
      <div className="space-y-2 text-sm">
        {options.map((option) => {
          const vote = votes[option.id];
          const hasVoted = userHasVoted[option.id];
          const voteLabel = getVoteText(vote);
          const voteColor = vote === "yes" ? "text-green-600" : vote === "no" ? "text-red-600" : "text-orange-600";

          return (
            <div
              key={option.id}
              className="flex justify-between items-center"
            >
              <span className="text-gray-600">
                {formatDate(option.option_date)} • {formatTime(option.time_slots)}
              </span>
              <span
                className={`font-medium ${hasVoted ? voteColor : "text-gray-400"}`}
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
