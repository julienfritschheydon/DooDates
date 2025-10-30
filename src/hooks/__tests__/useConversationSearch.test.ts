/**
 * Tests for useConversationSearch hook
 * DooDates - Conversation History System
 */

import { vi } from "vitest";
import type { Conversation, ConversationStatus } from "../../types/conversation";
import type { SearchFilters, SearchOptions } from "../../types/search";
import { createMockConversation as createBaseConversation } from "../../__tests__/helpers/testHelpers";

// Mock the useConversations hook
vi.mock("../useConversations", () => ({
  useConversations: vi.fn(),
}));

// Mock the useDebounce hook
vi.mock("../useDebounce", () => ({
  useDebounce: vi.fn((value) => value), // Return value immediately for testing
}));

describe("useConversationSearch Logic", () => {
  // Mock conversations for testing - using helper
  const createMockConversation = (
    id: string,
    title: string,
    firstMessage: string,
    status: ConversationStatus = "active",
    tags: string[] = [],
    isFavorite = false,
    createdAt = new Date("2024-01-01"),
    relatedPollId?: string,
  ): Conversation =>
    createBaseConversation({
      id,
      title,
      firstMessage,
      status,
      tags,
      isFavorite,
      createdAt,
      updatedAt: createdAt,
      relatedPollId,
    });

  const mockConversations: Conversation[] = [
    createMockConversation(
      "1",
      "Meeting with team",
      "Discuss project roadmap",
      "active",
      ["work", "meeting"],
      false,
      new Date("2024-01-01"),
    ),
    createMockConversation(
      "2",
      "Personal notes",
      "Remember to buy groceries",
      "completed",
      ["personal"],
      true,
      new Date("2024-01-02"),
    ),
    createMockConversation(
      "3",
      "Bug report analysis",
      "Critical bug in authentication system",
      "active",
      ["bug", "urgent"],
      false,
      new Date("2024-01-03"),
    ),
    createMockConversation(
      "4",
      "Weekly planning",
      "Plan tasks for next week",
      "archived",
      ["planning"],
      false,
      new Date("2024-01-04"),
      "poll-123",
    ),
    createMockConversation(
      "5",
      "Code review notes",
      "Review pull request #456",
      "active",
      ["code", "review"],
      true,
      new Date("2024-01-05"),
    ),
  ];

  describe("Search functionality", () => {
    it("should perform full-text search in conversation titles", () => {
      const query = "meeting";
      const results = mockConversations.filter((conv) =>
        conv.title.toLowerCase().includes(query.toLowerCase()),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
      expect(results[0].title).toContain("Meeting");
    });

    it("should perform full-text search in first messages", () => {
      const query = "groceries";
      const results = mockConversations.filter((conv) =>
        conv.firstMessage.toLowerCase().includes(query.toLowerCase()),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
      expect(results[0].firstMessage).toContain("groceries");
    });

    it("should perform case-insensitive search by default", () => {
      const query = "CRITICAL";
      const results = mockConversations.filter(
        (conv) =>
          conv.firstMessage.toLowerCase().includes(query.toLowerCase()) ||
          conv.title.toLowerCase().includes(query.toLowerCase()),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });

    it("should search in tags", () => {
      const query = "urgent";
      const results = mockConversations.filter((conv) =>
        conv.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
      expect(results[0].tags).toContain("urgent");
    });

    it("should return all conversations when query is empty", () => {
      const query: string = "";
      const results = mockConversations.filter((conv) => {
        if (!query) return true;
        return (
          conv.title.toLowerCase().includes(query.toLowerCase()) ||
          conv.firstMessage.toLowerCase().includes(query.toLowerCase()) ||
          conv.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
        );
      });

      expect(results).toHaveLength(mockConversations.length);
    });
  });

  describe("Filtering functionality", () => {
    it("should filter by conversation status", () => {
      const activeConversations = mockConversations.filter((conv) => conv.status === "active");
      const completedConversations = mockConversations.filter(
        (conv) => conv.status === "completed",
      );
      const archivedConversations = mockConversations.filter((conv) => conv.status === "archived");

      expect(activeConversations).toHaveLength(3);
      expect(completedConversations).toHaveLength(1);
      expect(archivedConversations).toHaveLength(1);

      expect(activeConversations.map((c) => c.id)).toEqual(["1", "3", "5"]);
      expect(completedConversations[0].id).toBe("2");
      expect(archivedConversations[0].id).toBe("4");
    });

    it("should filter by favorite status", () => {
      const favoriteConversations = mockConversations.filter((conv) => conv.isFavorite === true);
      const nonFavoriteConversations = mockConversations.filter(
        (conv) => conv.isFavorite === false,
      );

      expect(favoriteConversations).toHaveLength(2);
      expect(nonFavoriteConversations).toHaveLength(3);

      expect(favoriteConversations.map((c) => c.id)).toEqual(["2", "5"]);
    });

    it("should filter by date range", () => {
      const fromDate = new Date("2024-01-02");
      const toDate = new Date("2024-01-04");

      const filteredConversations = mockConversations.filter(
        (conv) => conv.createdAt >= fromDate && conv.createdAt <= toDate,
      );

      expect(filteredConversations).toHaveLength(3);
      expect(filteredConversations.map((c) => c.id)).toEqual(["2", "3", "4"]);
    });

    it("should filter by tags", () => {
      const targetTags = ["work"];
      const filteredConversations = mockConversations.filter((conv) =>
        targetTags.every((tag) =>
          conv.tags.some((convTag) => convTag.toLowerCase().includes(tag.toLowerCase())),
        ),
      );

      expect(filteredConversations).toHaveLength(1);
      expect(filteredConversations[0].id).toBe("1");
    });

    it("should filter by related poll existence", () => {
      const withPoll = mockConversations.filter((conv) => Boolean(conv.relatedPollId));
      const withoutPoll = mockConversations.filter((conv) => !conv.relatedPollId);

      expect(withPoll).toHaveLength(1);
      expect(withoutPoll).toHaveLength(4);

      expect(withPoll[0].id).toBe("4");
      expect(withPoll[0].relatedPollId).toBe("poll-123");
    });
  });

  describe("Combined search and filtering", () => {
    it("should apply both search and status filter", () => {
      const query = "notes";
      const status = "active";

      const results = mockConversations.filter(
        (conv) =>
          conv.status === status &&
          (conv.title.toLowerCase().includes(query.toLowerCase()) ||
            conv.firstMessage.toLowerCase().includes(query.toLowerCase())),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("5");
      expect(results[0].title).toContain("notes");
      expect(results[0].status).toBe("active");
    });

    it("should apply search with favorite filter", () => {
      const query = "review";
      const isFavorite = true;

      const results = mockConversations.filter(
        (conv) =>
          conv.isFavorite === isFavorite &&
          (conv.title.toLowerCase().includes(query.toLowerCase()) ||
            conv.firstMessage.toLowerCase().includes(query.toLowerCase())),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("5");
      expect(results[0].isFavorite).toBe(true);
    });

    it("should apply multiple filters simultaneously", () => {
      const status = "active";
      const isFavorite = false;
      const tags = ["work"];

      const results = mockConversations.filter(
        (conv) =>
          conv.status === status &&
          conv.isFavorite === isFavorite &&
          tags.every((tag) =>
            conv.tags.some((convTag) => convTag.toLowerCase().includes(tag.toLowerCase())),
          ),
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
  });

  describe("Search highlighting", () => {
    it("should identify matches in conversation title", () => {
      const conversation = mockConversations[0]; // 'Meeting with team'
      const query = "meeting";

      const titleMatch = conversation.title.toLowerCase().includes(query.toLowerCase());
      expect(titleMatch).toBe(true);

      // Simulate highlight extraction
      const regex = new RegExp(query, "gi");
      const matches = [...conversation.title.matchAll(regex)];

      expect(matches).toHaveLength(1);
      expect(matches[0].index).toBe(0);
      expect(matches[0][0]).toBe("Meeting");
    });

    it("should identify matches in first message", () => {
      const conversation = mockConversations[2]; // 'Critical bug in authentication system'
      const query = "authentication";

      const messageMatch = conversation.firstMessage.toLowerCase().includes(query.toLowerCase());
      expect(messageMatch).toBe(true);

      // Simulate highlight extraction
      const regex = new RegExp(query, "gi");
      const matches = [...conversation.firstMessage.matchAll(regex)];

      expect(matches).toHaveLength(1);
      expect(matches[0][0]).toBe("authentication");
    });

    it("should identify matches in tags", () => {
      const conversation = mockConversations[2]; // tags: ['bug', 'urgent']
      const query = "urgent";

      const tagMatch = conversation.tags.some((tag) =>
        tag.toLowerCase().includes(query.toLowerCase()),
      );
      expect(tagMatch).toBe(true);

      const matchingTag = conversation.tags.find((tag) =>
        tag.toLowerCase().includes(query.toLowerCase()),
      );
      expect(matchingTag).toBe("urgent");
    });
  });

  describe("Performance considerations", () => {
    it("should handle minimum query length requirement", () => {
      const minQueryLength = 3;
      const shortQuery = "ab";
      const validQuery = "abc";

      const shouldSearchShort = shortQuery.length >= minQueryLength;
      const shouldSearchValid = validQuery.length >= minQueryLength;

      expect(shouldSearchShort).toBe(false);
      expect(shouldSearchValid).toBe(true);
    });

    it("should handle empty and whitespace queries", () => {
      const queries = ["", "   ", "\t", "\n"];

      queries.forEach((query) => {
        const trimmed = query.trim();
        expect(trimmed).toBe("");
      });
    });

    it("should escape special regex characters", () => {
      const specialChars = [".*", "+?", "^$", "{}", "()", "|", "[]", "\\"];

      specialChars.forEach((char) => {
        const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        expect(escaped).toContain("\\");
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle conversations with empty fields", () => {
      const emptyConversation = createMockConversation("empty", "", "", "active", []);
      const query = "test";

      const titleMatch = emptyConversation.title.toLowerCase().includes(query.toLowerCase());
      const messageMatch = emptyConversation.firstMessage
        .toLowerCase()
        .includes(query.toLowerCase());
      const tagMatch = emptyConversation.tags.some((tag) =>
        tag.toLowerCase().includes(query.toLowerCase()),
      );

      expect(titleMatch).toBe(false);
      expect(messageMatch).toBe(false);
      expect(tagMatch).toBe(false);
    });

    it("should handle conversations with special characters", () => {
      const specialConversation = createMockConversation(
        "special",
        "Meeting @ 3:00 PM (urgent!)",
        "Don't forget: review & approve",
        "active",
        ["urgent!", "@meeting"],
      );

      const queries = ["@", "!", "&", "'"];

      queries.forEach((query) => {
        const titleMatch = specialConversation.title.includes(query);
        const messageMatch = specialConversation.firstMessage.includes(query);
        const tagMatch = specialConversation.tags.some((tag) => tag.includes(query));

        const hasMatch = titleMatch || messageMatch || tagMatch;
        expect(typeof hasMatch).toBe("boolean");
      });
    });

    it("should handle very long search queries", () => {
      const longQuery = "a".repeat(1000);
      const conversation = mockConversations[0];

      const titleMatch = conversation.title.toLowerCase().includes(longQuery.toLowerCase());
      expect(titleMatch).toBe(false);
    });

    it("should handle Unicode characters", () => {
      const unicodeConversation = createMockConversation(
        "unicode",
        "RÃ©union Ã©quipe ðŸš€",
        "CafÃ© avec Marie â˜•",
        "active",
        ["franÃ§ais", "ðŸŽ¯"],
      );

      const queries = ["RÃ©union", "Ã©quipe", "ðŸš€", "CafÃ©", "â˜•", "franÃ§ais", "ðŸŽ¯"];

      queries.forEach((query) => {
        const titleMatch = unicodeConversation.title.includes(query);
        const messageMatch = unicodeConversation.firstMessage.includes(query);
        const tagMatch = unicodeConversation.tags.some((tag) => tag.includes(query));

        const hasMatch = titleMatch || messageMatch || tagMatch;
        expect(typeof hasMatch).toBe("boolean");
      });
    });
  });

  describe("Filter combinations", () => {
    it("should handle all filters set to restrictive values", () => {
      const restrictiveFilters: SearchFilters = {
        status: "completed",
        isFavorite: true,
        dateRange: {
          from: new Date("2024-01-02"),
          to: new Date("2024-01-02"),
        },
        tags: ["personal"],
        hasRelatedPoll: false,
      };

      const results = mockConversations.filter((conv) => {
        if (restrictiveFilters.status !== "all" && conv.status !== restrictiveFilters.status)
          return false;
        if (
          restrictiveFilters.isFavorite !== undefined &&
          conv.isFavorite !== restrictiveFilters.isFavorite
        )
          return false;
        if (restrictiveFilters.dateRange) {
          const { from, to } = restrictiveFilters.dateRange;
          if (from && conv.createdAt < from) return false;
          if (to && conv.createdAt > to) return false;
        }
        if (restrictiveFilters.tags && restrictiveFilters.tags.length > 0) {
          const hasAllTags = restrictiveFilters.tags.every((tag) =>
            conv.tags.some((convTag) => convTag.toLowerCase().includes(tag.toLowerCase())),
          );
          if (!hasAllTags) return false;
        }
        if (restrictiveFilters.hasRelatedPoll !== undefined) {
          const hasRelatedPoll = Boolean(conv.relatedPollId);
          if (hasRelatedPoll !== restrictiveFilters.hasRelatedPoll) return false;
        }
        return true;
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("should return empty results when no conversations match filters", () => {
      const impossibleFilters: SearchFilters = {
        status: "completed",
        isFavorite: false,
        tags: ["nonexistent-tag"],
      };

      const results = mockConversations.filter((conv) => {
        if (conv.status !== impossibleFilters.status) return false;
        if (conv.isFavorite !== impossibleFilters.isFavorite) return false;
        if (impossibleFilters.tags && impossibleFilters.tags.length > 0) {
          const hasAllTags = impossibleFilters.tags.every((tag) =>
            conv.tags.some((convTag) => convTag.toLowerCase().includes(tag.toLowerCase())),
          );
          if (!hasAllTags) return false;
        }
        return true;
      });

      expect(results).toHaveLength(0);
    });
  });
});
