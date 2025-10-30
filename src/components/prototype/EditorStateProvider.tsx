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
import { useLocation } from "react-router-dom";
import { logError, ErrorFactory } from "@/lib/error-handling";
import { pollReducer, type PollAction } from "@/reducers/pollReducer";
import type { Poll } from "@/types/poll";
import { addPoll, type Poll as StoragePoll } from "@/lib/pollStorage";
import { logger } from "@/lib/logger";

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

  // Actions combinées
  createPollFromChat: (pollData: any) => void;
}

const EditorStateContext = createContext<EditorStateContextType | undefined>(undefined);

const STORAGE_KEY = "prototype_current_poll";

interface EditorStateProviderProps {
  children: ReactNode;
}

export function EditorStateProvider({ children }: EditorStateProviderProps) {
  const location = useLocation();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPoll, dispatchPoll] = useReducer(pollReducer, null);

  // Charger le sondage depuis localStorage au démarrage (CONDITIONNEL)
  // 🔧 Écouter les changements d'URL via location.search
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const conversationId = urlParams.get("conversationId");
      const resumeId = urlParams.get("resume");
      const isNewChat = urlParams.get("new");

      console.log("🔍 EditorStateProvider - URL params:", { conversationId, resumeId, isNewChat });

      // ✅ Ne restaurer QUE si on reprend une conversation existante
      const shouldRestore = conversationId || resumeId;

      if (shouldRestore) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const poll = JSON.parse(stored);
          dispatchPoll({ type: "REPLACE_POLL", payload: poll });
          setIsEditorOpen(true);
          logger.info("✅ Sondage restauré depuis localStorage", "poll", { pollId: poll.id });
        }
      } else {
        // ✅ Si pas de conversation à restaurer (nouveau chat ou navigation vers /), nettoyer
        console.log("🧹 Nettoyage du poll (pas de conversation à restaurer)");
        localStorage.removeItem(STORAGE_KEY);
        dispatchPoll({ type: "REPLACE_POLL", payload: null });
        setIsEditorOpen(false);
        logger.info("🧹 Poll nettoyé - état vierge", "poll");
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
  }, [location.search]); // 🔧 Se déclencher quand l'URL change

  // Sauvegarder le sondage dans localStorage ET pollStorage à chaque changement
  useEffect(() => {
    try {
      if (currentPoll) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPoll));

        // 🔧 FIX: Sauvegarder aussi dans pollStorage pour que les modifications soient visibles
        addPoll(currentPoll as any);
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

  // Action combinée : créer un sondage depuis les données Gemini
  const createPollFromChat = useCallback(async (pollData: any) => {
    console.log("🔍 createPollFromChat appelé avec:", pollData);

    const now = new Date().toISOString();
    const slug = `poll-${Date.now()}`;
    const uid = () => Math.random().toString(36).slice(2, 10);

    // Convertir timeSlots si présents
    let timeSlotsByDate = {};
    if (pollData.timeSlots && pollData.timeSlots.length > 0) {
      timeSlotsByDate = pollData.timeSlots.reduce((acc: any, slot: any) => {
        const targetDates = slot.dates && slot.dates.length > 0 ? slot.dates : pollData.dates || [];

        targetDates.forEach((date: string) => {
          if (!acc[date]) acc[date] = [];

          const startHour = parseInt(slot.start.split(":")[0]);
          const startMinute = parseInt(slot.start.split(":")[1]);
          const endHour = parseInt(slot.end.split(":")[0]);
          const endMinute = parseInt(slot.end.split(":")[1]);

          const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

          acc[date].push({
            hour: startHour,
            minute: startMinute,
            duration: durationMinutes,
            enabled: true,
          });
        });
        return acc;
      }, {});
    }

    // Convertir les questions Gemini en format FormPollCreator
    let convertedQuestions = pollData.questions || [];
    if (pollData.type === "form" && pollData.questions) {
      console.log("🔍 Conversion questions Gemini:", pollData.questions);
      convertedQuestions = pollData.questions.map((q: any) => {
        const baseQuestion = {
          id: uid(),
          title: q.title,
          required: q.required || false,
          type: q.type,
        };

        if (q.type === "single" || q.type === "multiple") {
          const options = (q.options || [])
            .filter((opt: any) => opt && typeof opt === "string" && opt.trim())
            .map((opt: string) => ({
              id: uid(),
              label: opt.trim(),
            }));
          console.log("🔍 Options converties:", options);

          return {
            ...baseQuestion,
            options,
            ...(q.maxChoices && { maxChoices: q.maxChoices }),
          };
        } else {
          return {
            ...baseQuestion,
            ...(q.placeholder && { placeholder: q.placeholder }),
            ...(q.maxLength && { maxLength: q.maxLength }),
          };
        }
      });
      console.log("🔍 Questions converties:", convertedQuestions);
    }

    const poll: StoragePoll = {
      id: slug,
      slug: slug,
      title: pollData.title || "Nouveau sondage",
      type: pollData.type || "date",
      dates: pollData.dates || [],
      questions: convertedQuestions,
      created_at: now,
      updated_at: now,
      creator_id: "guest",
      status: "draft" as const,
      settings: {
        selectedDates: pollData.dates || [],
        timeSlotsByDate: timeSlotsByDate,
      },
    };

    // Sauvegarder dans pollStorage et ouvrir l'éditeur
    try {
      addPoll(poll);
      setCurrentPoll(poll as any);
      setIsEditorOpen(true);

      // 🔧 FIX: Sauvegarder le pollId dans les métadonnées de la conversation
      // pour pouvoir le retrouver après refresh ou dans les tests E2E
      const conversationId = new URLSearchParams(window.location.search).get("conversationId");
      if (conversationId) {
        try {
          const { getConversation, updateConversation } = await import(
            "../../lib/storage/ConversationStorageSimple"
          );
          const conversation = getConversation(conversationId);
          if (conversation) {
            updateConversation({
              ...conversation,
              relatedPollId: poll.id,
              updatedAt: new Date(),
            });
            console.log("✅ PollId sauvegardé dans conversation:", poll.id);
          }
        } catch (error) {
          logError(ErrorFactory.storage("Impossible de mettre à jour la conversation avec pollId", "Erreur de sauvegarde"), { metadata: { error } });
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde", error);
    }
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
    createPollFromChat,
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
    createPollFromChat,
  } = useEditorState();
  return {
    openEditor,
    closeEditor,
    toggleEditor,
    dispatchPollAction,
    setCurrentPoll,
    clearCurrentPoll,
    createPollFromChat,
  };
}
