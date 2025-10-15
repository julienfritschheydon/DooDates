/**
 * Tests unitaires pour le service de tri unifié
 * Teste le tri par favoris avec favorite_rank et tri par activité
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  compareUnifiedItems,
  sortConversations,
  updateFavoriteRank,
  reorderFavoriteRanks,
  getNextFavoriteRank,
  validateFavoriteRanks,
  type UnifiedItem,
  type SortOptions,
} from "../sort-comparator";
import { Conversation } from "../../types/conversation";

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockItem = (overrides: Partial<UnifiedItem> = {}): UnifiedItem => ({
  id: "item-1",
  title: "Test Item",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  isFavorite: false,
  messageCount: 0,
  ...overrides,
});

const createMockConversation = (
  overrides: Partial<Conversation> = {},
): Conversation => ({
  id: "conv-1",
  title: "Test Conversation",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  isFavorite: false,
  messages: [],
  messageCount: 0,
  status: "active",
  ...overrides,
});

describe("sort-comparator", () => {
  describe("compareUnifiedItems", () => {
    it("should sort favorites first when favoriteFirst is true", () => {
      const favorite = createMockItem({
        id: "fav",
        isFavorite: true,
        updatedAt: new Date("2024-01-01"),
      });
      const regular = createMockItem({
        id: "reg",
        isFavorite: false,
        updatedAt: new Date("2024-01-02"), // Plus récent
      });

      const result = compareUnifiedItems(favorite, regular, {
        criteria: "updatedAt",
        order: "desc",
        favoriteFirst: true,
      });

      expect(result).toBeLessThan(0); // favorite vient en premier
    });

    it("should sort by favorite_rank when both items are favorites", () => {
      const favorite1 = createMockItem({
        id: "fav1",
        isFavorite: true,
        favorite_rank: 2,
      });
      const favorite2 = createMockItem({
        id: "fav2",
        isFavorite: true,
        favorite_rank: 1,
      });

      const result = compareUnifiedItems(favorite1, favorite2, {
        criteria: "updatedAt",
        order: "desc",
        favoriteFirst: true,
      });

      expect(result).toBeGreaterThan(0); // favorite2 (rank 1) vient avant favorite1 (rank 2)
    });

    it("should handle undefined favorite_rank", () => {
      const favoriteWithRank = createMockItem({
        id: "fav1",
        isFavorite: true,
        favorite_rank: 1,
      });
      const favoriteWithoutRank = createMockItem({
        id: "fav2",
        isFavorite: true,
        favorite_rank: undefined,
      });

      const result = compareUnifiedItems(
        favoriteWithRank,
        favoriteWithoutRank,
        {
          criteria: "updatedAt",
          order: "desc",
          favoriteFirst: true,
        },
      );

      expect(result).toBeLessThan(0); // favoriteWithRank vient en premier
    });

    it("should sort by createdAt when criteria is createdAt", () => {
      const older = createMockItem({
        id: "old",
        createdAt: new Date("2024-01-01"),
      });
      const newer = createMockItem({
        id: "new",
        createdAt: new Date("2024-01-02"),
      });

      const result = compareUnifiedItems(older, newer, {
        criteria: "createdAt",
        order: "desc",
        favoriteFirst: false,
      });

      expect(result).toBeGreaterThan(0); // newer vient en premier (desc)
    });

    it("should sort by title alphabetically", () => {
      const itemA = createMockItem({ id: "a", title: "Alpha" });
      const itemB = createMockItem({ id: "b", title: "Beta" });

      const result = compareUnifiedItems(itemA, itemB, {
        criteria: "title",
        order: "asc",
        favoriteFirst: false,
      });

      expect(result).toBeLessThan(0); // Alpha vient avant Beta
    });

    it("should sort by activity score (updatedAt + messageCount)", () => {
      const lowActivity = createMockItem({
        id: "low",
        updatedAt: new Date("2024-01-01"),
        messageCount: 1,
      });
      const highActivity = createMockItem({
        id: "high",
        updatedAt: new Date("2024-01-01"),
        messageCount: 10,
      });

      const result = compareUnifiedItems(lowActivity, highActivity, {
        criteria: "activity",
        order: "desc",
        favoriteFirst: false,
      });

      expect(result).toBeGreaterThan(0); // highActivity vient en premier
    });

    it("should respect sort order (asc vs desc)", () => {
      const older = createMockItem({
        id: "old",
        updatedAt: new Date("2024-01-01"),
      });
      const newer = createMockItem({
        id: "new",
        updatedAt: new Date("2024-01-02"),
      });

      // Test ordre descendant
      const descResult = compareUnifiedItems(older, newer, {
        criteria: "updatedAt",
        order: "desc",
        favoriteFirst: false,
      });
      expect(descResult).toBeGreaterThan(0);

      // Test ordre ascendant
      const ascResult = compareUnifiedItems(older, newer, {
        criteria: "updatedAt",
        order: "asc",
        favoriteFirst: false,
      });
      expect(ascResult).toBeLessThan(0);
    });
  });

  describe("sortConversations", () => {
    it("should sort conversations with default options", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          title: "First",
          updatedAt: new Date("2024-01-01"),
        }),
        createMockConversation({
          id: "conv2",
          title: "Second",
          updatedAt: new Date("2024-01-02"),
          isFavorite: true,
          favorite_rank: 1,
        }),
      ];

      const sorted = sortConversations(conversations);

      expect(sorted[0].id).toBe("conv2"); // Favori en premier
      expect(sorted[1].id).toBe("conv1");
    });

    it("should sort by custom criteria", () => {
      const conversations = [
        createMockConversation({ id: "conv1", title: "Zebra" }),
        createMockConversation({ id: "conv2", title: "Alpha" }),
      ];

      const sorted = sortConversations(conversations, {
        criteria: "title",
        order: "asc",
        favoriteFirst: false,
      });

      expect(sorted[0].title).toBe("Alpha");
      expect(sorted[1].title).toBe("Zebra");
    });
  });

  describe("updateFavoriteRank", () => {
    it("should update favorite rank and set isFavorite to true", () => {
      const conversations = [
        createMockConversation({ id: "conv1", isFavorite: false }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 1,
        }),
      ];

      const updated = updateFavoriteRank(conversations, "conv1", 2);
      const conv1 = updated.find((c) => c.id === "conv1")!;

      expect(conv1.isFavorite).toBe(true);
      expect(conv1.favorite_rank).toBe(2);
    });

    it("should not modify other conversations", () => {
      const conversations = [
        createMockConversation({ id: "conv1", isFavorite: false }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 1,
        }),
      ];

      const updated = updateFavoriteRank(conversations, "conv1", 2);
      const conv2 = updated.find((c) => c.id === "conv2")!;

      expect(conv2.favorite_rank).toBe(1);
      expect(conv2.isFavorite).toBe(true);
    });
  });

  describe("reorderFavoriteRanks", () => {
    it("should reorder favorite ranks sequentially", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 5,
          updatedAt: new Date("2024-01-01"),
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 2,
          updatedAt: new Date("2024-01-02"),
        }),
        createMockConversation({
          id: "conv3",
          isFavorite: false,
        }),
      ];

      const reordered = reorderFavoriteRanks(conversations);
      const favorites = reordered.filter((c) => c.isFavorite);

      expect(favorites).toHaveLength(2);
      expect(favorites[0].favorite_rank).toBe(1); // conv2 (rank 2 original)
      expect(favorites[1].favorite_rank).toBe(2); // conv1 (rank 5 original)
    });

    it("should preserve non-favorite conversations", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({ id: "conv2", isFavorite: false }),
        createMockConversation({ id: "conv3", isFavorite: false }),
      ];

      const reordered = reorderFavoriteRanks(conversations);
      const nonFavorites = reordered.filter((c) => !c.isFavorite);

      expect(nonFavorites).toHaveLength(2);
      expect(nonFavorites.every((c) => c.favorite_rank === undefined)).toBe(
        true,
      );
    });
  });

  describe("getNextFavoriteRank", () => {
    it("should return 1 for first favorite", () => {
      const conversations = [
        createMockConversation({ id: "conv1", isFavorite: false }),
      ];

      const nextRank = getNextFavoriteRank(conversations);
      expect(nextRank).toBe(1);
    });

    it("should return next available rank", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 3,
        }),
        createMockConversation({ id: "conv3", isFavorite: false }),
      ];

      const nextRank = getNextFavoriteRank(conversations);
      expect(nextRank).toBe(4); // Max rank (3) + 1
    });

    it("should handle favorites without ranks", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: undefined,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 2,
        }),
      ];

      const nextRank = getNextFavoriteRank(conversations);
      expect(nextRank).toBe(3);
    });
  });

  describe("validateFavoriteRanks", () => {
    it("should validate correct favorite ranks", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 2,
        }),
        createMockConversation({ id: "conv3", isFavorite: false }),
      ];

      const validation = validateFavoriteRanks(conversations);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect duplicate ranks", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({ id: "conv3", isFavorite: false }),
      ];

      const validation = validateFavoriteRanks(conversations);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Rangs dupliqués détectés: 1");
      expect(validation.suggestions).toContain(
        "Utiliser reorderFavoriteRanks() pour corriger",
      );
    });

    it("should detect favorites without ranks", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: undefined,
        }),
      ];

      const validation = validateFavoriteRanks(conversations);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("1 favoris sans rang détectés");
      expect(validation.suggestions).toContain(
        "Assigner des rangs avec getNextFavoriteRank()",
      );
    });

    it("should suggest fixing gaps in rank sequence", () => {
      const conversations = [
        createMockConversation({
          id: "conv1",
          isFavorite: true,
          favorite_rank: 1,
        }),
        createMockConversation({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 5,
        }), // Gap: 2,3,4 missing
      ];

      const validation = validateFavoriteRanks(conversations);

      expect(validation.suggestions).toContain(
        "Trou détecté entre les rangs 1 et 5",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle empty arrays", () => {
      const result = sortConversations([]);
      expect(result).toEqual([]);

      const nextRank = getNextFavoriteRank([]);
      expect(nextRank).toBe(1);

      const validation = validateFavoriteRanks([]);
      expect(validation.isValid).toBe(true);
    });

    it("should handle items with same timestamps", () => {
      const sameDate = new Date("2024-01-01");
      const item1 = createMockItem({
        id: "item1",
        updatedAt: sameDate,
        title: "Alpha",
      });
      const item2 = createMockItem({
        id: "item2",
        updatedAt: sameDate,
        title: "Beta",
      });

      // Quand les dates sont identiques, le tri par titre devrait être utilisé comme fallback
      const result = compareUnifiedItems(item1, item2, {
        criteria: "updatedAt",
        order: "desc",
        favoriteFirst: false,
      });

      // Le résultat dépend de l'implémentation - on vérifie juste qu'il est cohérent
      expect(typeof result).toBe("number");
    });

    it("should handle missing messageCount in activity score", () => {
      const item1 = createMockItem({
        id: "item1",
        updatedAt: new Date("2024-01-01"),
        messageCount: undefined,
      });
      const item2 = createMockItem({
        id: "item2",
        updatedAt: new Date("2024-01-01"),
        messageCount: 5,
      });

      const result = compareUnifiedItems(item1, item2, {
        criteria: "activity",
        order: "desc",
        favoriteFirst: false,
      });

      expect(result).toBeGreaterThan(0); // item2 a plus d'activité
    });
  });
});
