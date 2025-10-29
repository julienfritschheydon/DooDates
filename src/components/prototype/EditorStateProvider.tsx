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

import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ErrorFactory, logError } from "@/lib/error-handling";
import { pollReducer, type PollAction } from "@/reducers/pollReducer";
import type { Poll } from "@/types/poll";

export interface EditorStateContextType {
  // État éditeur
  isEditorOpen: boolean;
  currentPoll: Poll | null;

  // Actions éditeur
  openEditor: () => void;
  closeEditor: () => void;
  toggleEditor: () => void;

  // Actions sondage
  dispatchPollAction: (action: PollAction) => void;
  setCurrentPoll: (poll: Poll | null) => void;
  clearCurrentPoll: () => void;
}

const EditorStateContext = createContext<EditorStateContextType | undefined>(undefined);

const STORAGE_KEY = "prototype_current_poll";

interface EditorStateProviderProps {
  children: ReactNode;
}

export function EditorStateProvider({ children }: EditorStateProviderProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPoll, dispatchPoll] = useReducer(pollReducer, null);

  // Charger le sondage depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const poll = JSON.parse(stored);
        dispatchPoll({ type: "REPLACE_POLL", payload: poll });

        // Ouvrir automatiquement l'éditeur si un sondage existe
        if (poll) {
          setIsEditorOpen(true);
        }
      }
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to load poll from localStorage",
          "Impossible de charger le sondage en cours",
        ),
        { component: "EditorStateProvider", operation: "loadPoll", metadata: { error } },
      );
    }
  }, []);

  // Sauvegarder le sondage dans localStorage à chaque changement
  useEffect(() => {
    try {
      if (currentPoll) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPoll));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to save poll to localStorage",
          "Impossible de sauvegarder le sondage",
        ),
        { component: "EditorStateProvider", operation: "savePoll", metadata: { error } },
      );
    }
  }, [currentPoll]);

  // Actions éditeur
  const openEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const toggleEditor = useCallback(() => {
    setIsEditorOpen((prev) => !prev);
  }, []);

  // Actions sondage
  const dispatchPollAction = useCallback((action: PollAction) => {
    dispatchPoll(action);
  }, []);

  const setCurrentPoll = useCallback((poll: Poll | null) => {
    dispatchPoll({ type: "REPLACE_POLL", payload: poll });
  }, []);

  const clearCurrentPoll = useCallback(() => {
    dispatchPoll({ type: "REPLACE_POLL", payload: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: EditorStateContextType = {
    isEditorOpen,
    currentPoll,
    openEditor,
    closeEditor,
    toggleEditor,
    dispatchPollAction,
    setCurrentPoll,
    clearCurrentPoll,
  };

  return <EditorStateContext.Provider value={value}>{children}</EditorStateContext.Provider>;
}

/**
 * Hook pour accéder à l'état éditeur
 *
 * @throws Error si utilisé hors du EditorStateProvider
 */
export function useEditorState(): EditorStateContextType {
  const context = useContext(EditorStateContext);

  if (!context) {
    throw ErrorFactory.validation(
      "useEditorState must be used within EditorStateProvider",
      "Une erreur s'est produite lors de l'initialisation de l'éditeur",
    );
  }

  return context;
}

/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */

/**
 * Hook pour accéder uniquement au sondage actuel
 * Le composant ne re-render que si currentPoll change
 */
export function useCurrentPoll() {
  const { currentPoll } = useEditorState();
  return currentPoll;
}

/**
 * Hook pour accéder uniquement à l'état d'ouverture de l'éditeur
 * Le composant ne re-render que si isEditorOpen change
 */
export function useIsEditorOpen() {
  const { isEditorOpen } = useEditorState();
  return isEditorOpen;
}

/**
 * Hook pour accéder uniquement aux actions de l'éditeur
 * Le composant ne re-render jamais (actions stables)
 */
export function useEditorActions() {
  const {
    openEditor,
    closeEditor,
    toggleEditor,
    dispatchPollAction,
    setCurrentPoll,
    clearCurrentPoll,
  } = useEditorState();
  return {
    openEditor,
    closeEditor,
    toggleEditor,
    dispatchPollAction,
    setCurrentPoll,
    clearCurrentPoll,
  };
}
