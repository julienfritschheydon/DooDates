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
import { useAuth } from "../contexts/AuthContext";

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
  /** Callback pour démarrer un nouveau chat (changement de type de sondage) */
  onStartNewChat?: () => Promise<void>;
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
  const { user } = useAuth();
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
    onStartNewChat,
  } = options;

  // Stocker les callbacks dans des refs pour éviter les re-créations
  const onUserMessageRef = useRef(onUserMessage);
  const onStartNewChatRef = useRef(onStartNewChat);

  useEffect(() => {
    onUserMessageRef.current = onUserMessage;
    onStartNewChatRef.current = onStartNewChat;
  }, [onUserMessage, onStartNewChat]);

  const sendMessage = useCallback(
    async (text: string, notifyParent: boolean) => {
      const requestId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      console.log(`[${timestamp}] [${requestId}] 🔴 useMessageSender.sendMessage DÉBUT`, {
        textLength: text?.length || 0,
        notifyParent,
        isLoading,
      });

      const trimmedText = (text || "").trim();
      if (!trimmedText || isLoading) {
        console.log(`[${timestamp}] [${requestId}] ❌ Arrêt: texte vide ou déjà en chargement`, {
          hasText: !!trimmedText,
          isLoading,
        });
        return;
      }

      if (notifyParent) onUserMessageRef.current?.();

      // Check conversation quota before proceeding
      const conversationLimitOk = quota.checkConversationLimit();
      console.log(`[${timestamp}] [${requestId}] 📊 Vérification quota conversation:`, {
        checkConversationLimit: conversationLimitOk,
      });
      if (!conversationLimitOk) {
        console.log(`[${timestamp}] [${requestId}] ❌ Arrêt: quota conversation dépassé`);
        return; // Modal will be shown by the quota hook
      }

      // ⚠️ SUPPRIMÉ: Vérification AI quota en cache (non fiable)
      // La vérification bloquante se fait dans consumeAiMessageCredits() avec Supabase en temps réel

      // 🎯 PROTOTYPE: Détecter les intentions de modification
      console.log(`[${timestamp}] [${requestId}] 🔍 Détection d'intentions...`);
      const intentResult = await intentDetection.detectIntent(trimmedText);
      console.log(`[${timestamp}] [${requestId}] 🔍 Résultat détection intent:`, {
        handled: intentResult.handled,
        isTypeSwitch: intentResult.isTypeSwitch,
      });

      if (intentResult.handled) {
        console.log(`[${timestamp}] [${requestId}] ⚠️ Intent détecté - pas d'appel Gemini`);
        // Cas spécial : changement de type de sondage détecté
        if (intentResult.isTypeSwitch && onStartNewChatRef.current) {
          logger.info("🔄 Démarrage d'un nouveau chat pour changement de type", "poll");

          // Ajouter un message informatif
          const switchMessage: Message = {
            id: `ai-${Date.now()}`,
            content: `✨ Vous souhaitez créer un ${
              intentResult.requestedType === "form" ? "questionnaire" : "sondage de disponibilité"
            }. Je démarre une nouvelle conversation pour vous...`,
            isAI: true,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, switchMessage]);

          // Petit délai pour que l'utilisateur voie le message
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Démarrer un nouveau chat
          await onStartNewChatRef.current();

          // Re-traiter le message original dans le nouveau contexte
          // On attend un peu que le nouveau chat soit initialisé
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Rappeler sendMessage avec le message original
          // Mais cette fois sans le poll actuel, donc il sera traité comme une nouvelle création
          return sendMessage(intentResult.originalMessage || trimmedText, false);
        }

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

      console.log(`[${timestamp}] [${requestId}] ✅ Intent non géré - continuation vers Gemini`);

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

      console.log(`[${timestamp}] [${requestId}] 📝 Création message utilisateur`, {
        isLongMarkdown,
        displayContentLength: displayContent.length,
      });

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

      // Save user message to Supabase
      console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde message utilisateur...`);
      await autoSave.addMessage({
        id: userMessage.id,
        content: isLongMarkdown ? trimmedInput : userMessage.content,
        isAI: userMessage.isAI,
        timestamp: userMessage.timestamp,
      });
      console.log(`[${timestamp}] [${requestId}] ✅ Message utilisateur sauvegardé`);

      // VÉRIFIER ET CONSOMMER QUOTA AVANT d'appeler Gemini
      console.log(`[${timestamp}] [${requestId}] 🔒 Vérification quota message IA AVANT appel Gemini...`);
      try {
        const { consumeAiMessageCredits } = await import("../lib/quotaTracking");
        const conversationId = autoSave.getRealConversationId() || autoSave.conversationId;
        // Pour les guests, passer null pour utiliser le système Supabase
        const userId = user?.id || null;
        await consumeAiMessageCredits(userId, conversationId);
        console.log(`[${timestamp}] [${requestId}] ✅ Quota message IA vérifié et consommé`);
      } catch (error: any) {
        console.log(`[${timestamp}] [${requestId}] ❌ Limite de messages IA atteinte`);
        setIsLoading(false);
        
        // Afficher un toast d'erreur
        toast({
          title: "Limite atteinte",
          description: "Vous avez atteint la limite de messages IA pour les utilisateurs invités. Connectez-vous pour continuer.",
          variant: "destructive",
        });
        
        // Ajouter un message d'erreur dans le chat
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: "⚠️ Limite de messages IA atteinte. Veuillez vous connecter pour continuer à utiliser l'assistant IA.",
          isAI: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        
        return; // Arrêter l'exécution
      }

      // Appel API Gemini via le hook
      console.log(
        `[${timestamp}] [${requestId}] 🟣 useMessageSender: Appel geminiAPI.generatePoll`,
        {
          messageLength: trimmedInput.length,
          messagePreview: trimmedInput.substring(0, 50),
        },
      );
      const pollResponse = await geminiAPI.generatePoll(trimmedInput);
      console.log(`[${new Date().toISOString()}] 🟣 useMessageSender: Réponse reçue`, {
        success: pollResponse.success,
        hasData: !!pollResponse.data,
        error: pollResponse.error,
      });

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
