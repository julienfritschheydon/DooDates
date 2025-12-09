/**
 * Tests for useQuota hook (global credit-based quota display)
 */

/// <reference types="@testing-library/jest-dom" />

import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useQuota } from "../useQuota";
import { useAuth } from "../../contexts/AuthContext";
import { usePolls } from "../usePolls";
import { getTotalCreditsConsumed } from "../../lib/quotaTracking";
import { GUEST_TOTAL_CREDITS_LIMIT } from "../../lib/guestQuotaService";

vi.mock("../../contexts/AuthContext");
vi.mock("../usePolls");
vi.mock("../../lib/quotaTracking");
vi.mock("../../lib/guestQuotaService", () => ({
  GUEST_TOTAL_CREDITS_LIMIT: 100,
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUsePolls = vi.mocked(usePolls);
const mockedGetTotalCreditsConsumed = vi.mocked(getTotalCreditsConsumed);

// Ensure window exists for E2E detection code paths
if (typeof window === "undefined") {
  // Minimal shim for tests; Vitest/jsdom will usually provide window already
  // but we keep this guard for completeness.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = {};
}

describe("useQuota (credit-based)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: guest, no special E2E flags
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    mockedUsePolls.mockReturnValue({ polls: [] } as any);

    (window as any).__IS_E2E_TESTING__ = false;
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    });
    Object.defineProperty(window, "navigator", {
      value: { userAgent: "jest" },
      writable: true,
    });

    mockedGetTotalCreditsConsumed.mockResolvedValue(0);

    // Nettoyer simplement le localStorage existant fourni par jsdom
    window.localStorage.clear();
  });

  it("uses total credits consumed for conversations quota (guest)", async () => {
    mockedGetTotalCreditsConsumed.mockResolvedValueOnce(30);

    const { result, rerender } = renderHook(() => useQuota());

    // allow effect to run by rerendering once
    await Promise.resolve();
    rerender();

    const { quotaInfo, status, isAuthenticated } = result.current;

    expect(isAuthenticated).toBe(false);
    // used = 30 credits, limit = GUEST_TOTAL_CREDITS_LIMIT (mocked to 100)
    expect(quotaInfo.used).toBe(30);
    expect(quotaInfo.limit).toBe(GUEST_TOTAL_CREDITS_LIMIT);
    expect(status.conversations.used).toBe(30);
    expect(status.conversations.limit).toBe(GUEST_TOTAL_CREDITS_LIMIT);
    expect(quotaInfo.usagePercentage).toBeCloseTo(30);
  });

  it("uses total credits consumed for conversations quota (authenticated)", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    } as any);

    mockedGetTotalCreditsConsumed.mockResolvedValueOnce(80);

    const { result, rerender } = renderHook(() => useQuota());

    await Promise.resolve();
    rerender();

    const { quotaInfo, status, isAuthenticated } = result.current;

    expect(isAuthenticated).toBe(true);
    // AUTH_CREDIT_LIMIT vaut 100 dans le hook
    expect(status.conversations.limit).toBe(100);
    expect(quotaInfo.used).toBe(80);
    expect(quotaInfo.limit).toBe(100);
    expect(quotaInfo.usagePercentage).toBeCloseTo(80);
    expect(status.conversations.isNearLimit).toBe(true);
    expect(status.conversations.isAtLimit).toBe(false);
  });

  it("bypasses remote quota loading in E2E mode", async () => {
    (window as any).__IS_E2E_TESTING__ = true;
    mockedGetTotalCreditsConsumed.mockClear();

    const { result } = renderHook(() => useQuota());

    await Promise.resolve();

    expect(mockedGetTotalCreditsConsumed).not.toHaveBeenCalled();
    // En E2E, quotaInfo est basé sur la valeur initiale (0)
    expect(result.current.quotaInfo.used).toBe(0);
  });
});
