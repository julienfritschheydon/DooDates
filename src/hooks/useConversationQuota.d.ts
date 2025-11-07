/**
 * Hook useConversationQuota
 * Manages conversation quotas, automatic deletion, and authentication incentives
 * DooDates - Conversation History System
 */
import { type Conversation } from "../types/conversation";
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
export declare function useConversationQuota(config?: UseConversationQuotaConfig): UseConversationQuotaReturn;
export default useConversationQuota;
