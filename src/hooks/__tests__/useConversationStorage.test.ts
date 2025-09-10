/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { useConversationStorage } from '../useConversationStorage';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation, ConversationMessage } from '../../types/conversation';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

const mockUseAuth = jest.mocked(useAuth);

// Mock the modules
jest.mock('../../lib/storage/ConversationStorageLocal', () => {
  const mockConstructor = jest.fn().mockImplementation(() => ({
    getAllConversations: jest.fn().mockResolvedValue([]),
    getConversation: jest.fn().mockResolvedValue(null),
    getMessages: jest.fn().mockResolvedValue([]),
    createConversation: jest.fn().mockResolvedValue({}),
    updateConversation: jest.fn().mockResolvedValue({}),
    deleteConversation: jest.fn().mockResolvedValue(undefined),
    addMessage: jest.fn().mockResolvedValue({})
  }));
  
  (mockConstructor as any).exportForMigration = jest.fn();
  
  return {
    ConversationStorageLocal: mockConstructor
  };
});

jest.mock('../../lib/storage/ConversationMigrationService', () => ({
  ConversationMigrationService: jest.fn()
}));

describe('useConversationStorage', () => {
  let queryClient: QueryClient;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z'
  };

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
      language: 'fr' as const,
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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    jest.clearAllMocks();

    // Setup default auth mock
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

    // Mock static method for ConversationStorageLocal
    const { ConversationStorageLocal } = require('../../lib/storage/ConversationStorageLocal');
    ConversationStorageLocal.exportForMigration.mockReturnValue({
      conversations: [mockConversation],
      messages: { [mockConversation.id]: [mockMessage] }
    });

    const { ConversationMigrationService } = require('../../lib/storage/ConversationMigrationService');
    ConversationMigrationService.mockImplementation(() => ({
      isMigrationNeeded: jest.fn().mockResolvedValue(false),
      migrate: jest.fn().mockResolvedValue({
        success: true,
        migratedConversations: 0,
        migratedMessages: 0,
        errors: [],
        duration: 0,
        rollbackPerformed: false
      })
    }));
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize correctly with default options', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.storageMode).toBeDefined();
        expect(result.current.conversations).toBeDefined();
        expect(result.current.createConversation).toBeDefined();
        expect(result.current.updateConversation).toBeDefined();
        expect(result.current.deleteConversation).toBeDefined();
        expect(result.current.addMessage).toBeDefined();
      });
    });

    it('should detect guest mode when user is not authenticated', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.storageMode.isGuest).toBe(true);
        expect(result.current.storageMode.isAuthenticated).toBe(false);
        expect(result.current.storageMode.provider).toBe('localStorage');
      });
    });

    it('should detect authenticated mode when user is logged in', async () => {
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

      const { result } = renderHook(() => useConversationStorage({
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key'
      }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.storageMode.isAuthenticated).toBe(true);
        expect(result.current.storageMode.isGuest).toBe(false);
        expect(result.current.storageMode.provider).toBe('localStorage'); // Currently uses localStorage since Supabase storage isn't implemented yet
      });
    });
  });

  describe('Data Operations', () => {
    it('should fetch conversations successfully', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversations.data).toBeDefined();
        expect(result.current.conversations.isLoading).toBe(false);
        expect(result.current.conversations.isError).toBe(false);
      });
    });

    it('should create conversation successfully', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      const newConversationData = {
        title: 'New Conversation',
        status: 'active' as const,
        firstMessage: 'Hello world',
        messageCount: 0,
        isFavorite: false,
        tags: [],
        metadata: {
          pollGenerated: false,
          errorOccurred: false,
          aiModel: 'gemini-pro' as const,
          language: 'en' as const,
          userAgent: 'test'
        }
      };

      await act(async () => {
        await result.current.createConversation.mutateAsync(newConversationData);
      });

      await waitFor(() => {
        expect(result.current.createConversation.isSuccess).toBe(true);
      });
    });

    it('should update conversation successfully', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      const updates = { title: 'Updated Title', isFavorite: true };

      await act(async () => {
        await result.current.updateConversation.mutateAsync({
          id: mockConversation.id,
          updates
        });
      });

      await waitFor(() => {
        expect(result.current.updateConversation.isSuccess).toBe(true);
      });
    });

    it('should delete conversation successfully', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.deleteConversation.mutateAsync(mockConversation.id);
      });

      await waitFor(() => {
        expect(result.current.deleteConversation.isSuccess).toBe(true);
      });
    });

    it('should add message successfully', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      const newMessageData = {
        id: 'test-message-id',
        conversationId: mockConversation.id,
        role: 'assistant' as const,
        content: 'This is a response',
        timestamp: new Date(),
        metadata: {
          pollGenerated: false,
          errorOccurred: false,
          processingTime: 200,
          tokenCount: 15
        }
      };

      await act(async () => {
        await result.current.addMessage.mutateAsync({
          conversationId: mockConversation.id,
          message: newMessageData
        });
      });

      await waitFor(() => {
        expect(result.current.addMessage.isSuccess).toBe(true);
      });
    });
  });

  describe('Quota Management', () => {
    it('should calculate quota correctly for guest users', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.storageMode.quotaInfo).toBeDefined();
        expect(result.current.storageMode.quotaInfo.limit).toBe(10); // Guest limit
        expect(result.current.canCreateConversation).toBeDefined();
      });
    });

    it('should detect when quota is exceeded', async () => {
      // Mock storage with 10 conversations (at limit)
      const { ConversationStorageLocal } = require('../../lib/storage/ConversationStorageLocal');
      ConversationStorageLocal.exportForMigration.mockReturnValue({
        conversations: Array.from({ length: 10 }, (_, i) => ({ ...mockConversation, id: `conv-${i}` })),
        messages: {}
      });

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.storageMode.quotaInfo.isAtLimit).toBe(true);
        expect(result.current.canCreateConversation).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should provide error handling structure', async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createWrapper()
      });

      // Test that error handling properties exist
      expect(result.current.hasError).toBeDefined();
      expect(typeof result.current.hasError).toBe('boolean');
      
      // Test that mutation error handling exists
      expect(result.current.createConversation.isError).toBeDefined();
      expect(result.current.updateConversation.isError).toBeDefined();
      expect(result.current.deleteConversation.isError).toBeDefined();
      expect(result.current.addMessage.isError).toBeDefined();
    });
  });

  describe('Hook Queries', () => {
    it('should provide useConversation hook', async () => {
      // Mock the storage to return conversation data
      const { ConversationStorageLocal } = require('../../lib/storage/ConversationStorageLocal');
      const mockLocalStorage = {
        getAllConversations: jest.fn().mockResolvedValue([mockConversation]),
        getConversation: jest.fn().mockResolvedValue(mockConversation),
        getMessages: jest.fn().mockResolvedValue([mockMessage]),
        createConversation: jest.fn().mockResolvedValue(mockConversation),
        updateConversation: jest.fn().mockResolvedValue(mockConversation),
        deleteConversation: jest.fn().mockResolvedValue(undefined),
        addMessage: jest.fn().mockResolvedValue(mockMessage)
      };
      ConversationStorageLocal.mockImplementation(() => mockLocalStorage);

      const { result } = renderHook(() => {
        const storage = useConversationStorage();
        const conversation = storage.useConversation(mockConversation.id);
        return { storage, conversation };
      }, {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.conversation).toBeDefined();
        expect(result.current.conversation).toHaveProperty('data');
        expect(result.current.conversation).toHaveProperty('isLoading');
      });
    });

    it('should provide useMessages hook', async () => {
      // Mock the storage to return message data
      const { ConversationStorageLocal } = require('../../lib/storage/ConversationStorageLocal');
      const mockLocalStorage = {
        getAllConversations: jest.fn().mockResolvedValue([mockConversation]),
        getConversation: jest.fn().mockResolvedValue(mockConversation),
        getMessages: jest.fn().mockResolvedValue([mockMessage]),
        createConversation: jest.fn().mockResolvedValue(mockConversation),
        updateConversation: jest.fn().mockResolvedValue(mockConversation),
        deleteConversation: jest.fn().mockResolvedValue(undefined),
        addMessage: jest.fn().mockResolvedValue(mockMessage)
      };
      ConversationStorageLocal.mockImplementation(() => mockLocalStorage);

      const { result } = renderHook(() => {
        const storage = useConversationStorage();
        const messages = storage.useMessages(mockConversation.id);
        return { storage, messages };
      }, {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
        expect(result.current.messages).toHaveProperty('data');
        expect(result.current.messages).toHaveProperty('isLoading');
      });
    });
  });
});
