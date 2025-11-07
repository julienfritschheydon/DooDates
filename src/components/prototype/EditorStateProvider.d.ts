/**
 * EditorStateProvider
 *
 * Contexte dédié pour gérer l'état de l'éditeur de sondages (Business Logic)
 * Extrait de ConversationProvider pour éviter re-renders inutiles
 *
 * Responsabilités :
 * - État éditeur (ouvert/fermé)
 * - Sondage en cours d'édition (Date ou Form)
 * - Dispatch actions vers reducers
 * - Persistence du sondage
 *
 * @see Docs/Architecture-ConversationProvider.md
 */
import { ReactNode } from "react";
import { type PollAction } from "@/reducers/pollReducer";
import { type Poll } from "@/lib/pollStorage";
export interface EditorStateContextType {
  isEditorOpen: boolean;
  currentPoll: Poll | null;
  openEditor: () => void;
  closeEditor: () => void;
  toggleEditor: () => void;
  dispatchPollAction: (action: PollAction) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  clearCurrentPoll: () => void;
  createPollFromChat: (pollData: any) => void;
}
interface EditorStateProviderProps {
  children: ReactNode;
}
export declare function EditorStateProvider({
  children,
}: EditorStateProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook pour accéder à l'état éditeur
 *
 * @throws Error si utilisé hors du EditorStateProvider
 */
export declare function useEditorState(): EditorStateContextType;
/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */
/**
 * Hook pour accéder uniquement au sondage actuel
 * Le composant ne re-render que si currentPoll change
 */
export declare function useCurrentPoll(): Poll;
/**
 * Hook pour accéder uniquement à l'état d'ouverture de l'éditeur
 * Le composant ne re-render que si isEditorOpen change
 */
export declare function useIsEditorOpen(): boolean;
/**
 * Hook pour accéder uniquement aux actions de l'éditeur
 * Le composant ne re-render jamais (actions stables)
 */
export declare function useEditorActions(): {
  openEditor: () => void;
  closeEditor: () => void;
  toggleEditor: () => void;
  dispatchPollAction: (action: PollAction) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  clearCurrentPoll: () => void;
  createPollFromChat: (pollData: any) => void;
};
export {};
