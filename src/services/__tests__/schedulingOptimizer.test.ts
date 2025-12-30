import { describe, it, expect, vi } from "vitest";
import { optimizeSchedule, type SchedulingRules } from "../schedulingOptimizer";
import { formatDateLocal } from "@/lib/date-utils";

// Mock des utilitaires de date pour avoir des tests déterministes
const MOCK_TODAY = "2025-01-01"; // Mercredi

vi.mock("@/lib/date-utils", async () => {
  const actual = await vi.importActual("@/lib/date-utils");
  return {
    ...actual,
    getTodayLocal: () => "2025-01-01",
  };
});

describe("schedulingOptimizer", () => {
  // Helper pour générer des dates relatives
  const getDate = (daysFromNow: number) => {
    const d = new Date(MOCK_TODAY);
    d.setDate(d.getDate() + daysFromNow);
    return formatDateLocal(d);
  };

  describe("Slot Finding Logic", () => {
    it("should break down a time range into 1-hour slots", async () => {
      const availabilities = [
        {
          date: getDate(1), // Demain
          timeRanges: [{ start: "09:00", end: "12:00" }],
        },
      ];

      const slots = await optimizeSchedule(availabilities, {}, undefined);

      // 09-10, 10-11, 11-12
      expect(slots).toHaveLength(3);
      expect(slots.map((s) => s.start)).toEqual(
        expect.arrayContaining(["09:00", "10:00", "11:00"]),
      );
    });

    it("should respect busy slots from calendar", async () => {
      const date = getDate(1);
      const availabilities = [
        {
          date: date,
          timeRanges: [{ start: "09:00", end: "12:00" }],
        },
      ];

      // Mock Calendar Service
      const mockCalendarService = {
        getFreeBusy: async () => [
          {
            start: `${date}T10:00:00`,
            end: `${date}T11:00:00`,
          },
        ],
      } as any;

      const slots = await optimizeSchedule(availabilities, {}, mockCalendarService);

      // Devrait retourner 09-10 et 11-12, mais PAS 10-11
      expect(slots).toHaveLength(2);
      expect(slots.find((s) => s.start === "09:00")).toBeDefined();
      expect(slots.find((s) => s.start === "11:00")).toBeDefined();
      expect(slots.find((s) => s.start === "10:00")).toBeUndefined();
    });
  });

  describe("Scoring Logic", () => {
    it("should prioritize near-term slots", async () => {
      const tomorrow = getDate(1);
      const nextMonth = getDate(30);

      const availabilities = [
        { date: tomorrow, timeRanges: [{ start: "10:00", end: "11:00" }] },
        { date: nextMonth, timeRanges: [{ start: "10:00", end: "11:00" }] },
      ];

      const rules: SchedulingRules = { preferNearTerm: true };
      const slots = await optimizeSchedule(availabilities, rules, undefined);

      const tomorrowSlot = slots.find((s) => s.date === tomorrow);
      const nextMonthSlot = slots.find((s) => s.date === nextMonth);

      expect(tomorrowSlot?.score).toBeGreaterThan(nextMonthSlot?.score || 0);
      expect(tomorrowSlot?.reasons).toContain("Créneau très proche (< 2 jours)");
    });

    it("should prioritize slots that minimize gaps (before/after busy slots)", async () => {
      const date = getDate(2);
      const availabilities = [
        {
          date: date,
          timeRanges: [{ start: "09:00", end: "12:00" }], // 09, 10, 11
        },
      ];

      // Busy à 08:00-09:00 (juste avant 09:00)
      const mockCalendarService = {
        getFreeBusy: async () => [
          {
            start: `${date}T08:00:00`,
            end: `${date}T09:00:00`,
          },
        ],
      } as any;

      const slots = await optimizeSchedule(availabilities, {}, mockCalendarService);
      const slot9am = slots.find((s) => s.start === "09:00");
      const slot11am = slots.find((s) => s.start === "11:00");

      // 09:00 colle au busy slot -> Bonus gap
      // 11:00 est isolé -> Pas de bonus
      expect(slot9am?.score).toBeGreaterThan(slot11am?.score || 0);
      expect(slot9am?.reasons?.some((r) => r.includes("Remplit un gap"))).toBe(true);
    });

    it("should prioritize preferred times", async () => {
      const friday = "2025-01-03"; // Vendredi (si mock today = Mercredi 01)
      const availabilities = [
        {
          date: friday,
          timeRanges: [{ start: "09:00", end: "11:00" }], // 09h (pref), 10h (non pref)
        },
      ];

      const rules: SchedulingRules = {
        preferredTimes: [{ day: "vendredi", start: "09:00", end: "10:00" }],
      };

      const slots = await optimizeSchedule(availabilities, rules, undefined);

      const prefSlot = slots.find((s) => s.start === "09:00");
      const standardSlot = slots.find((s) => s.start === "10:00");

      expect(prefSlot?.score).toBeGreaterThan(standardSlot?.score || 0);
      expect(prefSlot?.reasons).toContain("Dans les heures préférées");
    });
  });

  describe("Half-Day Grouping (Advanced Logic)", () => {
    it("should bonus slots that form a half-day block", async () => {
      const date = getDate(5);
      // Dispo toute la matinée 09-12 (3 créneaux de 1h)
      const availabilities = [
        {
          date: date,
          timeRanges: [{ start: "09:00", end: "12:00" }],
        },
      ];

      const rules: SchedulingRules = { preferHalfDays: true };
      const slots = await optimizeSchedule(availabilities, rules, undefined);

      // Tous les slots 9, 10, 11 forment un bloc "Matin" continu
      // Ils devraient tous avoir le bonus
      slots.forEach((slot) => {
        expect(slot.score).toBeGreaterThan(70); // 50 base + 25 bonus
        expect(slot.reasons?.some((r) => r.includes("demi-journée complète"))).toBe(true);
      });
    });

    it("should NOT bonus scattered slots", async () => {
      const date = getDate(6);
      // Dispo trouée: 09-10 et 11-12 (manque 10-11)
      const availabilities = [
        {
          date: date,
          timeRanges: [
            { start: "09:00", end: "10:00" },
            { start: "11:00", end: "12:00" },
          ],
        },
      ];

      const rules: SchedulingRules = { preferHalfDays: true };
      const slots = await optimizeSchedule(availabilities, rules, undefined);

      slots.forEach((slot) => {
        expect(slot.reasons?.some((r) => r.includes("demi-journée complète"))).toBe(false);
      });
    });
  });
});
