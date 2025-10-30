/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useConversationStorage } from "../useConversationStorage";
import { useAuth } from "../../contexts/AuthContext";
import { Conversation, ConversationMessage } from "../../types/conversation";
import { ConversationStorageLocal } from "../../lib/storage/ConversationStorageLocal";

// Mock dependencies
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseAuth = vi.mocked(useAuth);

// Mock the modules
vi.mock("../../lib/storage/ConversationStorageLocal", () => ({
  ConversationStorageLocal: class {
    static STORAGE_KEY = "doodates_conversations";
    static STORAGE_VERSION = "1.0.0";
    static EXPIRATION_DAYS = 30;
    static GUEST_QUOTA_LIMIT = 10;

    // Static methods
    static initialize = vi.fn().mockResolvedValue(undefined);
    static exportForMigration = vi.fn().mockReturnValue({ conversations: [], messages: {} });
    static getConversations = vi.fn().mockResolvedValue([]);
    static getConversation = vi.fn().mockResolvedValue(null);
    static createConversation = vi.fn().mockResolvedValue({});
    static deleteConversation = vi.fn().mockResolvedValue(undefined);
    static saveMessages = vi.fn().mockResolvedValue(undefined);
    static getMessages = vi.fn().mockResolvedValue([]);

    constructor() {
      this.initialize = vi.fn().mockResolvedValue(undefined);
      this.createConversation = vi.fn().mockResolvedValue({});
      this.saveConversation = vi.fn().mockResolvedValue(undefined);
      this.saveMessages = vi.fn().mockResolvedValue(undefined);
      this.getConversations = vi.fn().mockResolvedValue([]);
      this.getConversation = vi.fn().mockResolvedValue(null);
      this.getConversationWithMessages = vi
        .fn()
        .mockResolvedValue({ conversation: null, messages: [] });
      this.getMessages = vi.fn().mockResolvedValue([]);
      this.deleteConversation = vi.fn().mockResolvedValue(undefined);
      this.clearAll = vi.fn().mockResolvedValue(undefined);
      this.getQuotaInfo = vi.fn().mockReturnValue({ used: 0, limit: 10, isGuest: true });
      this.exportForMigration = vi.fn().mockReturnValue({ conversations: [], messages: {} });
    }

    // Mock methods will be added by the constructor
    initialize: (isGuest: boolean) => Promise<void>;
    createConversation: (conversation: any) => Promise<any>;
    saveConversation: (conversation: any) => Promise<void>;
    saveMessages: (conversationId: string, messages: any[]) => Promise<void>;
    getConversations: () => Promise<any[]>;
    getConversation: (id: string) => Promise<any>;
    getConversationWithMessages: (id: string) => Promise<{ conversation: any; messages: any[] }>;
    getMessages: (conversationId: string) => Promise<any[]>;
    deleteConversation: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    getQuotaInfo: () => { used: number; limit: number; isGuest: boolean };
    exportForMigration: () => {
      conversations: any[];
      messages: Record<string, any[]>;
    };
  },
}));

vi.mock("../../lib/storage/ConversationStorageSupabase", () => ({
  ConversationStorageSupabase: class {
    static STORAGE_KEY = "doodates_conversations_supabase";
    static STORAGE_VERSION = "1.0.0";

    // Static methods
    static initialize = vi.fn().mockResolvedValue(undefined);
    static exportForMigration = vi.fn().mockReturnValue({ conversations: [], messages: {} });

    constructor() {
      this.initialize = vi.fn().mockResolvedValue(undefined);
      this.createConversation = vi.fn().mockResolvedValue({});
      this.saveConversation = vi.fn().mockResolvedValue(undefined);
      this.saveMessages = vi.fn().mockResolvedValue(undefined);
      this.getConversations = vi.fn().mockResolvedValue([]);
      this.getConversation = vi.fn().mockResolvedValue(null);
      this.getConversationWithMessages = vi
        .fn()
        .mockResolvedValue({ conversation: null, messages: [] });
      this.getMessages = vi.fn().mockResolvedValue([]);
      this.deleteConversation = vi.fn().mockResolvedValue(undefined);
      this.clearAll = vi.fn().mockResolvedValue(undefined);
      this.getQuotaInfo = vi.fn().mockReturnValue({ used: 0, limit: 1000, isGuest: false });
      this.exportForMigration = vi.fn().mockReturnValue({ conversations: [], messages: {} });
    }

    // Mock methods will be added by the constructor
    initialize: (isGuest: boolean) => Promise<void>;
    createConversation: (conversation: any) => Promise<any>;
    saveConversation: (conversation: any) => Promise<void>;
    saveMessages: (conversationId: string, messages: any[]) => Promise<void>;
    getConversations: () => Promise<any[]>;
    getConversation: (id: string) => Promise<any>;
    getConversationWithMessages: (id: string) => Promise<{ conversation: any; messages: any[] }>;
    getMessages: (conversationId: string) => Promise<any[]>;
    deleteConversation: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    getQuotaInfo: () => { used: number; limit: number; isGuest: boolean };
    exportForMigration: () => {
      conversations: any[];
      messages: Record<string, any[]>;
    };
  },
}));

