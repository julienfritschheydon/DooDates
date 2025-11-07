/**
 * Utility functions for voting calculations and interactions
 */
import { SwipeOption, SwipeVote, VoteType } from "./types";
export declare const getExistingStats: (optionId: string, votes: SwipeVote[]) => {
    yes: number;
    no: number;
    maybe: number;
};
export declare const getStatsWithUser: (optionId: string, votes: SwipeVote[], userVotes: Record<string, VoteType>) => {
    yes: number;
    no: number;
    maybe: number;
};
export declare const calculateOptionScore: (optionId: string, votes: SwipeVote[], userVotes: Record<string, VoteType>) => number;
export declare const getRanking: (options: SwipeOption[], votes: SwipeVote[], userVotes: Record<string, VoteType>) => Record<string, number>;
export declare const triggerHaptic: (type?: "light" | "medium" | "heavy") => void;
