/**
 * useGeminiAPI Hook
 * 
 * Hook dédié pour gérer les appels à l'API Gemini
 * Extrait de GeminiChatInterface pour réduire la complexité
 * 
 * Responsabilités :
 * - Appels API Gemini
 * - Gestion des erreurs API
 * - Gestion des quotas
 * - Retry logic
 * 
 * @see Docs/Architecture-GeminiChatInterface.md
 */

import { useState, useCallback } from "react";
import { geminiService, type PollSuggestion } from "../lib/gemini";
import { handleError, logError } from "../lib/error-handling";
import { logger } from "../lib/logger";

export interface GeminiAPIResponse {
  success: boolean;
  data?: PollSuggestion;
  error?: string;
  errorType?: "quota" | "network" | "parsing" | "unknown";
}

export interface UseGeminiAPIOptions {
  onQuotaExceeded?: () => void;
  onNetworkError?: () => void;
  debug?: boolean;
}

export interface UseGeminiAPIReturn {
  isLoading: boolean;
  generatePoll: (userMessage: string) => Promise<GeminiAPIResponse>;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook pour gérer les appels à l'API Gemini
 */
export function useGeminiAPI(options: UseGeminiAPIOptions = {}): UseGeminiAPIReturn {
  const { onQuotaExceeded, onNetworkError, debug = false } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Génère un sondage à partir d'un message utilisateur
   */
  const generatePoll = useCallback(
    async (userMessage: string): Promise<GeminiAPIResponse> => {
      const trimmedMessage = userMessage.trim();
      
      if (!trimmedMessage) {
        return {
          success: false,
          error: "Message vide",
          errorType: "unknown",
        };
      }

      setIsLoading(true);
      setError(null);

      if (debug) {
        logger.info("🤖 Appel API Gemini", "api", { message: trimmedMessage });
      }

      try {
        // Appel à l'API Gemini
        const pollResponse = await geminiService.generatePollFromText(trimmedMessage);

        if (pollResponse.success && pollResponse.data) {
          if (debug) {
            logger.info("✅ Réponse Gemini reçue", "api", {
              type: pollResponse.data.type,
            });
          }

          setIsLoading(false);
          return {
            success: true,
            data: pollResponse.data,
          };
        }

        // Échec de la génération
        const errorType = detectErrorType(pollResponse.error);
        
        if (errorType === "quota") {
          onQuotaExceeded?.();
        } else if (errorType === "network") {
          onNetworkError?.();
        }

        const errorMessage = getErrorMessage(errorType);
        setError(errorMessage);
        setIsLoading(false);

        if (debug) {
          logger.warn("⚠️ Échec génération poll", "api", {
            error: pollResponse.error,
            errorType,
          });
        }

        return {
          success: false,
          error: errorMessage,
          errorType,
        };

      } catch (error) {
        const processedError = handleError(
          error,
          {
            component: "useGeminiAPI",
            operation: "generatePoll",
          },
          "Erreur lors de l'appel API Gemini",
        );

        logError(processedError, {
          component: "useGeminiAPI",
          operation: "generatePoll",
        });

        const errorType = detectErrorType(processedError.message);
        const errorMessage = getErrorMessage(errorType);

        if (errorType === "quota") {
          onQuotaExceeded?.();
        } else if (errorType === "network") {
          onNetworkError?.();
        }

        setError(errorMessage);
        setIsLoading(false);

        return {
          success: false,
          error: errorMessage,
          errorType,
        };
      }
    },
    [onQuotaExceeded, onNetworkError, debug],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    generatePoll,
    error,
    clearError,
  };
}

/**
 * Détecte le type d'erreur à partir du message
 */
function detectErrorType(errorMessage?: string): "quota" | "network" | "parsing" | "unknown" {
  if (!errorMessage) return "unknown";

  const message = errorMessage.toLowerCase();

  if (message.includes("quota") || message.includes("rate limit") || message.includes("limit")) {
    return "quota";
  }

  if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
    return "network";
  }

  if (message.includes("parse") || message.includes("json") || message.includes("format")) {
    return "parsing";
  }

  return "unknown";
}

/**
 * Retourne un message d'erreur user-friendly selon le type
 */
function getErrorMessage(errorType: "quota" | "network" | "parsing" | "unknown"): string {
  switch (errorType) {
    case "quota":
      return "Limite de quota atteinte. Veuillez réessayer plus tard ou vous connecter pour plus de requêtes.";
    
    case "network":
      return "Problème de connexion réseau. Vérifiez votre connexion internet.";
    
    case "parsing":
      return "Erreur lors de l'analyse de la réponse. Veuillez reformuler votre demande.";
    
    case "unknown":
    default:
      return "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?";
  }
}
