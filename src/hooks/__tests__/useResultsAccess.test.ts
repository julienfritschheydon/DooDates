import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useResultsAccess } from "../useResultsAccess";
import type { Poll } from "@/lib/pollStorage";

// Helper to create test polls with only required fields
const createTestPoll = (overrides: Partial<Poll>): Poll =>
  ({
    id: "poll-1",
    slug: "test-poll",
    title: "Test Poll",
    type: "date",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: "creator-123",
    settings: {},
    ...overrides,
  }) as Poll;

// Mock dependencies
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/pollStorage", () => ({
  getDeviceId: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/lib/pollStorage";

describe("useResultsAccess", () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
  const mockGetDeviceId = getDeviceId as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockGetDeviceId.mockReturnValue("device-123");
  });

  describe("Public Visibility", () => {
    it("should allow access for everyone when visibility is public", () => {
      const poll = createTestPoll({
        settings: { resultsVisibility: "public" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should allow access when visibility is not set (defaults to public)", () => {
      const poll = createTestPoll({
        settings: {},
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should allow access for authenticated users when visibility is public", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-456", email: "test@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "public" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });
  });

  describe("Creator-Only Visibility", () => {
    it("should allow access for creator (authenticated user)", () => {
      mockUseAuth.mockReturnValue({ user: { id: "creator-123", email: "creator@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "creator-only" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should allow access for creator (anonymous via device ID)", () => {
      mockGetDeviceId.mockReturnValue("device-creator");

      const poll = createTestPoll({
        creator_id: "device-creator",
        settings: { resultsVisibility: "creator-only" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should deny access for non-creator (authenticated user)", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-456", email: "other@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "creator-only" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({
        allowed: false,
        reason: "not-creator",
        message: "Seul le créateur de ce sondage peut voir les résultats.",
      });
    });

    it("should deny access for non-creator (anonymous user)", () => {
      mockGetDeviceId.mockReturnValue("device-visitor");

      const poll = createTestPoll({
        settings: { resultsVisibility: "creator-only" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({
        allowed: false,
        reason: "not-creator",
        message: "Seul le créateur de ce sondage peut voir les résultats.",
      });
    });

    it("should show restricted message when no user and no device ID", () => {
      mockUseAuth.mockReturnValue({ user: null });
      mockGetDeviceId.mockReturnValue("");

      const poll = createTestPoll({
        settings: { resultsVisibility: "creator-only" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({
        allowed: false,
        reason: "restricted",
        message:
          "Seul le créateur peut voir les résultats. Connectez-vous si vous êtes le créateur.",
      });
    });
  });

  describe("Voters-Only Visibility", () => {
    it("should allow access for creator even if they haven't voted", () => {
      mockUseAuth.mockReturnValue({ user: { id: "creator-123", email: "creator@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "voters" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should allow access for voter who has voted", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-456", email: "voter@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "voters" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, true));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should deny access for non-voter", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-456", email: "visitor@example.com" } });

      const poll = createTestPoll({
        settings: { resultsVisibility: "voters" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({
        allowed: false,
        reason: "not-voted",
        message: "Vous devez voter pour voir les résultats de ce sondage.",
      });
    });

    it("should allow access for anonymous voter who has voted", () => {
      mockGetDeviceId.mockReturnValue("device-voter");

      const poll = createTestPoll({
        settings: { resultsVisibility: "voters" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, true));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should allow access for anonymous creator via device ID", () => {
      mockGetDeviceId.mockReturnValue("device-creator");

      const poll = createTestPoll({
        creator_id: "device-creator",
        settings: { resultsVisibility: "voters" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });
  });

  describe("Edge Cases", () => {
    it("should allow access when poll is null (loading state)", () => {
      const { result } = renderHook(() => useResultsAccess(null, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should default to public when settings object is missing", () => {
      const poll = createTestPoll({});

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });

    it("should handle unknown visibility mode by allowing access", () => {
      const poll = createTestPoll({
        settings: { resultsVisibility: "unknown-mode" } as any,
      });

      const { result } = renderHook(() => useResultsAccess(poll, false));

      expect(result.current).toEqual({ allowed: true });
    });
  });
});
