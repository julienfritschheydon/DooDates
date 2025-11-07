/**
 * Hook for managing freemium quota limits and authentication incentives
 * DooDates - Freemium Quota Management System
 */
export interface QuotaLimits {
    conversations: number;
    polls: number;
    storageSize: number;
}
export interface QuotaUsage {
    conversations: number;
    polls: number;
    storageUsed: number;
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
export declare const useFreemiumQuota: () => {
    limits: QuotaLimits;
    usage: QuotaUsage;
    status: QuotaStatus;
    isAuthenticated: boolean;
    canCreateConversation: () => boolean;
    canCreatePoll: () => boolean;
    canUseFeature: (feature: string) => boolean;
    checkConversationLimit: () => boolean;
    checkPollLimit: () => boolean;
    checkFeatureAccess: (feature: string) => boolean;
    showAuthModal: boolean;
    authModalTrigger: "conversation_limit" | "poll_limit" | "storage_full" | "feature_locked";
    showAuthIncentive: (trigger: "conversation_limit" | "poll_limit" | "storage_full" | "feature_locked") => void;
    closeAuthModal: () => void;
    getRemainingConversations: () => number;
    getRemainingPolls: () => number;
    getStoragePercentage: () => number;
};
export default useFreemiumQuota;
