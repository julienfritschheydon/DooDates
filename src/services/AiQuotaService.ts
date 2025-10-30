/**
 * Service pour gérer les vérifications et actions liées au quota AI
 * Extrait de GeminiChatInterface pour réduire sa taille
 */

import { type AiMessageQuota } from "../hooks/useAiMessageQuota";
import { type UseQuotaReturn } from "../hooks/useQuota";

export interface QuotaCheckResult {
  canProceed: boolean;
  reason?: "cooldown" | "quota_exceeded";
  message?: {
    title: string;
    description: string;
    variant: "default" | "destructive";
  };
}

/**
 * Vérifie si l'utilisateur peut envoyer un message IA
 */
export function checkAiMessageQuota(aiQuota: AiMessageQuota): QuotaCheckResult {
  if (aiQuota.canSendMessage) {
    return { canProceed: true };
  }

  if (aiQuota.isInCooldown) {
    return {
      canProceed: false,
      reason: "cooldown",
      message: {
        title: "Ralentissez un peu ! ⏱️",
        description: `Attendez ${aiQuota.cooldownRemaining}s avant d'envoyer un nouveau message`,
        variant: "default",
      },
    };
  }

  return {
    canProceed: false,
    reason: "quota_exceeded",
    message: {
      title: "Limite de messages IA atteinte 🚫",
      description: `Vous avez utilisé vos ${aiQuota.aiMessagesLimit} messages gratuits. Connectez-vous pour continuer !`,
      variant: "destructive",
    },
  };
}

/**
 * Vérifie si l'utilisateur peut créer un poll dans cette conversation
 */
export function checkPollCreationQuota(aiQuota: AiMessageQuota): QuotaCheckResult {
  if (aiQuota.canCreatePoll) {
    return { canProceed: true };
  }

  return {
    canProceed: false,
    reason: "quota_exceeded",
    message: {
      title: "Limite de polls atteinte 🚫",
      description: `Vous avez atteint la limite de ${aiQuota.pollsLimit} polls dans cette conversation. Créez une nouvelle conversation pour continuer.`,
      variant: "destructive",
    },
  };
}

/**
 * Gère l'affichage des messages d'erreur quota et trigger auth incentive
 */
export function handleQuotaError(
  result: QuotaCheckResult,
  quota: UseQuotaReturn,
  toast: (options: any) => void,
): void {
  if (!result.message) return;

  toast(result.message);

  // Trigger auth incentive si quota dépassé (pas pour cooldown)
  if (result.reason === "quota_exceeded") {
    quota.showAuthIncentive("quota_exceeded");
  }
}

/**
 * Incrémente les compteurs après une action réussie
 */
export function incrementQuotaCounters(
  aiQuota: AiMessageQuota,
  options: {
    incrementMessages?: boolean;
    incrementPolls?: boolean;
    conversationId?: string;
  },
): void {
  if (options.incrementMessages) {
    aiQuota.incrementAiMessages();
  }

  if (options.incrementPolls && options.conversationId) {
    aiQuota.incrementPollCount(options.conversationId);
  }
}
