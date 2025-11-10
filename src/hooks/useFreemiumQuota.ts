/**
 * Hook for managing freemium quota limits and authentication incentives
 * DooDates - Freemium Quota Management System
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { logError, ErrorFactory } from "../lib/error-handling";
import { useConversations } from "./useConversations";
import { logger } from "../lib/logger";
import { getQuotaConsumed } from "../lib/quotaTracking";
import {
  getOrCreateGuestQuota,
  canConsumeCredits,
  consumeGuestCredits,
  getGuestLimits,
  type GuestQuotaData,
} from "../lib/guestQuotaService";

export interface QuotaLimits {
  conversations: number;
  polls: number;
  storageSize: number; // in MB
}

export interface QuotaUsage {
  conversations: number;
  polls: number;
  storageUsed: number; // in MB
}

export interface QuotaStatus {
  conversations: {
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
  polls: {
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
}

import { CONVERSATION_QUOTAS, STORAGE_QUOTAS } from "@/constants/quotas";

const GUEST_LIMITS: QuotaLimits = {
  conversations: CONVERSATION_QUOTAS.ANONYMOUS, // 5 conversations
  polls: 5,
  storageSize: STORAGE_QUOTAS.ANONYMOUS, // 50MB
};

const AUTHENTICATED_LIMITS: QuotaLimits = {
  conversations: CONVERSATION_QUOTAS.AUTHENTICATED, // 1000 conversations
  polls: 100,
  storageSize: STORAGE_QUOTAS.AUTHENTICATED, // 1000MB (1GB)
};

export const useFreemiumQuota = () => {
  const { user } = useAuth();
  const conversations = useConversations();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTrigger, setAuthModalTrigger] = useState<
    "conversation_limit" | "poll_limit" | "feature_locked" | "storage_full"
  >("conversation_limit");
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage>({
    conversations: 0,
    polls: 0,
    storageUsed: 0,
  });
  const [guestQuota, setGuestQuota] = useState<GuestQuotaData | null>(null);

  const isAuthenticated = !!user;
  const limits = isAuthenticated ? AUTHENTICATED_LIMITS : GUEST_LIMITS;

  // Calculate current usage (async)
  const calculateUsage = useCallback(async (): Promise<QuotaUsage> => {
    // Pour les guests, utiliser la validation serveur Supabase
    if (!isAuthenticated) {
      try {
        const quota = await getOrCreateGuestQuota();
        if (quota) {
          setGuestQuota(quota);
          return {
            conversations: quota.conversationsCreated,
            polls: quota.pollsCreated,
            storageUsed: 0, // Pas de limite storage pour guests via Supabase
          };
        }
      } catch (error) {
        logger.error("Failed to fetch guest quota from Supabase", error);
        // Fallback vers localStorage si Supabase échoue
      }
    }

    // Pour les utilisateurs authentifiés, utiliser le système existant
    const quotaConsumed = await getQuotaConsumed(user?.id);

    const conversationCount = quotaConsumed.totalCreditsConsumed || 0;

    // Estimate storage usage from localStorage
    let storageUsed = 0;
    try {
      const storage = JSON.stringify(localStorage);
      storageUsed = new Blob([storage]).size / (1024 * 1024); // Convert to MB
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to calculate storage usage",
          "Impossible de calculer l'utilisation du stockage",
        ),
        { component: "useFreemiumQuota", metadata: { originalError: error } },
      );
    }

    const pollCount = quotaConsumed.pollsCreated || 0;

    return {
      conversations: conversationCount,
      polls: pollCount,
      storageUsed,
    };
  }, [user?.id, quotaRefreshKey, isAuthenticated]);

  // Charger les données de quota de manière asynchrone
  useEffect(() => {
    calculateUsage()
      .then(setQuotaUsage)
      .catch((error) => {
        logError(
          ErrorFactory.storage("Failed to calculate quota usage", "Erreur de calcul du quota"),
          { component: "useFreemiumQuota", metadata: { originalError: error } },
        );
      });
  }, [calculateUsage, quotaRefreshKey]);

  // Calculate quota status
  const getQuotaStatus = useCallback((): QuotaStatus => {
    const usage = quotaUsage;

    const calculateStatus = (used: number, limit: number) => {
      const percentage = Math.min((used / limit) * 100, 100);
      return {
        used,
        limit,
        percentage,
        isNearLimit: percentage >= 80,
        isAtLimit: percentage >= 100,
      };
    };

    return {
      conversations: calculateStatus(usage.conversations, limits.conversations),
      polls: calculateStatus(usage.polls, limits.polls),
      storage: calculateStatus(usage.storageUsed, limits.storageSize),
    };
  }, [quotaUsage, limits]);

  // Check if action is allowed
  const canCreateConversation = useCallback(async () => {
    // Pour les guests, vérifier avec Supabase
    if (!isAuthenticated) {
      const check = await canConsumeCredits("conversation_created", 1);
      return check.allowed;
    }

    // Pour les authentifiés, utiliser le système existant
    const status = getQuotaStatus();
    return !status.conversations.isAtLimit;
  }, [getQuotaStatus, isAuthenticated]);

  const canCreatePoll = useCallback(async () => {
    // Pour les guests, vérifier avec Supabase
    if (!isAuthenticated) {
      const check = await canConsumeCredits("poll_created", 1);
      return check.allowed;
    }

    // Pour les authentifiés, utiliser le système existant
    const status = getQuotaStatus();
    return !status.polls.isAtLimit;
  }, [getQuotaStatus, isAuthenticated]);

  const canUseFeature = useCallback(
    (feature: string) => {
      // Some features are locked for guest users
      if (!isAuthenticated) {
        const lockedFeatures = ["export", "advanced_analytics", "custom_branding"];
        return !lockedFeatures.includes(feature);
      }
      return true;
    },
    [isAuthenticated],
  );

  // Show authentication incentive modal
  const showAuthIncentive = useCallback((trigger: typeof authModalTrigger) => {
    setAuthModalTrigger(trigger);
    setShowAuthModal(true);
  }, []);

  // Check and enforce limits
  const checkConversationLimit = useCallback(async () => {
    const canCreate = await canCreateConversation();
    if (!canCreate) {
      showAuthIncentive("conversation_limit");
      return false;
    }

    const status = getQuotaStatus();
    if (status.conversations.isNearLimit && !isAuthenticated) {
      // Show warning but allow action
      logger.warn("Approaching conversation limit", "conversation", {
        used: status.conversations.used,
        limit: status.conversations.limit,
      });
    }

    return true;
  }, [canCreateConversation, showAuthIncentive, getQuotaStatus, isAuthenticated]);

  const checkPollLimit = useCallback(async () => {
    const canCreate = await canCreatePoll();
    if (!canCreate) {
      showAuthIncentive("poll_limit");
      return false;
    }
    return true;
  }, [canCreatePoll, showAuthIncentive]);

  const checkFeatureAccess = useCallback(
    (feature: string) => {
      if (!canUseFeature(feature)) {
        showAuthIncentive("feature_locked");
        return false;
      }
      return true;
    },
    [canUseFeature, showAuthIncentive],
  );

  // Monitor storage usage
  useEffect(() => {
    const status = getQuotaStatus();
    if (status.storage.isNearLimit && !isAuthenticated) {
      logger.warn("Storage usage high", "general", {
        used: status.storage.used.toFixed(1),
        limit: status.storage.limit,
        unit: "MB",
      });
    }
  }, [getQuotaStatus, isAuthenticated]);

  // Écouter les événements de changement pour mettre à jour le quota
  useEffect(() => {
    const handleConversationsChanged = () => {
      // Forcer le recalcul du quota en incrémentant la clé de rafraîchissement
      logger.debug("🔄 Quota: Conversations changées, recalcul nécessaire", "quota");
      setQuotaRefreshKey((prev) => prev + 1);
    };

    const handlePollDeleted = () => {
      logger.debug("🔄 Quota: Poll supprimé, recalcul nécessaire", "quota");
      setQuotaRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("conversationsChanged", handleConversationsChanged);
    window.addEventListener("pollDeleted", handlePollDeleted);

    return () => {
      window.removeEventListener("conversationsChanged", handleConversationsChanged);
      window.removeEventListener("pollDeleted", handlePollDeleted);
    };
  }, []);

  return {
    // Quota information
    limits,
    usage: quotaUsage,
    status: getQuotaStatus(),
    isAuthenticated,

    // Permission checks
    canCreateConversation,
    canCreatePoll,
    canUseFeature,

    // Enforcement functions
    checkConversationLimit,
    checkPollLimit,
    checkFeatureAccess,

    // Modal management
    showAuthModal,
    authModalTrigger,
    showAuthIncentive,
    closeAuthModal: () => setShowAuthModal(false),

    // Utility functions
    getRemainingConversations: () => Math.max(0, limits.conversations - quotaUsage.conversations),
    getRemainingPolls: () => Math.max(0, limits.polls - quotaUsage.polls),
    getStoragePercentage: () => getQuotaStatus().storage.percentage,
  };
};

export default useFreemiumQuota;
