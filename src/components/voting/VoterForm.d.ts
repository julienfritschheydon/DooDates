import React from "react";
import { VoterInfo, SwipeOption, VoteType } from "./utils/types";
interface VoterFormProps {
  options: SwipeOption[];
  votes: Record<string, VoteType>;
  userHasVoted: Record<string, boolean>;
  onBack: () => void;
  onCancel?: () => void;
  onSubmit: (voterInfo: VoterInfo) => Promise<void>;
  isSubmitting: boolean;
  getVoteText: (vote: VoteType) => string;
  setVoterInfo?: (info: VoterInfo) => void;
  voterInfo?: VoterInfo;
  formErrors?: Record<string, string>;
}
export declare const VoterForm: React.FC<VoterFormProps>;
export default VoterForm;
