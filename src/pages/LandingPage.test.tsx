import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Calendar: () => <div data-testid="calendar-icon">📅</div>,
  Sparkles: () => <div data-testid="sparkles-icon">✨</div>,
  Check: () => <div data-testid="check-icon">✓</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">→</div>,
  Bot: () => <div data-testid="bot-icon">🤖</div>,
  Clock: () => <div data-testid="clock-icon">🕒</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
  BarChart3: () => <div data-testid="barchart-icon">📊</div>,
  MessageSquare: () => <div data-testid="message-icon">💬</div>,
}));

describe("LandingPage", () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic rendering", () => {
    it("should render the main layout", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("DooDates")).toBeInTheDocument();
      expect(screen.getByText("Planification simple conçue pour")).toBeInTheDocument();
      expect(screen.getByText("Comment ça marche ?")).toBeInTheDocument();
      expect(screen.getByText("Des cas d'usage pour tous les besoins")).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
      expect(screen.getByText("Tarifs")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
    });

    it.skip("should render call-to-action buttons", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Créer un sondage")).toBeInTheDocument();
      expect(screen.getByText("Créer un formulaire")).toBeInTheDocument();
      expect(screen.getByText("Créer une disponibilité")).toBeInTheDocument();
    });
  });

  describe.skip("Rotating use cases", () => {
    it("should start with first use case", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("les réunions d'équipe")).toBeInTheDocument();
    });

    it("should rotate through use cases", async () => {
      renderWithRouter(<LandingPage />);

      // Initial state
      expect(screen.getByText("les réunions d'équipe")).toBeInTheDocument();

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText("les rendez-vous clients")).toBeInTheDocument();
      });

      // Fast-forward another 3 seconds
      vi.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText("les sessions de formation")).toBeInTheDocument();
      });

      // Fast-forward another 3 seconds (should wrap around)
      vi.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText("les réunions d'équipe")).toBeInTheDocument();
      });
    });

    it("should show all use cases in rotation", () => {
      const useCases = [
        "les réunions d'équipe",
        "les rendez-vous clients",
        "les sessions de formation",
        "les événements communautaires",
        "les consultations médicales",
        "les entretiens de recrutement",
      ];

      renderWithRouter(<LandingPage />);

      // Test that all use cases are eventually shown
      useCases.forEach((useCase, index) => {
        if (index > 0) {
          vi.advanceTimersByTime(3000);
        }
        expect(screen.getByText(useCase)).toBeInTheDocument();
      });
    });
  });

  describe("How it works section", () => {
    it("should render the three steps", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Créez votre sondage avec l'IA")).toBeInTheDocument();
      expect(screen.getByText("Testez et partagez en quelques clics")).toBeInTheDocument();
      expect(screen.getByText("Analysez les réponses avec l'IA")).toBeInTheDocument();
    });

    it("should render step numbers", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render step descriptions", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText(/Décrivez simplement votre besoin/)).toBeInTheDocument();
      expect(screen.getByText(/Prévisualisez le sondage/)).toBeInTheDocument();
      expect(screen.getByText(/L'IA met en avant les tendances/)).toBeInTheDocument();
    });
  });

  describe("Use cases section", () => {
    it("should render all use case cards", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Réunions d'équipe")).toBeInTheDocument();
      expect(screen.getByText("Rendez-vous clients")).toBeInTheDocument();
      expect(screen.getByText("Formations")).toBeInTheDocument();
      expect(screen.getByText("Sondages d'opinion")).toBeInTheDocument();
      expect(screen.getByText("Événements")).toBeInTheDocument();
      expect(screen.getByText("Entretiens")).toBeInTheDocument();
    });

    it("should render icons for each use case", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
      expect(screen.getByTestId("message-icon")).toBeInTheDocument();
      expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
      expect(screen.getByTestId("barchart-icon")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });

    it("should render use case descriptions", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText(/Organisez vos stand-ups/)).toBeInTheDocument();
      expect(screen.getByText(/Laissez vos clients choisir/)).toBeInTheDocument();
      expect(screen.getByText(/Planifiez vos sessions de formation/)).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("should render footer sections", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("DooDates")).toBeInTheDocument();
      expect(screen.getByText("Produit")).toBeInTheDocument();
      expect(screen.getByText("Ressources")).toBeInTheDocument();
      expect(screen.getByText("Support")).toBeInTheDocument();
    });

    it.skip("should render footer links", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Créer un sondage")).toBeInTheDocument();
      expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
      expect(screen.getByText("Tarifs")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("FAQ")).toBeInTheDocument();
    });

    it("should render copyright", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("© 2025 DooDates. Tous droits réservés.")).toBeInTheDocument();
    });
  });

  describe.skip("Navigation and links", () => {
    it("should render header navigation links", () => {
      renderWithRouter(<LandingPage />);

      const dashboardLink = screen.getByText("Tableau de bord");
      const pricingLink = screen.getByText("Tarifs");
      const docsLink = screen.getByText("Documentation");

      expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard");
      expect(pricingLink.closest("a")).toHaveAttribute("href", "/pricing");
      expect(docsLink.closest("a")).toHaveAttribute("href", "/docs");
    });

    it("should render primary CTA buttons with correct links", () => {
      renderWithRouter(<LandingPage />);

      const datePollBtn = screen.getByText("Créer un sondage");
      const formBtn = screen.getByText("Créer un formulaire");
      const availabilityBtn = screen.getByText("Créer une disponibilité");

      expect(datePollBtn.closest("a")).toHaveAttribute("href", "/workspace/date");
      expect(formBtn.closest("a")).toHaveAttribute("href", "/workspace/form");
      expect(availabilityBtn.closest("a")).toHaveAttribute("href", "/create/availability");
    });

    it("should render footer links", () => {
      renderWithRouter(<LandingPage />);

      const footerDashboardLink = screen.getAllByText("Tableau de bord")[1]; // Second occurrence in footer
      const footerPricingLink = screen.getAllByText("Tarifs")[1];
      const footerDocsLink = screen.getAllByText("Documentation")[1];

      expect(footerDashboardLink.closest("a")).toHaveAttribute("href", "/dashboard");
      expect(footerPricingLink.closest("a")).toHaveAttribute("href", "/pricing");
      expect(footerDocsLink.closest("a")).toHaveAttribute("href", "/docs");
    });
  });

  describe.skip("Content and messaging", () => {
    it.skip("should render hero headline", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Planification simple conçue pour")).toBeInTheDocument();
      expect(screen.getByText("Créez des sondages de dates, des formulaires ou des disponibilités en quelques clics. L'IA est toujours disponible pour vous aider.")).toBeInTheDocument();
      expect(screen.getByText("Simplifiez la planification de vos réunions et événements.")).toBeInTheDocument();
    });

    it.skip("should render tagline and branding", () => {
      renderWithRouter(<LandingPage />);

      expect(screen.getByText("Simplifiez la planification de vos réunions et événements.")).toBeInTheDocument();
    });
  });

  describe("Accessibility and semantics", () => {
    it("should have proper heading hierarchy", () => {
      renderWithRouter(<LandingPage />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Planification simple conçue pour");

      const h2Elements = screen.getAllByRole("heading", { level: 2 });
      expect(h2Elements).toHaveLength(2);
      expect(h2Elements[0]).toHaveTextContent("Comment ça marche ?");
      expect(h2Elements[1]).toHaveTextContent("Des cas d'usage pour tous les besoins");
    });

    it("should have descriptive link text", () => {
      renderWithRouter(<LandingPage />);

      const links = screen.getAllByRole("link");
      links.forEach(link => {
        expect(link.textContent).not.toBe("");
        expect(link.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe("Styling and visual elements", () => {
    it("should apply gradient text to rotating use cases", () => {
      renderWithRouter(<LandingPage />);

      const useCaseElement = screen.getByText("les réunions d'équipe");
      expect(useCaseElement).toHaveClass("text-transparent", "bg-clip-text", "bg-gradient-to-r", "from-purple-500", "to-blue-500");
    });

    it("should apply gradient backgrounds to CTA buttons", () => {
      renderWithRouter(<LandingPage />);

      // Use getAllByText to handle multiple occurrences, then pick the first one (hero section)
      const datePollButtons = screen.getAllByText("Créer un sondage");
      const formButtons = screen.getAllByText("Créer un formulaire");
      const availabilityButtons = screen.getAllByText("Créer une disponibilité");

      expect(datePollButtons[0].closest("a")).toHaveClass("bg-gradient-to-r", "from-blue-500", "to-blue-600");
      expect(formButtons[0].closest("a")).toHaveClass("bg-gradient-to-r", "from-violet-500", "to-violet-600");
      expect(availabilityButtons[0].closest("a")).toHaveClass("bg-gradient-to-r", "from-green-500", "to-green-600");
    });

    it("should apply proper spacing and layout classes", () => {
      renderWithRouter(<LandingPage />);

      const heroSection = screen.getByText("Planification simple conçue pour").closest("section");
      expect(heroSection).toHaveClass("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8", "py-20");
    });
  });

  describe("Performance and cleanup", () => {
    it("should clean up interval on unmount", () => {
      const { unmount } = renderWithRouter(<LandingPage />);

      // Spy on clearInterval
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it("should not cause memory leaks with rapid re-renders", () => {
      const { rerender } = renderWithRouter(<LandingPage />);

      // Re-render multiple times quickly
      for (let i = 0; i < 5; i++) {
        rerender(
          <MemoryRouter>
            <LandingPage />
          </MemoryRouter>
        );
      }

      // Should still work without issues
      expect(screen.getByText("les réunions d'équipe")).toBeInTheDocument();
    });
  });

  describe.skip("Responsive behavior", () => {
    it("should render mobile-friendly layout classes", () => {
      renderWithRouter(<LandingPage />);

      const heroContainer = screen.getByText("Planification simple conçue pour").closest("div");
      expect(heroContainer).toHaveClass("text-center");

      // Use getAllByText and pick the first occurrence (hero section)
      const datePollButtons = screen.getAllByText("Créer un sondage");
      const ctaContainer = datePollButtons[0].closest("div");
      expect(ctaContainer).toHaveClass("flex", "flex-col", "sm:flex-row");
    });
  });

  describe("Animation and transitions", () => {
    it("should apply fade-in animation to rotating text", () => {
      renderWithRouter(<LandingPage />);

      const useCaseElement = screen.getByText("les réunions d'équipe");
      expect(useCaseElement).toHaveClass("animate-fade-in");
    });

    it("should apply hover effects to buttons", () => {
      renderWithRouter(<LandingPage />);

      // Use getAllByText and pick the first occurrence (hero section)
      const datePollButtons = screen.getAllByText("Créer un sondage");
      const linkElement = datePollButtons[0].closest("a");

      expect(linkElement).toHaveClass("hover:from-blue-600", "hover:to-blue-700", "transition-colors");
    });
  });
});
