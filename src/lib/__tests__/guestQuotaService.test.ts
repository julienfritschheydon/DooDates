/**
 * Tests unitaires pour guestQuotaService.ts
 * Valide la logique métier en mockant les appels Edge Function via fetch
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getOrCreateGuestQuota,
  canConsumeCredits,
  consumeGuestCredits,
  clearQuotaCache,
  type GuestQuotaData,
} from "../guestQuotaService";
import { setupMockLocalStorage, setupQuotaTestWindow } from "../../__tests__/helpers/testHelpers";
import * as browserFingerprint from "../browserFingerprint";
import * as e2eDetection from "../e2e-detection";

vi.mock("../browserFingerprint", () => ({
  getCachedFingerprint: vi.fn(),
  getBrowserMetadata: vi.fn(),
}));

vi.mock("../e2e-detection", () => ({
  isE2ETestingEnvironment: vi.fn(() => false),
}));

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockQuota(overrides: Partial<GuestQuotaData> = {}): GuestQuotaData {
  return {
    id: "test-quota-id",
    fingerprint: "test-fingerprint",
    conversationsCreated: 0,
    pollsCreated: 0,
    aiMessages: 0,
    analyticsQueries: 0,
    simulations: 0,
    totalCreditsConsumed: 0,
    firstSeenAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    lastResetAt: null,
    browserMetadata: {
      userAgent: "test-user-agent",
      timezone: "Europe/Paris",
      language: "fr-FR",
      screenResolution: "1920x1080x24",
    },
    ...overrides,
  };
}

describe("guestQuotaService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setupMockLocalStorage();
    clearQuotaCache();
    vi.clearAllMocks();

    // Mock par défaut des dépendances
    vi.mocked(browserFingerprint.getCachedFingerprint).mockResolvedValue("test-fingerprint");
    vi.mocked(browserFingerprint.getBrowserMetadata).mockReturnValue({
      userAgent: "test-user-agent",
      timezone: "Europe/Paris",
      language: "fr-FR",
      screenResolution: "1920x1080x24",
    });
    vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(false);

    // Setup window
    setupQuotaTestWindow();

    // Mock global.fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getOrCreateGuestQuota", () => {
    it("should fetch existing quota by fingerprint", async () => {
      const mockQuota = createMockQuota();

      // Mock fetch response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ currentQuota: mockQuota }),
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      expect(result?.fingerprint).toBe("test-fingerprint");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/quota-tracking"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"endpoint":"checkQuota"'),
        })
      );
    });

    it("should return null on error", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Some error" }),
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeNull();
    });

    it("should return null if bypass is active (E2E)", async () => {
      vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(true);
      Object.defineProperty(global, "window", {
        value: {
          ...global.window,
          location: { search: "?e2e-test=true" },
          __IS_E2E_TESTING__: true,
        },
        writable: true,
        configurable: true,
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("canConsumeCredits", () => {
    it("should allow consumption when allowed by server", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10 });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          allowed: true,
          currentQuota: mockQuota
        }),
      });

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(true);
      expect(result.currentQuota).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/quota-tracking"),
        expect.objectContaining({
          body: expect.stringContaining('"endpoint":"checkQuota"'),
        })
      );
    });

    it("should deny consumption when denied by server", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 50 });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          allowed: false,
          reason: "Total credit limit reached",
          currentQuota: mockQuota
        }),
      });

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Total credit limit");
    });

    it("should allow bypass in E2E environment", async () => {
      vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(true);
      Object.defineProperty(global, "window", {
        value: {
          ...global.window,
          location: { search: "?e2e-test=true" },
          __IS_E2E_TESTING__: true,
        },
        writable: true,
        configurable: true,
      });

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("consumeGuestCredits", () => {
    it("should consume credits successfully", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 11, aiMessages: 1 });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          quota: mockQuota
        }),
      });

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/quota-tracking"),
        expect.objectContaining({
          body: expect.stringContaining('"endpoint":"consumeCredits"'),
        })
      );
    });

    it("should handle server error", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Limit reached" }),
      });

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Limit reached");
    });

    it("should send metadata on consumption", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await consumeGuestCredits("ai_message", 1, { extra: "data" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/quota-tracking"),
        expect.objectContaining({
          body: expect.stringContaining('"extra":"data"'),
        })
      );
    });

    it("should bypass in E2E environment", async () => {
      vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(true);
      Object.defineProperty(global, "window", {
        value: {
          ...global.window,
          location: { search: "?e2e-test=true" },
          __IS_E2E_TESTING__: true,
        },
        writable: true,
        configurable: true,
      });

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
