export interface Poll {
    id: string;
    slug: string;
    title: string;
    description: string;
    status: string;
    creator_id?: string;
    admin_token?: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
    dates?: string[];
}
export interface PollOption {
    id: string;
    poll_id: string;
    option_date: string;
    time_slots: Array<{
        hour: number;
        minute: number;
        duration?: number;
    }> | null;
    display_order?: number;
    created_at?: string;
    date_group?: string[];
    date_group_label?: string;
    date_group_type?: "weekend" | "week" | "fortnight" | "custom";
}
export interface Vote {
    id: string;
    poll_id: string;
    voter_email: string;
    voter_name: string;
    selections: Record<string, "yes" | "no" | "maybe">;
    created_at: string;
}
export declare const pollsApi: {
    getBySlug(slug: string): Promise<Poll | null>;
    create(poll: Omit<Poll, "id" | "created_at" | "updated_at">): Promise<Poll>;
    update(id: string, updates: Partial<Poll>): Promise<Poll>;
};
export declare const pollOptionsApi: {
    getByPollId(pollId: string): Promise<PollOption[]>;
    createMany(options: Omit<PollOption, "id">[]): Promise<PollOption[]>;
};
export declare const votesApi: {
    getByPollId(pollId: string): Promise<Vote[]>;
    create(vote: Omit<Vote, "id" | "created_at">): Promise<Vote>;
    update(id: string, updates: Partial<Vote>): Promise<Vote>;
};
export declare const testConnection: () => Promise<boolean>;
