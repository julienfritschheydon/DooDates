import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormPollCreator } from "../polls/FormPollCreator";
import type { FormPollDraft } from "@/lib/pollStorage";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock savePolls function
vi.mock("@/lib/pollStorage", () => ({
  savePolls: vi.fn(),
  validateDraft: vi.fn(() => ({ ok: true })),
}));

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
      <FormPollCreator
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Check that creator-only radio is selected by default
    const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
    expect(creatorOnlyRadio).toBeChecked();
  });

  it("should initialize with provided resultsVisibility from initialDraft", () => {
    const initialDraft: FormPollDraft = {
      id: "draft-1",
      type: "form",
      title: "Test Form",
      questions: [],
      resultsVisibility: "public",
    };

    render(
      <FormPollCreator
        initialDraft={initialDraft}
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Check that public radio is selected
    const publicRadio = screen.getByDisplayValue("public");
    expect(publicRadio).toBeChecked();

    // Check that creator-only is not selected
    const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
    expect(creatorOnlyRadio).not.toBeChecked();
  });

  it("should update resultsVisibility when radio buttons are clicked", () => {
    render(
      <FormPollCreator
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Initially creator-only should be selected
    const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
    expect(creatorOnlyRadio).toBeChecked();

    // Click on voters radio
    const votersRadio = screen.getByDisplayValue("voters");
    fireEvent.click(votersRadio);
    expect(votersRadio).toBeChecked();
    expect(creatorOnlyRadio).not.toBeChecked();

    // Click on public radio
    const publicRadio = screen.getByDisplayValue("public");
    fireEvent.click(publicRadio);
    expect(publicRadio).toBeChecked();
    expect(votersRadio).not.toBeChecked();
  });

  it("should include resultsVisibility in draft when onSave is called", () => {
    render(
      <FormPollCreator
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Change visibility to voters
    const votersRadio = screen.getByDisplayValue("voters");
    fireEvent.click(votersRadio);

    // Add a title and question to make the draft valid
    const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
    fireEvent.change(titleInput, { target: { value: "Test Form" } });

    // Add a question
    const addQuestionButton = screen.getByText(/Ajouter une question/);
    fireEvent.click(addQuestionButton);

    // Save the draft
    const saveButton = screen.getByText(/Enregistrer/);
    fireEvent.click(saveButton);

    // Check that onSave was called with the correct resultsVisibility
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        resultsVisibility: "voters",
      })
    );
  });

  it("should include resultsVisibility in draft when onFinalize is called", () => {
    render(
      <FormPollCreator
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Change visibility to public
    const publicRadio = screen.getByDisplayValue("public");
    fireEvent.click(publicRadio);

    // Add a title and question to make the draft valid
    const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
    fireEvent.change(titleInput, { target: { value: "Test Form" } });

    // Add a question
    const addQuestionButton = screen.getByText(/Ajouter une question/);
    fireEvent.click(addQuestionButton);

    // Finalize the draft
    const finalizeButton = screen.getByText(/Finaliser/);
    fireEvent.click(finalizeButton);

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
      <FormPollCreator
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Look for the results visibility section
    expect(screen.getByText(/Visibilité des résultats/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("creator-only")).toBeInTheDocument();
    expect(screen.getByDisplayValue("voters")).toBeInTheDocument();
    expect(screen.getByDisplayValue("public")).toBeInTheDocument();
    expect(screen.getByText("Moi uniquement")).toBeInTheDocument();
    expect(screen.getByText("Personnes ayant voté")).toBeInTheDocument();
    expect(screen.getByText("Public (tout le monde)")).toBeInTheDocument();
  });

  it("should maintain resultsVisibility state when other form fields change", () => {
    const initialDraft: FormPollDraft = {
      id: "draft-1",
      type: "form",
      title: "Initial Title",
      questions: [],
      resultsVisibility: "voters",
    };

    render(
      <FormPollCreator
        initialDraft={initialDraft}
        onSave={mockOnSave}
        onFinalize={mockOnFinalize}
        onCancel={mockOnCancel}
      />
    );

    // Verify initial state
    const votersRadio = screen.getByDisplayValue("voters");
    expect(votersRadio).toBeChecked();

    // Change title
    const titleInput = screen.getByDisplayValue("Initial Title");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    // Add a question
    const addQuestionButton = screen.getByText(/Ajouter une question/);
    fireEvent.click(addQuestionButton);

    // Verify resultsVisibility is still voters
    expect(votersRadio).toBeChecked();
    expect(screen.getByDisplayValue("creator-only")).not.toBeChecked();
    expect(screen.getByDisplayValue("public")).not.toBeChecked();
  });
});
