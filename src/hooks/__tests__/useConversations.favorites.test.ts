/**
 * Tests unitaires pour le tri des favoris dans useConversations
 * Vérifie le tri par favoris, favorite_rank et réordonnancement
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useConversations } from "../useConversations";
import * as ConversationStorage from "../../lib/storage/ConversationStorageSimple";
import * as ConversationStorageSupabase from "../../lib/storage/ConversationStorageSupabase";
import { useAuth } from "../../contexts/AuthContext";
import { Conversation } from "../../types/conversation";
import {
  createQueryWrapper,
  createMockConversation as createBaseConversation,
  createMockUser,
} from "../../__tests__/helpers/testHelpers";

// Mock dependencies
vi.mock("../../lib/storage/ConversationStorageSimple");
vi.mock("../../contexts/AuthContext");

// Mock ConversationStorageSupabase pour éviter les imports dynamiques qui échouent
vi.mock("../../lib/storage/ConversationStorageSupabase", () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
  getMessages: vi.fn(),
  saveMessages: vi.fn(),
  addMessages: vi.fn(),
  deleteMessages: vi.fn(),
  getConversationWithMessages: vi.fn(),
}));

const mockConversationStorage = vi.mocked(ConversationStorage);
const mockConversationStorageSupabase = vi.mocked(ConversationStorageSupabase);
const mockUseAuth = vi.mocked(useAuth);

// Mock conversations data avec helper
const createMockConversation = (
  id: string,
  title: string,
  isFavorite: boolean = false,
  favorite_rank?: number,
  updatedAt: Date = new Date(),
): Conversation =>
  createBaseConversation({
    id,
    title,
    updatedAt,
    firstMessage: `Premier message de ${title}`,
    isFavorite,
    favorite_rank,
    userId: "test-user",
  });

describe("useConversations - Favorites Sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ConversationStorage methods (localStorage)
    mockConversationStorage.getConversations.mockReturnValue([]);
    mockConversationStorage.getConversation.mockReturnValue(null);
    mockConversationStorage.getMessages.mockReturnValue([]);
    mockConversationStorage.createConversation.mockImplementation((data) => data as any);
    mockConversationStorage.updateConversation.mockImplementation((conv) => conv);
    mockConversationStorage.deleteConversation.mockImplementation(() => {});
    mockConversationStorage.addMessages.mockImplementation(() => {});

    // Mock ConversationStorageSupabase (faire échouer pour forcer localStorage)
    // C'est le comportement attendu : fallback vers localStorage si Supabase échoue
    mockConversationStorageSupabase.getConversations.mockRejectedValue(new Error("Storage error"));
    mockConversationStorageSupabase.getConversation.mockRejectedValue(new Error("Storage error"));
    mockConversationStorageSupabase.getMessages.mockRejectedValue(new Error("Storage error"));
    mockConversationStorageSupabase.createConversation.mockResolvedValue({} as any);
    mockConversationStorageSupabase.updateConversation.mockResolvedValue({} as any);
    mockConversationStorageSupabase.deleteConversation.mockResolvedValue(undefined);
    mockConversationStorageSupabase.addMessages.mockResolvedValue(undefined);
    mockConversationStorageSupabase.getConversationWithMessages.mockRejectedValue(
      new Error("Storage error"),
    );

    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: createMockUser({ id: "test-user" }),
      profile: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  describe("Tri par favoris", () => {
    it("should place favorites at the top of the list", async () => {
      const conversations = [
        createMockConversation(
          "conv1",
          "Conversation normale 1",
          false,
          undefined,
          new Date("2024-01-03"),
        ),
        createMockConversation("conv2", "Conversation favorite", true, 1, new Date("2024-01-01")),
        createMockConversation(
          "conv3",
          "Conversation normale 2",
          false,
          undefined,
          new Date("2024-01-02"),
        ),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Le favori doit être en premier malgré une date plus ancienne
      expect(sortedConversations[0].id).toBe("conv2");
      expect(sortedConversations[0].isFavorite).toBe(true);

      // Les non-favoris suivent, triés par activité (updatedAt desc)
      expect(sortedConversations[1].id).toBe("conv1");
      expect(sortedConversations[2].id).toBe("conv3");
    });

    it("should sort favorites by favorite_rank", async () => {
      const conversations = [
        createMockConversation("conv1", "Favori rang 3", true, 3),
        createMockConversation("conv2", "Favori rang 1", true, 1),
        createMockConversation("conv3", "Favori rang 2", true, 2),
        createMockConversation("conv4", "Non favori", false),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Vérifier l'ordre des favoris par rang
      expect(sortedConversations[0].id).toBe("conv2"); // rang 1
      expect(sortedConversations[1].id).toBe("conv3"); // rang 2
      expect(sortedConversations[2].id).toBe("conv1"); // rang 3
      expect(sortedConversations[3].id).toBe("conv4"); // non favori
    });

    it("should handle favorites without favorite_rank", async () => {
      const conversations = [
        createMockConversation("conv1", "Favori avec rang", true, 1),
        createMockConversation(
          "conv2",
          "Favori sans rang",
          true,
          undefined,
          new Date("2024-01-02"),
        ),
        createMockConversation(
          "conv3",
          "Autre favori sans rang",
          true,
          undefined,
          new Date("2024-01-01"),
        ),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Favori avec rang en premier
      expect(sortedConversations[0].id).toBe("conv1");

      // Favoris sans rang triés par updatedAt (plus récent en premier)
      expect(sortedConversations[1].id).toBe("conv2");
      expect(sortedConversations[2].id).toBe("conv3");
    });
  });

  describe("Tri par activité pour non-favoris", () => {
    it("should sort non-favorites by activity (updatedAt + messageCount)", async () => {
      const baseDate = new Date("2024-01-01");
      const conversations = [
        createMockConversation(
          "conv1",
          "Ancienne avec peu de messages",
          false,
          undefined,
          baseDate,
        ),
        createMockConversation(
          "conv2",
          "Récente avec peu de messages",
          false,
          undefined,
          new Date("2024-01-03"),
        ),
        createMockConversation(
          "conv3",
          "Ancienne avec beaucoup de messages",
          false,
          undefined,
          baseDate,
        ),
      ];

      // Modifier messageCount pour conv3
      conversations[2].messageCount = 10;

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // L'ordre dépend du score d'activité (updatedAt + bonus messages)
      // conv2 (récente) devrait être avant conv1 (ancienne, peu de messages)
      expect(sortedConversations[0].id).toBe("conv2");
    });
  });

  describe("Réordonnancement des favoris", () => {
    it("should automatically assign favorite_rank when marking as favorite", async () => {
      const conversations = [
        createMockConversation("conv1", "Favori existant", true, 1),
        createMockConversation("conv2", "À marquer favori", false),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);
      mockConversationStorage.getConversation.mockReturnValue(conversations[1]);
      mockConversationStorage.updateConversation.mockImplementation((conv) => conv);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Marquer conv2 comme favori
      await act(async () => {
        result.current.updateConversation.mutate({
          id: "conv2",
          updates: { isFavorite: true },
        });
      });

      // Vérifier que updateConversation a été appelé avec favorite_rank = 2
      expect(mockConversationStorage.updateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "conv2",
          isFavorite: true,
          favorite_rank: 2,
        }),
      );
    });

    it("should remove favorite_rank when unmarking as favorite", async () => {
      const conversations = [createMockConversation("conv1", "Favori à retirer", true, 1)];

      mockConversationStorage.getConversations.mockReturnValue(conversations);
      mockConversationStorage.getConversation.mockReturnValue(conversations[0]);
      mockConversationStorage.updateConversation.mockImplementation((conv) => conv);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Retirer conv1 des favoris
      await act(async () => {
        result.current.updateConversation.mutate({
          id: "conv1",
          updates: { isFavorite: false },
        });
      });

      // Vérifier que favorite_rank a été supprimé
      expect(mockConversationStorage.updateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "conv1",
          isFavorite: false,
          favorite_rank: undefined,
        }),
      );
    });

    it("should allow manual reordering of favorites", async () => {
      const conversations = [
        createMockConversation("conv1", "Favori 1", true, 1),
        createMockConversation("conv2", "Favori 2", true, 2),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);
      mockConversationStorage.updateConversation.mockImplementation((conv) => conv);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Réordonner conv2 au rang 1
      await act(async () => {
        result.current.reorderFavorite("conv2", 1);
      });

      // Vérifier que la conversation a été mise à jour avec le nouveau rang
      expect(mockConversationStorage.updateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "conv2",
          favorite_rank: 1,
        }),
      );
    });
  });

  describe("Configuration du tri", () => {
    it("should respect sortBy configuration for non-favorites", async () => {
      const conversations = [
        createMockConversation("conv1", "B - Titre", false, undefined, new Date("2024-01-02")),
        createMockConversation("conv2", "A - Titre", false, undefined, new Date("2024-01-01")),
        createMockConversation("conv3", "Favori", true, 1, new Date("2024-01-01")),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(
        () =>
          useConversations({
            sortBy: "title",
            sortOrder: "asc",
          }),
        {
          wrapper: createQueryWrapper(),
        },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Favori toujours en premier
      expect(sortedConversations[0].id).toBe("conv3");

      // Non-favoris triés par titre (A avant B)
      expect(sortedConversations[1].id).toBe("conv2"); // A - Titre
      expect(sortedConversations[2].id).toBe("conv1"); // B - Titre
    });

    it("should use activity sorting when sortBy is updatedAt", async () => {
      const conversations = [
        createMockConversation("conv1", "Ancienne", false, undefined, new Date("2024-01-01")),
        createMockConversation("conv2", "Récente", false, undefined, new Date("2024-01-02")),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(
        () =>
          useConversations({
            sortBy: "updatedAt",
            sortOrder: "desc",
          }),
        {
          wrapper: createQueryWrapper(),
        },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Plus récente en premier (tri par activité)
      expect(sortedConversations[0].id).toBe("conv2");
      expect(sortedConversations[1].id).toBe("conv1");
    });
  });

  describe("Vérifications de cohérence", () => {
    it("should maintain favorites at top regardless of other sorting", async () => {
      const conversations = [
        createMockConversation(
          "conv1",
          "Z - Non favori récent",
          false,
          undefined,
          new Date("2024-01-03"),
        ),
        createMockConversation("conv2", "A - Favori ancien", true, 1, new Date("2024-01-01")),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(
        () =>
          useConversations({
            sortBy: "title",
            sortOrder: "asc",
          }),
        {
          wrapper: createQueryWrapper(),
        },
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Favori toujours en premier malgré le tri par titre
      expect(sortedConversations[0].id).toBe("conv2");
      expect(sortedConversations[0].isFavorite).toBe(true);
      expect(sortedConversations[1].id).toBe("conv1");
    });

    it("should handle empty favorite_rank gracefully", async () => {
      const conversations = [
        createMockConversation(
          "conv1",
          "Favori sans rang 1",
          true,
          undefined,
          new Date("2024-01-02"),
        ),
        createMockConversation(
          "conv2",
          "Favori sans rang 2",
          true,
          undefined,
          new Date("2024-01-01"),
        ),
        createMockConversation("conv3", "Favori avec rang", true, 1, new Date("2024-01-01")),
      ];

      mockConversationStorage.getConversations.mockReturnValue(conversations);

      const { result } = renderHook(() => useConversations(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const sortedConversations = result.current.conversations.conversations;

      // Favori avec rang en premier
      expect(sortedConversations[0].id).toBe("conv3");

      // Favoris sans rang triés par updatedAt
      expect(sortedConversations[1].id).toBe("conv1"); // plus récent
      expect(sortedConversations[2].id).toBe("conv2"); // plus ancien
    });
  });
});
