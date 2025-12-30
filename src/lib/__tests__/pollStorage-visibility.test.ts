import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCurrentUserId,
  checkIfUserHasVoted,
  addFormResponse,
  addPoll,
  getDeviceId,
  getRespondentId,
  resetMemoryStateForTests,
} from "../pollStorage";

describe("Poll Storage Helpers - Visibility Features", () => {
  beforeEach(() => {
    resetMemoryStateForTests();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUserId()", () => {
    it("retourne device ID pour utilisateur non authentifié", () => {
      const deviceId = getDeviceId();
      expect(getCurrentUserId()).toBe(deviceId);
      expect(getCurrentUserId(null)).toBe(deviceId);
      expect(getCurrentUserId(undefined)).toBe(deviceId);
    });

    it("retourne authenticated user ID si fourni", () => {
      const authUserId = "auth-user-123";
      expect(getCurrentUserId(authUserId)).toBe(authUserId);
    });

    it("retourne device ID si authenticated user ID est null", () => {
      const deviceId = getDeviceId();
      expect(getCurrentUserId(null)).toBe(deviceId);
    });

    it("retourne device ID si authenticated user ID est vide", () => {
      const deviceId = getDeviceId();
      expect(getCurrentUserId("")).toBe(deviceId);
    });
  });

  describe("checkIfUserHasVoted()", () => {
    it("retourne false pour un poll sans réponses", () => {
      const hasVoted = checkIfUserHasVoted("poll-123");
      expect(hasVoted).toBe(false);
    });

    it("détecte un vote via deviceId stocké dans la réponse", () => {
      const pollId = "poll-123";

      // Initialize poll
      addPoll({
        id: pollId,
        title: "Test Poll",
        type: "form",
        slug: pollId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: "creator",
        questions: [],
        status: "active",
      });

      const currentDeviceId = getDeviceId();

      console.log("DEBUG: Storing response with deviceId:", currentDeviceId);

      // Simuler une réponse avec le device ID actuel
      addFormResponse({
        pollId,
        items: [{ questionId: "q1", value: "opt1" }],
      });

      // Vérifier le vote
      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(true);
    });

    it("détecte un vote via respondentId anonyme contenant deviceId", () => {
      // Ce test simule le cas des anciennes réponses ou des réponses créées sans champ deviceId explicite
      // mais dont le respondentId a été généré avec le deviceId
      const pollId = "poll-legacy-123";

      // Initialize poll
      addPoll({
        id: pollId,
        title: "Test Poll",
        type: "form",
        slug: pollId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: "creator",
        questions: [],
        status: "active",
      });

      const currentDeviceId = getDeviceId(); // Force generation/cache

      // Use addFormResponse to create a response (which will have deviceId)
      const response = addFormResponse({
        pollId,
        items: [{ questionId: "q1", value: "opt1" }],
      });

      // Simulate legacy format by adding respondentId field and removing deviceId
      // We modify the response object directly since it's stored in memory
      (response as any).respondentId = `anon:${currentDeviceId}:${response.id} `;
      delete (response as any).deviceId;

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(true);
    });

    it("retourne false pour un vote avec un autre deviceId", () => {
      const pollId = "poll-other-123";

      // Inject response from another device
      const otherDeviceResponse = {
        id: "resp-other",
        pollId,
        deviceId: "dev-other-device-id",
        created_at: new Date().toISOString(),
        items: [{ questionId: "q1", value: "opt1" }],
      };

      localStorage.setItem("doodates_form_responses", JSON.stringify([otherDeviceResponse]));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(false);
    });

    it("retourne false pour un vote avec respondentId anonyme différent", () => {
      const pollId = "poll-diff-123";

      const otherResponse = {
        id: "resp-diff",
        pollId,
        respondentId: `anon: dev - other - device: resp - diff`,
        created_at: new Date().toISOString(),
        items: [{ questionId: "q1", value: "opt1" }],
      };

      localStorage.setItem("doodates_form_responses", JSON.stringify([otherResponse]));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(false);
    });

    it("gère correctement les réponses mixtes (avec et sans deviceId)", () => {
      const pollId = "poll-mixed-123";

      // Initialize poll to pass validation
      addPoll({
        id: pollId,
        title: "Test Poll",
        type: "form",
        slug: pollId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_id: "creator",
        questions: [],
        status: "active",
      });

      const currentDeviceId = getDeviceId();

      // Add first response with different deviceId using addFormResponse
      addFormResponse({
        pollId,
        items: [{ questionId: "q1", value: "opt1" }],
      });

      // Modify the stored response to have a different deviceId
      const stored = localStorage.getItem("doodates_form_responses");
      if (stored) {
        const responses = JSON.parse(stored);
        if (responses[0]) {
          responses[0].deviceId = "dev-other";
        }
        localStorage.setItem("doodates_form_responses", JSON.stringify(responses));
      }

      // Add second response with current deviceId
      addFormResponse({
        pollId,
        items: [{ questionId: "q2", value: "opt2" }],
      });

      expect(checkIfUserHasVoted(pollId)).toBe(true);
    });

    it("retourne false pour les réponses authentifiées d autres utilisateurs", () => {
      const pollId = "poll-auth-123";

      const authResponse = {
        id: "resp-auth",
        pollId,
        respondentName: "Other User",
        respondentEmail: "other@example.com",
        // No deviceId or different deviceId
        deviceId: "dev-other",
        created_at: new Date().toISOString(),
        items: [],
      };

      localStorage.setItem("doodates_form_responses", JSON.stringify([authResponse]));
      expect(checkIfUserHasVoted(pollId)).toBe(false);
    });
  });

  describe("getDeviceId()", () => {
    it("génère un device ID cohérent", () => {
      const id1 = getDeviceId();
      const id2 = getDeviceId();
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^dev-/);
    });

    it("return cached device ID", () => {
      const id1 = getDeviceId();
      // Manually modify local storage to verify we use cache
      localStorage.setItem("doodates_device_id", "dev-modified");
      const id2 = getDeviceId();
      expect(id2).toBe(id1); // Should still match cached value
      expect(id2).not.toBe("dev-modified");
    });
  });

  describe("getRespondentId()", () => {
    it("génère un respondentId anonyme contenant le deviceId", () => {
      const currentDeviceId = getDeviceId();
      const response = {
        id: "resp-123",
        pollId: "poll-1",
        deviceId: currentDeviceId,
        created_at: new Date().toISOString(),
        items: [],
      };

      const respondentId = getRespondentId(response);

      // Format: anon:<deviceId>:<responseId>
      expect(respondentId).toBe(`anon:${currentDeviceId}:${response.id}`);
    });
  });
});
