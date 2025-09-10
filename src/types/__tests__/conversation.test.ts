/**
 * Tests unitaires pour les types et validations de conversations
 * DooDates - Conversation Types Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  CONVERSATION_STATUS,
  MESSAGE_ROLE,
  CONVERSATION_LIMITS,
  CONVERSATION_ERROR_CODES,
  isValidConversationStatus,
  isValidMessageRole,
  isConversation,
  isConversationMessage,
  type Conversation,
  type ConversationMessage
} from '../conversation';

import {
  validateConversation,
  validateConversationMessage,
  validateCreateConversationRequest,
  validateUpdateConversationRequest,
  validateAddMessageRequest,
  validateLocalStorageData,
  validateConversationQuota,
  sanitizeConversationTitle,
  sanitizeMessageContent,
  sanitizeTags,
  formatZodError
} from '../../lib/validation/conversation';

// ============================================================================
// CONSTANTS & FIXTURES
// ============================================================================

const mockConversation: Conversation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Réunion équipe',
  status: CONVERSATION_STATUS.ACTIVE,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:30:00Z'),
  firstMessage: 'Bonjour, je voudrais organiser une réunion',
  messageCount: 5,
  relatedPollId: '456e7890-e89b-12d3-a456-426614174001',
  relatedPollSlug: 'reunion-equipe-janvier',
  isFavorite: false,
  tags: ['travail', 'réunion'],
  userId: '789e0123-e89b-12d3-a456-426614174002'
};

const mockMessage: ConversationMessage = {
  id: '321e4567-e89b-12d3-a456-426614174003',
  conversationId: '123e4567-e89b-12d3-a456-426614174000',
  role: MESSAGE_ROLE.USER,
  content: 'Je voudrais organiser une réunion mardi prochain',
  timestamp: new Date('2024-01-01T10:00:00Z'),
  metadata: {
    pollGenerated: false,
    tokenCount: 15
  }
};

// ============================================================================
// TYPE GUARDS TESTS
// ============================================================================

describe('Type Guards', () => {
  describe('isValidConversationStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isValidConversationStatus('active')).toBe(true);
      expect(isValidConversationStatus('completed')).toBe(true);
      expect(isValidConversationStatus('archived')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(isValidConversationStatus('invalid')).toBe(false);
      expect(isValidConversationStatus('')).toBe(false);
      expect(isValidConversationStatus('ACTIVE')).toBe(false);
    });
  });

  describe('isValidMessageRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidMessageRole('user')).toBe(true);
      expect(isValidMessageRole('assistant')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidMessageRole('admin')).toBe(false);
      expect(isValidMessageRole('system')).toBe(false);
      expect(isValidMessageRole('')).toBe(false);
    });
  });

  describe('isConversation', () => {
    it('should return true for valid conversation', () => {
      expect(isConversation(mockConversation)).toBe(true);
    });

    it('should return false for invalid conversation', () => {
      expect(isConversation(null)).toBe(false);
      expect(isConversation({})).toBe(false);
      expect(isConversation({ ...mockConversation, id: 123 })).toBe(false);
      expect(isConversation({ ...mockConversation, status: 'invalid' })).toBe(false);
    });
  });

  describe('isConversationMessage', () => {
    it('should return true for valid message', () => {
      expect(isConversationMessage(mockMessage)).toBe(true);
    });

    it('should return false for invalid message', () => {
      expect(isConversationMessage(null)).toBe(false);
      expect(isConversationMessage({})).toBe(false);
      expect(isConversationMessage({ ...mockMessage, role: 'invalid' })).toBe(false);
    });
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('Validation Functions', () => {
  describe('validateConversation', () => {
    it('should validate correct conversation', () => {
      const result = validateConversation(mockConversation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockConversation.id);
      }
    });

    it('should reject invalid conversation', () => {
      const invalidConversation = { ...mockConversation, id: 'invalid-uuid' };
      const result = validateConversation(invalidConversation);
      expect(result.success).toBe(false);
    });

    it('should reject conversation with empty title', () => {
      const invalidConversation = { ...mockConversation, title: '' };
      const result = validateConversation(invalidConversation);
      expect(result.success).toBe(false);
    });

    it('should reject conversation with title too long', () => {
      const longTitle = 'a'.repeat(CONVERSATION_LIMITS.MAX_TITLE_LENGTH + 1);
      const invalidConversation = { ...mockConversation, title: longTitle };
      const result = validateConversation(invalidConversation);
      expect(result.success).toBe(false);
    });
  });

  describe('validateConversationMessage', () => {
    it('should validate correct message', () => {
      const result = validateConversationMessage(mockMessage);
      expect(result.success).toBe(true);
    });

    it('should reject message with invalid UUID', () => {
      const invalidMessage = { ...mockMessage, id: 'invalid' };
      const result = validateConversationMessage(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should reject message with empty content', () => {
      const invalidMessage = { ...mockMessage, content: '' };
      const result = validateConversationMessage(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCreateConversationRequest', () => {
    it('should validate correct request', () => {
      const request = {
        title: 'Nouvelle conversation',
        firstMessage: 'Premier message',
        metadata: { language: 'fr' as const }
      };
      const result = validateCreateConversationRequest(request);
      expect(result.success).toBe(true);
    });

    it('should reject request with empty first message', () => {
      const request = {
        firstMessage: '',
        title: 'Test'
      };
      const result = validateCreateConversationRequest(request);
      expect(result.success).toBe(false);
    });
  });

  describe('validateLocalStorageData', () => {
    it('should validate correct localStorage data', () => {
      const data = {
        conversations: [mockConversation],
        messages: [mockMessage],
        lastCleanup: new Date(),
        version: '1.0.0'
      };
      const result = validateLocalStorageData(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid localStorage data', () => {
      const data = {
        conversations: 'invalid',
        messages: [],
        lastCleanup: new Date(),
        version: '1.0.0'
      };
      const result = validateLocalStorageData(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validateConversationQuota', () => {
    it('should validate correct quota', () => {
      const quota = {
        maxConversations: 10,
        currentCount: 5,
        isAuthenticated: true
      };
      const result = validateConversationQuota(quota);
      expect(result.success).toBe(true);
    });

    it('should reject quota where current exceeds max', () => {
      const quota = {
        maxConversations: 5,
        currentCount: 10,
        isAuthenticated: true
      };
      const result = validateConversationQuota(quota);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// SANITIZATION TESTS
// ============================================================================

describe('Sanitization Functions', () => {
  describe('sanitizeConversationTitle', () => {
    it('should trim whitespace', () => {
      expect(sanitizeConversationTitle('  test  ')).toBe('test');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeConversationTitle('test   multiple   spaces')).toBe('test multiple spaces');
    });

    it('should truncate long titles', () => {
      const longTitle = 'a'.repeat(CONVERSATION_LIMITS.MAX_TITLE_LENGTH + 10);
      const result = sanitizeConversationTitle(longTitle);
      expect(result.length).toBe(CONVERSATION_LIMITS.MAX_TITLE_LENGTH);
    });
  });

  describe('sanitizeMessageContent', () => {
    it('should trim whitespace', () => {
      expect(sanitizeMessageContent('  message  ')).toBe('message');
    });

    it('should truncate long content', () => {
      const longContent = 'a'.repeat(CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE + 10);
      const result = sanitizeMessageContent(longContent);
      expect(result.length).toBe(CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE);
    });
  });

  describe('sanitizeTags', () => {
    it('should trim and lowercase tags', () => {
      const tags = ['  TAG1  ', 'Tag2', 'TAG3'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should remove empty tags', () => {
      const tags = ['tag1', '', '   ', 'tag2'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should remove duplicate tags', () => {
      const tags = ['tag1', 'tag2', 'tag1', 'TAG2'];
      const result = sanitizeTags(tags);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should limit to 10 tags maximum', () => {
      const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
      const result = sanitizeTags(tags);
      expect(result.length).toBe(10);
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  describe('formatZodError', () => {
    it('should format validation errors correctly', () => {
      const invalidData = { id: 'invalid', title: '' };
      const result = validateConversation(invalidData);
      
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain('id');
        expect(formatted).toContain('title');
      }
    });
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('should have correct conversation limits', () => {
    expect(CONVERSATION_LIMITS.GUEST_MAX_CONVERSATIONS).toBe(1);
    expect(CONVERSATION_LIMITS.GUEST_RETENTION_DAYS).toBe(30);
    expect(CONVERSATION_LIMITS.FIRST_MESSAGE_PREVIEW_LENGTH).toBe(100);
    expect(typeof CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE).toBe('number');
  });

  it('should have all required conversation statuses', () => {
    expect(CONVERSATION_STATUS.ACTIVE).toBe('active');
    expect(CONVERSATION_STATUS.COMPLETED).toBe('completed');
    expect(CONVERSATION_STATUS.ARCHIVED).toBe('archived');
  });

  it('should have all required message roles', () => {
    expect(MESSAGE_ROLE.USER).toBe('user');
    expect(MESSAGE_ROLE.ASSISTANT).toBe('assistant');
  });

  it('should have all required error codes', () => {
    expect(CONVERSATION_ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
    expect(CONVERSATION_ERROR_CODES.CONVERSATION_NOT_FOUND).toBe('CONVERSATION_NOT_FOUND');
    expect(CONVERSATION_ERROR_CODES.STORAGE_FULL).toBe('STORAGE_FULL');
  });
});
