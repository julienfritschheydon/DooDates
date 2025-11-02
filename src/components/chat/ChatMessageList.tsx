import React from "react";
import { Sparkles } from "lucide-react";
import { groupConsecutiveDates } from "../../lib/date-utils";
import { AIProposalFeedback } from "../polls/AIProposalFeedback";
import { getPollBySlugOrId } from "../../lib/pollStorage";
import type { PollSuggestion } from "../../lib/gemini";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: PollSuggestion;
  isGenerating?: boolean;
}

interface ChatMessageListProps {
  messages: Message[];
  darkTheme: boolean;
  hasLinkedPoll: boolean;
  linkedPollId: string | null;
  currentPoll: any;
  lastAIProposal: {
    userRequest: string;
    generatedContent: any;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
      action?: string;
    };
  } | null;
  onUsePollSuggestion: (suggestion: PollSuggestion) => void;
  onOpenEditor: () => void;
  onSetCurrentPoll: (poll: any) => void;
  onFeedbackSent: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
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
}) => {
  return (
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
                Je suis votre assistant IA pour créer des sondages de dates et des questionnaires.
                Décrivez-moi ce que vous souhaitez !
              </p>
              <div className={`text-sm space-y-2 ${darkTheme ? "text-gray-400" : "text-gray-500"}`}>
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
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
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
                              message.pollSuggestion as import("../../lib/gemini").DatePollSuggestion;
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
                        onClick={() => {
                          logger.debug(
                            "Bouton Voir cliqué",
                            "poll",
                            { currentPoll, linkedPollId }
                          );
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
                                onSetCurrentPoll(p as any);
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
                              { error: e }
                            );
                            onUsePollSuggestion(message.pollSuggestion!);
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
                          logger.debug("Bouton Utiliser cliqué", "poll", { pollSuggestion: message.pollSuggestion });
                          onUsePollSuggestion(message.pollSuggestion!);
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

                    {/* Feedback thumbs up/down pour les propositions de création */}
                    <div className="mt-2">
                      <AIProposalFeedback
                        proposal={{
                          userRequest: messages.find(m => !m.isAI && m.timestamp < message.timestamp)?.content || "Demande de création",
                          generatedContent: message.pollSuggestion,
                          pollContext: {
                            pollType: (message.pollSuggestion as any).type || "date",
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
          ))
        )}

        {/* Composant de feedback IA */}
        {lastAIProposal && (
          <div className="mt-2">
            <AIProposalFeedback
              proposal={lastAIProposal}
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
