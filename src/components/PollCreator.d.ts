import React from "react";
import type { DatePollSuggestion } from "../lib/gemini";
interface PollCreatorProps {
  onBack?: (createdPoll?: import("../lib/pollStorage").Poll) => void;
  onOpenMenu?: () => void;
  initialData?: DatePollSuggestion;
  withBackground?: boolean;
}
declare const PollCreator: React.FC<PollCreatorProps>;
export default PollCreator;
