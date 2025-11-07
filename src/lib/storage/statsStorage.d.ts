/**
 * Lifetime statistics storage for quota management
 * DooDates - Anti-cheat quota system
 */
export type ContentType = "conversations" | "polls";
interface LifetimeStats {
  conversations: {
    totalCreated: number;
  };
  polls: {
    totalCreated: number;
  };
}
/**
 * Get lifetime count for a content type
 */
export declare function getLifetimeCount(type: ContentType): number;
/**
 * Increment lifetime count for a content type
 * Called ONLY on successful creation
 */
export declare function incrementLifetimeCount(type: ContentType): void;
/**
 * Reset lifetime count for a content type
 * ADMIN ONLY - for testing or data cleanup
 */
export declare function resetLifetimeCount(type: ContentType): void;
/**
 * Get all lifetime stats
 */
export declare function getAllLifetimeStats(): LifetimeStats;
/**
 * Check if creation is allowed based on quota
 */
export declare function canCreate(type: ContentType, limit: number): boolean;
/**
 * Get quota usage info for UI display
 */
export declare function getQuotaUsage(
  type: ContentType,
  limit: number,
): {
  totalCreated: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
  usagePercentage: number;
};
export {};
