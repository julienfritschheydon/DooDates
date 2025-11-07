import React from "react";
interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }>;
  display_order: number;
}
interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}
interface VoteGridProps {
  options: PollOption[];
  votes: Vote[];
  currentVote: Record<string, "yes" | "no" | "maybe">;
  userHasVoted: Record<string, boolean>;
  onVoteChange: (optionId: string, value: "yes" | "no" | "maybe") => void;
  onHaptic: (type: "light" | "medium" | "heavy") => void;
}
export declare const VoteGrid: React.FC<VoteGridProps>;
export {};
