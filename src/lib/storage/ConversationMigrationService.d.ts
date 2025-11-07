/**
 * Migration status types
 */
export type MigrationStatus = "not_started" | "in_progress" | "validating" | "uploading" | "verifying" | "completed" | "failed" | "rolled_back";
/**
 * Migration progress information
 */
export interface MigrationProgress {
    status: MigrationStatus;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    processedConversations: number;
    totalConversations: number;
    processedMessages: number;
    totalMessages: number;
    errors: string[];
    startTime: Date;
    endTime?: Date;
}
/**
 * Migration result summary
 */
export interface MigrationResult {
    success: boolean;
    migratedConversations: number;
    migratedMessages: number;
    errors: string[];
    duration: number;
    rollbackPerformed: boolean;
}
/**
 * Migration configuration options
 */
export interface MigrationOptions {
    batchSize: number;
    validateBeforeUpload: boolean;
    enableRollback: boolean;
    retryAttempts: number;
    retryDelay: number;
    onProgress?: (progress: MigrationProgress) => void;
    onError?: (error: string) => void;
    onComplete?: (result: MigrationResult) => void;
}
/**
 * Service for migrating conversations from localStorage to Supabase
 * Handles validation, error recovery, progress tracking, and rollback
 */
export declare class ConversationMigrationService {
    private supabase;
    private progress;
    private options;
    private migrationId;
    private abortController;
    private static readonly DEFAULT_OPTIONS;
    constructor(supabaseUrl: string, supabaseKey: string, options?: Partial<MigrationOptions>);
    /**
     * Check if migration is needed
     */
    static isMigrationNeeded(): Promise<boolean>;
    /**
     * Start the migration process
     */
    migrate(): Promise<MigrationResult>;
    /**
     * Cancel ongoing migration
     */
    cancelMigration(): void;
    /**
     * Get current migration progress
     */
    getProgress(): MigrationProgress;
    /**
     * Export data from localStorage
     */
    private exportLocalStorageData;
    /**
     * Validate migration data integrity
     */
    private validateMigrationData;
    /**
     * Setup Supabase connection and check authentication
     */
    private setupSupabaseConnection;
    /**
     * Upload data to Supabase in batches
     */
    private uploadToSupabase;
    /**
     * Upload a batch of conversations
     */
    private uploadConversationBatch;
    /**
     * Upload a batch of messages
     */
    private uploadMessageBatch;
    /**
     * Verify migration integrity
     */
    private verifyMigration;
    /**
     * Perform rollback on failed migration
     */
    private performRollback;
    /**
     * Mark migration as complete
     */
    private markMigrationComplete;
    /**
     * Create batches from array
     */
    private createBatches;
    /**
     * Update progress and notify listeners
     */
    private updateProgress;
    /**
     * Notify progress listeners
     */
    private notifyProgress;
    /**
     * Complete migration and return result
     */
    private completeMigration;
}
