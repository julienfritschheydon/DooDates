import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendVoteConfirmationEmail } from "../EmailService";
import type { Poll, FormResponse, FormQuestionShape } from "@/lib/pollStorage";

// Mock console.log to capture email output
const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

beforeEach(() => {
  consoleLogSpy.mockClear();
});

describe("EmailService", () => {
  const mockPoll: Poll = {
    id: "poll-1",
    slug: "test-poll",
    title: "Test Poll",
    type: "form",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: "creator-1",
    dates: [],
    questions: [
      {
        id: "q1",
        kind: "single",
        title: "Question 1",
        options: [
          { id: "o1", label: "Option 1" },
          { id: "o2", label: "Option 2" },
        ],
      },
      {
        id: "q2",
        kind: "text",
        title: "Question 2",
      },
      {
        id: "q3",
        kind: "multiple",
        title: "Question 3",
        options: [
          { id: "o3", label: "Option A" },
          { id: "o4", label: "Option B" },
        ],
      },
      {
        id: "q4",
        kind: "rating",
        title: "Question 4",
        ratingScale: 5,
      },
      {
        id: "q5",
        kind: "nps",
        title: "Question 5",
      },
    ] as FormQuestionShape[],
  };

  const mockResponse: FormResponse = {
    id: "resp-1",
    pollId: "poll-1",
    respondentName: "John Doe",
    respondentEmail: "john@example.com",
    created_at: new Date().toISOString(),
    items: [
      { questionId: "q1", value: "o1" },
      { questionId: "q2", value: "Réponse texte libre" },
      { questionId: "q3", value: ["o3", "o4"] },
      { questionId: "q4", value: 4 },
      { questionId: "q5", value: 8 },
    ],
  };

  it("should send email with all question types", async () => {
    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: mockResponse,
      questions: mockPoll.questions as FormQuestionShape[],
    });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArgs = consoleLogSpy.mock.calls[0][0];
    expect(callArgs).toContain("📧 Email à envoyer:");

    const emailData = consoleLogSpy.mock.calls[0][1];
    expect(emailData.to).toBe("john@example.com");
    expect(emailData.subject).toBe("Vos réponses : Test Poll");
    expect(emailData.html).toContain("John Doe");
    expect(emailData.html).toContain("Option 1");
    expect(emailData.html).toContain("Réponse texte libre");
    expect(emailData.html).toContain("Option A");
    expect(emailData.html).toContain("Option B");
    expect(emailData.html).toContain("4/5");
    expect(emailData.html).toContain("8/10");
  });

  it("should throw error when email is missing", async () => {
    const responseWithoutEmail = {
      ...mockResponse,
      respondentEmail: undefined,
    };

    await expect(
      sendVoteConfirmationEmail({
        poll: mockPoll,
        response: responseWithoutEmail,
        questions: mockPoll.questions as FormQuestionShape[],
      }),
    ).rejects.toThrow("Email du votant manquant");
  });

  it("should handle matrix questions", async () => {
    const pollWithMatrix: Poll = {
      ...mockPoll,
      questions: [
        {
          id: "q1",
          kind: "matrix",
          title: "Matrix Question",
          matrixRows: [
            { id: "r1", label: "Row 1" },
            { id: "r2", label: "Row 2" },
          ],
          matrixColumns: [
            { id: "c1", label: "Col 1" },
            { id: "c2", label: "Col 2" },
          ],
          matrixType: "single",
        },
      ] as FormQuestionShape[],
    };

    const responseWithMatrix: FormResponse = {
      ...mockResponse,
      items: [
        {
          questionId: "q1",
          value: {
            r1: "c1",
            r2: "c2",
          },
        },
      ],
    };

    await sendVoteConfirmationEmail({
      poll: pollWithMatrix,
      response: responseWithMatrix,
      questions: pollWithMatrix.questions as FormQuestionShape[],
    });

    const emailData = consoleLogSpy.mock.calls[0][1];
    expect(emailData.html).toContain("Matrix Question");
    expect(emailData.html).toContain("Row 1");
    expect(emailData.html).toContain("Col 1");
  });

  it("should handle anonymous respondent", async () => {
    const anonymousResponse: FormResponse = {
      ...mockResponse,
      respondentName: undefined,
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: anonymousResponse,
      questions: mockPoll.questions as FormQuestionShape[],
    });

    const emailData = consoleLogSpy.mock.calls[0][1];
    expect(emailData.html).toContain("Anonyme");
  });

  it("should include link to results page", async () => {
    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: mockResponse,
      questions: mockPoll.questions as FormQuestionShape[],
    });

    const emailData = consoleLogSpy.mock.calls[0][1];
    expect(emailData.html).toContain("/poll/test-poll/results");
  });
});
