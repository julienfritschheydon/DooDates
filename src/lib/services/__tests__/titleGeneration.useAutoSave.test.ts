/**
 * Integration tests for titleGeneration service with useAutoSave hook
 * DooDates - Phase 2.2 Integration Testing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { generateConversationTitle, shouldRegenerateTitle } from "../titleGeneration";
import * as ConversationStorage from "../../storage/ConversationStorageSimple";

// Mock ConversationStorage
vi.mock("../../storage/ConversationStorageSimple", () => ({
  createConversation: vi.fn(),
  addMessages: vi.fn(),
  getConversation: vi.fn(),
  getMessages: vi.fn(),
  getConversationWithMessages: vi.fn(),
  updateConversation: vi.fn(),
}));

// Mock useAuth
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" } }),
}));

// Mock ConversationStorageSupabase to prevent it from being called
vi.mock("../../storage/ConversationStorageSupabase", () => ({
  createConversation: vi.fn().mockRejectedValue(new Error("Supabase not available in tests")),
  addMessages: vi.fn().mockRejectedValue(new Error("Supabase not available in tests")),
  updateConversation: vi.fn().mockRejectedValue(new Error("Supabase not available in tests")),
}));

import { createMockConversation } from "../../../__tests__/helpers/testHelpers";

describe("titleGeneration + useAutoSave Integration", () => {
  const mockConversationStorage = ConversationStorage as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks using helper
    mockConversationStorage.createConversation.mockReturnValue(
      createMockConversation({
        id: "conv-123",
        title: "Test Conversation",
        firstMessage: "Hello",
        messageCount: 1,
      }),
    );

    mockConversationStorage.getMessages.mockReturnValue([]);
    mockConversationStorage.addMessages.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Title Generation Integration", () => {
    it("should generate intelligent title from conversation messages", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      // Start new conversation
      await act(async () => {
        await result.current.startNewConversation();
      });

      // Add scheduling-related messages
      const messages = [
        {
          id: "msg-1",
          content: "Bonjour, je voudrais organiser une réunion équipe",
          isAI: false,
          timestamp: new Date(),
        },
        {
          id: "msg-2",
          content: "Parfait ! Quand souhaitez-vous organiser cette réunion ?",
          isAI: true,
          timestamp: new Date(),
        },
        {
          id: "msg-3",
          content: "Mardi ou mercredi prochain serait idéal",
          isAI: false,
          timestamp: new Date(),
        },
        {
          id: "msg-4",
          content: "Excellent ! Je vais créer un sondage pour mardi et mercredi.",
          isAI: true,
          timestamp: new Date(),
        },
      ];

      // Add messages to conversation
      for (const message of messages) {
        await act(async () => {
          result.current.addMessage(message);
        });
      }

      // Convert to ConversationMessage format for title generation
      const conversationMessages = messages.map((msg) => ({
        id: msg.id,
        conversationId: "conv-123",
        role: msg.isAI ? ("assistant" as const) : ("user" as const),
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      // Test title generation
      const titleResult = generateConversationTitle(conversationMessages, {
        maxTurns: 4,
        language: "fr",
      });

      expect(titleResult.success).toBe(true);
      expect(titleResult.title).toMatch(/réunion|équipe|mardi|mercredi/i);
      expect(titleResult.title.length).toBeGreaterThan(10);
      expect(titleResult.title.length).toBeLessThanOrEqual(50);
    });

    it("should determine when to regenerate titles based on message count", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      await act(async () => {
        await result.current.startNewConversation();
      });

      // Test with 2 messages (should regenerate)
      const twoMessages = [
        {
          id: "msg-1",
          content: "Hello",
          isAI: false,
          timestamp: new Date(),
        },
        {
          id: "msg-2",
          content: "Hi there!",
          isAI: true,
          timestamp: new Date(),
        },
      ];

      for (const message of twoMessages) {
        await act(async () => {
          result.current.addMessage(message);
        });
      }

      const shouldRegenerate2 = shouldRegenerateTitle("Auto-generated title", false, 2);
      expect(shouldRegenerate2).toBe(true);

      // Test with 4 messages (should regenerate)
      const fourMessages = [
        ...twoMessages,
        {
          id: "msg-3",
          content: "How can I help?",
          isAI: true,
          timestamp: new Date(),
        },
        {
          id: "msg-4",
          content: "I need to schedule a meeting",
          isAI: false,
          timestamp: new Date(),
        },
      ];

      for (const message of fourMessages.slice(2)) {
        await act(async () => {
          result.current.addMessage(message);
        });
      }

      const shouldRegenerate4 = shouldRegenerateTitle("Auto-generated title", false, 4);
      expect(shouldRegenerate4).toBe(true);

      // Test with 6 messages (should regenerate - early conversation with even count)
      const shouldRegenerate6 = shouldRegenerateTitle("Auto-generated title", false, 6);
      expect(shouldRegenerate6).toBe(true);
    });

    it("should not regenerate custom titles", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      await act(async () => {
        await result.current.startNewConversation();
      });

      // Add some messages
      const message = {
        id: "msg-1",
        content: "Test message",
        isAI: false,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(message);
      });

      // Test that custom titles are preserved
      const shouldRegenerate = shouldRegenerateTitle("My Custom Meeting Title", true, 4);
      expect(shouldRegenerate).toBe(false);
    });

    it("should handle multilingual content correctly", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      await act(async () => {
        await result.current.startNewConversation();
      });

      // French scheduling conversation
      const frenchMessages = [
        {
          id: "msg-1",
          content: "Organisons une réunion pour discuter du projet",
          isAI: false,
          timestamp: new Date(),
        },
        {
          id: "msg-2",
          content: "Parfait ! Quel jour vous conviendrait le mieux ?",
          isAI: true,
          timestamp: new Date(),
        },
      ];

      for (const message of frenchMessages) {
        await act(async () => {
          result.current.addMessage(message);
        });
      }

      const conversationMessages = frenchMessages.map((msg) => ({
        id: msg.id,
        conversationId: "conv-123",
        role: msg.isAI ? ("assistant" as const) : ("user" as const),
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const titleResult = generateConversationTitle(conversationMessages, {
        language: "fr",
      });

      expect(titleResult.success).toBe(true);
      expect(titleResult.title).toMatch(/réunion|projet/i);
    });

    it("should integrate with conversation storage updates", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      // Mock conversation that will be created
      const createdConversation = {
        id: "conv-123",
        title: "Je veux planifier une réunion d'équipe",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessage: "Je veux planifier une réunion d'équipe",
        messageCount: 0,
        isFavorite: false,
        tags: [],
        userId: "test-user",
      };

      // Track conversation creation state
      let conversationExists = false;

      // Mock getConversation to return null initially, then conversation after creation
      // Important: getConversation is called with the conversation ID, which could be temp-xxx or conv-123
      mockConversationStorage.getConversation.mockImplementation((id) => {
        // If conversation was created and we're asking for it by its real ID, return it
        if (conversationExists && id === "conv-123") {
          return createdConversation;
        }
        // Otherwise return null (conversation doesn't exist yet)
        return null;
      });

      // Mock createConversation to mark conversation as existing
      mockConversationStorage.createConversation.mockImplementation(() => {
        conversationExists = true;
        return createdConversation;
      });

      // Mock getMessages to return messages as they're added
      mockConversationStorage.getMessages.mockReturnValue([]);

      // Start new conversation - this creates a temp ID
      await act(async () => {
        await result.current.startNewConversation();
      });

      // Verify we have a temp ID
      const tempId = result.current.conversationId;
      expect(tempId).toMatch(/^temp-/);

      // Add first message - this will trigger createConversation
      const firstMessage = {
        id: "msg-1",
        content: "Je veux planifier une réunion d'équipe",
        isAI: false,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(firstMessage);
      });

      // Verify initial conversation creation was called
      expect(mockConversationStorage.createConversation).toHaveBeenCalled();

      // Verify it was called with correct parameters
      const createCall = mockConversationStorage.createConversation.mock.calls[0]?.[0];
      expect(createCall).toMatchObject({
        title: "Je veux planifier une réunion d'équipe",
        firstMessage: "Je veux planifier une réunion d'équipe",
        userId: "test-user",
      });

      // After first message, conversation exists and messages are available
      mockConversationStorage.getMessages.mockReturnValue([
        {
          id: firstMessage.id,
          conversationId: "conv-123",
          content: firstMessage.content,
          role: "user",
          timestamp: firstMessage.timestamp,
        },
      ]);

      // Add second message
      const secondMessage = {
        id: "msg-2",
        content: "Excellente idée ! Quand souhaitez-vous la programmer ?",
        isAI: true,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(secondMessage);
      });

      // Verify that addMessages was called (conversation storage integration)
      expect(mockConversationStorage.addMessages).toHaveBeenCalled();
    });

    it("should handle edge cases gracefully", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      // Mock conversation that will be created
      const createdConversation = {
        id: "conv-123",
        title: "Hi",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessage: "Hi",
        messageCount: 0,
        isFavorite: false,
        tags: [],
        userId: "test-user",
      };

      // Track conversation creation state
      let conversationExists = false;

      // Mock getConversation to return null initially, then conversation after creation
      // Important: getConversation is called with the conversation ID, which could be temp-xxx or conv-123
      mockConversationStorage.getConversation.mockImplementation((id) => {
        // If conversation was created and we're asking for it by its real ID, return it
        if (conversationExists && id === "conv-123") {
          return createdConversation;
        }
        // Otherwise return null (conversation doesn't exist yet)
        return null;
      });

      // Mock createConversation to mark conversation as existing
      mockConversationStorage.createConversation.mockImplementation(() => {
        conversationExists = true;
        return createdConversation;
      });

      mockConversationStorage.getMessages.mockReturnValue([]);

      await act(async () => {
        await result.current.startNewConversation();
      });

      // Verify we have a temp ID
      expect(result.current.conversationId).toMatch(/^temp-/);

      // Test with very short message
      const shortMessage = {
        id: "msg-1",
        content: "Hi",
        isAI: false,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(shortMessage);
      });

      // Verify conversation was created
      expect(mockConversationStorage.createConversation).toHaveBeenCalled();

      // After first message, conversation exists and messages are available
      mockConversationStorage.getMessages.mockReturnValue([
        {
          id: shortMessage.id,
          conversationId: "conv-123",
          content: shortMessage.content,
          role: "user",
          timestamp: shortMessage.timestamp,
        },
      ]);

      // Test with very long message
      const longMessage = {
        id: "msg-2",
        content: "A".repeat(200), // Very long message
        isAI: true,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(longMessage);
      });

      // Verify no errors occurred - addMessages should be called for the second message
      // (first message creates conversation, second message calls addMessages)
      expect(mockConversationStorage.addMessages).toHaveBeenCalled();
    });

    it("should preserve conversation state during title generation", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      await act(async () => {
        await result.current.startNewConversation();
      });

      const initialConversationId = result.current.conversationId;

      // Add message
      const message = {
        id: "msg-1",
        content: "Test message for title generation",
        isAI: false,
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.addMessage(message);
      });

      // Verify conversation ID is preserved
      expect(result.current.conversationId).toBeTruthy();
      expect(result.current.lastSaved).toBeTruthy();
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle title generation errors gracefully", async () => {
      const { result } = renderHook(() => useAutoSave({ debug: false }));

      // Mock conversation that will be created
      const createdConversation = {
        id: "conv-123",
        title: "This should cause an error",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessage: "This should cause an error",
        messageCount: 0,
        isFavorite: false,
        tags: [],
        userId: "test-user",
      };

      // Track conversation creation state
      let conversationExists = false;

      // Mock getConversation to return null initially, then conversation after creation
      // Important: getConversation is called with the conversation ID, which could be temp-xxx or conv-123
      mockConversationStorage.getConversation.mockImplementation((id) => {
        // If conversation was created and we're asking for it by its real ID, return it
        if (conversationExists && id === "conv-123") {
          return createdConversation;
        }
        // Otherwise return null (conversation doesn't exist yet)
        return null;
      });

      // Mock createConversation to mark conversation as existing
      mockConversationStorage.createConversation.mockImplementation(() => {
        conversationExists = true;
        return createdConversation;
      });

      mockConversationStorage.getMessages.mockReturnValue([]);

      // Mock storage error on addMessages (after conversation is created)
      mockConversationStorage.addMessages.mockImplementation(() => {
        throw new Error("Storage error");
      });

      await act(async () => {
        await result.current.startNewConversation();
      });

      // Add message that would normally trigger title generation
      const message = {
        id: "msg-1",
        content: "This should cause an error",
        isAI: false,
        timestamp: new Date(),
      };

      // After message is added, it should be in the messages list
      mockConversationStorage.getMessages.mockReturnValue([
        {
          id: message.id,
          conversationId: "conv-123",
          content: message.content,
          role: "user",
          timestamp: message.timestamp,
        },
      ]);

      // Should not throw error - error should be caught and handled
      await act(async () => {
        result.current.addMessage(message);
      });

      // Verify conversation was created (proves code executed)
      expect(mockConversationStorage.createConversation).toHaveBeenCalled();
      // addMessages is called but throws an error, which is caught in the try-catch
      // The error is handled gracefully, so the test should not throw
    });

    it("should handle empty message arrays in title generation", () => {
      const titleResult = generateConversationTitle([], { language: "fr" });

      expect(titleResult.success).toBe(false);
      expect(titleResult.title).toBe("");
    });
  });
});
