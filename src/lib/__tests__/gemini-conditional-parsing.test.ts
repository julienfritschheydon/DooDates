import { describe, it, expect, beforeEach, vi } from "vitest";
import { GeminiService } from "../gemini";

describe("GeminiService - Conditional Rules Parsing", () => {
  let service: GeminiService;

  beforeEach(() => {
    service = GeminiService.getInstance();
  });

  describe("parseFormPollResponse - Conditional Rules", () => {
    it("should parse questionnaire with conditional rules", () => {
      const mockResponse = JSON.stringify({
        title: "Questionnaire Crews - 2025",
        questions: [
          {
            title: "Combien de temps avez-vous participé à un crew ?",
            type: "single",
            required: true,
            options: [
              "Je suis en file d'attente (pas encore démarré)",
              "Moins de 3 mois",
              "3 à 6 mois",
              "6 mois à 1 an",
              "Plus d'1 an",
            ],
          },
          {
            title: "Pensez-vous que votre crew était bien équilibré ?",
            type: "single",
            required: true,
            options: [
              "Oui, très bien équilibré",
              "Oui, plutôt bien",
              "Moyennement",
              "Non, pas vraiment",
              "Non, pas du tout",
            ],
          },
          {
            title: "Si NON, qu'est-ce qui aurait rendu votre crew mieux équilibré ?",
            type: "text",
            required: true,
            placeholder: "Votre réponse",
            maxLength: 500,
          },
        ],
        conditionalRules: [
          {
            questionId: "question-3",
            dependsOn: "question-2",
            showIf: {
              operator: "equals",
              value: "Non, pas vraiment",
            },
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.conditionalRules).toBeDefined();
      expect(result?.conditionalRules).toHaveLength(1);
      expect(result?.conditionalRules![0].questionId).toBe("question-3");
      expect(result?.conditionalRules![0].dependsOn).toBe("question-2");
      expect(result?.conditionalRules![0].showIf.operator).toBe("equals");
      expect(result?.conditionalRules![0].showIf.value).toBe("Non, pas vraiment");
    });

    it("should handle questionnaire without conditional rules", () => {
      const mockResponse = JSON.stringify({
        title: "Simple Questionnaire",
        questions: [
          {
            title: "Question 1",
            type: "single",
            required: true,
            options: ["Oui", "Non"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.conditionalRules).toBeUndefined();
    });

    it("should parse multiple conditional rules", () => {
      const mockResponse = JSON.stringify({
        title: "Advanced Survey",
        questions: [
          {
            title: "Question 1",
            type: "single",
            required: true,
            options: ["Oui", "Non"],
          },
          {
            title: "Question 2",
            type: "text",
            required: false,
          },
          {
            title: "Question 3",
            type: "text",
            required: false,
          },
        ],
        conditionalRules: [
          {
            questionId: "question-2",
            dependsOn: "question-1",
            showIf: {
              operator: "equals",
              value: "Oui",
            },
          },
          {
            questionId: "question-3",
            dependsOn: "question-1",
            showIf: {
              operator: "equals",
              value: "Non",
            },
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.conditionalRules).toHaveLength(2);
      expect(result?.conditionalRules![0].showIf.value).toBe("Oui");
      expect(result?.conditionalRules![1].showIf.value).toBe("Non");
    });

    it("should support different conditional operators", () => {
      const mockResponse = JSON.stringify({
        title: "Survey with Multiple Operators",
        questions: [
          { title: "Q1", type: "single", required: true, options: ["A", "B"] },
          { title: "Q2", type: "text", required: false },
          { title: "Q3", type: "text", required: false },
          { title: "Q4", type: "text", required: false },
        ],
        conditionalRules: [
          {
            questionId: "question-2",
            dependsOn: "question-1",
            showIf: { operator: "equals", value: "A" },
          },
          {
            questionId: "question-3",
            dependsOn: "question-1",
            showIf: { operator: "notEquals", value: "A" },
          },
          {
            questionId: "question-4",
            dependsOn: "question-2",
            showIf: { operator: "isNotEmpty" },
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result?.conditionalRules).toHaveLength(3);
      expect(result?.conditionalRules![0].showIf.operator).toBe("equals");
      expect(result?.conditionalRules![1].showIf.operator).toBe("notEquals");
      expect(result?.conditionalRules![2].showIf.operator).toBe("isNotEmpty");
    });
  });

  describe("parseMarkdownQuestionnaire - Conditional Detection", () => {
    it("should detect 'Si NON' pattern in question titles", () => {
      const markdown = `# Questionnaire Crews - 2025

## Section 1

### Q1. Crew bien équilibré ?
- Oui, très bien équilibré
- Oui, plutôt bien
- Moyennement
- Non, pas vraiment
- Non, pas du tout

### Q2. Si NON, pourquoi ? (Réponse libre)
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      expect(parsedPrompt).not.toBeNull();
      expect(parsedPrompt).toContain("RÈGLES CONDITIONNELLES");
      expect(parsedPrompt).toContain("Question 2 s'affiche seulement si Question 1");
      expect(parsedPrompt).toContain('"Non"');
    });

    it("should detect 'Si OUI' pattern in question titles", () => {
      const markdown = `# Survey

## Questions

### Q1. Êtes-vous satisfait ?
- Oui
- Non

### Q2. Si OUI, recommanderiez-vous ? (Réponse libre)
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      expect(parsedPrompt).not.toBeNull();
      expect(parsedPrompt).toContain("RÈGLES CONDITIONNELLES");
      expect(parsedPrompt).toContain("Question 2 s'affiche seulement si Question 1");
      expect(parsedPrompt).toContain('"Oui"');
    });

    it("should handle questionnaires without conditional patterns", () => {
      const markdown = `# Simple Survey

## Questions

### Q1. Question normale
- Option A
- Option B

### Q2. Autre question normale
- Option 1
- Option 2
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      expect(parsedPrompt).not.toBeNull();
      expect(parsedPrompt).not.toContain("RÈGLES CONDITIONNELLES");
    });

    it("should detect multiple conditional questions", () => {
      const markdown = `# Multi-Conditional Survey

## Section

### Q1. Question de base
- Oui
- Non
- Peut-être

### Q2. Si OUI, précisez
(Réponse libre)

### Q3. Si NON, expliquez
(Réponse libre)
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      expect(parsedPrompt).not.toBeNull();
      expect(parsedPrompt).toContain("RÈGLES CONDITIONNELLES");

      // Should detect both conditional questions
      const conditionalMatches = parsedPrompt?.match(/Question \d+ s'affiche seulement si/g);
      expect(conditionalMatches).toHaveLength(2);
    });

    it("should handle case-insensitive 'Si NON/OUI' patterns", () => {
      const markdown = `# Case Test

## Questions

### Q1. Base question
- Oui
- Non

### Q2. si non, details? (Réponse libre)

### Q3. SI OUI, more info? (Réponse libre)
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      expect(parsedPrompt).toContain("RÈGLES CONDITIONNELLES");

      // Should detect both patterns despite different cases
      const conditionalMatches = parsedPrompt?.match(/Question \d+ s'affiche seulement si/g);
      expect(conditionalMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Prompt Integration - Conditional Rules", () => {
    it("should include conditional rules instructions in copy prompt", () => {
      const markdown = `# Test

## Questions

### Q1. Base
- Oui
- Non

### Q2. Si NON, why?
(Réponse libre)
`;

      // @ts-expect-error - Testing private method
      const parsedPrompt = service.parseMarkdownQuestionnaire(markdown);

      // @ts-expect-error - Testing private method
      const copyPrompt = service.buildFormPollPromptCopy(parsedPrompt!);

      expect(copyPrompt).toContain("RÈGLES CONDITIONNELLES");
      expect(copyPrompt).toContain("conditionalRules");
      expect(copyPrompt).toContain("questionId");
      expect(copyPrompt).toContain("dependsOn");
      expect(copyPrompt).toContain("showIf");
    });
  });
});
