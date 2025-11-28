/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { addPoll, type Poll as StoragePoll } from "../../lib/pollStorage";
import { pollReducer, type PollAction } from "../../reducers/pollReducer";
import { formPollReducer, type FormPollAction } from "../../reducers/formPollReducer";
import { linkPollToConversationBidirectional } from "../../lib/ConversationPollLink";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ErrorFactory } from "../../lib/error-handling";
import { logger } from "../../lib/logger";
import { useConversationActions } from "./ConversationStateProvider";
import { useEditorActions } from "./EditorStateProvider";

/**
 * Types pour la conversation partagée
 */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: Poll;
}

// Utiliser directement le type StoragePoll pour éviter les conflits
type Poll = StoragePoll;

interface ConversationContextType {
  // État de la conversation
  conversationId: string | null;
  messages: Message[];

  // État de l'éditeur
  isEditorOpen: boolean;
  currentPoll: Poll | null;

  // État animations
  highlightedId: string | null;
  highlightType: "add" | "remove" | "modify" | null;

  // État modification question (pour feedback visuel)
  modifiedQuestionId: string | null;
  modifiedField: "title" | "type" | "options" | "required" | null;
  setModifiedQuestion: (
    questionId: string | null,
    field: "title" | "type" | "options" | "required" | null,
  ) => void;

  // État mobile
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Actions conversation
  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearConversation: () => void;

  // Actions éditeur
  openEditor: (poll: Poll) => void;
  closeEditor: () => void;
  updatePoll: (poll: Poll) => void;

  // Actions combinées
  createPollFromChat: (pollData: Partial<Poll> | Poll) => void;

  // Reducer actions (nouveau)
  dispatchPollAction: (action: PollAction | FormPollAction) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

/**
 * Provider pour la conversation et l'éditeur partagés
 *
 * Gère l'état central de l'application AI-First :
 * - Conversation avec l'IA (messages, ID)
 * - État de l'éditeur (ouvert/fermé, sondage actuel)
 * - Interactions entre chat et éditeur
 */
export function ConversationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Détection mobile
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔧 FIX BUG: Accéder aux nouveaux systèmes pour synchronisation
  const { clearMessages: clearMessagesNew } = useConversationActions();
  const { clearCurrentPoll: clearCurrentPollNew, closeEditor: closeEditorNew } = useEditorActions();

