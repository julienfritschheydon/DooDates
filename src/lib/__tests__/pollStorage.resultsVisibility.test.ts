import { describe, it, expect, beforeEach } from "vitest";
import {
  addPoll,
  getFormResponses,
  addFormResponse,
  getCurrentUserId,
  checkIfUserHasVoted,
  getDeviceId,
  type Poll,
  type FormResponse,
} from "@/lib/pollStorage";

// Utility to reset storage between tests
beforeEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

describe("getCurrentUserId", () => {
  it("should return device ID when no authentication", () => {
    const userId = getCurrentUserId();
    expect(userId).toBeTruthy();
    expect(userId).toBe(getDeviceId());
  });

  it("should return consistent device ID across calls", () => {
    const userId1 = getCurrentUserId();
    const userId2 = getCurrentUserId();
    expect(userId1).toBe(userId2);
  });

  it("should return authenticated user ID when provided", () => {
    const authenticatedUserId = "auth-user-123";
    const userId = getCurrentUserId(authenticatedUserId);
    expect(userId).toBe(authenticatedUserId);
    expect(userId).not.toBe(getDeviceId());
  });

  it("should return device ID when authenticatedUserId is null", () => {
    const userId = getCurrentUserId(null);
    expect(userId).toBe(getDeviceId());
  });

  it("should return device ID when authenticatedUserId is undefined", () => {
    const userId = getCurrentUserId(undefined);
    expect(userId).toBe(getDeviceId());
  });
});

describe("checkIfUserHasVoted", () => {
  it("should return false when user has not voted", () => {
    const poll: Poll = {
      id: "form-1",
      slug: "form-1",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    const hasVoted = checkIfUserHasVoted(poll.id);
    expect(hasVoted).toBe(false);
  });

  it("should return true when user has voted anonymously", () => {
    const poll: Poll = {
      id: "form-2",
      slug: "form-2",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    // User votes anonymously (no name)
    addFormResponse({
      pollId: poll.id,
      items: [{ questionId: "q1", value: "o1" }],
    });

    const hasVoted = checkIfUserHasVoted(poll.id);
    expect(hasVoted).toBe(true);
  });

  it("should return true when user has voted with name (deviceId is now stored)", () => {
    const poll: Poll = {
      id: "form-2b",
      slug: "form-2b",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    // User votes with name (deviceId is now stored in response)
    addFormResponse({
      pollId: poll.id,
      respondentName: "Test User",
      items: [{ questionId: "q1", value: "o1" }],
    });

    // checkIfUserHasVoted now works for votes with names (deviceId is stored)
    const hasVoted = checkIfUserHasVoted(poll.id);
    expect(hasVoted).toBe(true);
  });

  it("should return true when user has voted anonymously (by device ID)", () => {
    const poll: Poll = {
      id: "form-3",
      slug: "form-3",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    // Anonymous vote (no name)
    addFormResponse({
      pollId: poll.id,
      items: [{ questionId: "q1", value: "o1" }],
    });

    const hasVoted = checkIfUserHasVoted(poll.id);
    expect(hasVoted).toBe(true);
  });
});

describe("addFormResponse with respondentEmail", () => {
  it("should save email when provided", () => {
    const poll: Poll = {
      id: "form-email-1",
      slug: "form-email-1",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    const response = addFormResponse({
      pollId: poll.id,
      respondentName: "Test User",
      respondentEmail: "test@example.com",
      items: [{ questionId: "q1", value: "o1" }],
    });

    expect(response.respondentEmail).toBe("test@example.com");

    const stored = getFormResponses(poll.id);
    expect(stored[0].respondentEmail).toBe("test@example.com");
  });

  it("should not save email when not provided", () => {
    const poll: Poll = {
      id: "form-email-2",
      slug: "form-email-2",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    const response = addFormResponse({
      pollId: poll.id,
      respondentName: "Test User",
      items: [{ questionId: "q1", value: "o1" }],
    });

    expect(response.respondentEmail).toBeUndefined();

    const stored = getFormResponses(poll.id);
    expect(stored[0].respondentEmail).toBeUndefined();
  });

  it("should update email when replacing existing response", () => {
    const poll: Poll = {
      id: "form-email-3",
      slug: "form-email-3",
      title: "Test Form",
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
          title: "Q1",
          options: [
            { id: "o1", label: "A" },
            { id: "o2", label: "B" },
          ],
        },
      ],
    } as any;

    addPoll(poll);

    // First response without email
    const r1 = addFormResponse({
      pollId: poll.id,
      respondentName: "Test User",
      items: [{ questionId: "q1", value: "o1" }],
    });

    // Second response with same name but with email (should replace)
    const r2 = addFormResponse({
      pollId: poll.id,
      respondentName: "Test User",
      respondentEmail: "test@example.com",
      items: [{ questionId: "q1", value: "o2" }],
    });

    expect(r2.id).toBe(r1.id); // Same ID = replaced
    expect(r2.respondentEmail).toBe("test@example.com");

    const stored = getFormResponses(poll.id);
    expect(stored.length).toBe(1);
    expect(stored[0].respondentEmail).toBe("test@example.com");
  });
});
