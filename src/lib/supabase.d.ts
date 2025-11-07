export declare const supabase: any;
export declare const isLocalDevelopment: boolean;
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    timezone: string;
                    preferences: Record<string, any>;
                    plan_type: "free" | "pro" | "premium";
                    subscription_expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    preferences?: Record<string, any>;
                    plan_type?: "free" | "pro" | "premium";
                    subscription_expires_at?: string | null;
                };
                Update: {
                    full_name?: string | null;
                    avatar_url?: string | null;
                    timezone?: string;
                    preferences?: Record<string, any>;
                    plan_type?: "free" | "pro" | "premium";
                    subscription_expires_at?: string | null;
                };
            };
            polls: {
                Row: {
                    id: string;
                    creator_id: string;
                    title: string;
                    description: string | null;
                    slug: string;
                    settings: Record<string, any>;
                    status: "draft" | "active" | "closed" | "archived";
                    expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    creator_id: string;
                    title: string;
                    description?: string | null;
                    slug: string;
                    settings?: Record<string, any>;
                    status?: "draft" | "active" | "closed" | "archived";
                    expires_at?: string | null;
                };
                Update: {
                    title?: string;
                    description?: string | null;
                    settings?: Record<string, any>;
                    status?: "draft" | "active" | "closed" | "archived";
                    expires_at?: string | null;
                };
            };
            poll_options: {
                Row: {
                    id: string;
                    poll_id: string;
                    option_date: string;
                    time_slots: Record<string, any>[];
                    display_order: number;
                    created_at: string;
                };
                Insert: {
                    poll_id: string;
                    option_date: string;
                    time_slots?: Record<string, any>[];
                    display_order?: number;
                };
                Update: {
                    option_date?: string;
                    time_slots?: Record<string, any>[];
                    display_order?: number;
                };
            };
            votes: {
                Row: {
                    id: string;
                    poll_id: string;
                    voter_email: string;
                    voter_name: string;
                    voter_id: string | null;
                    selections: Record<string, any>;
                    comment: string | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    poll_id: string;
                    voter_email: string;
                    voter_name: string;
                    voter_id?: string | null;
                    selections: Record<string, any>;
                    comment?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    voter_name?: string;
                    selections?: Record<string, any>;
                    comment?: string | null;
                };
            };
            conversations: {
                Row: {
                    id: string;
                    user_id: string | null;
                    session_id: string;
                    title: string | null;
                    messages: Record<string, any>[];
                    context: Record<string, any>;
                    poll_id: string | null;
                    status: "active" | "completed" | "abandoned";
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id?: string | null;
                    session_id: string;
                    title?: string | null;
                    messages?: Record<string, any>[];
                    context?: Record<string, any>;
                    poll_id?: string | null;
                    status?: "active" | "completed" | "abandoned";
                };
                Update: {
                    title?: string | null;
                    messages?: Record<string, any>[];
                    context?: Record<string, any>;
                    poll_id?: string | null;
                    status?: "active" | "completed" | "abandoned";
                };
            };
            analytics_events: {
                Row: {
                    id: string;
                    event_type: string;
                    event_data: Record<string, any>;
                    user_id: string | null;
                    session_id: string | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    event_type: string;
                    event_data: Record<string, any>;
                    user_id?: string | null;
                    session_id?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                };
            };
        };
    };
};
export declare function handleSupabaseError(error: any): string;
