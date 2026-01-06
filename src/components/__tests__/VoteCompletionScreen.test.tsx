import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { motion } from "framer-motion";
import VoteCompletionScreen from "../voting/VoteCompletionScreen";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props} data-testid="votecompletionscreen.test-button">
        {children}
      </button>
    ),
  },
}));

describe("VoteCompletionScreen", () => {
  const mockOnBack = vi.fn();
  const mockOnViewResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display completion message with voter name", () => {
    render(
      <VoteCompletionScreen
        voterName="John Doe"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText("Vote enregistré !")).toBeInTheDocument();
    expect(screen.getByText(/Merci John Doe pour votre participation/)).toBeInTheDocument();
  });

  it("should show 'Voir les résultats' button when onViewResults is provided", () => {
    render(
      <VoteCompletionScreen
        voterName="John"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    const resultsButton = screen.getByText("Voir les résultats");
    expect(resultsButton).toBeInTheDocument();
    expect(resultsButton).toBeEnabled();
  });

  it("should NOT show 'Voir les résultats' button when onViewResults is not provided", () => {
    render(<VoteCompletionScreen voterName="John" onBack={mockOnBack} />);

    expect(screen.queryByText("Voir les résultats")).not.toBeInTheDocument();
  });

  it("should call onViewResults when 'Voir les résultats' button is clicked", () => {
    render(
      <VoteCompletionScreen
        voterName="Jane"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    const resultsButton = screen.getByText("Voir les résultats");
    resultsButton.click();

    expect(mockOnViewResults).toHaveBeenCalledTimes(1);
  });

  it("should call onBack when 'Retour à l'accueil' button is clicked", () => {
    render(
      <VoteCompletionScreen
        voterName="Bob"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    const backButton = screen.getByText("Retour à l'accueil");
    backButton.click();

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("should display custom title and subtitle when provided", () => {
    render(
      <VoteCompletionScreen
        voterName="Alice"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        title="Vote terminé !"
        subtitle="Merci pour votre participation."
      />,
    );

    expect(screen.getByText("Vote terminé !")).toBeInTheDocument();
    expect(screen.getByText("Merci pour votre participation.")).toBeInTheDocument();
    expect(screen.queryByText("Vote enregistré !")).not.toBeInTheDocument();
  });

  it("should use default subtitle when custom subtitle is not provided", () => {
    render(
      <VoteCompletionScreen
        voterName="Charlie"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        title="Custom Title"
      />,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText(/Merci Charlie pour votre participation/)).toBeInTheDocument();
  });

  it("should use default voter name 'Participant' when not provided", () => {
    render(<VoteCompletionScreen onBack={mockOnBack} onViewResults={mockOnViewResults} />);

    expect(screen.getByText(/Merci Participant pour votre participation/)).toBeInTheDocument();
  });

  it("should apply correct color theme", () => {
    const { rerender } = render(
      <VoteCompletionScreen
        voterName="User"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        color="blue"
      />,
    );

    // Check that the component renders with blue theme
    expect(screen.getByText("Vote enregistré !")).toBeInTheDocument();

    // Re-render with different color
    rerender(
      <VoteCompletionScreen
        voterName="User"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        color="violet"
      />,
    );

    expect(screen.getByText("Vote enregistré !")).toBeInTheDocument();
  });

  it("should display beta information message", () => {
    render(
      <VoteCompletionScreen
        voterName="User"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText("Information bêta")).toBeInTheDocument();
    expect(screen.getByText(/Pour finaliser et partager votre sondage/)).toBeInTheDocument();
  });

  it("should render both buttons when onViewResults is provided", () => {
    render(
      <VoteCompletionScreen
        voterName="User"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    // Both buttons should be present
    expect(screen.getByText("Voir les résultats")).toBeInTheDocument();
    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();

    // Both should be enabled
    expect(screen.getByText("Voir les résultats")).toBeEnabled();
    expect(screen.getByText("Retour à l'accueil")).toBeEnabled();
  });

  it("should render only back button when onViewResults is not provided", () => {
    render(<VoteCompletionScreen voterName="User" onBack={mockOnBack} />);

    // Only back button should be present
    expect(screen.queryByText("Voir les résultats")).not.toBeInTheDocument();
    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
    expect(screen.getByText("Retour à l'accueil")).toBeEnabled();
  });
});
