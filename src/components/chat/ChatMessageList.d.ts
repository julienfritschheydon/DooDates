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
  currentPoll: any;
  lastAIProposal: {
    userRequest: string;
    generatedContent: any;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
      action?: string;
    };
  } | null;
  onUsePollSuggestion: (suggestion: PollSuggestion) => void;
  onOpenEditor: () => void;
  onSetCurrentPoll: (poll: any) => void;
  onFeedbackSent: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
export declare const ChatMessageList: React.FC<ChatMessageListProps>;
export {};
