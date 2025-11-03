/**
 * Hook de détection et traitement des intentions de modification de polls via langage naturel.
 *
 * Détecte automatiquement les intentions de l'utilisateur pour modifier un poll existant
 * (Date Poll ou Form Poll) sans passer par l'interface graphique.
 *
 * @example
 * ```tsx
 * const intentDetection = useIntentDetection({
 *   currentPoll: poll,
 *   onDispatchAction: dispatchPollAction,
 * });
 *
 * const result = await intentDetection.detectIntent("Ajoute une question sur l'âge");
 * if (result.handled) {
 *   // L'intention a été traitée, pas besoin d'appeler Gemini
 * }
 * ```
 *
 * @module hooks/useIntentDetection
 */

import { useCallback, useRef, useEffect } from "react";
import { IntentDetectionService } from "../services/IntentDetectionService";
import { FormPollIntentService } from "../services/FormPollIntentService";
import { GeminiIntentService } from "../services/GeminiIntentService";
import { PollTypeSwitchDetector } from "../services/PollTypeSwitchDetector";
import { logger } from "../lib/logger";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

interface IntentResult {
  handled: boolean;
  userMessage?: Message;
  confirmMessage?: Message;
  aiProposal?: {
    userRequest: string;
    generatedContent: any;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
      action?: string;
    };
  };
  action?: {
    type: string;
    payload: any;
  };
  modifiedQuestionId?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  /** Indique qu'un changement de type de sondage a été détecté */
  isTypeSwitch?: boolean;
  /** Le message original pour créer un nouveau sondage */
  originalMessage?: string;
  /** Type de sondage demandé */
  requestedType?: "date" | "form";
}

/**
 * Options pour le hook useIntentDetection
 */
interface UseIntentDetectionOptions {
  /** Poll actuellement édité (Date ou Form) */
  currentPoll: any;
  /** Callback pour dispatcher les actions de modification du poll */
  onDispatchAction: (action: { type: string; payload: any }) => void;
}

/**
 * Hook de détection d'intentions pour modifications de polls.
 *
 * Supporte :
 * - Date Polls : Ajout/suppression de dates
 * - Form Polls : Ajout/suppression/modification de questions
 *
 * @param options - Configuration du hook
 * @returns Objet avec la fonction detectIntent
 */
export function useIntentDetection(options: UseIntentDetectionOptions) {
  const { currentPoll, onDispatchAction } = options;

  // Stocker le callback dans une ref pour éviter les re-créations
  const onDispatchActionRef = useRef(onDispatchAction);

  useEffect(() => {
    onDispatchActionRef.current = onDispatchAction;
  }, [onDispatchAction]);

  const detectIntent = useCallback(
    async (trimmedText: string): Promise<IntentResult> => {
      if (!currentPoll) {
        return { handled: false };
      }

      // Essayer d'abord la détection Date Poll (avec support multi-intentions)
      const multiIntent = IntentDetectionService.detectMultipleIntents(trimmedText, currentPoll);

      if (multiIntent && multiIntent.isModification && multiIntent.confidence > 0.7) {
        // Ajouter le message utilisateur
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content: trimmedText,
          isAI: false,
          timestamp: new Date(),
        };

        const previousDates = currentPoll.dates || [];
        const confirmations: string[] = [];
        const dateActionIcons: Record<string, string> = {
          ADD_DATE: "📅",
          REMOVE_DATE: "🗑️",
          UPDATE_TITLE: "✏️",
          ADD_TIMESLOT: "🕐",
          REPLACE_POLL: "🔄",
        };

        // Dispatcher toutes les actions détectées
        for (const intent of multiIntent.intents) {
          const isAlreadyInPoll = previousDates.includes(intent.payload);
          const isNotInPoll = !previousDates.includes(intent.payload);

          // Dispatcher l'action
          onDispatchActionRef.current({
            type: intent.action as any,
            payload: intent.payload,
          });

          // Générer le feedback pour cette action
          const icon = dateActionIcons[intent.action] || "✅";
          let feedback = `${icon} ${intent.explanation}`;

          if (intent.action === "ADD_DATE" && isAlreadyInPoll) {
            feedback = `ℹ️ La date ${String(intent.payload).split("-").reverse().join("/")} est déjà dans le sondage`;
          }

          if (intent.action === "REMOVE_DATE" && isNotInPoll) {
            feedback = `ℹ️ La date ${String(intent.payload).split("-").reverse().join("/")} n'est pas dans le sondage`;
          }

          confirmations.push(feedback);
        }

        // Message de confirmation combiné
        const confirmMessage: Message = {
          id: `ai-${Date.now()}`,
          content: confirmations.join("\n"),
          isAI: true,
          timestamp: new Date(),
        };

        return {
          handled: true,
          userMessage,
          confirmMessage,
          aiProposal: {
            userRequest: trimmedText,
            generatedContent: {
              actions: multiIntent.intents.map((i) => ({
                action: i.action,
                payload: i.payload,
                explanation: i.explanation,
              })),
            },
            pollContext: {
              pollId: currentPoll.id,
              pollTitle: currentPoll.title,
              pollType: "date",
              action: "modify",
            },
          },
        };
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
          // Ni regex ni IA n'ont réussi - vérifier si c'est un changement de type
          const typeSwitchResult = PollTypeSwitchDetector.detectTypeSwitch(
            trimmedText,
            currentPoll,
          );

          if (typeSwitchResult.isTypeSwitch && typeSwitchResult.confidence > 0.6) {
            // L'utilisateur essaie de changer de type de sondage
            logger.info("🔄 Changement de type de sondage détecté", "poll", {
              currentType: typeSwitchResult.currentType,
              requestedType: typeSwitchResult.requestedType,
              confidence: typeSwitchResult.confidence,
            });

            // Retourner un résultat spécial pour déclencher un nouveau chat
            return {
              handled: true,
              isTypeSwitch: true,
              originalMessage: trimmedText,
              requestedType: typeSwitchResult.requestedType,
            };
          }

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

          return {
            handled: true,
            confirmMessage: errorMessage,
          };
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

        // Dispatcher l'action
        // FormPollIntentService retourne déjà des index 0-based, pas besoin de conversion
        let payload = formIntent.payload;

        // Convertir title → subject pour ADD_QUESTION (compatibilité reducer)
        if (formIntent.action === "ADD_QUESTION" && (payload as any).title) {
          payload = {
            subject: (payload as any).title, // Le reducer attend "subject"
          };
        }

        logger.info("🔄 Dispatch action", "poll", {
          action: formIntent.action,
          payload: payload,
        });

        onDispatchActionRef.current({
          type: formIntent.action as any,
          payload: payload,
        });

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

        return {
          handled: true,
          userMessage,
          confirmMessage,
          aiProposal: {
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
          },
          modifiedQuestionId: formIntent.modifiedQuestionId,
          modifiedField: formIntent.modifiedField,
        };
      }

      return { handled: false };
    },
    [currentPoll],
  ); // onDispatchAction est dans une ref

  return { detectIntent };
}
