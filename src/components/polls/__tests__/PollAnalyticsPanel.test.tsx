/**
 * Tests pour PollAnalyticsPanel Component
 * Teste l'interface d'analytics conversationnels IA
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PollAnalyticsPanel from "../PollAnalyticsPanel";
import type { AnalyticsResponse, AutoInsight } from "@/services/PollAnalyticsService";
import { pollAnalyticsService } from "@/services/PollAnalyticsService";

// Mock pollAnalyticsService
vi.mock("@/services/PollAnalyticsService", () => ({
  pollAnalyticsService: {
    queryPoll: vi.fn(),
    generateAutoInsights: vi.fn(),
  },
}));

// Mock useAnalyticsQuota
const mockIncrementQuota = vi.fn(() => true);
const mockCheckQuota = vi.fn(() => true);
const mockGetQuotaMessage = vi.fn(() => "5 requêtes restantes aujourd'hui");

const mockQuota = {
  used: 0,
  limit: 5,
  remaining: 5,
  resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  canQuery: true,
};

vi.mock("@/hooks/useAnalyticsQuota", () => ({
  useAnalyticsQuota: () => ({
    quota: mockQuota,
    incrementQuota: mockIncrementQuota,
    checkQuota: mockCheckQuota,
    getQuotaMessage: mockGetQuotaMessage,
  }),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PollAnalyticsPanel", () => {
  const mockQueryPoll = vi.mocked(pollAnalyticsService.queryPoll);
  const mockGenerateAutoInsights = vi.mocked(pollAnalyticsService.generateAutoInsights);

  const defaultProps = {
    pollId: "test-poll-123",
    pollTitle: "Test Poll",
  };

  const mockInsights: AutoInsight[] = [
    {
      type: "trend",
      title: "Tendance positive",
      description: "Les répondants sont majoritairement satisfaits",
      confidence: 0.85,
    },
    {
      type: "anomaly",
      title: "Anomalie détectée",
      description: "Une réponse négative isolée",
      confidence: 0.6,
    },
  ];

  const mockResponse: AnalyticsResponse = {
    answer: "Il y a 10 réponses au total. La majorité (7 personnes) a choisi 'Excellent'.",
    confidence: 0.85,
    cached: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckQuota.mockReturnValue(true);
    mockGetQuotaMessage.mockReturnValue("5 requêtes restantes aujourd'hui");
    mockIncrementQuota.mockReturnValue(true);
    mockQuota.used = 0;
    mockQuota.remaining = 5;
    mockQuota.canQuery = true;
  });

  describe("Rendu initial", () => {
    it("affiche le titre et le header", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByText("Analytics IA")).toBeInTheDocument();
      // Le pollTitle est affiché dans le footer info
      expect(screen.getByText(/sondage "Test Poll"/)).toBeInTheDocument();
    });

    it("affiche le bouton d'actualisation", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByText("Actualiser")).toBeInTheDocument();
    });

    it("affiche le formulaire de requête", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByTestId("analytics-query-input")).toBeInTheDocument();
      expect(screen.getByTestId("analytics-send-button")).toBeInTheDocument();
    });

    it("affiche les quick queries", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByText("Combien de personnes ont répondu ?")).toBeInTheDocument();
      expect(screen.getByText("Quelle est l'option la plus populaire ?")).toBeInTheDocument();
    });

    it("affiche l'indicateur de quota", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByTestId("quota-indicator")).toBeInTheDocument();
      expect(screen.getByText("5 requêtes restantes aujourd'hui")).toBeInTheDocument();
    });
  });

  describe("Chargement des insights automatiques", () => {
    it("charge les insights au montage", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalledWith("test-poll-123");
      });
    });

    it("affiche les insights quand dépliés", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalled();
      });

      // Ouvrir les insights (utiliser le bouton avec le texte)
      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText("Tendance positive")).toBeInTheDocument();
        expect(screen.getByText("Anomalie détectée")).toBeInTheDocument();
      });
    });

    it("affiche un message si aucun insight", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalled();
      });

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText(/Aucun insight automatique disponible/)).toBeInTheDocument();
      });
    });

    it("affiche un loader pendant le chargement des insights", async () => {
      let resolveInsights: (value: AutoInsight[]) => void;
      const insightsPromise = new Promise<AutoInsight[]>((resolve) => {
        resolveInsights = resolve;
      });
      mockGenerateAutoInsights.mockReturnValue(insightsPromise);

      render(<PollAnalyticsPanel {...defaultProps} />);

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText("Génération des insights...")).toBeInTheDocument();
      });

      resolveInsights!(mockInsights);

      await waitFor(() => {
        expect(screen.queryByText("Génération des insights...")).not.toBeInTheDocument();
      });
    });

    it("peut régénérer les insights", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText("Actualiser");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Soumission de requête", () => {
    it("soumet une requête et affiche la réponse", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue(mockResponse);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Combien ont voté ?");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockQueryPoll).toHaveBeenCalledWith({
          question: "Combien ont voté ?",
          pollId: "test-poll-123",
          context: "summary",
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("analytics-response")).toBeInTheDocument();
        expect(screen.getByText(/Il y a 10 réponses au total/)).toBeInTheDocument();
      });
    });

    it("n'incrémente pas le quota si réponse du cache", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue({ ...mockResponse, cached: true });
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockQueryPoll).toHaveBeenCalled();
      });

      expect(mockIncrementQuota).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "✨ Réponse du cache",
        }),
      );
    });

    it("incrémente le quota si réponse non-cachée", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue({ ...mockResponse, cached: false });
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockQueryPoll).toHaveBeenCalled();
      });

      expect(mockIncrementQuota).toHaveBeenCalled();
    });

    it("affiche un toast d'erreur en cas d'échec", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockRejectedValue(new Error("API Error"));
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Erreur",
            variant: "destructive",
          }),
        );
      });
    });

    it("n'envoie pas de requête si input vide", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const submitButton = screen.getByTestId("analytics-send-button");
      expect(submitButton).toBeDisabled();

      fireEvent.click(submitButton);

      expect(mockQueryPoll).not.toHaveBeenCalled();
    });

    it("désactive le bouton pendant le chargement", async () => {
      let resolveQuery: (value: AnalyticsResponse) => void;
      const queryPromise = new Promise<AnalyticsResponse>((resolve) => {
        resolveQuery = resolve;
      });
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockReturnValue(queryPromise);

      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveQuery!(mockResponse);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Gestion des quotas", () => {
    it("affiche un toast si quota épuisé", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockCheckQuota.mockReturnValue(false);
      mockGetQuotaMessage.mockReturnValue("Quota épuisé. Réinitialisation dans 5h");

      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Quota épuisé",
            variant: "destructive",
          }),
        );
      });

      expect(mockQueryPoll).not.toHaveBeenCalled();
    });

    it("affiche l'indicateur de quota épuisé", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQuota.canQuery = false;
      mockQuota.remaining = 0;
      mockGetQuotaMessage.mockReturnValue("Quota épuisé. Réinitialisation dans 5h");

      render(<PollAnalyticsPanel {...defaultProps} />);

      const quotaIndicator = screen.getByTestId("quota-indicator");
      expect(quotaIndicator).toBeInTheDocument();
      expect(screen.getByText("Quota épuisé. Réinitialisation dans 5h")).toBeInTheDocument();
      expect(screen.getByText(/Connectez-vous pour obtenir 50 requêtes/)).toBeInTheDocument();
    });

    it("affiche le nombre de requêtes utilisées", () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQuota.used = 3;
      mockQuota.limit = 5;

      render(<PollAnalyticsPanel {...defaultProps} />);

      expect(screen.getByText("3/5 utilisées")).toBeInTheDocument();
    });
  });

  describe("Quick queries", () => {
    it("remplit le champ avec une quick query", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const quickQueryButton = screen.getByText("Combien de personnes ont répondu ?");
      fireEvent.click(quickQueryButton);

      await waitFor(() => {
        const input = screen.getByTestId("analytics-query-input") as HTMLInputElement;
        expect(input.value).toBe("Combien de personnes ont répondu ?");
      });
    });

    it("soumet automatiquement après quick query", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue(mockResponse);

      render(<PollAnalyticsPanel {...defaultProps} />);

      const quickQueryButton = screen.getByText("Quelle est l'option la plus populaire ?");
      fireEvent.click(quickQueryButton);

      await waitFor(
        () => {
          expect(mockQueryPoll).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Affichage de la réponse", () => {
    it("affiche la réponse avec confiance", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue(mockResponse);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Il y a 10 réponses au total/)).toBeInTheDocument();
        expect(screen.getByText("Confiance: 85%")).toBeInTheDocument();
      });
    });

    it("affiche les insights additionnels s'ils existent", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue({
        ...mockResponse,
        insights: ["Tendance détectée", "Consensus identifié"],
      });
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Insights additionnels :")).toBeInTheDocument();
        expect(screen.getByText("Tendance détectée")).toBeInTheDocument();
        expect(screen.getByText("Consensus identifié")).toBeInTheDocument();
      });
    });

    it("affiche l'indicateur de cache si réponse mise en cache", async () => {
      mockGenerateAutoInsights.mockResolvedValue([]);
      mockQueryPoll.mockResolvedValue({ ...mockResponse, cached: true });
      render(<PollAnalyticsPanel {...defaultProps} />);

      const input = screen.getByTestId("analytics-query-input");
      const submitButton = screen.getByTestId("analytics-send-button");

      await userEvent.type(input, "Question");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Réponse mise en cache")).toBeInTheDocument();
      });
    });
  });

  describe("Affichage/masquage des insights", () => {
    it("masque les insights par défaut", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalled();
      });

      expect(screen.queryByText("Tendance positive")).not.toBeInTheDocument();
    });

    it("affiche les insights quand on clique sur le bouton", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalled();
      });

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText("Tendance positive")).toBeInTheDocument();
      });
    });

    it("masque les insights quand on clique à nouveau", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateAutoInsights).toHaveBeenCalled();
      });

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText("Tendance positive")).toBeInTheDocument();
      });

      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.queryByText("Tendance positive")).not.toBeInTheDocument();
      });
    });
  });

  describe("Affichage des insights", () => {
    it("affiche les insights avec les bonnes icônes et couleurs", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        const insightCards = screen.getAllByTestId("insight-card");
        expect(insightCards).toHaveLength(2);
      });
    });

    it("affiche la confiance et le type d'insight", async () => {
      mockGenerateAutoInsights.mockResolvedValue(mockInsights);
      render(<PollAnalyticsPanel {...defaultProps} />);

      const insightsButton = screen.getByText(/Insights automatiques/);
      fireEvent.click(insightsButton);

      await waitFor(() => {
        expect(screen.getByText("Confiance: 85%")).toBeInTheDocument();
        expect(screen.getByText("Confiance: 60%")).toBeInTheDocument();
        expect(screen.getByText("Tendance")).toBeInTheDocument();
        expect(screen.getByText("Anomalie")).toBeInTheDocument();
      });
    });
  });
});
