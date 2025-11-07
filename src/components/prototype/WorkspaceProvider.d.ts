import { ReactNode } from "react";
/**
 * Type simplifié Poll pour le prototype
 */
interface Poll {
  id: string;
  title: string;
  type: "date" | "form";
}
interface WorkspaceContextType {
  poll: Poll | null;
  setPoll: (poll: Poll | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}
/**
 * Provider pour state global du workspace
 *
 * Gère le poll en cours et le partage entre:
 * - Chat IA (modifie le poll)
 * - Preview (affiche le poll)
 * - Canvas (édite le poll)
 */
export declare function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook pour accéder au context workspace
 */
export declare function useWorkspace(): WorkspaceContextType;
export {};
