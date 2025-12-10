import { screen, fireEvent } from "@testing-library/react";
import type { FormPollDraft } from "../../polls/FormPollCreator";

/**
 * Helper class for testing FormPollCreator component
 * Provides reliable methods to interact with the component UI elements
 */
export class FormPollCreatorTestHelper {
  /**
   * Opens the configuration accordion where resultsVisibility options are located
   */
  static openConfigurationAccordion(): void {
    const configButton = screen.getByText(/Paramètres de configuration/);
    fireEvent.click(configButton);
    
    // Wait a bit for the accordion to open and content to render
    // This helps with timing issues in tests
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
      screen.getByDisplayValue("public")
    ];
  }

  /**
   * Sets the results visibility by clicking the appropriate radio button
   * @param visibility - The visibility to set
   */
  static setResultsVisibility(visibility: "creator-only" | "voters" | "public"): void {
    this.openConfigurationAccordion();
    const radio = this.getResultsVisibilityRadio(visibility);
    fireEvent.click(radio);
  }

  /**
   * Verifies that a specific visibility radio button is checked
   * @param visibility - The visibility that should be checked
   */
  static expectVisibilityChecked(visibility: "creator-only" | "voters" | "public"): void {
    this.openConfigurationAccordion();
    const radio = this.getResultsVisibilityRadio(visibility);
    expect(radio).toBeChecked();
  }

  /**
   * Verifies that a specific visibility radio button is NOT checked
   * @param visibility - The visibility that should NOT be checked
   */
  static expectVisibilityNotChecked(visibility: "creator-only" | "voters" | "public"): void {
    this.openConfigurationAccordion();
    const radio = this.getResultsVisibilityRadio(visibility);
    expect(radio).not.toBeChecked();
  }

  /**
   * Fills the minimum required fields to make the form valid
   * @param title - Form title (default: "Test Form")
   */
  static fillMinimumRequiredFields(title: string = "Test Form"): void {
    const titleInput = screen.getByPlaceholderText(/Ex: Questionnaire de satisfaction client/);
    fireEvent.change(titleInput, { target: { value: title } });
  }

  /**
   * Adds a question to the form
   */
  static addQuestion(): void {
    const addQuestionButton = screen.getByText(/Ajouter une question/);
    fireEvent.click(addQuestionButton);
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
  static expectConfigurationAccordionVisible(): void {
    this.openConfigurationAccordion();
    expect(screen.getByText(/Visibilité des résultats/)).toBeInTheDocument();
    expect(screen.getByText("Moi uniquement")).toBeInTheDocument();
    expect(screen.getByText("Personnes ayant voté")).toBeInTheDocument();
    expect(screen.getByText("Public (tout le monde)")).toBeInTheDocument();
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
    return screen.getByText(/Finaliser/);
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
  static setTitle(title: string): void {
    const titleInput = this.getTitleInput();
    fireEvent.change(titleInput, { target: { value: title } });
  }

  /**
   * Clicks the save button
   */
  static clickSave(): void {
    fireEvent.click(this.getSaveButton());
  }

  /**
   * Clicks the finalize button
   */
  static clickFinalize(): void {
    fireEvent.click(this.getFinalizeButton());
  }
}
