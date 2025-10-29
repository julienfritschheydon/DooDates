/**
 * Tests for usePollDeletionCascade hook
 * DooDates - Poll Deletion Cascade Tests
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePollDeletionCascade } from "../usePollDeletionCascade";
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

describe("usePollDeletionCascade", () => {
  const mockUpdateConversation = {
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
  };

  const mockConversations = {
    conversations: [
      {
        id: "conv-1",
        title: "Test Conversation 1",
        tags: ["poll:poll-1", "other-tag"],
      },
      {
        id: "conv-2",
        title: "Test Conversation 2",
        tags: ["poll:poll-2"],
      },
      {
        id: "conv-3",
        title: "Test Conversation 3",
        tags: ["other-tag"],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      updateConversation: mockUpdateConversation,
    } as any);

    // Setup default localStorage polls
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "dev-polls") {
        return JSON.stringify([
          { id: "poll-1", title: "Poll 1" },
          { id: "poll-2", title: "Poll 2" },
        ]);
      }
      return null;
    });
  });

  describe("cleanupConversationLink", () => {
    it("should remove poll links from conversations", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const success = await result.current.cleanupConversationLink("poll-1");
        expect(success).toBe(true);
      });

      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledWith({
        id: "conv-1",
        updates: {
          tags: ["other-tag"],
        },
      });
    });

    it("should handle cleanup errors gracefully", async () => {
      mockUpdateConversation.mutateAsync.mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const success = await result.current.cleanupConversationLink("poll-1");
        expect(success).toBe(false);
      });
    });
  });

  describe("deletePollWithCascade", () => {
    it("should delete poll and cleanup conversation links", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const result_deletion = await result.current.deletePollWithCascade("poll-1");

        expect(result_deletion.success).toBe(true);
        expect(result_deletion.conversationUpdated).toBe(true);
      });

      // Verify conversation was updated
      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledWith({
        id: "conv-1",
        updates: {
          tags: ["other-tag"],
        },
      });

      // Verify poll was removed from localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "dev-polls",
        JSON.stringify([{ id: "poll-2", title: "Poll 2" }]),
      );
    });

    it("should handle poll deletion failure", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const result_deletion = await result.current.deletePollWithCascade("poll-1");

        expect(result_deletion.success).toBe(false);
        // Le message d'erreur contient "Storage error" (provenant de l'erreur throw)
        expect(result_deletion.error).toContain("Storage error");
      });
    });
  });

  describe("checkPollLinks", () => {
    it("should identify conversations linked to a poll", () => {
      const { result } = renderHook(() => usePollDeletionCascade());

      const linkInfo = result.current.checkPollLinks("poll-1");

      expect(linkInfo.hasLinks).toBe(true);
      expect(linkInfo.linkedConversations).toEqual(["conv-1"]);
    });

    it("should return empty results for unlinked polls", () => {
      const { result } = renderHook(() => usePollDeletionCascade());

      const linkInfo = result.current.checkPollLinks("poll-nonexistent");

      expect(linkInfo.hasLinks).toBe(false);
      expect(linkInfo.linkedConversations).toEqual([]);
    });
  });

  describe("getOrphanedLinks", () => {
    it("should identify conversations with non-existent poll links", () => {
      // Add a conversation with a non-existent poll link
      const conversationsWithOrphan = {
        conversations: [
          ...mockConversations.conversations,
          {
            id: "conv-orphan",
            title: "Orphaned Conversation",
            tags: ["poll:poll-deleted"],
          },
        ],
      };

      mockUseConversations.mockReturnValue({
        conversations: conversationsWithOrphan,
        updateConversation: mockUpdateConversation,
      } as any);

      const { result } = renderHook(() => usePollDeletionCascade());

      const orphanedIds = result.current.getOrphanedLinks();
      expect(orphanedIds).toContain("conv-orphan");
    });

    it("should return empty array when no orphaned links exist", () => {
      const { result } = renderHook(() => usePollDeletionCascade());

      const orphanedIds = result.current.getOrphanedLinks();
      expect(orphanedIds).toEqual([]);
    });
  });

  describe("cleanupOrphanedLinks", () => {
    it("should clean up orphaned conversation links", async () => {
      // Setup conversation with orphaned link
      const conversationsWithOrphan = {
        conversations: [
          {
            id: "conv-orphan",
            title: "Orphaned Conversation",
            tags: ["poll:poll-deleted", "valid-tag"],
          },
        ],
      };

      mockUseConversations.mockReturnValue({
        conversations: conversationsWithOrphan,
        updateConversation: mockUpdateConversation,
      } as any);

      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const cleanedCount = await result.current.cleanupOrphanedLinks();
        expect(cleanedCount).toBe(1);
      });

      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledWith({
        id: "conv-orphan",
        updates: {
          tags: ["valid-tag"],
        },
      });
    });

    it("should handle cleanup errors gracefully", async () => {
      const conversationsWithOrphan = {
        conversations: [
          {
            id: "conv-orphan",
            title: "Orphaned Conversation",
            tags: ["poll:poll-deleted"],
          },
        ],
      };

      mockUseConversations.mockReturnValue({
        conversations: conversationsWithOrphan,
        updateConversation: mockUpdateConversation,
      } as any);

      mockUpdateConversation.mutateAsync.mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => usePollDeletionCascade());

      await act(async () => {
        const cleanedCount = await result.current.cleanupOrphanedLinks();
        expect(cleanedCount).toBe(0);
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete poll deletion workflow", async () => {
      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollDeletionCascade());

      // Step 1: Check what conversations are linked
      const linkInfo = result.current.checkPollLinks("poll-1");
      expect(linkInfo.hasLinks).toBe(true);
      expect(linkInfo.linkedConversations).toEqual(["conv-1"]);

      // Step 2: Delete poll with cascade
      await act(async () => {
        const deletionResult = await result.current.deletePollWithCascade("poll-1");
        expect(deletionResult.success).toBe(true);
        expect(deletionResult.conversationUpdated).toBe(true);
      });

      // Verify both poll deletion and conversation cleanup
      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("should handle orphaned link cleanup maintenance", async () => {
      // Setup scenario with orphaned links
      const conversationsWithOrphans = {
        conversations: [
          {
            id: "conv-1",
            title: "Valid Conversation",
            tags: ["poll:poll-1"],
          },
          {
            id: "conv-orphan1",
            title: "Orphaned 1",
            tags: ["poll:deleted-poll-1"],
          },
          {
            id: "conv-orphan2",
            title: "Orphaned 2",
            tags: ["poll:deleted-poll-2", "other-tag"],
          },
        ],
      };

      mockUseConversations.mockReturnValue({
        conversations: conversationsWithOrphans,
        updateConversation: mockUpdateConversation,
      } as any);

      mockUpdateConversation.mutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePollDeletionCascade());

      // Step 1: Identify orphaned links
      const orphanedIds = result.current.getOrphanedLinks();
      expect(orphanedIds).toEqual(["conv-orphan1", "conv-orphan2"]);

      // Step 2: Clean up orphaned links
      await act(async () => {
        const cleanedCount = await result.current.cleanupOrphanedLinks();
        expect(cleanedCount).toBe(2);
      });

      // Verify cleanup calls
      expect(mockUpdateConversation.mutateAsync).toHaveBeenCalledTimes(2);
    });
  });
});
