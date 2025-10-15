/**
 * Tests for titleGeneration service
 * DooDates - Intelligent title generation tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock error handling
vi.mock("../../error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    processing: vi.fn((en, fr) => new Error(en)),
  },
}));

import {
  generateConversationTitle,
  shouldRegenerateTitle,
  generateFallbackTitle,
  type TitleGenerationOptions,
} from "../titleGeneration";

import type { ConversationMessage } from "../../../types/conversation";

// Helper to create test messages
function createMessage(
  role: "user" | "assistant",
  content: string,
  id: string = `msg-${Date.now()}-${Math.random()}`,
): ConversationMessage {
  return {
    id,
    conversationId: "test-conv",
    role,
    content,
    timestamp: new Date(),
  };
}

describe("titleGeneration", () => {
  describe("generateConversationTitle", () => {
    it("should generate title from scheduling conversation in French", () => {
      const messages = [
        createMessage(
          "user",
          "Bonjour, je voudrais organiser une réunion avec Paul et Marie pour mardi prochain à 14h",
        ),
        createMessage(
          "assistant",
          "Parfait ! Je vais vous aider à organiser cette réunion avec Paul et Marie pour mardi à 14h. Avez-vous une préférence pour la durée ?",
        ),
        createMessage(
          "user",
          "Une heure devrait suffire, c'est pour discuter du projet DooDates",
        ),
        createMessage(
          "assistant",
          "Excellente idée ! Une réunion d'une heure sur le projet DooDates.",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toBeTruthy();
      expect(result.title.length).toBeGreaterThanOrEqual(38);
      expect(result.title.length).toBeLessThanOrEqual(60);
      expect(result.title).toMatch(/réunion|Paul|Marie|mardi|14h/i);
      expect(result.sourceMessages).toHaveLength(4);
    });

    it("should generate title from scheduling conversation in English", () => {
      const messages = [
        createMessage(
          "user",
          "Hi, I need to schedule a meeting with John and Sarah for next Wednesday at 3pm",
        ),
        createMessage(
          "assistant",
          "I'll help you schedule that meeting with John and Sarah for Wednesday at 3pm. What's the meeting about?",
        ),
        createMessage(
          "user",
          "It's about the quarterly review and budget planning",
        ),
        createMessage(
          "assistant",
          "Great! A meeting about quarterly review and budget planning.",
        ),
      ];

      const options: TitleGenerationOptions = { language: "en" };
      const result = generateConversationTitle(messages, options);

      expect(result.success).toBe(true);
      expect(result.title).toBeTruthy();
      expect(result.title.length).toBeGreaterThanOrEqual(38);
      expect(result.title.length).toBeLessThanOrEqual(60);
      expect(result.title).toMatch(/meeting|John|Sarah|Wednesday|3pm/i);
    });

    it("should handle empty messages array", () => {
      const result = generateConversationTitle([]);

      expect(result.success).toBe(false);
      expect(result.title).toBe("");
      expect(result.failureReason).toBe("No messages provided");
      expect(result.sourceMessages).toHaveLength(0);
    });

    it("should limit analysis to maxTurns", () => {
      const messages = [
        createMessage("user", "Organiser réunion avec Paul mardi 14h"),
        createMessage(
          "assistant",
          "Parfait pour la réunion avec Paul mardi 14h",
        ),
        createMessage("user", "Et aussi avec Marie mercredi 15h"),
        createMessage("assistant", "D'accord pour Marie mercredi 15h"),
        createMessage("user", "Et finalement avec Pierre jeudi 16h"),
        createMessage("assistant", "Entendu pour Pierre jeudi 16h"),
        createMessage("user", "Et avec Sophie vendredi 17h"),
        createMessage("assistant", "Très bien pour Sophie vendredi 17h"),
      ];

      const options: TitleGenerationOptions = { maxTurns: 2 };
      const result = generateConversationTitle(messages, options);

      expect(result.success).toBe(true);
      expect(result.sourceMessages.length).toBeLessThanOrEqual(4); // 2 turns = 4 messages max
      expect(result.title).toMatch(/Paul|mardi|14h/i);
      expect(result.title).not.toMatch(/Sophie|vendredi|17h/i);
    });

    it("should respect custom length constraints", () => {
      const messages = [
        createMessage(
          "user",
          "Réunion avec Paul et Marie mardi 14h pour projet DooDates très important",
        ),
        createMessage(
          "assistant",
          "Parfait pour cette réunion importante avec Paul et Marie mardi à 14h concernant le projet DooDates",
        ),
      ];

      const options: TitleGenerationOptions = {
        minLength: 20,
        maxLength: 35,
      };
      const result = generateConversationTitle(messages, options);

      expect(result.success).toBe(true);
      expect(result.title.length).toBeGreaterThanOrEqual(20);
      expect(result.title.length).toBeLessThanOrEqual(35);
    });

    it("should extract time expressions correctly", () => {
      const messages = [
        createMessage("user", "Réunion demain à 14h30 ou après-midi vers 15h"),
        createMessage(
          "assistant",
          "Parfait, nous pouvons programmer cela pour 14h30 ou 15h",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/14h30|15h|après-midi/i);
    });

    it("should clean up trailing punctuation", () => {
      const messages = [
        createMessage("user", "Réunion avec Paul!!!"),
        createMessage("assistant", "D'accord pour la réunion avec Paul."),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).not.toMatch(/[.!?;,]$/);
    });

    it("should handle day names in French", () => {
      const messages = [
        createMessage("user", "Organiser réunion lundi, mardi ou mercredi"),
        createMessage(
          "assistant",
          "Nous pouvons programmer pour lundi, mardi ou mercredi",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/lundi|mardi|mercredi/i);
    });

    it("should handle day names in English", () => {
      const messages = [
        createMessage(
          "user",
          "Schedule meeting for Monday, Tuesday or Wednesday",
        ),
        createMessage(
          "assistant",
          "We can schedule for Monday, Tuesday or Wednesday",
        ),
      ];

      const options: TitleGenerationOptions = { language: "en" };
      const result = generateConversationTitle(messages, options);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/Monday|Tuesday|Wednesday/i);
    });

    it("should prioritize scheduling phrases over generic content", () => {
      const messages = [
        createMessage(
          "user",
          "Bonjour comment allez-vous ? Je voudrais organiser une réunion avec Paul mardi",
        ),
        createMessage(
          "assistant",
          "Bonjour ! Je vais bien merci. Parfait pour organiser cette réunion avec Paul mardi",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/réunion|Paul|mardi/i);
      expect(result.title).not.toMatch(/Bonjour|comment|allez/i);
    });

    it("should expand short titles when possible", () => {
      const messages = [
        createMessage("user", "Réunion Paul"),
        createMessage("assistant", "D'accord pour Paul"),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title.length).toBeGreaterThanOrEqual(38);
      expect(result.title).toMatch(/Paul/i);
    });
  });

  describe("shouldRegenerateTitle", () => {
    it("should not regenerate custom titles", () => {
      expect(shouldRegenerateTitle("Mon titre personnalisé", true, 10)).toBe(
        false,
      );
      expect(shouldRegenerateTitle("Custom title", true, 2)).toBe(false);
    });

    it("should regenerate empty or default titles", () => {
      expect(shouldRegenerateTitle("", false, 2)).toBe(true);
      expect(shouldRegenerateTitle("Nouvelle conversation", false, 2)).toBe(
        true,
      );
      expect(shouldRegenerateTitle("New conversation", false, 2)).toBe(true);
      expect(
        shouldRegenerateTitle("Conversation du 11/09/2025", false, 2),
      ).toBe(true);
    });

    it("should not regenerate if not enough messages", () => {
      expect(shouldRegenerateTitle("", false, 1)).toBe(false);
      expect(shouldRegenerateTitle("Nouvelle conversation", false, 0)).toBe(
        false,
      );
    });

    it("should regenerate for early conversations with even message count", () => {
      expect(shouldRegenerateTitle("Réunion avec Paul", false, 2)).toBe(true);
      expect(shouldRegenerateTitle("Meeting with John", false, 4)).toBe(true);
      expect(shouldRegenerateTitle("Discussion importante", false, 6)).toBe(
        true,
      );
    });

    it("should not regenerate for longer conversations", () => {
      expect(shouldRegenerateTitle("Réunion avec Paul", false, 8)).toBe(false);
      expect(shouldRegenerateTitle("Meeting with John", false, 10)).toBe(false);
    });

    it("should not regenerate for odd message counts in early conversations", () => {
      expect(shouldRegenerateTitle("Réunion avec Paul", false, 3)).toBe(false);
      expect(shouldRegenerateTitle("Meeting with John", false, 5)).toBe(false);
    });
  });

  describe("generateFallbackTitle", () => {
    it("should generate French fallback title", () => {
      const title = generateFallbackTitle("fr");
      expect(title).toMatch(/^Conversation du \d{2}\/\d{2}\/\d{4}$/);
    });

    it("should generate English fallback title", () => {
      const title = generateFallbackTitle("en");
      expect(title).toMatch(/^Conversation \d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    it("should default to French", () => {
      const title = generateFallbackTitle();
      expect(title).toMatch(/^Conversation du \d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe("edge cases and robustness", () => {
    it("should handle very long messages", () => {
      const longContent = "Organiser réunion avec Paul ".repeat(100);
      const messages = [
        createMessage("user", longContent),
        createMessage("assistant", "D'accord pour cette réunion"),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title.length).toBeLessThanOrEqual(60);
    });

    it("should handle special characters in names", () => {
      const messages = [
        createMessage(
          "user",
          "Réunion avec François-José O'Connor et María García-López",
        ),
        createMessage(
          "assistant",
          "Parfait pour la réunion avec François-José et María",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/François-José|María/i);
    });

    it("should handle mixed language content", () => {
      const messages = [
        createMessage("user", "Schedule meeting with Paul pour mardi at 2pm"),
        createMessage("assistant", "Perfect! Meeting with Paul mardi at 2pm"),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).toMatch(/meeting|Paul|mardi|2pm/i);
    });

    it("should handle null or undefined content", () => {
      const messages = [
        { ...createMessage("user", ""), content: null as any },
        { ...createMessage("assistant", ""), content: undefined as any },
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(false);
    });

    it("should normalize multiple spaces", () => {
      const messages = [
        createMessage("user", "Réunion    avec     Paul     mardi"),
        createMessage("assistant", "D'accord   pour   Paul   mardi"),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title).not.toMatch(/\s{2,}/);
    });

    it("should limit number of names to avoid overly long titles", () => {
      const messages = [
        createMessage(
          "user",
          "Réunion avec Paul, Marie, Jean, Pierre, Sophie, Claire, Michel et Anne",
        ),
        createMessage(
          "assistant",
          "Beaucoup de participants pour cette réunion",
        ),
      ];

      const result = generateConversationTitle(messages);

      expect(result.success).toBe(true);
      expect(result.title.length).toBeLessThanOrEqual(60);
      // Should not include all names
      const nameCount = (
        result.title.match(
          /Paul|Marie|Jean|Pierre|Sophie|Claire|Michel|Anne/gi,
        ) || []
      ).length;
      expect(nameCount).toBeLessThan(8);
    });
  });
});
