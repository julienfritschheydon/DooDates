/**
 * Tests d'intégration pour les fonctionnalités de calendrier DooDates
 *
 * Ce fichier teste l'intégration entre les différents modules du système de calendrier :
 * - Génération des créneaux horaires avec différentes granularités (15min, 30min, 1h, etc.)
 * - Gestion des sélections de créneaux par date (ajout, suppression, toggle)
 * - Formatage des dates pour l'affichage dans l'interface utilisateur
 * - Validation des données de sondage (titres, emails)
 * - Workflow complet de création de sondage avec dates et créneaux
 *
 * Ces tests vérifient que tous les composants fonctionnent ensemble correctement
 * pour créer une expérience utilisateur fluide dans la création de sondages.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateTimeSlots,
  toggleTimeSlotForDate,
  formatSelectedDateHeader,
} from "../timeSlotFunctions";
import { validateEmail, validatePollTitle } from "../../utils/validation";

// Mock des hooks et contextes
vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe("Calendar Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Time Slot Generation", () => {
    it("should generate time slots with correct format", () => {
      const slots = generateTimeSlots(false, 30); // Normal hours, 30min

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty("hour");
      expect(slots[0]).toHaveProperty("minute");
      expect(slots[0]).toHaveProperty("label");
      expect(slots[0].label).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should generate more slots with extended hours", () => {
      const normalSlots = generateTimeSlots(false, 30);
      const extendedSlots = generateTimeSlots(true, 30);

      expect(extendedSlots.length).toBeGreaterThan(normalSlots.length);
    });

    it("should respect time granularity", () => {
      const slots30 = generateTimeSlots(false, 30);
      const slots60 = generateTimeSlots(false, 60);

      expect(slots60.length).toBeLessThan(slots30.length);

      // Check that all 60min slots have minute = 0
      slots60.forEach((slot) => {
        expect(slot.minute).toBe(0);
      });
    });
  });

  describe("Time Slot Management", () => {
    it("should toggle time slots correctly", () => {
      let timeSlotsByDate = {};

      // Add a time slot
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        9,
        0,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate["2025-07-01"]).toBeDefined();
      expect(timeSlotsByDate["2025-07-01"][0]).toEqual({
        hour: 9,
        minute: 0,
        enabled: true,
      });

      // Toggle it off
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        9,
        0,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate["2025-07-01"][0]).toEqual({
        hour: 9,
        minute: 0,
        enabled: false,
      });

      // Toggle it back on
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        9,
        0,
        timeSlotsByDate,
      );
      expect(timeSlotsByDate["2025-07-01"][0]).toEqual({
        hour: 9,
        minute: 0,
        enabled: true,
      });
    });

    it("should handle multiple time slots for same date", () => {
      let timeSlotsByDate = {};

      // Add multiple slots
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        9,
        0,
        timeSlotsByDate,
      );
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        14,
        30,
        timeSlotsByDate,
      );

      expect(timeSlotsByDate["2025-07-01"]).toHaveLength(2);
      expect(timeSlotsByDate["2025-07-01"]).toContainEqual({
        hour: 9,
        minute: 0,
        enabled: true,
      });
      expect(timeSlotsByDate["2025-07-01"]).toContainEqual({
        hour: 14,
        minute: 30,
        enabled: true,
      });
    });

    it("should handle multiple dates", () => {
      let timeSlotsByDate = {};

      // Add slots for different dates
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-01",
        9,
        0,
        timeSlotsByDate,
      );
      timeSlotsByDate = toggleTimeSlotForDate(
        "2025-07-02",
        14,
        0,
        timeSlotsByDate,
      );

      expect(Object.keys(timeSlotsByDate)).toHaveLength(2);
      expect(timeSlotsByDate["2025-07-01"]).toContainEqual({
        hour: 9,
        minute: 0,
        enabled: true,
      });
      expect(timeSlotsByDate["2025-07-02"]).toContainEqual({
        hour: 14,
        minute: 0,
        enabled: true,
      });
    });
  });

  describe("Date Formatting", () => {
    it("should format dates correctly", () => {
      const result = formatSelectedDateHeader("2025-07-01");

      expect(result).toHaveProperty("dayName");
      expect(result).toHaveProperty("dayNumber");
      expect(result).toHaveProperty("month");
      expect(result.dayNumber).toBe(1);
      expect(typeof result.dayName).toBe("string");
      expect(typeof result.month).toBe("string");
    });

    it("should handle different dates", () => {
      const testDates = [
        { date: "2025-01-15", expectedDay: 15 },
        { date: "2025-06-30", expectedDay: 30 },
        { date: "2025-12-25", expectedDay: 25 },
      ];

      testDates.forEach(({ date, expectedDay }) => {
        const result = formatSelectedDateHeader(date);
        expect(result.dayNumber).toBe(expectedDay);
        expect(result).toHaveProperty("dayName");
        expect(result).toHaveProperty("month");
      });
    });
  });

  describe("Validation Integration", () => {
    it("should validate poll data correctly", () => {
      expect(validatePollTitle("Réunion équipe")).toBe(true);
      expect(validateEmail("dev@company.com")).toBe(true);
      expect(validatePollTitle("")).toBe(false);
      expect(validateEmail("invalid")).toBe(false);
    });
  });

  describe("Complete Workflow", () => {
    it("should support a complete poll creation workflow", () => {
      // 1. Create poll configuration
      const pollConfig = {
        title: "Formation sécurité",
        description: "Formation obligatoire",
        dates: ["2025-07-15", "2025-07-16"],
        emails: ["user1@company.com", "user2@company.com"],
      };

      // 2. Validate basic data
      expect(validatePollTitle(pollConfig.title)).toBe(true);
      pollConfig.emails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });

      // 3. Generate time slots
      const availableSlots = generateTimeSlots(false, 30);
      expect(availableSlots.length).toBeGreaterThan(0);

      // 4. Configure time slots for dates
      let timeSlotsByDate = {};

      // Add morning slots for both dates
      pollConfig.dates.forEach((date) => {
        timeSlotsByDate = toggleTimeSlotForDate(date, 9, 0, timeSlotsByDate);
        timeSlotsByDate = toggleTimeSlotForDate(date, 14, 0, timeSlotsByDate);
      });

      // 5. Verify configuration
      expect(Object.keys(timeSlotsByDate)).toHaveLength(2);
      pollConfig.dates.forEach((date) => {
        expect(timeSlotsByDate[date]).toHaveLength(2);
        expect(timeSlotsByDate[date]).toContainEqual({
          hour: 9,
          minute: 0,
          enabled: true,
        });
        expect(timeSlotsByDate[date]).toContainEqual({
          hour: 14,
          minute: 0,
          enabled: true,
        });
      });

      // 6. Format dates for display
      const formattedDates = pollConfig.dates.map((date) =>
        formatSelectedDateHeader(date),
      );
      expect(formattedDates).toHaveLength(2);
      formattedDates.forEach((formatted) => {
        expect(formatted).toHaveProperty("dayName");
        expect(formatted).toHaveProperty("dayNumber");
        expect(formatted).toHaveProperty("month");
      });
    });
  });
});
