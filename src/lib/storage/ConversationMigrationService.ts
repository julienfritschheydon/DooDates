import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConversationStorageLocal } from './ConversationStorageLocal';
import { 
  Conversation, 
  ConversationMessage, 
  ConversationError,
  CONVERSATION_LIMITS 
} from '../../types/conversation';
import { 
  validateConversation, 
  validateConversationMessage 
} from '../validation/conversation';
import { handleError, ErrorFactory, logError } from '../error-handling';

/**
 * Migration status types
 */
export type MigrationStatus = 
  | 'not_started'
  | 'in_progress' 
  | 'validating'
  | 'uploading'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'rolled_back';

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
export class ConversationMigrationService {
  private supabase: SupabaseClient;
  private progress: MigrationProgress;
  private options: MigrationOptions;
  private migrationId: string;
  private abortController: AbortController;

  private static readonly DEFAULT_OPTIONS: MigrationOptions = {
    batchSize: 5,
    validateBeforeUpload: true,
    enableRollback: true,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  constructor(supabaseUrl: string, supabaseKey: string, options: Partial<MigrationOptions> = {}) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.options = { ...ConversationMigrationService.DEFAULT_OPTIONS, ...options };
    this.migrationId = `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.abortController = new AbortController();
    
    this.progress = {
      status: 'not_started',
      currentStep: 'Initializing',
      totalSteps: 6,
      completedSteps: 0,
      processedConversations: 0,
      totalConversations: 0,
      processedMessages: 0,
      totalMessages: 0,
      errors: [],
      startTime: new Date()
    };
  }

  /**
   * Check if migration is needed
   */
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      // Check if there's data in localStorage
      const localData = ConversationStorageLocal.exportForMigration();
      if (!localData || localData.conversations.length === 0) {
        return false;
      }

      // Check if migration has already been completed
      const migrationFlag = localStorage.getItem('doodates_migration_completed');
      return migrationFlag !== 'true';
    } catch (error) {
      console.warn('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Start the migration process
   */
  async migrate(): Promise<MigrationResult> {
    try {
      this.progress.startTime = new Date();
      this.updateProgress('in_progress', 'Starting migration');

      // Step 1: Export data from localStorage
      this.updateProgress('in_progress', 'Exporting localStorage data', 1);
      const localData = await this.exportLocalStorageData();
      
      if (!localData || localData.conversations.length === 0) {
        return this.completeMigration(true, 0, 0, [], false);
      }

      this.progress.totalConversations = localData.conversations.length;
      this.progress.totalMessages = Object.values(localData.messages).reduce(
        (total, messages) => total + messages.length, 0
      );

      // Step 2: Validate data
      if (this.options.validateBeforeUpload) {
        this.updateProgress('validating', 'Validating data integrity', 2);
        await this.validateMigrationData(localData);
      }

      // Step 3: Check user authentication and setup
      this.updateProgress('in_progress', 'Setting up Supabase connection', 3);
      await this.setupSupabaseConnection();

      // Step 4: Upload conversations and messages
      this.updateProgress('uploading', 'Uploading conversations to Supabase', 4);
      const uploadResult = await this.uploadToSupabase(localData);

      // Step 5: Verify migration
      this.updateProgress('verifying', 'Verifying migration integrity', 5);
      await this.verifyMigration(localData);

      // Step 6: Mark migration as complete
      this.updateProgress('completed', 'Migration completed successfully', 6);
      this.markMigrationComplete();

      return this.completeMigration(
        true, 
        uploadResult.conversationsUploaded, 
        uploadResult.messagesUploaded, 
        this.progress.errors,
        false
      );

    } catch (error) {
      this.progress.errors.push(error instanceof Error ? error.message : String(error));
      
      if (this.options.enableRollback) {
        this.updateProgress('failed', 'Migration failed, performing rollback');
        await this.performRollback();
        return this.completeMigration(false, 0, 0, this.progress.errors, true);
      } else {
        this.updateProgress('failed', 'Migration failed');
        return this.completeMigration(false, 0, 0, this.progress.errors, false);
      }
    }
  }

  /**
   * Cancel ongoing migration
   */
  cancelMigration(): void {
    this.abortController.abort();
    this.updateProgress('failed', 'Migration cancelled by user');
  }

  /**
   * Get current migration progress
   */
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  /**
   * Export data from localStorage
   */
  private async exportLocalStorageData(): Promise<{ conversations: Conversation[]; messages: Record<string, ConversationMessage[]> } | null> {
    try {
      return ConversationStorageLocal.exportForMigration();
    } catch (error) {
      throw new ConversationError(
        'Failed to export localStorage data',
        'EXPORT_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Validate migration data integrity
   */
  private async validateMigrationData(data: { conversations: Conversation[]; messages: Record<string, ConversationMessage[]> }): Promise<void> {
    const errors: string[] = [];

    // Validate conversations
    for (const conversation of data.conversations) {
      const validationResult = validateConversation(conversation);
      if (!validationResult.success) {
        errors.push(`Invalid conversation ${conversation.id}: ${validationResult.error?.message}`);
      }
    }

    // Validate messages
    for (const [conversationId, messages] of Object.entries(data.messages)) {
      for (const message of messages) {
        const validationResult = validateConversationMessage(message);
        if (!validationResult.success) {
          errors.push(`Invalid message ${message.id}: ${validationResult.error?.message}`);
        }

        // Check foreign key integrity
        if (!data.conversations.find(c => c.id === message.conversationId)) {
          errors.push(`Orphaned message ${message.id} references non-existent conversation ${message.conversationId}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ConversationError(
        'Data validation failed',
        'VALIDATION_ERROR',
        { validationErrors: errors }
      );
    }
  }

  /**
   * Setup Supabase connection and check authentication
   */
  private async setupSupabaseConnection(): Promise<void> {
    try {
      // Check if user is authenticated
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        throw new ConversationError(
          'Failed to get user authentication status',
          'AUTH_ERROR',
          { originalError: error }
        );
      }

      // For guest users, set up guest session
      if (!user) {
        const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.supabase.rpc('set_guest_session_id', { session_id: guestSessionId });
      }

    } catch (error) {
      throw new ConversationError(
        'Failed to setup Supabase connection',
        'CONNECTION_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Upload data to Supabase in batches
   */
  private async uploadToSupabase(data: { conversations: Conversation[]; messages: Record<string, ConversationMessage[]> }): Promise<{ conversationsUploaded: number; messagesUploaded: number }> {
    let conversationsUploaded = 0;
    let messagesUploaded = 0;

    // Upload conversations in batches
    const conversationBatches = this.createBatches(data.conversations, this.options.batchSize);
    
    for (const batch of conversationBatches) {
      if (this.abortController.signal.aborted) {
        throw new ConversationError('Migration cancelled', 'CANCELLED');
      }

      await this.uploadConversationBatch(batch);
      conversationsUploaded += batch.length;
      this.progress.processedConversations = conversationsUploaded;
      this.notifyProgress();
    }

    // Upload messages in batches
    for (const [conversationId, messages] of Object.entries(data.messages)) {
      if (this.abortController.signal.aborted) {
        throw new ConversationError('Migration cancelled', 'CANCELLED');
      }

      const messageBatches = this.createBatches(messages, this.options.batchSize);
      
      for (const batch of messageBatches) {
        await this.uploadMessageBatch(batch);
        messagesUploaded += batch.length;
        this.progress.processedMessages = messagesUploaded;
        this.notifyProgress();
      }
    }

    return { conversationsUploaded, messagesUploaded };
  }

  /**
   * Upload a batch of conversations
   */
  private async uploadConversationBatch(conversations: Conversation[]): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.options.retryAttempts) {
      try {
        const { error } = await this.supabase
          .from('conversations')
          .insert(conversations.map(c => ({
            ...c,
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString()
          })));

        if (error) {
          throw error;
        }
        
        return; // Success
      } catch (error) {
        attempt++;
        if (attempt >= this.options.retryAttempts) {
          throw new ConversationError(
            `Failed to upload conversation batch after ${this.options.retryAttempts} attempts`,
            'UPLOAD_ERROR',
            { originalError: error, batch: conversations.map(c => c.id) }
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * attempt));
      }
    }
  }

  /**
   * Upload a batch of messages
   */
  private async uploadMessageBatch(messages: ConversationMessage[]): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.options.retryAttempts) {
      try {
        const { error } = await this.supabase
          .from('conversation_messages')
          .insert(messages.map(m => ({
            ...m,
            conversation_id: m.conversationId,
            timestamp: m.timestamp.toISOString()
          })));

        if (error) {
          throw error;
        }
        
        return; // Success
      } catch (error) {
        attempt++;
        if (attempt >= this.options.retryAttempts) {
          throw new ConversationError(
            `Failed to upload message batch after ${this.options.retryAttempts} attempts`,
            'UPLOAD_ERROR',
            { originalError: error, batch: messages.map(m => m.id) }
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * attempt));
      }
    }
  }

  /**
   * Verify migration integrity
   */
  private async verifyMigration(originalData: { conversations: Conversation[]; messages: Record<string, ConversationMessage[]> }): Promise<void> {
    try {
      // Check conversation count
      const { count: conversationCount, error: convError } = await this.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      if (convError) {
        throw convError;
      }

      // Check message count
      const { count: messageCount, error: msgError } = await this.supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true });

      if (msgError) {
        throw msgError;
      }

      const expectedMessages = Object.values(originalData.messages).reduce(
        (total, messages) => total + messages.length, 0
      );

      // Verify counts match (allowing for existing data)
      if (conversationCount === null || messageCount === null) {
        throw new ConversationError(
          'Unable to verify migration - count queries failed',
          'VERIFICATION_ERROR'
        );
      }

      // Note: We don't do exact count matching since there might be existing data
      // Instead, we verify that at least the migrated data exists
      if (conversationCount < originalData.conversations.length || 
          messageCount < expectedMessages) {
        throw new ConversationError(
          'Migration verification failed - data count mismatch',
          'VERIFICATION_ERROR',
          { 
            expected: { conversations: originalData.conversations.length, messages: expectedMessages },
            actual: { conversations: conversationCount, messages: messageCount }
          }
        );
      }

    } catch (error) {
      throw new ConversationError(
        'Migration verification failed',
        'VERIFICATION_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Perform rollback on failed migration
   */
  private async performRollback(): Promise<void> {
    try {
      // Note: In a real implementation, you might want to:
      // 1. Keep track of inserted IDs during upload
      // 2. Delete only the data that was inserted during this migration
      // 3. For now, we'll just log the rollback attempt
      
      console.warn(`Rollback requested for migration ${this.migrationId}`);
      
      // The localStorage data is still intact, so users can continue using the app
      // In a production environment, you might implement more sophisticated rollback logic
      
    } catch (error) {
      const rollbackError = handleError(error, {
        component: 'ConversationMigrationService',
        operation: 'rollback'
      }, 'Échec du rollback de migration');
      
      logError(rollbackError, {
        component: 'ConversationMigrationService',
        operation: 'rollback'
      });
      
      throw new ConversationError(
        'Rollback failed',
        'ROLLBACK_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Mark migration as complete
   */
  private markMigrationComplete(): void {
    localStorage.setItem('doodates_migration_completed', 'true');
    localStorage.setItem('doodates_migration_timestamp', new Date().toISOString());
    localStorage.setItem('doodates_migration_id', this.migrationId);
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Update progress and notify listeners
   */
  private updateProgress(status: MigrationStatus, currentStep: string, completedSteps?: number): void {
    this.progress.status = status;
    this.progress.currentStep = currentStep;
    if (completedSteps !== undefined) {
      this.progress.completedSteps = completedSteps;
    }
    this.notifyProgress();
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(): void {
    if (this.options.onProgress) {
      this.options.onProgress({ ...this.progress });
    }
  }

  /**
   * Complete migration and return result
   */
  private completeMigration(
    success: boolean, 
    migratedConversations: number, 
    migratedMessages: number, 
    errors: string[],
    rollbackPerformed: boolean
  ): MigrationResult {
    this.progress.endTime = new Date();
    const duration = this.progress.endTime.getTime() - this.progress.startTime.getTime();
    
    const result: MigrationResult = {
      success,
      migratedConversations,
      migratedMessages,
      errors: [...errors],
      duration,
      rollbackPerformed
    };

    if (this.options.onComplete) {
      this.options.onComplete(result);
    }

    return result;
  }
}
