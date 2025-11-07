/**
 * ConversationStateProvider
 *
 * Contexte dédié pour gérer l'état des conversations (Business Logic)
 * Extrait de ConversationProvider pour éviter re-renders inutiles
 *
 * Responsabilités :
 * - État conversation (ID, messages)
 * - Persistence dans localStorage
 * - Synchronisation avec l'historique
 *
 * @see Docs/Architecture-ConversationProvider.md
 */
import { ReactNode } from "react";
import type { Message } from "@/services/ConversationService";
export type { Message };
export interface ConversationStateContextType {
  conversationId: string | null;
  messages: Message[];
  setConversationId: (id: string | null) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
}
interface ConversationStateProviderProps {
  children: ReactNode;
}
export declare function ConversationStateProvider({
  children,
}: ConversationStateProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook pour accéder à l'état conversation
 *
 * @throws Error si utilisé hors du ConversationStateProvider
 */
export declare function useConversationState(): ConversationStateContextType;
/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */
/**
 * Hook pour accéder uniquement aux messages
 * Le composant ne re-render que si messages change
 */
export declare function useConversationMessages(): Message[];
/**
 * Hook pour accéder uniquement à l'ID de conversation
 * Le composant ne re-render que si conversationId change
 */
export declare function useConversationId(): string;
/**
 * Hook pour accéder uniquement aux actions
 * Le composant ne re-render jamais (actions stables)
 */
export declare function useConversationActions(): {
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
};
