import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSupabaseSessionWithTimeout, supabaseRestApi } from "../supabaseApi";
import { ErrorFactory } from "../error-handling";

// Mock Supabase client
const mockGetSession = vi.fn();
vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock Logger
vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ErrorFactory
vi.mock("../error-handling", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../error-handling")>();
  return {
    ...actual,
    ErrorFactory: {
      auth: (msg: string) => new Error(`Auth Error: ${msg}`),
      network: (msg: string) => new Error(`Network Error: ${msg}`),
      validation: (msg: string) => new Error(`Validation Error: ${msg}`),
    },
  };
});

describe("supabaseApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Explicitly mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        length: 0,
        key: vi.fn(),
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSupabaseSessionWithTimeout", () => {
    it("should return session from localStorage if valid", async () => {
      const mockSession = {
        access_token: "valid-token",
        user: { id: "user-123" },
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      };
      localStorage.setItem("supabase.auth.token", JSON.stringify(mockSession));

      const session = await getSupabaseSessionWithTimeout();
      expect(session).toEqual(mockSession);
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should call getSession if localStorage is empty", async () => {
      const mockSession = {
        access_token: "refreshed-token",
        user: { id: "user-123" },
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const session = await getSupabaseSessionWithTimeout();
      expect(session).toEqual(mockSession);
      expect(mockGetSession).toHaveBeenCalled();
    });

    it("should call getSession if localStorage has expired token (simulated)", async () => {
      // In this test, we simulate that localStorage is empty/invalid to force refresh
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "new-token" } },
      });

      const session = await getSupabaseSessionWithTimeout();
      expect(session?.access_token).toBe("new-token");
    });
  });

  describe("supabaseRestApi", () => {
    it("should use token from getSupabaseSessionWithTimeout when requireAuth is true", async () => {
      // Mock getSession to return a token
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "fresh-token" } },
      });

      // Mock successful fetch response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await supabaseRestApi("test_table", "GET", { requireAuth: true });

      // Verify fetch was called with the token
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/rest/v1/test_table"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fresh-token",
          }),
        }),
      );
    });

    it("should throw error if no token available and requireAuth is true", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      await expect(supabaseRestApi("test_table", "GET", { requireAuth: true })).rejects.toThrow(
        "Auth Error: No authentication token found",
      );
    });

    it("should proceed without token if requireAuth is false", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      // Mock successful fetch response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await supabaseRestApi("test_table", "GET", { requireAuth: false });

      // Verify fetch was called WITHOUT Authorization header
      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers).not.toHaveProperty("Authorization");
    });
  });
});
