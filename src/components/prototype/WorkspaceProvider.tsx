import { createContext, useContext, useState, ReactNode } from "react";
import { ErrorFactory } from "@/lib/error-handling";

/**
 * Type simplifié Poll pour le prototype
 */
interface Poll {
  id: string;
  title: string;
  type: "date" | "form";
  // ... autres champs selon besoin
}

interface WorkspaceContextType {
  poll: Poll | null;
  setPoll: (poll: Poll | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

/**
 * Provider pour state global du workspace
 *
 * Gère le poll en cours et le partage entre:
 * - Chat IA (modifie le poll)
 * - Preview (affiche le poll)
 * - Canvas (édite le poll)
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <WorkspaceContext.Provider value={{ poll, setPoll, isLoading, setIsLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Hook pour accéder au context workspace
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw ErrorFactory.validation(
      "useWorkspace must be used within WorkspaceProvider",
      "Hook utilisé hors contexte",
    );
  }
  return context;
}
