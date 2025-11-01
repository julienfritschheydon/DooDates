/**
 * Tests pour conversationFilters.ts
 * Session 1 - Architecture Centrée Conversations
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  filterConversations,
  enrichConversationWithStats,
  filterAndEnrichConversations,
  type ConversationFilter,
} from "../conversationFilters";
import type { Conversation } from "../../types/conversation";

// Mock des fonctions de pollStorage
vi.mock("../pollStorage", () => ({
  getPollBySlugOrId: vi.fn(),
  getFormResponses: vi.fn(),
  getAllVotes: vi.fn(),
}));

import { getPollBySlugOrId, getFormResponses, getAllVotes } from "../pollStorage";

describe("conversationFilters", () => {
  // Données de test
  const mockConversations: Conversation[] = [
    {
      id: "conv-1",
      title: "Conversation avec sondage date",
      status: "active",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      firstMessage: "Test",
      messageCount: 5,
      isFavorite: false,
      tags: [],
      pollId: "poll-1",
      pollType: "date",
      pollStatus: "active",
    },
    {
      id: "conv-2",
      title: "Conversation avec formulaire",
      status: "active",
      createdAt: new Date("2025-01-02"),
      updatedAt: new Date("2025-01-02"),
      firstMessage: "Test",
      messageCount: 3,
      isFavorite: false,
      tags: [],
      pollId: "poll-2",
      pollType: "form",
      pollStatus: "draft",
    },
    {
      id: "conv-3",
      title: "Conversation sans sondage",
      status: "active",
      createdAt: new Date("2025-01-03"),
      updatedAt: new Date("2025-01-03"),
      firstMessage: "Test",
      messageCount: 2,
      isFavorite: false,
      tags: [],
      pollType: null,
    },
    {
      id: "conv-4",
      title: "Conversation avec brouillon",
      status: "active",
      createdAt: new Date("2025-01-04"),
      updatedAt: new Date("2025-01-04"),
      firstMessage: "Test",
      messageCount: 1,
      isFavorite: false,
      tags: [],
      pollId: "poll-4",
      pollType: "date",
      pollStatus: "draft",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filterConversations", () => {
    test('filtre "all" retourne toutes les conversations', () => {
      const result = filterConversations(mockConversations, "all");
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockConversations);
    });

    test('filtre "with-poll" retourne uniquement conversations avec sondage date', () => {
      const result = filterConversations(mockConversations, "with-poll");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("conv-1");
      expect(result[1].id).toBe("conv-4");
      expect(result.every((c) => c.pollType === "date")).toBe(true);
    });

    test('filtre "with-form" retourne uniquement conversations avec formulaire', () => {
      const result = filterConversations(mockConversations, "with-form");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("conv-2");
      expect(result[0].pollType).toBe("form");
    });

    test('filtre "no-poll" retourne uniquement conversations sans sondage', () => {
      const result = filterConversations(mockConversations, "no-poll");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("conv-3");
      expect(result[0].pollType).toBeNull();
    });

    test('filtre "draft" retourne uniquement brouillons', () => {
      const result = filterConversations(mockConversations, "draft");
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.pollStatus === "draft")).toBe(true);
    });

    test('filtre "published" retourne uniquement sondages actifs/fermés', () => {
      const result = filterConversations(mockConversations, "published");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("conv-1");
      expect(result[0].pollStatus).toBe("active");
    });

    test("gère les filtres invalides en retournant toutes les conversations", () => {
      const result = filterConversations(mockConversations, "invalid-filter" as ConversationFilter);
      expect(result).toHaveLength(4);
    });
  });

  describe("enrichConversationWithStats", () => {
    test("retourne la conversation telle quelle si pas de pollId", () => {
      const conv = mockConversations[2]; // Conversation sans poll
      const result = enrichConversationWithStats(conv);
      expect(result).toEqual(conv);
      expect(result.participants_count).toBeUndefined();
    });

    test("retourne la conversation telle quelle si poll non trouvé", () => {
      vi.mocked(getPollBySlugOrId).mockReturnValue(null);
      const conv = mockConversations[0];
      const result = enrichConversationWithStats(conv);
      expect(result.participants_count).toBeUndefined();
    });

    test("enrichit avec stats pour un formulaire", () => {
      const mockPoll = {
        id: "poll-2",
        type: "form" as const,
        title: "Test Form",
        slug: "test-form",
        creator_id: "user1",
        status: "draft" as const,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        dates: [],
      };

      const mockResponses = [
        {
          id: "resp-1",
          pollId: "poll-2",
          respondentName: "Alice",
          created_at: "2025-01-01",
          items: [],
        },
        {
          id: "resp-2",
          pollId: "poll-2",
          respondentName: "Bob",
          created_at: "2025-01-01",
          items: [],
        },
        {
          id: "resp-3",
          pollId: "poll-2",
          respondentName: "Alice",
          created_at: "2025-01-02",
          items: [],
        },
      ];

      vi.mocked(getPollBySlugOrId).mockReturnValue(mockPoll);
      vi.mocked(getFormResponses).mockReturnValue(mockResponses);

      const conv = mockConversations[1]; // Conversation avec formulaire
      const result = enrichConversationWithStats(conv);

      expect(result.participants_count).toBe(2); // Alice et Bob (Alice compte 1 fois)
      expect(result.votes_count).toBe(3); // 3 réponses totales
    });

    test("enrichit avec stats et top dates pour un sondage date", () => {
      const mockPoll = {
        id: "poll-1",
        type: "date" as const,
        title: "Test Poll",
        slug: "test-poll",
        creator_id: "user1",
        status: "active" as const,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        dates: ["2025-01-15", "2025-01-16", "2025-01-17"],
      };

      const mockVotes = [
        {
          id: "vote-1",
          poll_id: "poll-1",
          voter_email: "alice@test.com",
          vote_data: { "option-0": "yes", "option-1": "maybe", "option-2": "no" },
        },
        {
          id: "vote-2",
          poll_id: "poll-1",
          voter_email: "bob@test.com",
          vote_data: { "option-0": "yes", "option-1": "yes", "option-2": "maybe" },
        },
      ];

      vi.mocked(getPollBySlugOrId).mockReturnValue(mockPoll);
      vi.mocked(getAllVotes).mockReturnValue(mockVotes);

      const conv = mockConversations[0]; // Conversation avec sondage date
      const result = enrichConversationWithStats(conv);

      expect(result.participants_count).toBe(2); // Alice et Bob
      expect(result.votes_count).toBe(2);
      expect(result.topDates).toBeDefined();
      expect(result.topDates).toHaveLength(2);
      // option-0: 2 yes = 6 pts, option-1: 1 yes + 1 maybe = 4 pts
      expect(result.topDates![0].date).toBe("2025-01-15");
      expect(result.topDates![0].score).toBe(6);
      expect(result.topDates![1].date).toBe("2025-01-16");
      expect(result.topDates![1].score).toBe(4);
    });
  });

  describe("filterAndEnrichConversations", () => {
    test("filtre et enrichit les conversations en une seule opération", () => {
      const mockPoll = {
        id: "poll-1",
        type: "date" as const,
        title: "Test",
        slug: "test",
        creator_id: "user1",
        status: "active" as const,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        dates: ["2025-01-15"],
      };

      vi.mocked(getPollBySlugOrId).mockReturnValue(mockPoll);
      vi.mocked(getAllVotes).mockReturnValue([]);

      const result = filterAndEnrichConversations(mockConversations, "with-poll");

      expect(result).toHaveLength(2); // 2 conversations avec sondage date
      expect(result[0].pollType).toBe("date");
      expect(result[1].pollType).toBe("date");
      // Vérifie que l'enrichissement a été appliqué
      expect(result[0].participants_count).toBeDefined();
    });
  });
});
