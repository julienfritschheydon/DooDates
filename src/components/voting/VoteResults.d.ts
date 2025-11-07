import React from "react";
interface Poll {
  id: string;
  title: string;
  description?: string;
  status: string;
  creator_id: string;
  created_at: string;
}
interface PollOption {
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
interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}
interface VoteResultsProps {
  poll: Poll;
  options: PollOption[];
  votes: Vote[];
  onBack: () => void;
}
export declare const VoteResults: React.FC<VoteResultsProps>;
export {};
