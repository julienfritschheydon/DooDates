import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { secureGeminiService, SecureGeminiService } from "../SecureGeminiService";

// Mock logger et error-handling pour éviter le bruit dans les tests
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/error-handling", () => ({
  handleError: vi.fn((error: unknown) => error),
  ErrorFactory: {},
  logError: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnv: (key: string) => {
    if (key === "VITE_SUPABASE_URL") return "https://test.supabase.co";
    if (key === "VITE_SUPABASE_ANON_KEY") return "anon-key";
    return "";
  },
}));

vi.mock("@/lib/supabaseApi", () => ({
  getSupabaseSessionWithTimeout: vi.fn(async () => ({
    access_token: "test-token",
  })),
}));

declare const global: typeof globalThis & { fetch?: typeof fetch };

describe("SecureGeminiService - rate limiting", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("should map Edge RATE_LIMIT error to RATE_LIMIT_EXCEEDED", async () => {
    const mockResponseBody = {
      success: false,
      error: "RATE_LIMIT",
      message: "RATE_LIMIT: Too many requests",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => mockResponseBody,
    });

    global.fetch = mockFetch as unknown as typeof fetch;

    const service = SecureGeminiService.getInstance();

    const result = await service.generateContent("test message");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("RATE_LIMIT_EXCEEDED");
    expect(result.message).toBe("Trop de requêtes. Veuillez patienter avant de réessayer.");
  });

  it("should consistently return RATE_LIMIT_EXCEEDED after multiple calls when last one is rate limited", async () => {
    const successBody = {
      success: true,
      data: "ok",
      error: undefined,
    };

    const rateLimitedBody = {
      success: false,
      error: "RATE_LIMIT",
      message: "RATE_LIMIT: Too many requests",
    };

    const mockFetch = vi
      .fn()
      // 3 premières requêtes OK
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => successBody,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => successBody,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => successBody,
      })
      // 4ème requête en rate limit
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => rateLimitedBody,
      });

    global.fetch = mockFetch as unknown as typeof fetch;

    const service = SecureGeminiService.getInstance();

    const results = [] as Awaited<ReturnType<typeof service.generateContent>>[];

    // 3 appels autorisés
    results.push(await service.generateContent("msg 1"));
    results.push(await service.generateContent("msg 2"));
    results.push(await service.generateContent("msg 3"));

    // 4ème appel → rate limit
    const last = await service.generateContent("msg 4 - should be rate limited");
    results.push(last);

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(last.success).toBe(false);
    expect(last.error).toBe("RATE_LIMIT_EXCEEDED");
    expect(last.message).toBe("Trop de requêtes. Veuillez patienter avant de réessayer.");
  });
});
