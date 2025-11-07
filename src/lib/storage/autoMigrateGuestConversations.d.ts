/**
 * Auto-migrate guest conversations to Supabase when user logs in
 * DooDates - Conversation History System
 */
/**
 * Check if guest conversations have already been migrated for this user
 */
export declare function hasMigratedGuestConversations(userId: string): boolean;
/**
 * Migrate guest conversations to Supabase for the logged-in user
 */
export declare function migrateGuestConversations(userId: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}>;
