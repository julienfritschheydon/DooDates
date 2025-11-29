/**
 * Tests for usePollConversationLink hook
 * DooDates - Bidirectional Navigation Tests
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePollConversationLink } from "../usePollConversationLink";
import { useConversations } from "../useConversations";

// Mock the useConversations hook
vi.mock("../useConversations");
const mockUseConversations = vi.mocked(useConversations);

// Mock localStorage with Vitest mocks
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock window.location with a mutable href
let mockHref = "http://localhost:3000";
const mockLocation = {
  get href() {
    return mockHref;
  },
  set href(value: string) {
    // Convert relative URLs to absolute
    if (value.startsWith("/")) {
      mockHref = `http://localhost:3000${value}`;
    } else {
      mockHref = value;
    }
  },
  toString: () => mockHref,
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
  configurable: true,
});

describe("usePollConversationLink", () => {
  const mockUpdateConversation = {
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  };

  const mockUseConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset location href
    mockHref = "http://localhost:3000";
    mockUseConversations.mockReturnValue({
      updateConversation: mockUpdateConversation,
      useConversation: mockUseConversation,
    } as any);
  });

  describe("linkPollToConversation", () => {
    it("should successfully link a poll to a conversation", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollConversationLink());

      await act(async () => {
        const success = await result.current.linkPollToConversation("conv-1", {
          pollId: "poll-1",
          pollTitle: "Test Poll",
          messageId: "msg-1",
        });

        expect(success).toBe(true);
      });

      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledWith({
        id: "conv-1",
        updates: {
          tags: ["poll:poll-1"],
        },
      });
    });

    it("should handle linking errors gracefully", async () => {
      mockUpdateConversation.mutateAsync.mockRejectedValue(new Error("Update failed"));

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

  describe("getPollLinkMetadata", () => {
    it("should generate correct poll link metadata", () => {
      const { result } = renderHook(() => usePollConversationLink());

      const metadata = result.current.getPollLinkMetadata("conv-1", "msg-1", "Test Conversation");

      expect(metadata).toEqual({
        conversationId: "conv-1",
        messageId: "msg-1",
        conversationTitle: "Test Conversation",
        generatedAt: expect.any(String),
      });
    });
  });

  describe("navigateToConversation", () => {
    it("should set up navigation to conversation", () => {
      const { result } = renderHook(() => usePollConversationLink());

      act(() => {
        result.current.navigateToConversation("conv-1");
      });

      // Vérifier que setItem a été appelé
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "resumeConversation",
        expect.stringContaining("conv-1"),
      );

      // Vérifier que la chaîne JSON contient les bonnes données
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData.conversationId).toBe("conv-1");
      expect(savedData.source).toBe("poll");
      expect(savedData.timestamp).toBeDefined();

      expect(window.location.href).toContain("conversation=conv-1");
      expect(window.location.href).toContain("source=poll");
    });
  });

  describe("navigateToPoll", () => {
    it("should navigate to poll with conversation source", () => {
      const { result } = renderHook(() => usePollConversationLink());

      act(() => {
        result.current.navigateToPoll("poll-1");
      });

      expect(window.location.href).toBe(
        "http://localhost:3000/DooDates/poll/poll-1?source=conversation",
      );
    });
  });

  describe("hasLinkedPoll", () => {
    it("should detect when conversation has linked polls", () => {
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

    it("should return false when conversation has no linked polls", () => {
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

    it("should handle missing conversation data", () => {
      mockUseConversation.mockReturnValue({
        conversation: null,
      });

      const { result } = renderHook(() => usePollConversationLink());

      const hasLink = result.current.hasLinkedPoll("conv-1");
      expect(hasLink).toBe(false);
    });
  });

  describe("getLinkedPoll", () => {
    it("should extract poll information from conversation tags", () => {
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

    it("should return undefined when no poll is linked", () => {
      mockUseConversation.mockReturnValue({
        conversation: {
          id: "conv-1",
          tags: ["other-tag"],
        },
      });

      const { result } = renderHook(() => usePollConversationLink());

      const linkedPoll = result.current.getLinkedPoll("conv-1");
      expect(linkedPoll).toBeUndefined();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete poll creation and linking workflow", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollConversationLink());

      // Step 1: Get metadata for linking
      const metadata = result.current.getPollLinkMetadata("conv-1", "msg-1", "Test Conv");
      expect(metadata.conversationId).toBe("conv-1");

      // Step 2: Link poll to conversation
      await act(async () => {
        const success = await result.current.linkPollToConversation("conv-1", {
          pollId: "poll-1",
          pollTitle: "Test Poll",
          messageId: "msg-1",
        });
        expect(success).toBe(true);
      });

      // Step 3: Verify linking worked
      mockUseConversation.mockReturnValue({
        conversation: {
          id: "conv-1",
          tags: ["poll:poll-1"],
        },
      });

      const hasLink = result.current.hasLinkedPoll("conv-1");
      expect(hasLink).toBe(true);

      const linkedPoll = result.current.getLinkedPoll("conv-1");
      expect(linkedPoll?.pollId).toBe("poll-1");
    });

    it("should handle navigation between poll and conversation", () => {
      const { result } = renderHook(() => usePollConversationLink());

      // Navigate from conversation to poll - verify window.location.href is set
      act(() => {
        result.current.navigateToPoll("poll-1");
      });

      expect(window.location.href).toBe(
        "http://localhost:3000/DooDates/poll/poll-1?source=conversation",
      );

      // Navigate from poll back to conversation - verify localStorage is called
      act(() => {
        result.current.navigateToConversation("conv-1");
      });

      // Verify localStorage was called with conversation data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "resumeConversation",
        expect.stringContaining("conv-1"),
      );

      // Verify window.location.href was updated
      expect(window.location.href).toContain("conversation=conv-1");
      expect(window.location.href).toContain("source=poll");
    });
  });
});
