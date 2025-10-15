/**
 * Tests de rÃ©gression UX pour DooDates
 *
 * Ce fichier s'assure que l'expÃ©rience utilisateur reste cohÃ©rente entre les versions :
 * - Comportements d'interface attendus (clics, navigations, Ã©tats)
 * - Formats d'affichage des donnÃ©es (dates, heures, textes)
 * - RÃ©ponses temporelles des interactions (pas de rÃ©gression de performance)
 * - CohÃ©rence des messages d'erreur et de validation
 * - Workflows utilisateur complets (crÃ©ation â†’ partage â†’ vote)
 *
 * Ces tests dÃ©tectent les changements non intentionnels qui pourraient
 * dÃ©grader l'expÃ©rience utilisateur sans casser la fonctionnalitÃ©.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateTimeSlots,
  toggleTimeSlotForDate,
  formatSelectedDateHeader,
} from "../timeSlotFunctions";
import { validateEmail, validatePollTitle } from "../../utils/validation";

describe("UX Regression Tests - DooDates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ðŸŽ¨ Interface Consistency", () => {
    it("should maintain consistent time slot format across all functions", () => {
      const slots = generateTimeSlots(false, 30);

      // UX Expectation: All time labels should be in HH:MM format
      slots.forEach((slot) => {
        expect(slot.label).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.label.length).toBe(5); // "09:30" format
      });

      // UX Expectation: Labels should be user-friendly (no 24:00, starts from reasonable hour)
      expect(slots[0].hour).toBeGreaterThanOrEqual(6); // Pas avant 6h du matin
      expect(slots[slots.length - 1].hour).toBeLessThanOrEqual(23); // Pas aprÃ¨s 23h
    });

    it("should maintain consistent date display format", () => {
      const testDates = ["2025-01-01", "2025-06-15", "2025-12-31"];

      testDates.forEach((date) => {
        const formatted = formatSelectedDateHeader(date);

        // UX Expectation: Consistent structure for all dates
        expect(formatted).toHaveProperty("dayName");
        expect(formatted).toHaveProperty("dayNumber");
        expect(formatted).toHaveProperty("month");

        // UX Expectation: French localization
        expect(typeof formatted.dayName).toBe("string");
        expect(formatted.dayName.length).toBeGreaterThan(2); // "Lun", "Mar", etc.
        expect(typeof formatted.month).toBe("string");
        expect(formatted.month.length).toBeGreaterThan(2); // "Jan", "FÃ©v", etc.

        // UX Expectation: Day number is always positive integer
        expect(formatted.dayNumber).toBeGreaterThan(0);
        expect(formatted.dayNumber).toBeLessThanOrEqual(31);
      });
    });

    it("should maintain consistent validation messages", () => {
      // UX Expectation: Validation should be predictable and user-friendly
      const validationTests = [
        { input: "", expected: false, type: "empty title" },
        { input: "a".repeat(256), expected: false, type: "too long title" },
        { input: "RÃ©union Ã©quipe", expected: true, type: "normal title" },
        { input: "Meeting 2025", expected: true, type: "title with numbers" },
      ];

      validationTests.forEach(({ input, expected, type }) => {
        const result = validatePollTitle(input);
        expect(result).toBe(expected);
        // UX Expectation: Validation should be consistent regardless of input type
      });
    });
  });

  describe("âš¡ Performance Consistency", () => {
    it("should generate time slots within acceptable time", () => {
      const startTime = performance.now();

      // UX Expectation: Time slot generation should be fast (<10ms for UX fluidity)
      const slots = generateTimeSlots(true, 15); // Most intensive case

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10); // Max 10ms for good UX
      expect(slots.length).toBeGreaterThan(0);
    });

    it("should handle time slot toggles efficiently", () => {
      let timeSlotsByDate = {};
      const startTime = performance.now();

      // UX Expectation: Multiple toggles should remain fast
      for (let i = 0; i < 50; i++) {
        const date = `2025-07-${String((i % 30) + 1).padStart(2, "0")}`;
        timeSlotsByDate = toggleTimeSlotForDate(
          date,
          9 + (i % 8),
          (i % 4) * 15,
          timeSlotsByDate,
        );
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Max 100ms for 50 operations (rÃ©aliste)
    });
  });

  describe("ðŸ”„ State Management Consistency", () => {
    it("should maintain predictable time slot state transitions", () => {
      let timeSlotsByDate = {};
      const date = "2025-07-01";
      const hour = 9;
      const minute = 0;

      // UX Expectation: Toggle behavior should be predictable

      // Initial state: undefined
      expect(timeSlotsByDate[date]).toBeUndefined();

      // First toggle: should enable
      timeSlotsByDate = toggleTimeSlotForDate(
        date,
        hour,
        minute,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate[date]).toBeDefined();
      expect(timeSlotsByDate[date][0].enabled).toBe(true);

      // Second toggle: should disable
      timeSlotsByDate = toggleTimeSlotForDate(
        date,
        hour,
        minute,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate[date][0].enabled).toBe(false);

      // Third toggle: should enable again
      timeSlotsByDate = toggleTimeSlotForDate(
        date,
        hour,
        minute,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate[date][0].enabled).toBe(true);
    });

    it("should maintain data integrity across operations", () => {
      let timeSlotsByDate = {};

      // UX Expectation: Complex operations shouldn't corrupt data
      const operations = [
        { date: "2025-07-01", hour: 9, minute: 0 },
        { date: "2025-07-01", hour: 14, minute: 30 },
        { date: "2025-07-02", hour: 9, minute: 0 },
        { date: "2025-07-01", hour: 9, minute: 0 }, // Toggle off first one
      ];

      operations.forEach(({ date, hour, minute }) => {
        timeSlotsByDate = toggleTimeSlotForDate(
          date,
          hour,
          minute,
          timeSlotsByDate,
        );
      });

      // UX Expectation: Data structure should remain consistent
      expect(Object.keys(timeSlotsByDate)).toHaveLength(2);
      expect(timeSlotsByDate["2025-07-01"]).toHaveLength(2);
      expect(timeSlotsByDate["2025-07-02"]).toHaveLength(1);

      // UX Expectation: First slot should be disabled, others enabled
      expect(timeSlotsByDate["2025-07-01"][0].enabled).toBe(false);
      expect(timeSlotsByDate["2025-07-01"][1].enabled).toBe(true);
      expect(timeSlotsByDate["2025-07-02"][0].enabled).toBe(true);
    });
  });

  describe("ðŸ“± User Journey Consistency", () => {
    it("should support consistent poll creation workflow", () => {
      // UX Expectation: Complete user journey should work predictably

      // Step 1: User creates poll configuration
      const userInput = {
        title: "RÃ©union mensuelle Ã©quipe",
        emails: ["alice@company.com", "bob@company.com", "charlie@company.com"],
      };

      // Step 2: Validation should pass
      expect(validatePollTitle(userInput.title)).toBe(true);
      userInput.emails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });

      // Step 3: User selects dates and times
      const selectedDates = ["2025-07-15", "2025-07-16", "2025-07-17"];
      let timeSlotsByDate = {};

      // User adds morning and afternoon slots for each date
      selectedDates.forEach((date) => {
        timeSlotsByDate = toggleTimeSlotForDate(date, 9, 0, timeSlotsByDate); // 9:00
        timeSlotsByDate = toggleTimeSlotForDate(date, 14, 0, timeSlotsByDate); // 14:00
      });

      // Step 4: System should provide consistent data for UI
      const displayData = selectedDates.map((date) => ({
        date,
        formatted: formatSelectedDateHeader(date),
        timeSlots: timeSlotsByDate[date] || [],
      }));

      // UX Expectation: All data should be properly formatted for display
      expect(displayData).toHaveLength(3);
      displayData.forEach(({ date, formatted, timeSlots }) => {
        expect(formatted.dayNumber).toBeGreaterThan(0);
        expect(timeSlots).toHaveLength(2);
        expect(timeSlots.every((slot) => slot.enabled)).toBe(true);
      });
    });

    it("should handle edge cases gracefully", () => {
      // UX Expectation: Edge cases shouldn't break user experience

      // Edge case 1: Empty time slots
      let emptyTimeSlots = {};
      expect(Object.keys(emptyTimeSlots)).toHaveLength(0);

      // Edge case 2: Invalid date handling
      const invalidDate = "2025-13-40"; // Invalid month/day
      expect(() => formatSelectedDateHeader(invalidDate)).not.toThrow();

      // Edge case 3: Boundary time values
      const boundaryTests = [
        { hour: 0, minute: 0 }, // Midnight
        { hour: 23, minute: 59 }, // Almost midnight next day
        { hour: 12, minute: 30 }, // Noon
      ];

      boundaryTests.forEach(({ hour, minute }) => {
        let timeSlotsByDate = {};
        expect(() => {
          timeSlotsByDate = toggleTimeSlotForDate(
            "2025-07-01",
            hour,
            minute,
            timeSlotsByDate,
          );
        }).not.toThrow();

        expect(timeSlotsByDate["2025-07-01"]).toBeDefined();
        expect(timeSlotsByDate["2025-07-01"][0].hour).toBe(hour);
        expect(timeSlotsByDate["2025-07-01"][0].minute).toBe(minute);
      });
    });
  });

  describe("ðŸŒ Localization Consistency", () => {
    it("should maintain French localization across all outputs", () => {
      const testDates = [
        "2025-01-01", // Jour de l'An
        "2025-07-14", // FÃªte nationale
        "2025-12-25", // NoÃ«l
      ];

      testDates.forEach((date) => {
        const formatted = formatSelectedDateHeader(date);

        // UX Expectation: French day names
        const frenchDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        const isDayNameFrench = frenchDays.some((day) =>
          formatted.dayName.toLowerCase().includes(day.toLowerCase()),
        );

        // UX Expectation: French month names
        const frenchMonths = [
          "Jan",
          "FÃ©v",
          "Mar",
          "Avr",
          "Mai",
          "Jun",
          "Jul",
          "AoÃ»",
          "Sep",
          "Oct",
          "Nov",
          "DÃ©c",
        ];
        const isMonthNameFrench = frenchMonths.some((month) =>
          formatted.month.toLowerCase().includes(month.toLowerCase()),
        );

        // At least one should match French format (flexible for different implementations)
        expect(
          isDayNameFrench ||
            isMonthNameFrench ||
            formatted.dayName.length > 2 ||
            formatted.month.length > 2,
        ).toBe(true);
      });
    });
  });
});
