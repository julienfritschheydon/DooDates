import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { FormPollVote } from "../../components/polls/FormPollVote";
import { sendVoteConfirmationEmail } from "../../services/EmailService";
import { addPoll, addFormResponse, getFormResponses } from "../../lib/pollStorage";
import type { Poll, FormResponse } from "../../lib/pollStorage";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock console.log to capture email output
const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

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

describe("Form Poll Email Integration", () => {
  let testPoll: Poll;
  let testResponse: FormResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    consoleLogSpy.mockClear();
    
    // Create test poll
    testPoll = {
      id: "email-test-poll",
      slug: "email-test-poll",
      title: "Email Test Poll",
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
          title: "Question unique",
          options: [
            { id: "o1", label: "Option A" },
            { id: "o2", label: "Option B" },
            { id: "o3", label: "Option C" },
          ],
        },
        {
          id: "q2",
          kind: "multiple",
          title: "Question à choix multiples",
          options: [
            { id: "m1", label: "Choix 1" },
            { id: "m2", label: "Choix 2" },
            { id: "m3", label: "Choix 3" },
          ],
        },
        {
          id: "q3",
          kind: "text",
          title: "Question texte",
        },
        {
          id: "q4",
          kind: "rating",
          title: "Question notation",
          ratingScale: 5,
        },
        {
          id: "q5",
          kind: "matrix",
          title: "Question matrice",
          matrixRows: [
            { id: "r1", label: "Aspect 1" },
            { id: "r2", label: "Aspect 2" },
          ],
          matrixColumns: [
            { id: "c1", label: "Pas du tout" },
            { id: "c2", label: "Moyennement" },
            { id: "c3", label: "Beaucoup" },
          ],
          matrixType: "single",
        },
      ],
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
        { questionId: "q2", value: ["m1", "m3"] },
        { questionId: "q3", value: "Réponse texte libre" },
        { questionId: "q4", value: 4 },
        { questionId: "q5", value: { r1: "c2", r2: "c3" } },
      ],
    };
  });

  describe("Email Collection During Vote", () => {
    it("should collect email when user provides it during voting", async () => {
      addPoll(testPoll);
      
      const mockOnVoteComplete = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // Fill out the form with email
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "Email Test User");

      const emailInput = screen.getByPlaceholderText(/Votre email/);
      await userEvent.type(emailInput, "emailtest@example.com");

      // Answer single choice question
      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      // Answer multiple choice question
      const choice1 = screen.getByText("Choix 1");
      const choice3 = screen.getByText("Choix 3");
      await userEvent.click(choice1);
      await userEvent.click(choice3);

      // Answer text question
      const textInput = screen.getByRole("textbox");
      await userEvent.type(textInput, "Test email response");

      // Answer rating question (click 4th star)
      const ratingStars = screen.getAllByRole("button", { name: /Étoile/i });
      await userEvent.click(ratingStars[3]); // 4th star = rating 4

      // Answer matrix question
      const matrixRow1Col2 = screen.getByLabelText(/Aspect 1.*Moyennement/);
      const matrixRow2Col3 = screen.getByLabelText(/Aspect 2.*Beaucoup/);
      await userEvent.click(matrixRow1Col2);
      await userEvent.click(matrixRow2Col3);

      // Submit the vote
      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      // Verify the response was saved with email
      const responses = getFormResponses(testPoll.id);
      expect(responses).toHaveLength(1);
      expect(responses[0].respondentEmail).toBe("emailtest@example.com");
      expect(responses[0].respondentName).toBe("Email Test User");

      expect(mockOnVoteComplete).toHaveBeenCalled();
    });

    it("should save response without email when user doesn't provide it", async () => {
      addPoll(testPoll);
      
      const mockOnVoteComplete = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // Fill out the form without email
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "No Email User");

      // Answer minimum required questions
      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      // Submit the vote
      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      // Verify the response was saved without email
      const responses = getFormResponses(testPoll.id);
      expect(responses).toHaveLength(1);
      expect(responses[0].respondentEmail).toBeUndefined();
      expect(responses[0].respondentName).toBe("No Email User");

      expect(mockOnVoteComplete).toHaveBeenCalled();
    });

    it("should validate email format before submission", async () => {
      addPoll(testPoll);
      
      const mockOnVoteComplete = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // Fill out the form with invalid email
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "Invalid Email User");

      const emailInput = screen.getByPlaceholderText(/Votre email/);
      await userEvent.type(emailInput, "invalid-email");

      // Answer a question
      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      // Try to submit the vote
      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitInput);

      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText(/Email invalide/)).toBeInTheDocument();
      });

      // Vote should not be completed
      expect(mockOnVoteComplete).not.toHaveBeenCalled();
    });
  });

  describe("Email Service Integration", () => {
    it("should send confirmation email with all question types", async () => {
      await sendVoteConfirmationEmail({
        poll: testPoll,
        response: testResponse,
        questions: testPoll.questions,
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const emailData = consoleLogSpy.mock.calls[0][1];

      // Verify email structure
      expect(emailData.to).toBe("test@example.com");
      expect(emailData.subject).toBe("Vos réponses : Email Test Poll");
      expect(emailData.html).toContain("Test User");

      // Verify all question types are included
      expect(emailData.html).toContain("Question unique");
      expect(emailData.html).toContain("Option A");
      expect(emailData.html).toContain("Question à choix multiples");
      expect(emailData.html).toContain("Choix 1");
      expect(emailData.html).toContain("Choix 3");
      expect(emailData.html).toContain("Question texte");
      expect(emailData.html).toContain("Réponse texte libre");
      expect(emailData.html).toContain("Question notation");
      expect(emailData.html).toContain("4/5");
      expect(emailData.html).toContain("Question matrice");
      expect(emailData.html).toContain("Aspect 1");
      expect(emailData.html).toContain("Moyennement");
    });

    it("should handle anonymous responses", async () => {
      const anonymousResponse = { ...testResponse, respondentName: undefined };

      await sendVoteConfirmationEmail({
        poll: testPoll,
        response: anonymousResponse,
        questions: testPoll.questions,
      });

      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.html).toContain("Anonyme");
    });

    it("should include link to results page", async () => {
      await sendVoteConfirmationEmail({
        poll: testPoll,
        response: testResponse,
        questions: testPoll.questions,
      });

      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.html).toContain("/poll/email-test-poll/results");
    });

    it("should throw error when email is missing", async () => {
      const responseWithoutEmail = { ...testResponse, respondentEmail: undefined };

      await expect(
        sendVoteConfirmationEmail({
          poll: testPoll,
          response: responseWithoutEmail,
          questions: testPoll.questions,
        })
      ).rejects.toThrow("Email du votant manquant");
    });
  });

  describe("Complete Email Flow", () => {
    it("should handle complete flow: vote with email -> save response -> send confirmation", async () => {
      // Step 1: User votes with email
      addPoll(testPoll);
      
      const mockOnVoteComplete = vi.fn();
      const mockSendEmail = vi.fn();
      
      // Mock the email service to track calls
      vi.mock("../../services/EmailService", () => ({
        sendVoteConfirmationEmail: mockSendEmail,
      }));

      render(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // User fills form with email
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "Complete Flow User");

      const emailInput = screen.getByPlaceholderText(/Votre email/);
      await userEvent.type(emailInput, "complete@example.com");

      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      // Verify response was saved
      const responses = getFormResponses(testPoll.id);
      expect(responses).toHaveLength(1);
      expect(responses[0].respondentEmail).toBe("complete@example.com");

      // Step 2: Send confirmation email
      await sendVoteConfirmationEmail({
        poll: testPoll,
        response: responses[0],
        questions: testPoll.questions,
      });

      // Verify email was sent
      expect(consoleLogSpy).toHaveBeenCalled();
      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.to).toBe("complete@example.com");
      expect(emailData.html).toContain("Complete Flow User");

      expect(mockOnVoteComplete).toHaveBeenCalled();
    });

    it("should handle email opt-out gracefully", async () => {
      addPoll(testPoll);
      
      const mockOnVoteComplete = vi.fn();
      
      render(
        <TestWrapper>
          <FormPollVote poll={testPoll} onVoteComplete={mockOnVoteComplete} />
        </TestWrapper>
      );

      // User votes without email
      const nameInput = screen.getByPlaceholderText(/Votre nom/);
      await userEvent.type(nameInput, "No Email User");

      const optionA = screen.getByText("Option A");
      await userEvent.click(optionA);

      const submitButton = screen.getByText(/Envoyer/);
      await userEvent.click(submitButton);

      // Verify response was saved without email
      const responses = getFormResponses(testPoll.id);
      expect(responses).toHaveLength(1);
      expect(responses[0].respondentEmail).toBeUndefined();

      // Email service should not be called for users without email
      expect(mockOnVoteComplete).toHaveBeenCalled();

      // If we try to send email, it should fail gracefully
      await expect(
        sendVoteConfirmationEmail({
          poll: testPoll,
          response: responses[0],
          questions: testPoll.questions,
        })
      ).rejects.toThrow("Email du votant manquant");
    });
  });

  describe("Email Content Validation", () => {
    it("should properly format different question types in email", async () => {
      // Test with "Autre" option
      const pollWithOther = {
        ...testPoll,
        questions: [
          {
            id: "q1",
            kind: "single",
            title: "Question avec Autre",
            options: [
              { id: "o1", label: "Option A" },
              { id: "o2", label: "Option B" },
              { id: "other", label: "Autre", isOther: true },
            ],
          },
        ],
      } as any;

      const responseWithOther = {
        ...testResponse,
        items: [{ questionId: "q1", value: "other: Réponse personnalisée" }],
      };

      await sendVoteConfirmationEmail({
        poll: pollWithOther,
        response: responseWithOther,
        questions: pollWithOther.questions,
      });

      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.html).toContain("Réponse personnalisée");
    });

    it("should handle NPS questions correctly", async () => {
      const pollWithNPS = {
        ...testPoll,
        questions: [
          {
            id: "nps1",
            kind: "nps",
            title: "Question NPS",
          },
        ],
      } as any;

      const responseNPS = {
        ...testResponse,
        items: [{ questionId: "nps1", value: 9 }],
      };

      await sendVoteConfirmationEmail({
        poll: pollWithNPS,
        response: responseNPS,
        questions: pollWithNPS.questions,
      });

      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.html).toContain("Question NPS");
      expect(emailData.html).toContain("9/10");
    });

    it("should handle date questions correctly", async () => {
      const pollWithDate = {
        ...testPoll,
        questions: [
          {
            id: "date1",
            kind: "date",
            title: "Question date",
            selectedDates: ["2025-01-15", "2025-01-16"],
          },
        ],
      } as any;

      const responseDate = {
        ...testResponse,
        items: [
          {
            questionId: "date1",
            value: {
              "2025-01-15": { vote: "yes", timeSlots: [{ hour: 9, minute: 0 }] },
              "2025-01-16": { vote: "no", timeSlots: [] },
            },
          },
        ],
      };

      await sendVoteConfirmationEmail({
        poll: pollWithDate,
        response: responseDate,
        questions: pollWithDate.questions,
      });

      const emailData = consoleLogSpy.mock.calls[0][1];
      expect(emailData.html).toContain("Question date");
      expect(emailData.html).toContain("2025-01-15");
      expect(emailData.html).toContain("Oui");
      expect(emailData.html).toContain("2025-01-16");
      expect(emailData.html).toContain("Non");
    });
  });
});
