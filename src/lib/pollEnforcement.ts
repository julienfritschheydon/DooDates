import type { Poll } from "./pollStorage";

/**
 * Checks if a poll is expired based on its expiration date.
 */
export function isPollExpired(poll: Poll): boolean {
  const expiresAt = poll.expires_at || (poll.settings as any)?.expiresAt;
  if (!expiresAt) return false;

  const now = new Date();
  const expirationDate = new Date(expiresAt);

  return now > expirationDate;
}

/**
 * Checks if a poll has reached its maximum response quota.
 */
export function isPollCapped(poll: Poll, responseCount: number): boolean {
  const maxResponses = (poll.settings as any)?.maxResponses;
  if (maxResponses === undefined || maxResponses === null || maxResponses <= 0) {
    return false;
  }

  return responseCount >= maxResponses;
}

/**
 * Determines the reason why a poll is closed for voting.
 * Returns null if the poll is open.
 */
export function getPollClosureReason(
  poll: Poll,
  responseCount: number,
): "expired" | "capped" | "closed" | "archived" | null {
  if (poll.status === "closed") return "closed";
  if (poll.status === "archived") return "archived";
  if (isPollExpired(poll)) return "expired";
  if (isPollCapped(poll, responseCount)) return "capped";

  return null;
}
