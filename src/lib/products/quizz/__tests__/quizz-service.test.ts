import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getQuizz,
  addQuizz,
  deleteQuizzById,
  duplicateQuizz,
  getQuizzBySlugOrId,
  saveQuizz,
  validateQuizz,
  addQuizzResponse,
  getQuizzResponses,
  getQuizzResults,
  getAllChildren,
  getChildHistory,
  getNewBadges,
  type Quizz,
  type QuizzQuestion,
  type QuizzResponse,
} from "../quizz-service";

const mockQuestion: QuizzQuestion = {
  id: "q1",
  question: "Quelle est la capitale de la France ?",
  type: "single",
  options: ["Paris", "Londres", "Berlin", "Madrid"],
  correctAnswer: "Paris",
  points: 1,
};

const mockQuizz: Quizz = {
  id: "quiz_1",
  creator_id: "user_1",
  title: "Quiz Géographie",
  description: "Test de géographie",
  slug: "quiz-geographie",
  status: "active",
  created_at: "2025-01-01T10:00:00Z",
  updated_at: "2025-01-01T10:00:00Z",
  type: "quizz",
  questions: [mockQuestion],
  maxPoints: 1,
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("QuizzService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
      if (key === "doodates_quizz_responses") return JSON.stringify([]);
      if (key === "doodates_device_id") return "device_test_123";
      return null;
    });
    localStorageMock.setItem.mockClear();
  });

  describe("validateQuizz", () => {
    it("should validate a correct quizz", () => {
      expect(() => validateQuizz(mockQuizz)).not.toThrow();
    });

    it("should throw error for missing title", () => {
      const invalidQuizz = { ...mockQuizz, title: "" };
      expect(() => validateQuizz(invalidQuizz)).toThrow(
        "Invalid quizz: title must be a non-empty string",
      );
    });

    it("should throw error for missing questions", () => {
      const invalidQuizz = { ...mockQuizz, questions: [] };
      expect(() => validateQuizz(invalidQuizz)).toThrow(
        "Invalid quizz: questions must be a non-empty array",
      );
    });

    it("should throw error for question without options for single type", () => {
      const invalidQuestion = { ...mockQuestion, options: undefined };
      const invalidQuizz = { ...mockQuizz, questions: [invalidQuestion] };
      expect(() => validateQuizz(invalidQuizz)).toThrow(
        "Invalid quizz question at index 0: options required for single type",
      );
    });

    it("should throw error for question without options for multiple type", () => {
      const invalidQuestion = {
        ...mockQuestion,
        type: "multiple" as const,
        options: undefined,
      };
      const invalidQuizz = { ...mockQuizz, questions: [invalidQuestion] };
      expect(() => validateQuizz(invalidQuizz)).toThrow(
        "Invalid quizz question at index 0: options required for multiple type",
      );
    });

    it("should throw error for question missing required fields", () => {
      const invalidQuestion = { id: "", question: "", type: "single" as const };
      const invalidQuizz = { ...mockQuizz, questions: [invalidQuestion] };
      expect(() => validateQuizz(invalidQuizz)).toThrow(
        "Invalid quizz question at index 0: missing required fields",
      );
    });
  });

  describe("getQuizz", () => {
    it("should return empty array when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getQuizz()).toEqual([]);
    });

    it("should return quizz from localStorage", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));
      expect(getQuizz()).toEqual(quizz);
    });

    it("should filter out non-quizz items", () => {
      const mixedItems = [
        mockQuizz,
        { type: "date", id: "date_1", title: "Date" },
        { type: "form", id: "form_1", title: "Form" },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mixedItems));
      const result = getQuizz();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("quiz_1");
    });

    it("should handle malformed localStorage data", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");
      expect(getQuizz()).toEqual([]);
    });

    it("should deduplicate quizz and keep most recent", () => {
      const oldQuizz = {
        ...mockQuizz,
        id: "quiz_1",
        updated_at: "2025-01-01T10:00:00Z",
      };
      const newQuizz = {
        ...mockQuizz,
        id: "quiz_1",
        updated_at: "2025-01-02T10:00:00Z",
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([oldQuizz, newQuizz]));
      const result = getQuizz();
      expect(result).toHaveLength(1);
      expect(result[0].updated_at).toBe("2025-01-02T10:00:00Z");
    });
  });

  describe("addQuizz", () => {
    it("should add a new quizz", async () => {
      localStorageMock.getItem.mockReturnValue("[]");

      await addQuizz(mockQuizz);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_quizz",
        expect.stringContaining(mockQuizz.id),
      );
    });

    it("should update existing quizz", async () => {
      const existingQuizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingQuizz));

      const updatedQuizz = { ...mockQuizz, title: "Updated title" };
      await addQuizz(updatedQuizz);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_quizz",
        expect.stringContaining("Updated title"),
      );
    });

    it("should throw error for invalid quizz", async () => {
      const invalidQuizz = { ...mockQuizz, title: "" };

      await expect(addQuizz(invalidQuizz)).rejects.toThrow();
    });
  });

  describe("deleteQuizzById", () => {
    it("should delete quizz by id", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));

      deleteQuizzById(mockQuizz.id);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("doodates_quizz", expect.any(String));
    });

    it("should handle non-existent quizz", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));

      deleteQuizzById("non_existent");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_quizz",
        JSON.stringify(quizz),
      );
    });
  });

  describe("duplicateQuizz", () => {
    it("should create a duplicate with new id and slug", () => {
      const duplicate = duplicateQuizz(mockQuizz);

      expect(duplicate.id).not.toBe(mockQuizz.id);
      expect(duplicate.slug).not.toBe(mockQuizz.slug);
      expect(duplicate.title).toBe("Quiz Géographie (copie)");
      expect(duplicate.id).toMatch(/^quizz_\d+_[a-z0-9]+$/);
    });
  });

  describe("getQuizzBySlugOrId", () => {
    it("should find quizz by id", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));

      const found = getQuizzBySlugOrId(mockQuizz.id);
      expect(found).toEqual(mockQuizz);
    });

    it("should find quizz by slug", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));

      const found = getQuizzBySlugOrId(mockQuizz.slug);
      expect(found).toEqual(mockQuizz);
    });

    it("should return null for not found", () => {
      const quizz = [mockQuizz];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(quizz));

      const found = getQuizzBySlugOrId("not_found");
      expect(found).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(getQuizzBySlugOrId("")).toBeNull();
      expect(getQuizzBySlugOrId(null)).toBeNull();
      expect(getQuizzBySlugOrId(undefined)).toBeNull();
    });
  });

  describe("addQuizzResponse", () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
        if (key === "doodates_quizz_responses") return JSON.stringify([]);
        if (key === "doodates_device_id") return "device_test_123";
        return null;
      });
    });

    it("should add a response and calculate score for single choice", () => {
      const response = addQuizzResponse({
        pollId: mockQuizz.id,
        answers: [{ questionId: "q1", answer: "Paris" }],
        respondentName: "Test User",
      });

      expect(response.pollId).toBe(mockQuizz.id);
      expect(response.answers[0].isCorrect).toBe(true);
      expect(response.answers[0].points).toBe(1);
      expect(response.totalPoints).toBe(1);
      expect(response.percentage).toBe(100);
    });

    it("should mark incorrect answer for single choice", () => {
      const response = addQuizzResponse({
        pollId: mockQuizz.id,
        answers: [{ questionId: "q1", answer: "Londres" }],
      });

      expect(response.answers[0].isCorrect).toBe(false);
      expect(response.answers[0].points).toBe(0);
      expect(response.totalPoints).toBe(0);
      expect(response.percentage).toBe(0);
    });

    it("should handle multiple choice questions", () => {
      const multipleQuestion: QuizzQuestion = {
        id: "q2",
        question: "Quelles sont les capitales européennes ?",
        type: "multiple",
        options: ["Paris", "Londres", "Berlin", "Tokyo"],
        correctAnswer: ["Paris", "Londres", "Berlin"],
        points: 2,
      };
      const quizzWithMultiple = {
        ...mockQuizz,
        questions: [multipleQuestion],
        maxPoints: 2,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([quizzWithMultiple]);
        if (key === "doodates_quizz_responses") return JSON.stringify([]);
        if (key === "doodates_device_id") return "device_test_123";
        return null;
      });

      const response = addQuizzResponse({
        pollId: quizzWithMultiple.id,
        answers: [{ questionId: "q2", answer: ["Paris", "Londres", "Berlin"] }],
      });

      expect(response.answers[0].isCorrect).toBe(true);
      expect(response.answers[0].points).toBe(2);
    });

    it("should handle text questions with normalization", () => {
      const textQuestion: QuizzQuestion = {
        id: "q3",
        question: "Écrivez la capitale de la France",
        type: "text",
        correctAnswer: "Paris",
        points: 1,
      };
      const quizzWithText = {
        ...mockQuizz,
        questions: [textQuestion],
        maxPoints: 1,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([quizzWithText]);
        if (key === "doodates_quizz_responses") return JSON.stringify([]);
        if (key === "doodates_device_id") return "device_test_123";
        return null;
      });

      // Test avec accents et casse différente
      const response = addQuizzResponse({
        pollId: quizzWithText.id,
        answers: [{ questionId: "q3", answer: "  PARIS  " }],
      });

      expect(response.answers[0].isCorrect).toBe(true);
    });

    it("should handle true-false questions", () => {
      const trueFalseQuestion: QuizzQuestion = {
        id: "q4",
        question: "Paris est la capitale de la France",
        type: "true-false",
        correctAnswer: true,
        points: 1,
      };
      const quizzWithTrueFalse = {
        ...mockQuizz,
        questions: [trueFalseQuestion],
        maxPoints: 1,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([quizzWithTrueFalse]);
        if (key === "doodates_quizz_responses") return JSON.stringify([]);
        if (key === "doodates_device_id") return "device_test_123";
        return null;
      });

      const response = addQuizzResponse({
        pollId: quizzWithTrueFalse.id,
        answers: [{ questionId: "q4", answer: true }],
      });

      expect(response.answers[0].isCorrect).toBe(true);
    });

    it("should throw error for non-existent quizz", () => {
      expect(() => {
        addQuizzResponse({
          pollId: "non_existent",
          answers: [{ questionId: "q1", answer: "Paris" }],
        });
      }).toThrow("Quizz not found");
    });

    it("should throw error for non-existent question", () => {
      expect(() => {
        addQuizzResponse({
          pollId: mockQuizz.id,
          answers: [{ questionId: "non_existent", answer: "Paris" }],
        });
      }).toThrow("Question not found: non_existent");
    });
  });

  describe("getQuizzResults", () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
        if (key === "doodates_quizz_responses") {
          const responses: QuizzResponse[] = [
            {
              id: "resp1",
              pollId: mockQuizz.id,
              created_at: "2025-01-01T10:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Paris",
                  isCorrect: true,
                  points: 1,
                },
              ],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
            {
              id: "resp2",
              pollId: mockQuizz.id,
              created_at: "2025-01-01T11:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Londres",
                  isCorrect: false,
                  points: 0,
                },
              ],
              totalPoints: 0,
              maxPoints: 1,
              percentage: 0,
            },
          ];
          return JSON.stringify(responses);
        }
        return null;
      });
    });

    it("should calculate average score and percentage", () => {
      const results = getQuizzResults(mockQuizz.id);

      expect(results.pollId).toBe(mockQuizz.id);
      expect(results.totalResponses).toBe(2);
      expect(results.averageScore).toBe(0.5);
      expect(results.averagePercentage).toBe(50);
    });

    it("should calculate question stats", () => {
      const results = getQuizzResults(mockQuizz.id);

      expect(results.questionStats["q1"]).toBeDefined();
      expect(results.questionStats["q1"].correctAnswers).toBe(1);
      expect(results.questionStats["q1"].totalAnswers).toBe(2);
      expect(results.questionStats["q1"].percentage).toBe(50);
      expect(results.questionStats["q1"].mostCommonWrongAnswer).toBe("Londres");
    });

    it("should return empty results for quizz with no responses", () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
        if (key === "doodates_quizz_responses") return JSON.stringify([]);
        return null;
      });

      const results = getQuizzResults(mockQuizz.id);

      expect(results.totalResponses).toBe(0);
      expect(results.averageScore).toBe(0);
      expect(results.averagePercentage).toBe(0);
      expect(results.responses).toEqual([]);
    });

    it("should throw error for non-existent quizz", () => {
      expect(() => getQuizzResults("non_existent")).toThrow("Quizz not found");
    });
  });

  describe("getAllChildren", () => {
    it("should return list of unique children names", () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz_responses") {
          const responses: QuizzResponse[] = [
            {
              id: "resp1",
              pollId: "quiz_1",
              respondentName: "Alice",
              created_at: "2025-01-01T10:00:00Z",
              answers: [],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
            {
              id: "resp2",
              pollId: "quiz_1",
              respondentName: "Bob",
              created_at: "2025-01-01T11:00:00Z",
              answers: [],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
            {
              id: "resp3",
              pollId: "quiz_1",
              respondentName: "Alice",
              created_at: "2025-01-01T12:00:00Z",
              answers: [],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
          ];
          return JSON.stringify(responses);
        }
        return null;
      });

      const children = getAllChildren();
      expect(children).toHaveLength(2);
      expect(children).toContain("alice");
      expect(children).toContain("bob");
    });

    it("should return empty array when no responses", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getAllChildren()).toEqual([]);
    });
  });

  describe("getChildHistory", () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
        if (key === "doodates_quizz_responses") {
          const responses: QuizzResponse[] = [
            {
              id: "resp1",
              pollId: mockQuizz.id,
              respondentName: "Alice",
              created_at: "2025-01-01T10:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Paris",
                  isCorrect: true,
                  points: 1,
                },
              ],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
            {
              id: "resp2",
              pollId: mockQuizz.id,
              respondentName: "Alice",
              created_at: "2025-01-02T10:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Paris",
                  isCorrect: true,
                  points: 1,
                },
              ],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
            {
              id: "resp3",
              pollId: mockQuizz.id,
              respondentName: "Alice",
              created_at: "2025-01-03T10:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Londres",
                  isCorrect: false,
                  points: 0,
                },
              ],
              totalPoints: 0,
              maxPoints: 1,
              percentage: 0,
            },
          ];
          return JSON.stringify(responses);
        }
        return null;
      });
    });

    it("should calculate child history with stats", () => {
      const history = getChildHistory("Alice");

      expect(history).not.toBeNull();
      expect(history?.childName).toBe("Alice");
      expect(history?.totalQuizzes).toBe(3);
      expect(history?.averageScore).toBeCloseTo(66.7, 1);
      expect(history?.bestScore).toBe(100);
      expect(history?.currentStreak).toBe(0); // Dernier quiz à 0%
      expect(history?.bestStreak).toBe(2); // 2 quiz consécutifs à 100%
    });

    it("should calculate streaks correctly", () => {
      // Créer des réponses avec un streak de 5 quiz > 70%
      const streakResponses: QuizzResponse[] = [];
      for (let i = 0; i < 5; i++) {
        streakResponses.push({
          id: `resp${i}`,
          pollId: mockQuizz.id,
          respondentName: "Bob",
          created_at: `2025-01-0${i + 1}T10:00:00Z`,
          answers: [
            {
              questionId: "q1",
              answer: "Paris",
              isCorrect: true,
              points: 1,
            },
          ],
          totalPoints: 1,
          maxPoints: 1,
          percentage: 100,
        });
      }

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz_responses") return JSON.stringify(streakResponses);
        return null;
      });

      const history = getChildHistory("Bob");
      expect(history?.currentStreak).toBe(5);
      expect(history?.bestStreak).toBe(5);
    });

    it("should return null for non-existent child", () => {
      expect(getChildHistory("NonExistent")).toBeNull();
    });

    it("should return null for empty name", () => {
      expect(getChildHistory("")).toBeNull();
      expect(getChildHistory("   ")).toBeNull();
    });

    it("should calculate badges correctly", () => {
      const history = getChildHistory("Alice");
      expect(history?.badges).toBeDefined();
      expect(history?.badges.length).toBeGreaterThan(0);

      // Vérifier que first_quiz est présent
      const firstQuizBadge = history?.badges.find((b) => b.type === "first_quiz");
      expect(firstQuizBadge).toBeDefined();

      // Vérifier que perfect_score est présent (2 quiz à 100%)
      const perfectScoreBadge = history?.badges.find((b) => b.type === "perfect_score");
      expect(perfectScoreBadge).toBeDefined();
    });
  });

  describe("getNewBadges", () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_quizz") return JSON.stringify([mockQuizz]);
        if (key === "doodates_quizz_responses") {
          const responses: QuizzResponse[] = [
            {
              id: "resp1",
              pollId: mockQuizz.id,
              respondentName: "Charlie",
              created_at: "2025-01-01T10:00:00Z",
              answers: [
                {
                  questionId: "q1",
                  answer: "Paris",
                  isCorrect: true,
                  points: 1,
                },
              ],
              totalPoints: 1,
              maxPoints: 1,
              percentage: 100,
            },
          ];
          return JSON.stringify(responses);
        }
        return null;
      });
    });

    it("should return new badges after previous count", () => {
      const newBadges = getNewBadges("Charlie", 0);
      expect(newBadges.length).toBeGreaterThan(0);
    });

    it("should return empty array when no new badges", () => {
      const history = getChildHistory("Charlie");
      const badgeCount = history?.badges.length || 0;
      const newBadges = getNewBadges("Charlie", badgeCount);
      expect(newBadges).toEqual([]);
    });
  });
});
