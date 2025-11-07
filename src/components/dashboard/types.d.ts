import { Poll as StoragePoll } from "@/lib/pollStorage";
export interface DashboardPoll extends StoragePoll {
    votes_count?: number;
    participants_count?: number;
    topDates?: {
        date: string;
        score: number;
    }[];
    relatedConversationId?: string;
}
export interface ConversationItem {
    id: string;
    conversationTitle: string;
    conversationDate: Date;
    poll?: DashboardPoll;
    hasAI: boolean;
    tags?: string[];
    folderId?: string;
}
export type FilterType = "all" | "draft" | "active" | "closed" | "archived";
