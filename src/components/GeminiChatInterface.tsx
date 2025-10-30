import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  Send,
  Sparkles,
  Plus,
  Wand2,
  Calendar,
  Clock,
  Settings,
  Copy,
  Check,
  MessageCircle,
  ArrowLeft,
  Mic,
  MicOff,
} from "lucide-react";
import {
  geminiService,
  type PollSuggestion,
  type FormPollSuggestion,
  type DatePollSuggestion,
} from "../lib/gemini";
import { groupConsecutiveDates } from "../lib/date-utils";
import PollCreator from "./PollCreator";
import FormPollCreator, {
  type FormPollDraft,
  type AnyFormQuestion,
  type FormOption,
} from "./polls/FormPollCreator";
import { debounce } from "lodash";
import { useAutoSave } from "../hooks/useAutoSave";
import { useConversationResume } from "../hooks/useConversationResume";
import { useGeminiAPI } from "../hooks/useGeminiAPI";
import { ConversationService } from "../services/ConversationService";
import { QuotaService, type AuthIncentiveType } from "../services/QuotaService";
import { useQuota } from "../hooks/useQuota";
import { useAiMessageQuota } from "../hooks/useAiMessageQuota";
import {
  checkAiMessageQuota,
  checkPollCreationQuota,
  handleQuotaError,
} from "../services/AiQuotaService";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import AuthIncentiveModal from "./modals/AuthIncentiveModal";
import QuotaIndicator from "./ui/QuotaIndicator";
import { useNavigate, useLocation } from "react-router-dom";
import { conversationProtection } from "../services/ConversationProtection";
import { performanceMonitor } from "../services/PerformanceMonitor";
import { useInfiniteLoopProtection } from "../services/InfiniteLoopProtection";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";
import { logger } from "../lib/logger";
import { useToast } from "@/hooks/use-toast";
import {
  useConversationMessages,
  useConversationActions,
} from "./prototype/ConversationStateProvider";
import { useEditorState, useEditorActions } from "./prototype/EditorStateProvider";
import { useUIState } from "./prototype/UIStateProvider";
import { AIProposalFeedback } from "./polls/AIProposalFeedback";
import { IntentDetectionService } from "../services/IntentDetectionService";
import { FormPollIntentService } from "../services/FormPollIntentService";
import { GeminiIntentService } from "../services/GeminiIntentService";
import { getConversation } from "../lib/storage/ConversationStorageSimple";
import { getPollBySlugOrId } from "../lib/pollStorage";

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
}

export type GeminiChatHandle = {
  submitMessage: (text: string) => Promise<void>;
};

// Fonction de conversion FormPollSuggestion (Gemini) → FormPollDraft (FormPollCreator)
const convertFormSuggestionToDraft = (suggestion: FormPollSuggestion): FormPollDraft => {
  const uid = () => Math.random().toString(36).slice(2, 10);

  const questions: AnyFormQuestion[] = suggestion.questions.map((q) => {
    console.log("🔍 Question Gemini:", q);
    const baseQuestion = {
      id: uid(),
      title: q.title,
      required: q.required,
      type: q.type,
    };

    if (q.type === "single" || q.type === "multiple") {
      console.log("🔍 Options brutes:", q.options);
      const options: FormOption[] = (q.options || [])
        .filter((opt) => opt && typeof opt === "string" && opt.trim())
        .map((opt) => ({
          id: uid(),
          label: opt.trim(),
        }));
      console.log("🔍 Options converties:", options);

      return {
        ...baseQuestion,
        type: q.type,
        options,
        ...(q.maxChoices && { maxChoices: q.maxChoices }),
      } as AnyFormQuestion;
    } else {
      // type === "text"
      return {
        ...baseQuestion,
        type: "text",
        ...(q.placeholder && { placeholder: q.placeholder }),
        ...(q.maxLength && { maxLength: q.maxLength }),
      } as AnyFormQuestion;
    }
  });

  return {
    id: uid(),
    type: "form",
    title: suggestion.title,
    questions,
  };
};

