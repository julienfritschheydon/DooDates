import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { groupConsecutiveDates } from "../../lib/date-utils";
import { AIProposalFeedback } from "../polls/AIProposalFeedback";
import { getPollBySlugOrId, getAllPolls } from "../../lib/pollStorage";
import type { PollSuggestion, FormPollSuggestion, DatePollSuggestion } from "../../lib/gemini";
import type { Poll } from "../../lib/pollStorage";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: PollSuggestion;
  isGenerating?: boolean;
  metadata?: Record<string, unknown>;
}

interface ChatMessageListProps {
  messages: Message[];
  darkTheme: boolean;
  hasLinkedPoll: boolean;
  linkedPollId: string | null;
  currentPoll: Poll | null;
  lastAIProposal: PollSuggestion | null;
  onUsePollSuggestion: (suggestion: PollSuggestion) => void;
  onOpenEditor: () => void;
  onSetCurrentPoll: (poll: Poll) => void;
  onFeedbackSent: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isLoading?: boolean;
  pollType?: "date" | "form" | "availability";
  quotaExceeded?: boolean;
  onOpenAuthModal?: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  darkTheme,
  hasLinkedPoll,
  linkedPollId,
  currentPoll,
  lastAIProposal,
  onUsePollSuggestion,
  onOpenEditor,
  onSetCurrentPoll,
  onFeedbackSent,
  messagesEndRef,
  isLoading = false,
  pollType = "date",
  quotaExceeded = false,
  onOpenAuthModal,
}) => {
  // Vérifier si l'utilisateur a déjà créé au moins un sondage ou formulaire
  const [hasCreatedPoll, setHasCreatedPoll] = useState(() => {
    const allPolls = getAllPolls();
    return allPolls.length > 0;
  });

  const [answeredConsents, setAnsweredConsents] = useState<Set<string>>(new Set());

  const handleConsent = (messageId: string, accepted: boolean, context: unknown) => {
    setAnsweredConsents((prev) => new Set(prev).add(messageId));

    if (accepted && context) {
      logger.info("✅ User accepted sending error for analysis", "general", context);
      // In a real implementation, we would send this to Sentry/LogRocket/Supabase
    } else {
      logger.info("❌ User declined sending error", "general");
    }
  };

  // Scroll automatique vers le bas quand un nouveau message de chargement apparaît
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isLoading, messagesEndRef]);

  useEffect(() => {
    // Vérifier au montage et quand les messages changent
    const checkPolls = () => {
      const allPolls = getAllPolls();
      setHasCreatedPoll(allPolls.length > 0);
    };

    checkPolls();

    // Écouter les changements dans le localStorage pour détecter les créations de polls
    // (se déclenche pour les changements dans d'autres fenêtres/onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "doodates_polls") {
        checkPolls();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Écouter les événements personnalisés pour les changements dans la même fenêtre
    const handlePollChange = () => {
      checkPolls();
    };

    window.addEventListener("pollCreated", handlePollChange);
    window.addEventListener("pollUpdated", handlePollChange);

    // Vérifier périodiquement (pour les changements dans la même fenêtre)
    // Intervalle de 2 secondes pour éviter une vérification trop fréquente
    const interval = setInterval(checkPolls, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pollCreated", handlePollChange);
      window.removeEventListener("pollUpdated", handlePollChange);
      clearInterval(interval);
    };
  }, [messages.length]);

  /* 
    NOTE: Centrage vertical du message de bienvenue
    - flex-1 min-h-0: Prend toute la hauteur disponible dans le conteneur flex parent
    - Quand messages.length === 0: flex items-center justify-center centre le contenu verticalement et horizontalement
    - overflow-y-auto seulement quand il y a des messages pour ne pas interférer avec le centrage
  */

  const getThemeColors = (type: string) => {
    switch (type) {
      case "form":
        return {
          bg: "bg-violet-100",
          text: "text-violet-600",
          darkBg: "bg-violet-900",
          darkText: "text-violet-300",
          icon: "text-violet-500",
          button: "bg-violet-600 hover:bg-violet-700",
        };
      case "availability":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          darkBg: "bg-emerald-900",
          darkText: "text-emerald-300",
          icon: "text-emerald-500",
          button: "bg-emerald-600 hover:bg-emerald-700",
        };
      default: // date
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          darkBg: "bg-blue-900",
          darkText: "text-blue-300",
          icon: "text-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const theme = getThemeColors(pollType);

  return (
    <div
      data-testid="chat-messages"
      className={`flex-1 min-h-0 w-full ${messages.length > 0 ? "overflow-y-auto" : ""} ${
        darkTheme ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-blue-50 to-indigo-50"
      } ${messages.length === 0 ? "flex items-center justify-center" : ""}`}
    >
      <div
        className={`w-full max-w-4xl mx-auto ${
          messages.length > 0 ? "p-2 md:p-4 space-y-3 md:space-y-4" : ""
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`max-w-md ${darkTheme ? "text-white" : "text-gray-900"}`}>
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${
                  darkTheme ? `${theme.darkBg} ${theme.darkText}` : `${theme.bg} ${theme.text}`
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
                {quotaExceeded ? (
                  <>
                    Vous avez atteint la limite de sondages gratuits.{" "}
                    {onOpenAuthModal ? (
                      <button
                        onClick={onOpenAuthModal}
                        className={`underline font-medium ${darkTheme ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                       data-testid="chatmessagelist-connectezvous">
                        Connectez-vous
                      </button>
                    ) : (
                      "Connectez-vous"
                    )}{" "}
                    pour continuer à utiliser l'assistant IA.
                  </>
                ) : pollType === "form" ? (
                  "Je suis votre assistant IA pour créer des formulaires et des questionnaires. Décrivez-moi ce que vous souhaitez !"
                ) : (
                  "Je suis votre assistant IA pour créer des sondages de dates et des questionnaires. Décrivez-moi ce que vous souhaitez !"
                )}
              </p>
              {!hasCreatedPoll && !quotaExceeded && (
                <div
                  className={`text-sm space-y-2 ${darkTheme ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div>
                    <p
                      className={`font-medium mb-1 ${darkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      📅 Sondages de dates :
                    </p>
                    <p>• "Réunion d'équipe la semaine prochaine"</p>
                    <p>• "Déjeuner mardi ou mercredi"</p>
                  </div>
                  <div>
                    <p
                      className={`font-medium mb-1 ${darkTheme ? "text-gray-300" : "text-gray-700"}`}
                    >
                      📝 Questionnaires :
                    </p>
                    <p>• "Questionnaire de satisfaction client"</p>
                    <p>• "Sondage d'opinion sur notre produit"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isAI ? "justify-start" : "justify-end"}`}
              >
                {/* Icône IA à gauche pour les messages IA */}
                {message.isAI && (
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    <svg
                      className={`w-6 h-6 ${theme.icon}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                )}
                <div
                  data-testid={message.isAI ? "ai-response" : "chat-message"}
                  className={`max-w-[80%] ${
                    message.isAI
                      ? darkTheme
                        ? "text-gray-100"
                        : "text-gray-900"
                      : "bg-[#3c4043] text-white rounded-[20px] px-5 py-3"
                  } whitespace-pre-wrap break-words`}
                >
                  {message.content}

                  {/* Analysis Consent Buttons */}
                  {message.metadata?.type === "analysis_consent" &&
                    !answeredConsents.has(message.id) && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleConsent(message.id, true, message.metadata?.context)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            darkTheme
                              ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                          }`}
                         data-testid="chatmessagelist-oui-envoyer">
                          Oui, envoyer
                        </button>
                        <button
                          onClick={() => handleConsent(message.id, false, null)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            darkTheme
                              ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                          }`}
                         data-testid="chatmessagelist-non-merci">
                          Non merci
                        </button>
                      </div>
                    )}
                  {message.metadata?.type === "analysis_consent" &&
                    answeredConsents.has(message.id) && (
                      <div className="mt-2 text-xs opacity-70 italic">Réponse enregistrée.</div>
                    )}

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
                        {(message.pollSuggestion as FormPollSuggestion).type === "form" ? (
                          /* Affichage Form Poll (questionnaire) - MÊME DESIGN QUE DATE POLL */
                          <div className="space-y-2 md:space-y-3">
                            {(message.pollSuggestion as FormPollSuggestion).questions?.map(
                              (question, idx: number) => (
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
                                              : question.type === "text" ||
                                                  question.type === "long-text"
                                                ? "Texte libre"
                                                : question.type === "date"
                                                  ? "Date"
                                                  : question.type === "matrix"
                                                    ? "Matrice"
                                                    : question.type === "rating"
                                                      ? "Échelle de notation"
                                                      : question.type === "nps"
                                                        ? "Net Promoter Score"
                                                        : "Question"}
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
                                message.pollSuggestion as import("../../lib/gemini").DatePollSuggestion;
                              const dates = datePollSuggestion.dates || [];

                              // 🔧 Utiliser dateGroups si fourni (pour les week-ends groupés)
                              // Sinon, afficher individuellement
                              const dateGroups =
                                datePollSuggestion.dateGroups ||
                                dates.map((date) => {
                                  const dateObj = new Date(date);
                                  const dayName = dateObj.toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                  });
                                  const day = dateObj.getDate();
                                  const month = dateObj.toLocaleDateString("fr-FR", {
                                    month: "long",
                                  });
                                  const year = dateObj.getFullYear();

                                  return {
                                    dates: [date],
                                    label: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day} ${month} ${year}`,
                                    type: "custom" as const,
                                  };
                                });

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
                                              new Date(group.dates[0]).toLocaleDateString("fr-FR", {
                                                weekday: "long",
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                              })}
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
                          data-testid={
                            (message.pollSuggestion as FormPollSuggestion).type === "form"
                              ? "view-form-button"
                              : "view-poll-button"
                          }
                          onClick={() => {
                            logger.debug("Bouton Voir cliqué", "poll", {
                              currentPoll,
                              linkedPollId,
                            });
                            // Ouvrir la dernière version du sondage lié
                            try {
                              if (currentPoll) {
                                logger.debug("Ouverture via currentPoll", "poll");
                                onOpenEditor();
                                return;
                              }
                              if (linkedPollId && linkedPollId !== "generated") {
                                logger.debug("Recherche poll par ID", "poll", { linkedPollId });
                                const p = getPollBySlugOrId(linkedPollId);
                                logger.debug("Poll trouvé", "poll", { poll: p });
                                if (p) {
                                  logger.debug("Ouverture via linkedPollId", "poll");
                                  onSetCurrentPoll(p);
                                  onOpenEditor();
                                  return;
                                }
                              }
                              // Aucun poll résolu: tenter d'afficher le créateur si suggestion présente
                              logger.warn("Aucun poll trouvé, fallback au créateur", "poll");
                              onUsePollSuggestion(message.pollSuggestion!);
                            } catch (e) {
                              logger.warn(
                                "Impossible d'ouvrir la preview, fallback au créateur",
                                "poll",
                                { error: e },
                              );
                              onUsePollSuggestion(message.pollSuggestion!);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg font-medium transition-colors bg-indigo-500 hover:bg-indigo-600"
                        >
                          <span>
                            {(message.pollSuggestion as FormPollSuggestion).type === "form"
                              ? "Voir le formulaire"
                              : "Voir le sondage"}
                          </span>
                        </button>
                      ) : (
                        <button
                          data-testid={
                            (message.pollSuggestion as FormPollSuggestion).type === "form"
                              ? "create-form-button"
                              : "create-poll-button"
                          }
                          onClick={() => {
                            logger.debug("Bouton Utiliser cliqué", "poll", {
                              pollSuggestion: message.pollSuggestion,
                            });
                            onUsePollSuggestion(message.pollSuggestion!);
                          }}
                          className={`w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg font-medium transition-colors ${
                            getThemeColors(
                              (message.pollSuggestion as FormPollSuggestion).type || "date",
                            ).button
                          }`}
                        >
                          <span>
                            {(message.pollSuggestion as FormPollSuggestion).type === "form"
                              ? "Créer ce formulaire"
                              : "Créer ce sondage"}
                          </span>
                        </button>
                      )}

                      {/* Feedback thumbs up/down pour les propositions de création */}
                      <div className="mt-2">
                        <AIProposalFeedback
                          proposal={{
                            userRequest:
                              messages.find((m) => !m.isAI && m.timestamp < message.timestamp)
                                ?.content || "Demande de création",
                            generatedContent: message.pollSuggestion,
                            pollContext: {
                              pollType:
                                (message.pollSuggestion as FormPollSuggestion).type || "date",
                              action: "create",
                            } as { pollType?: string; action?: string },
                          }}
                          onFeedbackSent={() => {
                            // Feedback envoyé
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Message de chargement pendant la génération */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg className={`w-6 h-6 ${theme.icon}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div
                  className={`max-w-[80%] ${
                    darkTheme ? "bg-[#1a1a1a] text-gray-200" : "bg-gray-100 text-gray-700"
                  } rounded-[20px] px-5 py-3 flex items-center gap-3`}
                >
                  <Loader2 className={`w-4 h-4 animate-spin ${theme.icon}`} />
                  <span className="text-sm">Génération en cours...</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Composant de feedback IA global (dernière proposition connue) */}
        {lastAIProposal && (
          <div className="mt-2">
            <AIProposalFeedback
              proposal={{
                userRequest: messages.find((m) => !m.isAI)?.content || "Demande de création",
                generatedContent: lastAIProposal,
                pollContext: {
                  pollType: (lastAIProposal as FormPollSuggestion | DatePollSuggestion).type,
                  action: "create",
                },
              }}
              onFeedbackSent={() => {
                // Optionnel : cacher après feedback
                onFeedbackSent();
              }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
