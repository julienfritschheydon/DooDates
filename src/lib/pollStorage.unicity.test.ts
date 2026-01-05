import { describe, it, expect, beforeEach } from "vitest";
import {
  addPoll,
  getFormResponses,
  addFormResponse,
  getDeviceId,
  getRespondentId,
  getVoterId,
  type Poll,
} from "@/lib/pollStorage";

// Utility to reset storage between tests
beforeEach(() => {
  // Clear all localStorage used by pollStorage
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

describe("unicity helpers", () => {
  it("getVoterId() prefers normalized email, then normalized name, then anon fallback", () => {
    const idFromEmail = getVoterId({ voter_email: "  Alice@Example.com  " });
    expect(idFromEmail).toBe("alice@example.com");

    const idFromName = getVoterId({ voter_name: "  Bob  " });
    expect(idFromName).toBe("name:bob");

    const anon = getVoterId({});
    expect(anon.startsWith("anon:")).toBe(true);
  });

  it("getRespondentId() uses normalized name when present, else stable device+id fallback", () => {
    const idWithName = getRespondentId({
      id: "r1",
      pollId: "p1",
      respondentName: "  CarOl  ",
      created_at: new Date().toISOString(),
      items: [],
    } as any);
    expect(idWithName).toBe("name:carol");

    const deviceId = getDeviceId();
    const anonId = getRespondentId({
      id: "r2",
      pollId: "p1",
      deviceId: deviceId, // Include deviceId as addFormResponse does
      created_at: new Date().toISOString(),
      items: [],
    } as any);
    expect(anonId).toBe(`anon:${deviceId}:r2`);
  });
});

describe("addFormResponse normalization and deduplication", () => {
  it("normalizes respondentName and replaces existing response for same poll+name", async () => {
    const poll: Poll = {
      id: "form-1",
      slug: "form-1",
      title: "Test Form",
      type: "form",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Minimal questions: one single-choice with 2 options
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

    await addPoll(poll);

    const r1 = addFormResponse({
      pollId: poll.id,
      respondentName: "  Alice  ",
      items: [{ questionId: "q1", value: "o1" }],
    });

    // Name should be normalized (trimmed)
    expect(r1.respondentName).toBe("Alice");

    const r2 = addFormResponse({
      pollId: poll.id,
      respondentName: "alice", // same logical person, different case
      items: [{ questionId: "q1", value: "o2" }],
    });

    // Should have replaced the previous response (same id)
    expect(r2.id).toBe(r1.id);

    const stored = getFormResponses(poll.id);
    expect(stored.length).toBe(1);
    expect((stored[0].respondentName || "").toLowerCase()).toBe("alice");
    // Final value should reflect the second answer
    const latest = stored[0];
    expect(latest.items[0].value).toBe("o2");
  });

  it("should preserve email when replacing response with same name", async () => {
    const poll: Poll = {
      id: "form-email-dedup",
      slug: "form-email-dedup",
      title: "Test Form",
      type: "form",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    await addPoll(poll);

    // First response with email
    const r1 = addFormResponse({
      pollId: poll.id,
      respondentName: "Bob",
      respondentEmail: "bob@example.com",
      items: [{ questionId: "q1", value: "o1" }],
    });

    // Second response with same name but different email (should replace)
    const r2 = addFormResponse({
      pollId: poll.id,
      respondentName: "bob", // same person
      respondentEmail: "bob.new@example.com",
      items: [{ questionId: "q1", value: "o2" }],
    });

    expect(r2.id).toBe(r1.id); // Same ID = replaced
    expect(r2.respondentEmail).toBe("bob.new@example.com");

    const stored = getFormResponses(poll.id);
    expect(stored.length).toBe(1);
    expect(stored[0].respondentEmail).toBe("bob.new@example.com");
  });
});
