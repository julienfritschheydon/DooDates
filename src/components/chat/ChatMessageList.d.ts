import React from "react";
import type { PollSuggestion } from "../../lib/gemini";
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: PollSuggestion;
  isGenerating?: boolean;
}
interface ChatMessageListProps {
  messages: Message[];
  darkTheme: boolean;
  hasLinkedPoll: boolean;
  linkedPollId: string | null;
  currentPoll: import("../../lib/pollStorage").Poll | null;
  lastAIProposal: {
    userRequest: string;
    generatedContent: import("../../lib/gemini").PollSuggestion;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
      action?: string;
    };
  } | null;
  onUsePollSuggestion: (suggestion: PollSuggestion) => void;
  onOpenEditor: () => void;
  onSetCurrentPoll: (poll: import("../../lib/pollStorage").Poll) => void;
  onFeedbackSent: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
export declare const ChatMessageList: React.FC<ChatMessageListProps>;
export {};
