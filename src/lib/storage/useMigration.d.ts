import { MigrationProgress, MigrationResult } from "./ConversationMigrationService";
/**
 * Hook for managing conversation migration from localStorage to Supabase
 * Provides migration status, progress tracking, and control functions
 */
export declare function useMigration(supabaseUrl: string, supabaseKey: string): {
    isInitialized: boolean;
    migrationNeeded: boolean;
    progress: MigrationProgress;
    result: MigrationResult;
    startMigration: () => Promise<MigrationResult | null>;
    cancelMigration: () => void;
    autoStartMigration: () => Promise<MigrationResult>;
    getCurrentProgress: () => MigrationProgress | null;
    isInProgress: boolean;
    isCompleted: boolean;
    isFailed: boolean;
    isRolledBack: boolean;
    progressPercentage: number;
    conversationProgress: number;
    messageProgress: number;
};
