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
 *
 * Note : Utilise des valeurs de test simplifiées (1 pour guest, 1 pour authenticated)
 * pour rendre les tests plus rapides et plus simples.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiMessageQuota, processMonthlyQuotaReset } from "../useAiMessageQuota";

// Mock quotas avec des valeurs de test simplifiées
vi.mock("@/constants/quotas", () => ({
  AI_MESSAGE_QUOTAS: {
    ANONYMOUS: 1, // Valeur de test : 1 message pour guest
    AUTHENTICATED: 1, // Valeur de test : 1 message pour authenticated
  },
  POLL_CREATION_QUOTAS: {
    ANONYMOUS: 1, // Valeur de test : 1 poll pour guest
    AUTHENTICATED: 1, // Valeur de test : 1 poll pour authenticated
  },
}));

// Mock useAuth
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/contexts/AuthContext");
const mockUseAuth = vi.mocked(useAuth);

describe("useAiMessageQuota", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset timers
    vi.useFakeTimers();

    // Default: guest user
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Guest User Limits", () => {
    it("should have 1 AI messages limit for guest (test value)", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesLimit).toBe(1);
      expect(result.current.aiMessagesRemaining).toBe(1);
      expect(result.current.canSendMessage).toBe(true);
    });

    it("should have 1 polls per conversation limit for guest (test value)", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      expect(result.current.pollsLimit).toBe(1);
      expect(result.current.pollsInConversation).toBe(0);
      expect(result.current.canCreatePoll).toBe(true);
    });
  });

  describe("Authenticated User Limits", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      } as any);
    });

    it("should have 1 AI messages limit for authenticated (test value)", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      expect(result.current.aiMessagesLimit).toBe(1);
      expect(result.current.aiMessagesRemaining).toBe(1);
    });

    it("should have 1 polls per conversation limit for authenticated (test value)", () => {
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      expect(result.current.pollsLimit).toBe(1);
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
      expect(result.current.aiMessagesRemaining).toBe(0); // 1 - 1 = 0
    });

    it("should block messages when quota reached", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      // Use the 1 message (test limit)
      act(() => {
        result.current.incrementAiMessages();
        vi.advanceTimersByTime(3000); // Skip cooldown (3s)
      });

      expect(result.current.aiMessagesUsed).toBe(1);
      expect(result.current.aiMessagesRemaining).toBe(0);
      expect(result.current.canSendMessage).toBe(false);
    });

    it("should persist quota in localStorage", async () => {
      // Solution : Utiliser real timers pour localStorage car waitFor ne fonctionne pas avec fake timers
      vi.useRealTimers();
      localStorage.clear();

      const { result } = renderHook(() => useAiMessageQuota());

      // Attendre que le hook s'initialise
      await waitFor(
        () => {
          expect(result.current).toBeDefined();
        },
        { timeout: 500 },
      );

      await act(async () => {
        result.current.incrementAiMessages();
        // Attendre que l'effet sauvegarde dans localStorage (avec real timers)
        // Les effets React sont asynchrones, donc on attend un peu
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Vérifier localStorage après l'act
      await waitFor(
        () => {
          const stored = localStorage.getItem("doodates_ai_quota");
          expect(stored).toBeTruthy();
        },
        { timeout: 2000 },
      );

      const stored = localStorage.getItem("doodates_ai_quota");
      const data = JSON.parse(stored!);
      expect(data.aiMessagesUsed).toBe(1);

      vi.useFakeTimers();
    });

    it("should restore quota from localStorage", async () => {
      // Solution : Utiliser real timers et attendre que le hook s'initialise
      vi.useRealTimers();
      localStorage.clear();

      // Set initial data (avec valeur de test : 1 message max)
      localStorage.setItem(
        "doodates_ai_quota",
        JSON.stringify({
          aiMessagesUsed: 1,
          lastMessageTimestamp: 0,
        }),
      );

      const { result } = renderHook(() => useAiMessageQuota());

      // Attendre que le hook s'initialise depuis localStorage
      // Le hook lit depuis localStorage au montage, donc c'est immédiat
      await waitFor(
        () => {
          expect(result.current).toBeDefined();
          expect(result.current.aiMessagesUsed).toBe(1);
          expect(result.current.aiMessagesRemaining).toBe(0); // 1 - 1 = 0
        },
        { timeout: 2000 },
      );

      vi.useFakeTimers();
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

      // Create 1 poll (test limit)
      act(() => {
        result.current.incrementPollCount("conv-1");
      });

      expect(result.current.pollsInConversation).toBe(1);
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

    it("should persist poll counts in localStorage", async () => {
      // Solution : Utiliser real timers pour localStorage
      vi.useRealTimers();
      localStorage.clear();

      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      // Attendre que le hook s'initialise
      await waitFor(
        () => {
          expect(result.current).toBeDefined();
        },
        { timeout: 500 },
      );

      await act(async () => {
        result.current.incrementPollCount("conv-1");
        // Attendre que l'effet sauvegarde dans localStorage
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Vérifier localStorage après l'act
      await waitFor(
        () => {
          const stored = localStorage.getItem("doodates_poll_counts");
          expect(stored).toBeTruthy();
        },
        { timeout: 2000 },
      );

      const stored = localStorage.getItem("doodates_poll_counts");
      const data = JSON.parse(stored!);
      expect(data["conv-1"]).toBe(1);

      vi.useFakeTimers();
    });
  });

  describe("Cooldown Anti-Spam", () => {
    it("should enforce 3 second cooldown between messages", () => {
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

      // Solution : Avancer le temps système ET les timers
      // Le hook utilise Date.now() qui ne change pas avec vi.advanceTimersByTime seul
      const startTime = Date.now();
      act(() => {
        // Avancer le temps système de 3100ms
        vi.setSystemTime(startTime + 3100);
        // Avancer aussi les timers pour déclencher setTimeout/setInterval
        vi.advanceTimersByTime(3100);
      });

      // Attendre que les effets React se mettent à jour
      await waitFor(
        () => {
          expect(result.current.isInCooldown).toBe(false);
        },
        { timeout: 1000 },
      );

      expect(result.current.canSendMessage).toBe(true);
      
      // Remettre le temps système à la normale
      vi.setSystemTime(startTime);
    });

    it("should update cooldown remaining countdown", () => {
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      const initial = result.current.cooldownRemaining;
      expect(initial).toBeGreaterThan(0);

      // Solution : Utiliser advanceTimersByTime uniquement (pas runAllTimers)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.cooldownRemaining).toBeLessThan(initial);
    });
  });

  describe("Reset Quota", () => {
    it("should reset all quota data", async () => {
      // Solution : Utiliser real timers pour éviter les timeouts
      vi.useRealTimers();

      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      // Wait for hook to initialize
      await waitFor(
        () => {
          expect(result.current).toBeDefined();
        },
        { timeout: 1000 },
      );

      // Use some quota (mais avec limite de 1, on ne peut en utiliser qu'un)
      act(() => {
        result.current.incrementAiMessages();
        result.current.incrementPollCount("conv-1");
      });

      expect(result.current.aiMessagesUsed).toBe(1);
      expect(result.current.pollsInConversation).toBe(1);

      // Reset
      act(() => {
        result.current.resetQuota();
      });

      expect(result.current.aiMessagesUsed).toBe(0);
      expect(result.current.pollsInConversation).toBe(0);
      expect(result.current.aiMessagesRemaining).toBe(1); // Test limit: 1

      vi.useFakeTimers();
    });
  });

  describe("processMonthlyQuotaReset (pure function)", () => {
    it("should return null for guest users", () => {
      const quotaData = {
        aiMessagesUsed: 5,
        lastMessageTimestamp: 0,
        resetDate: new Date().toISOString(),
      };

      const result = processMonthlyQuotaReset(quotaData, true);
      expect(result).toBeNull();
    });

    it("should initialize resetDate for authenticated users without resetDate", () => {
      const quotaData = {
        aiMessagesUsed: 5,
        lastMessageTimestamp: 0,
      };

      const result = processMonthlyQuotaReset(quotaData, false);
      expect(result).not.toBeNull();
      expect(result?.resetDate).toBeTruthy();
      expect(result?.aiMessagesUsed).toBe(5); // Ne change pas
    });

    it("should reset quota when resetDate is in the past", () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      const quotaData = {
        aiMessagesUsed: 5,
        lastMessageTimestamp: 1000,
        resetDate: pastDate.toISOString(),
      };

      const result = processMonthlyQuotaReset(quotaData, false);
      expect(result).not.toBeNull();
      expect(result?.aiMessagesUsed).toBe(0);
      expect(result?.lastMessageTimestamp).toBe(0);
      expect(result?.resetDate).toBeTruthy();
      expect(new Date(result!.resetDate).getTime()).toBeGreaterThan(Date.now());
    });

    it("should return null when resetDate is in the future", () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const quotaData = {
        aiMessagesUsed: 5,
        lastMessageTimestamp: 1000,
        resetDate: futureDate.toISOString(),
      };

      const result = processMonthlyQuotaReset(quotaData, false);
      expect(result).toBeNull();
    });
  });

  describe("Monthly Reset for Authenticated Users", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      } as any);
    });

    it(
      "should initialize reset date for authenticated users",
      async () => {
        // Solution : Utiliser real timers pour ce test
        vi.useRealTimers();
        localStorage.clear();

        const { result } = renderHook(() => useAiMessageQuota());

        // Wait for hook to initialize
        await waitFor(
          () => {
            expect(result.current).toBeDefined();
          },
          { timeout: 1000 },
        );

        // Attendre que l'effet sauvegarde dans localStorage
        // L'effet se déclenche pour les utilisateurs authentifiés
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // Vérifier localStorage après l'act
        await waitFor(
          () => {
            const stored = localStorage.getItem("doodates_ai_quota");
            expect(stored).toBeTruthy();
          },
          { timeout: 2000 },
        );

        const stored = localStorage.getItem("doodates_ai_quota");
        const data = JSON.parse(stored!);
        expect(data.resetDate).toBeTruthy();

        vi.useFakeTimers();
      },
      { timeout: 5000 },
    );

    it("should reset quota when month changes", async () => {
      // Solution : Utiliser la fonction pure processMonthlyQuotaReset pour tester la logique
      // puis vérifier que le hook l'utilise correctement
      vi.useRealTimers();

      // Set quota with past reset date (il y a 1 mois)
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      localStorage.setItem(
        "doodates_ai_quota",
        JSON.stringify({
          aiMessagesUsed: 1,
          lastMessageTimestamp: 0,
          resetDate: pastDate.toISOString(),
        }),
      );

      // Configurer authenticated dès le début
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAiMessageQuota());

      // Attendre que le hook s'initialise
      await waitFor(
        () => {
          expect(result.current).toBeDefined();
        },
        { timeout: 1000 },
      );

      // L'effet devrait appeler processMonthlyQuotaReset qui détecte que resetDate est passée
      // Attendre que l'effet se déclenche et mette à jour l'état
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Vérifier que le reset a eu lieu
      await waitFor(
        () => {
          expect(result.current.aiMessagesUsed).toBe(0);
          expect(result.current.aiMessagesRemaining).toBe(1); // Test limit: 1
        },
        { timeout: 2000 },
      );

      // Restaurer fake timers pour les autres tests
      vi.useFakeTimers();
    });
  });
});
