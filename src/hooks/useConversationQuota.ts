/**
 * Hook useConversationQuota
 * Manages conversation quotas, automatic deletion, and authentication incentives
 * DooDates - Conversation History System
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useConversationStorage } from "./useConversationStorage";
import { logError, ErrorFactory } from "../lib/error-handling";
import {
  CONVERSATION_LIMITS,
  ConversationError,
  CONVERSATION_ERROR_CODES,
  type Conversation,
} from "../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QuotaInfo {
  /** Current number of conversations */
  used: number;
  /** Maximum allowed conversations */
  limit: number;
  /** Remaining conversation slots */
  remaining: number;
  /** Percentage of quota used (0-100) */
  usagePercentage: number;
  /** Is user at or over limit */
  isAtLimit: boolean;
  /** Is user near limit (within 2 conversations) */
  isNearLimit: boolean;
  /** Is user in warning zone (>75% usage) */
  isInWarningZone: boolean;
}

export interface AutoDeletionInfo {
  /** Is auto-deletion enabled */
  enabled: boolean;
  /** Number of conversations that would be deleted */
  candidateCount: number;
  /** Oldest conversations that would be deleted */
  candidates: Conversation[];
  /** Days until next auto-deletion */
  daysUntilNextCleanup: number;
}

export interface AuthIncentive {
  /** Should show upgrade prompt */
  shouldShow: boolean;
  /** Type of incentive to show */
  type: "quota_warning" | "quota_exceeded" | "feature_unlock";
  /** Title for the incentive modal */
  title: string;
  /** Description text */
  description: string;
  /** Call-to-action button text */
  ctaText: string;
  /** Benefits of upgrading */
  benefits: string[];
}

export interface FreemiumBadge {
  /** Badge text to display */
  text: string;
  /** Badge variant/color */
  variant: "default" | "warning" | "destructive" | "success";
  /** Should badge be visible */
  visible: boolean;
  /** Tooltip text */
  tooltip?: string;
}

export interface UseConversationQuotaConfig {
  /** Enable automatic deletion of old conversations */
  enableAutoDeletion?: boolean;
  /** Days to keep conversations for guests */
  retentionDays?: number;
  /** Show authentication incentives */
  showAuthIncentives?: boolean;
  /** Auto-dismiss incentives after this many views */
  maxIncentiveViews?: number;
}

export interface UseConversationQuotaReturn {
  /** Current quota information */
  quotaInfo: QuotaInfo;
  /** Auto-deletion information */
  autoDeletion: AutoDeletionInfo;
  /** Authentication incentive data */
  authIncentive: AuthIncentive;
  /** Freemium badge configuration */
  freemiumBadge: FreemiumBadge;
  /** Can user create new conversation */
  canCreateConversation: boolean;
  /** Manually trigger quota check */
  checkQuota: () => Promise<void>;
  /** Execute auto-deletion */
  executeAutoDeletion: () => Promise<number>;
  /** Dismiss current incentive */
  dismissIncentive: () => void;
  /** Get upgrade benefits list */
  getUpgradeBenefits: () => string[];
  /** Calculate storage usage in bytes */
  getStorageUsage: () => Promise<number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  INCENTIVE_VIEWS: "doodates_incentive_views",
  LAST_CLEANUP: "doodates_last_cleanup",
  DISMISSED_INCENTIVES: "doodates_dismissed_incentives",
} as const;

