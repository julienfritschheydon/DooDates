import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("should initialize with creator-only visibility by default", async () => {
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
    await FormPollCreatorTestHelper.expectVisibilityChecked("creator-only");
  });

  it("should initialize with provided resultsVisibility from initialDraft", async () => {
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
    await FormPollCreatorTestHelper.expectVisibilityChecked("voters");

    // Verify others are not selected
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("public");
  });

  it("should update resultsVisibility when radio buttons are clicked", async () => {
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
    await FormPollCreatorTestHelper.expectVisibilityChecked("creator-only");

    // Click on voters radio
    await FormPollCreatorTestHelper.setResultsVisibility("voters");
    await FormPollCreatorTestHelper.expectVisibilityChecked("voters");
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");

    // Click on public radio
    await FormPollCreatorTestHelper.setResultsVisibility("public");
    await FormPollCreatorTestHelper.expectVisibilityChecked("public");
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("voters");
  });

  it("should include resultsVisibility in draft when onSave is called", async () => {
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
    await FormPollCreatorTestHelper.setResultsVisibility("voters");

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

  it("should include resultsVisibility in draft when onFinalize is called", async () => {
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
    await FormPollCreatorTestHelper.setResultsVisibility("public");

    // Add a title and question to make the draft valid
    FormPollCreatorTestHelper.fillMinimumRequiredFields();
    FormPollCreatorTestHelper.addQuestion();

    // Finalize the draft
    FormPollCreatorTestHelper.clickFinalize();

    // Wait for the async finalize operation to complete
    await waitFor(() => {
      expect(mockOnFinalize).toHaveBeenCalled();
    });

    // Check that onFinalize was called with the correct resultsVisibility
    expect(mockOnFinalize).toHaveBeenCalledWith(
      expect.objectContaining({
        resultsVisibility: "public",
      }),
      expect.any(Object) // savedPoll is now an object after creation
    );
  });

  it("should show configuration panel when resultsVisibility options are displayed", async () => {
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
    await FormPollCreatorTestHelper.expectConfigurationAccordionVisible();
  });

  it("should maintain resultsVisibility state when other form fields change", async () => {
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
    await FormPollCreatorTestHelper.expectVisibilityChecked("voters");

    // Change title
    FormPollCreatorTestHelper.setTitle("New Title");

    // Add a question
    FormPollCreatorTestHelper.addQuestion();

    // Verify resultsVisibility is still voters
    await FormPollCreatorTestHelper.expectVisibilityChecked("voters");
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("creator-only");
    await FormPollCreatorTestHelper.expectVisibilityNotChecked("public");
  });
});
