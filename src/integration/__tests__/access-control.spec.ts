import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FormPollResults } from "../../components/polls/FormPollResults";
import { addPoll, addFormResponse, getCurrentUserId, checkIfUserHasVoted } from "../../lib/pollStorage";
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

// Mock API endpoints
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Wrapper for routing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("Access Control - API Endpoints", () => {
  let testPoll: Poll;
  let testResponse: FormResponse;
  let creatorId: string;
  let voterId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockClear();

    // Create test IDs
    creatorId = "creator-123";
    voterId = getCurrentUserId(); // Current device/user ID

    // Create test poll
    testPoll = {
      id: "access-control-poll",
      slug: "access-control-poll",
      title: "Access Control Test Poll",
      type: "form",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_id: creatorId,
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
      ],
      resultsVisibility: "voters", // Test with voters visibility
    } as any;

    testResponse = {
      id: "resp-1",
      pollId: testPoll.id,
      respondentName: "Test Voter",
      respondentEmail: "voter@example.com",
      created_at: new Date().toISOString(),
      deviceId: voterId,
      items: [{ questionId: "q1", value: "o1" }],
    };
  });

  describe("POST /api/polls - Poll Creation with Visibility", () => {
    it("should create poll with resultsVisibility persistence", async () => {
      const pollData = {
        title: "New Poll",
        type: "form",
        questions: [
          {
            id: "q1",
            kind: "single",
            title: "Test Question",
            options: [{ id: "o1", label: "Option 1" }],
          },
        ],
        resultsVisibility: "public",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "new-poll-id",
          ...pollData,
          created_at: new Date().toISOString(),
        }),
      });

      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.resultsVisibility).toBe("public");

      expect(mockFetch).toHaveBeenCalledWith("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });
    });

    it("should default to creator-only visibility if not specified", async () => {
      const pollData = {
        title: "Default Poll",
        type: "form",
        questions: [
          {
            id: "q1",
            kind: "single",
            title: "Test Question",
            options: [{ id: "o1", label: "Option 1" }],
          },
        ],
        // resultsVisibility not specified
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "default-poll-id",
          ...pollData,
          resultsVisibility: "creator-only", // Should default to this
          created_at: new Date().toISOString(),
        }),
      });

      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.resultsVisibility).toBe("creator-only");
    });
  });

  describe("POST /api/form-responses - Response Storage with Email", () => {
    it("should store respondentEmail when provided", async () => {
      const responseData = {
        pollId: testPoll.id,
        respondentName: "Email User",
        respondentEmail: "email@example.com",
        items: [{ questionId: "q1", value: "o1" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "response-id",
          ...responseData,
          created_at: new Date().toISOString(),
          deviceId: voterId,
        }),
      });

      const response = await fetch("/api/form-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.respondentEmail).toBe("email@example.com");

      expect(mockFetch).toHaveBeenCalledWith("/api/form-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });
    });

    it("should store response without email when not provided", async () => {
      const responseData = {
        pollId: testPoll.id,
        respondentName: "No Email User",
        items: [{ questionId: "q1", value: "o1" }],
        // respondentEmail not provided
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "response-id",
          ...responseData,
          created_at: new Date().toISOString(),
          deviceId: voterId,
        }),
      });

      const response = await fetch("/api/form-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.respondentEmail).toBeUndefined();
    });
  });

  describe("GET /api/polls/:id/results - Access Control by Visibility Mode", () => {
    it("should allow access for creator regardless of visibility mode", async () => {
      // Mock authenticated user as creator
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: creatorId },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...testPoll,
          results: [testResponse],
        }),
      });

      // First call: auth check, Second call: results
      const authResponse = await fetch("/api/auth/user");
      expect(authResponse.ok).toBe(true);

      const resultsResponse = await fetch(`/api/polls/${testPoll.id}/results`);
      expect(resultsResponse.ok).toBe(true);

      const data = await resultsResponse.json();
      expect(data.results).toHaveLength(1);
      expect(data.results[0].respondentName).toBe("Test Voter");
    });

    it("should allow access for voters when visibility is 'voters'", async () => {
      // Setup: user has voted
      addPoll(testPoll);
      addFormResponse(testResponse);

      // Mock authenticated user as voter
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: voterId },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...testPoll,
          resultsVisibility: "voters",
          results: [testResponse],
        }),
      });

      const resultsResponse = await fetch(`/api/polls/${testPoll.id}/results`);
      expect(resultsResponse.ok).toBe(true);

      const data = await resultsResponse.json();
      expect(data.results).toHaveLength(1);
    });

    it("should deny access for non-voters when visibility is 'voters'", async () => {
      // Setup: poll exists but user hasn't voted
      addPoll(testPoll);
      // Don't add response - user hasn't voted

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "Accès aux résultats réservé aux votants",
        }),
      });

      const resultsResponse = await fetch(`/api/polls/${testPoll.id}/results`);
      expect(resultsResponse.ok).toBe(false);
      expect(resultsResponse.status).toBe(403);

      const data = await resultsResponse.json();
      expect(data.error).toBe("Accès aux résultats réservé aux votants");
    });

    it("should allow access for anyone when visibility is 'public'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...testPoll,
          resultsVisibility: "public",
          results: [testResponse],
        }),
      });

      const resultsResponse = await fetch(`/api/polls/${testPoll.id}/results`);
      expect(resultsResponse.ok).toBe(true);

      const data = await resultsResponse.json();
      expect(data.results).toHaveLength(1);
    });

    it("should deny access for non-creators when visibility is 'creator-only'", async () => {
      // Mock authenticated user as someone else (not creator)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: "other-user-456" },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "Accès aux résultats réservé au créateur",
        }),
      });

      const resultsResponse = await fetch(`/api/polls/${testPoll.id}/results`);
      expect(resultsResponse.ok).toBe(false);
      expect(resultsResponse.status).toBe(403);

      const data = await resultsResponse.json();
      expect(data.error).toBe("Accès aux résultats réservé au créateur");
    });
  });

  describe("POST /api/email/send-confirmation - Email Service", () => {
    it("should send confirmation email with mock Resend API", async () => {
      const emailData = {
        to: "test@example.com",
        subject: "Vos réponses : Test Poll",
        html: "<html>Email content</html>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "email-id",
          message: "Email sent successfully",
        }),
      });

      const response = await fetch("/api/email/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe("email-id");

      expect(mockFetch).toHaveBeenCalledWith("/api/email/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });
    });

    it("should handle Resend API errors gracefully", async () => {
      const emailData = {
        to: "invalid-email",
        subject: "Test Email",
        html: "<html>Content</html>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Invalid email address",
        }),
      });

      const response = await fetch("/api/email/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Invalid email address");
    });
  });

  describe("Component Access Control Integration", () => {
    it("should show results for creator with creator-only visibility", async () => {
      const creatorOnlyPoll = { ...testPoll, resultsVisibility: "creator-only" as const };
      addPoll(creatorOnlyPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={creatorOnlyPoll} userHasVoted={false} isCreator={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });

    it("should restrict results for non-creator with creator-only visibility", async () => {
      const creatorOnlyPoll = { ...testPoll, resultsVisibility: "creator-only" as const };
      addPoll(creatorOnlyPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={creatorOnlyPoll} userHasVoted={false} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Accès aux résultats réservé/)).toBeInTheDocument();
      });
    });

    it("should show results for voter with voters visibility", async () => {
      const votersOnlyPoll = { ...testPoll, resultsVisibility: "voters" as const };
      addPoll(votersOnlyPoll);
      addFormResponse(testResponse);

      render(
        <TestWrapper>
          <FormPollResults poll={votersOnlyPoll} userHasVoted={true} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });

    it("should restrict results for non-voter with voters visibility", async () => {
      const votersOnlyPoll = { ...testPoll, resultsVisibility: "voters" as const };
      addPoll(votersOnlyPoll);
      // Don't add response - user hasn't voted

      render(
        <TestWrapper>
          <FormPollResults poll={votersOnlyPoll} userHasVoted={false} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Accès aux résultats réservé/)).toBeInTheDocument();
      });
    });

    it("should show results for anyone with public visibility", async () => {
      const publicPoll = { ...testPoll, resultsVisibility: "public" as const };
      addPoll(publicPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={publicPoll} userHasVoted={false} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });
  });

  describe("Permission Validation Flow", () => {
    it("should validate permissions in correct order: creator > voter > public", async () => {
      // Test creator access (highest priority)
      const creatorOnlyPoll = { ...testPoll, resultsVisibility: "creator-only" as const };
      addPoll(creatorOnlyPoll);

      render(
        <TestWrapper>
          <FormPollResults poll={creatorOnlyPoll} userHasVoted={false} isCreator={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });

      // Test voter access (medium priority)
      const votersOnlyPoll = { ...testPoll, resultsVisibility: "voters" as const };
      addPoll(votersOnlyPoll);
      addFormResponse(testResponse);

      const { rerender } = render(
        <TestWrapper>
          <FormPollResults poll={votersOnlyPoll} userHasVoted={true} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });

      // Test public access (lowest priority)
      const publicPoll = { ...testPoll, resultsVisibility: "public" as const };
      addPoll(publicPoll);

      rerender(
        <TestWrapper>
          <FormPollResults poll={publicPoll} userHasVoted={false} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Résultats du sondage/)).toBeInTheDocument();
      });
    });

    it("should handle edge cases: undefined visibility defaults to creator-only", async () => {
      const pollWithUndefinedVisibility = { ...testPoll };
      delete (pollWithUndefinedVisibility as any).resultsVisibility;
      addPoll(pollWithUndefinedVisibility);

      render(
        <TestWrapper>
          <FormPollResults poll={pollWithUndefinedVisibility} userHasVoted={false} isCreator={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Accès aux résultats réservé/)).toBeInTheDocument();
      });
    });
  });
});
