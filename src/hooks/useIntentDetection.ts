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
    generatedContent: import("../lib/gemini").PollSuggestion;
    pollContext?: {
      pollId?: string;
      pollTitle?: string;
      pollType?: string;
      action?: string;
    };
  };
  action?: {
    type: string;
    payload: Record<string, unknown>;
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
  currentPoll: import("../lib/pollStorage").Poll | null;
  /** Callback pour dispatcher les actions de modification du poll */
  onDispatchAction: (action: { type: string; payload: Record<string, unknown> }) => void;
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

      // 🎯 PRIORITÉ 1 : Vérifier d'abord le changement de type de sondage
      // Cela permet de détecter quand l'utilisateur change d'avis en cours de chat
      const typeSwitchResult = PollTypeSwitchDetector.detectTypeSwitch(trimmedText, currentPoll as import("../types/poll").Poll);

      // Si confiance élevée (> 0.6), on fait confiance au résultat
      if (typeSwitchResult.isTypeSwitch && typeSwitchResult.confidence > 0.6) {
        logger.info("🔄 Changement de type de sondage détecté (priorité)", "poll", {
          currentType: typeSwitchResult.currentType,
          requestedType: typeSwitchResult.requestedType,
          confidence: typeSwitchResult.confidence,
          message: trimmedText.slice(0, 50),
        });

        return {
          handled: true,
          isTypeSwitch: true,
          originalMessage: trimmedText,
          requestedType: typeSwitchResult.requestedType,
        };
      }

      // Si confiance faible mais > 0 (zone de doute), demander à l'IA
      if (
        typeSwitchResult.isTypeSwitch &&
        typeSwitchResult.confidence > 0.3 &&
        typeSwitchResult.confidence <= 0.6
      ) {
        logger.info("🤔 Confiance faible, demande à l'IA pour confirmation", "poll", {
          confidence: typeSwitchResult.confidence,
          message: trimmedText.slice(0, 50),
        });

        const aiResult = await PollTypeSwitchDetector.detectTypeSwitchWithAI(
          trimmedText,
          currentPoll as import("../types/poll").Poll,
        );

        if (aiResult && aiResult.isTypeSwitch && aiResult.confidence > 0.7) {
          logger.info("✅ IA confirme le changement de type", "poll", {
            currentType: aiResult.currentType,
            requestedType: aiResult.requestedType,
            confidence: aiResult.confidence,
          });

          return {
            handled: true,
            isTypeSwitch: true,
            originalMessage: trimmedText,
            requestedType: aiResult.requestedType,
          };
        }
      }

      // Si aucune détection initiale mais on a un poll, vérifier avec l'IA en dernier recours
      // (cas où aucun pattern n'a matché mais l'utilisateur change peut-être d'avis)
      if (!typeSwitchResult.isTypeSwitch) {
        const aiResult = await PollTypeSwitchDetector.detectTypeSwitchWithAI(
          trimmedText,
          currentPoll as import("../types/poll").Poll,
        );

        if (aiResult && aiResult.isTypeSwitch && aiResult.confidence > 0.7) {
          logger.info("✅ IA détecte un changement de type non détecté par les patterns", "poll", {
            currentType: aiResult.currentType,
            requestedType: aiResult.requestedType,
            confidence: aiResult.confidence,
          });

          return {
            handled: true,
            isTypeSwitch: true,
            originalMessage: trimmedText,
            requestedType: aiResult.requestedType,
          };
        }
      }

      // Essayer d'abord la détection Date Poll (avec support multi-intentions)
      const multiIntent = await IntentDetectionService.detectMultipleIntents(
        trimmedText,
        currentPoll,
      );

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
          const isAlreadyInPoll = previousDates.includes(intent.payload as string);
          const isNotInPoll = !previousDates.includes(intent.payload as string);

          // 🔧 FIX BUG #3: Vérifier les doublons AVANT de dispatcher
          const icon = dateActionIcons[intent.action] || "✅";
          let feedback = `${icon} ${intent.explanation}`;
          let shouldDispatch = true;

          if (intent.action === "ADD_DATE" && isAlreadyInPoll) {
            feedback = `ℹ️ La date ${String(intent.payload).split("-").reverse().join("/")} est déjà dans le sondage`;
            shouldDispatch = false; // Ne pas ajouter un doublon
          }

          if (intent.action === "REMOVE_DATE" && isNotInPoll) {
            feedback = `ℹ️ La date ${String(intent.payload).split("-").reverse().join("/")} n'est pas dans le sondage`;
            shouldDispatch = false; // Ne pas supprimer une date absente
          }

          // Dispatcher l'action seulement si nécessaire
          if (shouldDispatch) {
            onDispatchActionRef.current({
              type: intent.action as string,
              payload: intent.payload as Record<string, unknown>,
            });
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
            } as unknown as import("../lib/gemini").PollSuggestion,
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
          formIntent =
            aiIntent as import("../services/FormPollIntentService").FormModificationIntent; // Convertir au format FormModificationIntent
        } else {
          // Ni regex ni IA n'ont réussi à détecter une intention de MODIFICATION
          // → C'est probablement une demande de CRÉATION de nouveau sondage
          // → Retourner handled: false pour laisser Gemini générer le sondage
          logger.info("ℹ️ Pas de modification détectée, passage à Gemini pour génération", "poll", {
            message: trimmedText.substring(0, 50),
            aiConfidence: aiIntent?.confidence || 0,
          });

          return { handled: false };
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
        if (
          formIntent.action === "ADD_QUESTION" &&
          typeof payload === "object" &&
          payload !== null &&
          "title" in payload
        ) {
          payload = {
            subject: String(payload.title), // Le reducer attend "subject"
          };
        }

        logger.info("🔄 Dispatch action", "poll", {
          action: formIntent.action,
          payload: payload,
        });

        onDispatchActionRef.current({
          type: formIntent.action as
            | "ADD_QUESTION"
            | "REMOVE_QUESTION"
            | "CHANGE_QUESTION_TYPE"
            | "ADD_OPTION"
            | "REMOVE_OPTION"
            | "SET_REQUIRED"
            | "RENAME_QUESTION"
            | "REPLACE_POLL",
          payload: payload as Record<string, unknown>,
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
            } as unknown as import("../lib/gemini").PollSuggestion,
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
