import { describe, it, expect, beforeEach, vi } from "vitest";

// Tests d intégration complets pour l architecture multi-produits
// Ces tests nécessitent un environnement avec localStorage partagé entre modules
// Ils sont skippés en CI car le mock localStorage n'est pas partagé entre imports dynamiques
describe.skip("Intégration - Architecture Multi-Produits", () => {
  let localStorageData: Record<string, string> = {};

  beforeEach(() => {
    localStorageData = {};
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string): string | null => localStorageData[key] || null),
      setItem: vi.fn((key: string, value: string): void => {
        localStorageData[key] = value;
      }),
      removeItem: vi.fn((key: string): void => {
        delete localStorageData[key];
      }),
      clear: vi.fn((): void => {
        localStorageData = {};
      }),
    };
    Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
  });

  describe("Interface unifiée", () => {
    it("devrait créer des services pour chaque type", async () => {
      const { createPollService, getPollType } = await import("../..");

      const dateService = await createPollService("date");
      const formService = await createPollService("form");
      const quizzService = await createPollService("quizz");

      expect(dateService).toBeDefined();
      expect(formService).toBeDefined();
      expect(quizzService).toBeDefined();
    });

    it("devrait détecter les types correctement", async () => {
      const { getPollType } = await import("../..");

      const datePoll = { type: "date", settings: { selectedDates: [] } };
      const formPoll = { type: "form", questions: [] };
      const quizzPoll = { type: "quizz", questions: [], scoring: {} };

      expect(getPollType(datePoll)).toBe("date");
      expect(getPollType(formPoll)).toBe("form");
      expect(getPollType(quizzPoll)).toBe("quizz");
      expect(getPollType({ type: "unknown" })).toBe(null);
    });
  });

  describe("Interaction entre services", () => {
    it("devrait gérer les polls de différents types", async () => {
      const datePolls = await import("../../date-polls");
      const formPolls = await import("../../form-polls");

      const datePoll = {
        id: "date1",
        creator_id: "user1",
        slug: "date1",
        status: "active" as const,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        type: "date" as const,
        title: "Date Poll",
        settings: { selectedDates: ["2025-01-15", "2025-01-16"] },
      };

      const formPoll = {
        id: "form1",
        creator_id: "user1",
        slug: "form1",
        status: "active" as const,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        type: "form" as const,
        title: "Form Poll",
        questions: [],
      };

      await datePolls.addPoll(datePoll);
      await formPolls.addPoll(formPoll);

      const datePollsList = datePolls.getPolls();
      const formPollsList = formPolls.getPolls();

      expect(datePollsList.length).toBe(1);
      expect(formPollsList.length).toBe(1);
      expect(datePollsList[0].type).toBe("date");
      expect(formPollsList[0].type).toBe("form");
    });

    it("devrait maintenir la séparation des données", async () => {
      const datePolls = await import("../../date-polls");
      const formPolls = await import("../../form-polls");

      // Ajouter un date poll
      const datePoll = {
        id: "date1",
        creator_id: "user1",
        slug: "date1",
        status: "active" as const,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        type: "date" as const,
        title: "Date Poll",
        settings: { selectedDates: ["2025-01-15", "2025-01-16"] },
      };

      await datePolls.addPoll(datePoll);

      // Vérifier que form polls ne voit pas le date poll
      const formPollsList = formPolls.getPolls();
      expect(formPollsList.length).toBe(0);
    });
  });

  describe("Tests de charge avec interface unifiée", () => {
    it("devrait gérer plusieurs polls simultanément", async () => {
      const { createPollService } = await import("../..");

      const dateService = await createPollService("date");
      const formService = await createPollService("form");

      // Créer plusieurs polls
      const polls = Array.from({ length: 10 }, (_, i) => ({
        id: `poll${i}`,
        creator_id: "user1",
        slug: `poll${i}`,
        status: "active" as const,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        type: "form" as const,
        title: `Poll ${i}`,
        questions: [],
      }));

      // Ajouter tous les polls
      for (const poll of polls) {
        // Cast nécessaire car createPollService retourne un type union
        await (formService as any).addPoll(poll);
      }

      const allPolls = formService.getPolls();
      expect(allPolls.length).toBe(10);
    });
  });

  describe("Rétrocompatibilité", () => {
    it("devrait maintenir les anciens exports", async () => {
      const datePolls = await import("../../date-polls");
      const formPolls = await import("../../form-polls");

      // Vérifier que les anciens noms de fonctions existent
      expect(typeof datePolls.getPolls).toBe("function");
      expect(typeof datePolls.addPoll).toBe("function");
      expect(typeof formPolls.getPolls).toBe("function");
      expect(typeof formPolls.addPoll).toBe("function");
    });
  });
});
