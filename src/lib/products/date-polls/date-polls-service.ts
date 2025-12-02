// Date Polls Service
// Logique spécifique aux sondages de dates

import {
  readFromStorage,
  writeToStorage,
  addToStorage,
  findById,
  updateInStorage,
  deleteFromStorage,
  readRecordStorage,
  writeRecordStorage,
} from "../../storage/storageUtils";
import { handleError, ErrorFactory, logError } from "../../error-handling";
import { logger } from "../../logger";

// Types spécifiques aux Date Polls
export interface TimeSlot {
  start: string;
  end: string;
  dates?: string[];
}

export interface DatePollSettings {
  selectedDates?: string[];
  timeSlotsByDate?: Record<
    string,
    Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>
  >;
  timeGranularity?: number;
  allowAnonymousVotes?: boolean;
  allowMaybeVotes?: boolean;
  sendNotifications?: boolean;
  timezone?: string;
}

export interface DatePoll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: DatePollSettings;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string;
  dates?: string[];
  dateGroups?: Array<{
    dates: string[];
    label: string;
    type: "weekend" | "week" | "fortnight" | "custom";
  }>;
  type: "date";
  clientAvailabilities?: string;
  parsedAvailabilities?: Array<{
    date: string;
    timeRanges: Array<{ start: string; end: string }>;
  }>;
  proposedSlots?: Array<{
    date: string;
    start: string;
    end: string;
    score?: number;
    reasons?: string[];
    proposedBy?: "professional" | "system";
  }>;
  validatedSlot?: {
    date: string;
    start: string;
    end: string;
  };
  relatedConversationId?: string;
  conversationId?: string;
  resultsVisibility?: "creator-only" | "voters" | "public";
  schedulingRules?: {
    minLatencyMinutes?: number;
    maxLatencyMinutes?: number;
    preferNearTerm?: boolean;
    preferHalfDays?: boolean;
    preferredTimes?: Array<{ day: string; start: string; end: string }>;
    slotDurationMinutes?: number;
  };
  votes?: any[];
}

// Constants
const STORAGE_KEY = "doodates_polls";

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validateDatePoll(poll: DatePoll): ValidationResult {
  const errors: string[] = [];

  if (!poll.title || typeof poll.title !== "string" || poll.title.trim() === "") {
    errors.push("Invalid date poll: title must be a non-empty string");
  }

  const dates = poll?.settings?.selectedDates;
  if (!Array.isArray(dates) || dates.length === 0) {
    errors.push("Invalid date poll: settings.selectedDates must be a non-empty array of strings");
  }

  if (dates && !dates.every((date) => typeof date === "string" && date.trim() !== "")) {
    errors.push("Invalid date poll: all dates must be non-empty strings");
  }

  // Validate time slots if present
  if (poll.settings?.timeSlotsByDate) {
    if (Array.isArray(poll.settings.timeSlotsByDate)) {
      errors.push("Invalid time slots: timeSlotsByDate must be an object, not an array");
    } else if (typeof poll.settings.timeSlotsByDate === "object") {
      for (const [date, slots] of Object.entries(poll.settings.timeSlotsByDate)) {
        if (!Array.isArray(slots)) {
          errors.push(`Invalid time slots for date ${date}: must be an array`);
          continue;
        }

        if (slots.length === 0) {
          errors.push(`At least one time slot is required for date ${date}`);
          continue;
        }

        for (const slot of slots) {
          if (typeof slot.hour !== "number" || slot.hour < 0 || slot.hour > 23) {
            errors.push(`Invalid hour for date ${date}: must be between 0 and 23`);
          }
          if (typeof slot.minute !== "number" || slot.minute < 0 || slot.minute > 59) {
            errors.push(`Invalid minute for date ${date}: must be between 0 and 59`);
          }
          if (typeof slot.enabled !== "boolean") {
            errors.push(`Invalid enabled status for date ${date}: must be boolean`);
          }
        }
      }
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };

  if (result.isValid) {
    logger.info("Date poll validated successfully", {
      pollId: poll.id,
      title: poll.title,
      datesCount: dates?.length || 0,
    } as any);
  } else {
    logger.warn("Date poll validation failed", {
      pollId: poll.id,
      title: poll.title,
      errors: result.errors,
    } as any);
  }

  return result;
}

// Helper functions
function isDatePoll(poll: any): poll is DatePoll {
  if (poll?.type === "date") return true;
  const dates = poll?.settings?.selectedDates || poll?.dates;
  return poll?.type === undefined && Array.isArray(dates) && dates.length > 0;
}

// CRUD Operations
export function getDatePolls(): DatePoll[] {
  try {
    if (!hasWindow()) return [];

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validDatePolls: DatePoll[] = [];
    for (const p of parsed) {
      if (isDatePoll(p)) {
        const validation = validateDatePoll(p);
        if (validation.isValid) {
          validDatePolls.push(p);
        }
      }
    }

    return deduplicateDatePolls(validDatePolls);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { component: "DatePollsService", operation: "getDatePolls" });
    return [];
  }
}

