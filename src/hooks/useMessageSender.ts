/**
 * Hook de gestion de l'envoi de messages et des appels à l'API Gemini.
 *
 * Centralise toute la logique d'envoi de messages :
 * - Vérification des quotas
 * - Détection d'intentions
 * - Appel API Gemini
 * - Auto-save des messages
 * - Gestion des erreurs
 *
 * @example
 * ```tsx
 * const messageSender = useMessageSender({
 *   isLoading,
 *   quota,
 *   aiQuota,
 *   toast,
 *   intentDetection,
 *   geminiAPI,
 *   autoSave,
 *   onUserMessage,
 *   setMessages,
 *   setIsLoading,
 *   setLastAIProposal,
 *   setModifiedQuestion,
 * });
 *
 * // Envoyer un message
 * await messageSender.sendMessage("Crée un sondage", true);
 * ```
 *
 * @module hooks/useMessageSender
 */

import { useCallback, useRef, useEffect } from "react";
import { logger } from "../lib/logger";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any;
  isGenerating?: boolean;
}

/**
 * Options pour le hook useMessageSender
 */
interface UseMessageSenderOptions {
  /** Indique si un envoi est en cours */
  isLoading: boolean;
  /** Hook de gestion des quotas conversation */
  quota: any;
  /** Hook de gestion des quotas AI messages */
  aiQuota: any;
  /** Fonction toast pour afficher les notifications */
  toast: any;
  /** Hook de détection d'intentions */
  intentDetection: any;
  /** Hook API Gemini */
  geminiAPI: any;
  /** Hook auto-save des messages */
  autoSave: any;
  /** Callback appelé quand l'utilisateur envoie un message */
  onUserMessage?: () => void;
  /** Fonction pour mettre à jour la liste des messages */
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  /** Fonction pour mettre à jour l'état de chargement */
  setIsLoading: (loading: boolean) => void;
  /** Fonction pour stocker la dernière proposition IA */
  setLastAIProposal: (proposal: any) => void;
  /** Fonction pour marquer une question comme modifiée */
  setModifiedQuestion: (
    questionId: string,
    field: "title" | "type" | "options" | "required",
  ) => void;
}

/**
 * Hook de gestion de l'envoi de messages avec appel Gemini.
 *
 * Gère le cycle complet :
 * 1. Vérification quotas
 * 2. Détection intentions (modifications directes)
 * 3. Appel API Gemini si nécessaire
 * 4. Auto-save des messages
 * 5. Gestion erreurs et feedback
 *
 * @param options - Configuration du hook
 * @returns Objet avec la fonction sendMessage
 */
export function useMessageSender(options: UseMessageSenderOptions) {
  const {
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
  } = options;
  
  // Stocker le callback dans une ref pour éviter les re-créations
  const onUserMessageRef = useRef(onUserMessage);
  
  useEffect(() => {
    onUserMessageRef.current = onUserMessage;
  }, [onUserMessage]);

  const sendMessage = useCallback(
    async (text: string, notifyParent: boolean) => {
      const trimmedText = (text || "").trim();
      if (!trimmedText || isLoading) return;

      if (notifyParent) onUserMessageRef.current?.();

      // Check conversation quota before proceeding
      if (!quota.checkConversationLimit()) {
        return; // Modal will be shown by the quota hook
      }

      // 🎯 NEW: Check AI message quota (Freemium)
      const { checkAiMessageQuota, handleQuotaError } = await import("../services/AiQuotaService");
      const quotaCheck = checkAiMessageQuota(aiQuota);
      if (!quotaCheck.canProceed) {
        handleQuotaError(quotaCheck, quota, toast);
        return;
      }

      // 🎯 PROTOTYPE: Détecter les intentions de modification
      const intentResult = await intentDetection.detectIntent(trimmedText);

      if (intentResult.handled) {
        // Ajouter le message utilisateur si présent
        if (intentResult.userMessage) {
          setMessages((prev) => [...prev, intentResult.userMessage!]);
        }

        // Stocker la proposition IA pour le feedback si présente
        if (intentResult.aiProposal) {
          setLastAIProposal(intentResult.aiProposal);
        }

        // Déclencher le feedback visuel si une question a été modifiée
        if (intentResult.modifiedQuestionId && intentResult.modifiedField) {
          setModifiedQuestion(intentResult.modifiedQuestionId, intentResult.modifiedField);
        }

        // Ajouter le message de confirmation
        if (intentResult.confirmMessage) {
          setMessages((prev) => [...prev, intentResult.confirmMessage!]);
        }

        return; // Ne pas appeler Gemini
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
      isLoading,
      quota,
      aiQuota,
      toast,
      intentDetection,
      geminiAPI,
      autoSave,
      setMessages,
      setIsLoading,
      setLastAIProposal,
      setModifiedQuestion,
    ],
  ); // onUserMessage est dans une ref

  return {
    sendMessage,
  };
}
