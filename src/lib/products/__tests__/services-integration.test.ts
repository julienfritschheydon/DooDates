import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPollService, getPollType } from "../index";
import { getDatePolls, addDatePoll, type DatePoll } from "../date-polls/date-polls-service";
import { getFormPolls, addFormPoll, type FormPoll } from "../form-polls/form-polls-service";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal("localStorage", localStorageMock);

describe("Services Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("Unified Interface", () => {
    it("should create service using factory function", async () => {
      const dateService = await createPollService("date");
      const formService = await createPollService("form");

      expect(dateService).toBeDefined();
      expect(formService).toBeDefined();
    });

    it("should detect poll type correctly", () => {
      const datePoll: DatePoll = {
        id: "date_1",
        creator_id: "user_1",
        title: "Date Poll",
        description: "Test date poll",
        type: "date",
        slug: "date-poll",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          selectedDates: ["2024-01-15"],
        },
      };

      const formPoll: FormPoll = {
        id: "form_1",
        creator_id: "user_1",
        title: "Form Poll",
        description: "Test form poll",
        type: "form",
        slug: "form-poll",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            kind: "single",
            title: "Test question",
            required: true,
            options: [
              { id: "opt1", label: "Option 1" },
              { id: "opt2", label: "Option 2" },
            ],
          },
        ],
      };

      expect(getPollType(datePoll)).toBe("date");
      expect(getPollType(formPoll)).toBe("form");
      expect(getPollType({} as any)).toBe(null);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors consistently across services", async () => {
      const now = new Date().toISOString();

      const invalidDatePoll: DatePoll = {
        id: "invalid_date",
        creator_id: "user",
        title: "",
        type: "date",
        slug: "invalid",
        status: "active",
        created_at: now,
        updated_at: now,
        settings: {
          selectedDates: [],
        },
      };

      const invalidFormPoll: FormPoll = {
        id: "invalid_form",
        creator_id: "user",
        title: "",
        type: "form",
        slug: "invalid",
        status: "active",
        created_at: now,
        updated_at: now,
        questions: [],
      };

      await expect(addDatePoll(invalidDatePoll)).rejects.toThrow();
      await expect(addFormPoll(invalidFormPoll)).rejects.toThrow();
    });

    it("should handle corrupted localStorage data gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid json data");

      expect(getDatePolls()).toEqual([]);
      expect(getFormPolls()).toEqual([]);
    });
  });
});
