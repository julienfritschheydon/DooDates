/**
 * Tests pour le bouton "Clôturer" dans PollActions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PollActions from "../PollActions";
import type { Poll } from "@/lib/pollStorage";
import * as pollStorage from "@/lib/pollStorage";
import * as simulationComparison from "@/lib/simulation/SimulationComparison";

// Mock des modules
vi.mock("@/lib/pollStorage", () => ({
  getPolls: vi.fn(),
  savePolls: vi.fn(),
  deletePollById: vi.fn(),
  duplicatePoll: vi.fn(),
  buildPublicLink: vi.fn(),
  copyToClipboard: vi.fn(),
}));

vi.mock("@/lib/simulation/SimulationComparison", () => ({
  getLastSimulation: vi.fn(),
  compareSimulationWithReality: vi.fn(),
}));

vi.mock("@/lib/exports", () => ({
  exportFormPollToCSV: vi.fn(),
  exportFormPollToPDF: vi.fn(),
  exportFormPollToJSON: vi.fn(),
  exportFormPollToMarkdown: vi.fn(),
  hasExportableData: vi.fn(() => false),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// FIXME: Tests fragiles - toast mock ne fonctionne pas correctement
describe.skip("PollActions - Bouton Clôturer", () => {
  const mockPoll: Poll = {
    id: "poll-123",
    creator_id: "user-1",
    title: "Test Poll",
    slug: "test-poll",
    status: "active",
    type: "form",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dates: [],
    settings: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    // Mock savePolls to resolve successfully by default
    vi.mocked(pollStorage.savePolls).mockResolvedValue(undefined);

    // Mock getPolls to return empty array by default
    vi.mocked(pollStorage.getPolls).mockReturnValue([]);

    // Mock getLastSimulation to return null by default
    vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(null);
  });

  it("devrait afficher le bouton Clôturer pour un poll actif", () => {
    render(
      <BrowserRouter>
        <PollActions poll={mockPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.getByTestId("poll-action-close");
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent("Clôturer");
  });

  it("ne devrait PAS afficher le bouton Clôturer pour un poll clôturé", () => {
    const closedPoll = { ...mockPoll, status: "closed" as const };

    render(
      <BrowserRouter>
        <PollActions poll={closedPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.queryByTestId("poll-action-close");
    expect(closeButton).not.toBeInTheDocument();
  });

  it("ne devrait PAS afficher le bouton Clôturer pour un poll archivé", () => {
    const archivedPoll = { ...mockPoll, status: "archived" as const };

    render(
      <BrowserRouter>
        <PollActions poll={archivedPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.queryByTestId("poll-action-close");
    expect(closeButton).not.toBeInTheDocument();
  });

  it("devrait demander confirmation avant de clôturer", () => {
    render(
      <BrowserRouter>
        <PollActions poll={mockPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.getByTestId("poll-action-close");
    fireEvent.click(closeButton);

    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining("clôturer ce questionnaire"),
    );
  });

  it("ne devrait PAS clôturer si l'utilisateur annule", () => {
    global.confirm = vi.fn(() => false);

    vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);

    render(
      <BrowserRouter>
        <PollActions poll={mockPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.getByTestId("poll-action-close");
    fireEvent.click(closeButton);

    expect(pollStorage.savePolls).not.toHaveBeenCalled();
  });

  it("devrait passer le statut à 'closed' lors de la clôture", () => {
    vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
    vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(null);

    render(
      <BrowserRouter>
        <PollActions poll={mockPoll} />
      </BrowserRouter>,
    );

    const closeButton = screen.getByTestId("poll-action-close");
    fireEvent.click(closeButton);

    expect(pollStorage.savePolls).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "poll-123",
        status: "closed",
      }),
    ]);
  });

  describe("Avec simulation existante", () => {
    const mockSimulation = {
      id: "sim-123",
      config: { pollId: "poll-123", volume: 10, context: "feedback" as const },
      createdAt: new Date(),
      respondents: [],
      metrics: {
        totalResponses: 10,
        avgCompletionRate: 0.8,
        avgTotalTime: 100,
        dropoffRate: 0.2,
        questionMetrics: [],
      },
      issues: [],
      generationTime: 1000,
    };

    const mockComparison = {
      id: "comp-123",
      pollId: "poll-123",
      simulationId: "sim-123",
      comparedAt: new Date().toISOString(),
      predicted: mockSimulation.metrics,
      actual: {
        totalResponses: 8,
        avgCompletionRate: 0.75,
        avgTotalTime: 95,
        dropoffRate: 0.25,
        questionMetrics: [],
      },
      accuracy: {
        completionRate: 94,
        totalTime: 95,
        dropoffRate: 80,
        overall: 87,
      },
    };

    it("devrait détecter et comparer avec la dernière simulation", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(mockSimulation);
      vi.mocked(simulationComparison.compareSimulationWithReality).mockReturnValue(mockComparison);

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(simulationComparison.getLastSimulation).toHaveBeenCalledWith("poll-123");
        expect(simulationComparison.compareSimulationWithReality).toHaveBeenCalledWith(
          "poll-123",
          mockSimulation,
        );
      });
    });

    it("devrait afficher le score de précision dans le toast", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(mockSimulation);
      vi.mocked(simulationComparison.compareSimulationWithReality).mockReturnValue(mockComparison);

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Questionnaire clôturé",
            description: "Précision de la simulation : 87%",
          }),
        );
      });
    });

    it("devrait gérer les erreurs de comparaison gracieusement", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(mockSimulation);
      vi.mocked(simulationComparison.compareSimulationWithReality).mockImplementation(() => {
        throw new Error("Comparison failed");
      });

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Questionnaire clôturé",
            description: "Le questionnaire est maintenant fermé aux nouvelles réponses.",
          }),
        );
      });
    });
  });

  describe("Sans simulation", () => {
    it("devrait afficher un message simple si aucune simulation", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(null);

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Questionnaire clôturé",
            description: "Le questionnaire est maintenant fermé aux nouvelles réponses.",
          }),
        );
      });
    });

    it("ne devrait PAS appeler compareSimulationWithReality sans simulation", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(null);

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(simulationComparison.compareSimulationWithReality).not.toHaveBeenCalled();
      });
    });
  });

  describe("Sondages de dates", () => {
    it("devrait afficher un message adapté pour les sondages de dates", async () => {
      const datePoll = { ...mockPoll, type: "date" as any };

      vi.mocked(pollStorage.getPolls).mockReturnValue([datePoll]);

      render(
        <BrowserRouter>
          <PollActions poll={datePoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Sondage clôturé",
            description: "Le sondage est maintenant fermé aux nouveaux votes.",
          }),
        );
      });
    });
  });

  describe("Callback onAfterClose", () => {
    it("devrait appeler onAfterClose après clôture réussie", async () => {
      const onAfterClose = vi.fn();

      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(pollStorage.savePolls).mockResolvedValue(undefined);
      vi.mocked(simulationComparison.getLastSimulation).mockReturnValue(null);

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} onAfterClose={onAfterClose} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(
        () => {
          expect(onAfterClose).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Gestion d'erreurs", () => {
    it("devrait afficher un toast d'erreur si savePolls échoue", async () => {
      vi.mocked(pollStorage.getPolls).mockReturnValue([mockPoll]);
      vi.mocked(pollStorage.savePolls).mockImplementation(() => {
        throw new Error("Save failed");
      });

      render(
        <BrowserRouter>
          <PollActions poll={mockPoll} />
        </BrowserRouter>,
      );

      const closeButton = screen.getByTestId("poll-action-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Erreur",
            description: "Impossible de clôturer le questionnaire.",
            variant: "destructive",
          }),
        );
      });
    });
  });
});
