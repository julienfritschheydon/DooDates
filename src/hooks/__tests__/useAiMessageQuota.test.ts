/**
 * Tests pour useAiMessageQuota
 *
 * Couvre :
 * - Limites guest vs authenticated
 * - Incrémentation messages IA
 * - Limite polls par conversation
 * - Cooldown anti-spam
 * - Reset mensuel (auth users)
 * - Persistence localStorage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiMessageQuota } from "../useAiMessageQuota";

// Mock useAuth
vi.mock("../useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(await import("../useAuth")).useAuth;

describe("useAiMessageQuota", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset timers
    vi.useFakeTimers();

    // Default: guest user
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Guest User Limits", () => {
    it("should have 20 AI messages limit for guest", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesLimit).toBe(20);
      expect(result.current.aiMessagesRemaining).toBe(20);
      expect(result.current.canSendMessage).toBe(true);
    });

    it("should have 3 polls per conversation limit for guest", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      expect(result.current.pollsLimit).toBe(3);
      expect(result.current.pollsInConversation).toBe(0);
      expect(result.current.canCreatePoll).toBe(true);
    });
  });

  describe("Authenticated User Limits", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      });
    });

    it("should have 200 AI messages limit for authenticated", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesLimit).toBe(200);
      expect(result.current.aiMessagesRemaining).toBe(200);
    });

    it("should have 10 polls per conversation limit for authenticated", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      expect(result.current.pollsLimit).toBe(10);
      expect(result.current.canCreatePoll).toBe(true);
    });
  });

  describe("AI Messages Quota", () => {
    it("should increment AI messages count", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesUsed).toBe(0);

      act(() => {
        result.current.incrementAiMessages();
      });

      expect(result.current.aiMessagesUsed).toBe(1);
      expect(result.current.aiMessagesRemaining).toBe(19);
    });

    it("should block messages when quota reached", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      // Use all 20 messages
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.incrementAiMessages();
          vi.advanceTimersByTime(2000); // Skip cooldown
        }
      });

      expect(result.current.aiMessagesUsed).toBe(20);
      expect(result.current.aiMessagesRemaining).toBe(0);
      expect(result.current.canSendMessage).toBe(false);
    });

    it("should persist quota in localStorage", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      const stored = localStorage.getItem("doodates_ai_quota");
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.aiMessagesUsed).toBe(1);
    });

    it("should restore quota from localStorage", () => {
      // Set initial data
      localStorage.setItem(
        "doodates_ai_quota",
        JSON.stringify({
          aiMessagesUsed: 5,
          lastMessageTimestamp: 0,
        }),
      );

      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesUsed).toBe(5);
      expect(result.current.aiMessagesRemaining).toBe(15);
    });
  });

  describe("Polls Per Conversation Limit", () => {
    it("should track polls per conversation", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      expect(result.current.pollsInConversation).toBe(0);

      act(() => {
        result.current.incrementPollCount("conv-1");
      });

      expect(result.current.pollsInConversation).toBe(1);
    });

    it("should block poll creation when limit reached", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      // Create 3 polls (guest limit)
      act(() => {
        result.current.incrementPollCount("conv-1");
        result.current.incrementPollCount("conv-1");
        result.current.incrementPollCount("conv-1");
      });

      expect(result.current.pollsInConversation).toBe(3);
      expect(result.current.canCreatePoll).toBe(false);
    });

    it("should track polls separately per conversation", () => {
      const { result: result1 } = renderHook(() => useAiMessageQuota("conv-1"));
      const { result: result2 } = renderHook(() => useAiMessageQuota("conv-2"));

      act(() => {
        result1.current.incrementPollCount("conv-1");
        result1.current.incrementPollCount("conv-1");
      });

      act(() => {
        result2.current.incrementPollCount("conv-2");
      });

      expect(result1.current.pollsInConversation).toBe(2);
      expect(result2.current.pollsInConversation).toBe(1);
    });

    it("should persist poll counts in localStorage", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      act(() => {
        result.current.incrementPollCount("conv-1");
      });

      const stored = localStorage.getItem("doodates_poll_counts");
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data["conv-1"]).toBe(1);
    });
  });

  describe("Cooldown Anti-Spam", () => {
    it("should enforce 2 second cooldown between messages", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      expect(result.current.isInCooldown).toBe(true);
      expect(result.current.canSendMessage).toBe(false);
      expect(result.current.cooldownRemaining).toBeGreaterThan(0);
    });

    it("should allow message after cooldown expires", async () => {
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      expect(result.current.isInCooldown).toBe(true);

      // Advance time by 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.isInCooldown).toBe(false);
        expect(result.current.canSendMessage).toBe(true);
      });
    });

    it("should update cooldown remaining countdown", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      const initial = result.current.cooldownRemaining;
      expect(initial).toBeGreaterThan(0);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.cooldownRemaining).toBeLessThan(initial);
    });
  });

  describe("Reset Quota", () => {
    it("should reset all quota data", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      // Use some quota
      act(() => {
        result.current.incrementAiMessages();
        result.current.incrementAiMessages();
        result.current.incrementPollCount("conv-1");
      });

      expect(result.current.aiMessagesUsed).toBe(2);
      expect(result.current.pollsInConversation).toBe(1);

      // Reset
      act(() => {
        result.current.resetQuota();
      });

      expect(result.current.aiMessagesUsed).toBe(0);
      expect(result.current.pollsInConversation).toBe(0);
      expect(result.current.aiMessagesRemaining).toBe(20);
    });
  });

  describe("Monthly Reset for Authenticated Users", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      });
    });

    it("should initialize reset date for authenticated users", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      // Wait for effect to run
      act(() => {
        vi.runAllTimers();
      });

      const stored = localStorage.getItem("doodates_ai_quota");
      const data = JSON.parse(stored!);

      expect(data.resetDate).toBeTruthy();
    });

    it("should reset quota when month changes", () => {
      // Set quota with past reset date
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      localStorage.setItem(
        "doodates_ai_quota",
        JSON.stringify({
          aiMessagesUsed: 50,
          lastMessageTimestamp: 0,
          resetDate: pastDate.toISOString(),
        }),
      );

      const { result } = renderHook(() => useAiMessageQuota());

      // Should have reset
      expect(result.current.aiMessagesUsed).toBe(0);
      expect(result.current.aiMessagesRemaining).toBe(200);
    });
  });
});
