import { describe, it, expect } from "vitest";
import {
  hasCircularDependency,
  dependsOnPreviousQuestion,
  valueExistsInOptions,
  validateConditionalRules,
} from "../conditionalValidator";
import type { ConditionalRule } from "../../types/conditionalRules";

describe("conditionalValidator", () => {
  describe("hasCircularDependency", () => {
    it("should return false when no circular dependency exists", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      expect(hasCircularDependency(rules, "q2")).toBe(false);
    });

    it("should detect simple circular dependency (Q1 → Q2 → Q1)", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q1",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      expect(hasCircularDependency(rules, "q2")).toBe(true);
      expect(hasCircularDependency(rules, "q1")).toBe(true);
    });

    it("should detect complex circular dependency (Q1 → Q2 → Q3 → Q1)", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q3",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q1",
          dependsOn: "q3",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      expect(hasCircularDependency(rules, "q1")).toBe(true);
      expect(hasCircularDependency(rules, "q2")).toBe(true);
      expect(hasCircularDependency(rules, "q3")).toBe(true);
    });

    it("should handle multiple independent rules without circular dependencies", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q3",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Non" },
        },
        {
          questionId: "q4",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Peut-être" },
        },
      ];

      expect(hasCircularDependency(rules, "q2")).toBe(false);
      expect(hasCircularDependency(rules, "q3")).toBe(false);
      expect(hasCircularDependency(rules, "q4")).toBe(false);
    });
  });

  describe("dependsOnPreviousQuestion", () => {
    const questions = [
      { id: "q1", title: "Question 1" },
      { id: "q2", title: "Question 2" },
      { id: "q3", title: "Question 3" },
    ];

    it("should return true when question depends on a previous question", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      expect(dependsOnPreviousQuestion(rules, questions, "q2")).toBe(true);
    });

    it("should return false when question depends on a later question", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q1",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      expect(dependsOnPreviousQuestion(rules, questions, "q1")).toBe(false);
    });

    it("should return true for question with no rules", () => {
      const rules: ConditionalRule[] = [];

      expect(dependsOnPreviousQuestion(rules, questions, "q1")).toBe(true);
    });

    it("should return true when question depends on much earlier question", () => {
      const rules: ConditionalRule[] = [
        {
          questionId: "q3",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      expect(dependsOnPreviousQuestion(rules, questions, "q3")).toBe(true);
    });
  });

  describe("valueExistsInOptions", () => {
    const questions = [
      {
        id: "q1",
        title: "Question 1",
        options: [
          { id: "opt1", label: "Oui" },
          { id: "opt2", label: "Non" },
        ],
      },
      {
        id: "q2",
        title: "Question 2 (text)",
        options: undefined,
      },
    ];

    it("should return true when value exists in options", () => {
      expect(valueExistsInOptions("q1", "Oui", questions)).toBe(true);
      expect(valueExistsInOptions("q1", "Non", questions)).toBe(true);
    });

    it("should return false when value does not exist in options", () => {
      expect(valueExistsInOptions("q1", "Peut-être", questions)).toBe(false);
    });

    it("should return false for question without options", () => {
      expect(valueExistsInOptions("q2", "anything", questions)).toBe(false);
    });

    it("should return false for non-existent question", () => {
      expect(valueExistsInOptions("q99", "Oui", questions)).toBe(false);
    });
  });

  describe("validateConditionalRules", () => {
    it("should return no errors for valid rules", () => {
      const questions = [
        {
          id: "q1",
          title: "Crew bien équilibré ?",
          options: [
            { label: "Oui, très bien équilibré" },
            { label: "Non, pas vraiment" },
          ],
        },
        {
          id: "q2",
          title: "Si NON, pourquoi ?",
          options: undefined,
        },
      ];

      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Non, pas vraiment" },
        },
      ];

      const errors = validateConditionalRules(rules, questions);
      expect(errors).toEqual([]);
    });

    it("should detect circular dependency", () => {
      const questions = [
        { id: "q1", title: "Q1", options: [{ label: "Oui" }] },
        { id: "q2", title: "Q2", options: [{ label: "Non" }] },
      ];

      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
        {
          questionId: "q1",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      const errors = validateConditionalRules(rules, questions);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("circulaire"))).toBe(true);
    });

    it("should detect invalid question order", () => {
      const questions = [
        { id: "q1", title: "Q1", options: [{ label: "Oui" }] },
        { id: "q2", title: "Q2", options: [{ label: "Non" }] },
      ];

      const rules: ConditionalRule[] = [
        {
          questionId: "q1",
          dependsOn: "q2",
          showIf: { operator: "equals", value: "Non" },
        },
      ];

      const errors = validateConditionalRules(rules, questions);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("précédente"))).toBe(true);
    });

    it("should detect invalid value in options", () => {
      const questions = [
        {
          id: "q1",
          title: "Q1",
          options: [{ label: "Oui" }, { label: "Non" }],
        },
        { id: "q2", title: "Q2", options: undefined },
      ];

      const rules: ConditionalRule[] = [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Peut-être" },
        },
      ];

      const errors = validateConditionalRules(rules, questions);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("introuvable"))).toBe(true);
    });

    it("should detect missing questions", () => {
      const questions = [{ id: "q1", title: "Q1", options: [] }];

      const rules: ConditionalRule[] = [
        {
          questionId: "q99",
          dependsOn: "q1",
          showIf: { operator: "equals", value: "Oui" },
        },
      ];

      const errors = validateConditionalRules(rules, questions);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes("q99 introuvable"))).toBe(true);
    });
  });
});
