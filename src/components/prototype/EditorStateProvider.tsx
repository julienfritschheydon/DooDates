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
import type { PollSuggestion } from "@/lib/gemini";

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
  createPollFromChat: (pollData: Partial<Poll> | Poll | PollSuggestion) => void;
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
        addPoll(currentPoll);
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
  // Si un poll existe déjà, fusionner les questions au lieu de remplacer
  const createPollFromChat = useCallback(
    async (pollData: Partial<Poll> | Poll | PollSuggestion) => {
      logger.debug("createPollFromChat appelé", "poll", { pollData, currentPoll });

      // Si un poll de type "form" existe déjà, fusionner les questions au lieu de remplacer
      if (
        currentPoll &&
        currentPoll.type === "form" &&
        pollData.type === "form" &&
        pollData.questions
      ) {
        logger.info("🔄 Fusion des questions IA avec le poll existant", "poll", {
          existingQuestions: currentPoll.questions?.length || 0,
          newQuestions: pollData.questions.length,
        });

        // Fusionner les questions : garder les existantes et ajouter les nouvelles
        const existingQuestions = currentPoll.questions || [];
        // pollData.questions peut être FormQuestion[] (de PollSuggestion) ou FormQuestionShape[] (de Poll)
        // On vérifie si c'est un PollSuggestion en vérifiant la présence de la propriété 'text' sur la première question
        const newQuestions = pollData.questions as import("../../lib/gemini").FormQuestion[];

        // Convertir les nouvelles questions en format FormPollCreator
        const uid = () => Math.random().toString(36).slice(2, 10);
        const convertedNewQuestions = newQuestions.map(
          (q: import("../../lib/gemini").FormQuestion) => {
            const baseQuestion = {
              id: uid(),
              kind: q.type as import("../../lib/pollStorage").FormQuestionKind,
              title: q.title,
              required: q.required || false,
              type: q.type as import("../../lib/pollStorage").FormQuestionKind,
            };

            if (q.type === "single" || q.type === "multiple") {
              const options = (q.options || [])
                .filter((opt: string | unknown) => opt && typeof opt === "string" && opt.trim())
                .map((opt: string) => ({
                  id: uid(),
                  label: opt.trim(),
                }));

              return {
                ...baseQuestion,
                options,
                ...(q.maxChoices && { maxChoices: q.maxChoices }),
              };
            } else if (q.type === "date") {
              return {
                ...baseQuestion,
                selectedDates: q.selectedDates || [],
                timeSlotsByDate: q.timeSlotsByDate || {},
                timeGranularity: q.timeGranularity || "30min",
                allowMaybeVotes: q.allowMaybeVotes || false,
                allowAnonymousVotes: q.allowAnonymousVotes || false,
              };
            } else {
              return {
                ...baseQuestion,
                ...(q.placeholder && { placeholder: q.placeholder }),
                ...(q.maxLength && { maxLength: q.maxLength }),
                ...(q.validationType && { validationType: q.validationType }),
                ...(q.ratingScale && { ratingScale: q.ratingScale }),
                ...(q.ratingStyle && { ratingStyle: q.ratingStyle }),
                ...(q.ratingMinLabel && { ratingMinLabel: q.ratingMinLabel }),
                ...(q.ratingMaxLabel && { ratingMaxLabel: q.ratingMaxLabel }),
                ...(q.matrixRows && { matrixRows: q.matrixRows }),
                ...(q.matrixColumns && { matrixColumns: q.matrixColumns }),
                ...(q.matrixType && { matrixType: q.matrixType }),
                ...(q.matrixColumnsNumeric !== undefined && {
                  matrixColumnsNumeric: q.matrixColumnsNumeric,
                }),
              };
            }
          },
        );

        // Fusionner : garder les questions existantes et ajouter les nouvelles
        const mergedQuestions = [...existingQuestions, ...convertedNewQuestions];

        // Mettre à jour le poll existant avec les questions fusionnées
        const updatedPoll: Poll = {
          ...currentPoll,
          questions: mergedQuestions,
          updated_at: new Date().toISOString(),
        };

        setCurrentPoll(updatedPoll);
        setIsEditorOpen(true);

        logger.info("✅ Questions fusionnées avec succès", "poll", {
          totalQuestions: mergedQuestions.length,
          existingCount: existingQuestions.length,
          newCount: convertedNewQuestions.length,
        });

        return;
      }

      const now = new Date().toISOString();
      const slug = `poll-${Date.now()}`;
      const uid = () => Math.random().toString(36).slice(2, 10);

      // Convertir timeSlots si présents (vient de DatePollSuggestion)
      let timeSlotsByDate: Record<
        string,
        Array<{ hour: number; minute: number; duration: number; enabled: boolean }>
      > = {};
      if (
        "timeSlots" in pollData &&
        pollData.timeSlots &&
        Array.isArray(pollData.timeSlots) &&
        pollData.timeSlots.length > 0
      ) {
        timeSlotsByDate = pollData.timeSlots.reduce(
          (
            acc: Record<
              string,
              Array<{ hour: number; minute: number; duration: number; enabled: boolean }>
            >,
            slot: { start: string; end: string; dates?: string[] },
          ) => {
            const targetDates =
              slot.dates && slot.dates.length > 0
                ? slot.dates
                : "dates" in pollData && pollData.dates && Array.isArray(pollData.dates)
                  ? pollData.dates
                  : [];

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
          },
          {},
        );
      }

      // Convertir les questions Gemini en format FormPollCreator
      // pollData.questions peut être FormQuestion[] (de PollSuggestion) ou FormQuestionShape[] (de Poll)
      const pollQuestions = "questions" in pollData && pollData.questions ? pollData.questions : [];
      let convertedQuestions: import("../../lib/pollStorage").FormQuestionShape[] = [];
      if (pollData.type === "form" && "questions" in pollData && pollData.questions) {
        logger.debug("Conversion questions Gemini", "poll", { questions: pollData.questions });
        // Type assertion: si c'est un PollSuggestion, questions est FormQuestion[]
        const geminiQuestions = pollQuestions as import("../../lib/gemini").FormQuestion[];
        convertedQuestions = geminiQuestions.map((q: import("../../lib/gemini").FormQuestion) => {
          const baseQuestion = {
            id: uid(),
            kind: q.type as import("../../lib/pollStorage").FormQuestionKind,
            title: q.title,
            required: q.required || false,
            type: q.type as import("../../lib/pollStorage").FormQuestionKind,
          };

          if (q.type === "single" || q.type === "multiple") {
            const options = (q.options || [])
              .filter((opt: string | unknown) => opt && typeof opt === "string" && opt.trim())
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
          } else if (q.type === "date") {
            // Conversion des questions de type "date"
            return {
              ...baseQuestion,
              selectedDates: q.selectedDates || [],
              timeSlotsByDate: q.timeSlotsByDate || {},
              timeGranularity: q.timeGranularity || "30min",
              allowMaybeVotes: q.allowMaybeVotes || false,
              allowAnonymousVotes: q.allowAnonymousVotes || false,
            };
          } else {
            return {
              ...baseQuestion,
              ...(q.placeholder && { placeholder: q.placeholder }),
              ...(q.maxLength && { maxLength: q.maxLength }),
              ...(q.validationType && { validationType: q.validationType }),
              ...(q.ratingScale && { ratingScale: q.ratingScale }),
              ...(q.ratingStyle && { ratingStyle: q.ratingStyle }),
              ...(q.ratingMinLabel && { ratingMinLabel: q.ratingMinLabel }),
              ...(q.ratingMaxLabel && { ratingMaxLabel: q.ratingMaxLabel }),
              ...(q.matrixRows && { matrixRows: q.matrixRows }),
              ...(q.matrixColumns && { matrixColumns: q.matrixColumns }),
              ...(q.matrixType && { matrixType: q.matrixType }),
              ...(q.matrixColumnsNumeric !== undefined && {
                matrixColumnsNumeric: q.matrixColumnsNumeric,
              }),
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
            questions: convertedQuestions.map(
              (q: import("../../lib/pollStorage").FormQuestionShape) => ({
                id: q.id,
                type: q.type,
                title: q.title,
                required: q.required || false,
                options: q.options,
                maxChoices: q.maxChoices,
                placeholder: q.placeholder,
                maxLength: q.maxLength,
                // Date-specific fields
                selectedDates: (q as any).selectedDates,
                timeSlotsByDate: (q as any).timeSlotsByDate,
                timeGranularity: (q as any).timeGranularity,
                allowMaybeVotes: (q as any).allowMaybeVotes,
                allowAnonymousVotes: (q as any).allowAnonymousVotes,
                // Rating-specific fields
                ratingScale: q.ratingScale,
                ratingStyle: q.ratingStyle,
                ratingMinLabel: q.ratingMinLabel,
                ratingMaxLabel: q.ratingMaxLabel,
                // Matrix-specific fields
                matrixRows: q.matrixRows,
                matrixColumns: q.matrixColumns,
                matrixType: q.matrixType,
                matrixColumnsNumeric: q.matrixColumnsNumeric,
                // Text validation fields
                validationType: q.validationType,
              }),
            ),
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
            selectedDates: ("dates" in pollData && pollData.dates ? pollData.dates : []) || [],
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
        setCurrentPoll(poll);
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
    },
    [currentPoll, setCurrentPoll, createFormPoll, createPoll],
  );

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
