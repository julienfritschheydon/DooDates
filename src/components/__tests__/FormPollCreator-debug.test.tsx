// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FormPollCreator from "../polls/FormPollCreator";
import { AuthProvider } from "../../contexts/AuthContext";
import { UIStateProvider } from "../prototype/UIStateProvider";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock guestEmailService
vi.mock("../../services/guestEmailService", () => ({
  guestEmailService: {
    getGuestEmail: vi.fn().mockResolvedValue(null),
  },
}));

// Providers handled by TestWrapper

// Test wrapper with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <UIStateProvider>
      <AuthProvider>{children}</AuthProvider>
    </UIStateProvider>
  </MemoryRouter>
);

// Mock savePolls function
vi.mock("@/lib/pollStorage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    savePolls: vi.fn(),
    validateDraft: vi.fn(() => ({ ok: true })),
  };
});

describe("FormPollCreator - Debug", () => {
  const mockOnSave = vi.fn();
  const mockOnFinalize = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it("should test visibility without adding questions", () => {
    render(
      <TestWrapper>
        <FormPollCreator onSave={mockOnSave} onFinalize={mockOnFinalize} onCancel={mockOnCancel} />
      </TestWrapper>,
    );

    // Open configuration accordion
    const configButton = screen.getByText(/Paramètres de configuration/);
    fireEvent.click(configButton);

    // Switch to visibility tab
    const visibilityTab = screen.getByRole("tab", { name: /Visibilité/i });
    fireEvent.click(visibilityTab);

    // Test visibility interaction
    const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
    expect(creatorOnlyRadio).toBeChecked();

    // Change to voters
    const votersRadio = screen.getByDisplayValue("voters");
    fireEvent.click(votersRadio);
    expect(votersRadio).toBeChecked();
    expect(creatorOnlyRadio).not.toBeChecked();

    // Change to public
    const publicRadio = screen.getByDisplayValue("public");
    fireEvent.click(publicRadio);
    expect(publicRadio).toBeChecked();
    expect(votersRadio).not.toBeChecked();
  });

  it("should test visibility with adding questions", () => {
    render(
      <TestWrapper>
        <FormPollCreator onSave={mockOnSave} onFinalize={mockOnFinalize} onCancel={mockOnCancel} />
      </TestWrapper>,
    );

    // Add a question FIRST (using new testid)
    const addQuestionButton = screen.getByTestId("nav-add-question");
    fireEvent.click(addQuestionButton);

    // THEN open configuration accordion
    const configButton = screen.getByText(/Paramètres de configuration/);
    fireEvent.click(configButton);

    // Switch to visibility tab
    const visibilityTab = screen.getByRole("tab", { name: /Visibilité/i });
    fireEvent.click(visibilityTab);

    // Check if visibility options are still available
    const allRadios = screen.queryAllByRole("radio");
    console.log("Radio buttons after adding question:", allRadios.length);

    try {
      const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
      console.log("creator-only radio found:", creatorOnlyRadio);
    } catch (e) {
      console.log("creator-only radio NOT found after adding question");
    }
  });
});
