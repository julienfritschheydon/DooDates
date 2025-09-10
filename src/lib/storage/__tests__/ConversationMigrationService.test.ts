/**
 * @jest-environment jsdom
 */
import { ConversationMigrationService, MigrationStatus, MigrationProgress, MigrationResult } from '../ConversationMigrationService';
import { ConversationStorageLocal } from '../ConversationStorageLocal';
import { Conversation, ConversationMessage, ConversationError } from '../../../types/conversation';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock ConversationStorageLocal
jest.mock('../ConversationStorageLocal');

describe('ConversationMigrationService', () => {
  const mockConversation: Conversation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Conversation',
    status: 'active',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    firstMessage: 'Hello, this is a test message',
    messageCount: 1,
    isFavorite: false,
    tags: ['test'],
    metadata: {
      pollGenerated: false,
      errorOccurred: false,
      aiModel: 'gemini-pro',
      language: 'fr',
      userAgent: 'test-agent'
    }
  };

  const mockMessage: ConversationMessage = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    conversationId: '123e4567-e89b-12d3-a456-426614174000',
    role: 'user',
    content: 'Hello, this is a test message',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    metadata: {
      pollGenerated: false,
      errorOccurred: false,
      processingTime: 100,
      tokenCount: 10
    }
  };

  const mockMigrationData = {
    conversations: [mockConversation],
    messages: {
      [mockConversation.id]: [mockMessage]
    }
  };

  let migrationService: ConversationMigrationService;
  let progressCallback: jest.Mock;
  let errorCallback: jest.Mock;
  let completeCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    progressCallback = jest.fn();
    errorCallback = jest.fn();
    completeCallback = jest.fn();

    migrationService = new ConversationMigrationService(
      'https://test.supabase.co',
      'test-key',
      {
        batchSize: 2,
        onProgress: progressCallback,
        onError: errorCallback,
        onComplete: completeCallback,
      }
    );
  });

  describe('isMigrationNeeded', () => {
    it('should return true when localStorage has data and migration not completed', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(mockMigrationData);
      localStorage.removeItem('doodates_migration_completed');

      const result = await ConversationMigrationService.isMigrationNeeded();
      expect(result).toBe(true);
    });

    it('should return false when migration already completed', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(mockMigrationData);
      localStorage.setItem('doodates_migration_completed', 'true');

      const result = await ConversationMigrationService.isMigrationNeeded();
      expect(result).toBe(false);
    });

    it('should return false when no localStorage data', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(null);

      const result = await ConversationMigrationService.isMigrationNeeded();
      expect(result).toBe(false);
    });

    it('should return false when localStorage data is empty', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue({
        conversations: [],
        messages: {}
      });

      const result = await ConversationMigrationService.isMigrationNeeded();
      expect(result).toBe(false);
    });
  });

  describe('migrate', () => {
    beforeEach(() => {
      // Setup successful mocks
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(mockMigrationData);
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnValue({
          head: true,
          count: 'exact'
        })
      });

      // Mock count queries for verification
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 1, error: null })
          };
        } else if (table === 'conversation_messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 1, error: null })
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockResolvedValue({ count: 0, error: null })
        };
      });
    });

    it('should successfully migrate data', async () => {
      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
      expect(result.migratedConversations).toBe(1);
      expect(result.migratedMessages).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.rollbackPerformed).toBe(false);
      
      // Check that migration completion was marked
      expect(localStorage.getItem('doodates_migration_completed')).toBe('true');
      expect(localStorage.getItem('doodates_migration_timestamp')).toBeTruthy();
      expect(localStorage.getItem('doodates_migration_id')).toBeTruthy();
    });

    it('should call progress callback during migration', async () => {
      await migrationService.migrate();

      expect(progressCallback).toHaveBeenCalledTimes(6); // 6 steps
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          currentStep: 'Migration completed successfully',
          completedSteps: 6
        })
      );
    });

    it('should call complete callback with result', async () => {
      await migrationService.migrate();

      expect(completeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          migratedConversations: 1,
          migratedMessages: 1
        })
      );
    });

    it('should handle empty localStorage data gracefully', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue({
        conversations: [],
        messages: {}
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
      expect(result.migratedConversations).toBe(0);
      expect(result.migratedMessages).toBe(0);
    });

    it('should handle guest users by setting session ID', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      mockSupabaseClient.rpc.mockResolvedValue({ error: null });

      await migrationService.migrate();

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('set_guest_session_id', {
        session_id: expect.stringMatching(/^guest_\d+_[a-z0-9]+$/)
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(mockMigrationData);
    });

    it('should handle localStorage export errors', async () => {
      (ConversationStorageLocal.exportForMigration as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to export localStorage data');
    });

    it('should handle Supabase authentication errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' }
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to get user authentication status');
    });

    it('should handle upload errors with retry', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      let attemptCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockImplementation(() => {
              attemptCount++;
              if (attemptCount < 3) {
                return Promise.resolve({ error: { message: 'Upload error' } });
              }
              return Promise.resolve({ error: null });
            })
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockResolvedValue({ count: 1, error: null })
        };
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried
    });

    it('should perform rollback on persistent errors', async () => {
      const migrationServiceWithRollback = new ConversationMigrationService(
        'https://test.supabase.co',
        'test-key',
        {
          enableRollback: true,
          retryAttempts: 1,
          onComplete: completeCallback
        }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: { message: 'Persistent error' } })
      });

      const result = await migrationServiceWithRollback.migrate();

      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate data before upload when enabled', async () => {
      const invalidConversation = {
        ...mockConversation,
        id: 'invalid-uuid' // This should fail validation
      };

      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue({
        conversations: [invalidConversation],
        messages: { [invalidConversation.id]: [mockMessage] }
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Data validation failed');
    });

    it('should detect orphaned messages', async () => {
      const orphanedMessage = {
        ...mockMessage,
        conversationId: 'non-existent-conversation'
      };

      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue({
        conversations: [mockConversation],
        messages: { 
          [mockConversation.id]: [mockMessage],
          'non-existent-conversation': [orphanedMessage]
        }
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Orphaned message'))).toBe(true);
    });

    it('should skip validation when disabled', async () => {
      const migrationServiceNoValidation = new ConversationMigrationService(
        'https://test.supabase.co',
        'test-key',
        { validateBeforeUpload: false }
      );

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockResolvedValue({ count: 1, error: null })
      });

      const result = await migrationServiceNoValidation.migrate();

      expect(result.success).toBe(true);
      // Should not have called validation step
    });
  });

  describe('progress tracking', () => {
    it('should track progress correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockResolvedValue({ count: 1, error: null })
      });

      await migrationService.migrate();

      const progress = migrationService.getProgress();
      expect(progress.status).toBe('completed');
      expect(progress.completedSteps).toBe(6);
      expect(progress.totalSteps).toBe(6);
      expect(progress.processedConversations).toBe(1);
      expect(progress.processedMessages).toBe(1);
      expect(progress.endTime).toBeTruthy();
    });

    it('should handle cancellation', () => {
      migrationService.cancelMigration();

      const progress = migrationService.getProgress();
      expect(progress.status).toBe('failed');
      expect(progress.currentStep).toBe('Migration cancelled by user');
    });
  });

  describe('batch processing', () => {
    it('should process large datasets in batches', async () => {
      // Create large dataset
      const largeDataset = {
        conversations: Array.from({ length: 10 }, (_, i) => ({
          ...mockConversation,
          id: `conversation-${i}`,
          title: `Conversation ${i}`
        })),
        messages: {}
      };

      // Add messages for each conversation
      largeDataset.conversations.forEach(conv => {
        largeDataset.messages[conv.id] = Array.from({ length: 5 }, (_, i) => ({
          ...mockMessage,
          id: `message-${conv.id}-${i}`,
          conversationId: conv.id,
          content: `Message ${i} for ${conv.title}`
        }));
      });

      (ConversationStorageLocal.exportForMigration as jest.Mock).mockReturnValue(largeDataset);

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockResolvedValue({ count: 50, error: null })
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
      expect(result.migratedConversations).toBe(10);
      expect(result.migratedMessages).toBe(50);

      // Should have been called multiple times due to batching (batchSize = 2)
      expect(insertMock).toHaveBeenCalledTimes(30); // 5 batches for conversations + 25 batches for messages
    });
  });

  describe('verification', () => {
    it('should verify migration integrity', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 1, error: null })
          };
        } else if (table === 'conversation_messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 1, error: null })
          };
        }
        return { insert: jest.fn(), select: jest.fn() };
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
    });

    it('should fail verification if counts dont match', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 0, error: null }) // Wrong count
          };
        } else if (table === 'conversation_messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockResolvedValue({ count: 1, error: null })
          };
        }
        return { insert: jest.fn(), select: jest.fn() };
      });

      const result = await migrationService.migrate();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Migration verification failed - data count mismatch');
    });
  });
});
