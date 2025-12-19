/**
 * Tests unitaires pour guestQuotaService.ts
 * Valide la logique métier sans dépendre de Supabase réel
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
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
import { supabaseSelectMaybeSingle, supabaseInsert, supabaseUpdate } from "../supabaseApi";

vi.mock("../supabaseApi", () => ({
  supabaseSelectMaybeSingle: vi.fn(),
  supabaseInsert: vi.fn(),
  supabaseUpdate: vi.fn(),
  supabaseSelect: vi.fn(),
}));

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

vi.mock("../error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn(),
  },
}));

function createMockQuota(overrides: Partial<GuestQuotaData> = {}): GuestQuotaData {
  return {
    id: "test-quota-id",
    fingerprint: "test-fingerprint",
    conversationsCreated: 0,
    datePollsCreated: 0,
    formPollsCreated: 0,
    quizzCreated: 0,
    availabilityPollsCreated: 0,
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

function createMockSupabaseRow(quota: GuestQuotaData) {
  return {
    id: quota.id,
    fingerprint: quota.fingerprint,
    conversations_created: quota.conversationsCreated,
    // polls_created supprimé - utiliser calculateTotalPollsCreated() pour calculer à la volée
    date_polls_created: quota.datePollsCreated,
    form_polls_created: quota.formPollsCreated,
    quizz_created: quota.quizzCreated,
    availability_polls_created: quota.availabilityPollsCreated,
    ai_messages: quota.aiMessages,
    analytics_queries: quota.analyticsQueries,
    simulations: quota.simulations,
    total_credits_consumed: quota.totalCreditsConsumed,
    first_seen_at: quota.firstSeenAt,
    last_activity_at: quota.lastActivityAt,
    last_reset_at: quota.lastResetAt,
    user_agent: quota.browserMetadata?.userAgent,
    timezone: quota.browserMetadata?.timezone,
    language: quota.browserMetadata?.language,
    screen_resolution: quota.browserMetadata?.screenResolution,
  };
}

/**
 * Helper pour configurer les mocks Supabase pour ensureGuestQuota
 * Simule le comportement réel : fetchQuotaByFingerprint retourne le quota
 */
function mockEnsureGuestQuota(mockRow: ReturnType<typeof createMockSupabaseRow>) {
  (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRow);
}

