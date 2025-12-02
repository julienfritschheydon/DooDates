import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDatePolls,
  addDatePoll,
  deleteDatePollById,
  duplicateDatePoll,
  getDatePollBySlugOrId,
  saveDatePolls,
  buildPublicLink,
  copyToClipboard,
  validateDatePoll,
  type DatePoll,
  type DatePollSettings,
} from "../date-polls/date-polls-service";

const mockPoll: DatePoll = {
  id: "date_1",
  creator_id: "user_1",
  title: "Réunion d'équipe",
  description: "Réunion mensuelle",
  slug: "reunion-equipe",
  settings: {
    selectedDates: ["2025-01-15", "2025-01-16"],
    timeGranularity: 30,
    allowAnonymousVotes: true,
  } as DatePollSettings,
  status: "active",
  created_at: "2025-01-01T10:00:00Z",
  updated_at: "2025-01-01T10:00:00Z",
  type: "date",
  dates: ["2025-01-15", "2025-01-16"],
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe("DatePollsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "doodates_polls") return JSON.stringify([mockPoll]);
      return null;
    });
    localStorageMock.setItem.mockClear();
    Object.defineProperty(window, "isSecureContext", { value: true });
  });

  describe("validateDatePoll", () => {
    it("should validate a correct date poll", () => {
      expect(() => validateDatePoll(mockPoll)).not.toThrow();
    });

    it("should throw error for missing title", () => {
      const invalidPoll = { ...mockPoll, title: "" };
      const result = validateDatePoll(invalidPoll);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid date poll: title must be a non-empty string");
    });

    it("should throw error for missing selectedDates", () => {
      const invalidPoll = { ...mockPoll, settings: {} };
      const result = validateDatePoll(invalidPoll);
      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should throw error for empty selectedDates array", () => {
      const invalidPoll = { 
        ...mockPoll, 
        settings: { selectedDates: [] } 
      };
      const result = validateDatePoll(invalidPoll);
      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe("getDatePolls", () => {
    it("should return empty array when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getDatePolls()).toEqual([]);
    });

    it("should return date polls from localStorage", () => {
      localStorageMock.getItem.mockClear();
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      expect(getDatePolls()).toEqual(polls);
    });

    it("should filter out non-date polls", () => {
      localStorageMock.getItem.mockClear();
      const mixedPolls = [
        mockPoll,
        { type: "form", id: "form_1", title: "Form" },
        { type: "quizz", id: "quizz_1", title: "Quizz" },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mixedPolls));
      expect(getDatePolls()).toEqual([mockPoll]);
    });

    it("should handle malformed localStorage data", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");
      expect(getDatePolls()).toEqual([]);
    });
  });

  describe("addDatePoll", () => {
    it("should add a new date poll", async () => {
      localStorageMock.getItem.mockClear();
      localStorageMock.getItem.mockReturnValue(null);
      await addDatePoll(mockPoll);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        expect.stringContaining(mockPoll.id)
      );
    });

    it("should update existing date poll", async () => {
      localStorageMock.getItem.mockClear();
      const existingPolls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPolls));
      
      const updatedPoll = { ...mockPoll, title: "Updated title" };
      await addDatePoll(updatedPoll);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        expect.stringContaining("Réunion d'équipe")
      );
    });

    it("should throw error for invalid poll", async () => {
      const invalidPoll = { ...mockPoll, title: "" };
      
      await expect(addDatePoll(invalidPoll)).rejects.toThrow();
    });
  });

  describe("deleteDatePollById", () => {
    it("should delete date poll by id", () => {
      localStorageMock.getItem.mockClear();
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      deleteDatePollById(mockPoll.id);
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      deleteDatePollById(mockPoll.id);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        expect.any(String)
      );
    });

    it("should handle non-existent poll", () => {
      localStorageMock.getItem.mockClear();
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      deleteDatePollById("non_existent");
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      deleteDatePollById("non_existent");
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "doodates_polls",
        JSON.stringify(polls)
      );
    });
  });

  describe("duplicateDatePoll", () => {
    it("should create a duplicate with new id and slug", () => {
      const duplicate = duplicateDatePoll(mockPoll);
      
      expect(duplicate.id).not.toBe(mockPoll.id);
      expect(duplicate.slug).not.toBe(mockPoll.slug);
      expect(duplicate.title).toBe("Réunion d'équipe (copie)");
      expect(duplicate.id).toMatch(/^date_\d+_[a-z0-9]+$/);
    });
  });

  describe("getDatePollBySlugOrId", () => {
    it("should find poll by id", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      const found = getDatePollBySlugOrId(mockPoll.id);
      expect(found).toEqual(mockPoll);
    });

    it("should find poll by slug", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      const found = getDatePollBySlugOrId(mockPoll.slug);
      expect(found).toEqual(mockPoll);
    });

    it("should return null for not found", () => {
      const polls = [mockPoll];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(polls));
      
      const found = getDatePollBySlugOrId("not_found");
      expect(found).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(getDatePollBySlugOrId("")).toBeNull();
      expect(getDatePollBySlugOrId(null)).toBeNull();
      expect(getDatePollBySlugOrId(undefined)).toBeNull();
    });
  });

  describe("buildPublicLink", () => {
    it("should build correct public link", () => {
      Object.defineProperty(window, "location", {
        value: { origin: "https://example.com" },
        writable: true,
      });
      
      const link = buildPublicLink("test-poll");
      expect(link).toBe("https://example.com/poll/test-poll");
    });
  });

  describe("copyToClipboard", () => {
    it("should copy text using Clipboard API", async () => {
      await copyToClipboard("test text");
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test text");
    });

    it("should handle clipboard API unavailability", async () => {
      Object.defineProperty(navigator, "clipboard", { value: undefined });
      Object.defineProperty(document, "execCommand", {
        value: vi.fn().mockReturnValue(true),
        writable: true,
      });
      
      await copyToClipboard("test text");
      
      expect(document.execCommand).toHaveBeenCalledWith("copy");
    });
  });
});
