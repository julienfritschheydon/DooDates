/**
 * Hook pour gérer le quota de messages IA (Freemium)
 *
 * Système de quota :
 * - Guest : 10 messages IA max (réduit pour reconnaissance vocale)
 * - Authenticated : 100 messages/mois (réduit pour reconnaissance vocale)
 * - Limite 2 polls par conversation (guest), 5 (auth)
 *
 * Empêche :
 * - Chat infini (spam messages)
 * - Création infinie de polls dans une conversation
 * - Abus du système gratuit
 *
 * Note : Quotas réduits car reconnaissance vocale facilite l'usage
 * et augmente la consommation de tokens Gemini
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

// Limites par type d'utilisateur
// Réduit de 50% pour compenser l'usage facilité par reconnaissance vocale
const QUOTA_LIMITS = {
  guest: {
    aiMessages: 10, // Réduit de 20 → 10
    pollsPerConversation: 2, // Réduit de 3 → 2
  },
  authenticated: {
    aiMessages: 100, // Réduit de 200 → 100
    pollsPerConversation: 5, // Réduit de 10 → 5
  },
} as const;

// Cooldown anti-spam (3 secondes entre messages, augmenté)
const MIN_DELAY_BETWEEN_MESSAGES = 3000; // Augmenté de 2s → 3s

interface AiMessageQuotaData {
  aiMessagesUsed: number;
  lastMessageTimestamp: number;
  resetDate?: string; // Pour auth users (reset mensuel)
}

interface PollCountData {
  [conversationId: string]: number;
}

export interface AiMessageQuota {
  // Quota messages IA
  aiMessagesUsed: number;
  aiMessagesLimit: number;
  aiMessagesRemaining: number;
  canSendMessage: boolean;

  // Quota polls par conversation
  pollsInConversation: number;
  pollsLimit: number;
  canCreatePoll: boolean;

  // Actions
  incrementAiMessages: () => void;
  incrementPollCount: (conversationId: string) => void;
  resetQuota: () => void;

  // Cooldown
  isInCooldown: boolean;
  cooldownRemaining: number;
}

const STORAGE_KEY = "doodates_ai_quota";
const POLL_COUNT_KEY = "doodates_poll_counts";

/**
 * Hook pour gérer le quota de messages IA
 */
export function useAiMessageQuota(currentConversationId?: string): AiMessageQuota {
  const { user } = useAuth();
  const isGuest = !user;

  // Limites selon type utilisateur
  const limits = isGuest ? QUOTA_LIMITS.guest : QUOTA_LIMITS.authenticated;

  // État quota messages
  const [quotaData, setQuotaData] = useState<AiMessageQuotaData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { aiMessagesUsed: 0, lastMessageTimestamp: 0 };
      }
    }
    return { aiMessagesUsed: 0, lastMessageTimestamp: 0 };
  });

  // État compteur polls par conversation
  const [pollCounts, setPollCounts] = useState<PollCountData>(() => {
    const stored = localStorage.getItem(POLL_COUNT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Cooldown state
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Vérifier reset mensuel pour auth users
  useEffect(() => {
    if (!isGuest && quotaData.resetDate) {
      const resetDate = new Date(quotaData.resetDate);
      const now = new Date();

      // Reset si on a dépassé le mois
      if (now > resetDate) {
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        setQuotaData({
          aiMessagesUsed: 0,
          lastMessageTimestamp: 0,
          resetDate: nextReset.toISOString(),
        });
      }
    } else if (!isGuest && !quotaData.resetDate) {
      // Initialiser date de reset pour auth users
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      setQuotaData((prev) => ({
        ...prev,
        resetDate: nextReset.toISOString(),
      }));
    }
  }, [isGuest, quotaData.resetDate]);

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotaData));
  }, [quotaData]);

  useEffect(() => {
    localStorage.setItem(POLL_COUNT_KEY, JSON.stringify(pollCounts));
  }, [pollCounts]);

  // Gérer cooldown
  useEffect(() => {
    if (quotaData.lastMessageTimestamp > 0) {
      const elapsed = Date.now() - quotaData.lastMessageTimestamp;
      const remaining = MIN_DELAY_BETWEEN_MESSAGES - elapsed;

      if (remaining > 0) {
        setIsInCooldown(true);
        setCooldownRemaining(Math.ceil(remaining / 1000));

        const timer = setTimeout(() => {
          setIsInCooldown(false);
          setCooldownRemaining(0);
        }, remaining);

        const interval = setInterval(() => {
          const newElapsed = Date.now() - quotaData.lastMessageTimestamp;
          const newRemaining = MIN_DELAY_BETWEEN_MESSAGES - newElapsed;
          setCooldownRemaining(Math.ceil(Math.max(0, newRemaining) / 1000));
        }, 100);

        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      } else {
        setIsInCooldown(false);
        setCooldownRemaining(0);
      }
    }
  }, [quotaData.lastMessageTimestamp]);

  // Calculer valeurs
  const aiMessagesRemaining = Math.max(0, limits.aiMessages - quotaData.aiMessagesUsed);
  const canSendMessage = aiMessagesRemaining > 0 && !isInCooldown;

  const pollsInConversation = currentConversationId ? pollCounts[currentConversationId] || 0 : 0;
  const canCreatePoll = pollsInConversation < limits.pollsPerConversation;

  // Incrémenter compteur messages IA
  const incrementAiMessages = useCallback(() => {
    setQuotaData((prev) => ({
      ...prev,
      aiMessagesUsed: prev.aiMessagesUsed + 1,
      lastMessageTimestamp: Date.now(),
    }));
  }, []);

  // Incrémenter compteur polls
  const incrementPollCount = useCallback((conversationId: string) => {
    setPollCounts((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || 0) + 1,
    }));
  }, []);

  // Reset quota (pour tests ou admin)
  const resetQuota = useCallback(() => {
    setQuotaData({ aiMessagesUsed: 0, lastMessageTimestamp: 0 });
    setPollCounts({});
  }, []);

  return {
    aiMessagesUsed: quotaData.aiMessagesUsed,
    aiMessagesLimit: limits.aiMessages,
    aiMessagesRemaining,
    canSendMessage,

    pollsInConversation,
    pollsLimit: limits.pollsPerConversation,
    canCreatePoll,

    incrementAiMessages,
    incrementPollCount,
    resetQuota,

    isInCooldown,
    cooldownRemaining,
  };
}
