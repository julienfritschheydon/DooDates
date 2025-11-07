import React from "react";
import { VoteType } from "./utils/types";
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
export declare const VoteButton: React.FC<VoteButtonProps>;
export default VoteButton;
