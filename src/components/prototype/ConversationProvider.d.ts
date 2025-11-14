import { ReactNode } from "react";
import { type Poll as StoragePoll } from "../../lib/pollStorage";
import { type PollAction } from "../../reducers/pollReducer";
import { type FormPollAction } from "../../reducers/formPollReducer";
/**
 * Types pour la conversation partagée
 */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: import("../../lib/gemini").PollSuggestion;
}
type Poll = StoragePoll;
interface ConversationContextType {
  conversationId: string | null;
  messages: Message[];
  isEditorOpen: boolean;
  currentPoll: Poll | null;
  highlightedId: string | null;
  highlightType: "add" | "remove" | "modify" | null;
  modifiedQuestionId: string | null;
  modifiedField: "title" | "type" | "options" | "required" | null;
  setModifiedQuestion: (
    questionId: string | null,
    field: "title" | "type" | "options" | "required" | null,
  ) => void;
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearConversation: () => void;
  openEditor: (poll: Poll) => void;
  closeEditor: () => void;
  updatePoll: (poll: Poll) => void;
  createPollFromChat: (
    pollData:
      | import("../../lib/gemini").PollSuggestion
      | Partial<import("../../lib/pollStorage").Poll>,
  ) => void;
  dispatchPollAction: (action: PollAction | FormPollAction) => void;
}
/**
 * Provider pour la conversation et l'éditeur partagés
 *
 * Gère l'état central de l'application AI-First :
 * - Conversation avec l'IA (messages, ID)
 * - État de l'éditeur (ouvert/fermé, sondage actuel)
 * - Interactions entre chat et éditeur
 */
export declare function ConversationProvider({
  children,
}: {
  children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook pour accéder au context conversation
 */
export declare function useConversation(): ConversationContextType;
export {};
