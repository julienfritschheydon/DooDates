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
import { setupMockLocalStorage, setupQuotaTestWindow } from "../../__tests__/helpers/testHelpers";

// Mock quotas avec des valeurs de test simplifiées
// Note: STORAGE_QUOTAS est nécessaire car useAiMessageQuota utilise useFreemiumQuota
// qui importe STORAGE_QUOTAS pour définir les limites de stockage
vi.mock("@/constants/quotas", () => ({
  AI_MESSAGE_QUOTAS: {
    ANONYMOUS: 1, // Valeur de test : 1 message pour guest
    AUTHENTICATED: 1, // Valeur de test : 1 message pour authenticated
  },
  POLL_CREATION_QUOTAS: {
    ANONYMOUS: 1, // Valeur de test : 1 poll pour guest
    AUTHENTICATED: 1, // Valeur de test : 1 poll pour authenticated
  },
  CONVERSATION_QUOTAS: {
    ANONYMOUS: 5, // Valeur de test : 5 conversations pour guest
    AUTHENTICATED: 1000, // Valeur de test : 1000 conversations pour authenticated
  },
  // Nécessaire car useFreemiumQuota (utilisé par useAiMessageQuota) importe STORAGE_QUOTAS
  STORAGE_QUOTAS: {
    ANONYMOUS: 50, // Valeur de test : 50MB pour guest
    AUTHENTICATED: 1000, // Valeur de test : 1000MB pour authenticated
  },
}));

// Mock useAuth
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("../../contexts/AuthContext");
const mockUseAuth = vi.mocked(useAuth);

describe("useAiMessageQuota", () => {
  beforeEach(() => {
    // Setup mock localStorage (comme dans les autres tests du projet)
    setupMockLocalStorage();
    // Setup window pour éviter le bypass E2E dans les tests de quota
    setupQuotaTestWindow();

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

    it("should persist quota in localStorage", () => {
      // Solution : Utiliser act() qui flush automatiquement les effets React
      // Pas besoin de real timers, act() gère déjà le flush des effets
      const { result } = renderHook(() => useAiMessageQuota());

      act(() => {
        result.current.incrementAiMessages();
      });

      // act() flush les effets React, donc localStorage devrait être mis à jour immédiatement
      const stored = localStorage.getItem("doodates_ai_quota");
      expect(stored).toBeTruthy();
      const data = JSON.parse(stored!);
      expect(data.aiMessagesUsed).toBe(1);
    });

    it("should restore quota from localStorage", () => {
      // Le hook lit depuis localStorage dans l'initializer de useState
      // C'est synchrone, donc on peut utiliser fake timers
      vi.useFakeTimers();
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

      // Le hook devrait avoir lu les données depuis localStorage immédiatement
      // car useState initializer est synchrone
      expect(result.current.aiMessagesUsed).toBe(1);
      expect(result.current.aiMessagesRemaining).toBe(0); // 1 - 1 = 0
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

    it("should persist poll counts in localStorage", () => {
      // Solution : Utiliser act() qui flush automatiquement les effets React
      const { result } = renderHook(() => useAiMessageQuota("conv-1"));

      act(() => {
        result.current.incrementPollCount("conv-1");
      });

      // act() flush les effets React, donc localStorage devrait être mis à jour immédiatement
      const stored = localStorage.getItem("doodates_poll_counts");
      expect(stored).toBeTruthy();
      const data = JSON.parse(stored!);
      expect(data["conv-1"]).toBe(1);
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

    it("should allow message after cooldown expires", () => {
      // Solution : Utiliser fake timers avec setSystemTime pour synchroniser Date.now() et les timers
      const { result, rerender } = renderHook(() => useAiMessageQuota());

      const startTime = Date.now();

      act(() => {
        result.current.incrementAiMessages();
      });

      expect(result.current.isInCooldown).toBe(true);

      // Avancer le temps système AVANT les timers pour que Date.now() soit à jour
      act(() => {
        vi.setSystemTime(startTime + 3100);
        // Avancer les timers pour déclencher le setTimeout qui met isInCooldown à false
        vi.advanceTimersByTime(3100);
        // Forcer un re-render pour que le useEffect recalcule avec le nouveau Date.now()
        rerender();
      });

      // Vérifier que le cooldown est terminé
      // Note: canSendMessage peut être false si le quota est épuisé, mais isInCooldown doit être false
      expect(result.current.isInCooldown).toBe(false);
      // canSendMessage = aiMessagesRemaining > 0 && !isInCooldown
      // Ici aiMessagesRemaining = 0 (quota utilisé), donc canSendMessage = false même si cooldown terminé
      // C'est normal, le test vérifie juste que le cooldown est terminé

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
      expect(new Date(result!.resetDate!).getTime()).toBeGreaterThan(Date.now());
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

    it("should initialize reset date for authenticated users", () => {
      // Solution : Utiliser act() qui flush automatiquement les effets React
      // L'effet processMonthlyQuotaReset se déclenche au montage pour les auth users
      const { result } = renderHook(() => useAiMessageQuota());

      // act() est déjà appelé par renderHook, mais on peut forcer un flush supplémentaire
      act(() => {
        // Forcer un re-render pour s'assurer que tous les effets sont exécutés
      });

      // L'effet devrait avoir initialisé resetDate et sauvegardé dans localStorage
      const stored = localStorage.getItem("doodates_ai_quota");
      expect(stored).toBeTruthy();
      const data = JSON.parse(stored!);
      expect(data.resetDate).toBeTruthy();
    });

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
