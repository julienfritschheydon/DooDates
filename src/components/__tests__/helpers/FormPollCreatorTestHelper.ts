import { screen, fireEvent, waitFor } from "@testing-library/react";
import type { FormPollDraft } from "../../polls/FormPollCreator";

/**
 * Helper class for testing FormPollCreator component
 * Provides reliable methods to interact with the component UI elements
 */
export class FormPollCreatorTestHelper {
  /**
   * Opens the configuration accordion
   */
  static async openConfigurationAccordion(): Promise<void> {
    // Find the button using role to access aria-expanded
    // Note: partial match because of icon/structure
    const configButton = screen.getByRole("button", { name: /Paramètres de configuration/i });

    if (configButton.getAttribute("aria-expanded") === "false") {
      await fireEvent.click(configButton);
      // Wait for the panel content (tablist) to appear
      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
      });
    }
  }

  /**
   * Switches to the visibility tab in settings
   */
  static async switchToVisibilityTab(): Promise<void> {
    await this.openConfigurationAccordion();
    const tab = screen.getByRole("tab", { name: /Visibilité/i });

    if (tab.getAttribute("aria-selected") === "false") {
      await fireEvent.click(tab);
      // Wait for visibility content
      await waitFor(() => {
        expect(screen.getByText("Visibilité des résultats")).toBeInTheDocument();
      });
    }
  }

  /**
   * Gets a results visibility radio button by its value
   * @param visibility - The visibility value ("creator-only", "voters", "public")
   * @returns The radio button element
   */
  static getResultsVisibilityRadio(visibility: "creator-only" | "voters" | "public") {
    return screen.getByDisplayValue(visibility);
  }

  /**
   * Gets all results visibility radio buttons
   * @returns Array of radio button elements
   */
  static getAllResultsVisibilityRadios() {
    return [
      screen.getByDisplayValue("creator-only"),
      screen.getByDisplayValue("voters"),
      screen.getByDisplayValue("public"),
    ];
  }

  /**
   * Sets the results visibility by clicking the appropriate radio button
   * @param visibility - The visibility to set
   */
  static async setResultsVisibility(
    visibility: "creator-only" | "voters" | "public",
  ): Promise<void> {
    await this.switchToVisibilityTab();
    const radio = this.getResultsVisibilityRadio(visibility);
    await fireEvent.click(radio);
  }

  /**
   * Verifies that a specific visibility radio button is checked
   * @param visibility - The visibility that should be checked
   */
  static async expectVisibilityChecked(
    visibility: "creator-only" | "voters" | "public",
  ): Promise<void> {
    await this.switchToVisibilityTab();
    const radio = this.getResultsVisibilityRadio(visibility);
    expect(radio).toBeChecked();
  }

  /**
   * Verifies that a specific visibility radio button is NOT checked
   * @param visibility - The visibility that should NOT be checked
   */
  static async expectVisibilityNotChecked(
    visibility: "creator-only" | "voters" | "public",
  ): Promise<void> {
    await this.switchToVisibilityTab();
    const radio = this.getResultsVisibilityRadio(visibility);
    expect(radio).not.toBeChecked();
  }

  /**
   * Fills the minimum required fields to make the form valid
   * @param title - Form title (default: "Test Form")
   */
  static async fillMinimumRequiredFields(title: string = "Test Form"): Promise<void> {
    const titleInput = screen.getByPlaceholderText(/Ex: Questionnaire de satisfaction client/);
    await fireEvent.change(titleInput, { target: { value: title } });
  }

  /**
   * Adds a question to the form
   */
  static async addQuestion(): Promise<void> {
    const addQuestionButton = screen.getByTestId("nav-add-question");
    await fireEvent.click(addQuestionButton);
  }

  /**
   * Creates a valid test draft with all required properties
   * @param overrides - Optional properties to override defaults
   * @returns A FormPollDraft object
   */
  static createTestDraft(overrides: Partial<FormPollDraft> = {}): FormPollDraft {
    return {
      id: "test-draft-id",
      type: "form",
      title: "Test Form",
      questions: [],
      resultsVisibility: "creator-only",
      ...overrides,
    };
  }

  /**
   * Verifies that the configuration accordion is visible and contains expected elements
   */
  static async expectConfigurationAccordionVisible(): Promise<void> {
    await this.switchToVisibilityTab();
    expect(screen.getByText(/Visibilité des résultats/)).toBeInTheDocument();
    expect(screen.getByText("Créateur uniquement")).toBeInTheDocument();
    expect(screen.getByText("Participants après vote")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  }

  /**
   * Gets the save button element
   */
  static getSaveButton() {
    return screen.getByText(/Enregistrer/);
  }

  /**
   * Gets the finalize button element
   */
  static getFinalizeButton() {
    return screen.getByRole("button", { name: /Publier le formulaire/i });
  }

  /**
   * Gets the title input element
   */
  static getTitleInput() {
    return screen.getByPlaceholderText(/Ex: Questionnaire de satisfaction client/);
  }

  /**
   * Sets the form title
   * @param title - The title to set
   */
  static async setTitle(title: string): Promise<void> {
    const titleInput = this.getTitleInput();
    await fireEvent.change(titleInput, { target: { value: title } });
  }

  /**
   * Clicks the save button
   */
  static async clickSave(): Promise<void> {
    await fireEvent.click(this.getSaveButton());
  }

  /**
   * Clicks the finalize button
   */
  static async clickFinalize(): Promise<void> {
    await fireEvent.click(this.getFinalizeButton());
  }
}
