import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { geminiService, type PollSuggestion } from "../lib/gemini";
import PollCreator from "./PollCreator";
import { debounce } from "lodash";
import { useAutoSave } from "../hooks/useAutoSave";
import { useConversationResume } from '../hooks/useConversationResume';
import { ConversationService } from '../services/ConversationService';
import { QuotaService, type AuthIncentiveType } from '../services/QuotaService';
import { useQuota } from "../hooks/useQuota";
import AuthIncentiveModal from "./modals/AuthIncentiveModal";
import QuotaIndicator from "./ui/QuotaIndicator";
import { useNavigate } from "react-router-dom";
import { conversationProtection } from '../services/ConversationProtection';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { useInfiniteLoopProtection } from '../services/InfiniteLoopProtection';
import { handleError, ErrorFactory, logError } from "../lib/error-handling";

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
}

const GeminiChatInterface: React.FC<GeminiChatInterfaceProps> = ({
  onPollCreated,
  onNewChat,
}): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedPollData, setSelectedPollData] =
    useState<PollSuggestion | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "error"
  >("unknown");

  // Auto-save and conversation resume hooks
  const navigate = useNavigate();
  const autoSave = useAutoSave({ 
    debug: true
  });
  const conversationResume = useConversationResume();
  const quota = useQuota();
  const loopProtection = useInfiniteLoopProtection('gemini-chat-interface');

  // Utiliser useRef pour persister les flags entre les re-rendus
  const hasShownOfflineMessage = useRef(false);
  const wasOffline = useRef(false);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Initialize new conversation
  const initializeNewConversation = useCallback(async () => {
    // Multi-layer protection against infinite loops
    if (!loopProtection.canExecute()) {
      // Initialization blocked by loop protection
      return;
    }

    if (!conversationProtection.canCreateConversation()) {
      // Conversation creation blocked by protection service
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
        
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: "Bonjour ! 👋 Je suis votre assistant DooDates. Je peux vous aider à organiser des événements et créer des sondages de dates. Comment puis-je vous aider aujourd'hui ?",
          isAI: true,
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);
        // Adding welcome message
        
        // Auto-save the welcome message
        await autoSave.addMessage({
          id: welcomeMessage.id,
          content: welcomeMessage.content,
          isAI: welcomeMessage.isAI,
          timestamp: welcomeMessage.timestamp,
        });

        conversationProtection.completeCreation(welcomeMessage.id);
        // Conversation initialized successfully
      } catch (error) {
        const processedError = handleError(error, {
          component: 'GeminiChatInterface',
          operation: 'initializeNewConversation'
        }, 'Erreur lors de l\'initialisation de la conversation');
        
        logError(processedError, {
          component: 'GeminiChatInterface',
          operation: 'initializeNewConversation'
        });
        
        conversationProtection.failCreation();
        performanceMonitor.trackError();
        
        // Show user-friendly error message
        if (error instanceof Error && error.message.includes('Quota dépassé')) {
          setMessages([{
            id: 'quota-error',
            content: '⚠️ Limite de conversations atteinte. Vous avez déjà créé le nombre maximum de conversations autorisées. Veuillez supprimer une conversation existante ou vous connecter pour augmenter votre limite.',
            isAI: true,
            timestamp: new Date()
          }]);
        } else if (error instanceof Error && error.message.includes('Conversation limit reached')) {
          setMessages([{
            id: 'limit-error',
            content: '⚠️ Limite de conversations atteinte. Vous avez déjà créé le nombre maximum de conversations autorisées. Veuillez supprimer une conversation existante ou vous connecter pour augmenter votre limite.',
            isAI: true,
            timestamp: new Date()
          }]);
        }
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    })();

    await initializationPromise;
  }, [autoSave, loopProtection]);

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

      try {
        const result = await ConversationService.resumeFromUrl(autoSave);
        
        if (!isMounted) return;
        
        if (result && result.conversation && result.messages) {
          // Resuming conversation from URL
          
          // Get messages from the conversation
          const messages = result.messages;
          
          if (messages && messages.length > 0) {
            // Convert conversation messages to chat interface format
            const chatMessages = ConversationService.convertMessagesToChat(messages);
    
            if (isMounted) {
              setMessages(chatMessages);
              // Conversation resumed successfully
            }
            
          } else {
            // No messages found in resumed conversation
            // No messages found, show resume indicator
            const resumeMessage = ConversationService.createResumeMessage(result.conversation.title);
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
        const processedError = handleError(error, {
          component: 'GeminiChatInterface',
          operation: 'resumeConversation'
        }, 'Erreur lors de la reprise de conversation');
        
        logError(processedError, {
          component: 'GeminiChatInterface',
          operation: 'resumeConversation'
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
  }, []); // Empty dependency array - only run once on mount

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
      
      const processedError = handleError(error, {
        component: 'GeminiChatInterface',
        operation: 'testConnection'
      }, 'Erreur de connexion à Gemini');
      
      logError(processedError, {
        component: 'GeminiChatInterface',
        operation: 'testConnection'
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Check conversation quota before proceeding
    if (!quota.checkConversationLimit()) {
      return; // Modal will be shown by the quota hook
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Auto-save user message
    await autoSave.addMessage({
      id: userMessage.id,
      content: userMessage.content,
      isAI: userMessage.isAI,
      timestamp: userMessage.timestamp,
    });

    try {
      // Sending request to Gemini
      // Essayer de générer un sondage
      const pollResponse = await geminiService.generatePollFromText(
        userMessage.content,
      );

      if (pollResponse.success && pollResponse.data) {
        // Gemini response received successfully

        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: `Voici votre sondage :`,
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
          pollSuggestion: aiResponse.pollSuggestion,
        });
      } else {
        // Poll generation failed
        // Si l'erreur est liée aux quotas, afficher un message spécifique
        if (
          pollResponse.error?.includes("quota") ||
          pollResponse.error?.includes("rate limit")
        ) {
          const quotaMessage: Message = {
            id: `quota-${Date.now()}`,
            content:
              "Je suis désolé, mais j'ai atteint ma limite de requêtes. Veuillez réessayer dans quelques instants.",
            isAI: true,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, quotaMessage]);
          
          // Auto-save quota message
          await autoSave.addMessage({
            id: quotaMessage.id,
            content: quotaMessage.content,
            isAI: quotaMessage.isAI,
            timestamp: quotaMessage.timestamp,
          });
        } else {
          // Autres erreurs
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            content:
              "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
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
      }
    } catch (error) {
      const processedError = handleError(error, {
        component: 'GeminiChatInterface',
        operation: 'generateResponse'
      }, 'Erreur lors de la génération de réponse');
      
      logError(processedError, {
        component: 'GeminiChatInterface',
        operation: 'generateResponse'
      });
      
      let errorContent = "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?";
      
      if (processedError.message?.includes('quota') || processedError.message?.includes('limit')) {
        errorContent = "Limite de quota atteinte. Veuillez réessayer plus tard ou vous connecter pour plus de requêtes.";
      } else if (processedError.message?.includes('network') || processedError.message?.includes('fetch')) {
        errorContent = "Problème de connexion réseau. Vérifiez votre connexion internet.";
      }
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: errorContent,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePollSuggestion = (suggestion: PollSuggestion) => {
    // Sending data to PollCreator
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
      const processedError = handleError(error, {
        component: 'GeminiChatInterface',
        operation: 'handleNewChat'
      }, 'Erreur lors de la création d\'un nouveau chat');
      
      logError(processedError, {
        component: 'GeminiChatInterface',
        operation: 'handleNewChat'
      });
    }
  };

  if (showPollCreator) {
    // Pass conversation ID via URL parameter to PollCreator
    // Use the real conversation ID (not temp-) if available
    const realConversationId = autoSave.getRealConversationId();
    const conversationId = realConversationId || autoSave.conversationId;
    const pollCreatorUrl = conversationId ? `?conversationId=${conversationId}` : '';
    
    // Setting up PollCreator with conversation ID
    
    // Update URL to include conversation ID
    if (conversationId && !window.location.search.includes('conversationId')) {
      const newUrl = `${window.location.pathname}${pollCreatorUrl}`;
      // Updating URL with conversation ID
      window.history.replaceState({}, '', newUrl);
    }
    
    return (
      <PollCreator
        initialData={selectedPollData || undefined}
        onBack={() => {
          setShowPollCreator(false);
          setSelectedPollData(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)]">
      {/* Barre d'état compacte */}
      <div className="bg-white border-b p-2 md:p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
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
                onClick={() => quota.showAuthIncentive('conversation_limit')}
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

      {/* Zone de conversation - Défilante */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto p-2 md:p-4 space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm max-w-md">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bonjour ! 👋
                </h3>
                <p className="text-gray-600 mb-4">
                  Je suis votre assistant IA pour créer des sondages DooDates. 
                  Décrivez-moi ce que vous souhaitez organiser !
                </p>
                <div className="text-sm text-gray-500">
                  <p className="mb-1">Exemples :</p>
                  <p>• "Créer un sondage pour un déjeuner mardi"</p>
                  <p>• "Organiser une réunion la semaine prochaine"</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isAI ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`
                  max-w-[90%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm
                  ${
                    message.isAI
                      ? "bg-white text-gray-800"
                      : "bg-blue-500 text-white"
                  }
                `}
              >
                {message.content}
                {message.pollSuggestion && (
                  <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                    <div className="border-t border-gray-100 pt-3 md:pt-4">
                      <div className="flex items-start gap-2 mb-3 md:mb-4">
                        <span className="text-lg md:text-xl flex-shrink-0">
                          📋
                        </span>
                        <h3 className="text-base md:text-lg font-medium text-gray-900 leading-tight">
                          {message.pollSuggestion.title}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2 md:space-y-3">
                          {message.pollSuggestion.dates.map((date, index) => {
                            // Trouver les créneaux horaires pour cette date
                            const dateTimeSlots =
                              message.pollSuggestion.timeSlots?.filter(
                                (slot) =>
                                  !slot.dates ||
                                  slot.dates.includes(date) ||
                                  slot.dates.length === 0,
                              ) || [];

                            return (
                              <div
                                key={date}
                                className="bg-gray-50 rounded-lg p-3 md:p-4"
                              >
                                <div className="flex items-start gap-2 md:gap-3">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 text-sm md:text-base leading-tight">
                                      {new Date(date).toLocaleDateString(
                                        "fr-FR",
                                        {
                                          weekday: "long",
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                        },
                                      )}
                                    </div>
                                    {dateTimeSlots.length > 0 && (
                                      <div className="mt-1.5 md:mt-2 flex items-start gap-1 text-xs md:text-sm text-gray-600">
                                        <span className="text-green-600 flex-shrink-0">
                                          ⏰
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          {dateTimeSlots.length <= 2 ? (
                                            <span className="block break-words">
                                              {dateTimeSlots
                                                .map(
                                                  (slot) =>
                                                    `${slot.start} - ${slot.end}`,
                                                )
                                                .join(", ")}
                                            </span>
                                          ) : (
                                            <div>
                                              <span className="block break-words">
                                                {dateTimeSlots
                                                  .slice(0, 2)
                                                  .map(
                                                    (slot) =>
                                                      `${slot.start} - ${slot.end}`,
                                                  )
                                                  .join(", ")}
                                                {dateTimeSlots.length > 2 &&
                                                  "..."}
                                              </span>
                                              <span className="text-blue-600 text-xs font-medium">
                                                +{dateTimeSlots.length - 2}{" "}
                                                créneaux
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleUsePollSuggestion(message.pollSuggestion!)
                      }
                      className="w-full mt-3 md:mt-4 inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm md:text-base"
                    >
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Créer ce sondage</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie - Fixe en bas */}
      <div className="bg-white border-t p-3 md:p-4 md:sticky md:bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Décrivez votre sondage..."
              className="flex-1 resize-none rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32 text-sm md:text-base"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={`
                rounded-xl p-2.5 md:p-3 transition-all flex-shrink-0
                ${
                  isLoading || !inputValue.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
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
          window.location.href = '/auth/signup';
        }}
        onSignIn={() => {
          // Navigate to sign in
          window.location.href = '/auth/signin';
        }}
        trigger={quota.authModalTrigger}
        currentUsage={{
          conversations: quota.status.conversations.used,
          maxConversations: quota.status.conversations.limit,
        }}
      />
    </div>
  );
};

export default GeminiChatInterface;
