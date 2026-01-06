import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoteCompletionScreen from "../voting/VoteCompletionScreen";

// Mock framer-motion pour éviter les animations dans les tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props} data-testid="votecompletionscreen-conditional.test-button">
        {children}
      </button>
    ),
  },
}));

describe("VoteCompletionScreen - Affichage conditionnel bouton", () => {
  const mockOnBack = vi.fn();
  const mockOnViewResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('affiche le bouton "Voir les résultats" quand onViewResults est fourni', () => {
    render(
      <VoteCompletionScreen
        voterName="Jean"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText("Voir les résultats")).toBeInTheDocument();
    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
  });

  test("n'affiche pas le bouton \"Voir les résultats\" quand onViewResults n'est pas fourni", () => {
    render(<VoteCompletionScreen voterName="Jean" onBack={mockOnBack} />);

    expect(screen.queryByText("Voir les résultats")).not.toBeInTheDocument();
    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
  });

  test('appelle onViewResults quand on clique sur "Voir les résultats"', async () => {
    const user = userEvent.setup();
    render(
      <VoteCompletionScreen
        voterName="Marie"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    const viewResultsButton = screen.getByText("Voir les résultats");
    await user.click(viewResultsButton);

    expect(mockOnViewResults).toHaveBeenCalledTimes(1);
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  test('appelle onBack quand on clique sur "Retour à l\'accueil" avec onViewResults', async () => {
    const user = userEvent.setup();
    render(
      <VoteCompletionScreen
        voterName="Pierre"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    const backButton = screen.getByText("Retour à l'accueil");
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
    expect(mockOnViewResults).not.toHaveBeenCalled();
  });

  test('appelle onBack quand on clique sur "Retour à l\'accueil" sans onViewResults', async () => {
    const user = userEvent.setup();
    render(<VoteCompletionScreen voterName="Sophie" onBack={mockOnBack} />);

    const backButton = screen.getByText("Retour à l'accueil");
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test("affiche le message personnalisé avec le nom du votant", () => {
    render(
      <VoteCompletionScreen
        voterName="Alice"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText(/Merci Alice pour votre participation/)).toBeInTheDocument();
  });

  test("utilise le titre personnalisé quand fourni", () => {
    render(
      <VoteCompletionScreen
        voterName="Bob"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        title="Vote terminé !"
      />,
    );

    expect(screen.getByText("Vote terminé !")).toBeInTheDocument();
    expect(screen.queryByText("Vote enregistré !")).not.toBeInTheDocument();
  });

  test("utilise le sous-titre personnalisé quand fourni", () => {
    render(
      <VoteCompletionScreen
        voterName="Claire"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        subtitle="Votre réponse a été enregistrée avec succès."
      />,
    );

    expect(screen.getByText("Votre réponse a été enregistrée avec succès.")).toBeInTheDocument();
    expect(screen.queryByText(/Merci Claire pour votre participation/)).not.toBeInTheDocument();
  });

  test("applique les bonnes couleurs selon la prop color", () => {
    const { rerender } = render(
      <VoteCompletionScreen
        voterName="Test"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        color="blue"
      />,
    );

    // Vérifier que le bouton "Voir les résultats" a les classes bleues
    expect(screen.getByText("Voir les résultats")).toHaveClass("text-blue-600", "border-blue-200");

    // Rerender avec la couleur verte
    rerender(
      <VoteCompletionScreen
        voterName="Test"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        color="green"
      />,
    );

    expect(screen.getByText("Voir les résultats")).toHaveClass(
      "text-green-600",
      "border-green-200",
    );
  });

  test("affiche l'icône check avec la bonne couleur", () => {
    render(
      <VoteCompletionScreen
        voterName="Test"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
        color="violet"
      />,
    );

    // Vérifier que l'icône check est présente via sa classe Lucide
    const checkIcon = document.querySelector(".lucide-check");
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass("text-violet-600");
  });

  test("gère le nom du votant par défaut", () => {
    render(<VoteCompletionScreen onBack={mockOnBack} onViewResults={mockOnViewResults} />);

    expect(screen.getByText(/Merci Participant pour votre participation/)).toBeInTheDocument();
  });

  test("affiche le message d'information bêta", () => {
    render(
      <VoteCompletionScreen
        voterName="Test"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText("Information bêta")).toBeInTheDocument();
    expect(screen.getByText(/Pour finaliser et partager votre sondage/)).toBeInTheDocument();
  });

  test('le bouton "Retour à l\'accueil" est toujours visible', () => {
    // Test avec onViewResults
    const { unmount } = render(
      <VoteCompletionScreen
        voterName="Test"
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />,
    );

    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
    unmount();

    // Test sans onViewResults
    render(<VoteCompletionScreen voterName="Test" onBack={mockOnBack} />);

    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
  });
});
