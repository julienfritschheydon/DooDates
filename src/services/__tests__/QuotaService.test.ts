import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QuotaService } from "../QuotaService";

// Mocks
vi.mock("../../lib/error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn().mockReturnValue({
      code: "storage",
      message: "Storage error",
      userMessage: "Erreur de stockage",
    }),
  },
}));

const { logError } = await import("../../lib/error-handling");

// Helpers pour créer des données de test
const createMockConversation = (id: string, lastModified?: string) => ({
  id,
  title: `Conversation ${id}`,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  firstMessage: `Message for ${id}`,
  messageCount: 1,
  pollId: null,
  pollType: null,
  pollStatus: "draft",
  isFavorite: false,
  tags: [],
  ...(lastModified && { lastModified: new Date(lastModified) }),
});

const createMockPoll = (id: string) => ({
  id,
  title: `Poll ${id}`,
  type: "date",
  status: "active",
  createdAt: new Date(),
});

describe("QuotaService", () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Sauvegarder localStorage original
    originalLocalStorage = window.localStorage;

    // Créer un mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurer localStorage original
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe("calculateStatus", () => {
    it("calcule correctement le statut pour un quota normal", () => {
      const status = QuotaService.calculateStatus(25, 100);

      expect(status).toEqual({
        used: 25,
        limit: 100,
        percentage: 25,
        isNearLimit: false,
        isAtLimit: false,
      });
    });

    it("détecte quand on approche de la limite (80%)", () => {
      const status = QuotaService.calculateStatus(85, 100);

      expect(status.isNearLimit).toBe(true);
      expect(status.isAtLimit).toBe(false);
      expect(status.percentage).toBe(85);
    });

    it("détecte quand on atteint la limite (100%)", () => {
      const status = QuotaService.calculateStatus(100, 100);

      expect(status.isNearLimit).toBe(true);
      expect(status.isAtLimit).toBe(true);
      expect(status.percentage).toBe(100);
    });

    it("détecte quand on dépasse la limite", () => {
      const status = QuotaService.calculateStatus(150, 100);

      expect(status.isNearLimit).toBe(true);
      expect(status.isAtLimit).toBe(true);
      expect(status.percentage).toBe(100); // Capé à 100%
    });

    it("gère les limites nulles ou négatives", () => {
      const status = QuotaService.calculateStatus(10, 0);

      expect(status.percentage).toBe(0);
      expect(status.isAtLimit).toBe(false);
    });
  });

  describe("getStorageSize", () => {
    it("calcule correctement la taille du stockage", () => {
      const mockLocalStorage = {
        getItem: vi.fn((key: string) => {
          if (key === "key1") return "short";
          if (key === "key2") return "a".repeat(1000);
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 2,
        key: vi.fn(),
      };

      // Rendre l'objet itérable
      Object.defineProperty(mockLocalStorage, "key1", { value: "short", enumerable: true });
      Object.defineProperty(mockLocalStorage, "key2", {
        value: "a".repeat(1000),
        enumerable: true,
      });

      // Mock Object.hasOwn pour notre localStorage
      const originalHasOwn = Object.hasOwn;
      Object.hasOwn = vi.fn().mockImplementation((obj, key) => {
        return obj === mockLocalStorage && (key === "key1" || key === "key2");
      });

      // Remplacer temporairement window.localStorage
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      const size = QuotaService.getStorageSize();

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");

      // Restaurer
      Object.hasOwn = originalHasOwn;
    });

    it("retourne 0 en cas d'erreur", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const size = QuotaService.getStorageSize();

      expect(size).toBe(0);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("getConversationCount", () => {
    it("compte correctement les conversations au format array", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = [
        createMockConversation("conv-1"),
        createMockConversation("conv-2"),
        createMockConversation("conv-3"),
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const count = QuotaService.getConversationCount();

      expect(count).toBe(3);
    });

    it("compte correctement les conversations au format object", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = {
        "conv-1": createMockConversation("conv-1"),
        "conv-2": createMockConversation("conv-2"),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const count = QuotaService.getConversationCount();

      expect(count).toBe(2);
    });

    it("compte correctement au format texte (lignes)", () => {
      const mockLocalStorage = window.localStorage as any;
      const textData = "line1\nline2\nline3\n";
      mockLocalStorage.getItem.mockReturnValue(textData);

      const count = QuotaService.getConversationCount();

      expect(count).toBe(3);
    });

    it("retourne 0 quand aucune donnée n'est stockée", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue(null);

      const count = QuotaService.getConversationCount();

      expect(count).toBe(0);
    });

    it("retourne 0 en cas d'erreur de parsing", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}'); // JSON invalide

      const count = QuotaService.getConversationCount();

      expect(count).toBe(0);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("getPollCount", () => {
    it("compte correctement les polls au format array", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = [createMockPoll("poll-1"), createMockPoll("poll-2")];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const count = QuotaService.getPollCount();

      expect(count).toBe(2);
    });

    it("compte correctement les polls au format object", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = {
        "poll-1": createMockPoll("poll-1"),
        "poll-2": createMockPoll("poll-2"),
        "poll-3": createMockPoll("poll-3"),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const count = QuotaService.getPollCount();

      expect(count).toBe(3);
    });

    it("retourne 0 quand aucune donnée n'est stockée", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue(null);

      const count = QuotaService.getPollCount();

      expect(count).toBe(0);
    });

    it("retourne 0 en cas d'erreur de parsing", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}'); // JSON invalide

      const count = QuotaService.getPollCount();

      expect(count).toBe(0);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("calculateUsage", () => {
    it("calcule correctement l'usage total", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = [createMockConversation("conv-1")];
      const polls = [createMockPoll("poll-1")];

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "doodates_conversations") return JSON.stringify(conversations);
        if (key === "doodates_polls") return JSON.stringify(polls);
        return null;
      });

      const usage = QuotaService.calculateUsage();

      expect(usage).toEqual({
        conversations: 1,
        polls: 1,
        storageUsed: expect.any(Number),
      });
    });
  });

  describe("canCreateConversation", () => {
    it("retourne true pour les utilisateurs authentifiés sous la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = Array.from({ length: 50 }, (_, i) =>
        createMockConversation(`conv-${i}`),
      );
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const canCreate = QuotaService.canCreateConversation(true);

      expect(canCreate).toBe(true); // 50 < 100
    });

    it("retourne false pour les utilisateurs authentifiés à la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = Array.from({ length: 100 }, (_, i) =>
        createMockConversation(`conv-${i}`),
      );
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const canCreate = QuotaService.canCreateConversation(true);

      expect(canCreate).toBe(false); // 100 >= 100
    });

    it("retourne true pour les invités sous la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = Array.from({ length: 5 }, (_, i) =>
        createMockConversation(`conv-${i}`),
      );
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const canCreate = QuotaService.canCreateConversation(false);

      expect(canCreate).toBe(true); // 5 < 10
    });

    it("retourne false pour les invités à la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = Array.from({ length: 10 }, (_, i) =>
        createMockConversation(`conv-${i}`),
      );
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const canCreate = QuotaService.canCreateConversation(false);

      expect(canCreate).toBe(false); // 10 >= 10
    });
  });

  describe("canCreatePoll", () => {
    it("retourne true pour les utilisateurs authentifiés sous la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = Array.from({ length: 25 }, (_, i) => createMockPoll(`poll-${i}`));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const canCreate = QuotaService.canCreatePoll(true);

      expect(canCreate).toBe(true); // 25 < 50
    });

    it("retourne false pour les utilisateurs authentifiés à la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = Array.from({ length: 50 }, (_, i) => createMockPoll(`poll-${i}`));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const canCreate = QuotaService.canCreatePoll(true);

      expect(canCreate).toBe(false); // 50 >= 50
    });

    it("retourne true pour les invités sous la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = Array.from({ length: 2 }, (_, i) => createMockPoll(`poll-${i}`));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const canCreate = QuotaService.canCreatePoll(false);

      expect(canCreate).toBe(true); // 2 < 5
    });

    it("retourne false pour les invités à la limite", () => {
      const mockLocalStorage = window.localStorage as any;
      const polls = Array.from({ length: 5 }, (_, i) => createMockPoll(`poll-${i}`));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(polls));

      const canCreate = QuotaService.canCreatePoll(false);

      expect(canCreate).toBe(false); // 5 >= 5
    });
  });

  describe("getAuthIncentiveType", () => {
    it("retourne 'feature_unlock' pour les utilisateurs authentifiés", () => {
      const incentive = QuotaService.getAuthIncentiveType(true);

      expect(incentive).toBe("feature_unlock");
    });

    it("retourne 'conversation_limit' quand la limite de conversations est atteinte", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations: ReturnType<typeof createMockConversation>[] = Array.from(
        { length: 10 },
        (_, i) => createMockConversation(`conv-${i}`),
      );
      const polls: ReturnType<typeof createMockPoll>[] = [];
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "doodates_conversations") return JSON.stringify(conversations);
        if (key === "doodates_polls") return JSON.stringify(polls);
        return null;
      });

      const incentive = QuotaService.getAuthIncentiveType(false);

      expect(incentive).toBe("conversation_limit");
    });

    it("retourne 'poll_limit' quand la limite de polls est atteinte", () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations: ReturnType<typeof createMockConversation>[] = [];
      const polls: ReturnType<typeof createMockPoll>[] = Array.from({ length: 5 }, (_, i) =>
        createMockPoll(`poll-${i}`),
      );
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "doodates_conversations") return JSON.stringify(conversations);
        if (key === "doodates_polls") return JSON.stringify(polls);
        return null;
      });

      const incentive = QuotaService.getAuthIncentiveType(false);

      expect(incentive).toBe("poll_limit");
    });

    it("retourne 'storage_full' quand la limite de stockage est atteinte", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "doodates_conversations") return JSON.stringify([]);
        if (key === "doodates_polls") return JSON.stringify([]);
        return null;
      });

      // Mock getStorageSize directement
      const originalGetStorageSize = QuotaService.getStorageSize;
      QuotaService.getStorageSize = vi.fn().mockReturnValue(60); // > 50MB limite guest

      const incentive = QuotaService.getAuthIncentiveType(false);

      expect(incentive).toBe("storage_full");

      // Restaurer
      QuotaService.getStorageSize = originalGetStorageSize;
    });

    it("retourne par défaut 'conversation_limit' pour les invités sans limite atteinte", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockImplementation(() => JSON.stringify([]));

      const incentive = QuotaService.getAuthIncentiveType(false);

      expect(incentive).toBe("conversation_limit");
    });
  });

  describe("findOldConversations", () => {
    it("trouve les conversations plus anciennes que le seuil (array format)", () => {
      const mockLocalStorage = window.localStorage as any;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 jours dans le passé

      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 10); // 10 jours dans le passé

      const conversations = [
        createMockConversation("conv-1", oldDate.toISOString()),
        createMockConversation("conv-2", newDate.toISOString()),
        createMockConversation("conv-3", oldDate.toISOString()),
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const oldIds = QuotaService.findOldConversations(30);

      expect(oldIds).toEqual(["conv-1", "conv-3"]);
    });

    it("trouve les conversations plus anciennes que le seuil (object format)", () => {
      const mockLocalStorage = window.localStorage as any;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      const conversations = {
        "conv-1": createMockConversation("conv-1", oldDate.toISOString()),
        "conv-2": createMockConversation("conv-2"), // Pas de lastModified
        "conv-3": createMockConversation("conv-3", oldDate.toISOString()),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const oldIds = QuotaService.findOldConversations(30);

      expect(oldIds).toEqual(["conv-1", "conv-3"]);
    });

    it("retourne un tableau vide quand aucune donnée n'est stockée", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue(null);

      const oldIds = QuotaService.findOldConversations(30);

      expect(oldIds).toEqual([]);
    });

    it("retourne un tableau vide en cas d'erreur", () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}'); // JSON invalide

      const oldIds = QuotaService.findOldConversations(30);

      expect(oldIds).toEqual([]);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("deleteConversations", () => {
    it("supprime les conversations spécifiées (array format)", async () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = [
        createMockConversation("conv-1"),
        createMockConversation("conv-2"),
        createMockConversation("conv-3"),
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const deletedCount = await QuotaService.deleteConversations(["conv-1", "conv-3"]);

      expect(deletedCount).toBe(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "doodates_conversations",
        JSON.stringify([conversations[1]]), // conv-2 reste
      );
    });

    it("supprime les conversations spécifiées (object format)", async () => {
      const mockLocalStorage = window.localStorage as any;
      const conversations = {
        "conv-1": createMockConversation("conv-1"),
        "conv-2": createMockConversation("conv-2"),
        "conv-3": createMockConversation("conv-3"),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(conversations));

      const deletedCount = await QuotaService.deleteConversations(["conv-1", "conv-3"]);

      expect(deletedCount).toBe(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "doodates_conversations",
        JSON.stringify({ "conv-2": conversations["conv-2"] }),
      );
    });

    it("retourne 0 quand aucune donnée n'est stockée", async () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue(null);

      const deletedCount = await QuotaService.deleteConversations(["conv-1"]);

      expect(deletedCount).toBe(0);
    });

    it("retourne 0 en cas d'erreur", async () => {
      const mockLocalStorage = window.localStorage as any;
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}'); // JSON invalide

      const deletedCount = await QuotaService.deleteConversations(["conv-1"]);

      expect(deletedCount).toBe(0);
      expect(logError).toHaveBeenCalled();
    });
  });
});
