/**
 * Tests for usePollManagement Hook
 * DooDates - Poll Management System
 */

/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePollManagement } from "../usePollManagement";
import type { PollSuggestion, FormPollSuggestion } from "../../lib/gemini";

// Spy on console.log to avoid test output pollution
const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("usePollManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => usePollManagement());

      expect(result.current.showPollCreator).toBe(false);
      expect(result.current.selectedPollData).toBe(null);
      expect(result.current.isFormPoll).toBe(false);
      expect(typeof result.current.openPollCreator).toBe("function");
      expect(typeof result.current.closePollCreator).toBe("function");
      expect(typeof result.current.getFormDraft).toBe("function");
    });
  });

  describe("openPollCreator", () => {
    it("should open creator with date poll data", () => {
      const { result } = renderHook(() => usePollManagement());

      const datePollData: PollSuggestion = {
        type: "date",
        title: "Réunion équipe",
        dates: ["2025-12-01", "2025-12-02"],
        participants: ["alice@example.com", "bob@example.com"],
        timeSlots: [],
      };

      act(() => {
        result.current.openPollCreator(datePollData);
      });

      expect(result.current.showPollCreator).toBe(true);
      expect(result.current.selectedPollData).toEqual(datePollData);
      expect(result.current.isFormPoll).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith("🔍 Opening poll creator with data:", datePollData);
    });

    it("should open creator with form poll data", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Questionnaire satisfaction",
        questions: [
          {
            type: "text",
            text: "Comment s'est passée votre journée ?",
            title: "Comment s'est passée votre journée ?",
            required: true,
          },
          {
            type: "single",
            text: "Quelle est votre satisfaction globale ?",
            title: "Quelle est votre satisfaction globale ?",
            required: false,
            options: ["Très satisfait", "Satisfait", "Neutre", "Insatisfait"],
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      expect(result.current.showPollCreator).toBe(true);
      expect(result.current.selectedPollData).toEqual(formPollData);
      expect(result.current.isFormPoll).toBe(true);
    });

    it("should update data when opening with different poll", () => {
      const { result } = renderHook(() => usePollManagement());

      const firstPoll: PollSuggestion = {
        type: "date",
        title: "First poll",
        dates: ["2025-12-01"],
      };

      const secondPoll: PollSuggestion = {
        type: "date",
        title: "Second poll",
        dates: ["2025-12-02"],
      };

      act(() => {
        result.current.openPollCreator(firstPoll);
      });

      expect(result.current.selectedPollData?.title).toBe("First poll");

      act(() => {
        result.current.openPollCreator(secondPoll);
      });

      expect(result.current.selectedPollData?.title).toBe("Second poll");
    });
  });

  describe("closePollCreator", () => {
    it("should close creator and clear data", () => {
      const { result } = renderHook(() => usePollManagement());

      const pollData: PollSuggestion = {
        type: "date",
        title: "Test poll",
        dates: ["2025-12-01"],
      };

      act(() => {
        result.current.openPollCreator(pollData);
      });

      expect(result.current.showPollCreator).toBe(true);
      expect(result.current.selectedPollData).not.toBe(null);

      act(() => {
        result.current.closePollCreator();
      });

      expect(result.current.showPollCreator).toBe(false);
      expect(result.current.selectedPollData).toBe(null);
      expect(result.current.isFormPoll).toBe(false);
    });

    it("should handle closing when already closed", () => {
      const { result } = renderHook(() => usePollManagement());

      expect(result.current.showPollCreator).toBe(false);

      act(() => {
        result.current.closePollCreator();
      });

      expect(result.current.showPollCreator).toBe(false);
    });
  });

  describe("getFormDraft", () => {
    it("should return null when no poll data", () => {
      const { result } = renderHook(() => usePollManagement());

      const draft = result.current.getFormDraft();
      expect(draft).toBe(null);
    });

    it("should return null for date polls", () => {
      const { result } = renderHook(() => usePollManagement());

      const datePollData: PollSuggestion = {
        type: "date",
        title: "Date poll",
        dates: ["2025-12-01"],
      };

      act(() => {
        result.current.openPollCreator(datePollData);
      });

      const draft = result.current.getFormDraft();
      expect(draft).toBe(null);
    });

    it("should convert form poll suggestion to draft", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Questionnaire test",
        questions: [
          {
            type: "text",
            text: "Votre nom",
            title: "Votre nom",
            required: true,
          },
          {
            type: "single",
            text: "Votre âge",
            title: "Votre âge",
            required: false,
            options: ["18-25", "26-35", "36-50", "50+"],
          },
          {
            type: "multiple",
            text: "Vos centres d'intérêt",
            title: "Vos centres d'intérêt",
            required: false,
            options: ["Sport", "Musique", "Cinéma", "Lecture"],
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      const draft = result.current.getFormDraft();

      expect(draft).not.toBe(null);
      expect(draft?.type).toBe("form");
      expect(draft?.title).toBe("Questionnaire test");
      expect(draft?.questions).toHaveLength(3);

      // Check text question
      const textQuestion = draft?.questions[0];
      expect(textQuestion?.type).toBe("text");
      expect(textQuestion?.title).toBe("Votre nom");
      expect(textQuestion?.required).toBe(true);

      // Check single choice question
      const singleQuestion = draft?.questions[1];
      expect(singleQuestion?.type).toBe("single");
      expect(singleQuestion?.title).toBe("Votre âge");
      expect(singleQuestion?.required).toBe(false);
      expect((singleQuestion as any)?.options).toHaveLength(4);
      expect((singleQuestion as any)?.options?.[0].label).toBe("18-25");

      // Check multiple choice question
      const multipleQuestion = draft?.questions[2];
      expect(multipleQuestion?.type).toBe("multiple");
      expect(multipleQuestion?.title).toBe("Vos centres d'intérêt");
      expect(multipleQuestion?.required).toBe(false);
      expect((multipleQuestion as any)?.options).toHaveLength(4);
    });

    it("should generate unique IDs for questions and options", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Test IDs",
        questions: [
          {
            type: "single",
            text: "Question 1",
            title: "Question 1",
            required: false,
            options: ["A", "B"],
          },
          {
            type: "single",
            text: "Question 2",
            title: "Question 2",
            required: false,
            options: ["C", "D"],
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      const draft = result.current.getFormDraft();

      const questionIds = draft?.questions.map(q => q.id) || [];
      const optionIds = draft?.questions.flatMap(q => (q as any).options?.map((o: any) => o.id) || []) || [];

      // All IDs should be unique
      expect(new Set(questionIds).size).toBe(questionIds.length);
      expect(new Set(optionIds).size).toBe(optionIds.length);

      // All IDs should be strings of reasonable length
      questionIds.forEach(id => {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      });

      optionIds.forEach(id => {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      });
    });

    it("should handle questions without options", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Test options",
        questions: [
          {
            type: "single",
            text: "Question without options",
            title: "Question without options",
            required: false,
            // No options provided
          },
          {
            type: "text",
            text: "Text question",
            title: "Text question",
            required: false,
            // Text questions don't need options
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      const draft = result.current.getFormDraft();

      expect((draft?.questions[0] as any).options).toEqual([]); // Empty array for single/multiple without options
      expect(draft?.questions[1]).not.toHaveProperty("options"); // Text questions don't have options
    });

    it("should handle missing title in suggestion", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Test form", // Explicit title provided
        questions: [
          {
            type: "text",
            text: "Test question",
            title: "Test question",
            required: false,
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      const draft = result.current.getFormDraft();

      expect(draft?.title).toBe("Test form"); // Should use the provided title
    });

    it("should handle unknown question types", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Test unknown type",
        questions: [
          {
            type: "unknown" as any, // Invalid type
            text: "Unknown question",
            title: "Unknown question",
            required: false,
          },
        ],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      const draft = result.current.getFormDraft();

      // Unknown types should default to "text"
      expect(draft?.questions[0].type).toBe("text");
      expect(draft?.questions[0].title).toBe("Unknown question");
    });
  });

  describe("isFormPoll", () => {
    it("should return true for form polls", () => {
      const { result } = renderHook(() => usePollManagement());

      const formPollData: FormPollSuggestion = {
        type: "form",
        title: "Form poll",
        questions: [],
      };

      act(() => {
        result.current.openPollCreator(formPollData);
      });

      expect(result.current.isFormPoll).toBe(true);
    });

    it("should return false for date polls", () => {
      const { result } = renderHook(() => usePollManagement());

      const datePollData: PollSuggestion = {
        type: "date",
        title: "Date poll",
        dates: ["2025-12-01"],
      };

      act(() => {
        result.current.openPollCreator(datePollData);
      });

      expect(result.current.isFormPoll).toBe(false);
    });

    it("should return false when no poll is selected", () => {
      const { result } = renderHook(() => usePollManagement());

      expect(result.current.isFormPoll).toBe(false);
    });
  });
});
