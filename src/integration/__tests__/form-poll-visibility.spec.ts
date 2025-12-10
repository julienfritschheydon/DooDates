import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { FormPollCreator } from "../../components/polls/FormPollCreator";
import { FormPollVote } from "../../components/polls/FormPollVote";
import { FormPollResults } from "../../components/polls/FormPollResults";
import { addPoll, addFormResponse, getFormResponses, checkIfUserHasVoted } from "../../lib/pollStorage";
import type { Poll, FormResponse } from "../../lib/pollStorage";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock Supabase auth
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
    },
  },
}));

// Wrapper for routing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("Form Poll Visibility Integration", () => {
  let testPoll: Poll;
  let testResponse: FormResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Create test poll with different visibility settings
    testPoll = {
      id: "visibility-test-poll",
      slug: "visibility-test-poll",
      title: "Test Visibility Poll",
      type: "form",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: "creator-123",
      dates: [],
      questions: [
        {
          id: "q1",
          kind: "single",
          title: "Question 1",
          options: [
            { id: "o1", label: "Option A" },
            { id: "o2", label: "Option B" },
          ],
        },
        {
          id: "q2",
          kind: "text",
          title: "Question 2",
        },
      ],
      resultsVisibility: "voters", // Test with voters visibility
    } as any;

    testResponse = {
      id: "resp-1",
      pollId: testPoll.id,
      respondentName: "Test User",
      respondentEmail: "test@example.com",
      created_at: new Date().toISOString(),
      deviceId: "device-123",
      items: [
        { questionId: "q1", value: "o1" },
        { questionId: "q2", value: "Text response" },
      ],
    };
  });

  describe("Poll Creation with Visibility Settings", () => {
    it("should create poll with creator-only visibility", async () => {
      const mockOnSave = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollCreator onSave={mockOnSave} onFinalize={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
      await userEvent.type(titleInput, "Test Poll");

      // Add a question
      const addQuestionButton = screen.getByText(/Ajouter une question/);
      await userEvent.click(addQuestionButton);

      // Verify creator-only is selected by default
      const creatorOnlyRadio = screen.getByDisplayValue("creator-only");
      expect(creatorOnlyRadio).toBeChecked();

      // Save the poll
      const saveButton = screen.getByText(/Enregistrer/);
      await userEvent.click(saveButton);

      // Verify onSave was called with creator-only visibility
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Poll",
          resultsVisibility: "creator-only",
        })
      );
    });

    it("should create poll with voters visibility", async () => {
      const mockOnSave = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollCreator onSave={mockOnSave} onFinalize={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
      await userEvent.type(titleInput, "Test Poll");

      // Add a question
      const addQuestionButton = screen.getByText(/Ajouter une question/);
      await userEvent.click(addQuestionButton);

      // Change visibility to voters
      const votersRadio = screen.getByDisplayValue("voters");
      await userEvent.click(votersRadio);

      // Save the poll
      const saveButton = screen.getByText(/Enregistrer/);
      await userEvent.click(saveButton);

      // Verify onSave was called with voters visibility
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Poll",
          resultsVisibility: "voters",
        })
      );
    });

    it("should create poll with public visibility", async () => {
      const mockOnSave = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollCreator onSave={mockOnSave} onFinalize={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
      await userEvent.type(titleInput, "Test Poll");

      // Add a question
      const addQuestionButton = screen.getByText(/Ajouter une question/);
      await userEvent.click(addQuestionButton);

      // Change visibility to public
      const publicRadio = screen.getByDisplayValue("public");
      await userEvent.click(publicRadio);

      // Save the poll
      const saveButton = screen.getByText(/Enregistrer/);
      await userEvent.click(saveButton);

      // Verify onSave was called with public visibility
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Poll",
          resultsVisibility: "public",
        })
      );
    });
  });

  describe("Voting Flow and Results Access", () => {
    it("should allow access to results after voting when visibility is 'voters'", async () => {
      // Setup poll and response
      addPoll(testPoll);
      
      // Mock the vote completion callback
      const mockOnVoteComplete = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollVote 
            poll={testPoll} 
            onVoteComplete={mockOnVoteComplete}
          />
        </TestWrapper>
      );

      // User should not have voted initially
      expect(checkIfUserHasVoted(testPoll.id)).toBe(false);

      // Fill out the form
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "Test Voter");

      const emailInput = screen.getByPlaceholderText(/Votre email/);
      await userEvent.type(emailInput, "voter@example.com");

      // Select option for single choice question
      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      // Fill text question
      const textInput = screen.getByRole("textbox");
      await userEvent.type(textInput, "Test response");

      // Submit the vote
      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      // Verify user has voted
      expect(checkIfUserHasVoted(testPoll.id)).toBe(true);

      // Verify onVoteComplete was called (this would typically show results button)
      expect(mockOnVoteComplete).toHaveBeenCalled();
    });

    it("should not show results button for non-voters when visibility is 'voters'", async () => {
      // Create poll with voters visibility
      const votersOnlyPoll = { ...testPoll, resultsVisibility: "voters" as const };
      addPoll(votersOnlyPoll);

      // Mock VoteCompletionScreen without onViewResults
      const mockOnBack = vi.fn();
      const { VoteCompletionScreen } = await import("../../components/voting/VoteCompletionScreen");
      
      render(
        <TestWrapper>
          <VoteCompletionScreen
            voterName="NonVoter"
            onBack={mockOnBack}
            // onViewResults is not provided - should not show results button
          />
        </TestWrapper>
      );

      // Should not show results button
      expect(screen.queryByText("Voir les résultats")).not.toBeInTheDocument();
      expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
    });

    it("should show results button for voters when visibility is 'voters'", async () => {
      // Setup: user has voted
      addPoll(testPoll);
      addFormResponse(testResponse);

      const mockOnBack = vi.fn();
      const mockOnViewResults = vi.fn();
      const { VoteCompletionScreen } = await import("../../components/voting/VoteCompletionScreen");
      
      render(
        <TestWrapper>
          <VoteCompletionScreen
            voterName="Test User"
            onBack={mockOnBack}
            onViewResults={mockOnViewResults}
          />
        </TestWrapper>
      );

      // Should show results button
      expect(screen.getByText("Voir les résultats")).toBeInTheDocument();
      expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();

      // Click results button
      await userEvent.click(screen.getByText("Voir les résultats"));
      expect(mockOnViewResults).toHaveBeenCalled();
    });
  });

  describe("Results Component Visibility", () => {
    it("should display results when user has voting rights", async () => {
      // Setup: user has voted
      addPoll(testPoll);
      addFormResponse(testResponse);

      render(
        <TestWrapper>
          <FormPollResults poll={testPoll} userHasVoted={true} />
        </TestWrapper>
      );

      // Should show results content
      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });

    it("should restrict access when user has not voted and visibility is 'voters'", async () => {
      // Setup: poll with voters visibility, user hasn't voted
      const votersOnlyPoll = { ...testPoll, resultsVisibility: "voters" as const };
      addPoll(votersOnlyPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={votersOnlyPoll} userHasVoted={false} />
        </TestWrapper>
      );

      // Should show access restricted message
      await waitFor(() => {
        expect(screen.getByText(/Accès aux résultats réservé/)).toBeInTheDocument();
      });
    });

    it("should allow access for public visibility regardless of voting status", async () => {
      // Setup: poll with public visibility
      const publicPoll = { ...testPoll, resultsVisibility: "public" as const };
      addPoll(publicPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={publicPoll} userHasVoted={false} />
        </TestWrapper>
      );

      // Should show results even though user hasn't voted
      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });

    it("should allow access for creator regardless of visibility", async () => {
      // Setup: poll with creator-only visibility, simulate creator access
      const creatorOnlyPoll = { ...testPoll, resultsVisibility: "creator-only" as const };
      addPoll(creatorOnlyPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={creatorOnlyPoll} userHasVoted={false} isCreator={true} />
        </TestWrapper>
      );

      // Should show results for creator
      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });
  });

  describe("Complete Flow Integration", () => {
    it("should handle complete flow: creation -> voting -> results access", async () => {
      // Step 1: Create poll with voters visibility
      const mockOnFinalize = vi.fn();
      
      const { rerender } = render(
        <TestWrapper>
          <FormPollCreator onSave={vi.fn()} onFinalize={mockOnFinalize} onCancel={vi.fn()} />
        </TestWrapper>
      );

      // Fill form and set visibility
      const titleInput = screen.getByPlaceholderText(/Donnez un titre/);
      await userEvent.type(titleInput, "Integration Test Poll");

      const addQuestionButton = screen.getByText(/Ajouter une question/);
      await userEvent.click(addQuestionButton);

      const votersRadio = screen.getByDisplayValue("voters");
      await userEvent.click(votersRadio);

      const finalizeButton = screen.getByText(/Finaliser/);
      await userEvent.click(finalizeButton);

      // Verify poll was created with correct visibility
      expect(mockOnFinalize).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Integration Test Poll",
          resultsVisibility: "voters",
        }),
        undefined
      );

      // Step 2: Simulate voting (would normally navigate to vote page)
      addPoll(testPoll);
      const mockOnVoteComplete = vi.fn();
      
      rerender(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // User votes
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "Integration User");

      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      expect(mockOnVoteComplete).toHaveBeenCalled();

      // Step 3: Show results (user now has access)
      const mockOnBack = vi.fn();
      const mockOnViewResults = vi.fn();
      const { VoteCompletionScreen } = await import("../../components/voting/VoteCompletionScreen");
      
      rerender(
        <TestWrapper>
          <VoteCompletionScreen
            voterName="Integration User"
            onBack={mockOnBack}
            onViewResults={mockOnViewResults}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Voir les résultats")).toBeInTheDocument();
      
      await userEvent.click(screen.getByText("Voir les résultats"));
      expect(mockOnViewResults).toHaveBeenCalled();
    });
  });
});
