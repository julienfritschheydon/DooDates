import React from "react";
import { PanInfo } from "framer-motion";
import { SwipeOption, VoteType } from "./utils/types";
interface VoteOptionProps {
  option: SwipeOption;
  index: number;
  userVote: VoteType;
  userHasVoted: boolean;
  currentSwipe: VoteType | null;
  handleVote: (optionId: string, voteType: VoteType) => void;
  handleSwipe: (optionId: string, direction: number) => void;
  handleOptionDragEnd: (event: any, info: PanInfo, optionId: string) => void;
  getStatsWithUser: (optionId: string) => {
    yes: number;
    maybe: number;
    no: number;
  };
  getExistingStats: (optionId: string) => {
    yes: number;
    maybe: number;
    no: number;
  };
  getRanking: (type: string) => Record<string, number> | number;
  anyUserHasVoted: boolean;
}
declare const VoteOption: React.FC<VoteOptionProps>;
export default VoteOption;
