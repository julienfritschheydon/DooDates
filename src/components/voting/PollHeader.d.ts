import React from "react";
import { Poll, SwipeVote } from "./utils/types";
interface PollHeaderProps {
  poll: Poll | null;
  existingVotes?: SwipeVote[];
  onBack?: () => void;
  totalVotes?: number;
  remainingVotes?: number;
  progressPercent?: number;
  onViewConversation?: (conversationId: string) => void;
}
export declare const PollHeader: React.FC<PollHeaderProps>;
export default PollHeader;
