import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FormPollCreator from "../polls/FormPollCreator";
import type { FormPollDraft } from "../polls/FormPollCreator";
import { AuthProvider } from "../../contexts/AuthContext";
import { UIStateProvider } from "../prototype/UIStateProvider";
import { FormPollCreatorTestHelper } from "./helpers/FormPollCreatorTestHelper";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

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
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    savePolls: vi.fn(),
    validateDraft: vi.fn(() => ({ ok: true })),
  };
});

describe("FormPollCreator - resultsVisibility", () => {
  const mockOnSave = vi.fn();
  const mockOnFinalize = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("should initialize with creator-only visibility by default", () => {
    render(
      <TestWrapper>
        <FormPollCreator
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Check that creator-only radio is selected by default
    FormPollCreatorTestHelper.expectVisibilityChecked("creator-only");
  });

  it("should initialize with provided resultsVisibility from initialDraft", () => {
    const initialDraft = FormPollCreatorTestHelper.createTestDraft({
      resultsVisibility: "voters",
    });

    render(
      <TestWrapper>
        <FormPollCreator
          initialDraft={initialDraft}
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Verify voters is selected
    FormPollCreatorTestHelper.expectVisibilityChecked("voters");
    
    // Verify others are not selected
    FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");
    FormPollCreatorTestHelper.expectVisibilityNotChecked("public");
  });

  it("should update resultsVisibility when radio buttons are clicked", () => {
    render(
      <TestWrapper>
        <FormPollCreator
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Initially creator-only should be selected
    FormPollCreatorTestHelper.expectVisibilityChecked("creator-only");

    // Click on voters radio
    FormPollCreatorTestHelper.setResultsVisibility("voters");
    FormPollCreatorTestHelper.expectVisibilityChecked("voters");
    FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");

    // Click on public radio
    FormPollCreatorTestHelper.setResultsVisibility("public");
    FormPollCreatorTestHelper.expectVisibilityChecked("public");
    FormPollCreatorTestHelper.expectVisibilityNotChecked("voters");
  });

  it("should include resultsVisibility in draft when onSave is called", () => {
    render(
      <TestWrapper>
        <FormPollCreator
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Change visibility to voters
    FormPollCreatorTestHelper.setResultsVisibility("voters");

    // Add a title and question to make the draft valid
    FormPollCreatorTestHelper.fillMinimumRequiredFields();
    FormPollCreatorTestHelper.addQuestion();

    // Save the draft
    FormPollCreatorTestHelper.clickSave();

    // Check that onSave was called with the correct resultsVisibility
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        resultsVisibility: "voters",
      })
    );
  });

  it("should include resultsVisibility in draft when onFinalize is called", () => {
    render(
      <TestWrapper>
        <FormPollCreator
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Change visibility to public
    FormPollCreatorTestHelper.setResultsVisibility("public");

    // Add a title and question to make the draft valid
    FormPollCreatorTestHelper.fillMinimumRequiredFields();
    FormPollCreatorTestHelper.addQuestion();

    // Finalize the draft
    FormPollCreatorTestHelper.clickFinalize();

    // Check that onFinalize was called with the correct resultsVisibility
    expect(mockOnFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        resultsVisibility: "public",
      }),
      undefined // savedPoll is undefined for new polls
    );
  });

  it("should show configuration panel when resultsVisibility options are displayed", () => {
    render(
      <TestWrapper>
        <FormPollCreator
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Look for the results visibility section
    FormPollCreatorTestHelper.expectConfigurationAccordionVisible();
  });

  it("should maintain resultsVisibility state when other form fields change", () => {
    const initialDraft = FormPollCreatorTestHelper.createTestDraft({
      title: "Initial Title",
      resultsVisibility: "voters",
    });

    render(
      <TestWrapper>
        <FormPollCreator
          initialDraft={initialDraft}
          onSave={mockOnSave}
          onFinalize={mockOnFinalize}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Verify initial state
    FormPollCreatorTestHelper.expectVisibilityChecked("voters");

    // Change title
    FormPollCreatorTestHelper.setTitle("New Title");

    // Add a question
    FormPollCreatorTestHelper.addQuestion();

    // Verify resultsVisibility is still voters
    FormPollCreatorTestHelper.expectVisibilityChecked("voters");
    FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");
    FormPollCreatorTestHelper.expectVisibilityNotChecked("public");
  });
});
