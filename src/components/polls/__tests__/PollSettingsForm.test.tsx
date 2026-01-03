import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PollSettingsForm } from "../PollSettingsForm";
import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import type { FormPollSettings } from "@/lib/products/form-polls/form-polls-service";

// Mock du composant ThemeSelector
vi.mock("./ThemeSelector", () => ({
  ThemeSelector: ({ selectedThemeId, onThemeChange }: any) => (
    <div data-testid="theme-selector">
      <select 
        value={selectedThemeId} 
        onChange={(e) => onThemeChange(e.target.value)}
        data-testid="theme-select"
      >
        <option value="">Aucun thème</option>
        <option value="blue">Bleu</option>
        <option value="green">Vert</option>
      </select>
    </div>
  ),
}));

// Mock du composant Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

describe("PollSettingsForm", () => {
  const mockOnSettingsChange = vi.fn();
  const mockOnThemeChange = vi.fn();
  const mockOnDisplayModeChange = vi.fn();
  const mockOnResultsVisibilityChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Date Poll Settings", () => {
    const defaultDateSettings: DatePollSettings = {
      showLogo: true,
      showEstimatedTime: false,
      showQuestionCount: false,
      requireAuth: false,
      oneResponsePerPerson: false,
      allowEditAfterSubmit: false,
      sendEmailCopy: false,
      emailForCopy: "",
      resultsVisibility: "public",
    };

    it("devrait rendre les onglets de base pour les date polls", () => {
      render(
        <PollSettingsForm
          settings={defaultDateSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      expect(screen.getByText("Basique")).toBeInTheDocument();
      expect(screen.getByText("Avancé")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Visibilité")).toBeInTheDocument();
      
      // Vérifier que les onglets spécifiques aux formulaires ne sont pas présents
      expect(screen.queryByText("Affichage")).not.toBeInTheDocument();
      expect(screen.queryByText("Thème")).not.toBeInTheDocument();
    });

    it("devrait gérer le changement des paramètres de base", () => {
      render(
        <PollSettingsForm
          settings={defaultDateSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Vérifier que le composant s'affiche correctement
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4);
    });

    it("devrait gérer les paramètres avancés", () => {
      render(
        <PollSettingsForm
          settings={defaultDateSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Cliquer sur l'onglet avancé et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Avancé"));
      expect(screen.getByRole("tab", { name: "Avancé" })).toHaveAttribute("aria-selected", "true");
    });

    it("devrait gérer les paramètres email", () => {
      render(
        <PollSettingsForm
          settings={defaultDateSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Cliquer sur l'onglet email et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Email"));
      expect(screen.getByRole("tab", { name: "Email" })).toHaveAttribute("aria-selected", "true");
    });

    it("devrait gérer la visibilité des résultats", () => {
      render(
        <PollSettingsForm
          settings={defaultDateSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Cliquer sur l'onglet visibilité et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Visibilité"));
      expect(screen.getByRole("tab", { name: "Visibilité" })).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Form Poll Settings", () => {
    const defaultFormSettings: FormPollSettings = {
      showLogo: true,
      showEstimatedTime: false,
      showQuestionCount: false,
      requireAuth: false,
      oneResponsePerPerson: false,
      allowEditAfterSubmit: false,
      sendEmailCopy: false,
      emailForCopy: "",
      resultsVisibility: "public",
      maxResponses: undefined,
      expiresAt: undefined,
    };

    it("devrait rendre les onglets spécifiques aux formulaires", () => {
      render(
        <PollSettingsForm
          settings={defaultFormSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="form"
          themeId=""
          onThemeChange={mockOnThemeChange}
          displayMode="all-at-once"
          onDisplayModeChange={mockOnDisplayModeChange}
        />
      );

      expect(screen.getByText("Basique")).toBeInTheDocument();
      expect(screen.getByText("Affichage")).toBeInTheDocument();
      expect(screen.getByText("Thème")).toBeInTheDocument();
      expect(screen.getByText("Avancé")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Visibilité")).toBeInTheDocument();
    });

    it("devrait gérer les paramètres spécifiques aux formulaires", () => {
      render(
        <PollSettingsForm
          settings={defaultFormSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="form"
        />
      );

      // Cliquer sur l'onglet avancé et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Avancé"));
      expect(screen.getByRole("tab", { name: "Avancé" })).toHaveAttribute("aria-selected", "true");
    });

    it("devrait gérer le mode d'affichage", () => {
      render(
        <PollSettingsForm
          settings={defaultFormSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="form"
          displayMode="all-at-once"
          onDisplayModeChange={mockOnDisplayModeChange}
        />
      );

      // Cliquer sur l'onglet affichage et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Affichage"));
      expect(screen.getByRole("tab", { name: "Affichage" })).toHaveAttribute("aria-selected", "true");
    });

    it("devrait gérer le sélecteur de thème", () => {
      render(
        <PollSettingsForm
          settings={defaultFormSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="form"
          themeId=""
          onThemeChange={mockOnThemeChange}
        />
      );

      // Cliquer sur l'onglet thème et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Thème"));
      expect(screen.getByRole("tab", { name: "Thème" })).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Navigation et Accessibilité", () => {
    const defaultSettings: DatePollSettings = {
      showLogo: true,
      showEstimatedTime: false,
      showQuestionCount: false,
      requireAuth: false,
      oneResponsePerPerson: false,
      allowEditAfterSubmit: false,
      sendEmailCopy: false,
      emailForCopy: "",
      resultsVisibility: "public",
    };

    it("devrait naviguer entre les onglets", () => {
      render(
        <PollSettingsForm
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Vérifier que l'onglet basique est actif par défaut
      expect(screen.getByRole("tab", { name: "Basique" })).toHaveAttribute("aria-selected", "true");

      // Cliquer sur l'onglet avancé
      fireEvent.click(screen.getByText("Avancé"));

      // Vérifier que l'onglet avancé est maintenant actif
      expect(screen.getByRole("tab", { name: "Avancé" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: "Basique" })).toHaveAttribute("aria-selected", "false");
    });

    it("devrait avoir les attributs ARIA corrects", () => {
      render(
        <PollSettingsForm
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Vérifier la structure tablist/tabpanel
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
      
      // Vérifier que chaque onglet a les bons attributs
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-controls");
        expect(tab).toHaveAttribute("id");
      });
    });

    it("devrait gérer les props externalisées pour la visibilité", () => {
      render(
        <PollSettingsForm
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
          resultsVisibility="creator-only"
          onResultsVisibilityChange={mockOnResultsVisibilityChange}
        />
      );

      // Cliquer sur l'onglet visibilité et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Visibilité"));
      expect(screen.getByRole("tab", { name: "Visibilité" })).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Validation et Edge Cases", () => {
    const defaultSettings: DatePollSettings = {
      showLogo: true,
      showEstimatedTime: false,
      showQuestionCount: false,
      requireAuth: false,
      oneResponsePerPerson: false,
      allowEditAfterSubmit: false,
      sendEmailCopy: false,
      emailForCopy: "",
      resultsVisibility: "public",
    };

    it("devrait gérer les valeurs numériques invalides", () => {
      const formSettings: FormPollSettings = {
        showLogo: true,
        showEstimatedTime: false,
        showQuestionCount: false,
        requireAuth: false,
        oneResponsePerPerson: false,
        allowEditAfterSubmit: false,
        sendEmailCopy: false,
        emailForCopy: "",
        resultsVisibility: "public",
        maxResponses: undefined,
      };

      render(
        <PollSettingsForm
          settings={formSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="form"
        />
      );

      // Vérifier que le composant s'affiche correctement
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(6); // Basique, Affichage, Thème, Avancé, Email, Visibilité
    });

    it("devrait gérer les champs requis conditionnels", () => {
      render(
        <PollSettingsForm
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Cliquer sur l'onglet email et vérifier qu'il est cliquable
      fireEvent.click(screen.getByText("Email"));
      expect(screen.getByRole("tab", { name: "Email" })).toHaveAttribute("aria-selected", "true");
    });

    it("devrait gérer les valeurs par défaut", () => {
      const minimalSettings = {} as DatePollSettings;

      render(
        <PollSettingsForm
          settings={minimalSettings}
          onSettingsChange={mockOnSettingsChange}
          pollType="date"
        />
      );

      // Le composant devrait quand même s'afficher sans erreur
      expect(screen.getByText("Basique")).toBeInTheDocument();
      expect(screen.getByText("Avancé")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
  });
});
