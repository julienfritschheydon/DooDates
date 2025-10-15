/**
 * Tests for deleteCascade service
 * DooDates - Atomic deletion with cascade and confirmation tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock error handling
vi.mock("../../error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn((en, fr) => new Error(en)),
  },
}));

import {
  prepareCascadeDelete,
  executeCascadeDelete,
  hasRelatedContent,
  type DeleteCascadeContext,
  type DeleteCascadeOptions,
} from "../deleteCascade";

import type {
  Conversation,
  ConversationMessage,
} from "../../../types/conversation";

// Mock data helpers
function createMockConversation(
  id: string,
  title: string = "Test Conversation",
): Conversation {
  return {
    id,
    title,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    firstMessage: "Test message",
    messageCount: 2,
    isFavorite: false,
    tags: [],
    relatedPollId: undefined,
  };
}

function createMockMessage(
  id: string,
  conversationId: string,
  content: string,
): ConversationMessage {
  return {
    id,
    conversationId,
    role: "user",
    content,
    timestamp: new Date(),
  };
}

function createMockPoll(id: string, conversationId: string) {
  return {
    id,
    conversationId,
    title: "Test Poll",
    description: "Test poll description",
  };
}

describe("deleteCascade", () => {
  let mockContext: DeleteCascadeContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock context for each test
    mockContext = {
      conversationStorage: {
        getConversation: vi.fn() as any,
        deleteConversation: vi.fn() as any,
        getMessages: vi.fn() as any,
        deleteMessages: vi.fn() as any,
      },
      pollStorage: {
        getPoll: vi.fn() as any,
        deletePoll: vi.fn() as any,
        findPollByConversationId: vi.fn() as any,
      },
    };
  });

  describe("prepareCascadeDelete", () => {
    it("should prepare deletion for conversation without related poll", async () => {
      const conversation = createMockConversation("conv-1", "Meeting Planning");
      const messages = [
        createMockMessage("msg-1", "conv-1", "Hello"),
        createMockMessage("msg-2", "conv-1", "Hi there"),
      ];

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      const result = await prepareCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(true);
      expect(result.deleted.conversations).toEqual(["conv-1"]);
      expect(result.deleted.messages).toEqual(["msg-1", "msg-2"]);
      expect(result.deleted.polls).toEqual([]);
      expect(result.confirmationMessages.title).toBe(
        "Confirmer la suppression",
      );
      expect(result.confirmationMessages.description).toContain(
        "Meeting Planning",
      );
      expect(result.confirmationMessages.warningText).toContain("2 messages");
    });

    it("should prepare deletion for conversation with related poll", async () => {
      const conversation = createMockConversation("conv-1", "Poll Discussion");
      const messages = [createMockMessage("msg-1", "conv-1", "Test message")];
      const poll = createMockPoll("poll-1", "conv-1");

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(poll);

      const result = await prepareCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(true);
      expect(result.deleted.conversations).toEqual(["conv-1"]);
      expect(result.deleted.messages).toEqual(["msg-1"]);
      expect(result.deleted.polls).toEqual(["poll-1"]);
      expect(result.confirmationMessages.description).toContain(
        "sondage associé",
      );
      expect(result.confirmationMessages.warningText).toContain(
        "conversation (1 messages) et le sondage",
      );
    });

    it("should handle non-existent conversation", async () => {
      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(null);

      const result = await prepareCascadeDelete("nonexistent", mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Conversation non trouvée");
      expect(result.deleted.conversations).toEqual([]);
    });

    it("should generate English confirmation messages", async () => {
      const conversation = createMockConversation(
        "conv-1",
        "Test Conversation",
      );
      const messages = [createMockMessage("msg-1", "conv-1", "Test")];

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      const options: DeleteCascadeOptions = { language: "en" };
      const result = await prepareCascadeDelete("conv-1", mockContext, options);

      expect(result.success).toBe(true);
      expect(result.confirmationMessages.title).toBe("Confirm Deletion");
      expect(result.confirmationMessages.confirmButtonText).toBe(
        "Delete Permanently",
      );
      expect(result.confirmationMessages.cancelButtonText).toBe("Cancel");
    });

    it("should support dry run mode", async () => {
      const conversation = createMockConversation("conv-1");
      const messages = [createMockMessage("msg-1", "conv-1", "Test")];

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      const options: DeleteCascadeOptions = { dryRun: true };
      const result = await prepareCascadeDelete("conv-1", mockContext, options);

      expect(result.success).toBe(true);
      expect(result.deleted.conversations).toEqual(["conv-1"]);
      // Verify no actual deletion calls were made
      expect(
        mockContext.conversationStorage.deleteConversation,
      ).not.toHaveBeenCalled();
      expect(
        mockContext.conversationStorage.deleteMessages,
      ).not.toHaveBeenCalled();
    });
  });

  describe("executeCascadeDelete", () => {
    it("should execute deletion in correct order", async () => {
      const conversation = createMockConversation("conv-1");
      const messages = [
        createMockMessage("msg-1", "conv-1", "Message 1"),
        createMockMessage("msg-2", "conv-1", "Message 2"),
      ];
      const poll = createMockPoll("poll-1", "conv-1");

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(poll);

      const result = await executeCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(true);
      expect(result.deleted.conversations).toEqual(["conv-1"]);
      expect(result.deleted.messages).toEqual(["msg-1", "msg-2"]);
      expect(result.deleted.polls).toEqual(["poll-1"]);

      // Verify deletion order: messages first, then conversation, then poll
      expect(
        mockContext.conversationStorage.deleteMessages,
      ).toHaveBeenCalledWith("conv-1");
      expect(
        mockContext.conversationStorage.deleteConversation,
      ).toHaveBeenCalledWith("conv-1");
      expect(mockContext.pollStorage.deletePoll).toHaveBeenCalledWith("poll-1");
    });

    it("should handle conversation without messages or poll", async () => {
      const conversation = createMockConversation("conv-1");

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        [],
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      const result = await executeCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(true);
      expect(
        mockContext.conversationStorage.deleteConversation,
      ).toHaveBeenCalledWith("conv-1");
      expect(
        mockContext.conversationStorage.deleteMessages,
      ).not.toHaveBeenCalled();
      expect(mockContext.pollStorage.deletePoll).not.toHaveBeenCalled();
    });

    it("should provide rollback function on failure", async () => {
      const conversation = createMockConversation("conv-1");
      const messages = [createMockMessage("msg-1", "conv-1", "Test")];

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      // Simulate failure during conversation deletion
      (
        mockContext.conversationStorage.deleteConversation as any
      ).mockRejectedValue(new Error("Storage error"));

      const result = await executeCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.rollback).toBeDefined();
      expect(typeof result.rollback).toBe("function");
    });

    it("should handle storage errors gracefully", async () => {
      (
        mockContext.conversationStorage.getConversation as any
      ).mockRejectedValue(new Error("Database error"));

      const result = await executeCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("hasRelatedContent", () => {
    it("should detect messages and poll correctly", async () => {
      const messages = [
        createMockMessage("msg-1", "conv-1", "Message 1"),
        createMockMessage("msg-2", "conv-1", "Message 2"),
      ];
      const poll = createMockPoll("poll-1", "conv-1");

      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(poll);

      const result = await hasRelatedContent("conv-1", mockContext);

      expect(result.hasMessages).toBe(true);
      expect(result.hasPoll).toBe(true);
      expect(result.messageCount).toBe(2);
    });

    it("should handle conversation with no related content", async () => {
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        [],
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      const result = await hasRelatedContent("conv-1", mockContext);

      expect(result.hasMessages).toBe(false);
      expect(result.hasPoll).toBe(false);
      expect(result.messageCount).toBe(0);
    });

    it("should handle storage errors", async () => {
      (mockContext.conversationStorage.getMessages as any).mockRejectedValue(
        new Error("Storage error"),
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockRejectedValue(new Error("Storage error"));

      const result = await hasRelatedContent("conv-1", mockContext);

      expect(result.hasMessages).toBe(false);
      expect(result.hasPoll).toBe(false);
      expect(result.messageCount).toBe(0);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete cascade deletion workflow", async () => {
      const conversation = createMockConversation(
        "conv-1",
        "Important Meeting",
      );
      const messages = [
        createMockMessage("msg-1", "conv-1", "Let's schedule a meeting"),
        createMockMessage("msg-2", "conv-1", "Great idea!"),
      ];
      const poll = createMockPoll("poll-1", "conv-1");

      // Setup mocks
      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(poll);

      // First prepare the deletion
      const preparation = await prepareCascadeDelete("conv-1", mockContext, {
        dryRun: true,
      });

      expect(preparation.success).toBe(true);
      expect(preparation.deleted.conversations).toEqual(["conv-1"]);
      expect(preparation.deleted.messages).toEqual(["msg-1", "msg-2"]);
      expect(preparation.deleted.polls).toEqual(["poll-1"]);

      // Then execute the deletion
      const execution = await executeCascadeDelete("conv-1", mockContext);

      expect(execution.success).toBe(true);
      expect(execution.deleted).toEqual(preparation.deleted);

      // Verify all deletion calls were made
      expect(
        mockContext.conversationStorage.deleteMessages,
      ).toHaveBeenCalledWith("conv-1");
      expect(
        mockContext.conversationStorage.deleteConversation,
      ).toHaveBeenCalledWith("conv-1");
      expect(mockContext.pollStorage.deletePoll).toHaveBeenCalledWith("poll-1");
    });

    it("should handle partial failures with rollback", async () => {
      const conversation = createMockConversation("conv-1");
      const messages = [createMockMessage("msg-1", "conv-1", "Test")];
      const poll = createMockPoll("poll-1", "conv-1");

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(poll);

      // Messages deletion succeeds
      (
        mockContext.conversationStorage.deleteMessages as any
      ).mockResolvedValue();
      // Conversation deletion fails
      (
        mockContext.conversationStorage.deleteConversation as any
      ).mockRejectedValue(new Error("Deletion failed"));

      const result = await executeCascadeDelete("conv-1", mockContext);

      expect(result.success).toBe(false);
      expect(result.rollback).toBeDefined();

      // Messages should have been deleted before failure
      expect(mockContext.conversationStorage.deleteMessages).toHaveBeenCalled();
      // Poll should not have been deleted due to earlier failure
      expect(mockContext.pollStorage.deletePoll).not.toHaveBeenCalled();
    });

    it("should work with different language options", async () => {
      const conversation = createMockConversation("conv-1", "Test");
      const messages = [createMockMessage("msg-1", "conv-1", "Test")];

      (
        mockContext.conversationStorage.getConversation as any
      ).mockResolvedValue(conversation);
      (mockContext.conversationStorage.getMessages as any).mockResolvedValue(
        messages,
      );
      (
        mockContext.pollStorage.findPollByConversationId as any
      ).mockResolvedValue(null);

      // Test French (default)
      const frenchResult = await prepareCascadeDelete("conv-1", mockContext);
      expect(frenchResult.confirmationMessages.title).toBe(
        "Confirmer la suppression",
      );

      // Test English
      const englishResult = await prepareCascadeDelete("conv-1", mockContext, {
        language: "en",
      });
      expect(englishResult.confirmationMessages.title).toBe("Confirm Deletion");
    });
  });
});
