/**
 * @jest-environment jsdom
 */
import { ConversationStorageLocal } from '../ConversationStorageLocal';
import { Conversation, ConversationMessage, ConversationError } from '../../../types/conversation';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock LZ-string
jest.mock('lz-string', () => ({
  compress: (str: string) => `compressed_${str}`,
  decompress: (str: string) => str.replace('compressed_', '')
}));

describe('ConversationStorageLocal', () => {
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

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize storage for guest users', () => {
      ConversationStorageLocal.initialize(true);
      
      const quotaInfo = ConversationStorageLocal.getQuotaInfo();
      expect(quotaInfo.isGuest).toBe(true);
      expect(quotaInfo.limit).toBe(1);
      expect(quotaInfo.used).toBe(0);
    });

    it('should not overwrite existing storage', () => {
      ConversationStorageLocal.initialize(true);
      const firstQuota = ConversationStorageLocal.getQuotaInfo();
      
      ConversationStorageLocal.initialize(false);
      const secondQuota = ConversationStorageLocal.getQuotaInfo();
      
      expect(firstQuota.isGuest).toBe(secondQuota.isGuest);
    });

    it('should handle localStorage errors', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => { throw new Error('Storage error'); };
      
      expect(() => ConversationStorageLocal.initialize()).toThrow(ConversationError);
      
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('saveConversation', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should save a valid conversation', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const saved = await ConversationStorageLocal.getConversation(mockConversation.id);
      expect(saved).toEqual(mockConversation);
    });

    it('should enforce guest quota limit', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const secondConversation = {
        ...mockConversation,
        id: '123e4567-e89b-12d3-a456-426614174999',
        title: 'Second Conversation'
      };
      
      await expect(ConversationStorageLocal.saveConversation(secondConversation))
        .rejects.toThrow(ConversationError);
    });

    it('should allow updates to existing conversations', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const updatedConversation = {
        ...mockConversation,
        title: 'Updated Title',
        updatedAt: new Date('2024-01-02T10:00:00Z')
      };
      
      await ConversationStorageLocal.saveConversation(updatedConversation);
      
      const saved = await ConversationStorageLocal.getConversation(mockConversation.id);
      expect(saved?.title).toBe('Updated Title');
    });

    it('should reject invalid conversation data', async () => {
      const invalidConversation = {
        ...mockConversation,
        id: 'invalid-uuid'
      };
      
      await expect(ConversationStorageLocal.saveConversation(invalidConversation))
        .rejects.toThrow(ConversationError);
    });

    it('should handle storage quota exceeded', async () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        const error = new DOMException('QuotaExceededError');
        (error as any).code = 22;
        throw error;
      };
      
      await expect(ConversationStorageLocal.saveConversation(mockConversation))
        .rejects.toThrow(ConversationError);
      
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('saveMessages', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should save valid messages', async () => {
      const messages = [mockMessage];
      await ConversationStorageLocal.saveMessages(mockConversation.id, messages);
      
      const saved = await ConversationStorageLocal.getMessages(mockConversation.id);
      expect(saved).toEqual(messages);
    });

    it('should reject invalid message data', async () => {
      const invalidMessage = {
        ...mockMessage,
        id: 'invalid-uuid'
      };
      
      await expect(ConversationStorageLocal.saveMessages(mockConversation.id, [invalidMessage]))
        .rejects.toThrow(ConversationError);
    });

    it('should handle empty message arrays', async () => {
      await ConversationStorageLocal.saveMessages(mockConversation.id, []);
      
      const saved = await ConversationStorageLocal.getMessages(mockConversation.id);
      expect(saved).toEqual([]);
    });
  });

  describe('getConversations', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should return empty array when no conversations exist', async () => {
      const conversations = await ConversationStorageLocal.getConversations();
      expect(conversations).toEqual([]);
    });

    it('should return all saved conversations', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const conversations = await ConversationStorageLocal.getConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0]).toEqual(mockConversation);
    });

    it('should handle corrupted data', async () => {
      localStorageMock.setItem('doodates_conversations', 'invalid_compressed_data');
      
      await expect(ConversationStorageLocal.getConversations())
        .rejects.toThrow(ConversationError);
    });
  });

  describe('getConversation', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should return null for non-existent conversation', async () => {
      const conversation = await ConversationStorageLocal.getConversation('non-existent');
      expect(conversation).toBeNull();
    });

    it('should return existing conversation', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const conversation = await ConversationStorageLocal.getConversation(mockConversation.id);
      expect(conversation).toEqual(mockConversation);
    });
  });

  describe('getMessages', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should return empty array for non-existent conversation', async () => {
      const messages = await ConversationStorageLocal.getMessages('non-existent');
      expect(messages).toEqual([]);
    });

    it('should return existing messages', async () => {
      const messages = [mockMessage];
      await ConversationStorageLocal.saveMessages(mockConversation.id, messages);
      
      const saved = await ConversationStorageLocal.getMessages(mockConversation.id);
      expect(saved).toEqual(messages);
    });
  });

  describe('deleteConversation', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should delete conversation and messages', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      await ConversationStorageLocal.saveMessages(mockConversation.id, [mockMessage]);
      
      await ConversationStorageLocal.deleteConversation(mockConversation.id);
      
      const conversation = await ConversationStorageLocal.getConversation(mockConversation.id);
      const messages = await ConversationStorageLocal.getMessages(mockConversation.id);
      
      expect(conversation).toBeNull();
      expect(messages).toEqual([]);
    });

    it('should handle deletion of non-existent conversation', async () => {
      await expect(ConversationStorageLocal.deleteConversation('non-existent'))
        .resolves.not.toThrow();
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should clear all data', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      await ConversationStorageLocal.clearAll();
      
      const conversations = await ConversationStorageLocal.getConversations();
      expect(conversations).toEqual([]);
    });
  });

  describe('getQuotaInfo', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should return correct quota info for guests', () => {
      const quotaInfo = ConversationStorageLocal.getQuotaInfo();
      expect(quotaInfo.isGuest).toBe(true);
      expect(quotaInfo.limit).toBe(1);
      expect(quotaInfo.used).toBe(0);
    });

    it('should update used count after saving conversations', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      
      const quotaInfo = ConversationStorageLocal.getQuotaInfo();
      expect(quotaInfo.used).toBe(1);
    });

    it('should handle corrupted storage gracefully', () => {
      localStorageMock.setItem('doodates_conversations', 'invalid_data');
      
      const quotaInfo = ConversationStorageLocal.getQuotaInfo();
      expect(quotaInfo.used).toBe(0);
      expect(quotaInfo.limit).toBe(1);
      expect(quotaInfo.isGuest).toBe(true);
    });
  });

  describe('exportForMigration', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should export all data for migration', async () => {
      await ConversationStorageLocal.saveConversation(mockConversation);
      await ConversationStorageLocal.saveMessages(mockConversation.id, [mockMessage]);
      
      const exported = ConversationStorageLocal.exportForMigration();
      
      expect(exported).not.toBeNull();
      expect(exported!.conversations).toHaveLength(1);
      expect(exported!.conversations[0]).toEqual(mockConversation);
      expect(exported!.messages[mockConversation.id]).toEqual([mockMessage]);
    });

    it('should return null when no data exists', () => {
      localStorageMock.clear();
      
      const exported = ConversationStorageLocal.exportForMigration();
      expect(exported).toBeNull();
    });
  });

  describe('expiration handling', () => {
    it('should clear expired data', async () => {
      // Use jest.useFakeTimers for better date mocking
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-12-01T10:00:00Z'));
      
      ConversationStorageLocal.initialize(true);
      
      // Create a conversation with valid dates for the current mocked time
      const validConversation = {
        ...mockConversation,
        createdAt: new Date('2024-12-01T10:00:00Z'),
        updatedAt: new Date('2024-12-01T10:00:00Z')
      };
      
      await ConversationStorageLocal.saveConversation(validConversation);
      
      // Fast forward time by 31 days
      jest.setSystemTime(new Date('2025-01-01T10:00:00Z'));
      
      const conversations = await ConversationStorageLocal.getConversations();
      expect(conversations).toEqual([]);
      
      jest.useRealTimers();
    });
  });

  describe('data corruption handling', () => {
    beforeEach(() => {
      ConversationStorageLocal.initialize(true);
    });

    it('should handle JSON parse errors', async () => {
      // Simulate corrupted compressed data
      localStorageMock.setItem('doodates_conversations', 'compressed_invalid_json');
      
      await expect(ConversationStorageLocal.getConversations())
        .rejects.toThrow(ConversationError);
      
      // Storage should be cleared after corruption detection
      expect(localStorageMock.getItem('doodates_conversations')).toBeNull();
    });

    it('should handle decompression failures', async () => {
      // Simulate decompression failure by setting invalid compressed data
      localStorageMock.setItem('doodates_conversations', 'compressed_data_that_fails_decompression');
      
      // Mock decompress to return null for this specific test
      const originalDecompress = require('lz-string').decompress;
      require('lz-string').decompress = jest.fn().mockReturnValue(null);
      
      await expect(ConversationStorageLocal.getConversations())
        .rejects.toThrow(ConversationError);
      
      // Restore original function
      require('lz-string').decompress = originalDecompress;
    });
  });
});
