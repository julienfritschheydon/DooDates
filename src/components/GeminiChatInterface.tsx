import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  lazy,
  Suspense,
} from "react";
// Lazy load Plus pour réduire le bundle initial
import { createLazyIcon } from "../lib/lazy-icons";
const PlusLazy = createLazyIcon("Plus");
import { ChatMessageList } from "./chat/ChatMessageList";
import { ChatInput } from "./chat/ChatInput";
// Types partagés pour les suggestions de sondages
import type {
  PollSuggestion,
  FormPollSuggestion,
  DatePollSuggestion,
  isFormPollSuggestion,
  isDatePollSuggestion
} from "@/types/poll-suggestions";
// Lazy load PollCreator - ne se charge que si nécessaire
const PollCreator = lazy(() => import("./PollCreator"));
import FormPollCreator, { type FormPollDraft } from "./polls/FormPollCreator";
import type { AnyFormQuestion } from "@/types/poll-suggestions";
import { useAutoSave } from "../hooks/useAutoSave";
import { useConversationResume } from "../hooks/useConversationResume";
import { useGeminiAPI } from "../hooks/useGeminiAPI";
import { ConversationService } from "../services/ConversationService";
import { useQuota } from "../hooks/useQuota";
import { useAiMessageQuota } from "../hooks/useAiMessageQuota";
import { isE2ETestingEnvironment } from "../lib/e2e-detection";
import {
  checkAiMessageQuota,
  checkPollCreationQuota,
  handleQuotaError,
} from "../services/AiQuotaService";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import { VOICE_RECOGNITION_CONFIG } from "../config/voiceRecognition.config";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useIntentDetection } from "../hooks/useIntentDetection";
import { usePollManagement } from "../hooks/usePollManagement";
import { useMessageSender } from "../hooks/useMessageSender";
import { SurveyRequestAggregator } from "../services/SurveyRequestAggregator";
import AuthIncentiveModal from "./modals/AuthIncentiveModal";
import { AuthModal } from "./modals/AuthModal";
import QuotaIndicator from "./ui/QuotaIndicator";
import { useNavigate, useLocation } from "react-router-dom";
import { useSmartNavigation } from "../hooks/useSmartNavigation";
import { conversationProtection } from "../services/ConversationProtection";
import { performanceMonitor } from "../services/PerformanceMonitor";
import { useInfiniteLoopProtection } from "../services/InfiniteLoopProtection";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "../lib/logger";
import { useToast } from "@/hooks/use-toast";
import { linkPollToConversationBidirectional } from "@/lib/ConversationPollLink";
import {
  useConversationMessages,
  useConversationActions,
} from "./prototype/ConversationStateProvider";
import { useEditorState, useEditorActions } from "./prototype/EditorStateProvider";
import { useUIState } from "./prototype/UIStateProvider";
import { getConversation } from "../lib/storage/ConversationStorageSimple";
import { getPollBySlugOrId } from "../lib/pollStorage";
import { OnboardingTour } from "./OnboardingTour";

// Global initialization guard to prevent multiple conversation creation
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: PollSuggestion;
  isGenerating?: boolean;
}

interface GeminiChatInterfaceProps {
  onPollCreated?: (pollData: PollSuggestion) => void;
  onNewChat?: () => void;
  onUserMessage?: () => void;
  resumeLastConversation?: boolean;
  hideStatusBar?: boolean;
  darkTheme?: boolean;
  voiceRecognition?: ReturnType<typeof import("../hooks/useVoiceRecognition").useVoiceRecognition>;
  pollType?: "date" | "form";
}

export type GeminiChatHandle = {
  submitMessage: (text: string) => Promise<void>;
};

