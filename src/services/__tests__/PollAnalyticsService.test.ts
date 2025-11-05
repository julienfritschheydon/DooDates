/**
 * Tests pour PollAnalyticsService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PollAnalyticsService } from "../PollAnalyticsService";
import type { Poll, FormResults, FormResponse } from "@/lib/pollStorage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

// Mock Google GenerativeAI - will be set up in beforeEach

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(),
    })),
  })),
}));

// Mock pollStorage
const mockPoll: Poll = {
  id: "test-poll-123",
  slug: "test-poll",
  title: "Sondage de test",
  type: "form",
  status: "active",
  created_at: new Date().toISOString(),
  questions: [
    {
      id: "q1",
      title: "Comment trouvez-vous ce sondage ?",
      kind: "single",
      required: true,
      options: [
        { id: "opt1", label: "Excellent" },
        { id: "opt2", label: "Bien" },
        { id: "opt3", label: "Moyen" },
      ],
    },
    {
      id: "q2",
      title: "Votre note globale",
      kind: "rating",
      required: true,
    },
    {
      id: "q3",
      title: "Vos commentaires",
      kind: "text",
      required: false,
    },
  ],
};

const mockFormResults: FormResults = {
  totalResponses: 10,
  countsByQuestion: {
    q1: {
      opt1: 7,
      opt2: 2,
      opt3: 1,
    },
    q2: {
      "5": 3,
      "4": 4,
      "3": 2,
      "2": 1,
    },
  },
  textAnswers: {
    q3: ["Très satisfait", "Peut mieux faire", "Excellent service"],
  },
};

const mockFormResponses: FormResponse[] = [
  {
    id: "resp1",
    pollId: "test-poll-123",
    respondentName: "Alice",
    items: [
      { questionId: "q1", value: "opt1" },
      { questionId: "q2", value: "5" },
      { questionId: "q3", value: "Très satisfait" },
    ],
    submittedAt: new Date().toISOString(),
  },
  {
    id: "resp2",
    pollId: "test-poll-123",
    respondentName: "Bob",
    items: [
      { questionId: "q1", value: "opt2" },
      { questionId: "q2", value: "4" },
      { questionId: "q3", value: "Peut mieux faire" },
    ],
    submittedAt: new Date().toISOString(),
  },
];

const mockGetPollBySlugOrId = vi.fn(() => mockPoll);
const mockGetFormResults = vi.fn(() => mockFormResults);
const mockGetFormResponses = vi.fn(() => mockFormResponses);

vi.mock("@/lib/pollStorage", () => ({
  getPollBySlugOrId: () => mockGetPollBySlugOrId(),
  getFormResults: () => mockGetFormResults(),
  getFormResponses: () => mockGetFormResponses(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock environment variable
vi.stubEnv("VITE_GEMINI_API_KEY", "test-api-key");

describe("PollAnalyticsService", () => {
  let service: PollAnalyticsService;
  let mockGenerateContent: ReturnType<typeof vi.fn>;
  let mockModel: { generateContent: ReturnType<typeof vi.fn> };
  let mockGenAI: { getGenerativeModel: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    (PollAnalyticsService as any).instance = undefined;

    // Setup mock for Gemini BEFORE creating service instance
    mockModel = {
      generateContent: vi.fn(),
    };
    mockGenAI = {
      getGenerativeModel: vi.fn(() => mockModel),
    };
    (GoogleGenerativeAI as any).mockImplementation(() => mockGenAI);
    mockGenerateContent = mockModel.generateContent;

    // Ensure API key is set
    vi.stubEnv("VITE_GEMINI_API_KEY", "test-api-key");

    service = PollAnalyticsService.getInstance();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe("getInstance", () => {
    it("retourne toujours la même instance (singleton)", () => {
      const instance1 = PollAnalyticsService.getInstance();
      const instance2 = PollAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("queryPoll", () => {
    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            "Il y a 10 réponses au total. La majorité (7 personnes) a choisi 'Excellent'.",
        },
      });
    });

    it("retourne une réponse depuis le cache si disponible", async () => {
      const query = {
        pollId: "test-poll-123",
        question: "Combien de réponses ?",
      };

      // Premier appel - met en cache
      const firstResponse = await service.queryPoll(query);
      expect(firstResponse.cached).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      // Deuxième appel - depuis le cache
      const secondResponse = await service.queryPoll(query);
      expect(secondResponse.cached).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Pas appelé à nouveau
      expect(secondResponse.answer).toBe(firstResponse.answer);
    });

    it("appelle Gemini et met en cache si cache miss", async () => {
      const query = {
        pollId: "test-poll-123",
        question: "Quelle est l'option la plus populaire ?",
      };

      const response = await service.queryPoll(query);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(response.answer).toContain("10 réponses");
      expect(response.cached).toBe(false);
      expect(response.confidence).toBe(0.85);
    });

    it("extrait les insights mentionnés (tendance, consensus, anomalie)", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            "Il y a une tendance claire vers l'option Excellent. La majorité des répondants sont satisfaits. Une anomalie inhabituelle a été détectée.",
        },
      });

      const query = {
        pollId: "test-poll-123",
        question: "Analyse des résultats",
      };

      const response = await service.queryPoll(query);

      expect(response.insights).toBeDefined();
      expect(response.insights?.length).toBeGreaterThan(0);
      expect(response.insights).toContain("Tendance détectée dans les données");
      expect(response.insights).toContain("Consensus identifié");
      expect(response.insights).toContain("Anomalie potentielle détectée");
    });

    it("gère les différents context types (summary, detailed, trends)", async () => {
      const querySummary = {
        pollId: "test-poll-123",
        question: "Résumé",
        context: "summary" as const,
      };
      const queryDetailed = {
        pollId: "test-poll-123",
        question: "Détails",
        context: "detailed" as const,
      };

      await service.queryPoll(querySummary);
      await service.queryPoll(queryDetailed);

      // Les deux appels devraient inclure le contexte du poll
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      const calls = mockGenerateContent.mock.calls;
      expect(calls[0][0]).toContain("INFORMATIONS DU SONDAGE");
      expect(calls[1][0]).toContain("INFORMATIONS DU SONDAGE");
    });

    it("lève une erreur si Gemini n'est pas initialisé", async () => {
      // Créer une nouvelle instance sans API key
      vi.stubEnv("VITE_GEMINI_API_KEY", "");
      (PollAnalyticsService as any).instance = undefined;
      const serviceWithoutKey = PollAnalyticsService.getInstance();

      const query = {
        pollId: "test-poll-123",
        question: "Question",
      };

      await expect(serviceWithoutKey.queryPoll(query)).rejects.toThrow();
    });

    it("lève une erreur si le poll n'existe pas", async () => {
      mockGetPollBySlugOrId.mockReturnValueOnce(null);

      const query = {
        pollId: "non-existent-poll",
        question: "Question",
      };

      await expect(service.queryPoll(query)).rejects.toThrow();
    });

    it("gère les erreurs de Gemini gracieusement", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API Error"));

      const query = {
        pollId: "test-poll-123",
        question: "Question",
      };

      await expect(service.queryPoll(query)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("generateAutoInsights", () => {
    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                type: "trend",
                title: "Tendance positive",
                description: "Les répondants sont majoritairement satisfaits",
                confidence: 85,
              },
              {
                type: "anomaly",
                title: "Anomalie détectée",
                description: "Une réponse négative isolée",
                confidence: 60,
              },
              {
                type: "summary",
                title: "Résumé des résultats",
                description: "10 réponses au total",
                confidence: 90,
              },
            ]),
        },
      });
    });

    it("génère des insights automatiques valides", async () => {
      const insights = await service.generateAutoInsights("test-poll-123");

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toHaveProperty("type");
      expect(insights[0]).toHaveProperty("title");
      expect(insights[0]).toHaveProperty("description");
      expect(insights[0]).toHaveProperty("confidence");
    });

    it("normalise la confidence de 0-100 à 0-1", async () => {
      const insights = await service.generateAutoInsights("test-poll-123");

      insights.forEach((insight) => {
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });

      // Vérifier que 85 → 0.85
      const trendInsight = insights.find((i) => i.type === "trend");
      expect(trendInsight?.confidence).toBe(0.85);
    });

    it("parse le JSON depuis la réponse Gemini", async () => {
      const insights = await service.generateAutoInsights("test-poll-123");

      expect(Array.isArray(insights)).toBe(true);
      expect(insights[0].type).toBe("trend");
      expect(insights[0].title).toBe("Tendance positive");
    });

    it("retourne un tableau vide si le parsing JSON échoue", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "Ceci n'est pas du JSON valide",
        },
      });

      const insights = await service.generateAutoInsights("test-poll-123");

      expect(insights).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it("retourne un tableau vide si Gemini échoue (non-bloquant)", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API Error"));

      const insights = await service.generateAutoInsights("test-poll-123");

      expect(insights).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it("retourne un tableau vide si Gemini n'est pas initialisé (non-bloquant)", async () => {
      vi.stubEnv("VITE_GEMINI_API_KEY", "");
      (PollAnalyticsService as any).instance = undefined;
      const serviceWithoutKey = PollAnalyticsService.getInstance();

      const insights = await serviceWithoutKey.generateAutoInsights("test-poll-123");

      expect(insights).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it("retourne un tableau vide si le poll n'existe pas (non-bloquant)", async () => {
      mockGetPollBySlugOrId.mockReturnValueOnce(null);

      const insights = await service.generateAutoInsights("non-existent-poll");

      expect(insights).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("clearCache", () => {
    it("vide le cache pour un poll spécifique", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Réponse de test",
        },
      });

      const query1 = {
        pollId: "poll-1",
        question: "Question 1",
      };
      const query2 = {
        pollId: "poll-2",
        question: "Question 2",
      };

      // Mettre en cache pour les deux polls
      await service.queryPoll(query1);
      await service.queryPoll(query2);

      // Vérifier que le cache contient les deux
      const statsBefore = service.getCacheStats();
      expect(statsBefore.size).toBe(2);

      // Vider le cache pour poll-1 seulement
      service.clearCache("poll-1");

      // Vérifier que poll-1 est supprimé mais poll-2 reste
      const statsAfter = service.getCacheStats();
      expect(statsAfter.size).toBe(1);

      // Vérifier que poll-1 n'est plus en cache
      const response1 = await service.queryPoll(query1);
      expect(response1.cached).toBe(false);

      // Vérifier que poll-2 est toujours en cache
      const response2 = await service.queryPoll(query2);
      expect(response2.cached).toBe(true);
    });

    it("vide tout le cache si aucun pollId n'est fourni", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Réponse de test",
        },
      });

      const query1 = {
        pollId: "poll-1",
        question: "Question 1",
      };
      const query2 = {
        pollId: "poll-2",
        question: "Question 2",
      };

      // Mettre en cache
      await service.queryPoll(query1);
      await service.queryPoll(query2);

      expect(service.getCacheStats().size).toBe(2);

      // Vider tout le cache
      service.clearCache();

      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe("getCacheStats", () => {
    it("retourne les statistiques du cache", () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("maxSize");
      expect(stats).toHaveProperty("ttl");
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(50);
      expect(stats.ttl).toBe(5 * 60 * 1000); // 5 minutes
    });

    it("retourne la taille correcte après ajout au cache", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Réponse de test",
        },
      });

      const query = {
        pollId: "test-poll-123",
        question: "Question",
      };

      expect(service.getCacheStats().size).toBe(0);

      await service.queryPoll(query);

      expect(service.getCacheStats().size).toBe(1);
    });
  });

  describe("buildPollContext", () => {
    it("construit le contexte correctement pour un poll de type form", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Réponse de test",
        },
      });

      const query = {
        pollId: "test-poll-123",
        question: "Question",
        context: "detailed" as const,
      };

      await service.queryPoll(query);

      const prompt = mockGenerateContent.mock.calls[0][0];
      expect(prompt).toContain("Sondage de test");
      expect(prompt).toContain("Questionnaire");
      expect(prompt).toContain("10");
      expect(prompt).toContain("Comment trouvez-vous ce sondage ?");
    });
  });
});
