/**
 * Tests unitaires pour guestQuotaService.ts
 * Valide la logique métier sans dépendre de Supabase réel
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOrCreateGuestQuota,
  canConsumeCredits,
  consumeGuestCredits,
  type GuestQuotaData,
} from "../guestQuotaService";
import { setupMockLocalStorage } from "../../__tests__/helpers/testHelpers";
import * as browserFingerprint from "../browserFingerprint";
import * as e2eDetection from "../e2e-detection";
import { supabase } from "../supabase";

// Mock Supabase - doit être défini dans la factory function
vi.mock("../supabase", () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  return {
    supabase: mockSupabase,
  };
});

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

function createMockSupabaseRow(quota: GuestQuotaData) {
  return {
    id: quota.id,
    fingerprint: quota.fingerprint,
    conversations_created: quota.conversationsCreated,
    polls_created: quota.pollsCreated,
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
  // ensureGuestQuota appelle fetchQuotaByFingerprint qui fait: from().select().eq().maybeSingle()
  (supabase.maybeSingle as any).mockResolvedValueOnce({
    data: mockRow,
    error: null,
  });
  
  // Si metadataChanged, il fait aussi update().select().single()
  // Mais on ne le mocke que si nécessaire dans les tests spécifiques
}

describe("guestQuotaService", () => {
  beforeEach(() => {
    setupMockLocalStorage();
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
    
    // Mock window pour shouldBypassGuestQuota
    Object.defineProperty(global, "window", {
      value: {
        ...global.window,
        location: { search: "" },
      },
      writable: true,
      configurable: true,
    });
    
    // Réinitialiser les mocks Supabase - chaînage correct
    (supabase.from as any).mockImplementation(() => supabase);
    (supabase.select as any).mockImplementation(() => supabase);
    (supabase.insert as any).mockImplementation(() => supabase);
    (supabase.update as any).mockImplementation(() => supabase);
    (supabase.eq as any).mockImplementation(() => supabase);
    
    // Ne pas mettre de mock par défaut pour maybeSingle et single
    // Chaque test doit définir ses propres mocks avec mockResolvedValueOnce
  });

  describe("getOrCreateGuestQuota", () => {
    it("should fetch existing quota by fingerprint", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabase.maybeSingle as any).mockResolvedValue({
        data: mockRow,
        error: null,
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      expect(result?.fingerprint).toBe("test-fingerprint");
      expect(supabase.from).toHaveBeenCalledWith("guest_quotas");
      expect(supabase.eq).toHaveBeenCalledWith("fingerprint", "test-fingerprint");
    });

    it("should create new quota if not found", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      // Première tentative : pas trouvé (fetchQuotaByFingerprint)
      (supabase.maybeSingle as any).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Pas de cachedQuotaId dans localStorage, donc création directe
      // Insertion réussie (create) - supabase.from().insert().select().single()
      (supabase.single as any).mockResolvedValueOnce({
        data: mockRow,
        error: null,
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      expect(result?.fingerprint).toBe("test-fingerprint");
      expect(supabase.insert).toHaveBeenCalled();
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
      expect(supabase.from).not.toHaveBeenCalled();
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
      // 50 crédits = limite atteinte (GUEST_LIMITS.TOTAL_CREDITS = 50)
      const mockQuota = createMockQuota({ totalCreditsConsumed: 50 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Total credit limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.totalCreditsConsumed).toBe(50);
    });

    it("should deny consumption when conversation limit reached", async () => {
      // 5 conversations = limite atteinte (GUEST_LIMITS.CONVERSATIONS = 5)
      const mockQuota = createMockQuota({ conversationsCreated: 5 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("conversation_created", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Conversation limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.conversationsCreated).toBe(5);
    });

    it("should deny consumption when AI message limit reached", async () => {
      // 2 messages IA = limite atteinte (GUEST_LIMITS.AI_MESSAGES = 2)
      const mockQuota = createMockQuota({ aiMessages: 2 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await canConsumeCredits("ai_message", 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("AI message limit");
      expect(result.currentQuota).toBeDefined();
      expect(result.currentQuota?.aiMessages).toBe(2);
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
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("consumeGuestCredits", () => {
    it("should consume credits successfully", async () => {
      const mockQuota = createMockQuota({ totalCreditsConsumed: 10, aiMessages: 1 });
      const mockRow = createMockSupabaseRow(mockQuota);
      const updatedRow = {
        ...mockRow,
        ai_messages: 2,
        total_credits_consumed: 11,
      };

      // Mock ensureGuestQuota
      mockEnsureGuestQuota(mockRow);

      // Mock update (consumeGuestCredits fait update().select().single())
      (supabase.single as any).mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      // Mock journal insert (pas d'erreur) - insert() retourne une Promise qui resolve
      (supabase.insert as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(result.quota?.aiMessages).toBe(2);
      expect(result.quota?.totalCreditsConsumed).toBe(11);
      expect(supabase.update).toHaveBeenCalled();
    });

    it("should deny consumption when limit reached", async () => {
      const mockQuota = createMockQuota({ aiMessages: 2 });
      const mockRow = createMockSupabaseRow(mockQuota);

      mockEnsureGuestQuota(mockRow);

      const result = await consumeGuestCredits("ai_message", 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("limit");
      expect(supabase.update).not.toHaveBeenCalled();
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

      // Mock update
      (supabase.single as any).mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      // Mock journal insert - le code fait from().insert() qui retourne une Promise
      // Mais insert() est appelé directement sur le résultat de from(), donc on mocke insert pour retourner supabase
      (supabase.insert as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await consumeGuestCredits("ai_message", 1, { conversationId: "test-conv" });

      // Vérifier que journal a été créé
      expect(supabase.from).toHaveBeenCalledWith("guest_quota_journal");
      expect(supabase.insert).toHaveBeenCalled();
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

      // Mock update
      (supabase.single as any).mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      // Mock journal insert
      (supabase.insert as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await consumeGuestCredits("ai_message", 1);

      // Trouver l'appel update qui contient les métadonnées
      const updateCalls = (supabase.update as any).mock.calls;
      const metadataCall = updateCalls.find((call: any[]) => 
        call && call[0] && typeof call[0] === 'object' && 'user_agent' in call[0]
      );
      expect(metadataCall).toBeDefined();
      expect(metadataCall[0]).toHaveProperty("user_agent");
      expect(metadataCall[0]).toHaveProperty("timezone");
      expect(metadataCall[0]).toHaveProperty("language");
      expect(metadataCall[0]).toHaveProperty("screen_resolution");
    });

    it("should handle network errors gracefully", async () => {
      // Mock ensureGuestQuota qui échoue
      (supabase.maybeSingle as any).mockRejectedValueOnce(new Error("Network error"));

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
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle collision (fingerprint exists but different metadata)", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      // Simuler collision : quota existe déjà
      (supabase.maybeSingle as any).mockResolvedValue({
        data: mockRow,
        error: null,
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeDefined();
      // Devrait utiliser le quota existant
    });

    it("should handle missing quota gracefully", async () => {
      (supabase.maybeSingle as any).mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      (supabase.single as any).mockResolvedValue({
        data: null,
        error: new Error("Insert failed"),
      });

      const result = await getOrCreateGuestQuota();

      expect(result).toBeNull();
    });

    it("should validate all action types", async () => {
      const mockQuota = createMockQuota();
      const mockRow = createMockSupabaseRow(mockQuota);

      (supabase.maybeSingle as any).mockResolvedValue({
        data: mockRow,
        error: null,
      });

      (supabase.single as any).mockResolvedValue({
        data: mockRow,
        error: null,
      });

      const actions: Array<"conversation_created" | "poll_created" | "ai_message" | "analytics_query" | "simulation"> = [
        "conversation_created",
        "poll_created",
        "ai_message",
        "analytics_query",
        "simulation",
      ];

      for (const action of actions) {
        const result = await canConsumeCredits(action, 1);
        expect(result.allowed).toBe(true);
      }
    });
  });
});

