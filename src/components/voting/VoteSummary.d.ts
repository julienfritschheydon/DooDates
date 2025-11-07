import React from "react";
import { SwipeOption, VoteType } from "./utils/types";
interface VoteSummaryProps {
    options: SwipeOption[];
    votes: Record<string, VoteType>;
    userHasVoted: Record<string, boolean>;
    getVoteText: (vote: VoteType) => string;
}
export declare const VoteSummary: React.FC<VoteSummaryProps>;
export default VoteSummary;
