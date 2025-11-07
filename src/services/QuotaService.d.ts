/**
 * QuotaService - Business logic for quota management
 * Extracted from quota hooks to improve separation of concerns
 */
export type AuthIncentiveType = "quota_warning" | "quota_exceeded" | "feature_unlock" | "conversation_limit" | "poll_limit" | "storage_full";
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
    used: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
}
export declare class QuotaService {
    static readonly GUEST_LIMITS: QuotaLimits;
    static readonly AUTHENTICATED_LIMITS: QuotaLimits;
    /**
     * Calculate quota status for a specific resource
     */
    static calculateStatus(used: number, limit: number): QuotaStatus;
    /**
     * Get storage size from localStorage
     */
    static getStorageSize(): number;
    /**
     * Get conversation count from storage
     */
    static getConversationCount(): number;
    /**
     * Get poll count from storage
     */
    static getPollCount(): number;
    /**
     * Calculate current usage
     */
    static calculateUsage(): QuotaUsage;
    /**
     * Check if user can create new conversation
     */
    static canCreateConversation(isAuthenticated: boolean): boolean;
    /**
     * Check if user can create new poll
     */
    static canCreatePoll(isAuthenticated: boolean): boolean;
    /**
     * Get appropriate auth incentive type based on quota status
     */
    static getAuthIncentiveType(isAuthenticated: boolean): AuthIncentiveType;
    /**
     * Find old conversations for auto-deletion
     */
    static findOldConversations(dayThreshold?: number): string[];
    /**
     * Delete conversations by IDs
     */
    static deleteConversations(conversationIds: string[]): Promise<number>;
}
