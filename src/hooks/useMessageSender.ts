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
import { logError, ErrorFactory } from "../lib/error-handling";
import type { UseQuotaReturn } from "./useQuota";
import type { AiMessageQuota } from "./useAiMessageQuota";
import type { UseGeminiAPIReturn } from "./useGeminiAPI";
import type { UseAutoSaveReturn } from "./useAutoSave";
import { SurveyRequestAggregator } from "../services/SurveyRequestAggregator";
import { fileToGeminiAttachment, type GeminiAttachedFile } from "@/services/FileAttachmentService";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: import("../lib/gemini").PollSuggestion;
  isGenerating?: boolean;
  metadata?: Record<string, unknown>;
}

// Limites et formats supportés pour les fichiers joints envoyés à Gemini
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_ATTACHMENT_MIME_PREFIXES = ["application/pdf", "text/plain", "image/"];
const ALLOWED_ATTACHMENT_MIME_EXACT = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
];

import { isDatePollSuggestion, isFormPollSuggestion } from "../types/poll-suggestions";

/**
 * Options pour le hook useMessageSender
 */
interface UseMessageSenderOptions {
  /** Indique si un envoi est en cours */
  isLoading: boolean;
  /** Hook de gestion des quotas conversation */
  quota: UseQuotaReturn;
  /** Hook de gestion des quotas AI messages */
  aiQuota: AiMessageQuota;
  /** Fonction toast pour afficher les notifications */
  toast: {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => void;
  };
  /** Hook de détection d'intentions */
  intentDetection: {
    detectIntent: (text: string) => Promise<{
      handled: boolean;
      userMessage?: Message;
      confirmMessage?: Message;
      aiProposal?: {
        userRequest: string;
        generatedContent: import("../lib/gemini").PollSuggestion;
        pollContext?: { pollId?: string; pollTitle?: string; pollType?: string; action?: string };
      };
      action?: { type: string; payload: Record<string, unknown> };
      modifiedQuestionId?: string;
      modifiedField?: "title" | "type" | "options" | "required";
      isTypeSwitch?: boolean;
      originalMessage?: string;
      requestedType?: "date" | "form";
    }>;
  };
  /** Indique si un poll existe actuellement */
  hasCurrentPoll: boolean;
  /** Hook API Gemini */
  geminiAPI: UseGeminiAPIReturn;
  /** Hook auto-save des messages */
  autoSave: UseAutoSaveReturn;
  /** Callback appelé quand l'utilisateur envoie un message */
  onUserMessage?: () => void;
  /** Fonction pour mettre à jour la liste des messages */
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  /** Fonction pour mettre à jour l'état de chargement */
  setIsLoading: (loading: boolean) => void;
  /** Fonction pour stocker la dernière proposition IA */
  setLastAIProposal: (proposal: import("../lib/gemini").PollSuggestion | null) => void;
  /** Fonction pour marquer une question comme modifiée */
  setModifiedQuestion: (
    questionId: string,
    field: "title" | "type" | "options" | "required",
  ) => void;
  /** Callback pour démarrer un nouveau chat (changement de type de sondage) */
  onStartNewChat?: () => Promise<void>;
  /** Type de sondage attendu pour ce contexte (strict checking) */
  pollType?: "date" | "form" | "availability";
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
    hasCurrentPoll,
  } = options;

  // Stocker les callbacks dans des refs pour éviter les re-créations
  const onUserMessageRef = useRef(onUserMessage);
  const onStartNewChatRef = useRef(onStartNewChat);

  useEffect(() => {
    onUserMessageRef.current = onUserMessage;
    onStartNewChatRef.current = onStartNewChat;
  }, [onUserMessage, onStartNewChat]);

  const sendMessage = useCallback(
    async (text: string, notifyParent: boolean, attachedFile?: File | null) => {
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
          return sendMessage(intentResult.originalMessage || trimmedText, false, attachedFile);
        }

        // Ajouter le message utilisateur si présent
        if (intentResult.userMessage) {
          setMessages((prev) => [...prev, intentResult.userMessage!]);
        }

        // Stocker la proposition IA pour le feedback si présente
        if (intentResult.aiProposal) {
          setLastAIProposal(intentResult.aiProposal.generatedContent);
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

      let geminiAttachment: GeminiAttachedFile | undefined;
      if (attachedFile) {
        // Validation côté front avant lecture du fichier
        const { size, type, name } = attachedFile;

        if (size > MAX_ATTACHMENT_SIZE_BYTES) {
          const processedError = ErrorFactory.validation(
            "Fichier joint trop volumineux",
            "Le fichier joint dépasse la taille maximale autorisée (10 Mo).",
            { size, name, limit: MAX_ATTACHMENT_SIZE_BYTES },
          );
          logError(processedError, {
            component: "useMessageSender",
            operation: "validateAttachmentSize",
          });
          toast.toast({
            title: "Fichier trop volumineux",
            description: "Le fichier dépasse 10 Mo. Essayez avec un fichier plus léger.",
            variant: "destructive",
          });
          return;
        }

        const isAllowedMime =
          !type ||
          ALLOWED_ATTACHMENT_MIME_EXACT.includes(type) ||
          ALLOWED_ATTACHMENT_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));

        if (!isAllowedMime) {
          const processedError = ErrorFactory.validation(
            "Type de fichier joint non supporté",
            "Ce type de fichier n'est pas encore supporté pour l'analyse automatique.",
            { mimeType: type, name },
          );
          logError(processedError, {
            component: "useMessageSender",
            operation: "validateAttachmentMimeType",
          });
          toast.toast({
            title: "Type de fichier non supporté",
            description: "Formats conseillés : PDF, DOCX, TXT ou image.",
            variant: "destructive",
          });
          return;
        }

        try {
          geminiAttachment = await fileToGeminiAttachment(attachedFile);
          console.log(`[${timestamp}] [${requestId}] 📎 Fichier attaché préparé pour Gemini`, {
            name: geminiAttachment.name,
            mimeType: geminiAttachment.mimeType,
            size: geminiAttachment.size,
          });
        } catch (error) {
          const processedError = ErrorFactory.validation(
            "Erreur conversion fichier pour Gemini",
            "Impossible de lire le fichier joint. Réessayez ou utilisez un autre fichier.",
            { originalError: error },
          );
          logError(processedError, {
            component: "useMessageSender",
            operation: "fileToGeminiAttachment",
          });
          toast.toast({
            title: "Erreur fichier joint",
            description:
              "Impossible de lire le fichier joint. Veuillez vérifier le format et la taille.",
            variant: "destructive",
          });
          return;
        }
      }

      // 🎯 NOUVEAU: Agréger les demandes de modification avant création du sondage
      const processedMessage = SurveyRequestAggregator.processMessage(trimmedText, hasCurrentPoll);
      const finalMessage = processedMessage.text; // Message à envoyer à Gemini (peut être aggloméré)

      if (processedMessage.isAggregated) {
        logger.info("🔄 Demande agglomérée détectée", "conversation", {
          original: trimmedText.substring(0, 100),
          aggregated: finalMessage.substring(0, 150),
        });
      }

      // Détecter si c'est un markdown questionnaire long (utiliser le message original pour l'affichage)
      const trimmedInput = finalMessage; // Utiliser le message aggloméré pour Gemini
      const isLongMarkdown = trimmedInput.length > 500 && /^#\s+.+$/m.test(trimmedInput);
      // Afficher le message original de l'utilisateur dans le chat, pas le message aggloméré
      const displayContent = isLongMarkdown
        ? `📋 Questionnaire détecté (${trimmedText.length} caractères)\n\nAnalyse en cours...`
        : trimmedText; // Utiliser trimmedText (message original) pour l'affichage

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

      // Déterminer l'identité utilisateur effective (auth normale ou override E2E)
      let effectiveUserId: string | null = user?.id || null;
      if (typeof window !== "undefined") {
        const w = window as Window & { __E2E_USER_ID__?: string };
        if (w.__E2E_USER_ID__) {
          effectiveUserId = w.__E2E_USER_ID__;
        } else {
          try {
            const forcedFromLocalStorage = localStorage.getItem("e2e-user-id");
            if (forcedFromLocalStorage) {
              effectiveUserId = forcedFromLocalStorage;
            }
          } catch {
            // ignore
          }
        }
      }

      // Save user message (non-bloquant pour accélérer l'appel Gemini)
      console.log(`[${timestamp}] [${requestId}] 💾 Sauvegarde message utilisateur...`);
      // OPTIMISATION: Rendre non-bloquant même pour auth users pour accélérer l'appel Gemini
      // Sauvegarder le message original de l'utilisateur, pas le message aggloméré
      const saveMessagePromise = autoSave.addMessage({
        id: userMessage.id,
        content: isLongMarkdown ? trimmedText : userMessage.content, // Utiliser trimmedText (message original)
        isAI: userMessage.isAI,
        timestamp: userMessage.timestamp,
      });

      if (effectiveUserId) {
        // Auth user: sauvegarde en arrière-plan (non-bloquant pour accélérer)
        saveMessagePromise.catch((error) => {
          logError(
            ErrorFactory.storage(
              "Erreur sauvegarde message auth",
              "Une erreur est survenue lors de la sauvegarde du message",
            ),
            { metadata: { originalError: error, requestId, timestamp } },
          );
        });
        console.log(
          `[${timestamp}] [${requestId}] ✅ Message utilisateur sauvegarde lancée (auth, non-bloquant)`,
        );
      } else {
        // Guest: sauvegarde non-bloquante (localStorage rapide, Supabase en arrière-plan si nécessaire)
        saveMessagePromise.catch((error) => {
          logError(
            ErrorFactory.storage(
              "Erreur sauvegarde message guest",
              "Une erreur est survenue lors de la sauvegarde du message",
            ),
            { metadata: { originalError: error, requestId, timestamp } },
          );
        });
        console.log(
          `[${timestamp}] [${requestId}] ✅ Message utilisateur sauvegardé (guest, non-bloquant)`,
        );
      }

      // VÉRIFIER QUOTA EN CACHE D'ABORD (rapide, non-bloquant)
      console.log(
        `[${timestamp}] [${requestId}] 🔒 Vérification quota message IA (cache) AVANT appel Gemini...`,
      );
      if (!aiQuota.canSendMessage) {
        console.log(`[${timestamp}] [${requestId}] ❌ Limite de messages IA atteinte (cache)`);
        setIsLoading(false);

        // Afficher le modal d'authentification au lieu du toast
        if (quota?.showAuthIncentive) {
          quota.showAuthIncentive("conversation_limit");
        }

        // Ajouter un message d'erreur dans le chat
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content:
            "⚠️ Limite de messages IA atteinte. Veuillez vous connecter pour continuer à utiliser l'assistant IA.",
          isAI: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);

        return; // Arrêter l'exécution
      }

      // Consommer le quota en arrière-plan (non-bloquant pour guests si Supabase est lent)
      console.log(`[${timestamp}] [${requestId}] 💾 Consommation quota en arrière-plan...`);
      const { consumeAiMessageCredits } = await import("../lib/quotaTracking");
      const conversationId = autoSave.getRealConversationId() || autoSave.conversationId;
      const userId = effectiveUserId;

      console.log(`[${timestamp}] [${requestId}] 💾 Paramètres consommation quota:`, {
        userId,
        conversationId,
        hasUser: !!userId,
      });

      // Pour les guests, rendre non-bloquant (fire and forget si timeout)
      if (!userId) {
        console.log(`[${timestamp}] [${requestId}] 💾 Mode guest - consommation non-bloquante...`);
        // Guest: consommer en arrière-plan, ne pas bloquer l'appel Gemini
        consumeAiMessageCredits(userId, conversationId).catch((error: Error) => {
          // Si erreur de quota (limite atteinte), on ne peut rien faire car Gemini est déjà appelé
          // Mais on log pour debug
          logError(
            ErrorFactory.storage(
              "Erreur consommation quota guest",
              "Une erreur est survenue lors de la consommation des crédits",
            ),
            { metadata: { originalError: error, requestId, timestamp, userId, conversationId } },
          );
        });
        console.log(
          `[${timestamp}] [${requestId}] 💾 Consommation quota guest lancée (non-bloquant)`,
        );
      } else {
        console.log(
          `[${timestamp}] [${requestId}] 💾 Mode auth - consommation non-bloquante (optimisation)...`,
        );
        // OPTIMISATION: Rendre non-bloquant même pour auth users pour accélérer l'appel Gemini
        // La vérification de quota en cache (ligne 289) a déjà été faite, donc on peut consommer en arrière-plan
        consumeAiMessageCredits(userId, conversationId).catch((error: Error) => {
          // Si erreur de quota (limite atteinte), on ne peut rien faire car Gemini est déjà appelé
          // Mais on log pour debug et on affichera l'erreur dans la réponse Gemini si nécessaire
          logError(
            ErrorFactory.storage(
              "Erreur consommation quota auth",
              "Une erreur est survenue lors de la consommation des crédits",
            ),
            { metadata: { originalError: error, requestId, timestamp, userId, conversationId } },
          );
          // Note: La limite sera détectée lors du prochain message grâce au cache
        });
        console.log(
          `[${timestamp}] [${requestId}] 💾 Consommation quota auth lancée (non-bloquant)`,
        );
      }

      console.log(
        `[${timestamp}] [${requestId}] ✅ Après consommation quota - continuation vers Gemini...`,
      );

      // Appel API Gemini via le hook
      // Passer pollType pour forcer le type (séparation Date/Form)
      const pollTypeForAPI = options.pollType === "availability" ? "date" : options.pollType;
      console.log(
        `[${timestamp}] [${requestId}] 🟣 useMessageSender: Appel geminiAPI.generatePoll`,
        {
          messageLength: trimmedInput.length,
          messagePreview: trimmedInput.substring(0, 50),
          pollType: pollTypeForAPI,
        },
      );

      let pollResponse;
      try {
        pollResponse = await geminiAPI.generatePoll(trimmedInput, pollTypeForAPI, geminiAttachment);
        console.log(
          `[${new Date().toISOString()}] [${requestId}] 🟣 useMessageSender: Réponse reçue`,
          {
            success: pollResponse.success,
            hasData: !!pollResponse.data,
            error: pollResponse.error,
          },
        );
      } catch (geminiError) {
        logError(
          ErrorFactory.api(
            "Erreur lors de l'appel Gemini",
            "Une erreur est survenue lors de l'appel à l'API Gemini",
          ),
          { metadata: { originalError: geminiError, requestId } },
        );
        throw geminiError;
      }
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
        // Note: On ne efface PAS la demande en attente ici car le sondage n'est pas encore créé
        // La demande sera effacée uniquement quand l'utilisateur clique sur "Créer ce sondage"

        // 🛡️ STRICT TYPE CHECKING
        // Vérifier que le type généré correspond au type attendu (si spécifié)
        if (options.pollType) {
          const receivedType = pollResponse.data.type;
          let isValidType = false;

          if (options.pollType === "date" || options.pollType === "availability") {
            // Pour les sondages de dates, on accepte 'date', 'datetime', 'custom'
            isValidType = isDatePollSuggestion(pollResponse.data);
          } else if (options.pollType === "form") {
            // Pour les formulaires, on accepte 'form'
            isValidType = isFormPollSuggestion(pollResponse.data);
          } else {
            // Fallback strict equality
            isValidType = receivedType === options.pollType;
          }

          if (!isValidType) {
            logger.warn("⚠️ Tentative de création de sondage de mauvais type bloquée", "poll", {
              expected: options.pollType,
              received: receivedType,
            });

            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              content: `Je ne peux pas créer ce type de sondage ici. Cette interface est réservée aux sondages de type "${options.pollType}".`,
              isAI: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }

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

        // Auto-save AI response with poll suggestion (non-bloquant pour guests)
        if (user?.id) {
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
          autoSave
            .addMessage({
              id: aiResponse.id,
              content: aiResponse.content,
              isAI: aiResponse.isAI,
              timestamp: aiResponse.timestamp,
              metadata: {
                pollGenerated: true,
                pollSuggestion: aiResponse.pollSuggestion,
              },
            })
            .catch((error) => {
              logError(
                ErrorFactory.storage(
                  "Erreur sauvegarde message AI guest",
                  "Une erreur est survenue lors de la sauvegarde du message AI",
                ),
                { metadata: { originalError: error, requestId, timestamp } },
              );
            });
        }
      } else {
        // Poll generation failed - le hook gère déjà les types d'erreurs
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: pollResponse.error || "Erreur lors de la génération",
          isAI: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);

        // Auto-save error message (non-bloquant pour guests)
        if (user?.id) {
          await autoSave.addMessage({
            id: errorMessage.id,
            content: errorMessage.content,
            isAI: errorMessage.isAI,
            timestamp: errorMessage.timestamp,
          });
        } else {
          autoSave
            .addMessage({
              id: errorMessage.id,
              content: errorMessage.content,
              isAI: errorMessage.isAI,
              timestamp: errorMessage.timestamp,
            })
            .catch((error) => {
              logError(
                ErrorFactory.storage(
                  "Erreur sauvegarde message erreur guest",
                  "Une erreur est survenue lors de la sauvegarde du message d'erreur",
                ),
                { metadata: { originalError: error, requestId, timestamp } },
              );
            });
        }

        // 🎯 NEW: Ask for consent to analyze specific failures (not quota/network)
        const isAnalysisCandidate = ["parsing", "unknown", "api_error"].includes(
          pollResponse.errorType || "",
        );
        if (isAnalysisCandidate) {
          const consentMessage: Message = {
            id: `consent-${Date.now()}`,
            content:
              "Je n'ai pas réussi à traiter votre demande. Voulez-vous envoyer les détails de cette erreur à notre équipe pour analyse humaine afin d'améliorer le service ?",
            isAI: true,
            timestamp: new Date(),
            metadata: {
              type: "analysis_consent",
              context: {
                userMessage: trimmedInput,
                error: pollResponse.error,
              },
            },
          };
          // Add slight delay for natural feel
          setTimeout(() => {
            setMessages((prev) => [...prev, consentMessage]);
            // We don't necessarily autosave this ephemeral request, but we could.
          }, 500);
        }
      }

      setIsLoading(false);
    },
    [
      isLoading,
      quota,
      aiQuota,
      intentDetection,
      geminiAPI,
      autoSave,
      user?.id,
      setMessages,
      setIsLoading,
      setLastAIProposal,
      setModifiedQuestion,
      hasCurrentPoll,
      options.pollType,
      toast,
    ], // onUserMessage est dans une ref
  );

  return {
    sendMessage,
  };
}
