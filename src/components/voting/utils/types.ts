/**
 * Types for the voting components
 */

export interface SwipeVote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}

export interface SwipeOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }> | null;
  display_order?: number;
}

export interface VoterInfo {
  name: string;
  email: string;
  comment?: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

export type VoteType = "yes" | "no" | "maybe";

export interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  creator_id?: string;
  created_at: string;
  expires_at: string;
  // AI conversation linking
  conversation_id?: string;
  created_by_ai?: boolean;
  ai_metadata?: {
    conversation_title?: string;
    message_id?: string;
    generated_at?: string;
  };
}
