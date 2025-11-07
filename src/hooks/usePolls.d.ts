import { PollOption } from "../types/poll";
import { Poll as StoragePoll } from "../lib/pollStorage";
export interface DatePollData {
    type: "date";
    title: string;
    description?: string | null;
    selectedDates: string[];
    timeSlotsByDate: Record<string, Array<{
        hour: number;
        minute: number;
        enabled: boolean;
    }>>;
    participantEmails: string[];
    settings: {
        timeGranularity: number;
        allowAnonymousVotes: boolean;
        allowMaybeVotes: boolean;
        sendNotifications: boolean;
        expiresAt?: string;
    };
}
export interface FormPollData {
    type: "form";
    title: string;
    description?: string | null;
    questions: any[];
    settings?: {
        allowAnonymousResponses?: boolean;
        expiresAt?: string;
    };
}
export type PollData = DatePollData | FormPollData;
export declare function usePolls(): {
    loading: boolean;
    error: string;
    polls: StoragePoll[];
    createPoll: (pollData: PollData) => Promise<{
        poll?: StoragePoll;
        error?: string;
    }>;
    getUserPolls: () => Promise<{
        polls?: StoragePoll[];
        error?: string;
    }>;
    getPollBySlug: (slug: string) => Promise<{
        poll?: StoragePoll;
        options?: PollOption[];
        error?: string;
    }>;
    updatePollStatus: (pollId: string, status: StoragePoll["status"]) => Promise<{
        error?: string;
    }>;
    deletePoll: (pollId: string) => Promise<{
        error?: undefined;
    } | {
        error: any;
    }>;
};
