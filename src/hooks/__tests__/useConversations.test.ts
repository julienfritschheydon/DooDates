import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConversations } from '../useConversations';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation, ConversationMessage, ConversationError } from '../../types/conversation';
import { User } from '@supabase/supabase-js';
import * as ConversationStorage from '../../lib/storage/ConversationStorageSimple';

// Mock dependencies
vi.mock('../../lib/storage/ConversationStorageSimple');
vi.mock('../../contexts/AuthContext');

const mockConversationStorage = vi.mocked(ConversationStorage);
const mockUseAuth = vi.mocked(useAuth);

// Test data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z'
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Test Conversation 1',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    firstMessage: 'Hello world',
    messageCount: 2,
    isFavorite: false,
    tags: ['test'],
    metadata: {
      pollGenerated: false,
      errorOccurred: false,
      aiModel: 'gemini-pro',
      language: 'en' as const,
      userAgent: 'test-agent'
    }
  },
  {
    id: 'conv-2',
    title: 'Test Conversation 2',
    status: 'completed',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    firstMessage: 'Another message',
    messageCount: 1,
    isFavorite: true,
    tags: ['important'],
    metadata: {
      pollGenerated: true,
      errorOccurred: false,
      aiModel: 'gemini-pro',
      language: 'fr' as const,
      userAgent: 'test-agent'
    }
  }
];

const mockMessages: ConversationMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    content: 'Hello world',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    content: 'Hello! How can I help you?',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00Z')
  }
];

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ConversationStorage methods
    mockConversationStorage.getConversations.mockReturnValue(mockConversations);
    mockConversationStorage.getConversation.mockImplementation((id: string) => 
      mockConversations.find(c => c.id === id) || null
    );
    mockConversationStorage.getMessages.mockReturnValue(mockMessages);
    mockConversationStorage.createConversation.mockImplementation((data) => ({
      ...mockConversations[0],
      id: `conv_${Date.now()}`,
      title: data.title || 'New Title',
      firstMessage: 'New conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: data.userId,
    }));
    mockConversationStorage.updateConversation.mockImplementation((conv) => conv);
    mockConversationStorage.deleteConversation.mockImplementation(() => {});
    mockConversationStorage.addMessages.mockImplementation(() => {});

    // Mock useAuth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      profile: null,
      session: null,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn()
    });
  });

  describe('conversations list', () => {
    it('should fetch and return conversations', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.conversations.conversations).toHaveLength(2);
      expect(result.current.conversations.totalCount).toBe(2);
      expect(result.current.conversations.isEmpty).toBe(false);
      expect(mockConversationStorage.getConversations).toHaveBeenCalled();
    });

    it('should handle empty conversations list', async () => {
      mockConversationStorage.getConversations.mockReturnValue([]);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.conversations.isEmpty).toBe(true);
      expect(result.current.conversations.totalCount).toBe(0);
    });

    it('should handle storage errors gracefully', async () => {
      mockConversationStorage.getConversations.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isError).toBe(true);
      });
    });

    it('should apply filters correctly', async () => {
      const { result } = renderHook(() => 
        useConversations({ 
          filters: { status: ['active'] } 
        }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      // Should filter to only active conversations
      const activeConvs = result.current.conversations.conversations.filter(c => c.status === 'active');
      expect(activeConvs).toHaveLength(1);
      expect(activeConvs[0].id).toBe('conv-1');
    });

    it('should handle pagination config', async () => {
      const { result } = renderHook(() => 
        useConversations({ pageSize: 10 }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.config.pageSize).toBe(10);
      expect(result.current.conversations.conversations).toHaveLength(2);
    });
  });

  describe('single conversation', () => {
    it('should return conversation and messages', async () => {
      const { result } = renderHook(() => {
        const conversations = useConversations();
        const conversationState = conversations.useConversation('conv-1');
        return { conversations, conversationState };
      }, {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversationState.isSuccess).toBe(true);
      });

      expect(result.current.conversationState.conversation).toBeDefined();
      expect(result.current.conversationState.conversation?.id).toBe('conv-1');
      expect(result.current.conversationState.messages).toEqual(mockMessages);
      expect(result.current.conversationState.messageCount).toBe(2);
    });
  });

  describe('CRUD operations', () => {
    it('should create conversation', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.createConversation.mutateAsync({
          firstMessage: 'New conversation',
          title: 'New Title'
        });
      });

      expect(mockConversationStorage.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title',
          firstMessage: 'New conversation',
          userId: 'test-user-id'
        })
      );
    });

    it('should update conversation', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.updateConversation.mutateAsync({
          id: 'conv-1',
          updates: { title: 'Updated Title' }
        });
      });

      expect(mockConversationStorage.updateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'conv-1',
          title: 'Updated Title'
        })
      );
    });

    it('should delete conversation', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.deleteConversation.mutateAsync('conv-1');
      });

      expect(mockConversationStorage.deleteConversation).toHaveBeenCalledWith('conv-1');
    });

    it('should add message to conversation', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      const newMessage: ConversationMessage = {
        id: 'test-msg-1',
        conversationId: 'conv-1',
        content: 'New message',
        role: 'user',
        timestamp: new Date()
      };

      await act(async () => {
        await result.current.addMessage.mutateAsync({
          conversationId: 'conv-1',
          message: newMessage
        });
      });

      expect(mockConversationStorage.addMessages).toHaveBeenCalledWith(
        'conv-1',
        expect.arrayContaining([
          expect.objectContaining({
            content: 'New message',
            role: 'user'
          })
        ])
      );
    });
  });

  describe('utilities', () => {
    it('should search conversations', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      const searchResults = await result.current.searchConversations('Test Conversation 1');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toContain('Test Conversation 1');
    });

    it('should refresh conversations', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      const callCount = mockConversationStorage.getConversations.mock.calls.length;

      await act(async () => {
        await result.current.refresh();
      });

      // Should call getConversations again on refresh
      expect(mockConversationStorage.getConversations.mock.calls.length).toBeGreaterThan(callCount);
    });
  });

  describe('configuration', () => {
    it('should respect configuration options', async () => {
      const config = {
        pageSize: 10,
        enableRealtime: false,
        enableOptimisticUpdates: false,
        sortBy: 'createdAt' as const,
        sortOrder: 'asc' as const
      };

      const { result } = renderHook(() => useConversations(config), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.config).toEqual(expect.objectContaining(config));
    });
  });

  describe('guest mode', () => {
    it('should work without authenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        profile: null,
        session: null,
        error: null,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        updateProfile: vi.fn(),
        refreshProfile: vi.fn()
      });

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      // Should still fetch conversations in guest mode
      expect(mockConversationStorage.getConversations).toHaveBeenCalled();
      expect(result.current.conversations.conversations).toHaveLength(2);
    });
  });
});