describe("guestQuotaService", () => {
  beforeEach(() => {
    setupMockLocalStorage();
    clearQuotaCache(); // Vider le cache entre les tests
    vi.clearAllMocks();

    // Mock par défaut
    vi.mocked(browserFingerprint.getCachedFingerprint).mockResolvedValue("test-fingerprint");
    vi.mocked(browserFingerprint.getBrowserMetadata).mockReturnValue({
      userAgent: "test-user-agent",
      timezone: "Europe/Paris",
      language: "fr-FR",
      screenResolution: "1920x1080x24",
    });
    vi.mocked(e2eDetection.isE2ETestingEnvironment).mockReturnValue(false);

    // Setup window pour éviter le bypass E2E dans les tests de quota
    setupQuotaTestWindow();

    // Les fonctions supabaseApi sont mockées via vi.mock("../supabaseApi")
  });

  describe("getOrCreateGuestQuota", () => {
    it("should fetch existing quota by fingerprint", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockRow);

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      expect(result?.fingerprint).toBe("test-fingerprint");
    });

    it("should create new quota if not found", async () => {
      // S'assurer que localStorage est vide pour ce test
      localStorage.removeItem("guest_quota_id");

      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );

      (supabaseInsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRow);

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      expect(result?.fingerprint).toBe("test-fingerprint");
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
    });
  });

  describe("canConsumeCredits", () => {
    it("should allow consumption when under limits", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10, aiMessages: 1 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(true);
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.fingerprint).toBe("test-fingerprint");
      expect(result.currentQuota?.totalCreditsConsumed).toBe(10);
    });

    it("should deny consumption when total credits limit reached", async () => {
      // 100 crédits = limite atteinte (GUEST_LIMITS.TOTAL_CREDITS = 100)
      const mockQuota = createMockQuota({ totalCreditsConsumed: 100 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Total credit limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.totalCreditsConsumed).toBe(100);
    });

    it("should deny consumption when conversation limit reached", async () => {
      // 10 conversations = limite atteinte (GUEST_LIMITS.CONVERSATIONS = 10)
      const mockQuota = createMockQuota({ conversationsCreated: 10 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("conversation_created", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Conversation limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.conversationsCreated).toBe(10);
    });

    it("should deny consumption when AI message limit reached", async () => {
      // 100 messages IA = limite atteinte (GUEST_LIMITS.AI_MESSAGES = 100)
      const mockQuota = createMockQuota({ aiMessages: 100 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("AI message limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.aiMessages).toBe(100);
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
    });
  });

  describe("consumeGuestCredits", () => {
    it("should consume credits successfully", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10, aiMessages: 1 });
      const mockRow = createMockSupabaseRow(mockQuota);
      const updatedRow = {
        ...mockRow,
        ai_messages: 2, // Après consommation : 1 + 1 = 2
        total_credits_consumed: 11,
      };

      // consumeGuestCredits fait :
      // 1. ensureGuestQuota -> fetchQuotaByFingerprint -> maybeSingle()
      // mockEnsureGuestQuota mocke maybeSingle() pour retourner mockRow
      mockEnsureGuestQuota(mockRow);

      // 2. ensureGuestQuota peut faire update() si metadataChanged, mais dans ce test metadata ne change pas
      // Donc pas besoin de mocker l'update de ensureGuestQuota (pas de single() pour ensureGuestQuota)

      // 3. consumeGuestCredits utilise supabaseUpdate et supabaseInsert via supabaseApi
      (supabaseUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updatedRow);
      (supabaseInsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "journal-id",
      } as any);

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(result.quota?.aiMessages).toBe(updatedRow.ai_messages);
      expect(result.quota?.totalCreditsConsumed).toBe(updatedRow.total_credits_consumed);
    });

    it("should deny consumption when limit reached", async () => {
      // 100 messages IA = limite atteinte (GUEST_LIMITS.AI_MESSAGES = 100)
      const mockQuota = createMockQuota({ aiMessages: 100 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("should create journal entry", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10 });
      const mockRow = createMockSupabaseRow(mockQuota);
      const updatedRow = {
        ...mockRow,
        ai_messages: 1,
        total_credits_consumed: 11,
      };

      // Mock ensureGuestQuota
      mockEnsureGuestQuota(mockRow);

      // Mock update et journal
      (supabaseUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updatedRow);
      (supabaseInsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "journal-id",
      } as any);

      await consumeGuestCredits("ai_message", 1, { conversationId: "test-conv" });

      expect(supabaseUpdate).toHaveBeenCalled();
      expect(supabaseInsert).toHaveBeenCalled();
    });

    it("should update metadata on consumption", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10 });
      const mockRow = createMockSupabaseRow(mockQuota);
      const updatedRow = {
        ...mockRow,
        ai_messages: 1,
        total_credits_consumed: 11,
      };

      // Mock ensureGuestQuota
      mockEnsureGuestQuota(mockRow);

      // Mock update et journal
      (supabaseUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updatedRow);
      (supabaseInsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: "journal-id",
      } as any);

      await consumeGuestCredits("ai_message", 1);

      const updateCalls = (supabaseUpdate as unknown as ReturnType<typeof vi.fn>).mock.calls;
      const metadataCall = updateCalls.find((call: any[]) => {
        const payload = call[1];
        return payload && typeof payload === "object" && "user_agent" in payload;
      });

      expect(metadataCall).toBeDefined();
      const metadataPayload = (metadataCall as any[])[1] as Record<string, unknown>;
      expect(metadataPayload).toHaveProperty("user_agent");
      expect(metadataPayload).toHaveProperty("timezone");
      expect(metadataPayload).toHaveProperty("language");
      expect(metadataPayload).toHaveProperty("screen_resolution");
    });

    it("should handle network errors gracefully", async () => {
      // Mock ensureGuestQuota qui échoue
      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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
    });
  });

  describe("Edge cases", () => {
    it("should handle collision (fingerprint exists but different metadata)", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRow,
      );

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
    });

    it("should handle missing quota gracefully", async () => {
      // S'assurer que localStorage est vide pour ce test
      localStorage.removeItem("guest_quota_id");

      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null,
      );

      (supabaseInsert as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Insert failed"),
      );

      const result = await getOrCreateGuestQuota();

      expect(result).toBeNull();
    });

    it("should validate all action types", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabaseSelectMaybeSingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockRow);

      const actionsWithMetadata: Array<{
        action:
          | "conversation_created"
          | "poll_created"
          | "ai_message"
          | "analytics_query"
          | "simulation";
        metadata?: Record<string, unknown>;
      }> = [
        { action: "conversation_created" },
        { action: "poll_created", metadata: { pollType: "date" } }, // pollType is required for poll_created
        { action: "ai_message" },
        { action: "analytics_query" },
        { action: "simulation" },
      ];

      for (const { action, metadata } of actionsWithMetadata) {
        const result = await canConsumeCredits(action, 1, metadata);
        expect(result.allowed).toBe(true);
      }
    });
  });
});
