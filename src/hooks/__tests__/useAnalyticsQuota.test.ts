/**
 * Tests pour useAnalyticsQuota hook
 * Teste la gestion des quotas freemium pour analytics IA
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAnalyticsQuota } from "../useAnalyticsQuota";
import { ANALYTICS_QUOTAS } from "@/constants/quotas";

// Mock useAuth
const mockUser = { id: "test-user-123", email: "test@example.com" };
const mockUseAuth = vi.fn(() => ({
  user: null,
  loading: false,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Helper pour installer localStorage mock
function installLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

describe("useAnalyticsQuota", () => {
  let localStorageMock: ReturnType<typeof installLocalStorage>;
  const STORAGE_KEY = "doodates-analytics-quota";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = installLocalStorage();

    // Remplacer localStorage global
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Reset mock useAuth par défaut (utilisateur anonyme)
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  describe("Initialisation", () => {
    it("initialise avec quota anonyme par défaut (5 queries)", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      expect(result.current.quota.limit).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      expect(result.current.quota.used).toBe(0);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      expect(result.current.quota.canQuery).toBe(true);
    });

    it("initialise avec quota authentifié si user présent (50 queries)", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const { result } = renderHook(() => useAnalyticsQuota());

      expect(result.current.quota.limit).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
      expect(result.current.quota.used).toBe(0);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
      expect(result.current.quota.canQuery).toBe(true);
    });

    it("charge le quota depuis localStorage si présent", () => {
      const today = new Date().toISOString().split("T")[0];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ count: 3, date: today }));

      const { result } = renderHook(() => useAnalyticsQuota());

      waitFor(() => {
        expect(result.current.quota.used).toBe(3);
        expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS - 3);
        expect(result.current.quota.canQuery).toBe(true);
      });
    });

    it("reset le quota si date différente dans localStorage", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ count: 10, date: yesterdayStr }));

      const { result } = renderHook(() => useAnalyticsQuota());

      waitFor(() => {
        expect(result.current.quota.used).toBe(0);
        expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);

        // Vérifier que localStorage a été mis à jour avec la date d'aujourd'hui
        const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || "{}");
        expect(stored.date).toBe(new Date().toISOString().split("T")[0]);
      });
    });

    it("reset le quota si localStorage vide", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      waitFor(() => {
        expect(result.current.quota.used).toBe(0);
        expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);

        // Vérifier que localStorage a été initialisé
        const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || "{}");
        expect(stored.count).toBe(0);
        expect(stored.date).toBe(new Date().toISOString().split("T")[0]);
      });
    });
  });

  describe("incrementQuota", () => {
    it("incrémente le quota et met à jour localStorage", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        result.current.incrementQuota();
      });

      expect(result.current.quota.used).toBe(1);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS - 1);
      expect(result.current.quota.canQuery).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || "{}");
      expect(stored.count).toBe(1);
    });

    it("retourne true si quota restant > 0", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        const canContinue = result.current.incrementQuota();
        expect(canContinue).toBe(true);
      });
    });

    it("retourne false si quota atteint", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      // Incrémenter jusqu'à la limite
      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.ANONYMOUS; i++) {
          result.current.incrementQuota();
        }
      });

      expect(result.current.quota.used).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      expect(result.current.quota.remaining).toBe(0);
      expect(result.current.quota.canQuery).toBe(false);

      act(() => {
        const canContinue = result.current.incrementQuota();
        expect(canContinue).toBe(false);
      });
    });

    it("bloque les queries quand quota atteint", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      // Incrémenter jusqu'à la limite
      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.ANONYMOUS; i++) {
          result.current.incrementQuota();
        }
      });

      expect(result.current.checkQuota()).toBe(false);
      expect(result.current.quota.canQuery).toBe(false);
    });

    it("reset automatiquement si changement de jour lors de l'incrémentation", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ count: 10, date: yesterdayStr }));

      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        result.current.incrementQuota();
      });

      // Devrait reset et commencer à 1
      expect(result.current.quota.used).toBe(1);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS - 1);
    });

    it("gère les erreurs localStorage gracieusement", async () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      // Attendre que le hook soit complètement initialisé
      await waitFor(() => {
        expect(result.current.quota.used).toBe(0);
      });

      // Préparer localStorage avec une valeur existante
      const today = new Date().toISOString().split("T")[0];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ count: 0, date: today }));

      // Utiliser vi.spyOn pour intercepter setItem et lancer l'erreur seulement lors de l'incrémentation
      const setItemSpy = vi.spyOn(localStorageMock, "setItem");

      // Compter les appels - lancer l'erreur au 2ème appel (après l'init)
      let callCount = 0;
      setItemSpy.mockImplementation((key, value) => {
        callCount++;
        if (key === STORAGE_KEY && callCount === 2) {
          throw new Error("Storage quota exceeded");
        }
        // Appel normal pour les autres cas
        localStorageMock.setItem(key, value);
      });

      act(() => {
        const canContinue = result.current.incrementQuota();
        // Le hook devrait retourner false en cas d'erreur (catch block)
        expect(canContinue).toBe(false);
      });

      setItemSpy.mockRestore();
    });
  });

  describe("resetQuota", () => {
    it("reset le quota à zéro", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      // Incrémenter d'abord
      act(() => {
        result.current.incrementQuota();
        result.current.incrementQuota();
      });

      expect(result.current.quota.used).toBe(2);

      // Reset
      act(() => {
        result.current.resetQuota();
      });

      expect(result.current.quota.used).toBe(0);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      expect(result.current.quota.canQuery).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || "{}");
      expect(stored.count).toBe(0);
    });

    it("met à jour la limite si changement d'utilisateur", () => {
      const { result, rerender } = renderHook(() => useAnalyticsQuota());

      // Utilisateur anonyme (limit: 5)
      expect(result.current.quota.limit).toBe(ANALYTICS_QUOTAS.ANONYMOUS);

      // Changer pour utilisateur authentifié
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      rerender();

      act(() => {
        result.current.resetQuota();
      });

      expect(result.current.quota.limit).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
    });
  });

  describe("checkQuota", () => {
    it("retourne true si quota disponible", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      expect(result.current.checkQuota()).toBe(true);
    });

    it("retourne false si quota épuisé", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.ANONYMOUS; i++) {
          result.current.incrementQuota();
        }
      });

      expect(result.current.checkQuota()).toBe(false);
    });
  });

  describe("getQuotaMessage", () => {
    it("retourne message avec quota restant si disponible", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        result.current.incrementQuota();
      });

      const message = result.current.getQuotaMessage();
      expect(message).toContain("restante");
      expect(message).toContain("4");
    });

    it("retourne message au singulier si 1 restante", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.ANONYMOUS - 1; i++) {
          result.current.incrementQuota();
        }
      });

      const message = result.current.getQuotaMessage();
      expect(message).toContain("1 requête restante");
    });

    it("retourne message de quota épuisé si limit atteint", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.ANONYMOUS; i++) {
          result.current.incrementQuota();
        }
      });

      const message = result.current.getQuotaMessage();
      expect(message).toContain("Quota épuisé");
      expect(message).toContain("Réinitialisation");
    });
  });

  describe("Quotas utilisateur authentifié", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });
    });

    it("utilise limite authentifiée (50 queries)", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      expect(result.current.quota.limit).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
      expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
    });

    it("peut incrémenter jusqu'à 50 queries", () => {
      const { result } = renderHook(() => useAnalyticsQuota());

      act(() => {
        for (let i = 0; i < ANALYTICS_QUOTAS.AUTHENTICATED; i++) {
          result.current.incrementQuota();
        }
      });

      expect(result.current.quota.used).toBe(ANALYTICS_QUOTAS.AUTHENTICATED);
      expect(result.current.quota.remaining).toBe(0);
      expect(result.current.quota.canQuery).toBe(false);
    });
  });

  describe("Gestion des erreurs", () => {
    it("gère les erreurs de parsing JSON dans localStorage", () => {
      localStorageMock.setItem(STORAGE_KEY, "invalid-json");

      const { result } = renderHook(() => useAnalyticsQuota());

      waitFor(() => {
        // Devrait reset en cas d'erreur
        expect(result.current.quota.used).toBe(0);
        expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      });
    });

    it("gère les erreurs lors du chargement du quota", () => {
      // Simuler une erreur lors du getItem
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useAnalyticsQuota());

      waitFor(() => {
        // Devrait reset en cas d'erreur
        expect(result.current.quota.used).toBe(0);
        expect(result.current.quota.remaining).toBe(ANALYTICS_QUOTAS.ANONYMOUS);
      });

      // Restaurer
      localStorageMock.getItem = originalGetItem;
    });
  });
});
