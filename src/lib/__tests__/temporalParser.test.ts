/**
 * Tests unitaires pour le parser temporel
 */

import { describe, it, expect, beforeEach } from "vitest";
import { parseTemporalInput, clearParsingCache, ParsedTemporalInput } from "../temporalParser";

describe("temporalParser", () => {
  beforeEach(() => {
    clearParsingCache();
  });

  describe("Dates spécifiques", () => {
    it("devrait détecter 'demain' comme date spécifique", async () => {
      const result = await parseTemporalInput("rendez-vous demain");
      expect(result.type).toBe("specific_date");
      expect(result.expectedDatesCount).toBe(1);
      expect(result.allowedDates.length).toBeGreaterThan(0);
    });

    it("devrait détecter 'lundi' comme jour de la semaine", async () => {
      const result = await parseTemporalInput("réunion lundi");
      expect(result.type).toBe("day_of_week");
      expect(result.dayOfWeek).toEqual([1]); // Lundi = 1
      expect(result.expectedDatesCount).toBe(1);
    });

    it("devrait détecter 'samedi 23' comme date numérique", async () => {
      const result = await parseTemporalInput("brunch samedi 23");
      expect(result.type).toBe("specific_date");
      expect(result.dateNumeric?.day).toBe(23);
      expect(result.dateNumeric?.dayOfWeek).toBe(6); // Samedi = 6
    });
  });

  describe("Mois explicites", () => {
    it("devrait détecter 'décembre' comme mois", async () => {
      const result = await parseTemporalInput("séance photo en décembre");
      expect(result.type).toBe("month");
      expect(result.month).toBe(11); // Décembre = 11
      expect(result.allowedDates.length).toBeGreaterThan(0);
    });

    it("devrait détecter 'fin mars' comme période", async () => {
      const result = await parseTemporalInput("escape game fin mars");
      expect(result.type).toBe("month");
      expect(result.month).toBe(2); // Mars = 2
      expect(result.period).toBe("end");
    });
  });

  describe("Expressions relatives", () => {
    it("devrait détecter 'dans 5 jours' comme période relative", async () => {
      const result = await parseTemporalInput("rendez-vous dans 5 jours");
      expect(result.type).toBe("relative");
      expect(result.relativeDays).toBe(5);
      expect(result.expectedDatesCount).toBe("3-5");
    });

    it("devrait détecter 'lundi dans 2 semaines' comme jour + période", async () => {
      const result = await parseTemporalInput("réunion lundi dans 2 semaines");
      expect(result.type).toBe("day_of_week");
      expect(result.dayOfWeek).toEqual([1]); // Lundi = 1
      expect(result.relativeWeeks).toBe(2);
      expect(result.expectedDatesCount).toBe("1-2");
    });
  });

  describe("Contexte repas", () => {
    it("devrait détecter le contexte repas", async () => {
      const result = await parseTemporalInput("déjeuner demain midi");
      expect(result.isMealContext).toBe(true);
      expect(result.type).toBe("specific_date");
      expect(result.expectedDatesCount).toBe(1);
      expect(result.expectedSlotsCount).toBe("2-3"); // Exception partenariats
    });

    it("devrait détecter 'déjeuner partenariats mercredi'", async () => {
      const result = await parseTemporalInput(
        "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.",
      );
      expect(result.isMealContext).toBe(true);
      expect(result.dayOfWeek).toEqual([3]); // Mercredi = 3
      expect(result.expectedDatesCount).toBe(1);
      expect(result.expectedSlotsCount).toBe("2-3");
    });
  });

  describe("Contexte professionnel", () => {
    it("devrait détecter le contexte professionnel", async () => {
      const result = await parseTemporalInput("réunion équipe semaine prochaine");
      expect(result.isProfessionalContext).toBe(true);
      // Les dates du week-end devraient être exclues
      const weekendDates = result.allowedDates.filter((date) => {
        const d = new Date(date);
        const day = d.getDay();
        return day === 0 || day === 6; // Dimanche ou samedi
      });
      expect(weekendDates.length).toBe(0);
    });
  });
});
