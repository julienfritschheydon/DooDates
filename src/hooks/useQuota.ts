/**
 * Unified quota management hook
 * Consolidates useConversationQuota and useFreemiumQuota functionality
 * DooDates - Quota Management System
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useConversationStorage } from "./useConversationStorage";
import {
  CONVERSATION_LIMITS,
  ConversationError,
  CONVERSATION_ERROR_CODES,
  type Conversation,
} from "../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QuotaLimits {
  conversations: number;
  polls: number;
  storageSize: number; // in MB
  retentionDays: number;
}

export interface QuotaUsage {
  conversations: number;
  polls: number;
  storageUsed: number; // in MB
}

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

export interface ResourceStatus {
  used: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export interface QuotaStatus {
  conversations: ResourceStatus;
  polls: ResourceStatus;
  storage: ResourceStatus;
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
  type:
    | "quota_warning"
    | "quota_exceeded"
    | "feature_unlock"
    | "conversation_limit"
    | "poll_limit"
    | "storage_full";
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

export interface UseQuotaConfig {
  /** Enable automatic deletion of old conversations */
  enableAutoDeletion?: boolean;
  /** Show authentication incentives */
  showAuthIncentives?: boolean;
  /** Auto-dismiss incentives after this many views */
  maxIncentiveViews?: number;
}

export interface UseQuotaReturn {
  // Quota information
  limits: QuotaLimits;
  usage: QuotaUsage;
  status: QuotaStatus;
  quotaInfo: QuotaInfo;
  isAuthenticated: boolean;

  // Auto-deletion
  autoDeletion: AutoDeletionInfo;

  // UI components
  authIncentive: AuthIncentive;
  freemiumBadge: FreemiumBadge;
  showAuthModal: boolean;
  authModalTrigger: AuthIncentive["type"];

  // Permission checks
  canCreateConversation: boolean;
  canCreatePoll: boolean;
  canUseFeature: (feature: string) => boolean;

  // Enforcement functions
  checkConversationLimit: () => boolean;
  checkPollLimit: () => boolean;
  checkFeatureAccess: (feature: string) => boolean;

  // Actions
  checkQuota: () => Promise<void>;
  executeAutoDeletion: () => Promise<number>;
  dismissIncentive: () => void;
  showAuthIncentive: (trigger: AuthIncentive["type"]) => void;
  closeAuthModal: () => void;

  // Utility functions
  getUpgradeBenefits: () => string[];
  getStorageUsage: () => Promise<number>;
  getRemainingConversations: () => number;
  getRemainingPolls: () => number;
  getStoragePercentage: () => number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GUEST_LIMITS: QuotaLimits = {
  conversations: CONVERSATION_LIMITS.GUEST_MAX_CONVERSATIONS,
  polls: 5,
  storageSize: 50, // 50MB
  retentionDays: CONVERSATION_LIMITS.GUEST_RETENTION_DAYS,
};

const AUTHENTICATED_LIMITS: QuotaLimits = {
  conversations: 1000,
  polls: 100,
  storageSize: 1000, // 1GB
  retentionDays: 365, // 1 year
};

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
  "Extended data retention",
  "Premium support",
] as const;

