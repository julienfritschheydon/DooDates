/**
 * Test isolé pour debugger resumeConversation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";
import * as ConversationStorage from "../../lib/storage/ConversationStorageSimple";

// Mock ConversationStorage
vi.mock("../../lib/storage/ConversationStorageSimple", () => ({
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  getConversations: vi.fn(),
  saveConversations: vi.fn(),
  addMessages: vi.fn(),
  getMessages: vi.fn(),
  getConversationWithMessages: vi.fn(),
}));

// Mock AuthContext
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-123" } }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock title generation
vi.mock("../../lib/services/titleGeneration", () => ({
  generateConversationTitle: vi.fn(),
  shouldRegenerateTitle: vi.fn(),
}));

const mockGetConversation = ConversationStorage.getConversation as any;
const mockGetConversationWithMessages = ConversationStorage.getConversationWithMessages as any;
const mockAddMessages = ConversationStorage.addMessages as any;
const mockGetMessages = ConversationStorage.getMessages as any;

import {
  createMockConversation,
  createMockMessage,
  createMockAutoSaveMessage,
} from "../../__tests__/helpers/testHelpers";

// Helper functions - using helpers
const createTestConversation = (overrides = {}) =>
  createMockConversation({
    id: "test-conv-123",
    userId: "test-user-123",
    ...overrides,
  });

const createMockConversationMessage = () =>
  createMockMessage({
    id: "msg-1",
    content: "Test message",
    conversationId: "test-conv-123",
  });

const createTestMessage = () =>
  createMockAutoSaveMessage({
    id: "msg-123",
    content: "Test message content",
  });

describe("useAutoSave - Tests Isolés (2, 9, 11, 12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getMessages to return empty array by default
    mockGetMessages.mockReturnValue([]);
  });

  it("TEST 2: should return null for non-existent conversation", async () => {
    const { result } = renderHook(() => useAutoSave());

    mockGetConversation.mockReturnValue(null);

    let resumedConversation: any;
    await act(async () => {
      resumedConversation = await result.current.resumeConversation("non-existent");
    });

    expect(resumedConversation).toBeNull();
  }, 10000);

  it("TEST 9: should return current conversation with messages", async () => {
    const { result } = renderHook(() => useAutoSave());
    const conversation = createTestConversation();
    const message = createTestMessage();

    mockGetConversation.mockReturnValue(conversation);
    mockGetConversationWithMessages.mockReturnValue({
      conversation,
      messages: [message],
    });

    await act(async () => {
      await result.current.resumeConversation(conversation.id);
    });

    let currentData: any;
    await act(async () => {
      currentData = await result.current.getCurrentConversation();
    });

    expect(currentData).toEqual({
      conversation,
      messages: [message],
    });
  }, 10000);

  it("TEST 11: should return real ID for permanent conversation", async () => {
    const { result } = renderHook(() => useAutoSave());
    const conversation = createTestConversation();

    mockGetConversation.mockReturnValue(conversation);

    await act(async () => {
      await result.current.resumeConversation(conversation.id);
    });

    expect(result.current.getRealConversationId()).toBe(conversation.id);
  }, 10000);

  it("TEST 12: should add message to existing conversation", async () => {
    const { result } = renderHook(() => useAutoSave());
    const conversation = createTestConversation();
    const message = createTestMessage();

    mockGetConversation.mockReturnValue(conversation);

    await act(async () => {
      await result.current.resumeConversation(conversation.id);
    });

    act(() => {
      result.current.addMessage(message);
    });

    expect(mockAddMessages).toHaveBeenCalledWith(
      conversation.id,
      expect.arrayContaining([
        expect.objectContaining({
          id: message.id,
          content: message.content,
          role: "user",
          conversationId: conversation.id,
        }),
      ]),
    );
  }, 10000);
});