const UPGRADE_BENEFITS = [
  "Unlimited conversations",
  "Cloud sync across devices",
  "Advanced search & filters",
  "Export conversation history",
  "Priority AI processing",
  "Custom conversation templates",
] as const;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useConversationQuota(
  config: UseConversationQuotaConfig = {},
): UseConversationQuotaReturn {
  const {
    enableAutoDeletion = true,
    retentionDays = CONVERSATION_LIMITS.GUEST_RETENTION_DAYS,
    showAuthIncentives = true,
    maxIncentiveViews = 3,
  } = config;

  const { user, loading: authLoading } = useAuth();
  const storage = useConversationStorage();

  // Local state
  const [incentiveViews, setIncentiveViews] = useState<number>(0);
  const [dismissedIncentives, setDismissedIncentives] = useState<Set<string>>(new Set());
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  // Load persisted state
  useEffect(() => {
    const views = parseInt(localStorage.getItem(STORAGE_KEYS.INCENTIVE_VIEWS) || "0");
    const dismissed = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISMISSED_INCENTIVES) || "[]");
    const cleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP);

    setIncentiveViews(views);
    setDismissedIncentives(new Set(dismissed));
    setLastCleanup(cleanup ? new Date(cleanup) : null);
  }, []);

  // Quota information
  const quotaInfo = useMemo((): QuotaInfo => {
    const { quotaInfo: storageQuota } = storage.storageMode;
    const usagePercentage = Math.round((storageQuota.used / storageQuota.limit) * 100);
    const isInWarningZone = usagePercentage > 75;

    return {
      used: storageQuota.used,
      limit: storageQuota.limit,
      remaining: storageQuota.remaining,
      usagePercentage,
      isAtLimit: storageQuota.isAtLimit,
      isNearLimit: storageQuota.isNearLimit,
      isInWarningZone,
    };
  }, [storage.storageMode.quotaInfo]);

  // Auto-deletion logic
  const autoDeletion = useMemo((): AutoDeletionInfo => {
    if (!enableAutoDeletion || !storage.storageMode.isGuest) {
      return {
        enabled: false,
        candidateCount: 0,
        candidates: [],
        daysUntilNextCleanup: 0,
      };
    }

    const conversations = storage.conversations.data || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const candidates = conversations
      .filter((conv) => conv.createdAt < cutoffDate)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const nextCleanup = lastCleanup
      ? new Date(lastCleanup.getTime() + 24 * 60 * 60 * 1000)
      : new Date();
    const daysUntilNextCleanup = Math.max(
      0,
      Math.ceil((nextCleanup.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );

    return {
      enabled: true,
      candidateCount: candidates.length,
      candidates,
      daysUntilNextCleanup,
    };
  }, [
    enableAutoDeletion,
    storage.storageMode.isGuest,
    storage.conversations.data,
    retentionDays,
    lastCleanup,
  ]);

  // Authentication incentive
  const authIncentive = useMemo((): AuthIncentive => {
    if (!showAuthIncentives || !storage.storageMode.isGuest || authLoading) {
      return {
        shouldShow: false,
        type: "feature_unlock",
        title: "",
        description: "",
        ctaText: "",
        benefits: [],
      };
    }

    const hasReachedMaxViews = incentiveViews >= maxIncentiveViews;

    let type: AuthIncentive["type"] = "feature_unlock";
    let title = "";
    let description = "";
    let ctaText = "Sign Up Free";

    if (quotaInfo.isAtLimit) {
      type = "quota_exceeded";
      title = "Conversation Limit Reached";
      description =
        "You've reached the limit of 10 conversations. Sign up to get unlimited conversations and cloud sync!";
      ctaText = "Upgrade Now";
    } else if (quotaInfo.isInWarningZone) {
      type = "quota_warning";
      title = "Almost at Your Limit";
      description = `You're using ${quotaInfo.usagePercentage}% of your conversation quota. Upgrade to never worry about limits again!`;
      ctaText = "Get Unlimited";
    } else {
      title = "Unlock Premium Features";
      description = "Sign up to get unlimited conversations, cloud sync, and advanced features!";
    }

    const incentiveKey = `${type}_${quotaInfo.used}`;
    const isDismissed = dismissedIncentives.has(incentiveKey);
    const shouldShow =
      !hasReachedMaxViews &&
      !isDismissed &&
      (quotaInfo.isAtLimit || quotaInfo.isInWarningZone || quotaInfo.used >= 3);

    return {
      shouldShow,
      type,
      title,
      description,
      ctaText,
      benefits: [...UPGRADE_BENEFITS],
    };
  }, [
    showAuthIncentives,
    storage.storageMode.isGuest,
    authLoading,
    incentiveViews,
    maxIncentiveViews,
    quotaInfo,
    dismissedIncentives,
  ]);

  // Freemium badge
  const freemiumBadge = useMemo((): FreemiumBadge => {
    if (!storage.storageMode.isGuest) {
      return {
        text: "Pro",
        variant: "success",
        visible: true,
        tooltip: "Unlimited conversations",
      };
    }

    let variant: FreemiumBadge["variant"] = "default";
    let text = `${quotaInfo.remaining}/${quotaInfo.limit}`;
    let tooltip = `${quotaInfo.remaining} conversations remaining`;

    if (quotaInfo.isAtLimit) {
      variant = "destructive";
      text = "Limit Reached";
      tooltip = "Upgrade to create more conversations";
    } else if (quotaInfo.isNearLimit) {
      variant = "warning";
      tooltip = "Almost at limit - consider upgrading";
    }

    return {
      text,
      variant,
      visible: true,
      tooltip,
    };
  }, [storage.storageMode.isGuest, quotaInfo]);

  // Check quota manually
  const checkQuota = useCallback(async () => {
    await storage.refreshFromStorage();
  }, [storage]);

  // Execute auto-deletion
  const executeAutoDeletion = useCallback(async (): Promise<number> => {
    if (!autoDeletion.enabled || autoDeletion.candidateCount === 0) {
      return 0;
    }

    let deletedCount = 0;

    for (const conversation of autoDeletion.candidates) {
      try {
        await storage.deleteConversation.mutateAsync(conversation.id);
        deletedCount++;
      } catch (error) {
        logError(
          ErrorFactory.storage(
            `Failed to auto-delete conversation ${conversation.id}`,
            "Impossible de supprimer automatiquement une conversation"
          ),
          { component: "useConversationQuota", operation: "autoDeleteOldConversations", metadata: { conversationId: conversation.id, error } }
        );
      }
    }

    // Update last cleanup time
    const now = new Date();
    setLastCleanup(now);
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toISOString());

    return deletedCount;
  }, [autoDeletion, storage.deleteConversation]);

  // Dismiss incentive
  const dismissIncentive = useCallback(() => {
    const incentiveKey = `${authIncentive.type}_${quotaInfo.used}`;
    const newDismissed = new Set(dismissedIncentives);
    newDismissed.add(incentiveKey);

    setDismissedIncentives(newDismissed);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_INCENTIVES, JSON.stringify([...newDismissed]));

    // Increment view count
    const newViews = incentiveViews + 1;
    setIncentiveViews(newViews);
    localStorage.setItem(STORAGE_KEYS.INCENTIVE_VIEWS, newViews.toString());
  }, [authIncentive.type, quotaInfo.used, dismissedIncentives, incentiveViews]);

  // Get upgrade benefits
  const getUpgradeBenefits = useCallback((): string[] => {
    return [...UPGRADE_BENEFITS];
  }, []);

  // Calculate storage usage
  const getStorageUsage = useCallback(async (): Promise<number> => {
    try {
      const conversations = storage.conversations.data || [];
      let totalSize = 0;

      for (const conversation of conversations) {
        // Calculate conversation size
        totalSize += JSON.stringify(conversation).length;

        // Add messages size (if available)
        // Note: This would need to be implemented when we have message queries
        // const messages = await storage.getMessages(conversation.id);
        // totalSize += JSON.stringify(messages).length;
      }

      return totalSize;
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to calculate storage usage",
          "Impossible de calculer l'utilisation du stockage",
        ),
        {
          component: "useConversationQuota",
          metadata: { originalError: error },
        },
      );
      return 0;
    }
  }, [storage.conversations.data]);

  // Auto-cleanup effect
  useEffect(() => {
    if (
      autoDeletion.enabled &&
      autoDeletion.candidateCount > 0 &&
      autoDeletion.daysUntilNextCleanup <= 0
    ) {
      executeAutoDeletion().catch((error) => {
        logError(
          ErrorFactory.storage("Auto-deletion failed", "Échec de la suppression automatique"),
          {
            component: "useConversationQuota",
            metadata: { originalError: error },
          },
        );
      });
    }
  }, [autoDeletion, executeAutoDeletion]);

  return {
    quotaInfo,
    autoDeletion,
    authIncentive,
    freemiumBadge,
    canCreateConversation: storage.canCreateConversation,
    checkQuota,
    executeAutoDeletion,
    dismissIncentive,
    getUpgradeBenefits,
    getStorageUsage,
  };
}

export default useConversationQuota;
