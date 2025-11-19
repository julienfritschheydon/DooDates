import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConversationService, type Message as ChatMessage } from "../ConversationService";
import type { Conversation, ConversationMessage } from "../../types/conversation";

// Helpers
const createConversationMessage = (
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage => ({
  id: overrides.id ?? "msg-1",
  conversationId: overrides.conversationId ?? "conv-1",
  role: overrides.role ?? "assistant",
  content: overrides.content ?? "Hello world",
  timestamp: overrides.timestamp ?? new Date(),
  metadata: overrides.metadata,
});

const createConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: overrides.id ?? "conv-1",
  title: overrides.title ?? "Ma conversation",
  status: overrides.status ?? "active",
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
  firstMessage: overrides.firstMessage ?? "Hello world",
  messageCount: overrides.messageCount ?? 0,
  relatedPollId: overrides.relatedPollId,
  pollId: overrides.pollId,
  pollType: overrides.pollType ?? null,
  pollStatus: overrides.pollStatus ?? "draft",
  isFavorite: overrides.isFavorite ?? false,
  favorite_rank: overrides.favorite_rank,
  tags: overrides.tags ?? [],
  metadata: overrides.metadata,
  userId: overrides.userId,
});

declare const global: typeof globalThis & { location: Location };

vi.mock("../../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../lib/error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn().mockReturnValue({ code: "storage", message: "", userMessage: "" }),
  },
}));

describe("ConversationService", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock location.search pour contrôler les paramètres d'URL
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        href: "https://example.com/",
        search: "",
      },
    });

    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.clearAllMocks();
  });

  describe("convertMessagesToChat", () => {
    it("construit des messages chat avec pollSuggestion déjà présent (nouveau format)", () => {
      const messages: ConversationMessage[] = [
        createConversationMessage({
          id: "m1",
          role: "assistant",
          content: "Avec suggestion",
          metadata: {
            pollSuggestion: {
              title: "Titre",
              description: "Desc",
              dates: ["2025-10-10"],
              timeSlots: [{ start: "10:00", end: "12:00" }],
              type: "date",
              participants: ["Alice"],
            },
          } as any,
        }),
      ];

      const result = ConversationService.convertMessagesToChat(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<ChatMessage>>({
        id: "m1",
        content: "Avec suggestion",
        isAI: true,
        pollSuggestion: {
          title: "Titre",
          description: "Desc",
          dates: ["2025-10-10"],
          type: "date",
          participants: ["Alice"],
        },
      });
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it("reconstruit pollSuggestion à partir des anciens champs metadata (rétrocompatibilité)", () => {
      const messages: ConversationMessage[] = [
        createConversationMessage({
          id: "m1",
          role: "assistant",
          content: "Ancien format",
          metadata: {
            pollGenerated: true,
            title: "Ancien titre",
            description: "Ancienne desc",
            dates: ["2025-11-01"],
            timeSlots: [{ start: "09:00", end: "10:00" }],
            type: "datetime",
            participants: ["Bob"],
          } as any,
        }),
      ];

      const result = ConversationService.convertMessagesToChat(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<ChatMessage>>({
        id: "m1",
        content: "Ancien format",
        isAI: true,
        pollSuggestion: {
          title: "Ancien titre",
          description: "Ancienne desc",
          dates: ["2025-11-01"],
          timeSlots: [{ start: "09:00", end: "10:00" }],
          type: "datetime",
          participants: ["Bob"],
        },
      });
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it("retourne undefined pour pollSuggestion quand aucune info n'est présente", () => {
      const messages: ConversationMessage[] = [
        createConversationMessage({
          id: "m1",
          role: "user",
          content: "Sans suggestion",
          metadata: {} as any,
        }),
      ];

      const result = ConversationService.convertMessagesToChat(messages);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<ChatMessage>>({
        id: "m1",
        content: "Sans suggestion",
        isAI: false,
      });
      expect(result[0].pollSuggestion).toBeUndefined();
    });

    it("convertit correctement le timestamp en Date", () => {
      const iso = "2025-10-10T10:00:00.000Z";
      const messages: ConversationMessage[] = [
        createConversationMessage({ timestamp: new Date(iso) }),
      ];

      const result = ConversationService.convertMessagesToChat(messages);

      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[0].timestamp.toISOString()).toBe(iso);
    });
  });

  describe("createResumeMessage", () => {
    it("crée un message AI avec le titre de la conversation", () => {
      const nowBefore = Date.now();
      const message = ConversationService.createResumeMessage("Ma super conversation");
      const nowAfter = Date.now();

      expect(message.isAI).toBe(true);
      expect(message.content).toContain("Ma super conversation");
      expect(message.id).toMatch(/^resumed-/);
      expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(nowBefore - 10_000);
      expect(message.timestamp.getTime()).toBeLessThanOrEqual(nowAfter + 10_000);
    });
  });

  describe("resumeFromUrl", () => {
    it("retourne null quand aucun paramètre resume/conversationId n'est présent", async () => {
      (window.location as any).search = "";

      const autoSave: any = {
        resumeConversation: vi.fn(),
      };

      const result = await ConversationService.resumeFromUrl(autoSave);

      expect(result).toBeNull();
      expect(autoSave.resumeConversation).not.toHaveBeenCalled();
    });
  });

  describe("loadResumedConversation", () => {
    it("convertit et applique les messages quand la conversation contient des messages", async () => {
      const autoSave: any = {};
      const setMessages = vi.fn();

      const conversation = createConversation({ id: "conv-1" });
      const messages = [createConversationMessage({ id: "m1" })];

      const resumeFromUrlSpy = vi.spyOn(ConversationService, "resumeFromUrl").mockResolvedValue({
        conversation,
        messages,
      });

      await ConversationService.loadResumedConversation(autoSave, setMessages);

      expect(resumeFromUrlSpy).toHaveBeenCalledWith(autoSave);
      expect(setMessages).toHaveBeenCalledTimes(1);
      const passedMessages = setMessages.mock.calls[0][0] as ChatMessage[];
      expect(passedMessages).toHaveLength(1);
      expect(passedMessages[0].id).toBe("m1");
      expect(passedMessages[0].isAI).toBe(true);
    });

    it("crée un message de reprise quand la conversation est vide", async () => {
      const autoSave: any = {};
      const setMessages = vi.fn();

      const conversation = createConversation({ id: "conv-1", title: "Titre vide" });

      vi.spyOn(ConversationService, "resumeFromUrl").mockResolvedValue({
        conversation,
        messages: [],
      });

      await ConversationService.loadResumedConversation(autoSave, setMessages);

      expect(setMessages).toHaveBeenCalledTimes(1);
      const messagesPassed = setMessages.mock.calls[0][0] as ChatMessage[];
      expect(messagesPassed).toHaveLength(1);
      expect(messagesPassed[0].content).toContain("Titre vide");
      expect(messagesPassed[0].isAI).toBe(true);
    });

    it("log une erreur si resumeFromUrl lève et ne modifie pas les messages", async () => {
      const autoSave: any = {};
      const setMessages = vi.fn();

      const { logError } = await import("../../lib/error-handling");

      vi.spyOn(ConversationService, "resumeFromUrl").mockRejectedValue(new Error("boom"));

      await ConversationService.loadResumedConversation(autoSave, setMessages);

      expect(setMessages).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalled();
    });
  });
});
