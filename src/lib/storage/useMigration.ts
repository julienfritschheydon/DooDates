import { useState, useEffect, useCallback } from 'react';
import { ConversationMigrationService, MigrationProgress, MigrationResult } from './ConversationMigrationService';

/**
 * Hook for managing conversation migration from localStorage to Supabase
 * Provides migration status, progress tracking, and control functions
 */
export function useMigration(supabaseUrl: string, supabaseKey: string) {
  const [migrationService, setMigrationService] = useState<ConversationMigrationService | null>(null);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState<boolean | null>(null);

  // Initialize migration service
  useEffect(() => {
    const initializeMigration = async () => {
      try {
        // Check if migration is needed
        const needed = await ConversationMigrationService.isMigrationNeeded();
        setMigrationNeeded(needed);

        if (needed) {
          // Create migration service with progress callbacks
          const service = new ConversationMigrationService(supabaseUrl, supabaseKey, {
            batchSize: 5,
            validateBeforeUpload: true,
            enableRollback: true,
            retryAttempts: 3,
            retryDelay: 1000,
            onProgress: (progressUpdate) => {
              setProgress(progressUpdate);
            },
            onError: (error) => {
              console.error('Migration error:', error);
            },
            onComplete: (migrationResult) => {
              setResult(migrationResult);
            }
          });

          setMigrationService(service);
        }
      } catch (error) {
        console.error('Failed to initialize migration:', error);
        setMigrationNeeded(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeMigration();
  }, [supabaseUrl, supabaseKey]);

  // Start migration
  const startMigration = useCallback(async (): Promise<MigrationResult | null> => {
    if (!migrationService) {
      console.warn('Migration service not initialized');
      return null;
    }

    try {
      const migrationResult = await migrationService.migrate();
      return migrationResult;
    } catch (error) {
      console.error('Migration failed:', error);
      return null;
    }
  }, [migrationService]);

  // Cancel migration
  const cancelMigration = useCallback(() => {
    if (migrationService) {
      migrationService.cancelMigration();
    }
  }, [migrationService]);

  // Get current progress
  const getCurrentProgress = useCallback((): MigrationProgress | null => {
    if (migrationService) {
      return migrationService.getProgress();
    }
    return progress;
  }, [migrationService, progress]);

  // Auto-start migration if needed (optional)
  const autoStartMigration = useCallback(async () => {
    if (migrationNeeded && migrationService && !progress) {
      return await startMigration();
    }
    return null;
  }, [migrationNeeded, migrationService, progress, startMigration]);

  return {
    // State
    isInitialized,
    migrationNeeded,
    progress,
    result,
    
    // Actions
    startMigration,
    cancelMigration,
    autoStartMigration,
    getCurrentProgress,
    
    // Computed properties
    isInProgress: progress?.status === 'in_progress' || 
                  progress?.status === 'validating' || 
                  progress?.status === 'uploading' || 
                  progress?.status === 'verifying',
    isCompleted: progress?.status === 'completed',
    isFailed: progress?.status === 'failed',
    isRolledBack: progress?.status === 'rolled_back',
    
    // Progress percentage (0-100)
    progressPercentage: progress ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0,
    
    // Detailed progress info
    conversationProgress: progress ? Math.round((progress.processedConversations / progress.totalConversations) * 100) : 0,
    messageProgress: progress ? Math.round((progress.processedMessages / progress.totalMessages) * 100) : 0,
  };
}