  // Écouter les événements de reset du chat
  useEffect(() => {
    const handleChatReset = (event: CustomEvent) => {
      const strategy = event.detail;
      console.log("🔄 [ConversationProvider] Chat reset event received:", strategy);

      // Appliquer le reset selon la stratégie
      switch (strategy.resetType) {
        case "full":
          console.log("🧹 [ConversationProvider] Full reset - Nettoyage complet");
          clearConversationLocal();
          break;

        case "context-only":
          console.log("🧹 [ConversationProvider] Context reset - Nettoyage partiel");
          // Conserver la conversation mais nettoyer le poll/éditeur
          clearCurrentPollNew();
          closeEditorNew();
          setIsEditorOpen(false);
          dispatchPoll({ type: "REPLACE_POLL", payload: null as Poll });
          break;

        case "none":
          console.log("🔄 [ConversationProvider] No reset - Préservation de l'état");
          break;

        default:
          console.warn("⚠️ [ConversationProvider] Unknown reset type:", strategy.resetType);
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener("chat-reset", handleChatReset as EventListener);

    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener("chat-reset", handleChatReset as EventListener);
    };
  }, [clearCurrentPollNew, closeEditorNew, clearMessagesNew]);

  // Actions conversation
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearConversationLocal = useCallback(() => {
    console.log(
      "🧹 [ConversationProvider] clearConversation appelé - Nettoyage complet (3 systèmes)",
    );

    // 1. Nettoyer l'ancien système de messages (ConversationProvider)
    setConversationId(null);
    setMessages([]);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("prototype_messages");
      }
    } catch (error) {
      logger.error("Erreur suppression messages", error);
    }

    // 2. 🔧 FIX BUG: Nettoyer le nouveau système de messages (ConversationStateProvider)
    clearMessagesNew();

    // 3. 🔧 FIX BUG: Nettoyer l'ancien système d'éditeur (ConversationProvider)
    setIsEditorOpen(false);
    dispatchPoll({ type: "REPLACE_POLL", payload: null as Poll });

    // 4. 🔧 FIX BUG: Nettoyer aussi le nouveau système d'éditeur (EditorStateProvider)
    clearCurrentPollNew();
    closeEditorNew();

    // 5. 🔧 FIX BUG: Supprimer le brouillon PollCreator pour éviter restauration automatique
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("doodates-draft");
        console.log("🧹 [ConversationProvider] Brouillon PollCreator supprimé");
      }
    } catch (error) {
      logger.error("Erreur suppression brouillon", error);
    }

    console.log(
      "✅ [ConversationProvider] Nettoyage complet terminé (messages + éditeur + brouillon)",
    );
    // Note: On ne supprime PAS doodates_polls car il contient tous les polls sauvegardés
    // On vide juste currentPoll pour ne pas le restaurer au prochain refresh
  }, [clearMessagesNew, clearCurrentPollNew, closeEditorNew]);

  const clearConversation = clearConversationLocal;

  // État éditeur avec reducer - DÉCLARÉ AVANT UTILISATION
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentPoll, dispatchPoll] = useReducer(pollReducer, null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightType, setHighlightType] = useState<"add" | "remove" | "modify" | null>(null);

  // État modification question (pour feedback visuel)
  const [modifiedQuestionId, setModifiedQuestionId] = useState<string | null>(null);
  const [modifiedField, setModifiedField] = useState<
    "title" | "type" | "options" | "required" | null
  >(null);

  const setModifiedQuestion = useCallback(
    (questionId: string | null, field: "title" | "type" | "options" | "required" | null) => {
      setModifiedQuestionId(questionId);
      setModifiedField(field);

      // Clear après 3 secondes
      if (questionId) {
        setTimeout(() => {
          setModifiedQuestionId(null);
          setModifiedField(null);
        }, 3000);
      }
    },
    [],
  );

  // Actions éditeur
  const openEditor = useCallback(
    (poll: Poll) => {
      setIsEditorOpen(true);
      dispatchPoll({ type: "REPLACE_POLL", payload: poll });
    },
    [dispatchPoll],
  );

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    // Garder currentPoll pour pouvoir rouvrir
  }, []);

  const updatePoll = useCallback(
    (poll: Poll) => {
      // Remplacer complètement le poll (utilisé pour l'ouverture initiale)
      dispatchPoll({ type: "REPLACE_POLL", payload: poll });
    },
    [dispatchPoll],
  );

  // Action pour dispatcher des modifications via le reducer
  // Route vers le bon reducer selon le type de poll
  const dispatchPollAction = useCallback(
    (action: PollAction | FormPollAction) => {
      if (!currentPoll) {
        logger.debug("dispatchPollAction: currentPoll is null, ignoring action");
        return;
      }

      // Déterminer quel reducer utiliser selon le type de poll
      const pollType = currentPoll.type;

      // Si c'est un Form Poll, utiliser formPollReducer
      if (pollType === "form") {
        const updatedPoll = formPollReducer(currentPoll, action as FormPollAction);
        if (updatedPoll) {
          // Extraire highlightedId pour l'animation
          const highlightId = (updatedPoll as Poll & { _highlightedId?: string })._highlightedId;
          const highlightTypeValue = (
            updatedPoll as Poll & { _highlightType?: "add" | "remove" | "modify" }
          )._highlightType;

          if (highlightId) {
            setHighlightedId(highlightId);
          }
          if (highlightTypeValue) {
            setHighlightType(highlightTypeValue);
          }

          dispatchPoll({ type: "REPLACE_POLL", payload: updatedPoll });
        }
      } else {
        // Sinon, utiliser pollReducer pour les Date Polls (type "date" ou undefined)
        const updatedPoll = pollReducer(currentPoll, action as PollAction);
        if (updatedPoll) {
          // Extraire highlightedId pour l'animation (même logique que Form Poll)
          const highlightId = (updatedPoll as Poll & { _highlightedId?: string })._highlightedId;
          const highlightTypeValue = (
            updatedPoll as Poll & { _highlightType?: "add" | "remove" | "modify" }
          )._highlightType;

          if (highlightId) {
            setHighlightedId(highlightId);
          }
          if (highlightTypeValue) {
            setHighlightType(highlightTypeValue);
          }

          dispatchPoll({ type: "REPLACE_POLL", payload: updatedPoll });
        }
      }
    },
    [currentPoll],
  );

  // État conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Charger les messages existants au démarrage
    if (typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("doodates_messages");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
      } catch (error) {
        logger.error("Erreur chargement messages", error);
        return [];
      }
    }
    return [];
  });

  // Initialisation de l'éditeur
  useEffect(() => {
    // Ouvrir l'éditeur uniquement si on a des messages (= pas une nouvelle conversation)
    try {
      if (typeof localStorage === "undefined") return;

      const savedMessages = localStorage.getItem("prototype_messages");
      if (!savedMessages) return;

      let parsedMessages;
      try {
        parsedMessages = JSON.parse(savedMessages);
      } catch (e) {
        logger.error("Erreur parsing messages", e);
        return;
      }

      const hasMessages = Array.isArray(parsedMessages) && parsedMessages.length > 0;
      if (!hasMessages) return;

      const pollsStr = localStorage.getItem("doodates_polls");
      if (!pollsStr) return;

      let polls;
      try {
        polls = JSON.parse(pollsStr);
      } catch (e) {
        logger.error("Erreur parsing polls", e);
        return;
      }

      if (!Array.isArray(polls) || polls.length === 0) return;

      // Trouver le poll le plus récemment modifié
      const sortedPolls = polls.sort((a: Poll, b: Poll) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });

      const latestPoll = sortedPolls[0];

      // Mettre à jour l'état au lieu de retourner la valeur
      if (latestPoll) {
        dispatchPoll({ type: "REPLACE_POLL", payload: latestPoll });
        setIsEditorOpen(true);
      }
    } catch (error) {
      logger.error("Erreur restauration poll", error);
    }
  }, []); // Ajout du tableau de dépendances vide pour n'exécuter qu'au montage

  // Ref pour debounce de la persistance
  const persistenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persistance des messages dans localStorage
  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return;
      if (!Array.isArray(messages)) return;
      localStorage.setItem("prototype_messages", JSON.stringify(messages));
    } catch (error) {
      logger.error("Erreur sauvegarde messages", error);
    }
  }, [messages]);

  // Persistance automatique avec debounce (500ms)
  useEffect(() => {
    if (!currentPoll) return;

    // Annuler le timer précédent
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }

    // Créer un nouveau timer
    persistenceTimerRef.current = setTimeout(() => {
      try {
        // addPoll remplace si l'ID existe déjà
        addPoll(currentPoll as StoragePoll);
      } catch (error) {
        logger.error("Erreur sauvegarde", error);
      }
    }, 500);

    // Cleanup
    return () => {
      if (persistenceTimerRef.current) {
        clearTimeout(persistenceTimerRef.current);
      }
    };
  }, [currentPoll]);

  // Action combinée : créer ou modifier sondage depuis le chat
  const createPollFromChat = useCallback(
    (pollData: import("../../lib/gemini").PollSuggestion | Partial<Poll>) => {
      logger.debug("createPollFromChat appelé", "poll", { pollData });

      // Créer un nouveau sondage complet avec tous les champs requis
      const now = new Date().toISOString();
      const slug = `poll-${Date.now()}`;
      const uid = () => Math.random().toString(36).slice(2, 10);

      // Convertir timeSlots si présents
      let timeSlotsByDate = {};
      const isDatePoll =
        pollData.type === "date" || pollData.type === "datetime" || pollData.type === "custom";
      if (
        isDatePoll &&
        "timeSlots" in pollData &&
        pollData.timeSlots &&
        pollData.timeSlots.length > 0
      ) {
        timeSlotsByDate = (
          pollData as import("../../lib/gemini").DatePollSuggestion
        ).timeSlots.reduce(
          (
            acc: Record<
              string,
              Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>
            >,
            slot: { start: string; end: string; dates?: string[] },
          ) => {
            const targetDates =
              slot.dates && slot.dates.length > 0
                ? slot.dates
                : isDatePoll && "dates" in pollData
                  ? pollData.dates || []
                  : [];

            targetDates.forEach((date: string) => {
              if (!acc[date]) acc[date] = [];

              // Calculer la durée en minutes entre start et end
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
      let convertedQuestions: any[] = [];
      const isFormPoll = pollData.type === "form";
      if (isFormPoll && "questions" in pollData && pollData.questions) {
        logger.debug("Conversion questions Gemini", "poll", { questions: pollData.questions });
        convertedQuestions = (
          pollData as import("../../lib/gemini").FormPollSuggestion
        ).questions.map((q: import("../../lib/gemini").FormQuestion) => {
          const baseQuestion = {
            id: uid(),
            title: q.title,
            required: q.required || false,
            type: q.type,
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

      // Déterminer le type de poll et extraire les propriétés appropriées
      const pollType =
        pollData.type === "form"
          ? "form"
          : pollData.type === "availability"
            ? "availability"
            : "date";
      const dates = isDatePoll && "dates" in pollData ? pollData.dates || [] : [];
      const dateGroups = isDatePoll && "dateGroups" in pollData ? pollData.dateGroups : undefined;

      const poll: StoragePoll = {
        id: slug,
        slug: slug,
        title: pollData.title || "Nouveau sondage",
        type: pollType,
        dates: dates,
        // 🔧 Copier les groupes de dates si fournis (pour week-ends groupés)
        dateGroups: dateGroups,
        questions: convertedQuestions,
        created_at: now,
        updated_at: now,
        creator_id: "guest",
        status: "draft" as const,
        settings: {
          selectedDates: dates,
          timeSlotsByDate: timeSlotsByDate,
        },
      };

      // Sauvegarder dans pollStorage
      try {
        console.log("[WEEKEND_GROUPING] 💾 ConversationProvider - Poll créé:", {
          pollId: poll.id,
          type: poll.type,
          datesCount: poll.dates?.length,
          hasDateGroups: !!poll.dateGroups,
          dateGroupsCount: poll.dateGroups?.length,
          dateGroups: poll.dateGroups,
        });

        addPoll(poll);

        // Lier bidirectionnellement le poll à la conversation (Session 1 - Architecture centrée conversations)
        if (conversationId) {
          linkPollToConversationBidirectional(conversationId, poll.id, poll.type || "form");
        }

        console.log("[WEEKEND_GROUPING] 📂 ConversationProvider - Ouverture éditeur avec poll:", {
          pollId: poll.id,
          hasDateGroups: !!poll.dateGroups,
        });

        // Ouvrir l'éditeur dans le panneau de droite
        openEditor(poll);
      } catch (error) {
        logger.error("Erreur lors de la sauvegarde", error);
      }
    },
    [openEditor, conversationId],
  );

  // Fonction pour gérer l'ouverture/fermeture de la sidebar
  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const value: ConversationContextType = {
    // État
    conversationId,
    messages,
    isEditorOpen,
    currentPoll,

    // État animations
    highlightedId,
    highlightType,
    modifiedQuestionId,
    modifiedField,
    setModifiedQuestion,

    // État mobile
    isMobile,
    isSidebarOpen,
    setSidebarOpen,

    // Actions conversation
    setConversationId,
    addMessage,
    setMessages,
    clearConversation,

    // Actions éditeur
    openEditor,
    closeEditor,
    updatePoll,

    // Actions combinées
    createPollFromChat,

    // Reducer actions
    dispatchPollAction,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

/**
 * Hook pour accéder au context conversation
 */
export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    // Log warning au lieu de throw pour éviter crash dans Firefox/Safari
    // Le race condition du lazy loading peut causer des appels avant mount complet
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn(
        "[useConversation] Called before ConversationProvider mounted (race condition in lazy loading)",
      );
    }
    // Retourner null pour que les composants puissent gérer gracieusement
    return null;
  }
  return context;
}
