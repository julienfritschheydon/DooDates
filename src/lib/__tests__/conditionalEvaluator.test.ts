import { describe, it, expect } from "vitest";
import {
  evaluateRule,
  shouldShowQuestion,
  getVisibleQuestionIds,
  cleanHiddenAnswers,
} from "../conditionalEvaluator";
import type { ConditionalRule } from "../../types/conditionalRules";

describe("conditionalEvaluator", () => {
  describe("evaluateRule", () => {
    describe("equals operator", () => {
      it("should return true when single choice answer equals value", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        };

        expect(evaluateRule(rule, { q1: "Oui" })).toBe(true);
      });

      it("should return false when single choice answer does not equal value", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        };

        expect(evaluateRule(rule, { q1: "Non" })).toBe(false);
      });

      it("should work with multiple choice (array) answers", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Option A" },
        };

        expect(evaluateRule(rule, { q1: ["Option A", "Option B"] })).toBe(true);
        expect(evaluateRule(rule, { q1: ["Option B", "Option C"] })).toBe(false);
      });
    });

    describe("contains operator", () => {
      it("should return true when answer contains the value", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "contains", value: "Option A" },
        };

        expect(evaluateRule(rule, { q1: ["Option A", "Option B"] })).toBe(true);
      });

      it("should return false when answer does not contain the value", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "contains", value: "Option A" },
        };

        expect(evaluateRule(rule, { q1: ["Option B", "Option C"] })).toBe(false);
      });

      it("should work with single value answers", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "contains", value: "Option A" },
        };

        expect(evaluateRule(rule, { q1: "Option A" })).toBe(true);
        expect(evaluateRule(rule, { q1: "Option B" })).toBe(false);
      });

      it("should work with array of expected values", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "contains", value: ["Option A", "Option B"] },
        };

        expect(evaluateRule(rule, { q1: ["Option A"] })).toBe(true);
        expect(evaluateRule(rule, { q1: ["Option C"] })).toBe(false);
      });
    });

    describe("notEquals operator", () => {
      it("should return true when answer is different", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "notEquals", value: "Non" },
        };

        expect(evaluateRule(rule, { q1: "Oui" })).toBe(true);
      });

      it("should return false when answer equals value", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "notEquals", value: "Non" },
        };

        expect(evaluateRule(rule, { q1: "Non" })).toBe(false);
      });

      it("should work with array answers", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "notEquals", value: "Option A" },
        };

        expect(evaluateRule(rule, { q1: ["Option B"] })).toBe(true);
        expect(evaluateRule(rule, { q1: ["Option A", "Option B"] })).toBe(false);
      });
    });

    describe("isEmpty operator", () => {
      it("should return true for empty string", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isEmpty" },
        };

        expect(evaluateRule(rule, { q1: "" })).toBe(true);
      });

      it("should return true for missing answer", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isEmpty" },
        };

        expect(evaluateRule(rule, {})).toBe(true);
      });

      it("should return false for non-empty string", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isEmpty" },
        };

        expect(evaluateRule(rule, { q1: "Some text" })).toBe(false);
      });

      it("should return true for empty array", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isEmpty" },
        };

        expect(evaluateRule(rule, { q1: [] })).toBe(true);
      });

      it("should return false for non-empty array", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isEmpty" },
        };

        expect(evaluateRule(rule, { q1: ["Option"] })).toBe(false);
      });
    });

    describe("isNotEmpty operator", () => {
      it("should return true for non-empty string", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isNotEmpty" },
        };

        expect(evaluateRule(rule, { q1: "Some text" })).toBe(true);
      });

      it("should return false for empty string", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isNotEmpty" },
        };

        expect(evaluateRule(rule, { q1: "" })).toBe(false);
      });

      it("should return false for missing answer", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isNotEmpty" },
        };

        expect(evaluateRule(rule, {})).toBe(false);
      });

      it("should return true for non-empty array", () => {
        const rule: ConditionalRule = {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "isNotEmpty" },
        };

        expect(evaluateRule(rule, { q1: ["Option"] })).toBe(true);
      });
    });
  });

  describe("shouldShowQuestion", () => {
    it("should return true for question with no rules", () => {
      const rules: ConditionalRule[] = [];

      expect(shouldShowQuestion("q1", rules, {})).toBe(true);
    });

    it("should evaluate single rule correctly", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q3bis",
          dependsOn: "q3",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      expect(shouldShowQuestion("q3bis", rules, { q3: "Non" })).toBe(true);
      expect(shouldShowQuestion("q3bis", rules, { q3: "Oui" })).toBe(false);
    });

    it("should return false when dependent question not answered", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q3bis",
          dependsOn: "q3",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      expect(shouldShowQuestion("q3bis", rules, {})).toBe(false);
    });

    it("should evaluate multiple rules with AND logic", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q3",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q3",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      // Both conditions must be true
      expect(
        shouldShowQuestion("q3", rules, { q1: "Oui", q2: "Non" })
      ).toBe(true);

      // First condition false
      expect(
        shouldShowQuestion("q3", rules, { q1: "Non", q2: "Non" })
      ).toBe(false);

      // Second condition false
      expect(
        shouldShowQuestion("q3", rules, { q1: "Oui", q2: "Oui" })
      ).toBe(false);
    });
  });

  describe("getVisibleQuestionIds", () => {
    it("should return all questions when no rules", () => {
      const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];
      const rules: ConditionalRule[] = [];

      const visible = getVisibleQuestionIds(questions, rules, {});
      expect(visible).toEqual(["q1", "q2", "q3"]);
    });

    it("should filter out questions based on rules", () => {
      const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];
      const rules: ConditionalRule[] = [
        {
          questionId: "q3",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      // Q3 should be hidden when Q1 = "Oui"
      const visible = getVisibleQuestionIds(questions, rules, { q1: "Oui" });
      expect(visible).toEqual(["q1", "q2"]);
    });

    it("should show conditional questions when conditions are met", () => {
      const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];
      const rules: ConditionalRule[] = [
        {
          questionId: "q3",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      // Q3 should be visible when Q1 = "Non"
      const visible = getVisibleQuestionIds(questions, rules, { q1: "Non" });
      expect(visible).toEqual(["q1", "q2", "q3"]);
    });
  });

  describe("cleanHiddenAnswers", () => {
    it("should keep only answers for visible questions", () => {
      const answers = {
        q1: "Oui",
        q2: "Non",
        q3: "Something",
      };
      const visibleQuestionIds = ["q1", "q2"];

      const cleaned = cleanHiddenAnswers(answers, visibleQuestionIds);
      expect(cleaned).toEqual({
        q1: "Oui",
        q2: "Non",
      });
    });

    it("should handle empty answers", () => {
      const answers = {};
      const visibleQuestionIds = ["q1", "q2"];

      const cleaned = cleanHiddenAnswers(answers, visibleQuestionIds);
      expect(cleaned).toEqual({});
    });

    it("should handle all questions visible", () => {
      const answers = {
        q1: "Oui",
        q2: "Non",
      };
      const visibleQuestionIds = ["q1", "q2"];

      const cleaned = cleanHiddenAnswers(answers, visibleQuestionIds);
      expect(cleaned).toEqual(answers);
    });
  });

  describe("Real-world Crews scenario", () => {
    it('should handle "Q3bis si NON" pattern correctly', () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q3bis",
          dependsOn: "q3",
          showIf: { operator: "equals", value: "Non, pas vraiment" },
        },
      ];

      // Scenario 1: User answers "Non, pas vraiment"
      expect(
        shouldShowQuestion("q3bis", rules, { q3: "Non, pas vraiment" })
      ).toBe(true);

      // Scenario 2: User answers "Oui, très bien équilibré"
      expect(
        shouldShowQuestion("q3bis", rules, { q3: "Oui, très bien équilibré" })
      ).toBe(false);

      // Scenario 3: User answers "Moyennement"
      expect(shouldShowQuestion("q3bis", rules, { q3: "Moyennement" })).toBe(
        false
      );

      // Scenario 4: User hasn't answered Q3 yet
      expect(shouldShowQuestion("q3bis", rules, {})).toBe(false);
    });
  });
});
