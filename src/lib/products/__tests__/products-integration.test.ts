import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPollType, createPollService } from "../index";
import * as datePollsService from "../date-polls";
import * as formPollsService from "../form-polls";

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

    it("should identify form polls by type", () => {
      const formPoll = { type: "form", id: "1", title: "Form Poll" };
      expect(getPollType(formPoll)).toBe("form");
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
      expect(service.getPolls).toBeDefined();
      expect(service.addPoll).toBeDefined();
    });

    it("should create form poll service", async () => {
      const service = await createPollService("form");
      expect(service).toBeDefined();
      expect(service.getPolls).toBeDefined();
      expect(service.addPoll).toBeDefined();
    });

    it("should throw error for unknown poll type", async () => {
      await expect(createPollService("unknown" as any)).rejects.toThrow("Unknown poll type: unknown");
    });
  });

  describe("Helper Functions", () => {
    it("should maintain consistent type detection", () => {
      const datePoll = { type: "date", settings: { selectedDates: ["2025-01-01"] } };
      const formPoll = { type: "form", questions: [] };

      expect(datePollsService.isDatePoll?.(datePoll)).toBe(true);
      expect(formPollsService.isFormPoll?.(formPoll)).toBe(true);

      expect(getPollType(datePoll)).toBe("date");
      expect(getPollType(formPoll)).toBe("form");
    });
  });
});
