/**
 * UIStateProvider
 *
 * Contexte dédié pour gérer l'état UI (sidebar, highlights, animations)
 * Extrait de ConversationProvider pour éviter re-renders inutiles
 *
 * Responsabilités :
 * - État sidebar (ouvert/fermé, mobile)
 * - Highlights (ID, type, animations)
 * - Modifications visuelles (feedback temporaire)
 *
 * @see Docs/Architecture-ConversationProvider.md
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ErrorFactory } from "@/lib/error-handling";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface UIStateContextType {
  // Sidebar
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;

  // Highlights (animations)
  highlightedId: string | null;
  highlightType: "add" | "remove" | "modify" | null;
  setHighlight: (id: string | null, type: "add" | "remove" | "modify" | null) => void;
  clearHighlight: () => void;

  // Modifications visuelles (feedback temporaire)
  modifiedQuestionId: string | null;
  modifiedField: "title" | "type" | "options" | "required" | null;
  setModifiedQuestion: (
    questionId: string | null,
    field: "title" | "type" | "options" | "required" | null,
  ) => void;
  clearModifiedQuestion: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export interface UIStateProviderProps {
  children: ReactNode;
}

/**
 * Provider pour l'état UI (sidebar, highlights, animations)
 *
 * Séparé de ConversationProvider pour éviter re-renders inutiles
 * de la conversation quand on modifie l'UI
 */
export function UIStateProvider({ children }: UIStateProviderProps) {
  // Détection mobile
  const isMobile = useMediaQuery("(max-width: 767px)");

  // État sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // État highlights (animations)
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightType, setHighlightType] = useState<"add" | "remove" | "modify" | null>(null);

  // État modifications visuelles
  const [modifiedQuestionId, setModifiedQuestionId] = useState<string | null>(null);
  const [modifiedField, setModifiedField] = useState<
    "title" | "type" | "options" | "required" | null
  >(null);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  /**
   * Définir un highlight avec auto-clear après 3s
   */
  const setHighlight = useCallback(
    (id: string | null, type: "add" | "remove" | "modify" | null) => {
      setHighlightedId(id);
      setHighlightType(type);

      // Auto-clear après 3 secondes
      if (id) {
        setTimeout(() => {
          setHighlightedId(null);
          setHighlightType(null);
        }, 3000);
      }
    },
    [],
  );

  /**
   * Clear highlight immédiatement
   */
  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
    setHighlightType(null);
  }, []);

  /**
   * Définir une question modifiée avec auto-clear après 3s
   */
  const setModifiedQuestion = useCallback(
    (questionId: string | null, field: "title" | "type" | "options" | "required" | null) => {
      setModifiedQuestionId(questionId);
      setModifiedField(field);

      // Auto-clear après 3 secondes
      if (questionId) {
        setTimeout(() => {
          setModifiedQuestionId(null);
          setModifiedField(null);
        }, 3000);
      }
    },
    [],
  );

  /**
   * Clear modification immédiatement
   */
  const clearModifiedQuestion = useCallback(() => {
    setModifiedQuestionId(null);
    setModifiedField(null);
  }, []);

  const value: UIStateContextType = {
    // Sidebar
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    isMobile,

    // Highlights
    highlightedId,
    highlightType,
    setHighlight,
    clearHighlight,

    // Modifications
    modifiedQuestionId,
    modifiedField,
    setModifiedQuestion,
    clearModifiedQuestion,
  };

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

/**
 * Hook pour accéder à l'état UI
 *
 * @throws Error si utilisé hors du UIStateProvider
 */
export function useUIState(): UIStateContextType {
  const context = useContext(UIStateContext);

  if (!context) {
    throw ErrorFactory.validation(
      "useUIState must be used within UIStateProvider",
      "Une erreur s'est produite lors de l'initialisation de l'interface",
    );
  }

  return context;
}

/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */

/**
 * Hook pour accéder uniquement à l'état sidebar
 */
export function useSidebarState() {
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar, isMobile } = useUIState();
  return { isSidebarOpen, setIsSidebarOpen, toggleSidebar, isMobile };
}

/**
 * Hook pour accéder uniquement aux highlights
 */
export function useHighlightState() {
  const { highlightedId, highlightType, setHighlight, clearHighlight } = useUIState();
  return { highlightedId, highlightType, setHighlight, clearHighlight };
}

/**
 * Hook pour accéder uniquement aux modifications visuelles
 */
export function useModifiedQuestionState() {
  const { modifiedQuestionId, modifiedField, setModifiedQuestion, clearModifiedQuestion } =
    useUIState();
  return {
    modifiedQuestionId,
    modifiedField,
    setModifiedQuestion,
    clearModifiedQuestion,
  };
}
