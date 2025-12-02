import { describe, it, expect, beforeEach } from "@jest/globals";

// Tests d intégration complets pour l architecture multi-produits
describe("Intégration - Architecture Multi-Produits", () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      data: {} as Record<string, string>,
      getItem: jest.fn((key) => localStorageMock.data[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.data[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock.data[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.data = {};
      }),
    };
    Object.defineProperty(global, "localStorage", { value: localStorageMock });
  });

  describe("Interface unifiée", () => {
    it("devrait créer des services pour chaque type", async () => {
      const { createPollService, getPollType } = await import("..");
      
      const dateService = await createPollService("date");
      const formService = await createPollService("form");
      const quizzService = await createPollService("quizz");
      
      expect(dateService).toBeDefined();
      expect(formService).toBeDefined();
      expect(quizzService).toBeDefined();
    });

    it("devrait détecter les types correctement", async () => {
      const { getPollType } = await import("..");
      
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
      const datePolls = await import("../date-polls");
      const formPolls = await import("../form-polls");
      
      const datePoll = {
        id: "date1",
        creator_id: "user1",
        slug: "date1",
        status: "active" as const,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        type: "date" as const,
        title: "Date Poll",
        settings: { selectedDates: ["2025-01-15"] }
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
        questions: []
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
      const datePolls = await import("../date-polls");
      const formPolls = await import("../form-polls");
      
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
        settings: { selectedDates: [] }
      };
      
      await datePolls.addPoll(datePoll);
      
      // Vérifier que form polls ne voit pas le date poll
      const formPollsList = formPolls.getPolls();
      expect(formPollsList.length).toBe(0);
    });
  });

  describe("Tests de charge avec interface unifiée", () => {
    it("devrait gérer plusieurs polls simultanément", async () => {
      const { createPollService } = await import("..");
      
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
        questions: []
      }));
      
      // Ajouter tous les polls
      for (const poll of polls) {
        await formService.addPoll(poll);
      }
      
      const allPolls = formService.getPolls();
      expect(allPolls.length).toBe(10);
    });
  });

  describe("Rétrocompatibilité", () => {
    it("devrait maintenir les anciens exports", async () => {
      const datePolls = await import("../date-polls");
      const formPolls = await import("../form-polls");
      
      // Vérifier que les anciens noms de fonctions existent
      expect(typeof datePolls.getPolls).toBe("function");
      expect(typeof datePolls.addPoll).toBe("function");
      expect(typeof formPolls.getPolls).toBe("function");
      expect(typeof formPolls.addPoll).toBe("function");
    });
  });
});
