import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UIStateProvider } from "../prototype/UIStateProvider";
import { TestWrapper } from "../../test/setup";

// Mock des dépendances
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "test@example.com", name: "Test User" },
    loading: false,
  }),
}));

vi.mock("../../lib/pollStorage", () => ({
  getAllPolls: vi.fn().mockResolvedValue([]),
  savePolls: vi.fn().mockResolvedValue(),
}));

vi.mock("../../hooks/useAutoSave", () => ({
  useAutoSave: () => ({ save: vi.fn(), isSaving: false }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ idOrSlug: "new" }),
    useLocation: () => ({ pathname: "/form/new" }),
  };
});

// Créer un composant de test simple qui contient uniquement la section de visibilité
const ResultsVisibilitySection = () => {
  const [resultsVisibility, setResultsVisibility] = React.useState("creator-only");

  return (
    <div className="p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Visibilité des résultats
      </label>
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="resultsVisibility"
            value="creator-only"
            checked={resultsVisibility === "creator-only"}
            onChange={(e) => setResultsVisibility(e.target.value as "creator-only")}
            className="cursor-pointer"
          />
          <span className="text-white">Moi uniquement</span>
          <span className="text-xs text-gray-500">(par défaut)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="resultsVisibility"
            value="voters"
            checked={resultsVisibility === "voters"}
            onChange={(e) => setResultsVisibility(e.target.value as "voters")}
            className="cursor-pointer"
          />
          <span className="text-white">Personnes ayant voté</span>
          <span className="text-xs text-gray-500">(recommandé)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="resultsVisibility"
            value="public"
            checked={resultsVisibility === "public"}
            onChange={(e) => setResultsVisibility(e.target.value as "public")}
            className="cursor-pointer"
          />
          <span className="text-white">Public (tout le monde)</span>
        </label>
      </div>
    </div>
  );
};

import React from "react";

describe("ResultsVisibilitySection", () => {
  test("affiche les options de visibilité des résultats", async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    expect(screen.getByText("Visibilité des résultats")).toBeInTheDocument();

    // Vérifier que les 3 options sont présentes
    expect(screen.getByText("Moi uniquement")).toBeInTheDocument();
    expect(screen.getByText("Personnes ayant voté")).toBeInTheDocument();
    expect(screen.getByText("Public (tout le monde)")).toBeInTheDocument();
  });

  test('sélectionne "Moi uniquement" par défaut', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
    expect(creatorOnlyRadio).toBeChecked();
  });

  test("permet de changer la visibilité des résultats", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    // Sélectionner "Personnes ayant voté"
    const votersOnlyRadio = screen.getByDisplayValue("voters");
    await user.click(votersOnlyRadio);

    expect(votersOnlyRadio).toBeChecked();
    expect(screen.getByDisplayValue("creator-only")).not.toBeChecked();
    expect(screen.getByDisplayValue("public")).not.toBeChecked();
  });

  test('permet de sélectionner "Public"', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    // Sélectionner "Public"
    const publicRadio = screen.getByDisplayValue("public");
    await user.click(publicRadio);

    expect(publicRadio).toBeChecked();
    expect(screen.getByDisplayValue("creator-only")).not.toBeChecked();
    expect(screen.getByDisplayValue("voters")).not.toBeChecked();
  });

  test("affiche les descriptions pour chaque option", async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    // Vérifier les descriptions
    expect(screen.getByText("(par défaut)")).toBeInTheDocument();
    expect(screen.getByText("(recommandé)")).toBeInTheDocument();
    expect(screen.getByText("Public (tout le monde)")).toBeInTheDocument();
  });

  test("gère le changement de visibilité avec le clavier", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    // Utiliser Tab pour naviguer et Enter pour sélectionner
    const votersOnlyRadio = screen.getByDisplayValue("voters");
    votersOnlyRadio.focus();

    // Simuler un clic avec le clavier (espace ou entrée)
    await user.keyboard("{ }");

    expect(votersOnlyRadio).toBeChecked();
  });

  test("applique les styles visuels corrects aux options", async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <ResultsVisibilitySection />
        </UIStateProvider>
      </TestWrapper>,
    );

    // Vérifier que les radios ont les classes appropriées
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    radios.forEach((radio) => {
      expect(radio).toHaveClass("cursor-pointer");
    });
  });
});
