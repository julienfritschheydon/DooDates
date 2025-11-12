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
import { useFreemiumQuota } from "./useFreemiumQuota";

import { AI_MESSAGE_QUOTAS, POLL_CREATION_QUOTAS } from "@/constants/quotas";

// Limites par type d'utilisateur
// Réduit de 50% pour compenser l'usage facilité par reconnaissance vocale
const QUOTA_LIMITS = {
  guest: {
    aiMessages: AI_MESSAGE_QUOTAS.ANONYMOUS, // 10 messages
    pollsPerConversation: POLL_CREATION_QUOTAS.ANONYMOUS, // 2 polls
  },
  authenticated: {
    aiMessages: AI_MESSAGE_QUOTAS.AUTHENTICATED, // 100 messages/mois
    pollsPerConversation: POLL_CREATION_QUOTAS.AUTHENTICATED, // 5 polls
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
 * Fonction pure pour gérer le reset mensuel du quota
 * Testable indépendamment de React
 */
export function processMonthlyQuotaReset(
  currentQuotaData: AiMessageQuotaData,
  isGuest: boolean,
): AiMessageQuotaData | null {
  // Pas de reset pour les guests
  if (isGuest) {
    return null;
  }

  // Si resetDate existe, vérifier si on doit reset
  if (currentQuotaData.resetDate) {
    const resetDate = new Date(currentQuotaData.resetDate);
    const now = new Date();

    // Reset si on a dépassé le mois
    if (now > resetDate) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        aiMessagesUsed: 0,
        lastMessageTimestamp: 0,
        resetDate: nextReset.toISOString(),
      };
    }
  } else {
    // Initialiser date de reset pour auth users
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    return {
      ...currentQuotaData,
      resetDate: nextReset.toISOString(),
    };
  }

  return null; // Pas de changement nécessaire
}

/**
 * Hook pour gérer le quota de messages IA
 */
export function useAiMessageQuota(currentConversationId?: string): AiMessageQuota {
  const { user } = useAuth();
  const isGuest = !user;

  // Pour les guests, utiliser useFreemiumQuota pour obtenir les données Supabase
  const freemiumQuota = useFreemiumQuota();
  const guestQuota = isGuest ? freemiumQuota.guestQuota?.data : null;

  // Limites selon type utilisateur
  const limits = isGuest ? QUOTA_LIMITS.guest : QUOTA_LIMITS.authenticated;

  // État quota messages (localStorage pour auth users, fallback pour guests si Supabase indisponible)
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

  // Pour les guests, utiliser les données Supabase si disponibles
  useEffect(() => {
    if (isGuest && guestQuota) {
      // Synchroniser avec les données Supabase
      setQuotaData((prev) => ({
        ...prev,
        aiMessagesUsed: guestQuota.aiMessages || 0,
        // Garder lastMessageTimestamp en localStorage pour le cooldown
      }));
    }
  }, [isGuest, guestQuota?.aiMessages]);

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
    const updatedQuota = processMonthlyQuotaReset(quotaData, isGuest);
    if (updatedQuota) {
      setQuotaData(updatedQuota);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, quotaData.resetDate, quotaData.aiMessagesUsed]);

  // Sauvegarder dans localStorage (uniquement pour auth users, ou comme fallback pour guests)
  useEffect(() => {
    if (!isGuest) {
      // Pour les auth users, toujours sauvegarder dans localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotaData));
    } else {
      // Pour les guests, sauvegarder uniquement si Supabase est indisponible (fallback)
      if (!guestQuota && quotaData.aiMessagesUsed > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotaData));
      }
    }
  }, [quotaData, isGuest, guestQuota]);

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
  // Pour les guests, utiliser les données Supabase si disponibles, sinon fallback localStorage
  const aiMessagesUsed =
    isGuest && guestQuota ? guestQuota.aiMessages || 0 : quotaData.aiMessagesUsed;
  const aiMessagesRemaining = Math.max(0, limits.aiMessages - aiMessagesUsed);
  const canSendMessage = aiMessagesRemaining > 0 && !isInCooldown;

  const pollsInConversation = currentConversationId ? pollCounts[currentConversationId] || 0 : 0;
  const canCreatePoll = pollsInConversation < limits.pollsPerConversation;

  // Incrémenter compteur messages IA
  // Note: Pour les guests, l'incrémentation réelle se fait via consumeGuestCredits() dans quotaTracking
  // Cette fonction met juste à jour le timestamp pour le cooldown
  const incrementAiMessages = useCallback(() => {
    setQuotaData((prev) => ({
      ...prev,
      // Ne pas incrémenter aiMessagesUsed pour les guests (géré par Supabase)
      // Seulement mettre à jour le timestamp pour le cooldown
      lastMessageTimestamp: Date.now(),
      // Pour les auth users, incrémenter aussi le compteur local
      ...(isGuest ? {} : { aiMessagesUsed: prev.aiMessagesUsed + 1 }),
    }));
  }, [isGuest]);

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
    aiMessagesUsed, // Utilise Supabase pour guests, localStorage pour auth
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
