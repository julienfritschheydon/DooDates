/* eslint-disable react-refresh/only-export-components */
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
import { addPoll, type Poll } from "@/lib/pollStorage";
import { logger } from "@/lib/logger";
import { usePolls } from "@/hooks/usePolls";
import { useFormPollCreation } from "@/hooks/useFormPollCreation";

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
  const { createPoll } = usePolls();
  const { createFormPoll } = useFormPollCreation();
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

      logger.debug("EditorStateProvider - URL params", "poll", {
        conversationId,
        resumeId,
        isNewChat,
      });

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
        logger.debug("Nettoyage du poll (pas de conversation à restaurer)", "poll");
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
    logger.debug("createPollFromChat appelé", "poll", { pollData });

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
      logger.debug("Conversion questions Gemini", "poll", { questions: pollData.questions });
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
          logger.debug("Options converties", "poll", { options });

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
      logger.debug("Questions converties", "poll", { convertedQuestions });
    }

    // ✅ Utiliser les hooks centralisés pour sauvegarder dans Supabase
    try {
      let pollResult;

      if (pollData.type === "form") {
        // Créer un formulaire via le hook centralisé
        pollResult = await createFormPoll({
          title: pollData.title || "Nouveau formulaire",
          description: undefined,
          questions: convertedQuestions.map((q: any) => ({
            id: q.id,
            type: q.type,
            title: q.title,
            required: q.required || false,
            options: q.options,
            maxChoices: q.maxChoices,
            placeholder: q.placeholder,
            maxLength: q.maxLength,
          })),
          settings: {
            allowAnonymousResponses: true,
            expiresAt: undefined,
          },
        });
      } else {
        // Créer un sondage de dates
        logger.info("💾 Création sondage via IA", "poll", { title: pollData.title });
        const datePollData: import("../../hooks/usePolls").DatePollData = {
          type: "date",
          title: pollData.title || "Nouveau sondage",
          description: undefined,
          selectedDates: pollData.dates || [],
          timeSlotsByDate: timeSlotsByDate,
          participantEmails: [],
          settings: {
            timeGranularity: 30,
            allowAnonymousVotes: true,
            allowMaybeVotes: true,
            sendNotifications: false,
            expiresAt: undefined,
          },
        };
        pollResult = await createPoll(datePollData);
      }

      if (pollResult.error || !pollResult.poll) {
        logger.error("❌ Erreur création poll via IA", "poll", { error: pollResult.error });
        throw ErrorFactory.storage(
          pollResult.error || "Impossible de créer le poll",
          "Une erreur s'est produite lors de la création du poll",
        );
      }

      // Utiliser le poll créé
      const poll = pollResult.poll;
      setCurrentPoll(poll as any);
      setIsEditorOpen(true);

      logger.info("✅ Poll créé via IA et sauvegardé dans Supabase", "poll", {
        pollId: poll.id,
        pollType: poll.type,
        conversationId: poll.conversationId,
      });

      // 🔧 FIX: Sauvegarder le pollId dans la conversation pour affichage dashboard
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
              pollId: poll.id, // ✅ Utiliser 'pollId' (pas 'relatedPollId')
              pollType: poll.type as "date" | "form",
              pollStatus: poll.status,
              updatedAt: new Date(),
            });
            logger.info("✅ Poll lié à la conversation", "poll", {
              conversationId,
              pollId: poll.id,
              pollType: poll.type,
            });
          }
        } catch (error) {
          logError(
            ErrorFactory.storage(
              "Impossible de mettre à jour la conversation avec pollId",
              "Erreur de sauvegarde",
            ),
            { metadata: { error } },
          );
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionnel : setCurrentPoll est stable (useState setter), pas besoin de le tracker

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
