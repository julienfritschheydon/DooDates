/**
 * Tests for useIntentDetection Hook
 * DooDates - Intent Detection System
 */

/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntentDetection } from "../useIntentDetection";
import type { Poll } from "../../lib/pollStorage";

// Mocks des services utilisés par le hook
vi.mock("../../services/IntentDetectionService", () => ({
  IntentDetectionService: {
    detectMultipleIntents: vi.fn(),
  },
}));

vi.mock("../../services/FormPollIntentService", () => ({
  FormPollIntentService: {
    detectIntent: vi.fn(),
  },
}));

vi.mock("../../services/GeminiIntentService", () => ({
  GeminiIntentService: {
    detectFormIntent: vi.fn(),
    logMissingPattern: vi.fn(),
  },
}));

vi.mock("../../services/PollTypeSwitchDetector", () => ({
  PollTypeSwitchDetector: {
    detectTypeSwitch: vi.fn(),
    detectTypeSwitchWithAI: vi.fn(),
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import des services pour les mocks
import { IntentDetectionService } from "../../services/IntentDetectionService";
import { FormPollIntentService } from "../../services/FormPollIntentService";
import { GeminiIntentService } from "../../services/GeminiIntentService";
import { PollTypeSwitchDetector } from "../../services/PollTypeSwitchDetector";
import { logger } from "../../lib/logger";

// Helpers pour créer des données de test
const createMockDatePoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "date-poll-123",
  type: "availability",
  title: "Réunion équipe",
  dates: ["2025-12-01", "2025-12-02"],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator_id: "user-123",
  ...overrides,
});

const createMockFormPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "form-poll-456",
  type: "form",
  title: "Questionnaire satisfaction",
  questions: [
    {
      id: "q1",
      type: "text",
      title: "Comment s'est passée votre journée ?",
      required: false,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator_id: "user-123",
  ...overrides,
});

describe("useIntentDetection", () => {
  let mockOnDispatchAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDispatchAction = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Setup", () => {
    it("should return detectIntent function", () => {
      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: null,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      expect(result.current).toHaveProperty("detectIntent");
      expect(typeof result.current.detectIntent).toBe("function");
    });

    it("should return handled: false when no current poll", async () => {
      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: null,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("ajoute une date");
      expect(intentResult).toEqual({ handled: false });
    });
  });

  describe("Type Switching Detection", () => {
    it("should detect high confidence type switch immediately", async () => {
      const mockDatePoll = createMockDatePoll();
      const mockTypeSwitchResult = {
        isTypeSwitch: true,
        confidence: 0.8,
        currentType: "availability",
        requestedType: "form" as const,
      };

      vi.mocked(PollTypeSwitchDetector.detectTypeSwitch).mockReturnValue(mockTypeSwitchResult);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("crée un questionnaire à la place");

      expect(intentResult).toEqual({
        handled: true,
        isTypeSwitch: true,
        originalMessage: "crée un questionnaire à la place",
        requestedType: "form",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "🔄 Changement de type de sondage détecté (priorité)",
        "poll",
        expect.objectContaining({
          currentType: "availability",
          requestedType: "form",
          confidence: 0.8,
        })
      );
    });

    it("should ask AI for low confidence type switches", async () => {
      const mockDatePoll = createMockDatePoll();
      const mockLowConfidenceResult = {
        isTypeSwitch: true,
        confidence: 0.5,
        currentType: "availability",
        requestedType: "form" as const,
      };
      const mockAIResult = {
        isTypeSwitch: true,
        confidence: 0.8,
        currentType: "availability",
        requestedType: "form" as const,
      };

      vi.mocked(PollTypeSwitchDetector.detectTypeSwitch).mockReturnValue(mockLowConfidenceResult);
      vi.mocked(PollTypeSwitchDetector.detectTypeSwitchWithAI).mockResolvedValue(mockAIResult);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("peut-être un questionnaire");

      expect(intentResult).toEqual({
        handled: true,
        isTypeSwitch: true,
        originalMessage: "peut-être un questionnaire",
        requestedType: "form",
      });
      expect(PollTypeSwitchDetector.detectTypeSwitchWithAI).toHaveBeenCalled();
    });

    it("should fallback to AI when no initial detection", async () => {
      const mockDatePoll = createMockDatePoll();
      const mockNoDetectionResult = {
        isTypeSwitch: false,
        confidence: 0,
      };
      const mockAIResult = {
        isTypeSwitch: true,
        confidence: 0.9,
        currentType: "availability",
        requestedType: "form" as const,
      };

      vi.mocked(PollTypeSwitchDetector.detectTypeSwitch).mockReturnValue(mockNoDetectionResult);
      vi.mocked(PollTypeSwitchDetector.detectTypeSwitchWithAI).mockResolvedValue(mockAIResult);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("finalement je veux un questionnaire");

      expect(intentResult).toEqual({
        handled: true,
        isTypeSwitch: true,
        originalMessage: "finalement je veux un questionnaire",
        requestedType: "form",
      });
    });
  });

  describe("Date Poll Intent Detection", () => {
    it("should handle date poll modifications with multiple intents", async () => {
      const mockDatePoll = createMockDatePoll();
      const mockMultiIntent = {
        isModification: true,
        confidence: 0.9,
        intents: [
          {
            action: "ADD_DATE",
            payload: "2025-12-03",
            explanation: "Date ajoutée",
          },
          {
            action: "REMOVE_DATE",
            payload: "2025-12-01",
            explanation: "Date supprimée",
          },
        ],
      };

      vi.mocked(IntentDetectionService.detectMultipleIntents).mockResolvedValue(mockMultiIntent);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("ajoute le 3 décembre et enlève le 1er");

      expect(intentResult.handled).toBe(true);
      expect(intentResult.userMessage).toBeDefined();
      expect(intentResult.confirmMessage).toBeDefined();
      expect(intentResult.confirmMessage?.content).toContain("📅 Date ajoutée");
      expect(intentResult.confirmMessage?.content).toContain("🗑️ Date supprimée");

      expect(mockOnDispatchAction).toHaveBeenCalledTimes(2);
      expect(mockOnDispatchAction).toHaveBeenNthCalledWith(1, {
        type: "ADD_DATE",
        payload: "2025-12-03",
      });
      expect(mockOnDispatchAction).toHaveBeenNthCalledWith(2, {
        type: "REMOVE_DATE",
        payload: "2025-12-01",
      });
    });

    it("should handle duplicate date addition gracefully", async () => {
      const mockDatePoll = createMockDatePoll({ dates: ["2025-12-01", "2025-12-02"] });
      const mockMultiIntent = {
        isModification: true,
        confidence: 0.9,
        intents: [
          {
            action: "ADD_DATE",
            payload: "2025-12-01", // Already exists
            explanation: "Date ajoutée",
          },
        ],
      };

      vi.mocked(IntentDetectionService.detectMultipleIntents).mockResolvedValue(mockMultiIntent);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("ajoute le 1er décembre");

      expect(intentResult.handled).toBe(true);
      expect(intentResult.confirmMessage?.content).toContain("ℹ️ La date 01/12/2025 est déjà dans le sondage");
    });
  });

  describe("Form Poll Intent Detection", () => {
    it("should handle form poll modifications with regex", async () => {
      const mockFormPoll = createMockFormPoll();
      const mockFormIntent = {
        isModification: true,
        confidence: 0.9,
        action: "ADD_QUESTION",
        payload: { title: "Nouvelle question" },
        explanation: "Question ajoutée",
        modifiedQuestionId: "q2",
        modifiedField: "title" as const,
      };

      vi.mocked(FormPollIntentService.detectIntent).mockReturnValue(mockFormIntent);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockFormPoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("ajoute une question sur l'âge");

      expect(intentResult.handled).toBe(true);
      expect(intentResult.userMessage).toBeDefined();
      expect(intentResult.confirmMessage?.content).toContain("➕ Question ajoutée");
      expect(intentResult.modifiedQuestionId).toBe("q2");
      expect(intentResult.modifiedField).toBe("title");

      expect(mockOnDispatchAction).toHaveBeenCalledWith({
        type: "ADD_QUESTION",
        payload: { subject: "Nouvelle question" }, // title -> subject conversion
      });
    });

    it("should fallback to AI when regex doesn't match", async () => {
      const mockFormPoll = createMockFormPoll();
      const mockRegexResult = null; // No match
      const mockAIResult = {
        isModification: true,
        confidence: 0.9,
        action: "REMOVE_QUESTION",
        payload: { questionIndex: 0 },
        explanation: "Question supprimée",
        modifiedQuestionId: "q1",
        modifiedField: undefined,
      };

      vi.mocked(FormPollIntentService.detectIntent).mockReturnValue(mockRegexResult);
      vi.mocked(GeminiIntentService.detectFormIntent).mockResolvedValue(mockAIResult);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockFormPoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("supprime la première question");

      expect(intentResult.handled).toBe(true);
      expect(intentResult.confirmMessage?.content).toContain("🗑️ Question supprimée");
      expect(GeminiIntentService.detectFormIntent).toHaveBeenCalled();
      expect(GeminiIntentService.logMissingPattern).toHaveBeenCalled();
    });

    it("should handle low confidence AI results", async () => {
      const mockFormPoll = createMockFormPoll();
      const mockRegexResult = null;
      const mockLowConfidenceAIResult = {
        isModification: true,
        confidence: 0.6, // Too low
        action: "ADD_QUESTION",
        payload: { title: "Question" },
        explanation: "Question ajoutée",
      };

      vi.mocked(FormPollIntentService.detectIntent).mockReturnValue(mockRegexResult);
      vi.mocked(GeminiIntentService.detectFormIntent).mockResolvedValue(mockLowConfidenceAIResult);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockFormPoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("quelque chose de bizarre");

      expect(intentResult.handled).toBe(true);
      expect(intentResult.confirmMessage?.content).toContain("❌ Je n'ai pas compris cette demande");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should handle various form poll actions", async () => {
      const mockFormPoll = createMockFormPoll();
      const testCases = [
        {
          intent: "SET_REQUIRED",
          message: "rends obligatoire la question 1",
          expectedIcon: "⭐",
        },
        {
          intent: "CHANGE_QUESTION_TYPE",
          message: "change en choix multiple la question 1",
          expectedIcon: "🔄",
        },
        {
          intent: "RENAME_QUESTION",
          message: "renomme la question 1 en 'Votre avis'",
          expectedIcon: "✏️",
        },
      ];

      for (const testCase of testCases) {
        const mockIntent = {
          isModification: true,
          confidence: 0.9,
          action: testCase.intent,
          payload: { questionIndex: 0 },
          explanation: "Action effectuée",
          modifiedQuestionId: "q1",
        };

        vi.mocked(FormPollIntentService.detectIntent).mockReturnValue(mockIntent);

        const { result } = renderHook(() =>
          useIntentDetection({
            currentPoll: mockFormPoll,
            onDispatchAction: vi.fn(),
          })
        );

        const intentResult = await result.current.detectIntent(testCase.message);

        expect(intentResult.handled).toBe(true);
        expect(intentResult.confirmMessage?.content).toContain(testCase.expectedIcon);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty messages", async () => {
      const mockDatePoll = createMockDatePoll();

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("");

      expect(intentResult).toEqual({ handled: false });
    });

    it("should handle whitespace-only messages", async () => {
      const mockDatePoll = createMockDatePoll();

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent("   ");

      expect(intentResult).toEqual({ handled: false });
    });

    it("should handle very long messages", async () => {
      const mockDatePoll = createMockDatePoll();
      const longMessage = "A".repeat(1000);

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      const intentResult = await result.current.detectIntent(longMessage);

      expect(intentResult.handled).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors gracefully", async () => {
      const mockDatePoll = createMockDatePoll();

      vi.mocked(PollTypeSwitchDetector.detectTypeSwitch).mockImplementation(() => {
        throw new Error("Service error");
      });

      const { result } = renderHook(() =>
        useIntentDetection({
          currentPoll: mockDatePoll,
          onDispatchAction: mockOnDispatchAction,
        })
      );

      // Should not throw, should return handled: false
      const intentResult = await result.current.detectIntent("test message");

      expect(intentResult.handled).toBe(false);
    });
  });
});
