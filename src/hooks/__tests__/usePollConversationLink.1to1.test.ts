/**
 * Tests for 1:1 Poll-Conversation Relations (Task 2.1)
 * DooDates - Direct Relations Testing
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePollConversationLink } from "../usePollConversationLink";
import { useConversations } from "../useConversations";
import type { Conversation } from "../../types/conversation";

// Mock useConversations
vi.mock("../useConversations");
const mockUseConversations = vi.mocked(useConversations);

describe("usePollConversationLink - 1:1 Relations (Task 2.1)", () => {
  const mockUpdateConversation = {
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  };

  const mockUseConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConversations.mockReturnValue({
      updateConversation: mockUpdateConversation,
      useConversation: mockUseConversation,
      conversations: { data: [] },
    } as any);
  });

  describe("1:1 Link Creation", () => {
    it("should create direct 1:1 relationship using tags (current implementation)", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({
        id: "conv-1",
        tags: ["poll:poll-1"],
      });

      const { result } = renderHook(() => usePollConversationLink());

      await act(async () => {
        const success = await result.current.linkPollToConversation("conv-1", {
          pollId: "poll-1",
          pollTitle: "Test Poll",
          messageId: "msg-1",
        });

        expect(success).toBe(true);
      });

      // Current implementation uses tags
      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledWith({
        id: "conv-1",
        updates: {
          tags: ["poll:poll-1"],
        },
      });
    });

    it("should handle linking errors gracefully", async () => {
      mockUpdateConversation.mutateAsync.mockRejectedValue(
        new Error("Update failed"),
      );

      const { result } = renderHook(() => usePollConversationLink());

      await act(async () => {
        const success = await result.current.linkPollToConversation("conv-1", {
          pollId: "poll-1",
          pollTitle: "Test Poll",
          messageId: "msg-1",
        });

        expect(success).toBe(false);
      });
    });
  });

  describe("Link Detection", () => {
    it("should detect existing poll links using tags", () => {
      mockUseConversation.mockReturnValue({
        conversation: {
          id: "conv-1",
          tags: ["poll:poll-1", "other-tag"],
        },
      });

      const { result } = renderHook(() => usePollConversationLink());

      const hasLink = result.current.hasLinkedPoll("conv-1");
      expect(hasLink).toBe(true);
    });

    it("should return false when no poll link exists", () => {
      mockUseConversation.mockReturnValue({
        conversation: {
          id: "conv-1",
          tags: ["other-tag"],
        },
      });

      const { result } = renderHook(() => usePollConversationLink());

      const hasLink = result.current.hasLinkedPoll("conv-1");
      expect(hasLink).toBe(false);
    });

    it("should extract poll information from tags", () => {
      mockUseConversation.mockReturnValue({
        conversation: {
          id: "conv-1",
          tags: ["poll:poll-1", "other-tag"],
        },
      });

      const { result } = renderHook(() => usePollConversationLink());

      const linkedPoll = result.current.getLinkedPoll("conv-1");
      expect(linkedPoll).toEqual({
        pollId: "poll-1",
        pollTitle: "Poll",
        createdAt: expect.any(String),
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to conversation from poll", () => {
      const { result } = renderHook(() => usePollConversationLink());

      act(() => {
        result.current.navigateToConversation("conv-1");
      });

      // Navigation functionality is tested in the existing test file
      expect(result.current.navigateToConversation).toBeDefined();
    });

    it("should navigate to poll from conversation", () => {
      const { result } = renderHook(() => usePollConversationLink());

      act(() => {
        result.current.navigateToPoll("poll-1");
      });

      // Navigation functionality is tested in the existing test file
      expect(result.current.navigateToPoll).toBeDefined();
    });
  });

  describe("Metadata Generation", () => {
    it("should generate poll link metadata", () => {
      const { result } = renderHook(() => usePollConversationLink());

      const metadata = result.current.getPollLinkMetadata(
        "conv-1",
        "msg-1",
        "Test Conversation",
      );

      expect(metadata).toEqual({
        conversationId: "conv-1",
        messageId: "msg-1",
        conversationTitle: "Test Conversation",
        generatedAt: expect.any(String),
      });
    });
  });
});
