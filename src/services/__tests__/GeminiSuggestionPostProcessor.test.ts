import { describe, it, expect } from "vitest";
import { postProcessSuggestion } from "../GeminiSuggestionPostProcessor";
import { DatePollSuggestion } from "@/lib/gemini";

describe("GeminiSuggestionPostProcessor", () => {
  describe("Dates sans horaires - Génération automatique", () => {
    it("génère des créneaux pour stand-up express matin", () => {
      const suggestion: DatePollSuggestion = {
        title: "Stand-up express",
        type: "date",
        dates: ["2025-11-12"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Organise un stand-up express demain matin pour l'équipe support.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      expect(result.timeSlots?.[0].start).toMatch(/08:00|08:30|09:00/);
      const duration = calculateDuration(result.timeSlots?.[0].start, result.timeSlots?.[0].end);
      expect(duration).toBeLessThanOrEqual(30);
    });

    it("génère des créneaux soirée pour réunion parents-profs", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion parents-profs",
        type: "date",
        dates: ["2025-11-18", "2025-11-20"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      expect(result.timeSlots?.[0].start).toMatch(/18:30|19:00/);
    });

    it("génère des créneaux matin pour séance photo dimanche", () => {
      const suggestion: DatePollSuggestion = {
        title: "Séance photo familiale",
        type: "date",
        dates: ["2025-12-07", "2025-12-14", "2025-12-21"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput:
          "Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre).",
        allowedDates: ["2025-12-07", "2025-12-14", "2025-12-21"],
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      const sundaySlots = result.timeSlots?.filter((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 0),
      );
      expect(sundaySlots?.length).toBeGreaterThan(0);
      expect(sundaySlots?.[0].start).toMatch(/09:00|10:00/);
    });

    it("génère des créneaux samedi 10h pour kermesse", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion préparation kermesse",
        type: "date",
        dates: ["2025-11-15", "2025-11-16", "2025-11-22"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Propose un créneau samedi 10h pour la réunion de préparation kermesse.",
      });

      expect(result.timeSlots).toBeDefined();
      const saturdaySlots = result.timeSlots?.filter((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 6),
      );
      expect(saturdaySlots?.length).toBeGreaterThan(0);
      expect(saturdaySlots?.[0].start).toBe("10:00");
    });

    it("génère des créneaux mercredi/vendredi pour aide aux devoirs", () => {
      const suggestion: DatePollSuggestion = {
        title: "Aide aux devoirs",
        type: "date",
        dates: ["2025-11-19", "2025-11-21"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      const wednesdaySlot = result.timeSlots?.find((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 3),
      );
      const fridaySlot = result.timeSlots?.find((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 5),
      );
      expect(wednesdaySlot || fridaySlot).toBeDefined();
    });

    it("génère samedi matin et dimanche après-midi pour répétition chorale", () => {
      const suggestion: DatePollSuggestion = {
        title: "Répétition chorale",
        type: "date",
        dates: ["2025-11-15", "2025-11-16"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
      });

      expect(result.timeSlots).toBeDefined();
      const saturdaySlot = result.timeSlots?.find((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 6),
      );
      const sundaySlot = result.timeSlots?.find((slot) =>
        slot.dates?.some((date) => new Date(date).getDay() === 0),
      );
      expect(saturdaySlot).toBeDefined();
      expect(sundaySlot).toBeDefined();
      expect(saturdaySlot?.start).toMatch(/09:00|10:00/);
      expect(sundaySlot?.start).toMatch(/15:00|16:00/);
    });
  });

  describe("Fenêtre temporelle - Clamp sur allowedDates", () => {
    it("filtre les dates hors fenêtre autorisée", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion projet",
        type: "date",
        dates: ["2025-11-12", "2025-11-15", "2025-11-20", "2025-12-01"],
        timeSlots: [
          { start: "14:00", end: "15:00", dates: ["2025-11-12"] },
          { start: "14:00", end: "15:00", dates: ["2025-11-15"] },
          { start: "14:00", end: "15:00", dates: ["2025-11-20"] },
          { start: "14:00", end: "15:00", dates: ["2025-12-01"] },
        ],
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Génère une réunion projet la semaine du 18.",
        allowedDates: ["2025-11-18", "2025-11-19", "2025-11-20", "2025-11-21"],
      });

      expect(
        result.dates.every((date) =>
          ["2025-11-18", "2025-11-19", "2025-11-20", "2025-11-21"].includes(date),
        ),
      ).toBe(true);
      expect(result.dates).not.toContain("2025-11-12");
      expect(result.dates).not.toContain("2025-11-15");
      expect(result.dates).not.toContain("2025-12-01");
    });

    it("conserve uniquement les dates dans la fenêtre même si Gemini propose plus", () => {
      const suggestion: DatePollSuggestion = {
        title: "Brunch",
        type: "date",
        dates: ["2025-11-15", "2025-11-16"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Calcule un brunch samedi 23 ou dimanche 24.",
        allowedDates: ["2025-11-23", "2025-11-24"],
      });

      expect(result.dates.length).toBeLessThanOrEqual(2);
      expect(result.dates.every((date) => ["2025-11-23", "2025-11-24"].includes(date))).toBe(true);
    });
  });

  describe("Règles métier - Durées et contraintes", () => {
    it("applique durée 30 min pour stand-up express", () => {
      const suggestion: DatePollSuggestion = {
        title: "Stand-up express",
        type: "datetime",
        dates: ["2025-11-12"],
        timeSlots: [{ start: "09:00", end: "10:00", dates: ["2025-11-12"] }],
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Organise un stand-up express demain matin.",
      });

      expect(result.timeSlots).toBeDefined();
      result.timeSlots?.forEach((slot) => {
        const duration = calculateDuration(slot.start, slot.end);
        expect(duration).toBeLessThanOrEqual(30);
      });
    });

    it("applique durée 60 min minimum pour réunion d'équipe", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion d'équipe éducative",
        type: "datetime",
        dates: ["2025-11-12"],
        timeSlots: [{ start: "09:00", end: "09:30", dates: ["2025-11-12"] }],
      };

      const result = postProcessSuggestion(suggestion, {
        userInput:
          "Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.",
      });

      expect(result.timeSlots).toBeDefined();
      result.timeSlots?.forEach((slot) => {
        const duration = calculateDuration(slot.start, slot.end);
        expect(duration).toBeGreaterThanOrEqual(60);
      });
    });

    it("filtre et limite à 2 créneaux pour visio après 18h", () => {
      const suggestion: DatePollSuggestion = {
        title: "Point trésorerie",
        type: "datetime",
        dates: ["2025-11-12", "2025-11-13", "2025-11-14"],
        timeSlots: [
          { start: "18:00", end: "19:00", dates: ["2025-11-12"] },
          { start: "18:30", end: "19:30", dates: ["2025-11-13"] },
          { start: "19:00", end: "20:00", dates: ["2025-11-14"] },
          { start: "20:00", end: "21:00", dates: ["2025-11-15"] },
        ],
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Trouve-nous un créneau en visio après 18h pour le point trésorerie.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeLessThanOrEqual(2);
      result.timeSlots?.forEach((slot) => {
        const startHour = parseInt(slot.start.split(":")[0], 10);
        const endHour = parseInt(slot.end.split(":")[0], 10);
        expect(startHour).toBeGreaterThanOrEqual(18);
        expect(endHour).toBeLessThanOrEqual(20);
      });
    });

    it("force paire samedi/dimanche pour week-end", () => {
      const suggestion: DatePollSuggestion = {
        title: "Week-end départ",
        type: "date",
        dates: ["2025-11-15", "2025-11-16", "2025-11-17", "2025-11-18"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Repère un week-end où partir deux jours en juin.",
        allowedDates: ["2025-11-15", "2025-11-16"],
      });

      const saturdays = result.dates.filter((date) => new Date(date).getDay() === 6);
      const sundays = result.dates.filter((date) => new Date(date).getDay() === 0);
      expect(saturdays.length).toBeGreaterThan(0);
      expect(sundays.length).toBeGreaterThan(0);
    });
  });

  describe("Réduction des variantes excessives", () => {
    it("génère des créneaux contextualisés pour apéro entre amis (sans slots existants)", () => {
      const suggestion: DatePollSuggestion = {
        title: "Apéro entre amis",
        type: "date",
        dates: ["2025-11-12", "2025-11-13", "2025-11-14"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      result.timeSlots?.forEach((slot) => {
        const hour = parseInt(slot.start.split(":")[0], 10);
        expect(hour).toBeGreaterThanOrEqual(18);
        expect(hour).toBeLessThan(21);
      });
    });

    it("génère des créneaux soirée pour atelier bénévoles (sans slots existants)", () => {
      const suggestion: DatePollSuggestion = {
        title: "Atelier bénévoles",
        type: "date",
        dates: ["2025-11-12", "2025-11-13", "2025-11-14"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
        allowedDates: ["2025-11-12", "2025-11-13", "2025-11-14", "2025-11-15"],
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      result.timeSlots?.forEach((slot) => {
        const hour = parseInt(slot.start.split(":")[0], 10);
        expect(hour).toBeGreaterThanOrEqual(18);
        expect(hour).toBeLessThan(21);
      });
    });
  });

  describe("Extraction d'horaires explicites", () => {
    it("utilise l'heure explicite mentionnée dans le prompt", () => {
      const suggestion: DatePollSuggestion = {
        title: "Point budget",
        type: "date",
        dates: ["2025-11-22", "2025-11-23"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Planifie un point budget dans deux semaines autour de 9h30.",
      });

      expect(result.timeSlots).toBeDefined();
      const slotWith930 = result.timeSlots?.find(
        (slot) => slot.start.startsWith("09:3") || slot.start === "09:30",
      );
      expect(slotWith930).toBeDefined();
    });

    it("génère créneaux autour de l'heure mentionnée", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion de lancement",
        type: "date",
        dates: ["2025-11-17", "2025-11-20"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput:
          "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      const has14h = result.timeSlots?.some((slot) => slot.start.startsWith("14:"));
      const has10h = result.timeSlots?.some((slot) => slot.start.startsWith("10:"));
      expect(has14h || has10h).toBe(true);
    });
  });

  describe("Fallback par défaut", () => {
    it("génère des créneaux par défaut si aucun contexte détecté", () => {
      const suggestion: DatePollSuggestion = {
        title: "Réunion",
        type: "date",
        dates: ["2025-11-12"],
        timeSlots: undefined,
      };

      const result = postProcessSuggestion(suggestion, {
        userInput: "Planifie une réunion.",
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots?.length).toBeGreaterThan(0);
      expect(result.type).toBe("datetime");
    });
  });
});

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  return (endHour - startHour) * 60 + (endMin - startMin);
}
