import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations } from '../useConversations';
import { useConversationStorage } from '../useConversationStorage';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation, ConversationMessage, ConversationError } from '../../types/conversation';
import { User } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('../useConversationStorage');
jest.mock('../../contexts/AuthContext');

const mockUseConversationStorage = useConversationStorage as jest.MockedFunction<typeof useConversationStorage>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage implementation
    mockStorage = {
      conversations: {
        data: mockConversations,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn().mockResolvedValue({ data: mockConversations })
      },
      useConversation: jest.fn(),
      useMessages: jest.fn(),
      createConversation: {
        mutateAsync: jest.fn()
      },
      updateConversation: {
        mutateAsync: jest.fn()
      },
      deleteConversation: {
        mutateAsync: jest.fn()
      },
      addMessage: {
        mutateAsync: jest.fn()
      },
      storageMode: {
        provider: 'localStorage'
      },
      isLoading: false
    };

    mockUseConversationStorage.mockReturnValue(mockStorage);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      profile: null,
      session: null,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      updateProfile: jest.fn(),
      refreshProfile: jest.fn()
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

      expect(result.current.conversations.conversations).toEqual(mockConversations);
      expect(result.current.conversations.totalCount).toBe(2);
      expect(result.current.conversations.isEmpty).toBe(false);
    });

    it('should handle loading state', () => {
      mockStorage.conversations.isLoading = true;
      mockStorage.isLoading = true;

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      expect(result.current.conversations.isLoading).toBe(false); // Query is disabled when storage is loading
    });

    it('should handle error state', async () => {
      const error = new ConversationError('Fetch failed', 'FETCH_ERROR');
      mockStorage.conversations.refetch.mockRejectedValue(error);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isError).toBe(true);
      });

      expect(result.current.conversations.error).toBeInstanceOf(ConversationError);
    });

    it('should apply filters correctly', async () => {
      const { result } = renderHook(() => 
        useConversations({ 
          filters: { status: ['active'], isFavorite: false } 
        }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.conversations.conversations).toHaveLength(1);
      expect(result.current.conversations.conversations[0].id).toBe('conv-1');
    });

    it('should handle pagination', async () => {
      const { result } = renderHook(() => 
        useConversations({ pageSize: 1 }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.conversations.conversations).toHaveLength(1);
      expect(result.current.conversations.hasMore).toBe(true);
      expect(result.current.canLoadMore).toBe(true);
    });
  });

  describe('single conversation', () => {
    it('should return conversation and messages', () => {
      const mockConversationQuery = {
        data: mockConversations[0],
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null
      };

      const mockMessagesQuery = {
        data: mockMessages,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null
      };

      mockStorage.useConversation.mockReturnValue(mockConversationQuery);
      mockStorage.useMessages.mockReturnValue(mockMessagesQuery);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      const conversationState = result.current.useConversation('conv-1');

      expect(conversationState.conversation).toEqual(mockConversations[0]);
      expect(conversationState.messages).toEqual(mockMessages);
      expect(conversationState.messageCount).toBe(2);
      expect(conversationState.isSuccess).toBe(true);
    });
  });

  describe('CRUD operations', () => {
    it('should create conversation', async () => {
      const newConversation = { ...mockConversations[0], id: 'new-conv' };
      mockStorage.createConversation.mutateAsync.mockResolvedValue(newConversation);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.createConversation.mutateAsync({
          firstMessage: 'New conversation',
          title: 'New Title'
        });
      });

      expect(mockStorage.createConversation.mutateAsync).toHaveBeenCalledWith({
        title: 'New Title',
        status: 'active',
        firstMessage: 'New conversation',
        messageCount: 1,
        isFavorite: false,
        tags: [],
        metadata: expect.objectContaining({
          pollGenerated: false,
          errorOccurred: false,
          aiModel: 'gemini-pro',
          language: 'fr'
        })
      });
    });

    it('should update conversation', async () => {
      const updatedConversation = { ...mockConversations[0], title: 'Updated Title' };
      mockStorage.updateConversation.mutateAsync.mockResolvedValue(updatedConversation);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.updateConversation.mutateAsync({
          id: 'conv-1',
          updates: { title: 'Updated Title' }
        });
      });

      expect(mockStorage.updateConversation.mutateAsync).toHaveBeenCalledWith({
        id: 'conv-1',
        updates: { title: 'Updated Title' }
      });
    });

    it('should delete conversation', async () => {
      mockStorage.deleteConversation.mutateAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.deleteConversation.mutateAsync('conv-1');
      });

      expect(mockStorage.deleteConversation.mutateAsync).toHaveBeenCalledWith('conv-1');
    });

    it('should add message to conversation', async () => {
      const newMessage: ConversationMessage = {
        id: 'new-msg',
        conversationId: 'conv-1',
        content: 'New message',
        role: 'user',
        timestamp: new Date()
      };
      mockStorage.addMessage.mutateAsync.mockResolvedValue(newMessage);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.addMessage.mutateAsync({
          conversationId: 'conv-1',
          message: {
            id: 'test-msg-1',
            conversationId: 'conv-1',
            content: 'New message',
            role: 'user',
            timestamp: new Date()
          }
        });
      });

      expect(mockStorage.addMessage.mutateAsync).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        message: {
          id: 'test-msg-1',
          conversationId: 'conv-1',
          content: 'New message',
          role: 'user',
          timestamp: expect.any(Date)
        }
      });
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
      expect(searchResults[0].id).toBe('conv-1');
    });

    it('should refresh conversations', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockStorage.conversations.refetch).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should respect configuration options', () => {
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
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        updateProfile: jest.fn(),
        refreshProfile: jest.fn()
      });

      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.isSuccess).toBe(true);
      });

      expect(result.current.conversations.conversations).toEqual(mockConversations);
    });
  });
});
