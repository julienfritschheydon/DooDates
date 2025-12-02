import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPollType, createPollService } from "../index";
import * as datePollsService from "../date-polls";
import * as formPollsService from "../form-polls";
import * as quizzService from "../quizz";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Products Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("getPollType", () => {
    it("should identify date polls by type", () => {
      const datePoll = { type: "date", id: "1", title: "Date Poll" };
      expect(getPollType(datePoll)).toBe("date");
    });

    it("should identify date polls by selectedDates", () => {
      const datePoll = { 
        settings: { selectedDates: ["2025-01-01"] }, 
        id: "1", 
        title: "Date Poll" 
      };
      expect(getPollType(datePoll)).toBe("date");
    });

    it("should identify form polls by type", () => {
      const formPoll = { type: "form", id: "1", title: "Form Poll" };
      expect(getPollType(formPoll)).toBe("form");
    });

    it("should identify form polls by questions", () => {
      const formPoll = { 
        questions: [{ id: "q1", title: "Question", kind: "single" }], 
        id: "1", 
        title: "Form Poll" 
      };
      expect(getPollType(formPoll)).toBe("form");
    });

    it("should identify quizz by type and questions", () => {
      const quizz = { 
        type: "quizz", 
        questions: [{ id: "q1", question: "Question?", type: "single" }], 
        id: "1", 
        title: "Quizz" 
      };
      expect(getPollType(quizz)).toBe("quizz");
    });

    it("should return null for unknown poll type", () => {
      const unknown = { id: "1", title: "Unknown" };
      expect(getPollType(unknown)).toBeNull();
    });

    it("should return null for null/undefined input", () => {
      expect(getPollType(null)).toBeNull();
      expect(getPollType(undefined)).toBeNull();
    });
  });

  describe("createPollService", () => {
    it("should create date poll service", async () => {
      const service = await createPollService("date");
      expect(service).toBeDefined();
      // The service should be the module export
      expect(service).toEqual(expect.objectContaining({
        getDatePolls: expect.any(Function),
        addDatePoll: expect.any(Function),
      }));
    });

    it("should create form poll service", async () => {
      const service = await createPollService("form");
      expect(service).toBeDefined();
      expect(service).toEqual(expect.objectContaining({
        getFormPolls: expect.any(Function),
        addFormPoll: expect.any(Function),
      }));
    });

    it("should create quizz service", async () => {
      const service = await createPollService("quizz");
      expect(service).toBeDefined();
      expect(service).toEqual(expect.objectContaining({
        getQuizz: expect.any(Function),
        addQuizz: expect.any(Function),
      }));
    });

    it("should throw error for unknown poll type", async () => {
      await expect(createPollService("unknown" as any)).rejects.toThrow("Unknown poll type: unknown");
    });
  });

  describe("Cross-Service Data Isolation", () => {
    it("should maintain separate storage for different poll types", async () => {
      // Setup mock data
      const datePoll = {
        id: "date_1",
        type: "date",
        title: "Date Poll",
        slug: "date-poll",
        creator_id: "user1",
        status: "active" as const,
        created_at: "2025-01-01T10:00:00Z",
        updated_at: "2025-01-01T10:00:00Z",
        settings: { selectedDates: ["2025-01-01"] },
      };

      const formPoll = {
        id: "form_1",
        type: "form",
        title: "Form Poll",
        slug: "form-poll",
        creator_id: "user1",
        status: "active" as const,
        created_at: "2025-01-01T10:00:00Z",
        updated_at: "2025-01-01T10:00:00Z",
        questions: [{ id: "q1", kind: "single", title: "Question" }],
      };

      const quizz = {
        id: "quizz_1",
        type: "quizz",
        title: "Quizz",
        slug: "quizz",
        creator_id: "user1",
        status: "active" as const,
        created_at: "2025-01-01T10:00:00Z",
        updated_at: "2025-01-01T10:00:00Z",
        questions: [{ id: "q1", question: "Question?", type: "single" as const, correctAnswer: "A", options: ["A", "B"] }],
        maxPoints: 10,
      };

      // Mock localStorage to return mixed data
      localStorageMock.getItem.mockReturnValue(JSON.stringify([datePoll, formPoll, quizz]));

      // Verify each service only returns its own type
      const datePolls = datePollsService.getDatePolls();
      const formPolls = formPollsService.getFormPolls();
      const quizzList = quizzService.getQuizz();

      expect(datePolls).toHaveLength(1);
      expect(datePolls[0].type).toBe("date");

      expect(formPolls).toHaveLength(1);
      expect(formPolls[0].type).toBe("form");

      expect(quizzList).toHaveLength(1);
      expect(quizzList[0].type).toBe("quizz");
    });
  });

  describe("Helper Functions Consistency", () => {
    it("should maintain consistent type detection across services", () => {
      const datePoll = { type: "date", settings: { selectedDates: ["2025-01-01"] } };
      const formPoll = { type: "form", questions: [] };
      const quizz = { type: "quizz", questions: [] };

      // Test individual service helpers
      expect(datePollsService.isDatePoll?.(datePoll)).toBe(true);
      expect(formPollsService.isFormPoll?.(formPoll)).toBe(true);
      expect(quizzService.isQuizz?.(quizz)).toBe(true);

      // Test unified helper
      expect(getPollType(datePoll)).toBe("date");
      expect(getPollType(formPoll)).toBe("form");
      expect(getPollType(quizz)).toBe("quizz");
    });
  });

  describe("Unified Interface Compliance", () => {
    it("should provide consistent CRUD interface across services", async () => {
      const dateService = await createPollService("date");
      const formService = await createPollService("form");
      const quizzService = await createPollService("quizz");

      // Check that all services have the same basic CRUD methods
      const expectedMethods = [
        "getPolls", "addPoll", "deletePollById", 
        "duplicatePoll", "getPollBySlugOrId", "savePolls"
      ];

      expectedMethods.forEach(method => {
        expect(dateService[method]).toBeDefined();
        expect(formService[method]).toBeDefined();
        expect(quizzService[method]).toBeDefined();
      });
    });

    it("should provide type-specific methods where appropriate", async () => {
      const formService = await createPollService("form");
      const quizzService = await createPollService("quizz");

      // Form-specific methods
      expect(formService.addFormResponse).toBeDefined();
      expect(formService.getFormResponses).toBeDefined();
      expect(formService.getFormResults).toBeDefined();

      // Quizz-specific methods
      expect(quizzService.addQuizzResponse).toBeDefined();
      expect(quizzService.getQuizzResponses).toBeDefined();
      expect(quizzService.getQuizzResults).toBeDefined();
    });
  });

  describe("Error Handling Consistency", () => {
    it("should use consistent error handling across services", async () => {
      // Test that all services use ErrorFactory for validation errors
      const invalidDatePoll = { type: "date", title: "", settings: { selectedDates: [] } };
      const invalidFormPoll = { type: "form", title: "", questions: [] };
      const invalidQuizz = { type: "quizz", title: "", questions: [] };

      // All should throw validation errors with consistent structure
      expect(() => datePollsService.validateDatePoll?.(invalidDatePoll)).toThrow();
      expect(() => formPollsService.validateFormPoll?.(invalidFormPoll)).toThrow();
      expect(() => quizzService.validateQuizz?.(invalidQuizz)).toThrow();
    });
  });

  describe("Storage Key Consistency", () => {
    it("should use consistent storage keys across services", () => {
      // All services should use the same main storage key for polls
      // This ensures they share the same localStorage space but filter by type
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(0); // Initially no calls
      
      // When we call any service method, they should use the same storage key
      localStorageMock.getItem.mockReturnValue("[]");
      
      datePollsService.getDatePolls();
      formPollsService.getFormPolls();
      quizzService.getQuizz();

      // All should have called getItem with the same key
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(3);
      localStorageMock.getItem.mock.calls.forEach(call => {
        expect(call[0]).toBe("doodates_polls");
      });
    });
  });
});