const LOCKED_FEATURES = [
  "export",
  "advanced_analytics",
  "custom_branding",
] as const;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useQuota(config: UseQuotaConfig = {}): UseQuotaReturn {
  const {
    enableAutoDeletion = true,
    showAuthIncentives = true,
    maxIncentiveViews = 3,
  } = config;

  const { user, loading: authLoading } = useAuth();
  const storage = useConversationStorage();

  // Local state
  const [incentiveViews, setIncentiveViews] = useState<number>(0);
  const [dismissedIncentives, setDismissedIncentives] = useState<Set<string>>(
    new Set(),
  );
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTrigger, setAuthModalTrigger] =
    useState<AuthIncentive["type"]>("conversation_limit");

  const isAuthenticated = !!user;
  const limits = isAuthenticated ? AUTHENTICATED_LIMITS : GUEST_LIMITS;

  // Load persisted state
  useEffect(() => {
    try {
      const views = parseInt(
        localStorage.getItem(STORAGE_KEYS.INCENTIVE_VIEWS) || "0",
      );
      const dismissed = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.DISMISSED_INCENTIVES) || "[]",
      );
      const cleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP);

      setIncentiveViews(views);
      setDismissedIncentives(new Set(dismissed));
      setLastCleanup(cleanup ? new Date(cleanup) : null);
    } catch (error) {
      console.warn("Error loading quota state from localStorage:", error);
    }
  }, []);

  // Calculate current usage
  const calculateUsage = useCallback((): QuotaUsage => {
    // Get conversation count from storage
    let conversationCount = 0;
    try {
      const storageData = localStorage.getItem("doodates_conversations");
      if (storageData) {
        if (storageData.startsWith("{") || storageData.startsWith("[")) {
          const data = JSON.parse(storageData);
          conversationCount = Object.keys(data.conversations || {}).length;
        } else {
          localStorage.removeItem("doodates_conversations");
          conversationCount = 0;
        }
      }
    } catch (error) {
      console.warn("Could not get conversation count:", error);
      localStorage.removeItem("doodates_conversations");
      conversationCount = 0;
    }

    // Estimate storage usage from localStorage
    let storageUsed = 0;
    try {
      const storage = JSON.stringify(localStorage);
      storageUsed = new Blob([storage]).size / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.warn("Could not calculate storage usage:", error);
    }

    // Get poll count from localStorage
    let pollCount = 0;
    try {
      const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      pollCount = polls.length;
    } catch (error) {
      console.warn("Could not get poll count:", error);
    }

    return {
      conversations: conversationCount,
      polls: pollCount,
      storageUsed,
    };
  }, []);

  const usage = useMemo(() => calculateUsage(), [calculateUsage]);

  // Calculate quota status
  const status = useMemo((): QuotaStatus => {
    const calculateStatus = (used: number, limit: number): ResourceStatus => {
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
  }, [usage, limits]);

  // Quota information (legacy compatibility)
  const quotaInfo = useMemo((): QuotaInfo => {
    const conversationStatus = status.conversations;
    const isInWarningZone = conversationStatus.percentage > 75;

    return {
      used: conversationStatus.used,
      limit: conversationStatus.limit,
      remaining: Math.max(
        0,
        conversationStatus.limit - conversationStatus.used,
      ),
      usagePercentage: Math.round(conversationStatus.percentage),
      isAtLimit: conversationStatus.isAtLimit,
      isNearLimit: conversationStatus.isNearLimit,
      isInWarningZone,
    };
  }, [status.conversations]);

  // Auto-deletion logic
  const autoDeletion = useMemo((): AutoDeletionInfo => {
    if (!enableAutoDeletion || isAuthenticated) {
      return {
        enabled: false,
        candidateCount: 0,
        candidates: [],
        daysUntilNextCleanup: 0,
      };
    }

    const conversations = storage.conversations.data || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - limits.retentionDays);

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
    isAuthenticated,
    storage.conversations.data,
    limits.retentionDays,
    lastCleanup,
  ]);

  // Authentication incentive
  const authIncentive = useMemo((): AuthIncentive => {
    if (!showAuthIncentives || isAuthenticated || authLoading) {
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

    if (status.conversations.isAtLimit) {
      type = "conversation_limit";
      title = "Conversation Limit Reached";
      description = `You've reached the limit of ${limits.conversations} conversations. Sign up to get unlimited conversations and cloud sync!`;
      ctaText = "Upgrade Now";
    } else if (status.conversations.isNearLimit) {
      type = "quota_warning";
      title = "Almost at Your Limit";
      description = `You're using ${Math.round(status.conversations.percentage)}% of your conversation quota. Upgrade to never worry about limits again!`;
      ctaText = "Get Unlimited";
    } else if (status.polls.isAtLimit) {
      type = "poll_limit";
      title = "Poll Limit Reached";
      description = `You've reached the limit of ${limits.polls} polls. Sign up to create unlimited polls!`;
      ctaText = "Upgrade Now";
    } else if (status.storage.isAtLimit) {
      type = "storage_full";
      title = "Storage Full";
      description = `You've used all ${limits.storageSize}MB of storage. Sign up for ${AUTHENTICATED_LIMITS.storageSize}MB of storage!`;
      ctaText = "Get More Storage";
    } else {
      title = "Unlock Premium Features";
      description =
        "Sign up to get unlimited conversations, cloud sync, and advanced features!";
    }

    const incentiveKey = `${type}_${quotaInfo.used}`;
    const isDismissed = dismissedIncentives.has(incentiveKey);
    const shouldShow =
      !hasReachedMaxViews &&
      !isDismissed &&
      (status.conversations.isAtLimit ||
        status.conversations.isNearLimit ||
        status.polls.isAtLimit ||
        status.storage.isAtLimit ||
        quotaInfo.used >= 3);

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
    isAuthenticated,
    authLoading,
    incentiveViews,
    maxIncentiveViews,
    status,
    limits,
    quotaInfo.used,
    dismissedIncentives,
  ]);

  // Freemium badge
  const freemiumBadge = useMemo((): FreemiumBadge => {
    if (isAuthenticated) {
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
  }, [isAuthenticated, quotaInfo]);

  // Permission checks
  const canCreateConversation = useCallback(() => {
    return !status.conversations.isAtLimit;
  }, [status.conversations.isAtLimit]);

  const canCreatePoll = useCallback(() => {
    return !status.polls.isAtLimit;
  }, [status.polls.isAtLimit]);

  const canUseFeature = useCallback(
    (feature: string) => {
      if (!isAuthenticated) {
        return !LOCKED_FEATURES.includes(feature as any);
      }
      return true;
    },
    [isAuthenticated],
  );

  // Show authentication incentive modal
  const showAuthIncentiveModal = useCallback(
    (trigger: AuthIncentive["type"]) => {
      setAuthModalTrigger(trigger);
      setShowAuthModal(true);
    },
    [],
  );

  // Enforcement functions
  const checkConversationLimit = useCallback(() => {
    if (!canCreateConversation()) {
      showAuthIncentiveModal("conversation_limit");
      return false;
    }

    if (status.conversations.isNearLimit && !isAuthenticated) {
      console.warn(
        `Approaching conversation limit: ${status.conversations.used}/${status.conversations.limit}`,
      );
    }

    return true;
  }, [
    canCreateConversation,
    showAuthIncentiveModal,
    status.conversations,
    isAuthenticated,
  ]);

  const checkPollLimit = useCallback(() => {
    if (!canCreatePoll()) {
      showAuthIncentiveModal("poll_limit");
      return false;
    }
    return true;
  }, [canCreatePoll, showAuthIncentiveModal]);

  const checkFeatureAccess = useCallback(
    (feature: string) => {
      if (!canUseFeature(feature)) {
        showAuthIncentiveModal("feature_unlock");
        return false;
      }
      return true;
    },
    [canUseFeature, showAuthIncentiveModal],
  );

  // Actions
  const checkQuota = useCallback(async () => {
    await storage.refreshFromStorage();
  }, [storage]);

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
        console.warn(
          `Failed to auto-delete conversation ${conversation.id}:`,
          error,
        );
      }
    }

    // Update last cleanup time
    const now = new Date();
    setLastCleanup(now);
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toISOString());

    return deletedCount;
  }, [autoDeletion, storage.deleteConversation]);

  const dismissIncentive = useCallback(() => {
    const incentiveKey = `${authIncentive.type}_${quotaInfo.used}`;
    const newDismissed = new Set(dismissedIncentives);
    newDismissed.add(incentiveKey);

    setDismissedIncentives(newDismissed);
    localStorage.setItem(
      STORAGE_KEYS.DISMISSED_INCENTIVES,
      JSON.stringify([...newDismissed]),
    );

    // Increment view count
    const newViews = incentiveViews + 1;
    setIncentiveViews(newViews);
    localStorage.setItem(STORAGE_KEYS.INCENTIVE_VIEWS, newViews.toString());
  }, [authIncentive.type, quotaInfo.used, dismissedIncentives, incentiveViews]);

  // Utility functions
  const getUpgradeBenefits = useCallback((): string[] => {
    return [...UPGRADE_BENEFITS];
  }, []);

  const getStorageUsage = useCallback(async (): Promise<number> => {
    try {
      const conversations = storage.conversations.data || [];
      let totalSize = 0;

      for (const conversation of conversations) {
        totalSize += JSON.stringify(conversation).length;
      }

      return totalSize;
    } catch (error) {
      console.warn("Failed to calculate storage usage:", error);
      return 0;
    }
  }, [storage.conversations.data]);

  const getRemainingConversations = useCallback(() => {
    return Math.max(0, limits.conversations - usage.conversations);
  }, [limits.conversations, usage.conversations]);

  const getRemainingPolls = useCallback(() => {
    return Math.max(0, limits.polls - usage.polls);
  }, [limits.polls, usage.polls]);

  const getStoragePercentage = useCallback(() => {
    return status.storage.percentage;
  }, [status.storage.percentage]);

  // Auto-cleanup effect
  useEffect(() => {
    if (
      !autoDeletion.enabled ||
      autoDeletion.candidateCount === 0 ||
      autoDeletion.daysUntilNextCleanup > 0
    ) {
      return;
    }

    executeAutoDeletion().catch((error) => {
      console.warn("Auto-deletion failed:", error);
    });
  }, [
    autoDeletion.enabled,
    autoDeletion.candidateCount,
    autoDeletion.daysUntilNextCleanup,
    executeAutoDeletion,
  ]);

  // Monitor storage usage
  useEffect(() => {
    if (!status.storage.isNearLimit || isAuthenticated) {
      return;
    }

    console.warn(
      `Storage usage high: ${status.storage.used.toFixed(1)}MB/${status.storage.limit}MB`,
    );
  }, [
    status.storage.isNearLimit,
    status.storage.used,
    status.storage.limit,
    isAuthenticated,
  ]);

  return {
    // Quota information
    limits,
    usage,
    status,
    quotaInfo,
    isAuthenticated,

    // Auto-deletion
    autoDeletion,

    // UI components
    authIncentive,
    freemiumBadge,
    showAuthModal,
    authModalTrigger,

    // Permission checks
    canCreateConversation: canCreateConversation(),
    canCreatePoll: canCreatePoll(),
    canUseFeature,

    // Enforcement functions
    checkConversationLimit,
    checkPollLimit,
    checkFeatureAccess,

    // Actions
    checkQuota,
    executeAutoDeletion,
    dismissIncentive,
    showAuthIncentive: showAuthIncentiveModal,
    closeAuthModal: () => setShowAuthModal(false),

    // Utility functions
    getUpgradeBenefits,
    getStorageUsage,
    getRemainingConversations,
    getRemainingPolls,
    getStoragePercentage,
  };
}

export default useQuota;