function deduplicateDatePolls(polls: DatePoll[]): DatePoll[] {
  const seen = new Set<string>();
  return polls
    .sort((a, b) => {
      const currentDate = new Date(a.updated_at || a.created_at).getTime();
      const nextDate = new Date(b.updated_at || b.created_at).getTime();
      return nextDate - currentDate;
    })
    .filter((poll) => {
      if (seen.has(poll.id)) {
        logger.warn("Duplicate date poll found and removed", { pollId: poll.id } as any);
        return false;
      }
      seen.add(poll.id);
      return true;
    });
}

export function saveDatePolls(polls: DatePoll[]): void {
  try {
    if (!hasWindow()) return;

    const existingPolls = getDatePolls();
    const mergedPolls = [...existingPolls, ...polls];
    const deduplicatedPolls = deduplicateDatePolls(mergedPolls);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicatedPolls));
    logger.info("Date polls saved successfully", {
      count: deduplicatedPolls.length,
    } as any);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { component: "DatePollsService", operation: "saveDatePolls" });
    throw error;
  }
}

export function getDatePollBySlugOrId(idOrSlug: string | undefined | null): DatePoll | null {
  if (!idOrSlug) return null;

  const polls = getDatePolls();
  return polls.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function addDatePoll(poll: DatePoll): Promise<void> {
  try {
    const validation = validateDatePoll(poll);
    if (!validation.isValid) {
      throw ErrorFactory.validation(
        `Invalid date poll: ${validation.errors.join(", ")}`,
        `Invalid date poll: ${validation.errors.join(", ")}`,
        { pollId: poll.id, errors: validation.errors }
      );
    }

    const polls = getDatePolls();
    const existingIndex = polls.findIndex((p) => p.id === poll.id);

    if (existingIndex >= 0) {
      polls[existingIndex] = poll;
      logger.info("Date poll updated", { pollId: poll.id } as any);
    } else {
      polls.push(poll);
      logger.info("Date poll created", { pollId: poll.id } as any);
    }

    saveDatePolls(polls);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { component: "DatePollsService", operation: "addDatePoll", pollId: poll.id });
    throw error;
  }
}

export function deleteDatePollById(id: string): void {
  try {
    const polls = getDatePolls();
    const next = polls.filter((p) => p.id !== id);
    saveDatePolls(next);
    logger.info("Date poll deleted", { pollId: id } as any);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { component: "DatePollsService", operation: "deleteDatePollById", pollId: id });
    throw error;
  }
}

export function duplicateDatePoll(poll: DatePoll): DatePoll {
  const newPoll: DatePoll = {
    ...poll,
    id: `date_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug: `${poll.slug}-${Date.now()}`,
    title: `${poll.title} (copie)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  logger.info("Date poll duplicated", {
    originalId: poll.id,
    newId: newPoll.id,
  } as any);

  return newPoll;
}

// Utility functions
function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function buildPublicLink(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/poll/${slug}`;
}

export function copyToClipboard(text: string): Promise<void> {
  try {
    if (!hasWindow()) {
      logger.warn("Clipboard API not available in server environment" as any);
      return Promise.resolve();
    }

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => {
        logger.info("Text copied to clipboard using Clipboard API" as any);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        logger.info("Text copied to clipboard using execCommand fallback" as any);
        return Promise.resolve();
      } else {
        return Promise.reject(new Error("Failed to copy text to clipboard"));
      }
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { component: "DatePollsService", operation: "copyToClipboard" });
    return Promise.reject(error);
  }
}
