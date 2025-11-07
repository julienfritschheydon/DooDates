/**
 * Unified quota management hook
 * Consolidates useConversationQuota and useFreemiumQuota functionality
 * DooDates - Quota Management System
 */
import { type Conversation } from "../types/conversation";
export interface QuotaLimits {
    conversations: number;
    polls: number;
    storageSize: number;
    retentionDays: number;
}
export interface QuotaUsage {
    conversations: number;
    polls: number;
    storageUsed: number;
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
    type: "quota_warning" | "quota_exceeded" | "feature_unlock" | "conversation_limit" | "poll_limit" | "storage_full";
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
    limits: QuotaLimits;
    usage: QuotaUsage;
    status: QuotaStatus;
    quotaInfo: QuotaInfo;
    isAuthenticated: boolean;
    autoDeletion: AutoDeletionInfo;
    authIncentive: AuthIncentive;
    freemiumBadge: FreemiumBadge;
    showAuthModal: boolean;
    authModalTrigger: AuthIncentive["type"];
    canCreateConversation: boolean;
    canCreatePoll: boolean;
    canUseFeature: (feature: string) => boolean;
    checkConversationLimit: () => boolean;
    checkPollLimit: () => boolean;
    checkFeatureAccess: (feature: string) => boolean;
    checkQuota: () => Promise<void>;
    executeAutoDeletion: () => Promise<number>;
    dismissIncentive: () => void;
    showAuthIncentive: (trigger: AuthIncentive["type"]) => void;
    closeAuthModal: () => void;
    getUpgradeBenefits: () => string[];
    getStorageUsage: () => Promise<number>;
    getRemainingConversations: () => number;
    getRemainingPolls: () => number;
    getStoragePercentage: () => number;
}
export declare function useQuota(config?: UseQuotaConfig): UseQuotaReturn;
export default useQuota;
