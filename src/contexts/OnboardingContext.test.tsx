import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OnboardingProvider, useOnboarding } from "./OnboardingContext";

// Mock des dépendances
vi.mock("../lib/error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn((message, userMessage) => ({ message, userMessage })),
    critical: vi.fn((message, userMessage) => new Error(userMessage)),
  },
}));

// Composant de test pour utiliser le hook
function TestComponent({ onOnboarding }: { onOnboarding: (onboarding: any) => void }) {
  const onboarding = useOnboarding();
  onOnboarding(onboarding);
  return (
    <div>
      <div data-testid="is-completed">{onboarding.isCompleted ? "completed" : "not-completed"}</div>
      <div data-testid="is-open">{onboarding.isOpen ? "open" : "closed"}</div>
      <div data-testid="current-step">{onboarding.currentStep}</div>
      <button onClick={onboarding.startOnboarding} data-testid="start-btn">
        Start
      </button>
      <button onClick={onboarding.nextStep} data-testid="next-btn">
        Next
      </button>
      <button onClick={onboarding.previousStep} data-testid="prev-btn">
        Previous
      </button>
      <button onClick={onboarding.skipOnboarding} data-testid="skip-btn">
        Skip
      </button>
      <button onClick={onboarding.completeOnboarding} data-testid="complete-btn">
        Complete
      </button>
      <button onClick={onboarding.resetOnboarding} data-testid="reset-btn">
        Reset
      </button>
    </div>
  );
}

describe("OnboardingContext", () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(mockLocalStorage.getItem);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(mockLocalStorage.setItem);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(mockLocalStorage.removeItem);

    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe("Provider initialization", () => {
    it("should initialize with onboarding not completed", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: false,
          isOpen: false,
          currentStep: 0,
        })
      );
    });

    it("should initialize with onboarding completed from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("true");
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: true,
          isOpen: false,
          currentStep: 0,
        })
      );
    });

    it("should handle localStorage read error gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isCompleted: false, // Fallback to false
          isOpen: false,
          currentStep: 0,
        })
      );
    });
  });

  describe("Auto-opening behavior", () => {
    it("should auto-open onboarding after delay when not completed", async () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      // Initially closed
      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: false,
        })
      );

      // After 500ms delay, should open
      await waitFor(
        () => {
          expect(mockOnOnboarding).toHaveBeenCalledWith(
            expect.objectContaining({
              isOpen: true,
            })
          );
        },
        { timeout: 600 }
      );
    });

    it("should not auto-open when onboarding is completed", () => {
      mockLocalStorage.getItem.mockReturnValue("true");
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: false,
        })
      );
    });

    it("should not auto-open during E2E testing", () => {
      // Mock E2E environment
      Object.defineProperty(window, "location", {
        value: { search: "?e2e-test" },
        writable: true,
      });

      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: false,
        })
      );
    });

    it("should not auto-open when Playwright is detected", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Playwright",
        writable: true,
      });

      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      expect(mockOnOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: false,
        })
      );
    });
  });

  describe("Navigation methods", () => {
    it("should start onboarding", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      // Get the onboarding instance
      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.startOnboarding();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          currentStep: 0,
        })
      );
    });

    it("should navigate to next step", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.startOnboarding();
        onboarding.nextStep();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          currentStep: 1,
        })
      );
    });

    it("should navigate to previous step with minimum bound", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.startOnboarding();
        onboarding.nextStep();
        onboarding.previousStep();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          currentStep: 0,
        })
      );

      // Should not go below 0
      act(() => {
        onboarding.previousStep();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          currentStep: 0,
        })
      );
    });
  });

  describe("Completion methods", () => {
    it("should skip onboarding and mark as completed", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.skipOnboarding();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isCompleted: true,
          isOpen: false,
        })
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("doodates_onboarding_completed", "true");
    });

    it("should complete onboarding and mark as completed", () => {
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.completeOnboarding();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isCompleted: true,
          isOpen: false,
        })
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("doodates_onboarding_completed", "true");
    });

    it("should reset onboarding", () => {
      mockLocalStorage.getItem.mockReturnValue("true");
      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.resetOnboarding();
      });

      expect(mockOnOnboarding).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isCompleted: false,
          currentStep: 0,
        })
      );

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("doodates_onboarding_completed");
    });
  });

  describe("Error handling", () => {
    it("should handle localStorage write error in skipOnboarding", () => {
      const { logError, ErrorFactory } = require("../lib/error-handling");
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.skipOnboarding();
      });

      expect(logError).toHaveBeenCalledWith(
        ErrorFactory.storage(
          "Failed to save onboarding state to localStorage",
          "Impossible de sauvegarder l'état de l'onboarding"
        ),
        {
          component: "OnboardingProvider",
          operation: "skipOnboarding",
          metadata: { error: expect.any(Error) },
        }
      );
    });

    it("should handle localStorage write error in completeOnboarding", () => {
      const { logError, ErrorFactory } = require("../lib/error-handling");
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.completeOnboarding();
      });

      expect(logError).toHaveBeenCalledWith(
        ErrorFactory.storage(
          "Failed to save onboarding state to localStorage",
          "Impossible de sauvegarder l'état de l'onboarding"
        ),
        {
          component: "OnboardingProvider",
          operation: "completeOnboarding",
          metadata: { error: expect.any(Error) },
        }
      );
    });

    it("should handle localStorage remove error in resetOnboarding", () => {
      const { logError, ErrorFactory } = require("../lib/error-handling");
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      const mockOnOnboarding = vi.fn();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={mockOnOnboarding} />
        </OnboardingProvider>
      );

      const onboarding = mockOnOnboarding.mock.calls[0][0];

      act(() => {
        onboarding.resetOnboarding();
      });

      expect(logError).toHaveBeenCalledWith(
        ErrorFactory.storage(
          "Failed to remove onboarding state from localStorage",
          "Impossible de réinitialiser l'état de l'onboarding"
        ),
        {
          component: "OnboardingProvider",
          operation: "resetOnboarding",
          metadata: { error: expect.any(Error) },
        }
      );
    });
  });

  describe("useOnboarding hook", () => {
    it("should throw error when used outside provider", () => {
      const { ErrorFactory } = require("../lib/error-handling");

      expect(() => {
        render(<TestComponent onOnboarding={() => {}} />);
      }).toThrow("Le hook useOnboarding doit être utilisé dans un OnboardingProvider");
    });
  });

  describe("Integration with UI", () => {
    it("should allow button interactions", async () => {
      const user = userEvent.setup();

      render(
        <OnboardingProvider>
          <TestComponent onOnboarding={() => {}} />
        </OnboardingProvider>
      );

      const startBtn = screen.getByTestId("start-btn");
      const nextBtn = screen.getByTestId("next-btn");

      await user.click(startBtn);
      expect(screen.getByTestId("is-open")).toHaveTextContent("open");

      await user.click(nextBtn);
      expect(screen.getByTestId("current-step")).toHaveTextContent("1");
    });
  });
});
