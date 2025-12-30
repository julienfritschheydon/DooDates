import { describe, test, expect, vi, beforeEach } from "vitest";
import { sendVoteConfirmationEmail } from "../EmailService";
import type { Poll, FormResponse, FormQuestionShape } from "@/lib/pollStorage";

// Mock window.location pour les tests
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
  },
  writable: true,
});

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
    creator_id: "user-123",
    questions: [],
  };

  const mockResponse: FormResponse = {
    id: "response-1",
    pollId: "poll-1",
    respondentName: "Test User",
    respondentEmail: "test@example.com",
    items: [{ questionId: "q1", value: "Réponse test" }],
    created_at: new Date().toISOString(),
  };

  test("envoie email de confirmation avec données valides", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question test",
        kind: "text",
        required: true,
      },
    ];

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: mockResponse,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Question test"),
    });
  });

  test("génère HTML correct pour question texte", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question texte",
        kind: "text",
        required: true,
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [{ questionId: "q1", value: "Réponse texte" }],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Réponse texte"),
    });
  });

  test("génère HTML correct pour question choix unique", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question choix unique",
        kind: "single",
        required: true,
        options: [
          { id: "opt1", label: "Option A" },
          { id: "opt2", label: "Option B" },
        ],
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [{ questionId: "q1", value: "opt2" }],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Option B"),
    });
  });

  test("génère HTML correct pour question choix multiple", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question choix multiple",
        kind: "multiple",
        required: true,
        options: [
          { id: "opt1", label: "Option A" },
          { id: "opt2", label: "Option B" },
          { id: "opt3", label: "Option C" },
        ],
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [{ questionId: "q1", value: ["opt1", "opt3"] }],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Option A, Option C"),
    });
  });

  test("génère HTML correct pour question rating", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question rating",
        kind: "rating",
        required: true,
        ratingScale: 5,
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [{ questionId: "q1", value: 4 }],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("4/5"),
    });
  });

  test("génère HTML correct pour question NPS", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question NPS",
        kind: "nps",
        required: true,
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [{ questionId: "q1", value: 8 }],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("8/10"),
    });
  });

  test("génère HTML correct pour question matrix (single)", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question matrix",
        kind: "matrix",
        required: true,
        matrixRows: [
          { id: "row1", label: "Aspect 1" },
          { id: "row2", label: "Aspect 2" },
        ],
        matrixColumns: [
          { id: "col1", label: "Pas du tout" },
          { id: "col2", label: "Moyennement" },
          { id: "col3", label: "Beaucoup" },
        ],
        matrixType: "single",
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [
        {
          questionId: "q1",
          value: {
            row1: "col2",
            row2: "col3",
          },
        },
      ],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Aspect 1: Moyennement"),
    });
  });

  test("génère HTML correct pour question matrix (multiple)", async () => {
    const questions: FormQuestionShape[] = [
      {
        id: "q1",
        title: "Question matrix multiple",
        kind: "matrix",
        required: true,
        matrixRows: [{ id: "row1", label: "Aspect 1" }],
        matrixColumns: [
          { id: "col1", label: "Option A" },
          { id: "col2", label: "Option B" },
          { id: "col3", label: "Option C" },
        ],
        matrixType: "multiple",
      },
    ];

    const responseWithAnswer: FormResponse = {
      ...mockResponse,
      items: [
        {
          questionId: "q1",
          value: {
            row1: ["col1", "col3"],
          },
        },
      ],
    };

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: responseWithAnswer,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Aspect 1: Option A, Option C"),
    });
  });

  test('affiche "Anonyme" si respondentName est vide', async () => {
    const anonymousResponse: FormResponse = {
      ...mockResponse,
      respondentName: "",
    };

    const questions: FormQuestionShape[] = [];

    await sendVoteConfirmationEmail({
      poll: mockPoll,
      response: anonymousResponse,
      questions,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("📧 Email à envoyer:", {
      to: "test@example.com",
      subject: "Vos réponses : Test Poll",
      html: expect.stringContaining("Anonyme"),
    });
  });

  test("lance une erreur si respondentEmail est manquant", async () => {
    const responseWithoutEmail: FormResponse = {
      ...mockResponse,
      respondentEmail: undefined,
    };

    await expect(
      sendVoteConfirmationEmail({
        poll: mockPoll,
        response: responseWithoutEmail,
        questions: [],
      }),
    ).rejects.toThrow("Email du votant manquant");
  });
});
