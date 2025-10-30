/**
 * Test Helpers - Helpers communs pour tous les tests
 * Réduit la duplication de code dans les tests
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import type {
  Conversation,
  ConversationMessage,
  ConversationMetadata,
} from "../../types/conversation";

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Crée un User Supabase mocké
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

/**
 * Crée une Conversation mockée
 */
export const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: "conv-1",
  title: "Test Conversation",
  status: "active",
  createdAt: new Date("2024-01-01T10:00:00Z"),
  updatedAt: new Date("2024-01-01T10:00:00Z"),
  firstMessage: "Hello world",
  messageCount: 2,
  isFavorite: false,
  tags: ["test"],
  metadata: {
    pollGenerated: false,
    errorOccurred: false,
    aiModel: "gemini-pro",
    language: "en" as const,
    userAgent: "test-agent",
  },
  ...overrides,
});

/**
 * Crée un ConversationMessage mocké
 */
export const createMockMessage = (
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage => ({
  id: "msg-1",
  conversationId: "conv-123",
  content: "Test message content",
  role: "user",
  timestamp: new Date("2024-01-01T10:00:00Z"),
  ...overrides,
});

/**
 * Crée un message pour useAutoSave (format simplifié)
 */
export const createMockAutoSaveMessage = (overrides: any = {}) => ({
  id: "msg-1",
  content: "Test message content",
  isAI: false,
  timestamp: new Date("2024-01-01T10:00:00Z"),
  ...overrides,
});

/**
 * Crée plusieurs conversations mockées
 */
export const createMockConversations = (count: number): Conversation[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockConversation({
      id: `conv-${i + 1}`,
      title: `Test Conversation ${i + 1}`,
      messageCount: i + 1,
      createdAt: new Date(`2024-01-0${i + 1}T10:00:00Z`),
      updatedAt: new Date(`2024-01-0${i + 1}T10:00:00Z`),
    }),
  );
};

/**
 * Crée plusieurs messages mockés
 */
export const createMockMessages = (
  conversationId: string,
  count: number,
): ConversationMessage[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockMessage({
      id: `msg-${i + 1}`,
      conversationId,
      content: `Message ${i + 1}`,
      role: i % 2 === 0 ? "user" : "assistant",
      timestamp: new Date(`2024-01-01T10:${String(i).padStart(2, "0")}:00Z`),
    }),
  );
};

// ============================================================================
// REACT QUERY HELPERS
// ============================================================================

/**
 * Crée un QueryClient configuré pour les tests
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Pas de cache entre les tests
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Crée un wrapper QueryClientProvider pour les tests hooks
 */
export const createQueryWrapper = () => {
  const queryClient = createTestQueryClient();

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// ============================================================================
// LOCALSTORAGE MOCK
// ============================================================================

/**
 * Crée un localStorage en mémoire pour les tests
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
};

/**
 * Configure un localStorage mocké dans window
 */
export const setupMockLocalStorage = () => {
  const mockStorage = createMockLocalStorage();

  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    configurable: true,
    writable: true,
  });

  return mockStorage;
};

// ============================================================================
// AUTH MOCKS
// ============================================================================

/**
 * Mock de base pour useAuth (non authentifié)
 */
export const createMockAuthGuest = () => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

/**
 * Mock pour useAuth (authentifié)
 */
export const createMockAuthAuthenticated = (user?: Partial<User>) => ({
  user: createMockUser(user),
  isAuthenticated: true,
  isLoading: false,
});

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Crée une date ISO pour les tests
 */
export const createTestDate = (offset: number = 0): Date => {
  const base = new Date("2024-01-01T10:00:00Z");
  base.setDate(base.getDate() + offset);
  return base;
};

/**
 * Crée une date ISO string pour les tests
 */
export const createTestDateString = (offset: number = 0): string => {
  return createTestDate(offset).toISOString();
};

// ============================================================================
// POLL HELPERS
// ============================================================================

/**
 * Crée des données de poll mockées
 */
export const createMockPollData = (overrides: any = {}) => ({
  title: "Réunion produit",
  description: "Discussion sur le nouveau produit",
  selectedDates: ["2025-09-01", "2025-09-02"],
  timeSlotsByDate: {
    "2025-09-01": [
      { hour: 9, minute: 0, enabled: true },
      { hour: 10, minute: 0, enabled: true },
    ],
    "2025-09-02": [
      { hour: 14, minute: 0, enabled: true },
      { hour: 15, minute: 0, enabled: true },
    ],
  },
  participantEmails: [],
  settings: {
    timeGranularity: 30,
    allowAnonymousVotes: true,
    allowMaybeVotes: true,
    sendNotifications: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  ...overrides,
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Attend que toutes les promesses soient résolues
 */
export const flushPromises = () => {
  return new Promise((resolve) => setImmediate(resolve));
};

/**
 * Crée un délai pour les tests
 */
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock de console pour capturer les logs
 */
export const createConsoleMock = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  return {
    log: (...args: any[]) => logs.push(args.join(" ")),
    error: (...args: any[]) => errors.push(args.join(" ")),
    warn: (...args: any[]) => warnings.push(args.join(" ")),
    getLogs: () => logs,
    getErrors: () => errors,
    getWarnings: () => warnings,
    clear: () => {
      logs.length = 0;
      errors.length = 0;
      warnings.length = 0;
    },
  };
};
