import React from "react";
interface VoteActionsProps {
  voterInfo: {
    name: string;
    email: string;
  };
  onVoterInfoChange: (info: { name: string; email: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasVotes: boolean;
}
export declare const VoteActions: React.FC<VoteActionsProps>;
export {};
