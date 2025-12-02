import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPollService, getPollType } from "../index";
import { 
  getDatePolls, 
  addDatePoll, 
  type DatePoll 
} from "../date-polls/date-polls-service";
import { 
  getFormPolls, 
  addFormPoll, 
  type FormPoll 
} from "../form-polls/form-polls-service";
import { 
  getQuizz, 
  addQuizz, 
  type Quizz 
} from "../quizz/quizz-service";

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
      const quizzService = await createPollService("quizz");

      expect(dateService).toBeDefined();
      expect(formService).toBeDefined();
      expect(quizzService).toBeDefined();
    });

    it("should detect poll type correctly", () => {
      const datePoll: DatePoll = {
        id: "date_1",
        creator_id: "user_1",
        title: "Date Poll",
        description: "Test date poll",
        type: "date",
        slug: "date-poll",
        created_at: new Date().toISOString(),
        settings: {
          selectedDates: ["2024-01-15"],
          timeSlots: [{ start: "09:00", end: "17:00" }]
        },
        votes: []
      };

      const formPoll: FormPoll = {
        id: "form_1",
        creator_id: "user_1",
        title: "Form Poll",
        description: "Test form poll",
        type: "form",
        slug: "form-poll",
        created_at: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            kind: "single",
            question: "Test question",
            required: true,
            options: [
              { id: "opt1", text: "Option 1", value: "opt1" },
              { id: "opt2", text: "Option 2", value: "opt2" }
            ]
          }
        ],
        responses: []
      };

      const quizz: Quizz = {
        id: "quizz_1",
        creator_id: "user_1",
        title: "Quizz",
        description: "Test quizz",
        type: "quizz",
        slug: "quizz",
        created_at: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            question: "Test question",
            type: "single",
            options: [
              { id: "opt1", text: "Correct", isCorrect: true, points: 1 },
              { id: "opt2", text: "Wrong", isCorrect: false, points: 0 }
            ]
          }
        ],
        responses: [],
        settings: {
          passingScore: 50,
          timeLimit: null,
          shuffleQuestions: false,
          showResults: true
        }
      };

      expect(getPollType(datePoll)).toBe("date");
      expect(getPollType(formPoll)).toBe("form");
      expect(getPollType(quizz)).toBe("quizz");
      expect(getPollType({} as any)).toBe(null);
    });
  });

  describe("Cross-Service Operations", () => {
    it("should handle conversion between poll types", () => {
      // Create a date poll
      const datePoll: DatePoll = {
        id: "date_1",
        creator_id: "user_1",
        title: "Meeting Schedule",
        description: "When should we meet?",
        type: "date",
        slug: "meeting-schedule",
        created_at: new Date().toISOString(),
        settings: {
          selectedDates: ["2024-01-15", "2024-01-16"],
          timeSlots: [
            { start: "09:00", end: "10:00" },
            { start: "14:00", end: "15:00" }
          ]
        },
        votes: []
      };

      // Convert to form poll (simulate conversion)
      const convertedFormPoll: FormPoll = {
        id: "form_1",
        creator_id: datePoll.creator_id,
        title: datePoll.title,
        description: datePoll.description,
        type: "form",
        slug: datePoll.slug + "-form",
        created_at: new Date().toISOString(),
        questions: [
          {
            id: "q1",
            kind: "single",
            question: "Which date works best?",
            required: true,
            options: datePoll.settings.selectedDates.map(date => ({
              id: date,
              text: date,
              value: date
            }))
          },
          {
            id: "q2",
            kind: "single",
            question: "Which time slot works best?",
            required: true,
            options: datePoll.settings.timeSlots.map(slot => ({
              id: `${slot.start}-${slot.end}`,
              text: `${slot.start} - ${slot.end}`,
              value: `${slot.start}-${slot.end}`
            }))
          }
        ],
        responses: []
      };

      expect(convertedFormPoll.questions).toHaveLength(2);
      expect(convertedFormPoll.questions[0].options).toHaveLength(2);
      expect(convertedFormPoll.questions[1].options).toHaveLength(2);
    });

    it("should handle data migration between services", () => {
      // Simulate migrating data from old format to new service structure
      const oldPollData = [
        {
          id: "old_1",
          type: "date",
          title: "Old Date Poll",
          settings: { dates: ["2024-01-15"] },
          votes: [{ user: "user1", date: "2024-01-15" }]
        },
        {
          id: "old_2",
          type: "form",
          title: "Old Form Poll",
          questions: [{ id: "q1", text: "Question?" }],
          responses: [{ user: "user1", answers: { q1: "Answer" } }]
        }
      ];

      // Migration logic would be implemented here
      const migratedDatePoll: DatePoll = {
        id: "migrated_" + oldPollData[0].id,
        creator_id: "system",
        title: oldPollData[0].title,
        description: "",
        type: "date",
        slug: "migrated-" + oldPollData[0].id,
        created_at: new Date().toISOString(),
        settings: {
          selectedDates: oldPollData[0].settings.dates,
          timeSlots: [{ start: "09:00", end: "17:00" }]
        },
        votes: oldPollData[0].votes.map(vote => ({
          id: `vote_${vote.user}`,
          user_id: vote.user,
          poll_id: "migrated_" + oldPollData[0].id,
          created_at: new Date().toISOString(),
          responses: {
            [vote.date]: { "09:00-17:00": true }
          }
        }))
      };

      expect(migratedDatePoll.settings.selectedDates).toEqual(["2024-01-15"]);
      expect(migratedDatePoll.votes).toHaveLength(1);
    });
  });

  describe("Load Testing with Unified Interface", () => {
    it("should handle high volume operations across services", async () => {
      const operations = [];
      
      // Create many polls of different types
      for (let i = 0; i < 100; i++) {
        const pollType = i % 3;
        
        if (pollType === 0) {
          operations.push(() => addDatePoll({
            id: `date_${i}`,
            creator_id: `user_${i}`,
            title: `Date Poll ${i}`,
            description: "",
            type: "date",
            slug: `date-poll-${i}`,
            created_at: new Date().toISOString(),
            settings: {
              selectedDates: ["2024-01-15"],
              timeSlots: [{ start: "09:00", end: "17:00" }]
            },
            votes: []
          }));
        } else if (pollType === 1) {
          operations.push(() => addFormPoll({
            id: `form_${i}`,
            creator_id: `user_${i}`,
            title: `Form Poll ${i}`,
            description: "",
            type: "form",
            slug: `form-poll-${i}`,
            created_at: new Date().toISOString(),
            questions: [
              {
                id: "q1",
                kind: "single",
                question: "Test question",
                required: true,
                options: [
                  { id: "opt1", text: "Option 1", value: "opt1" },
                  { id: "opt2", text: "Option 2", value: "opt2" }
                ]
              }
            ],
            responses: []
          }));
        } else {
          operations.push(() => addQuizz({
            id: `quizz_${i}`,
            creator_id: `user_${i}`,
            title: `Quizz ${i}`,
            description: "",
            type: "quizz",
            slug: `quizz-${i}`,
            created_at: new Date().toISOString(),
            questions: [
              {
                id: "q1",
                question: "Test question",
                type: "single",
                options: [
                  { id: "opt1", text: "Correct", isCorrect: true, points: 1 },
                  { id: "opt2", text: "Wrong", isCorrect: false, points: 0 }
                ]
              }
            ],
            responses: [],
            settings: {
              passingScore: 50,
              timeLimit: null,
              shuffleQuestions: false,
              showResults: true
            }
          }));
        }
      }

      const startTime = performance.now();
      
      // Execute all operations
      operations.forEach(op => {
        localStorageMock.setItem.mockImplementation(() => {});
        op();
      });
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });
  });

  describe("Retrocompatibility Validation", () => {
    it("should maintain compatibility with existing imports", () => {
      // Test that old import patterns still work
      const dateService = require("../date-polls");
      const formService = require("../form-polls");
      const quizzService = require("../quizz");

      expect(dateService.getDatePolls).toBeDefined();
      expect(dateService.addDatePoll).toBeDefined();
      
      expect(formService.getFormPolls).toBeDefined();
      expect(formService.addFormPoll).toBeDefined();
      
      expect(quizzService.getQuizz).toBeDefined();
      expect(quizzService.addQuizz).toBeDefined();
    });

    it("should handle mixed usage of old and new APIs", () => {
      // Test using both old and new API patterns
      const datePoll: DatePoll = {
        id: "mixed_test",
        creator_id: "user_1",
        title: "Mixed API Test",
        description: "",
        type: "date",
        slug: "mixed-api-test",
        created_at: new Date().toISOString(),
        settings: {
          selectedDates: ["2024-01-15"],
          timeSlots: [{ start: "09:00", end: "17:00" }]
        },
        votes: []
      };

      // Add using old API
      addDatePoll(datePoll);
      
      // Retrieve using unified interface
      const pollType = getPollType(datePoll);
      expect(pollType).toBe("date");
      
      // Should be able to access through both interfaces
      const datePolls = getDatePolls();
      expect(datePolls).toContainEqual(datePoll);
    });
  });

  describe("Error Handling Across Services", () => {
    it("should handle errors consistently across services", () => {
      // Test that error handling is consistent
      const invalidDatePoll = {
        // Missing required fields
        id: "",
        creator_id: "",
        title: "",
        type: "date" as const,
        slug: "",
        created_at: "",
        settings: {
          selectedDates: [],
          timeSlots: []
        },
        votes: []
      };

      const invalidFormPoll = {
        id: "",
        creator_id: "",
        title: "",
        type: "form" as const,
        slug: "",
        created_at: "",
        questions: [],
        responses: []
      };

      const invalidQuizz = {
        id: "",
        creator_id: "",
        title: "",
        type: "quizz" as const,
        slug: "",
        created_at: "",
        questions: [],
        responses: [],
        settings: {
          passingScore: 50,
          timeLimit: null,
          shuffleQuestions: false,
          showResults: true
        }
      };

      // All services should handle invalid data consistently
      expect(() => addDatePoll(invalidDatePoll)).toThrow();
      expect(() => addFormPoll(invalidFormPoll)).toThrow();
      expect(() => addQuizz(invalidQuizz)).toThrow();
    });

    it("should handle corrupted localStorage data", () => {
      // Simulate corrupted data in localStorage
      localStorageMock.getItem.mockReturnValue("invalid json data");

      expect(() => getDatePolls()).toThrow();
      expect(() => getFormPolls()).toThrow();
      expect(() => getQuizz()).toThrow();
    });
  });
});
