import { Poll, PollOption, Vote } from "@/lib/supabase-fetch";
interface VoterInfo {
    name: string;
    email: string;
}
export declare const useVoting: (pollSlug: string) => {
    poll: Poll;
    options: PollOption[];
    votes: Vote[];
    currentVote: Record<string, "yes" | "no" | "maybe">;
    userHasVoted: Record<string, boolean>;
    voterInfo: VoterInfo;
    loading: boolean;
    submitting: boolean;
    error: string;
    setVoterInfo: import("react").Dispatch<import("react").SetStateAction<VoterInfo>>;
    updateVote: (optionId: string, value: "yes" | "no" | "maybe") => void;
    removeVote: (optionId: string) => void;
    submitVote: () => Promise<boolean>;
    loadPollData: () => Promise<void>;
    getVoteStats: (optionId: string) => {
        counts: {
            yes: number;
            no: number;
            maybe: number;
        };
        voterNames: string[];
        total: number;
    };
    getBestOption: () => {
        option: PollOption;
        score: number;
        stats: {
            counts: {
                yes: number;
                no: number;
                maybe: number;
            };
            voterNames: string[];
            total: number;
        };
    };
    hasVotes: boolean;
    totalVotes: number;
};
export {};