const GeminiChatInterface = React.forwardRef<GeminiChatHandle, GeminiChatInterfaceProps>(
  (
    {
      onPollCreated,
      onNewChat,
      onUserMessage,
      resumeLastConversation = true,
      hideStatusBar = false,
      darkTheme = false,
    },
    ref,
  ) => {
    // Utiliser les hooks spécialisés
    const messages = useConversationMessages();
    const { setMessages: setMessagesRaw } = useConversationActions();
    const { currentPoll } = useEditorState();
    const { dispatchPollAction, openEditor, setCurrentPoll, createPollFromChat, clearCurrentPoll } =
      useEditorActions();
    const { setModifiedQuestion } = useUIState();

    // 🔧 FIX: Nettoyer le poll quand on démarre une NOUVELLE conversation
    const location = useLocation();
    const lastConversationIdRef = useRef<string | null>(null);

    // 🎯 FIX E2E: Auto-focus sur le textarea après ouverture de l'éditeur (mobile)
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
      if (currentPoll && textareaRef.current) {
        // Sur mobile, quand l'éditeur s'ouvre, le focus est perdu
        // On le remet automatiquement après un court délai
        const timer = setTimeout(() => {
          textareaRef.current?.focus();
          logger.info("🎯 Auto-focus sur textarea après ouverture éditeur", "poll");
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

    // Wrapper pour éviter les erreurs de type PollSuggestion (conflit gemini.ts vs ConversationService.ts)
    const setMessages = useCallback(
      (updater: any) => {
        setMessagesRaw(updater as any);
      },
      [setMessagesRaw],
    );

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [selectedPollData, setSelectedPollData] = useState<PollSuggestion | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">(
      "unknown",
    );

    // État pour le feedback IA
    const [lastAIProposal, setLastAIProposal] = useState<{
      userRequest: string;
      generatedContent: any;
      pollContext?: {
        pollId?: string;
        pollTitle?: string;
        pollType?: string;
        action?: string;
      };
    } | null>(null);

    // Surveiller _highlightedId pour déclencher le feedback visuel (ADD_QUESTION)
    useEffect(() => {
      if (
        currentPoll &&
        (currentPoll as any)._highlightedId &&
        (currentPoll as any)._highlightType === "add"
      ) {
        const highlightedId = (currentPoll as any)._highlightedId;
        // Pour ADD_QUESTION, on considère que c'est le titre qui a été ajouté
        setModifiedQuestion(highlightedId, "title");
      }
    }, [currentPoll, setModifiedQuestion]);

    // Déterminer si un sondage est déjà lié à cette conversation (persiste après refresh)
    const linkedPollId = useMemo(() => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const convId = urlParams.get("conversationId");
        console.log("🔍 linkedPollId - conversationId:", convId);
        if (!convId) return null;
        const conv = getConversation(convId);
        console.log("🔍 linkedPollId - conversation:", conv);
        const meta = (conv && (conv as any).metadata) || {};
        console.log("🔍 linkedPollId - metadata:", meta);
        const id: string | undefined = meta.pollId || undefined;
        const generated: boolean = !!meta.pollGenerated;
        console.log("🔍 linkedPollId - pollId:", id, "generated:", generated);
        if (id && typeof id === "string" && id.trim()) return id;
        // Fallback: indicateur généré sans id
        return generated ? "generated" : null;
      } catch (e) {
        logger.error("linkedPollId error", e);
        return null;
      }
    }, [messages]);

    const hasLinkedPoll = useMemo(() => {
      // Si un poll est actuellement chargé ou si un pollId est enregistré dans les métadonnées
      const result = currentPoll ? true : !!linkedPollId;
      console.log(
        "🔍 hasLinkedPoll:",
        result,
        "currentPoll:",
        !!currentPoll,
        "linkedPollId:",
        linkedPollId,
      );
      return result;
    }, [currentPoll, linkedPollId]);

    // Auto-save and conversation resume hooks
    const navigate = useNavigate();
    // location déjà déclaré plus haut (ligne 164)
    const autoSave = useAutoSave({
      debug: true,
    });
    const conversationResume = useConversationResume();
    const quota = useQuota();
    const aiQuota = useAiMessageQuota(autoSave.getRealConversationId() || undefined);
    const loopProtection = useInfiniteLoopProtection("gemini-chat-interface");
    const { toast } = useToast();

    // 🎤 Voice recognition
    const voiceRecognition = useVoiceRecognition({
      lang: "fr-FR",
      interimResults: true,
      continuous: true, // Mode continu pour ne pas couper trop vite
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

    // Utiliser useRef pour persister les flags entre les re-rendus
    const hasShownOfflineMessage = useRef(false);
    const wasOffline = useRef(false);
    const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);
    const hasResumedConversation = useRef(false);

    // Initialize new conversation
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

          setMessages([]);
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
            setMessages([
              {
                id: "quota-error",
                content:
                  "⚠️ Limite de conversations atteinte. Vous avez déjà créé le nombre maximum de conversations autorisées. Veuillez supprimer une conversation existante ou vous connecter pour augmenter votre limite.",
                isAI: true,
                timestamp: new Date(),
              },
            ]);
          } else if (
            error instanceof Error &&
            error.message.includes("Conversation limit reached")
          ) {
            setMessages([
              {
                id: "limit-error",
                content:
                  "⚠️ Limite de conversations atteinte. Vous avez déjà créé le nombre maximum de conversations autorisées. Veuillez supprimer une conversation existante ou vous connecter pour augmenter votre limite.",
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
    }, [autoSave, loopProtection, messages]);

    useEffect(() => {
      // Prevent multiple initialization attempts
      if (hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;
      let isMounted = true;

      // Initialize component setup first
      hasShownOfflineMessage.current = false;
      wasOffline.current = false;
      testGeminiConnection();

      // Scroll fixes for Android
      window.scrollTo({ top: 0, behavior: "instant" });
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 100);

      const resumeConversation = async () => {
        // Additional guard: prevent multiple resume attempts
        if (isInitializing || !isMounted) {
          // Initialization already handled, skipping
          return;
        }

        // Resume conversation from URL if available

        try {
          const result = await ConversationService.resumeFromUrl(autoSave);

          if (!isMounted) return;

          if (result && result.conversation && result.messages) {
            // Clear messages only if we have a conversation to restore from URL
            if (isMounted) {
              setMessages([]);
            }
            // Resuming conversation from URL

            // Get messages from the conversation
            const messages = result.messages;

            if (messages && messages.length > 0) {
              // Convert conversation messages to chat interface format
              const chatMessages = ConversationService.convertMessagesToChat(messages);

              console.log(
                "📨 GeminiChatInterface: Messages convertis:",
                chatMessages.length,
                "messages",
              );
              console.log("📨 Premier message:", chatMessages[0]);
              console.log(
                "📨 Tous les messages:",
                chatMessages.map((m) => ({
                  id: m.id,
                  isAI: m.isAI,
                  preview: m.content.substring(0, 50) + "...",
                })),
              );

              if (isMounted) {
                setMessages(chatMessages);
                hasResumedConversation.current = true;
                console.log(
                  "✅ GeminiChatInterface: setMessages appelé avec",
                  chatMessages.length,
                  "messages",
                );
                console.log(
                  "✅ Flag hasResumedConversation activé - initializeNewConversation sera bloqué",
                );
                // Conversation resumed successfully

                // 🔧 FIX E2E: Auto-ouvrir le poll si la conversation en contient un
                let pollId = result.conversation.relatedPollId;

                // Si pas de relatedPollId, chercher dans les messages
                if (!pollId) {
                  for (const msg of chatMessages) {
                    const suggestion = msg.pollSuggestion as any;
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
                      setCurrentPoll(poll as any);
                      openEditor();
                    }
                  } catch (error) {
                    logError(ErrorFactory.storage("Erreur lors du chargement du poll", "Impossible de charger le sondage"), { metadata: { error } });
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
                setMessages([resumeMessage]);
              }
            }
          } else {
            // No conversation to resume, initializing new conversation
            if (isMounted && !isInitializing) {
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

          if (isMounted && !isInitializing) {
            await initializeNewConversation();
          }
        }
      };

      // Add small delay to prevent race conditions on component mount
      const timeoutId = setTimeout(resumeConversation, 150);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        if (reconnectionTimeoutRef.current) {
          clearTimeout(reconnectionTimeoutRef.current);
        }
      };
    }, [location.search]); // Re-run when URL search params change

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

    const testGeminiConnection = async () => {
      // Connection test in progress (reduced logging)
      try {
        const isConnected = await geminiService.testConnection();
        const newStatus = isConnected ? "connected" : "error";
        // Only log connection changes, not every test result

        // Si l'IA était hors ligne et redevient disponible
        if (wasOffline.current && isConnected && connectionStatus === "error") {
          // Gemini reconnected - adding reconnection message
          setMessages((prev) => [
            ...prev,
            {
              id: `reconnected-${Date.now()}`,
              content:
                "✅ Je suis de nouveau disponible ! Vous pouvez maintenant créer vos sondages.",
              isAI: true,
              timestamp: new Date(),
            },
          ]);
          wasOffline.current = false;
          hasShownOfflineMessage.current = false;
        }

        setConnectionStatus(newStatus);

        if (!isConnected) {
          // Afficher le message d'erreur seulement la première fois
          if (!hasShownOfflineMessage.current) {
            // Gemini unavailable - adding error message
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${Date.now()}`,
                content:
                  "⚠️ Je suis temporairement indisponible. Je vais réessayer de me connecter automatiquement...",
                isAI: true,
                timestamp: new Date(),
              },
            ]);
            hasShownOfflineMessage.current = true;
            wasOffline.current = true;
          }

          // Nettoyer le timeout précédent s'il existe
          if (reconnectionTimeoutRef.current) {
            clearTimeout(reconnectionTimeoutRef.current);
          }

          // Réessayer dans 10 secondes
          reconnectionTimeoutRef.current = setTimeout(() => {
            testGeminiConnection();
          }, 10000);
        }
      } catch (error) {
        setConnectionStatus("error");

        const processedError = handleError(
          error,
          {
            component: "GeminiChatInterface",
            operation: "testConnection",
          },
          "Erreur de connexion à Gemini",
        );

        logError(processedError, {
          component: "GeminiChatInterface",
          operation: "testConnection",
        });

        // Afficher le message d'erreur seulement la première fois
        if (!hasShownOfflineMessage.current) {
          // Gemini unavailable - adding error message
          setMessages((prev) => [
            ...prev,
            {
              id: `connection-error-${Date.now()}`,
              content:
                "⚠️ Je suis temporairement indisponible. Je vais réessayer de me connecter automatiquement...",
              isAI: true,
              timestamp: new Date(),
            },
          ]);
          hasShownOfflineMessage.current = true;
          wasOffline.current = true;
        }

        // Nettoyer le timeout précédent s'il existe
        if (reconnectionTimeoutRef.current) {
          clearTimeout(reconnectionTimeoutRef.current);
        }

        // Réessayer dans 10 secondes
        reconnectionTimeoutRef.current = setTimeout(() => {
          testGeminiConnection();
        }, 10000);
      }
    };

    // Core sending logic, parameterized for normal input vs programmatic calls
    const sendMessageWithText = useCallback(
      async (text: string, notifyParent: boolean) => {
        const trimmedText = (text || "").trim();
        if (!trimmedText || isLoading) return;

        if (notifyParent) onUserMessage?.();

        // Check conversation quota before proceeding
        if (!quota.checkConversationLimit()) {
          return; // Modal will be shown by the quota hook
        }

        // 🎯 NEW: Check AI message quota (Freemium)
        const quotaCheck = checkAiMessageQuota(aiQuota);
        if (!quotaCheck.canProceed) {
          handleQuotaError(quotaCheck, quota, toast);
          return;
        }

        // 🎯 PROTOTYPE: Détecter les intentions de modification
        if (currentPoll) {
          // Essayer d'abord la détection Date Poll
          const dateIntent = IntentDetectionService.detectSimpleIntent(trimmedText, currentPoll);

          if (dateIntent && dateIntent.isModification && dateIntent.confidence > 0.7) {
            // Ajouter le message utilisateur
            const userMessage: Message = {
              id: `user-${Date.now()}`,
              content: trimmedText,
              isAI: false,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);

            // Vérifier AVANT de dispatcher pour détecter les doublons
            const previousDates = currentPoll.dates || [];
            const isAlreadyInPoll = previousDates.includes(dateIntent.payload);
            const isNotInPoll = !previousDates.includes(dateIntent.payload);

            // Dispatcher l'action
            dispatchPollAction({
              type: dateIntent.action as any,
              payload: dateIntent.payload,
            });

            // Stocker la proposition IA pour le feedback
            setLastAIProposal({
              userRequest: trimmedText,
              generatedContent: {
                action: dateIntent.action,
                payload: dateIntent.payload,
                explanation: dateIntent.explanation,
              },
              pollContext: {
                pollId: currentPoll.id,
                pollTitle: currentPoll.title,
                pollType: "date",
                action: "modify",
              },
            });

            // Feedback intelligent selon l'action avec icons
            const dateActionIcons: Record<string, string> = {
              ADD_DATE: "📅",
              REMOVE_DATE: "🗑️",
              UPDATE_TITLE: "✏️",
              ADD_TIMESLOT: "🕐",
              REPLACE_POLL: "🔄",
            };
            const dateIcon = dateActionIcons[dateIntent.action] || "✅";

            let confirmContent = `${dateIcon} ${dateIntent.explanation}`;

            if (dateIntent.action === "ADD_DATE" && isAlreadyInPoll) {
              confirmContent = `ℹ️ La date ${dateIntent.payload.split("-").reverse().join("/")} est déjà dans le sondage`;
            }

            if (dateIntent.action === "REMOVE_DATE" && isNotInPoll) {
              confirmContent = `ℹ️ La date ${dateIntent.payload.split("-").reverse().join("/")} n'est pas dans le sondage`;
            }

            // Message de confirmation
            const confirmMessage: Message = {
              id: `ai-${Date.now()}`,
              content: confirmContent,
              isAI: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, confirmMessage]);

            return; // Ne pas appeler Gemini
          }

          // Si pas de date intent, essayer Form Poll intent avec regex
          let formIntent = FormPollIntentService.detectIntent(trimmedText, currentPoll);

          // Fallback sur l'IA si regex n'a pas matché
          if (!formIntent || !formIntent.isModification || formIntent.confidence < 0.7) {
            logger.info("⚠️ Regex n'a pas matché, fallback sur IA Gemini", "poll");
            const aiIntent = await GeminiIntentService.detectFormIntent(trimmedText, currentPoll);

            if (aiIntent && aiIntent.isModification && aiIntent.confidence > 0.8) {
              // Log le gap pour améliorer les regex plus tard
              GeminiIntentService.logMissingPattern(trimmedText, aiIntent);
              formIntent = aiIntent as any; // Convertir au format FormModificationIntent
            } else {
              // Ni regex ni IA n'ont réussi - proposer à l'utilisateur de signaler
              logger.warn("❌ Modification non reconnue par regex ET IA", "poll", {
                message: trimmedText,
                aiConfidence: aiIntent?.confidence || 0,
              });

              // Message d'erreur avec lien pour signaler
              const errorMessage: Message = {
                id: `ai-${Date.now()}`,
                content: `❌ Je n'ai pas compris cette demande de modification. 

Vous pouvez :
- Reformuler votre demande plus simplement
- [Signaler ce problème](mailto:support@doodates.app?subject=Modification non reconnue&body=Message: "${trimmedText}"%0A%0APoll: ${currentPoll.title})

Exemples de modifications supportées :
- "ajoute une question sur [sujet]"
- "rends la question 3 obligatoire"
- "supprime la question 2"
- "change la question 1 en choix multiple"`,
                isAI: true,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
              return; // Ne pas continuer
            }
          }

          if (formIntent && formIntent.isModification && formIntent.confidence > 0.7) {
            // Ajouter le message utilisateur
            const userMessage: Message = {
              id: `user-${Date.now()}`,
              content: trimmedText,
              isAI: false,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);

            // Dispatcher l'action
            // FormPollIntentService retourne déjà des index 0-based, pas besoin de conversion
            let payload = formIntent.payload;

            // Convertir title → subject pour ADD_QUESTION (compatibilité reducer)
            if (formIntent.action === "ADD_QUESTION" && payload.title) {
              payload = {
                subject: payload.title, // Le reducer attend "subject"
              };
            }

            logger.info("🔄 Dispatch action", "poll", {
              action: formIntent.action,
              payload: payload,
            });
            dispatchPollAction({
              type: formIntent.action as any,
              payload: payload,
            });

            // Stocker la proposition IA pour le feedback
            setLastAIProposal({
              userRequest: trimmedText,
              generatedContent: {
                action: formIntent.action,
                payload: payload,
                explanation: formIntent.explanation,
              },
              pollContext: {
                pollId: currentPoll.id,
                pollTitle: currentPoll.title,
                pollType: "form",
                action: "modify",
              },
            });

            // Déclencher le feedback visuel si une question a été modifiée
            if (formIntent.modifiedQuestionId && formIntent.modifiedField) {
              setModifiedQuestion(formIntent.modifiedQuestionId, formIntent.modifiedField);
            }

            // Message de confirmation avec icon selon l'action
            const actionIcons: Record<string, string> = {
              ADD_QUESTION: "➕",
              REMOVE_QUESTION: "🗑️",
              CHANGE_QUESTION_TYPE: "🔄",
              ADD_OPTION: "➕",
              REMOVE_OPTION: "❌",
              SET_REQUIRED: "⭐",
              RENAME_QUESTION: "✏️",
            };
            const icon = actionIcons[formIntent.action] || "✅";

            const confirmMessage: Message = {
              id: `ai-${Date.now()}`,
              content: `${icon} ${formIntent.explanation}`,
              isAI: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, confirmMessage]);

            return; // Ne pas appeler Gemini
          }
        }

        // Détecter si c'est un markdown questionnaire long
        const trimmedInput = trimmedText;
        const isLongMarkdown = trimmedInput.length > 500 && /^#\s+.+$/m.test(trimmedInput);
        const displayContent = isLongMarkdown
          ? `📋 Questionnaire détecté (${trimmedInput.length} caractères)\n\nAnalyse en cours...`
          : trimmedInput;

        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content: displayContent,
          isAI: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // Ajouter un message de progression si markdown détecté
        if (isLongMarkdown) {
          const progressMessage: Message = {
            id: `progress-${Date.now()}`,
            content: "🤖 Analyse du questionnaire markdown en cours...",
            isAI: true,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, progressMessage]);
        }

        // Auto-save user message (avec le contenu original pour les markdown)
        await autoSave.addMessage({
          id: userMessage.id,
          content: isLongMarkdown ? trimmedInput : userMessage.content,
          isAI: userMessage.isAI,
          timestamp: userMessage.timestamp,
        });

        // Appel API Gemini via le hook
        const pollResponse = await geminiAPI.generatePoll(trimmedInput);

        // 🎯 NEW: Incrémenter le compteur de messages IA
        aiQuota.incrementAiMessages();

        // Supprimer le message de progression si présent
        if (isLongMarkdown) {
          setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("progress-")));
        }

        if (pollResponse.success && pollResponse.data) {
          // Gemini response received successfully
          const pollType =
            pollResponse.data.type === "form" ? "questionnaire" : "sondage de disponibilité";
          const aiResponse: Message = {
            id: `ai-${Date.now()}`,
            content: `Voici votre ${pollType} :`,
            isAI: true,
            timestamp: new Date(),
            pollSuggestion: pollResponse.data,
          };

          setMessages((prev) => [...prev, aiResponse]);

          // Auto-save AI response with poll suggestion
          await autoSave.addMessage({
            id: aiResponse.id,
            content: aiResponse.content,
            isAI: aiResponse.isAI,
            timestamp: aiResponse.timestamp,
            metadata: {
              pollGenerated: true,
              pollSuggestion: aiResponse.pollSuggestion,
            },
          });
        } else {
          // Poll generation failed - le hook gère déjà les types d'erreurs
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            content: pollResponse.error || "Erreur lors de la génération",
            isAI: true,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);

          // Auto-save error message
          await autoSave.addMessage({
            id: errorMessage.id,
            content: errorMessage.content,
            isAI: errorMessage.isAI,
            timestamp: errorMessage.timestamp,
          });
        }

        setIsLoading(false);
      },
      [
        autoSave,
        currentPoll,
        dispatchPollAction,
        geminiAPI,
        isLoading,
        onPollCreated,
        onUserMessage,
        quota,
        setMessages,
      ],
    );

    // Expose programmatic submission (used by mobile Preview input)
    useImperativeHandle(ref, () => ({
      submitMessage: async (text: string) => sendMessageWithText(text, false),
    }));

    const handleSendMessage = async () => {
      if (!inputValue.trim() || isLoading) return;
      await sendMessageWithText(inputValue, true);
      setInputValue("");
    };

    const handleUsePollSuggestion = (suggestion: PollSuggestion) => {
      console.log("🎯 handleUsePollSuggestion appelé avec:", suggestion);
      console.log("🎯 onPollCreated existe?", !!onPollCreated);

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

      // Si on a un callback onPollCreated, l'utiliser au lieu d'afficher le créateur
      if (onPollCreated) {
        console.log("🎯 Appel de onPollCreated");

        // Mettre à jour l'URL avec conversationId AVANT d'appeler onPollCreated
        if (conversationId && !window.location.search.includes("conversationId")) {
          const newUrl = `${window.location.pathname}?conversationId=${conversationId}`;
          window.history.replaceState({}, "", newUrl);
          console.log("🔗 URL mise à jour avec conversationId:", conversationId);
        }

        onPollCreated(suggestion);
        return;
      }

      // Sinon, comportement par défaut : afficher le créateur
      console.log("🎯 Affichage du créateur");
      setSelectedPollData(suggestion);
      setShowPollCreator(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const handleNewChat = async () => {
      try {
        // Reset all state
        setMessages([]);
        setInputValue("");
        setIsLoading(false);
        setShowPollCreator(false);
        setSelectedPollData(null);
        setConnectionStatus("unknown");

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
    };

    // Afficher le PollCreator si demandé
    // console.log(
    //   "🔍 showPollCreator:",
    //   showPollCreator,
    //   "selectedPollData:",
    //   selectedPollData,
    // );
    if (showPollCreator) {
      const realConversationId = autoSave.getRealConversationId();
      const conversationId = realConversationId || autoSave.conversationId;
      const pollCreatorUrl = conversationId ? `?conversationId=${conversationId}` : "";

      // Update URL to include conversation ID
      if (conversationId && !window.location.search.includes("conversationId")) {
        const newUrl = `${window.location.pathname}${pollCreatorUrl}`;
        window.history.replaceState({}, "", newUrl);
      }

      // Router vers le bon composant selon le type
      const isFormPoll = selectedPollData?.type === "form";
      console.log("🔍 isFormPoll:", isFormPoll);

      if (isFormPoll && selectedPollData) {
        // Convertir FormPollSuggestion en FormPollDraft
        console.log("🔍 AVANT conversion, selectedPollData:", selectedPollData);
        const formDraft = convertFormSuggestionToDraft(selectedPollData as FormPollSuggestion);
        console.log("🔍 APRÈS conversion, formDraft:", formDraft);

        return (
          <FormPollCreator
            initialDraft={formDraft}
            onCancel={() => {
              setShowPollCreator(false);
              setSelectedPollData(null);
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
              toast({
                title: "🎉 Questionnaire créé !",
                description: "Votre formulaire est maintenant disponible.",
              });
              // Auto-ouvrir la preview du formulaire créé si disponible
              if (savedPoll) {
                try {
                  setCurrentPoll(savedPoll as any);
                  openEditor();
                } catch {}
              }
              setShowPollCreator(false);
              setSelectedPollData(null);
            }}
          />
        );
      }

      return (
        <PollCreator
          initialData={(selectedPollData as DatePollSuggestion) || undefined}
          onBack={() => {
            setShowPollCreator(false);
            setSelectedPollData(null);
          }}
        />
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Barre d'état compacte */}
        {false && (
          <div
            className={`sticky top-[80px] z-40 p-2 md:p-3 ${
              darkTheme ? "bg-gray-900" : "bg-white"
            }`}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-blue-500"
                        : connectionStatus === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {connectionStatus === "connected"
                      ? "IA connectée"
                      : connectionStatus === "error"
                        ? "IA déconnectée"
                        : "Connexion..."}
                  </span>
                </div>

                {/* Quota indicator for guest users */}
                {!quota.isAuthenticated && (
                  <QuotaIndicator
                    used={quota.status.conversations.used}
                    limit={quota.status.conversations.limit}
                    type="conversations"
                    size="sm"
                    onClick={() => quota.showAuthIncentive("conversation_limit")}
                  />
                )}
              </div>

              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Zone de conversation */}
        <div
          className={`flex-1 overflow-y-auto ${
            darkTheme ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-blue-50 to-indigo-50"
          } ${messages.length === 0 ? "flex items-center justify-center" : "pb-20 md:pb-32"}`}
        >
          <div
            className={`max-w-4xl mx-auto p-2 md:p-4 ${
              messages.length > 0 ? "space-y-3 md:space-y-4" : ""
            }`}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`max-w-md ${darkTheme ? "text-white" : "text-gray-900"}`}>
                  <div
                    className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${
                      darkTheme ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3
                    className={`text-lg font-medium mb-2 ${
                      darkTheme ? "text-blue-400" : "text-gray-900"
                    }`}
                  >
                    Bonjour ! 👋
                  </h3>
                  <p className={`mb-4 ${darkTheme ? "text-gray-300" : "text-gray-600"}`}>
                    Je suis votre assistant IA pour créer des sondages de dates et des
                    questionnaires. Décrivez-moi ce que vous souhaitez !
                  </p>
                  <div
                    className={`text-sm space-y-2 ${darkTheme ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <div>
                      <p
                        className={`font-medium mb-1 ${
                          darkTheme ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        📅 Sondages de dates :
                      </p>
                      <p>• "Réunion d'équipe la semaine prochaine"</p>
                      <p>• "Déjeuner mardi ou mercredi"</p>
                    </div>
                    <div>
                      <p
                        className={`font-medium mb-1 ${
                          darkTheme ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        📝 Questionnaires :
                      </p>
                      <p>• "Questionnaire de satisfaction client"</p>
                      <p>• "Sondage d'opinion sur notre produit"</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isAI ? "justify-start" : "justify-end"}`}
                >
                  {/* Icône IA à gauche pour les messages IA */}
                  {message.isAI && (
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      message.isAI
                        ? darkTheme
                          ? "text-gray-100"
                          : "text-gray-900"
                        : "bg-[#3c4043] text-white rounded-[20px] px-5 py-3"
                    } whitespace-pre-wrap break-words`}
                  >
                    {message.content}
                    {message.pollSuggestion && (
                      <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                        {/* Description si présente */}
                        {message.pollSuggestion.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {message.pollSuggestion.description}
                          </p>
                        )}

                        <div className="space-y-3">
                          {/* Affichage conditionnel selon le type */}
                          {(message.pollSuggestion as any).type === "form" ? (
                            /* Affichage Form Poll (questionnaire) - MÊME DESIGN QUE DATE POLL */
                            <div className="space-y-2 md:space-y-3">
                              {(message.pollSuggestion as any).questions?.map(
                                (question: any, idx: number) => (
                                  <div key={idx} className="bg-[#3c4043] rounded-lg p-3 md:p-4">
                                    <div className="flex items-start gap-2 md:gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-sm md:text-base leading-tight">
                                          {idx + 1}. {question.title}
                                        </div>
                                        <div className="mt-1.5 md:mt-2 text-xs md:text-sm text-gray-300">
                                          <span className="inline-block">
                                            {question.type === "single"
                                              ? "Choix unique"
                                              : question.type === "multiple"
                                                ? "Choix multiples"
                                                : "Texte libre"}
                                          </span>
                                          {question.required && (
                                            <span className="text-red-400 ml-2">• Obligatoire</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            /* Affichage Date Poll (dates/horaires) - avec groupement intelligent */
                            <div className="space-y-2 md:space-y-3">
                              {(() => {
                                const datePollSuggestion =
                                  message.pollSuggestion as import("../lib/gemini").DatePollSuggestion;
                                const dates = datePollSuggestion.dates || [];

                                // Grouper les dates consécutives (week-ends, semaines, quinzaines)
                                const dateGroups = groupConsecutiveDates(dates);

                                return dateGroups.map((group, groupIndex) => {
                                  // Pour les groupes, afficher le label groupé
                                  // Pour les dates individuelles, afficher normalement
                                  const isGroup = group.dates.length > 1;

                                  // Trouver les créneaux horaires pour ce groupe
                                  const groupTimeSlots =
                                    datePollSuggestion.timeSlots?.filter((slot) => {
                                      if (!slot.dates || slot.dates.length === 0) return true;
                                      return group.dates.some((date) => slot.dates?.includes(date));
                                    }) || [];

                                  return (
                                    <div
                                      key={`group-${groupIndex}`}
                                      className="bg-[#3c4043] rounded-lg p-3 md:p-4"
                                    >
                                      <div className="flex items-start gap-2 md:gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-white text-sm md:text-base leading-tight">
                                            {isGroup
                                              ? // Afficher le label groupé
                                                group.label
                                              : // Afficher la date normale
                                                new Date(group.dates[0]).toLocaleDateString(
                                                  "fr-FR",
                                                  {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                  },
                                                )}
                                          </div>
                                          {groupTimeSlots.length > 0 && !isGroup && (
                                            <div className="mt-1.5 md:mt-2 text-xs md:text-sm text-gray-300">
                                              <span className="block">
                                                {groupTimeSlots
                                                  .map((slot) => `${slot.start} - ${slot.end}`)
                                                  .join(", ")}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Bouton Créer */}
                        {hasLinkedPoll ? (
                          <button
                            onClick={() => {
                              console.log(
                                "🔍 Bouton Voir cliqué - currentPoll:",
                                currentPoll,
                                "linkedPollId:",
                                linkedPollId,
                              );
                              // Ouvrir la dernière version du sondage lié
                              try {
                                if (currentPoll) {
                                  console.log("✅ Ouverture via currentPoll");
                                  openEditor();
                                  return;
                                }
                                if (linkedPollId && linkedPollId !== "generated") {
                                  console.log("🔍 Recherche poll par ID:", linkedPollId);
                                  const p = getPollBySlugOrId(linkedPollId);
                                  console.log("🔍 Poll trouvé:", p);
                                  if (p) {
                                    console.log("✅ Ouverture via linkedPollId");
                                    setCurrentPoll(p as any);
                                    openEditor();
                                    return;
                                  }
                                }
                                // Aucun poll résolu: tenter d'afficher le créateur si suggestion présente
                                console.warn("⚠️ Aucun poll trouvé, fallback au créateur");
                                handleUsePollSuggestion(message.pollSuggestion!);
                              } catch (e) {
                                console.warn(
                                  "❌ Impossible d'ouvrir la preview, fallback au créateur",
                                  e,
                                );
                                handleUsePollSuggestion(message.pollSuggestion!);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg font-medium transition-colors bg-indigo-500 hover:bg-indigo-600"
                          >
                            <span>
                              {(message.pollSuggestion as any).type === "form"
                                ? "Voir le formulaire"
                                : "Voir le sondage"}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              console.log(" Bouton cliqué!", message.pollSuggestion);
                              handleUsePollSuggestion(message.pollSuggestion!);
                            }}
                            className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg font-medium transition-colors bg-blue-500 hover:bg-blue-600"
                          >
                            <span>
                              {(message.pollSuggestion as any).type === "form"
                                ? "Créer ce formulaire"
                                : "Créer ce sondage"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Composant de feedback IA */}
            {lastAIProposal && (
              <div className="mt-2">
                <AIProposalFeedback
                  proposal={lastAIProposal}
                  onFeedbackSent={() => {
                    // Optionnel : cacher après feedback
                    setLastAIProposal(null);
                  }}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie - Fixe en bas de l'écran */}
        <div
          className={`p-4 md:p-6 fixed bottom-0 left-0 right-0 z-40 ${
            darkTheme ? "bg-[#0a0a0a]" : "bg-white"
          }`}
        >
          <div className="max-w-2xl mx-auto">
            {/* Indicateur reconnaissance vocale */}
            {voiceRecognition.isListening && (
              <div className="mb-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Écoute en cours...
                    </span>
                  </div>
                  {voiceRecognition.interimTranscript && (
                    <span className="text-gray-600 dark:text-gray-400 italic">
                      "{voiceRecognition.interimTranscript}"
                    </span>
                  )}
                </div>
              </div>
            )}

            <div
              className={`flex items-center gap-3 rounded-full p-2 border ${
                darkTheme
                  ? "bg-[#0a0a0a] border-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  : "bg-white border-gray-200 shadow-lg"
              }`}
            >
              <textarea
                ref={textareaRef}
                data-testid="message-input"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Notify parent on typing to allow mobile auto-toggle to Chat
                  if (typeof onUserMessage === "function") onUserMessage();
                }}
                onFocus={() => {
                  // Notify parent on focus as well (helps when Preview is visible on mobile)
                  if (typeof onUserMessage === "function") onUserMessage();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Décrivez votre sondage..."
                className={`flex-1 resize-none border-0 px-4 py-3 focus:outline-none min-h-[44px] max-h-32 text-sm md:text-base bg-transparent ${
                  darkTheme
                    ? "text-white placeholder-gray-400"
                    : "text-gray-900 placeholder-gray-500"
                }`}
                rows={1}
              />

              {/* Bouton micro pour reconnaissance vocale */}
              {voiceRecognition.isSupported && (
                <button
                  onClick={() => {
                    if (voiceRecognition.isListening) {
                      voiceRecognition.stopListening();
                      // Garder le texte dans l'input après l'arrêt
                    } else {
                      voiceRecognition.resetTranscript(); // Reset avant de commencer
                      voiceRecognition.startListening();
                    }
                  }}
                  disabled={isLoading}
                  className={`
                    rounded-full p-2 transition-all flex-shrink-0
                    ${
                      isLoading
                        ? "bg-transparent text-gray-500 cursor-not-allowed"
                        : voiceRecognition.isListening
                          ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                          : darkTheme
                            ? "bg-transparent text-gray-300 hover:bg-gray-700"
                            : "bg-transparent text-gray-600 hover:bg-gray-100"
                    }
                  `}
                  title={voiceRecognition.isListening ? "Arrêter l'écoute" : "Activer le micro"}
                >
                  {voiceRecognition.isListening ? (
                    <MicOff className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Mic className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              )}

              <button
                data-testid="send-message-button"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`
              rounded-full p-2 transition-all flex-shrink-0
              ${
                isLoading || !inputValue.trim()
                  ? "bg-transparent text-gray-500 cursor-not-allowed"
                  : darkTheme
                    ? "bg-transparent text-gray-300 hover:bg-gray-700"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
              }
            `}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Incentive Modal */}
        <AuthIncentiveModal
          isOpen={quota.showAuthModal}
          onClose={quota.closeAuthModal}
          onSignUp={() => {
            // Navigate to sign up
            window.location.href = "/auth/signup";
          }}
          onSignIn={() => {
            // Navigate to sign in
            window.location.href = "/auth/signin";
          }}
          trigger={quota.authModalTrigger}
          currentUsage={{
            conversations: quota.status.conversations.used,
            maxConversations: quota.status.conversations.limit,
          }}
        />
      </div>
    );
  },
);

export default GeminiChatInterface;
