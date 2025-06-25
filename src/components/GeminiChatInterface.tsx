import React, { useState, useRef, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { geminiService, type PollSuggestion } from "../lib/gemini";
import PollCreator from "./PollCreator";
import { debounce } from "lodash";

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
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [selectedPollData, setSelectedPollData] =
    useState<PollSuggestion | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "error"
  >("unknown");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Test de connexion initial
    testGeminiConnection();

    // Message de bienvenue
    const welcomeMessage: Message = {
      id: "welcome",
      content: `Bonjour ! Que puis-je créer pour vous ?`,
      isAI: true,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const testGeminiConnection = async () => {
    try {
      const isConnected = await geminiService.testConnection();
      setConnectionStatus(isConnected ? "connected" : "error");

      if (!isConnected) {
        // Ajouter un message d'erreur si la connexion échoue
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            content:
              "Je suis actuellement indisponible. Je vais réessayer de me connecter dans quelques instants...",
            isAI: true,
            timestamp: new Date(),
          },
        ]);

        // Réessayer dans 5 secondes
        setTimeout(testGeminiConnection, 5000);
      }
    } catch (error) {
      setConnectionStatus("error");
      console.error("Erreur de connexion à Gemini:", error);

      // Réessayer dans 5 secondes
      setTimeout(testGeminiConnection, 5000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      console.log("🎯 Envoi de la demande à Gemini:", userMessage.content);
      // Essayer de générer un sondage
      const pollResponse = await geminiService.generatePollFromText(
        userMessage.content,
      );

      if (pollResponse.success && pollResponse.data) {
        console.log("✨ Réponse de Gemini reçue:", pollResponse.data);
        console.log("📅 Dates reçues:", pollResponse.data.dates);
        console.log("⏰ Créneaux reçus:", pollResponse.data.timeSlots);

        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: `Voici votre sondage :`,
          isAI: true,
          timestamp: new Date(),
          pollSuggestion: pollResponse.data,
        };

        setMessages((prev) => [...prev, aiResponse]);
      } else {
        console.log(
          "❌ Échec de la génération du sondage:",
          pollResponse.error,
        );
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
          setConnectionStatus("error");
          return;
        }

        // Fallback vers chat simple si la génération de sondage échoue
        console.log("🔄 Tentative de fallback vers le chat simple");
        const chatResponse = await geminiService.chatAboutPoll(
          userMessage.content,
        );
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: chatResponse,
          isAI: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error("🚨 Erreur lors du traitement:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content:
          error instanceof Error && error.message.includes("quota")
            ? "J'ai atteint ma limite de requêtes. Veuillez réessayer dans quelques instants."
            : "Désolé, j'ai rencontré un problème. Pouvez-vous reformuler votre demande ?",
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      if (error instanceof Error && error.message.includes("quota")) {
        setConnectionStatus("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePollSuggestion = (suggestion: PollSuggestion) => {
    console.log("🎯 Envoi des données vers PollCreator:", suggestion);
    console.log("📅 Dates à traiter:", suggestion.dates);
    console.log("⏰ Créneaux à configurer:", suggestion.timeSlots);
    setSelectedPollData(suggestion);
    setShowPollCreator(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    // Réinitialiser les messages avec le message de bienvenue
    const welcomeMessage: Message = {
      id: "welcome",
      content: `Bonjour ! Que puis-je créer pour vous ?`,
      isAI: true,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
    setInputValue("");
    setIsLoading(false);
    setShowPollCreator(false);
    setSelectedPollData(null);

    // Appeler le callback si fourni
    if (onNewChat) {
      onNewChat();
    }
  };

  if (showPollCreator) {
    return (
      <PollCreator
        onBack={() => {
          setShowPollCreator(false);
          setSelectedPollData(null);
        }}
        initialData={selectedPollData}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Zone de conversation - Défilante */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto p-2 md:p-4 space-y-3 md:space-y-4">
          {messages.map((message) => (
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
                      <span>Éditer ce sondage</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie - Fixe en bas */}
      <div className="bg-white border-t p-3 md:p-4 sticky bottom-0">
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
    </div>
  );
};

export default GeminiChatInterface;
