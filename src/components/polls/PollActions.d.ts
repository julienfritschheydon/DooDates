import React from "react";
import { Poll } from "@/lib/pollStorage";
export type PollActionsVariant = "compact" | "full";
interface PollActionsProps {
  poll: Poll;
  showVoteButton?: boolean;
  variant?: PollActionsVariant;
  className?: string;
  onEdit?: (pollId: string) => void;
  onAfterDuplicate?: (newPoll: Poll) => void;
  onAfterDelete?: () => void;
  onAfterArchive?: () => void;
  onAfterClose?: () => void;
}
export declare const PollActions: React.FC<PollActionsProps>;
export default PollActions;