const GeminiChatInterface = React.forwardRef<GeminiChatHandle, GeminiChatInterfaceProps>(
  (
    {
      onPollCreated,
      voiceRecognition: externalVoiceRecognition,
      onNewChat,
      onUserMessage,
      resumeLastConversation = true,
      hideStatusBar = false,
      darkTheme = false,
      pollType: pollTypeProp,
    },
    ref,
  ) => {
    // Utiliser les hooks spécialisés
    const messages = useConversationMessages();
    const {
      addMessage: saveMessage,
      resumeConversation,
      conversationId: autoSaveId,
      clearConversation: clearAutoSave,
    } = useAutoSave({ debug: true });
    const { setMessages: setMessagesRaw } = useConversationActions();
    const { currentPoll } = useEditorState();
    const { dispatchPollAction, openEditor, setCurrentPoll, createPollFromChat, clearCurrentPoll } =
      useEditorActions();
    const { setModifiedQuestion } = useUIState();

    // 🔧 FIX: Nettoyer le poll quand on démarre une NOUVELLE conversation
    const location = useLocation();
    const lastConversationIdRef = useRef<string | null>(null);
    const initialMessageSentRef = useRef(false);

    // Récupérer le type depuis l'URL pour adapter les textes (priorité à la prop, sinon URL, sinon "date")
    const urlParams = new URLSearchParams(location.search);
    const pollTypeFromUrl = (pollTypeProp || urlParams.get("type") || "date") as "date" | "form";

    // 🎯 FIX E2E: Auto-focus sur le textarea après ouverture de l'éditeur (mobile)
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
      if (currentPoll && textareaRef.current) {
        // Sur mobile, quand l'éditeur s'ouvre, le focus est perdu
        // On le remet automatiquement après un court délai
        const timer = setTimeout(() => {
          textareaRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [currentPoll]); // Se déclenche quand currentPoll change (éditeur ouvert)

    useEffect(() => {
      const urlParams = new URLSearchParams(location.search);
      const conversationId = urlParams.get("conversationId");

      // Détecter un changement de conversation (ou passage à "nouveau chat")
      if (conversationId !== lastConversationIdRef.current) {
        lastConversationIdRef.current = conversationId;

        // Si pas de conversationId dans l'URL et qu'il y a un poll en mémoire, le nettoyer
        // Cela arrive quand l'utilisateur clique sur "Nouveau chat"
        if (!conversationId && currentPoll) {
          logger.info("🧹 Nettoyage du poll persistant (nouveau chat détecté)", "poll");
          clearCurrentPoll();
        }
      }
    }, [location.search, currentPoll, clearCurrentPoll]); // Se déclenche quand l'URL change

    // 🎯 NOUVEAU: Envoyer automatiquement un message initial depuis location.state
    useEffect(() => {
      const state = location.state as {
        initialMessage?: string;
        pollId?: string;
        context?: unknown;
      } | null;
      if (state?.initialMessage && !initialMessageSentRef.current) {
        initialMessageSentRef.current = true;

        // Attendre que le composant soit monté et prêt
        const timer = setTimeout(() => {
          logger.info("📤 Envoi automatique du message initial", "poll", {
            message: state.initialMessage,
            pollId: state.pollId,
            context: state.context,
          });

          // Le message sera envoyé via setInputValue et handleSendMessage
          // On ne peut pas utiliser chatRef ici car c'est un forwardRef interne
          setInputValue(state.initialMessage);

          // Nettoyer le state pour éviter de renvoyer au refresh
          window.history.replaceState({}, document.title);
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [location.state]); // Se déclenche quand location.state change

    // Wrapper pour éviter les erreurs de type PollSuggestion (conflit gemini.ts vs ConversationService.ts)
    const handlePollSuggestion = useCallback(
      (proposal: import("../lib/ai/gemini").PollSuggestion | null) => {
        if (proposal) {
          setLastAIProposal({
            userRequest: "",
            generatedContent: proposal,
            pollContext: {
              pollId:
                (proposal as import("../lib/ai/gemini").PollSuggestion & { id?: string }).id ||
                `generated-${Date.now()}`,
              pollTitle: proposal.title,
              pollType: proposal.type,
            },
          });
        } else {
          setLastAIProposal(null);
        }
      },
      [],
    );
    const setMessagesAdapter = useCallback(
      (updater: (prev: Message[]) => Message[]) => {
        setMessagesRaw((prevMessages) => {
          // Convertir les messages du format ConversationService vers useMessageSender
          const convertedPrev = prevMessages.map((msg) => ({
            ...msg,
            pollSuggestion: msg.pollSuggestion as
              | import("../lib/ai/gemini").PollSuggestion
              | undefined,
          }));
          const updated = updater(convertedPrev);
          // Convertir les messages vers le format ConversationService
          return updated.map((msg) => ({
            ...msg,
            pollSuggestion: msg.pollSuggestion as
              | import("../lib/ai/gemini").PollSuggestion
              | undefined,
          }));
        });
      },
      [setMessagesRaw],
    );

    // 🎯 FIX: Force clear immédiat si paramètre 'new' présent (avant tout chargement)
    useEffect(() => {
      const urlParams = new URLSearchParams(location.search);
      if (urlParams.has("new")) {
        logger.info("🧹 [GeminiChatInterface] Force clear immédiat pour nouveau chat");
        setMessagesAdapter(() => []);
        clearAutoSave(); // Nettoyer l'état de useAutoSave
        // Nettoyage défensif du stockage local
        try {
          localStorage.removeItem("prototype_messages");
          localStorage.removeItem("doodates_messages");
        } catch (e) {
          logger.error("Erreur nettoyage localStorage", e);
        }
      }
    }, [location.search, setMessagesAdapter, clearAutoSave]);

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // État pour le feedback IA
    const [lastAIProposal, setLastAIProposal] = useState<PollSuggestion | null>(null);
    // Alias pour la compatibilité avec le code existant
    const setLastAIProposalAdapter = setLastAIProposal;

    // Surveiller _highlightedId pour déclencher le feedback visuel (ADD_QUESTION)
    useEffect(() => {
      const pollWithHighlight = currentPoll as
        | (typeof currentPoll & {
            _highlightedId?: string;
            _highlightType?: "add" | "remove" | "modify";
          })
        | null;
      if (
        pollWithHighlight &&
        pollWithHighlight._highlightedId &&
        pollWithHighlight._highlightType === "add"
      ) {
        const highlightedId = pollWithHighlight._highlightedId;
        // Pour ADD_QUESTION, on considère que c'est le titre qui a été ajouté
        setModifiedQuestion(highlightedId, "title");
      }
    }, [currentPoll, setModifiedQuestion]);

    // Déterminer si un sondage est déjà lié à cette conversation (persiste après refresh)
    const linkedPollId = useMemo(() => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const convId = urlParams.get("conversationId");
        if (!convId) return null;
        const conv = getConversation(convId);
        if (!conv) return null;

        // Lire pollId depuis conversation.pollId (Session 2 - Bug 3)
        const pollId = conv.pollId;
        if (pollId) return pollId;

        // Fallback: metadata (ancien format)
        const meta = conv.metadata || {};
        const metaPollId: string | undefined = meta.pollId || undefined;
        const generated: boolean = !!meta.pollGenerated;

        return metaPollId || (generated ? "generated" : null);
      } catch (e) {
        logger.error("linkedPollId error", e);
        return null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]); // Intentionnel : on ne veut recalculer que si l'URL change

    const hasLinkedPoll = useMemo(() => {
      // Si un poll est actuellement chargé ou si un pollId est enregistré dans les métadonnées
      return currentPoll ? true : !!linkedPollId;
    }, [currentPoll, linkedPollId]);

    // Charger automatiquement le poll lié au démarrage (Session 2 - Bug 3)
    useEffect(() => {
      if (linkedPollId && linkedPollId !== "generated" && !currentPoll) {
        try {
          const poll = getPollBySlugOrId(linkedPollId);
          if (poll) {
            logger.info("🔗 Chargement automatique du poll lié", "poll", {
              pollId: linkedPollId,
              pollTitle: poll.title,
            });
            setCurrentPoll(poll);
            openEditor();
          }
        } catch (error) {
          logger.error("❌ Erreur chargement poll lié", "poll", { linkedPollId, error });
        }
      }
    }, [linkedPollId, currentPoll, setCurrentPoll, openEditor]);

    // Auto-save and conversation resume hooks
    const navigate = useNavigate();
    // location déjà déclaré plus haut (ligne 164)
    const autoSave = useAutoSave({
      debug: true,
    });
    const conversationResume = useConversationResume();

    // Désactiver les modals d'authentification en mode E2E
    const isE2ETesting = isE2ETestingEnvironment();

    // État pour gérer le modal d'authentification
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

    const quota = useQuota({
      showAuthIncentives: !isE2ETesting, // Désactiver en mode E2E
    });
    const aiQuota = useAiMessageQuota(autoSave.getRealConversationId() || undefined);
    const loopProtection = useInfiniteLoopProtection("gemini-chat-interface");
    const { toast } = useToast();

    // 🎤 Voice recognition - Utiliser le hook externe s'il existe, sinon créer le nôtre
    const internalVoiceRecognition = useVoiceRecognition({
      lang: VOICE_RECOGNITION_CONFIG.lang,
      interimResults: VOICE_RECOGNITION_CONFIG.interimResults,
      continuous: VOICE_RECOGNITION_CONFIG.continuous,
      onTranscriptChange: (transcript) => {
        // Ne rien faire ici, on utilisera finalTranscript directement
      },
      onError: (error) => {
        toast({
          title: "Erreur microphone",
          description: error,
          variant: "destructive",
        });
      },
    });

    // Utiliser le hook externe si fourni, sinon utiliser le hook interne
    const voiceRecognition = externalVoiceRecognition || internalVoiceRecognition;

    // Afficher la transcription en temps réel dans l'input
    React.useEffect(() => {
      if (voiceRecognition.isListening) {
        // Pendant l'écoute : afficher interim + final
        const fullText =
          voiceRecognition.finalTranscript +
          (voiceRecognition.interimTranscript ? " " + voiceRecognition.interimTranscript : "");
        setInputValue(fullText.trim());
      }
    }, [
      voiceRecognition.isListening,
      voiceRecognition.finalTranscript,
      voiceRecognition.interimTranscript,
    ]);

    // Hook API Gemini
    const geminiAPI = useGeminiAPI({
      debug: true,
      onQuotaExceeded: () => {
        // Le quota hook gère déjà l'affichage du modal
      },
      onNetworkError: () => {
        toast({
          title: "Erreur réseau",
          description: "Vérifiez votre connexion internet",
          variant: "destructive",
        });
      },
    });

    // Connection status hook
    const connectionStatusHook = useConnectionStatus({
      onAddMessage: (message) => {
        setMessagesAdapter((prev) => [...prev, message]);
      },
    });

    // Intent detection hook
    const intentDetection = useIntentDetection({
      currentPoll,
      onDispatchAction: (action) => {
        // action: { type: string; payload: Record<string, unknown> }

        switch (action.type) {
          case "REPLACE_POLL":
            // On suppose que payload contient un poll complet sous la clé poll
            dispatchPollAction({
              type: "REPLACE_POLL",
              payload: action.payload.poll as import("../lib/pollStorage").Poll,
            });
            break;

          // 🔧 FIX BUG #4: Gérer les actions de modification de dates
          case "ADD_DATE":
          case "REMOVE_DATE":
          case "UPDATE_TITLE":
            // Ces actions ont un payload simple (string)
            dispatchPollAction({
              type: action.type as "ADD_DATE" | "REMOVE_DATE" | "UPDATE_TITLE",
              payload: action.payload as unknown as string,
            });
            break;

          case "ADD_TIMESLOT":
            // Payload complexe pour les créneaux horaires
            dispatchPollAction({
              type: "ADD_TIMESLOT",
              payload: action.payload as unknown as { date: string; start: string; end: string },
            });
            break;

          // Form Poll actions - À implémenter si nécessaire
          case "ADD_QUESTION":
          case "REMOVE_QUESTION":
          case "UPDATE_QUESTION":
            logger.info("Form Poll action détectée (non implémentée)", "poll", { action });
            break;

          default:
            // Log les actions non gérées pour debug
            logger.warn?.("IntentDetection: action non gérée", "poll", { action });
            break;
        }
      },
    });

    // Poll management hook
    const pollManagement = usePollManagement();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollFixTimeoutRef = useRef<number | null>(null);
    const hasInitialized = useRef(false);
    const hasResumedConversation = useRef(false);

    // Initialize new conversation (défini AVANT handleNewChat car utilisé dedans)
    const initializeNewConversation = useCallback(async () => {
      // Don't initialize if messages already exist (restored from localStorage)
      if (messages.length > 0) {
        return;
      }

      // Don't initialize if we already resumed a conversation
      if (hasResumedConversation.current) {
        return;
      }

      // Multi-layer protection against infinite loops
      if (!loopProtection.canExecute()) {
        return;
      }

      if (!conversationProtection.canCreateConversation()) {
        return;
      }

      // Check conversation quota BEFORE creating a new conversation
      if (!quota.canCreateConversation) {
        quota.showAuthIncentive("conversation_limit");
        return;
      }

      // Prevent multiple simultaneous initialization attempts
      if (isInitializing) {
        // Initialization already in progress, waiting...
        if (initializationPromise) {
          await initializationPromise;
        }
        return;
      }

      isInitializing = true;
      conversationProtection.startCreation();
      performanceMonitor.trackConversationCreation();

      initializationPromise = (async () => {
        try {
          // Initializing new conversation
          // Ne pas ajouter de message de bienvenue ici pour que le message visuel s'affiche (messages.length === 0)

          setMessagesAdapter(() => []);
          // Conversation initialized with empty messages - visual welcome will show

          conversationProtection.completeCreation("new-conversation");
          // Conversation initialized successfully
        } catch (error) {
          const processedError = handleError(
            error,
            {
              component: "GeminiChatInterface",
              operation: "initializeNewConversation",
            },
            "Erreur lors de l'initialisation de la conversation",
          );

          logError(processedError, {
            component: "GeminiChatInterface",
            operation: "initializeNewConversation",
          });

          conversationProtection.failCreation();
          performanceMonitor.trackError();

          // Show user-friendly error message
          if (error instanceof Error && error.message.includes("Quota dépassé")) {
            setMessagesAdapter(() => [
              {
                id: "quota-error",
                content:
                  "Vous avez atteint votre quota de sondages pour la période d'essai. Pour continuer à utiliser DooDates, vous pouvez passer à un compte payant ou attendre la prochaine période.",
                isAI: true,
                timestamp: new Date(),
              },
            ]);
          } else if (
            error instanceof Error &&
            error.message.includes("Conversation limit reached")
          ) {
            setMessagesAdapter(() => [
              {
                id: "limit-error",
                content:
                  "Vous avez atteint la limite de conversations simultanées. Terminez ou archivez certaines conversations pour en créer de nouvelles.",
                isAI: true,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessagesAdapter(() => [
              {
                id: "init-error",
                content:
                  "Une erreur est survenue lors de l'initialisation. Veuillez réessayer ou contacter le support si le problème persiste.",
                isAI: true,
                timestamp: new Date(),
              },
            ]);
          }
        } finally {
          isInitializing = false;
          initializationPromise = null;
        }
      })();

      await initializationPromise;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave, loopProtection, messages]); // Intentionnel : setMessages est stable, pas besoin de le tracker

    // Define handleNewChat early for use in useMessageSender (APRÈS initializeNewConversation)
    const handleNewChat = useCallback(async () => {
      try {
        // Reset all state
        setMessagesAdapter(() => []);
        setInputValue("");
        setIsLoading(false);
        pollManagement.closePollCreator();

        // 🎯 NOUVEAU: Réinitialiser l'agrégateur lors d'un nouveau chat
        SurveyRequestAggregator.reset();

        // Initialize new conversation with auto-save
        await initializeNewConversation();

        // Call onNewChat callback if provided
        if (onNewChat) {
          onNewChat();
        }
      } catch (error) {
        const processedError = handleError(
          error,
          {
            component: "GeminiChatInterface",
            operation: "handleNewChat",
          },
          "Erreur lors de la création d'un nouveau chat",
        );

        logError(processedError, {
          component: "GeminiChatInterface",
          operation: "handleNewChat",
        });
      }
    }, [pollManagement, onNewChat, initializeNewConversation, setMessagesAdapter]);

    // Message sender hook
    const messageSender = useMessageSender({
      isLoading,
      quota,
      aiQuota,
      toast: {
        toast: ({
          title,
          description,
          variant,
        }: {
          title?: string;
          description?: string;
          variant?: "default" | "destructive";
        }) => {
          toast({ title, description, variant });
        },
      },
      intentDetection,
      geminiAPI,
      autoSave,
      onUserMessage,
      setMessages: setMessagesAdapter,
      setIsLoading,
      setLastAIProposal,
      setModifiedQuestion,
      onStartNewChat: handleNewChat,
      hasCurrentPoll: !!currentPoll,
    });

    useEffect(() => {
      // Prevent multiple initialization attempts
      if (hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;
      let isMounted = true;

      // Initialize component setup first
      // Ne pas tester la connexion en mode E2E (évite les problèmes de timing avec les mocks)
      const isE2ETest = window.location.search.includes("e2e-test=true");
      if (!isE2ETest) {
        connectionStatusHook.testConnection();
      }

      // Scroll fixes pour Android (protégé pour environnements sans window)
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
        scrollFixTimeoutRef.current = window.setTimeout(() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }, 100);
      }

      const resumeConversation = async () => {
        // Additional guard: prevent multiple resume attempts
        if (isInitializing || !isMounted) {
          // Initialization already handled, skipping
          return;
        }

        // Resume conversation from URL if available
        // Check if we're trying to resume a conversation (don't check quota for resume)
        const urlParams = new URLSearchParams(window.location.search);
        const resumeId = urlParams.get("resume") || urlParams.get("conversationId");
        const isResumingConversation = !!resumeId;

        // 🆕 Si on a ?new= dans l'URL, ne pas reprendre de conversation
        const hasNewParam = urlParams.has("new");
        if (hasNewParam) {
          // IMPORTANT: Vider les messages AVANT d'initialiser pour contourner le guard dans initializeNewConversation
          if (isMounted) {
            setMessagesAdapter(() => []);
            if (!isInitializing) {
              await initializeNewConversation();
            }
          }
          return;
        }

        try {
          const result = await ConversationService.resumeFromUrl(autoSave);

          if (!isMounted) return;

          if (result && result.conversation && result.messages) {
            // Clear messages only if we have a conversation to restore from URL
            if (isMounted) {
              setMessagesAdapter(() => []);
            }
            // Resuming conversation from URL

            // Get messages from the conversation
            const messages = result.messages;

            if (messages && messages.length > 0) {
              // Convert conversation messages to chat interface format
              const chatMessages = ConversationService.convertMessagesToChat(messages);

              // Messages convertis avec succès

              if (isMounted) {
                setMessagesAdapter(() => chatMessages);
                hasResumedConversation.current = true;

                // 🔧 FIX E2E: Auto-ouvrir le poll si la conversation en contient un
                let pollId = result.conversation.relatedPollId;

                // Si pas de relatedPollId, chercher dans les messages
                if (!pollId) {
                  for (const msg of chatMessages) {
                    const suggestion = msg.pollSuggestion as PollSuggestion & {
                      linkedPollId?: string;
                    };
                    if (suggestion?.linkedPollId) {
                      pollId = suggestion.linkedPollId;
                      break;
                    }
                  }
                }

                if (pollId) {
                  try {
                    const poll = getPollBySlugOrId(pollId);
                    if (poll) {
                      setCurrentPoll(poll);
                      openEditor();
                    }
                  } catch (error) {
                    logError(
                      ErrorFactory.storage(
                        "Erreur lors du chargement du poll",
                        "Impossible de charger le sondage",
                      ),
                      { metadata: { error } },
                    );
                  }
                }
              }
            } else {
              // No messages found in resumed conversation
              // No messages found, show resume indicator
              const resumeMessage = ConversationService.createResumeMessage(
                result.conversation.title,
              );
              if (isMounted) {
                setMessagesAdapter(() => [resumeMessage]);
              }
            }
          } else {
            // No conversation to resume, initializing new conversation
            // Only initialize if we weren't trying to resume (avoid showing quota modal for failed resume)
            if (isMounted && !isInitializing && !isResumingConversation) {
              await initializeNewConversation();
            }
          }
        } catch (error) {
          const processedError = handleError(
            error,
            {
              component: "GeminiChatInterface",
              operation: "resumeConversation",
            },
            "Erreur lors de la reprise de conversation",
          );

          logError(processedError, {
            component: "GeminiChatInterface",
            operation: "resumeConversation",
          });

          // Only initialize new conversation if we weren't trying to resume
          // (avoid showing quota modal when resume fails)
          if (isMounted && !isInitializing && !isResumingConversation) {
            await initializeNewConversation();
          }
        }
      };

      // Add small delay to prevent race conditions on component mount
      const timeoutId = setTimeout(resumeConversation, 150);

      return () => {
        isMounted = false;
        if (scrollFixTimeoutRef.current != null && typeof window !== "undefined") {
          clearTimeout(scrollFixTimeoutRef.current);
          scrollFixTimeoutRef.current = null;
        }
        clearTimeout(timeoutId);
        connectionStatusHook.cleanup();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]); // Intentionnel : on ne veut réinitialiser que si l'URL change, pas à chaque render

    useEffect(() => {
      // Désactiver complètement le scroll automatique vers le bas sur mobile
      // pour éviter tout conflit avec la correction du focus Android
      const isMobile = window.innerWidth <= 768;

      if (!isMobile) {
        scrollToBottom();
      }
    }, [messages]);

    const scrollToBottom = () => {
      // Utiliser behavior: "instant" sur mobile pour éviter les conflits
      const isMobile = window.innerWidth <= 768;
      messagesEndRef.current?.scrollIntoView({
        behavior: isMobile ? "instant" : "smooth",
      });
    };

    // Core sending logic - delegated to hook
    const sendMessageWithText = messageSender.sendMessage;

    // Expose programmatic submission (used by mobile Preview input)
    useImperativeHandle(ref, () => ({
      submitMessage: async (text: string) => sendMessageWithText(text, false),
    }));

    const handleSendMessage = async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🟠 GeminiChatInterface.handleSendMessage appelé`, {
        inputValue: inputValue?.substring(0, 50),
        inputLength: inputValue?.length || 0,
        isLoading,
      });

      if (!inputValue.trim() || isLoading) {
        console.log(`[${timestamp}] ❌ handleSendMessage: arrêt (texte vide ou chargement)`, {
          hasInput: !!inputValue.trim(),
          isLoading,
        });
        return;
      }

      try {
        console.log(`[${timestamp}] ✅ handleSendMessage: appel sendMessageWithText`);
        await sendMessageWithText(inputValue, true);
        setInputValue("");
      } catch (error) {
        // Gérer les erreurs de quota
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("limit reached") || errorMessage.includes("Credit limit")) {
          toast({
            title: "Limite atteinte",
            description:
              "Vous avez atteint la limite de 5 conversations en mode invité. Créez un compte pour continuer.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de l'envoi du message.",
            variant: "destructive",
          });
        }
        logError(ErrorFactory.api("Failed to send message", "Erreur lors de l'envoi du message"), {
          component: "GeminiChatInterface",
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    };

    const handleUsePollSuggestion = (suggestion: PollSuggestion) => {
      // 🎯 NEW: Vérifier quota polls avant création
      const pollQuotaCheck = checkPollCreationQuota(aiQuota);
      if (!pollQuotaCheck.canProceed) {
        handleQuotaError(pollQuotaCheck, quota, toast);
        return;
      }

      // 🎯 NEW: Incrémenter compteur polls (poll va être créé)
      const conversationId = autoSave.getRealConversationId() || autoSave.conversationId;
      if (conversationId) {
        aiQuota.incrementPollCount(conversationId);
      }

      // 🎯 NOUVEAU: Réinitialiser l'agrégateur quand un sondage est utilisé/créé
      SurveyRequestAggregator.clearPendingRequest();

      // Si on a un callback onPollCreated, l'utiliser au lieu d'afficher le créateur
      if (onPollCreated) {
        // Mettre à jour l'URL avec conversationId AVANT d'appeler onPollCreated
        if (conversationId && !window.location.search.includes("conversationId")) {
          const newUrl = `${window.location.pathname}?conversationId=${conversationId}`;
          window.history.replaceState({}, "", newUrl);
        }

        onPollCreated(suggestion);
        return;
      }

      // Sinon, comportement par défaut : afficher le créateur
      pollManagement.openPollCreator(suggestion);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Afficher le PollCreator si demandé
    if (pollManagement.showPollCreator) {
      const realConversationId = autoSave.getRealConversationId();
      const conversationId = realConversationId || autoSave.conversationId;
      const pollCreatorUrl = conversationId ? `?conversationId=${conversationId}` : "";

      // Update URL to include conversation ID
      if (conversationId && !window.location.search.includes("conversationId")) {
        const newUrl = `${window.location.pathname}${pollCreatorUrl}`;
        window.history.replaceState({}, "", newUrl);
      }

      // Si c'est un FormPoll, afficher FormPollCreator
      if (pollManagement.selectedPollData?.type === "form" || currentPoll?.type === "form") {
        const formDraft: FormPollDraft = currentPoll
          ? {
              id: currentPoll.id,
              type: "form",
              title: currentPoll.title,
              questions: (currentPoll.questions || []) as AnyFormQuestion[],
              conditionalRules: currentPoll.conditionalRules || [],
            }
          : pollManagement.getFormDraft();

        return (
          <FormPollCreator
            initialDraft={formDraft}
            onCancel={() => {
              pollManagement.closePollCreator();
            }}
            onSave={(draft) => {
              logger.info("Form Poll sauvegardé comme brouillon", "poll", {
                draftId: draft.id,
              });
              toast({
                title: "✅ Brouillon enregistré",
                description: "Votre questionnaire a été sauvegardé avec succès.",
              });
            }}
            onFinalize={(draft, savedPoll) => {
              logger.info("Form Poll finalisé", "poll", {
                draftId: draft.id,
                savedId: savedPoll?.id,
              });

              // 🔗 Lier le poll à la conversation existante
              if (savedPoll) {
                try {
                  const urlParams = new URLSearchParams(location.search);
                  const conversationId = urlParams.get("conversationId");

                  if (conversationId) {
                    // Poll créé via IA → Lier à la conversation existante
                    linkPollToConversationBidirectional(conversationId, savedPoll.id, "form");
                    logger.info("✅ Poll lié à la conversation", "poll", {
                      conversationId,
                      pollId: savedPoll.id,
                    });
                  }
                } catch (error) {
                  logger.error("❌ Erreur liaison poll-conversation", "poll", { error });
                }
              }

              toast({
                title: "🎉 Questionnaire créé !",
                description: "Votre formulaire est maintenant disponible.",
              });
              // Auto-ouvrir la preview du formulaire créé si disponible
              if (savedPoll) {
                try {
                  setCurrentPoll(savedPoll);
                  openEditor();
                } catch (error) {
                  logger.error("Erreur lors de l'ouverture de l'éditeur", "poll", { error });
                }
              }
              pollManagement.closePollCreator();
            }}
          />
        );
      }

      // Sinon, afficher PollCreator pour les DatePolls
      return (
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Suspense fallback={<div className="w-8 h-8 mx-auto mb-4" />}>
                  <PlusLazy className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                </Suspense>
                <p className="text-gray-600 font-medium">Chargement du créateur...</p>
              </div>
            </div>
          }
        >
          <PollCreator
            initialData={
              pollManagement.selectedPollData
                ? {
                    ...(pollManagement.selectedPollData as DatePollSuggestion),
                    dateGroups: (
                      pollManagement.selectedPollData as DatePollSuggestion
                    ).dateGroups?.map((g) => ({
                      ...g,
                      type:
                        g.type === "week" || g.type === "fortnight"
                          ? ("range" as const)
                          : (g.type as "custom" | "weekend" | "range"),
                    })),
                  }
                : undefined
            }
            onBack={() => {
              pollManagement.closePollCreator();
            }}
          />
        </Suspense>
      );
    }

    /* 
      NOTE: Structure flex pour permettre le centrage vertical du message de bienvenue
      - flex flex-col: Crée un contexte flex vertical
      - h-full min-h-0: Prend toute la hauteur disponible, min-h-0 permet au flex de rétrécir si nécessaire
      - ChatMessageList utilise flex-1 pour prendre toute la hauteur et centrer le contenu quand messages.length === 0
    */
    return (
      <div className="flex flex-col w-full h-full min-h-0">
        {/* Zone de conversation */}
        <ChatMessageList
          messages={messages}
          darkTheme={darkTheme}
          hasLinkedPoll={hasLinkedPoll}
          linkedPollId={linkedPollId}
          currentPoll={currentPoll}
          lastAIProposal={lastAIProposal}
          onUsePollSuggestion={handleUsePollSuggestion}
          onOpenEditor={openEditor}
          onSetCurrentPoll={setCurrentPoll}
          onFeedbackSent={() => setLastAIProposal(null)}
          messagesEndRef={messagesEndRef}
          isLoading={isLoading}
          pollType={pollTypeFromUrl}
        />

        {/* Zone de saisie - Fixe en bas de l'écran */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          onUserMessage={onUserMessage}
          isLoading={isLoading}
          darkTheme={darkTheme}
          voiceRecognition={voiceRecognition}
          textareaRef={textareaRef}
          pollType={pollTypeFromUrl}
        />

        {/* Authentication Incentive Modal */}
        <AuthIncentiveModal
          isOpen={quota.showAuthModal}
          onClose={quota.closeAuthModal}
          onSignUp={() => {
            setAuthModalMode("signup");
            setAuthModalOpen(true);
            quota.closeAuthModal();
          }}
          onSignIn={() => {
            setAuthModalMode("signin");
            setAuthModalOpen(true);
            quota.closeAuthModal();
          }}
          trigger={quota.authModalTrigger}
          currentUsage={{
            conversations: quota.status.conversations.used,
            maxConversations: quota.status.conversations.limit,
          }}
        />

        {/* Modal d'authentification */}
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          defaultMode={authModalMode}
        />

        {/* Onboarding Tour - Désactivé temporairement */}
        {/* <OnboardingTour /> */}
      </div>
    );
  },
);

export default GeminiChatInterface;
