import { describe, it, expect } from "vitest";
import { isPollExpired, isPollCapped, getPollClosureReason } from "../pollEnforcement";
import type { Poll } from "../pollStorage";

describe("pollEnforcement", () => {
  const mockPoll: Poll = {
    id: "test-poll",
    title: "Test Poll",
    type: "date",
    status: "active",
    creator_id: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {},
  } as any;

  describe("isPollExpired", () => {
    it("should return false if no expiration date is set", () => {
      expect(isPollExpired(mockPoll)).toBe(false);
    });

    it("should return true if expiration date is in the past", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const expiredPoll = {
        ...mockPoll,
        expires_at: pastDate.toISOString(),
      };
      expect(isPollExpired(expiredPoll)).toBe(true);
    });

    it("should return false if expiration date is in the future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const activePoll = {
        ...mockPoll,
        expires_at: futureDate.toISOString(),
      };
      expect(isPollExpired(activePoll)).toBe(false);
    });

    it("should check both root expires_at and settings.expiresAt", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const pollWithSettingsExpiry = {
        ...mockPoll,
        settings: { expiresAt: pastDate.toISOString() },
      };
      expect(isPollExpired(pollWithSettingsExpiry)).toBe(true);
    });
  });

  describe("isPollCapped", () => {
    it("should return false if maxResponses is not set", () => {
      expect(isPollCapped(mockPoll, 100)).toBe(false);
    });

    it("should return true if response count reaches maxResponses", () => {
      const cappedPoll = {
        ...mockPoll,
        settings: { maxResponses: 5 },
      };
      expect(isPollCapped(cappedPoll, 5)).toBe(true);
      expect(isPollCapped(cappedPoll, 6)).toBe(true);
    });

    it("should return false if response count is below maxResponses", () => {
      const cappedPoll = {
        ...mockPoll,
        settings: { maxResponses: 5 },
      };
      expect(isPollCapped(cappedPoll, 4)).toBe(false);
    });

    it("should return false if maxResponses is 0 or negative", () => {
      const invalidCappedPoll = {
        ...mockPoll,
        settings: { maxResponses: 0 },
      };
      expect(isPollCapped(invalidCappedPoll, 1)).toBe(false);
    });
  });

  describe("getPollClosureReason", () => {
    it("should return null for an active, open poll", () => {
      expect(getPollClosureReason(mockPoll, 0)).toBe(null);
    });

    it("should return 'closed' if status is closed", () => {
      const closedPoll = { ...mockPoll, status: "closed" as const };
      expect(getPollClosureReason(closedPoll, 0)).toBe("closed");
    });

    it("should return 'expired' if poll is expired", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const expiredPoll = { ...mockPoll, expires_at: pastDate.toISOString() };
      expect(getPollClosureReason(expiredPoll, 0)).toBe("expired");
    });

    it("should return 'capped' if poll is capped", () => {
      const cappedPoll = { ...mockPoll, settings: { maxResponses: 2 } };
      expect(getPollClosureReason(cappedPoll, 2)).toBe("capped");
    });

    it("should prioritize status over expiration", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const closedExpiredPoll = {
        ...mockPoll,
        status: "closed" as const,
        expires_at: pastDate.toISOString(),
      };
      expect(getPollClosureReason(closedExpiredPoll, 0)).toBe("closed");
    });
  });
});
