/**
 * Hook for managing freemium quota limits and authentication incentives
 * DooDates - Freemium Quota Management System
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { logError, ErrorFactory } from "../lib/error-handling";
import { useConversations } from "./useConversations";

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

const GUEST_LIMITS: QuotaLimits = {
  conversations: 10,
  polls: 5,
  storageSize: 50, // 50MB
};

const AUTHENTICATED_LIMITS: QuotaLimits = {
  conversations: 1000,
  polls: 100,
  storageSize: 1000, // 1GB
};

export const useFreemiumQuota = () => {
  const { user } = useAuth();
  const conversations = useConversations();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTrigger, setAuthModalTrigger] = useState<
    "conversation_limit" | "poll_limit" | "feature_locked" | "storage_full"
  >("conversation_limit");

  const isAuthenticated = !!user;
  const limits = isAuthenticated ? AUTHENTICATED_LIMITS : GUEST_LIMITS;

  // Calculate current usage
  const calculateUsage = useCallback((): QuotaUsage => {
    // Get conversation count from localStorage (dev implementation)
    let conversationCount = 0;
    try {
      const storageData = localStorage.getItem("doodates_conversations");
      if (storageData) {
        // Check if data is valid JSON before parsing
        if (storageData.startsWith("{") || storageData.startsWith("[")) {
          const data = JSON.parse(storageData);
          conversationCount = Object.keys(data.conversations || {}).length;
        } else {
          // Data is corrupted, clear it
          localStorage.removeItem("doodates_conversations");
          conversationCount = 0;
        }
      }
    } catch (error) {
      logError(
        ErrorFactory.storage("Failed to get conversation count", "Impossible de compter les conversations"),
        { component: "useFreemiumQuota", metadata: { originalError: error } }
      );
      // Clear corrupted data
      localStorage.removeItem("doodates_conversations");
      conversationCount = 0;
    }

    // Estimate storage usage from localStorage
    let storageUsed = 0;
    try {
      const storage = JSON.stringify(localStorage);
      storageUsed = new Blob([storage]).size / (1024 * 1024); // Convert to MB
    } catch (error) {
      logError(
        ErrorFactory.storage("Failed to calculate storage usage", "Impossible de calculer l'utilisation du stockage"),
        { component: "useFreemiumQuota", metadata: { originalError: error } }
      );
    }

    // Get poll count from localStorage (dev implementation)
    let pollCount = 0;
    try {
      const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
      pollCount = polls.length;
    } catch (error) {
      logError(
        ErrorFactory.storage("Failed to get poll count", "Impossible de compter les sondages"),
        { component: "useFreemiumQuota", metadata: { originalError: error } }
      );
    }

    return {
      conversations: conversationCount,
      polls: pollCount,
      storageUsed,
    };
  }, []);

  // Calculate quota status
  const getQuotaStatus = useCallback((): QuotaStatus => {
    const usage = calculateUsage();

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
  }, [calculateUsage, limits]);

  // Check if action is allowed
  const canCreateConversation = useCallback(() => {
    const status = getQuotaStatus();
    return !status.conversations.isAtLimit;
  }, [getQuotaStatus]);

  const canCreatePoll = useCallback(() => {
    const status = getQuotaStatus();
    return !status.polls.isAtLimit;
  }, [getQuotaStatus]);

  const canUseFeature = useCallback(
    (feature: string) => {
      // Some features are locked for guest users
      if (!isAuthenticated) {
        const lockedFeatures = [
          "export",
          "advanced_analytics",
          "custom_branding",
        ];
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
  const checkConversationLimit = useCallback(() => {
    if (!canCreateConversation()) {
      showAuthIncentive("conversation_limit");
      return false;
    }

    const status = getQuotaStatus();
    if (status.conversations.isNearLimit && !isAuthenticated) {
      // Show warning but allow action
      console.warn(
        `Approaching conversation limit: ${status.conversations.used}/${status.conversations.limit}`,
      );
    }

    return true;
  }, [
    canCreateConversation,
    showAuthIncentive,
    getQuotaStatus,
    isAuthenticated,
  ]);

  const checkPollLimit = useCallback(() => {
    if (!canCreatePoll()) {
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
      console.warn(
        `Storage usage high: ${status.storage.used.toFixed(1)}MB/${status.storage.limit}MB`,
      );
    }
  }, [getQuotaStatus, isAuthenticated]);

  return {
    // Quota information
    limits,
    usage: calculateUsage(),
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
    getRemainingConversations: () =>
      Math.max(0, limits.conversations - calculateUsage().conversations),
    getRemainingPolls: () => Math.max(0, limits.polls - calculateUsage().polls),
    getStoragePercentage: () => getQuotaStatus().storage.percentage,
  };
};

export default useFreemiumQuota;
