import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FormPollVote from "../polls/FormPollVote";
import { getPollBySlugOrId, addFormResponse, getFormResponses } from "../../lib/pollStorage";
import { sendVoteConfirmationEmail } from "../../services/EmailService";

vi.mock("../../lib/pollStorage");
vi.mock("../../services/EmailService");
vi.mock("../../lib/conditionalEvaluator", () => ({
  shouldShowQuestion: vi.fn(() => true),
}));

vi.mock("../../hooks/useThemeColor", () => ({
  useThemeColor: () => ({
    primary: "#3B82F6",
    bgCard: "#FFFFFF",
    border: "#E2E8F0",
    textPrimary: "#1E293B",
    textSecondary: "#475569",
    bgInput: "#F1F5F9",
  }),
}));

vi.mock("../../lib/themes", () => ({
  getThemeById: vi.fn(),
  applyTheme: vi.fn(),
  resetTheme: vi.fn(),
}));

Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000" },
  writable: true,
});

const mockGetPollBySlugOrId = vi.mocked(getPollBySlugOrId);
const mockAddFormResponse = vi.mocked(addFormResponse);
const mockGetFormResponses = vi.mocked(getFormResponses);
const mockSendVoteConfirmationEmail = vi.mocked(sendVoteConfirmationEmail);

describe("FormPollVote - Tests stables", () => {
  const mockPoll = {
    id: "test-poll-1",
    slug: "test-poll",
    title: "Sondage test",
    type: "form" as const,
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: "user-123",
    questions: [
      {
        id: "q1",
        title: "Question texte",
        kind: "text" as const,
        required: true,
      },
      {
        id: "q2",
        title: "Question choix unique",
        kind: "single" as const,
        required: true,
        options: [
          { id: "opt1", label: "Option A" },
          { id: "opt2", label: "Option B" },
        ],
      },
    ],
    resultsVisibility: "public" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPollBySlugOrId.mockReturnValue(mockPoll);
    mockGetFormResponses.mockReturnValue([]);
    mockAddFormResponse.mockResolvedValue({
      id: "response-123",
      pollId: "test-poll-1",
      created_at: new Date().toISOString(),
      items: [],
    });
    mockSendVoteConfirmationEmail.mockResolvedValue();
  });

  test("validation des champs requis", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FormPollVote idOrSlug="test-poll" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Sondage test")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Envoyer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ce champ est requis/)).toBeInTheDocument();
    });
  });

  test("flow avec email simplifié", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FormPollVote idOrSlug="test-poll" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Sondage test")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Entrez votre nom"), "Marie Durand");
    await user.type(screen.getByPlaceholderText("Votre réponse"), "Réponse test");
    const optionRadio = screen.getAllByRole("radio")[0];
    await user.click(optionRadio);

    const emailCheckbox = screen.getByRole("checkbox");
    await user.click(emailCheckbox);

    const emailInput = screen.getByPlaceholderText("votremail@example.com");
    await user.type(emailInput, "marie@example.com");

    await user.click(screen.getByRole("button", { name: /Envoyer/i }));

    await waitFor(() => {
      expect(mockSendVoteConfirmationEmail).toHaveBeenCalled();
    });
  });
});
