import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFormPolls,
  addFormPoll,
  deleteFormPollById,
  duplicateFormPoll,
  getFormPollBySlugOrId,
  saveFormPolls,
  addFormResponse,
  getFormResponses,
  getFormResults,
  validateFormPoll,
  type FormPoll,
  type FormQuestionShape,
  type FormResponseItem,
} from "../form-polls/form-polls-service";

const mockQuestion: FormQuestionShape = {
  id: "q1",
  kind: "single",
  title: "Question test",
  required: true,
  options: [
    { id: "opt1", label: "Option 1" },
    { id: "opt2", label: "Option 2" },
  ],
};

const mockPoll: FormPoll = {
  id: "form_1",
  creator_id: "user_1",
  title: "Sondage formulaire",
  description: "Description du sondage",
  slug: "sondage-formulaire",
  status: "active",
  created_at: "2025-01-01T10:00:00Z",
  updated_at: "2025-01-01T10:00:00Z",
  type: "form",
  questions: [mockQuestion],
};

const mockResponse: FormResponseItem = {
  questionId: "q1",
  value: "opt1",
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("FormPollsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "doodates_polls") return JSON.stringify([mockPoll]);
      if (key === "doodates_form_responses") return JSON.stringify([]);
      return null;
    });
    localStorageMock.setItem.mockClear();
  });

  describe("validateFormPoll", () => {
    it("should validate a correct form poll", () => {
      expect(() => validateFormPoll(mockPoll)).not.toThrow();
    });

    it("should throw error for missing title", () => {
      const invalidPoll = { ...mockPoll, title: "" };
      expect(() => validateFormPoll(invalidPoll)).toThrow(
        "Invalid form poll: title must be a non-empty string",
      );
    });

    it("should throw error for invalid question structure", () => {
      const invalidPoll = {
        ...mockPoll,
        questions: [{ id: "", title: "test", kind: "single" as const }],
      };
      expect(() => validateFormPoll(invalidPoll)).toThrow(
        "Invalid form poll question at index 0: missing required fields",
      );
    });

    it("should validate poll without questions", () => {
      const pollWithoutQuestions = { ...mockPoll, questions: undefined };
      expect(() => validateFormPoll(pollWithoutQuestions)).not.toThrow();
    });
  });

  describe("getFormPolls", () => {
    it("should return empty array when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getFormPolls()).toEqual([]);
    });

    it("should return form polls from localStorage", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      expect(getFormPolls()).toEqual(polls);
    });

    it("should filter out non-form polls", () => {
      const mixedPolls = [
        mockPoll,
        { type: "date", id: "date_1", title: "Date" },
        { type: "quizz", id: "quizz_1", title: "Quizz" },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mixedPolls));
      expect(getFormPolls()).toEqual([mockPoll]);
    });

    it("should handle malformed localStorage data", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");
      expect(getFormPolls()).toEqual([]);
    });
  });

  describe("addFormPoll", () => {
    it("should add a new form poll", async () => {
      localStorageMock.getItem.mockReturnValue("[]");

      await addFormPoll(mockPoll);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        expect.stringContaining(mockPoll.id),
      );
    });

    it("should update existing form poll", async () => {
      // Reset mock before setting specific implementation
      localStorageMock.getItem.mockClear();

      const existingPolls = [mockPoll];
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify(existingPolls);
        return null;
      });

      const updatedPoll = { ...mockPoll, title: "Updated title" };
      await addFormPoll(updatedPoll);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        expect.stringContaining("Sondage formulaire"),
      );
    });

    it("should throw error for invalid poll", async () => {
      const invalidPoll = { ...mockPoll, title: "" };

      await expect(addFormPoll(invalidPoll)).rejects.toThrow();
    });
  });

  describe("deleteFormPollById", () => {
    it("should delete form poll by id", () => {
      // Reset mock before setting specific implementation
      localStorageMock.getItem.mockClear();

      const polls = [mockPoll];
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify(polls);
        return null;
      });

      deleteFormPollById(mockPoll.id);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("doodates_polls", expect.any(String));
    });

    it("should handle non-existent poll", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));

      deleteFormPollById("non_existent");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        JSON.stringify(polls),
      );
    });
  });

  describe("duplicateFormPoll", () => {
    it("should create a duplicate with new id and slug", () => {
      const duplicate = duplicateFormPoll(mockPoll);

      expect(duplicate.id).not.toBe(mockPoll.id);
      expect(duplicate.slug).not.toBe(mockPoll.slug);
      expect(duplicate.title).toBe("Sondage formulaire (copie)");
      expect(duplicate.id).toMatch(/^form_\d+_[a-z0-9]+$/);
    });
  });

  describe("getFormPollBySlugOrId", () => {
    it("should find poll by id", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));

      const found = getFormPollBySlugOrId(mockPoll.id);
      expect(found).toEqual(mockPoll);
    });

    it("should find poll by slug", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));

      const found = getFormPollBySlugOrId(mockPoll.slug);
      expect(found).toEqual(mockPoll);
    });

    it("should return null for not found", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));

      const found = getFormPollBySlugOrId("not_found");
      expect(found).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(getFormPollBySlugOrId("")).toBeNull();
      expect(getFormPollBySlugOrId(null)).toBeNull();
      expect(getFormPollBySlugOrId(undefined)).toBeNull();
    });
  });

  describe("addFormResponse", () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify([mockPoll]);
        if (key === "doodates_form_responses") return "[]";
        return null;
      });
    });

    it("should add a form response", () => {
      addFormResponse({
        pollId: mockPoll.id,
        items: [mockResponse],
        respondentName: "Test User",
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_form_responses",
        expect.stringContaining("resp_"),
      );
    });

    it("should throw error for non-existent poll", () => {
      expect(() => {
        addFormResponse({
          pollId: "non_existent",
          items: [mockResponse],
        });
      }).toThrow("Form poll not found");
    });

    it("should validate required answers", () => {
      const requiredQuestion = { ...mockQuestion, required: true };
      const pollWithRequired = { ...mockPoll, questions: [requiredQuestion] };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify([pollWithRequired]);
        if (key === "doodates_form_responses") return "[]";
        return null;
      });

      expect(() => {
        addFormResponse({
          pollId: pollWithRequired.id,
          items: [{ questionId: "q1", value: "" }],
        });
      }).toThrow("Missing required answer");
    });
  });

  describe("getFormResponses", () => {
    it("should return responses for specific poll", () => {
      const responses = [
        {
          id: "resp1",
          pollId: mockPoll.id,
          items: [mockResponse],
          created_at: "2025-01-01T10:00:00Z",
        },
        { id: "resp2", pollId: "other_poll", items: [], created_at: "2025-01-01T10:00:00Z" },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(responses));

      const pollResponses = getFormResponses(mockPoll.id);
      expect(pollResponses).toHaveLength(1);
      expect(pollResponses[0].id).toBe("resp1");
    });

    it("should return empty array for poll with no responses", () => {
      localStorageMock.getItem.mockReturnValue("[]");

      const responses = getFormResponses(mockPoll.id);
      expect(responses).toEqual([]);
    });
  });

  describe("getFormResults", () => {
    it("should calculate results for single choice questions", () => {
      const responses = [
        {
          id: "resp1",
          pollId: mockPoll.id,
          items: [mockResponse],
          created_at: "2025-01-01T10:00:00Z",
        },
        {
          id: "resp2",
          pollId: mockPoll.id,
          items: [{ questionId: "q1", value: "opt2" }],
          created_at: "2025-01-01T10:00:00Z",
        },
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify([mockPoll]);
        if (key === "doodates_form_responses") return JSON.stringify(responses);
        return null;
      });

      const results = getFormResults(mockPoll.id);

      expect(results.pollId).toBe(mockPoll.id);
      expect(results.totalResponses).toBe(2);
      expect(results.countsByQuestion["q1"]["opt1"]).toBe(1);
      expect(results.countsByQuestion["q1"]["opt2"]).toBe(1);
    });

    it("should throw error for non-existent poll", () => {
      expect(() => getFormResults("non_existent")).toThrow("Form poll not found");
    });

    it("should handle text questions", () => {
      const textQuestion: FormQuestionShape = {
        id: "q_text",
        kind: "text",
        title: "Text question",
      };
      const pollWithText = { ...mockPoll, questions: [textQuestion] };
      const responses = [
        {
          id: "resp1",
          pollId: pollWithText.id,
          items: [{ questionId: "q_text", value: "Answer 1" }],
          created_at: "2025-01-01T10:00:00Z",
        },
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "doodates_polls") return JSON.stringify([pollWithText]);
        if (key === "doodates_form_responses") return JSON.stringify(responses);
        return null;
      });

      const results = getFormResults(pollWithText.id);

      expect(results.textAnswers["q_text"]).toEqual(["Answer 1"]);
      expect(results.countsByQuestion["q_text"]).toBeUndefined();
    });
  });
});
