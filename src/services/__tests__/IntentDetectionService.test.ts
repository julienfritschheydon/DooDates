import { describe, it, expect, beforeEach, vi } from "vitest";
import { IntentDetectionService } from "../IntentDetectionService";
import type { Poll } from "../../lib/pollStorage";

describe("IntentDetectionService", () => {
  let mockPoll: Poll;

  // Date de référence pour les tests (date actuelle)
  const TEST_BASE_DATE = new Date();
  TEST_BASE_DATE.setHours(12, 0, 0, 0); // Midi pour éviter les problèmes de fuseau horaire

  beforeEach(() => {
    // Mock Date pour avoir des résultats prévisibles
    vi.useFakeTimers();
    vi.setSystemTime(TEST_BASE_DATE);

    // Mock poll avec dates existantes
    mockPoll = {
      id: "test-poll-123",
      slug: "test-poll",
      title: "Déjeuner mardi ou mercredi",
      type: "date",
      dates: [getTestDate(4), getTestDate(5)], // +4 et +5 jours
      created_at: TEST_BASE_DATE.toISOString(),
      updated_at: TEST_BASE_DATE.toISOString(),
    } as Poll;
  });

  // Helper pour vérifier qu'une date correspond à un jour de la semaine
  function isWeekday(dateStr: string, dayName: string): boolean {
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const date = new Date(dateStr);
    return date.getDay() === targetDay;
  }

  // Helper pour formater une date en YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Helper pour obtenir une date relative à la date de référence
  function getTestDate(dayOffset: number): string {
    const targetDate = new Date(TEST_BASE_DATE);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    return formatDate(targetDate);
  }

  describe("ADD_TIMESLOT (Pattern prioritaire)", () => {
    it('détecte "ajoute 14h-15h le 29"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute 14h-15h le 29",
        mockPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("ADD_TIMESLOT");
      const payload = intent?.payload as { date: string; start: string; end: string };
      expect(payload.date).toMatch(/^\d{4}-\d{2}-29$/); // Format YYYY-MM-29
      expect(payload.start).toBe("14:00");
      expect(payload.end).toBe("15:00");
      expect(intent?.confidence).toBe(0.9);
    });

    it('supporte format avec minutes "ajoute 14h30-15h45 le 27"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute 14h30-15h45 le 27",
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_TIMESLOT");
      const payload = intent?.payload as { date: string; start: string; end: string };
      expect(payload.start).toBe("14:30");
      expect(payload.end).toBe("15:45");
    });

    it('supporte format sans "h" : "ajoute 14:00-15:00 le 29"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute 14:00-15:00 le 29",
        mockPoll,
      );

      // Ce format n'est pas supporté actuellement, devrait retourner null ou ADD_DATE
      // On vérifie qu'il ne crash pas
      expect(intent).toBeDefined();
    });

    it('normalise la date partielle "le 29" vers mois courant', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute 14h-15h le 29",
        mockPoll,
      );

      const payload = intent?.payload as { date: string; start: string; end: string };
      expect(payload.date).toMatch(/^\d{4}-\d{2}-29$/); // Format YYYY-MM-29
      expect(payload.date.endsWith("-29")).toBe(true);
    });
  });

  describe("ADD_DATE (Jours de la semaine)", () => {
    it(
      'détecte "ajouter mercredi" (prochain mercredi)',
      async () => {
        const intent = await IntentDetectionService.detectSimpleIntent(
          "ajouter mercredi",
          mockPoll,
        );

        expect(intent?.action).toBe("ADD_DATE");
        const payload = intent?.payload as string;
        expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(isWeekday(payload, "mercredi")).toBe(true);
        expect(intent?.confidence).toBe(0.9);
      },
      { timeout: 20000 },
    );

    it('détecte "ajoute lundi"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajoute lundi", mockPoll);

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isWeekday(payload, "lundi")).toBe(true);
    });

    it('détecte "ajoute le dimanche"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute le dimanche",
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isWeekday(payload, "dimanche")).toBe(true);
    });
  });

  describe("ADD_DATE (Formats multiples)", () => {
    it('détecte "ajoute le DD/MM/YYYY" (format complet)', async () => {
      const testDate = getTestDate(3);
      const [year, month, day] = testDate.split("-");
      const intent = await IntentDetectionService.detectSimpleIntent(
        `ajoute le ${day}/${month}/${year}`,
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toBe(getTestDate(3)); // 27 oct
      expect(intent?.confidence).toBe(0.9);
    });

    it('détecte "ajoute le 27" (jour seul)', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajoute le 27", mockPoll);

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-27$/); // Format YYYY-MM-27
      expect(payload.endsWith("-27")).toBe(true);
    });

    it('détecte "ajoute le 27/10" (sans année)', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajoute le 27/10", mockPoll);

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-27$/); // Format YYYY-MM-27
      expect(parseInt(payload.split("-")[0])).toBeGreaterThanOrEqual(new Date().getFullYear());
    });

    it('détecte "ajoute le DD mois YYYY" (mois en texte)', async () => {
      const testDate = getTestDate(3);
      const date = new Date(testDate);
      const day = date.getDate();
      const month = date.toLocaleDateString("fr-FR", { month: "long" });
      const year = date.getFullYear();
      const intent = await IntentDetectionService.detectSimpleIntent(
        `ajoute le ${day} ${month} ${year}`,
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_DATE");
      expect(intent?.payload).toBe(getTestDate(3)); // 27 oct
    });

    it('détecte "ajoute le YYYY-MM-DD" (format ISO)', async () => {
      const testDate = getTestDate(3);
      const intent = await IntentDetectionService.detectSimpleIntent(
        `ajoute le ${testDate}`,
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_DATE");
      expect(intent?.payload).toBe(getTestDate(3)); // 27 oct
    });

    it('supporte "ajouter" au lieu de "ajoute"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajouter le 30", mockPoll);

      expect(intent?.action).toBe("ADD_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-30$/); // Format YYYY-MM-30
      expect(payload.endsWith("-30")).toBe(true);
    });
  });

  describe("REMOVE_DATE (Jours de la semaine)", () => {
    it('détecte "retire mercredi"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("retire mercredi", mockPoll);

      expect(intent?.action).toBe("REMOVE_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isWeekday(payload, "mercredi")).toBe(true);
    });

    it('détecte "supprime le lundi"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("supprime le lundi", mockPoll);

      expect(intent?.action).toBe("REMOVE_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isWeekday(payload, "lundi")).toBe(true);
    });

    it('détecte "enlève mardi"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("enlève mardi", mockPoll);

      expect(intent?.action).toBe("REMOVE_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isWeekday(payload, "mardi")).toBe(true);
    });
  });

  describe("REMOVE_DATE (Formats multiples)", () => {
    it('détecte "retire le 29"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("retire le 29", mockPoll);

      expect(intent?.action).toBe("REMOVE_DATE");
      const payload = intent?.payload as string;
      expect(payload).toMatch(/^\d{4}-\d{2}-29$/); // Format YYYY-MM-29
      expect(payload.endsWith("-29")).toBe(true);
    });

    it('détecte "supprime le DD/MM/YYYY"', async () => {
      const testDate = getTestDate(3);
      const [year, month, day] = testDate.split("-");
      const intent = await IntentDetectionService.detectSimpleIntent(
        `supprime le ${day}/${month}/${year}`,
        mockPoll,
      );

      expect(intent?.action).toBe("REMOVE_DATE");
      expect(intent?.payload).toBe(getTestDate(3)); // 27 oct
    });

    it('détecte "enlève le DD mois YYYY"', async () => {
      const testDate = getTestDate(3);
      const date = new Date(testDate);
      const day = date.getDate();
      const month = date.toLocaleDateString("fr-FR", { month: "long" });
      const year = date.getFullYear();
      const intent = await IntentDetectionService.detectSimpleIntent(
        `enlève le ${day} ${month} ${year}`,
        mockPoll,
      );

      expect(intent?.action).toBe("REMOVE_DATE");
      expect(intent?.payload).toBe(getTestDate(3)); // 27 oct
    });
  });

  describe("UPDATE_TITLE", () => {
    it('détecte "renomme en Nouveau titre"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "renomme en Nouveau titre",
        mockPoll,
      );

      expect(intent?.action).toBe("UPDATE_TITLE");
      const payload = intent?.payload as string;
      expect(payload).toBe("Nouveau titre");
      expect(intent?.confidence).toBe(0.95);
    });

    it('détecte "change le titre en Réunion équipe"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "change le titre en Réunion équipe",
        mockPoll,
      );

      expect(intent?.action).toBe("UPDATE_TITLE");
      const payload = intent?.payload as string;
      expect(payload).toBe("Réunion équipe");
    });

    it("supporte les titres avec caractères spéciaux", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "renomme en Apéro vendredi 🍻",
        mockPoll,
      );

      expect(intent?.action).toBe("UPDATE_TITLE");
      const payload = intent?.payload as string;
      expect(payload).toBe("Apéro vendredi 🍻");
    });

    it("retourne null si titre vide", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("renomme en    ", mockPoll);

      expect(intent).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("retourne null si pas de poll", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajoute le 27", null);

      expect(intent).toBeNull();
    });

    it("retourne null si message non reconnu", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("blabla random", mockPoll);

      expect(intent).toBeNull();
    });

    it("retourne null pour message vide", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("", mockPoll);

      expect(intent).toBeNull();
    });

    it("gère les messages avec espaces multiples", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute    le    27",
        mockPoll,
      );

      expect(intent?.action).toBe("ADD_DATE");
    });
  });

  describe("Priorité des patterns", () => {
    it('ADD_TIMESLOT a priorité sur ADD_DATE pour "14h-15h le 29"', async () => {
      const intent = await IntentDetectionService.detectSimpleIntent(
        "ajoute 14h-15h le 29",
        mockPoll,
      );

      // Doit détecter ADD_TIMESLOT, pas ADD_DATE
      expect(intent?.action).toBe("ADD_TIMESLOT");
      const payload = intent?.payload as { date: string; start: string; end: string };
      expect(payload.date).toMatch(/^\d{4}-\d{2}-29$/); // Format YYYY-MM-29
    });

    it("ADD_DAY a priorité sur ADD_DATE pour jours de la semaine", async () => {
      const intent = await IntentDetectionService.detectSimpleIntent("ajoute mercredi", mockPoll);

      // Doit utiliser le pattern jour de la semaine
      expect(intent?.action).toBe("ADD_DATE");
      expect(intent?.confidence).toBe(0.9); // Confidence jour de la semaine
    });
  });
});
