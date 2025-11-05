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
import {
  type PollSuggestion,
  type FormPollSuggestion,
  type DatePollSuggestion,
} from "../lib/gemini";
// Lazy load PollCreator - ne se charge que si nécessaire
const PollCreator = lazy(() => import("./PollCreator"));
import FormPollCreator from "./polls/FormPollCreator";
import { useAutoSave } from "../hooks/useAutoSave";
import { useConversationResume } from "../hooks/useConversationResume";
import { useGeminiAPI } from "../hooks/useGeminiAPI";
import { ConversationService } from "../services/ConversationService";
import { useQuota } from "../hooks/useQuota";
import { useAiMessageQuota } from "../hooks/useAiMessageQuota";
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
    const initialMessageSentRef = useRef(false);

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
      const state = location.state as any;
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
    const setMessages = useCallback(
      (updater: any) => {
        setMessagesRaw(updater as any);
      },
      [setMessagesRaw],
    );

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        if (!convId) return null;
        const conv = getConversation(convId);
        if (!conv) return null;

        // Lire pollId depuis conversation.pollId (Session 2 - Bug 3)
        const pollId = (conv as any).pollId;
        if (pollId) return pollId;

        // Fallback: metadata (ancien format)
        const meta = (conv as any).metadata || {};
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
            setCurrentPoll(poll as any);
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
    const quota = useQuota();
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
        setMessages((prev) => [...prev, message]);
      },
    });

    // Intent detection hook
    const intentDetection = useIntentDetection({
      currentPoll,
      onDispatchAction: dispatchPollAction,
    });

    // Poll management hook
    const pollManagement = usePollManagement();

    // Define handleNewChat early for use in useMessageSender
    const handleNewChat = useCallback(async () => {
      try {
        // Reset all state
        setMessages([]);
        setInputValue("");
        setIsLoading(false);
        pollManagement.closePollCreator();

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
    }, [pollManagement, onNewChat]);

    // Message sender hook
    const messageSender = useMessageSender({
      isLoading,
      quota,
      aiQuota,
      toast,
      intentDetection,
      geminiAPI,
      autoSave,
      onUserMessage,
      setMessages,
      setIsLoading,
      setLastAIProposal,
      setModifiedQuestion,
      onStartNewChat: handleNewChat,
    });

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave, loopProtection, messages]); // Intentionnel : setMessages est stable, pas besoin de le tracker

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

              // Messages convertis avec succès

              if (isMounted) {
                setMessages(chatMessages);
                hasResumedConversation.current = true;

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
      if (!inputValue.trim() || isLoading) return;
      await sendMessageWithText(inputValue, true);
      setInputValue("");
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

      // Router vers le bon composant selon le type
      const isFormPoll = pollManagement.isFormPoll;

      if (isFormPoll) {
        // Convertir FormPollSuggestion en FormPollDraft
        const formDraft = pollManagement.getFormDraft();

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
              pollManagement.closePollCreator();
            }}
          />
        );
      }

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
            initialData={(pollManagement.selectedPollData as DatePollSuggestion) || undefined}
            onBack={() => {
              pollManagement.closePollCreator();
            }}
          />
        </Suspense>
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
                      connectionStatusHook.status === "connected"
                        ? "bg-blue-500"
                        : connectionStatusHook.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {connectionStatusHook.status === "connected"
                      ? "IA connectée"
                      : connectionStatusHook.status === "error"
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
                <Suspense fallback={<span className="w-4 h-4" />}>
                  <PlusLazy className="w-4 h-4" />
                </Suspense>
                <span className="hidden sm:inline">Nouveau chat</span>
              </button>
            </div>
          </div>
        )}

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
        />

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

        {/* Onboarding Tour */}
        <OnboardingTour />
      </div>
    );
  },
);

export default GeminiChatInterface;
