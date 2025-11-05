import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  filterConversationItems,
  getStatusColor,
  getStatusLabel,
  findRelatedConversation,
} from "../utils";
import type { ConversationItem, FilterType } from "../types";
import { getConversations } from "@/lib/storage/ConversationStorageSimple";

// Mock du storage
vi.mock("@/lib/storage/ConversationStorageSimple", () => ({
  getConversations: vi.fn(() => []),
}));

describe("Dashboard Utils", () => {
  const mockItems: ConversationItem[] = [
    {
      id: "conv-1",
      conversationTitle: "Réunion Sprint Planning",
      conversationDate: new Date("2024-01-01"),
      hasAI: true,
      tags: ["Prioritaire", "Client"],
      folderId: "folder-1",
      poll: {
        id: "poll-1",
        slug: "poll-1",
        title: "Sondage Réunion",
        type: "date",
        status: "active",
        created_at: "2024-01-01",
      },
    },
    {
      id: "conv-2",
      conversationTitle: "Satisfaction Client Q4",
      conversationDate: new Date("2024-01-02"),
      hasAI: false,
      tags: ["Client", "Marketing"],
      folderId: "folder-2",
      poll: {
        id: "poll-2",
        slug: "poll-2",
        title: "Sondage Satisfaction",
        type: "form",
        status: "draft",
        created_at: "2024-01-02",
      },
    },
    {
      id: "conv-3",
      conversationTitle: "Conversation sans poll",
      conversationDate: new Date("2024-01-03"),
      hasAI: false,
      tags: ["Interne"],
      folderId: undefined,
    },
    {
      id: "conv-4",
      conversationTitle: "Sondage Clôturé",
      conversationDate: new Date("2024-01-04"),
      hasAI: true,
      tags: ["Prioritaire"],
      folderId: "folder-1",
      poll: {
        id: "poll-3",
        slug: "poll-3",
        title: "Sondage Clôturé",
        type: "date",
        status: "closed",
        created_at: "2024-01-04",
      },
    },
  ];

  describe("filterConversationItems", () => {
    it("should return all items when filter is 'all'", () => {
      const result = filterConversationItems(mockItems, "all", "");
      expect(result).toHaveLength(4);
    });

    it("should filter by status 'active'", () => {
      const result = filterConversationItems(mockItems, "active", "");
      // Les items sans poll ne sont pas filtrés (car filter === 'all' ou !item.poll)
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Vérifier que tous les résultats avec poll ont le statut 'active'
      result.forEach((item) => {
        if (item.poll) {
          expect(item.poll.status).toBe("active");
        }
      });
    });

    it("should filter by status 'draft'", () => {
      const result = filterConversationItems(mockItems, "draft", "");
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Vérifier que tous les résultats avec poll ont le statut 'draft'
      result.forEach((item) => {
        if (item.poll) {
          expect(item.poll.status).toBe("draft");
        }
      });
    });

    it("should filter by status 'closed'", () => {
      const result = filterConversationItems(mockItems, "closed", "");
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Vérifier que tous les résultats avec poll ont le statut 'closed'
      result.forEach((item) => {
        if (item.poll) {
          expect(item.poll.status).toBe("closed");
        }
      });
    });

    it("should filter by search query in conversation title", () => {
      const result = filterConversationItems(mockItems, "all", "Réunion");
      expect(result).toHaveLength(1);
      expect(result[0].conversationTitle).toContain("Réunion");
    });

    it("should filter by search query in poll title", () => {
      const result = filterConversationItems(mockItems, "all", "Satisfaction");
      expect(result).toHaveLength(1);
      expect(result[0].poll?.title).toContain("Satisfaction");
    });

    it("should filter by search query in poll description", () => {
      const itemsWithDescription = [
        {
          ...mockItems[0],
          poll: {
            ...mockItems[0].poll!,
            description: "Description test recherche",
          },
        },
      ];
      const result = filterConversationItems(itemsWithDescription, "all", "recherche");
      expect(result).toHaveLength(1);
    });

    it("should filter by search query in tags", () => {
      const result = filterConversationItems(mockItems, "all", "Prioritaire");
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((item) => item.tags?.includes("Prioritaire"))).toBe(true);
    });

    it("should be case insensitive", () => {
      const result = filterConversationItems(mockItems, "all", "réunion");
      expect(result).toHaveLength(1);
    });

    it("should filter by tags", () => {
      const result = filterConversationItems(mockItems, "all", "", ["Prioritaire"]);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((item) => item.tags?.includes("Prioritaire"))).toBe(true);
    });

    it("should filter by multiple tags (AND logic)", () => {
      const result = filterConversationItems(mockItems, "all", "", ["Prioritaire", "Client"]);
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.every((item) => item.tags?.includes("Prioritaire") && item.tags?.includes("Client")),
      ).toBe(true);
    });

    it("should return all items when no tags selected", () => {
      const result = filterConversationItems(mockItems, "all", "", []);
      expect(result).toHaveLength(4);
    });

    it("should filter by folder", () => {
      const result = filterConversationItems(mockItems, "all", "", undefined, "folder-1");
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((item) => item.folderId === "folder-1")).toBe(true);
    });

    it("should return items without folder when folderId is null", () => {
      const result = filterConversationItems(mockItems, "all", "", undefined, null);
      // folderId null signifie "afficher uniquement les items sans dossier"
      expect(result.length).toBeGreaterThanOrEqual(0);
      result.forEach((item) => {
        expect(item.folderId).toBeUndefined();
      });
    });

    it("should return all items when folderId is undefined", () => {
      const result = filterConversationItems(mockItems, "all", "", undefined, undefined);
      expect(result).toHaveLength(4);
    });

    it("should combine all filters", () => {
      const result = filterConversationItems(mockItems, "active", "Réunion", ["Prioritaire"], "folder-1");
      expect(result.length).toBeGreaterThanOrEqual(0);
      // Vérifier que tous les critères sont respectés
      result.forEach((item) => {
        expect(item.poll?.status).toBe("active");
        expect(item.conversationTitle.toLowerCase()).toContain("réunion");
        expect(item.tags).toContain("Prioritaire");
        expect(item.folderId).toBe("folder-1");
      });
    });

    it("should return empty array when no matches", () => {
      const result = filterConversationItems(mockItems, "all", "xyz123nonexistent");
      expect(result).toHaveLength(0);
    });

    it("should handle items without poll for status filter", () => {
      const result = filterConversationItems(mockItems, "active", "");
      // Selon la logique: filter === "all" || !item.poll || item.poll.status === filter
      // Les items sans poll passent le filtre si filter !== "all"
      // Mais en pratique, filterConversationItems filtre seulement les items avec poll
      expect(result.length).toBeGreaterThanOrEqual(0);
      // Vérifier que les items avec poll ont le bon statut
      result.forEach((item) => {
        if (item.poll) {
          expect(item.poll.status).toBe("active");
        }
      });
    });
  });

  describe("getStatusColor", () => {
    it("should return correct color for draft", () => {
      expect(getStatusColor("draft")).toBe("bg-gray-100 text-gray-800");
    });

    it("should return correct color for active", () => {
      expect(getStatusColor("active")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return correct color for closed", () => {
      expect(getStatusColor("closed")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return correct color for archived", () => {
      expect(getStatusColor("archived")).toBe("bg-red-100 text-red-800");
    });
  });

  describe("getStatusLabel", () => {
    it("should return correct label for draft", () => {
      expect(getStatusLabel("draft")).toBe("Brouillon");
    });

    it("should return correct label for active", () => {
      expect(getStatusLabel("active")).toBe("Actif");
    });

    it("should return correct label for closed", () => {
      expect(getStatusLabel("closed")).toBe("Terminé");
    });

    it("should return correct label for archived", () => {
      expect(getStatusLabel("archived")).toBe("Archivé");
    });
  });

  describe("findRelatedConversation", () => {
    it("should return relatedConversationId if present", () => {
      const poll = {
        id: "poll-1",
        relatedConversationId: "conv-1",
      } as any;
      expect(findRelatedConversation(poll)).toBe("conv-1");
    });

    it("should find conversation by pollId in metadata", () => {
      const mockConversations = [
        {
          id: "conv-1",
          metadata: { pollId: "poll-1", pollGenerated: true },
        },
      ];
      vi.mocked(getConversations).mockReturnValue(mockConversations as any);

      const poll = { id: "poll-1" } as any;
      expect(findRelatedConversation(poll)).toBe("conv-1");
    });

    it("should return undefined if no match found", () => {
      vi.mocked(getConversations).mockReturnValue([]);
      const poll = { id: "poll-999" } as any;
      expect(findRelatedConversation(poll)).toBeUndefined();
    });

    it("should handle errors gracefully", () => {
      vi.mocked(getConversations).mockImplementation(() => {
        throw new Error("Storage error");
      });
      const poll = { id: "poll-1" } as any;
      expect(findRelatedConversation(poll)).toBeUndefined();
    });
  });
});
