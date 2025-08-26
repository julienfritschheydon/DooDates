import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePolls } from "../usePolls";

// Unit tests for createPoll():
// - ensures selectedDates and timeSlotsByDate are persisted in settings (dev/localStorage path)
// - rejects creation if selectedDates is empty

// Mock the AuthContext used by usePolls to avoid requiring a real provider
vi.mock("../../contexts/AuthContext", () => {
  return {
    useAuth: () => ({
      user: null,
    }),
  };
});

describe("usePolls.createPoll", () => {
  beforeEach(() => {
    // Replace the global noop localStorage (defined in src/test/setup.ts)
    // with a working in-memory implementation for this test file
    const store: Record<string, string> = {};
    const memLocalStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
    Object.defineProperty(window, "localStorage", {
      value: memLocalStorage,
      configurable: true,
      writable: true,
    });
    window.localStorage.clear();
    // Ensure dev mode branch is taken by stubbing Vite env
    // Use the specific host fragment checked in usePolls to enable local dev mode
    vi.stubEnv("VITE_SUPABASE_URL", "https://ifbhbcktfqxxoxqlinzm.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");
    // Some setups read DEV as boolean; keep a fallback assignment
    try {
      (import.meta as any).env = {
        ...(import.meta as any).env,
        DEV: true,
        VITE_SUPABASE_URL: "https://ifbhbcktfqxxoxqlinzm.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
      };
    } catch {}
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists selectedDates and timeSlotsByDate into poll.settings (dev mode)", async () => {
    const { result } = renderHook(() => usePolls());

    const pollData: any = {
      title: "Réunion produit",
      description: "",
      selectedDates: ["2025-09-01", "2025-09-02"],
      timeSlotsByDate: {
        "2025-09-01": [
          { hour: 9, minute: 0, enabled: true },
          { hour: 10, minute: 0, enabled: false },
        ],
        "2025-09-02": [],
      },
      participantEmails: [],
      settings: {
        timeGranularity: 30,
        allowAnonymousVotes: true,
        allowMaybeVotes: true,
        sendNotifications: false,
        expiresAt: new Date().toISOString(),
      },
    };

    const res = await act(async () => await result.current.createPoll(pollData));

    expect(res.error).toBeUndefined();
    expect(res.poll).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem("dev-polls") || "[]");
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);

    const created = stored[0];
    expect(created.settings).toBeTruthy();
    expect(created.settings.selectedDates).toEqual(pollData.selectedDates);
    expect(created.settings.timeSlotsByDate).toEqual(pollData.timeSlotsByDate);
  });

  it("rejects creation when selectedDates is empty", async () => {
    const { result } = renderHook(() => usePolls());

    const res = await act(async () =>
      await result.current.createPoll({
        title: "Sans dates",
        description: "",
        selectedDates: [],
        timeSlotsByDate: {},
        participantEmails: [],
        settings: {
          timeGranularity: 30,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: false,
          expiresAt: new Date().toISOString(),
        },
      } as any),
    );

    expect(res.error).toBeTruthy();
  });
});
