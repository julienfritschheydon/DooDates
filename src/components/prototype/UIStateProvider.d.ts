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
import { ReactNode } from "react";
export interface UIStateContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  highlightedId: string | null;
  highlightType: "add" | "remove" | "modify" | null;
  setHighlight: (id: string | null, type: "add" | "remove" | "modify" | null) => void;
  clearHighlight: () => void;
  modifiedQuestionId: string | null;
  modifiedField: "title" | "type" | "options" | "required" | null;
  setModifiedQuestion: (
    questionId: string | null,
    field: "title" | "type" | "options" | "required" | null,
  ) => void;
  clearModifiedQuestion: () => void;
}
export interface UIStateProviderProps {
  children: ReactNode;
}
/**
 * Provider pour l'état UI (sidebar, highlights, animations)
 *
 * Séparé de ConversationProvider pour éviter re-renders inutiles
 * de la conversation quand on modifie l'UI
 */
export declare function UIStateProvider({
  children,
}: UIStateProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook pour accéder à l'état UI
 *
 * @throws Error si utilisé hors du UIStateProvider
 */
export declare function useUIState(): UIStateContextType;
/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */
/**
 * Hook pour accéder uniquement à l'état sidebar
 */
export declare function useSidebarState(): {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
};
/**
 * Hook pour accéder uniquement aux highlights
 */
export declare function useHighlightState(): {
  highlightedId: string;
  highlightType: "add" | "modify" | "remove";
  setHighlight: (id: string | null, type: "add" | "remove" | "modify" | null) => void;
  clearHighlight: () => void;
};
/**
 * Hook pour accéder uniquement aux modifications visuelles
 */
export declare function useModifiedQuestionState(): {
  modifiedQuestionId: string;
  modifiedField: "title" | "type" | "required" | "options";
  setModifiedQuestion: (
    questionId: string | null,
    field: "title" | "type" | "options" | "required" | null,
  ) => void;
  clearModifiedQuestion: () => void;
};
