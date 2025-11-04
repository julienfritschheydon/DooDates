/**
 * Tests pour SimulationService
 */

import { describe, it, expect, vi } from "vitest";
import { simulate } from "../SimulationService";
import type { SimulationConfig } from "../../../types/simulation";

// Mock Gemini
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: () => "C'était vraiment sympa, j'ai passé une bonne soirée.",
          },
        }),
      ),
    })),
  })),
}));

describe("SimulationService", () => {
  const mockQuestions = [
    {
      id: "q1",
      title: "Qu'avez-vous pensé de la soirée ?",
      type: "text" as const,
      required: true,
    },
    {
      id: "q2",
      title: "Recommanderiez-vous cet événement ?",
      type: "single" as const,
      required: true,
      options: [
        { id: "opt1", label: "Oui, absolument" },
        { id: "opt2", label: "Peut-être" },
        { id: "opt3", label: "Non" },
      ],
    },
    {
      id: "q3",
      title: "Quels aspects avez-vous appréciés ?",
      type: "multiple" as const,
      required: false,
      options: [
        { id: "opt1", label: "Ambiance" },
        { id: "opt2", label: "Organisation" },
        { id: "opt3", label: "Activités" },
        { id: "opt4", label: "Nourriture" },
      ],
    },
  ];

  it("génère des réponses simulées", async () => {
    const config: SimulationConfig = {
      pollId: "test-poll",
      volume: 5,
      context: "event",
      useGemini: false,
    };

    const result = await simulate(config, mockQuestions);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.respondents).toHaveLength(5);
    expect(result.metrics.totalResponses).toBe(5);
    expect(result.generationTime).toBeGreaterThanOrEqual(0);
  });


  it("respecte le taux de complétion des personas", async () => {
    const config: SimulationConfig = {
      pollId: "test-poll",
      volume: 10,
      context: "event",
      useGemini: false,
    };

    const result = await simulate(config, mockQuestions);

    // Tous les répondants ne devraient pas avoir un taux de complétion de 100%
    const completionRates = result.respondents.map((r) => r.completionRate);
    const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    expect(avgCompletion).toBeGreaterThan(0.5);
    expect(avgCompletion).toBeLessThan(1.0);
  });

  it("génère des réponses single choice", async () => {
    const config: SimulationConfig = {
      pollId: "test-poll",
      volume: 3,
      context: "event",
      useGemini: false,
    };

    const result = await simulate(config, mockQuestions);

    const singleChoiceResponses = result.respondents.flatMap((r) =>
      r.responses.filter((resp) => resp.questionId === "q2"),
    );

    singleChoiceResponses.forEach((response) => {
      if (response.value !== null) {
        expect(typeof response.value).toBe("string");
        expect(["opt1", "opt2", "opt3"]).toContain(response.value);
      }
    });
  });

  it("génère des réponses multiple choice", async () => {
    const config: SimulationConfig = {
      pollId: "test-poll",
      volume: 3,
      context: "event",
      useGemini: false,
    };

    const result = await simulate(config, mockQuestions);

    const multipleChoiceResponses = result.respondents.flatMap((r) =>
      r.responses.filter((resp) => resp.questionId === "q3"),
    );

    multipleChoiceResponses.forEach((response) => {
      if (response.value !== null && Array.isArray(response.value)) {
        expect(response.value.length).toBeGreaterThan(0);
        expect(response.value.length).toBeLessThanOrEqual(3);
      }
    });
  });

  it("calcule le temps passé", async () => {
    const config: SimulationConfig = {
      pollId: "test-poll",
      volume: 3,
      context: "event",
      useGemini: false,
    };

    const result = await simulate(config, mockQuestions);

    result.respondents.forEach((respondent) => {
      expect(respondent.totalTime).toBeGreaterThan(0);
      expect(respondent.responses.every((r) => r.timeSpent >= 0)).toBe(true);
    });
  });
});
