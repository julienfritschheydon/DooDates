/**
 * Test de génération de titre - Scénario réel utilisateur
 *
 * Test simple qui simule le parcours utilisateur :
 * 1. Créer conversation
 * 2. Envoyer 2 messages
 * 3. Créer sondage
 * 4. Vérifier titre généré
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";
import * as ConversationStorage from "../../lib/storage/ConversationStorageSimple";
import { generateConversationTitle } from "../../lib/services/titleGeneration";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../lib/storage/ConversationStorageSimple", () => ({
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  getConversations: vi.fn(),
  saveConversations: vi.fn(),
  addMessages: vi.fn(),
  getMessages: vi.fn(() => []),
  getConversationWithMessages: vi.fn(),
}));

vi.mock("../../lib/services/titleGeneration", () => ({
  generateConversationTitle: vi.fn(),
  shouldRegenerateTitle: vi.fn(() => true),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-123" },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: any) => children,
}));

const mockCreateConversation = ConversationStorage.createConversation as any;
const mockGetConversation = ConversationStorage.getConversation as any;
const mockGetConversations = ConversationStorage.getConversations as any;
const mockGetMessages = ConversationStorage.getMessages as any;
const mockSaveConversations = ConversationStorage.saveConversations as any;
const mockGenerateTitle = generateConversationTitle as any;

// ============================================================================
// HELPERS
// ============================================================================

import {
  createMockConversation as createBaseConversation,
  createMockAutoSaveMessage,
} from "../../__tests__/helpers/testHelpers";

const createMockConversation = (title = "Conversation du 15/10/2024") =>
  createBaseConversation({
    id: "conv-123",
    title,
    userId: "test-user-123",
  });

const createMockMessage = (content: string, isAI = false) => ({
  ...createMockAutoSaveMessage({ content, isAI }),
  pollSuggestion: isAI
    ? {
        type: "date-poll" as const,
        title: "Réunion équipe",
        dates: ["2024-10-20", "2024-10-21"],
      }
    : undefined,
});

// ============================================================================
// TEST
// ============================================================================

describe("useAutoSave - Génération de Titre (Scénario Réel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Use real timers for debounce

    // Setup mocks
    const conversation = createMockConversation("Conversation du 15/10/2024"); // Auto-generated title
    mockCreateConversation.mockReturnValue(conversation);
    mockGetConversation.mockReturnValue(conversation);
    mockGetConversations.mockReturnValue([conversation]);
    mockGetMessages.mockReturnValue([]); // Start with empty messages

    mockGenerateTitle.mockReturnValue({
      success: true,
      title: "Planification réunion équipe",
      sourceMessages: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devrait générer un titre après création de sondage", async () => {
    const { result } = renderHook(() => useAutoSave());
    const conversation = createMockConversation("Conversation du 15/10/2024");
    const createdConversation = { ...conversation, id: "conv-123" };

    // Mock getConversation to return conversation
    mockGetConversation.mockImplementation((id: string) => {
      if (id === "conv-123" || id.startsWith("temp-")) {
        return createdConversation;
      }
      return null;
    });

    // Track messages as they're added
    const messages: any[] = [];
    mockGetMessages.mockImplementation(() => [...messages]);

    // 1. Créer conversation
    await act(async () => {
      await result.current.startNewConversation();
    });

    // 2. Envoyer 1er message utilisateur
    const message1 = createMockMessage("Crée un sondage pour une réunion");
    await act(async () => {
      await result.current.addMessage(message1);
      messages.push({
        id: message1.id,
        conversationId: "conv-123",
        role: "user",
        content: message1.content,
        timestamp: message1.timestamp,
      });
    });

    // 3. Envoyer 2e message (réponse IA avec sondage)
    const message2 = createMockMessage("Voici le sondage pour la réunion", true);
    await act(async () => {
      await result.current.addMessage(message2);
      messages.push({
        id: message2.id,
        conversationId: "conv-123",
        role: "assistant",
        content: message2.content,
        timestamp: message2.timestamp,
      });
    });

    // 4. Attendre que la génération de titre soit appelée (debounce 1.5s + marge)
    await waitFor(
      () => {
        expect(mockGenerateTitle).toHaveBeenCalled();
      },
      { timeout: 2000 }, // 1.5s debounce + marge
    );

    // 5. Vérifier que saveConversations a été appelé avec le nouveau titre
    await waitFor(
      () => {
        expect(mockSaveConversations).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              title: "Planification réunion équipe",
            }),
          ]),
        );
      },
      { timeout: 1000 },
    );
  }, 10000); // Timeout de 10s pour ce test
});