vi.mock("../../services/ConversationMigrationService", () => ({
  migrateConversations: vi.fn().mockResolvedValue({ success: true }),
}));

import {
  createMockUser,
  createMockConversation,
  createMockMessage,
  createQueryWrapper,
  createTestQueryClient,
} from "../../__tests__/helpers/testHelpers";

describe("useConversationStorage", () => {
  let queryClient: QueryClient;

  const mockUser = createMockUser();
  const mockConversation = createMockConversation({
    id: "123e4567-e89b-12d3-a456-426614174000",
    firstMessage: "Hello, this is a test message",
    messageCount: 1,
    metadata: {
      pollGenerated: false,
      errorOccurred: false,
      aiModel: "gemini-pro",
      language: "fr" as const,
      userAgent: "test-agent",
    },
  });

  const mockMessage = createMockMessage({
    id: "123e4567-e89b-12d3-a456-426614174001",
    conversationId: "123e4567-e89b-12d3-a456-426614174000",
    content: "Hello, this is a test message",
    metadata: {
      pollGenerated: false,
      errorOccurred: false,
      processingTime: 100,
      tokenCount: 10,
    },
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Setup default auth mock
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
      refreshProfile: vi.fn(),
    });

    // Mock ConversationStorageLocal methods
    vi.mocked(ConversationStorageLocal.getConversations).mockResolvedValue([]);
    vi.mocked(ConversationStorageLocal.getConversation).mockResolvedValue(null);
    vi.mocked(ConversationStorageLocal.createConversation).mockResolvedValue(mockConversation);
    vi.mocked(ConversationStorageLocal.deleteConversation).mockResolvedValue();
    vi.mocked(ConversationStorageLocal.exportForMigration).mockReturnValue({
      conversations: [],
      messages: {},
    });
  });

  describe("Basic Hook Functionality", () => {
    it("should initialize correctly with default options", async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
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

    it("should detect guest mode when user is not authenticated", async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.storageMode.isGuest).toBe(true);
        expect(result.current.storageMode.isAuthenticated).toBe(false);
        expect(result.current.storageMode.provider).toBe("localStorage");
      });
    });

    it("should detect authenticated mode when user is logged in", async () => {
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
        refreshProfile: vi.fn(),
      });

      const { result } = renderHook(
        () =>
          useConversationStorage({
            supabaseUrl: "https://test.supabase.co",
            supabaseKey: "test-key",
          }),
        {
          wrapper: createQueryWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.storageMode.isAuthenticated).toBe(true);
        expect(result.current.storageMode.isGuest).toBe(false);
        expect(result.current.storageMode.provider).toBe("localStorage"); // Currently uses localStorage since Supabase storage isn't implemented yet
      });
    });
  });

  describe("Data Operations", () => {
    it("should fetch conversations successfully", async () => {
      const mockConversations = [mockConversation];
      vi.mocked(ConversationStorageLocal.getConversations).mockResolvedValue(mockConversations);

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.conversations.data).toEqual(mockConversations);
        expect(result.current.conversations.isLoading).toBe(false);
        expect(result.current.conversations.isError).toBe(false);
      });
    });

    it("should create conversation successfully", async () => {
      const newConv = { ...mockConversation, title: "New Conversation" };
      vi.mocked(ConversationStorageLocal.createConversation).mockResolvedValue(newConv);

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.createConversation).toBeDefined();
      });

      act(() => {
        result.current.createConversation.mutate({
          title: "New Conversation",
          userId: "test-user",
          status: "active",
          firstMessage: "Hello",
          messageCount: 0,
          isFavorite: false,
          tags: [],
        });
      });

      await waitFor(() => {
        expect(result.current.createConversation.isSuccess).toBe(true);
      });
    });

    it("should update conversation successfully", async () => {
      const updatedConv = { ...mockConversation, title: "Updated" };
      vi.mocked(ConversationStorageLocal.getConversation).mockResolvedValue(updatedConv);

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.updateConversation.mutate({
          id: mockConversation.id,
          updates: { title: "Updated" },
        });
      });

      await waitFor(() => {
        expect(result.current.updateConversation.isSuccess).toBe(true);
      });
    });

    it("should delete conversation successfully", async () => {
      vi.mocked(ConversationStorageLocal.deleteConversation).mockResolvedValue();

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.deleteConversation.mutate(mockConversation.id);
      });

      await waitFor(() => {
        expect(result.current.deleteConversation.isSuccess).toBe(true);
      });
    });

    it("should add message successfully", async () => {
      const message: ConversationMessage = {
        id: "msg-1",
        conversationId: mockConversation.id,
        role: "user",
        content: "Test message",
        timestamp: new Date(),
      };

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.addMessage.mutate({
          conversationId: mockConversation.id,
          message,
        });
      });

      await waitFor(() => {
        expect(result.current.addMessage.isSuccess).toBe(true);
      });
    });
  });

  describe("Quota Management", () => {
    it("should calculate quota correctly for guest users", async () => {
      // Mock guest user
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
        refreshProfile: vi.fn(),
      });

      const mockConversations = [mockConversation, { ...mockConversation, id: "conv-2" }];
      vi.mocked(ConversationStorageLocal.exportForMigration).mockReturnValue({
        conversations: mockConversations,
        messages: {},
      });

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quota.used).toBe(2);
        expect(result.current.quota.limit).toBe(10); // GUEST_MAX_CONVERSATIONS
        expect(result.current.quota.remaining).toBe(8);
        expect(result.current.canCreateConversation).toBe(true);
      });
    });

    it("should detect when quota is exceeded", async () => {
      // Mock guest user with 10 conversations (at limit)
      const mockConversations = Array.from({ length: 10 }, (_, i) => ({
        ...mockConversation,
        id: `conv-${i}`,
      }));

      vi.mocked(ConversationStorageLocal.exportForMigration).mockReturnValue({
        conversations: mockConversations,
        messages: {},
      });

      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(result.current.quota.used).toBe(10);
        expect(result.current.quota.remaining).toBe(0);
        expect(result.current.quota.isAtLimit).toBe(true);
        expect(result.current.canCreateConversation).toBe(false);
        expect(result.current.shouldShowQuotaWarning).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("should provide error handling structure", async () => {
      const { result } = renderHook(() => useConversationStorage(), {
        wrapper: createQueryWrapper(),
      });

      // Test that error handling properties exist
      expect(result.current.hasError).toBeDefined();
      expect(typeof result.current.hasError).toBe("boolean");

      // Test that mutation error handling exists
      expect(result.current.createConversation.isError).toBeDefined();
      expect(result.current.updateConversation.isError).toBeDefined();
      expect(result.current.deleteConversation.isError).toBeDefined();
      expect(result.current.addMessage.isError).toBeDefined();
    });
  });

  describe("Hook Queries", () => {
    it("should provide useConversation hook", async () => {
      // Mock the storage to return conversation data
      // ConversationStorageLocal is already mocked via vi.mock()

      const { result } = renderHook(
        () => {
          const storage = useConversationStorage();
          const conversation = storage.useConversation(mockConversation.id);
          return { storage, conversation };
        },
        {
          wrapper: createQueryWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.conversation).toBeDefined();
        expect(result.current.conversation).toHaveProperty("data");
        expect(result.current.conversation).toHaveProperty("isLoading");
      });
    });

    it("should provide useMessages hook", async () => {
      // Mock the storage to return message data
      // ConversationStorageLocal is already mocked via vi.mock()

      const { result } = renderHook(
        () => {
          const storage = useConversationStorage();
          const messages = storage.useMessages(mockConversation.id);
          return { storage, messages };
        },
        {
          wrapper: createQueryWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.messages).toBeDefined();
        expect(result.current.messages).toHaveProperty("data");
        expect(result.current.messages).toHaveProperty("isLoading");
      });
    });
  });
});
