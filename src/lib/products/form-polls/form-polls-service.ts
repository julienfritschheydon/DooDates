// Form Polls Service
// Logique spécifique aux sondages de formulaires

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

// Types spécifiques aux Form Polls
export type FormQuestionKind =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps"
  | "date";

export interface FormQuestionOption {
  id: string;
  label: string;
  isOther?: boolean;
}

export interface FormQuestionShape {
  id: string;
  kind: FormQuestionKind;
  title: string;
  required?: boolean;
  options?: FormQuestionOption[];
  maxChoices?: number;
  type?: FormQuestionKind;
  placeholder?: string;
  maxLength?: number;
  matrixRows?: FormQuestionOption[];
  matrixColumns?: FormQuestionOption[];
  matrixType?: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
  ratingScale?: number;
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: "email" | "phone" | "url" | "number" | "date";
  selectedDates?: string[];
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  timeGranularity?: "15min" | "30min" | "1h";
  allowMaybeVotes?: boolean;
  allowAnonymousVotes?: boolean;
}

export type DateVoteValue = Array<{
  date: string;
  timeSlots: Array<{ hour: number; minute: number }>;
  vote: "yes" | "no" | "maybe";
}>;

export interface FormResponseItem {
  questionId: string;
  value: string | string[] | Record<string, string | string[]> | number | DateVoteValue;
}

export interface FormResponse {
  id: string;
  pollId: string;
  respondentName?: string;
  respondentEmail?: string;
  deviceId?: string;
  created_at: string;
  items: FormResponseItem[];
}

export interface DateQuestionResults {
  votesByDate: Record<
    string,
    {
      yes: number;
      no: number;
      maybe: number;
      total: number;
    }
  >;
  votesByTimeSlot: Record<
    string,
    {
      yes: number;
      no: number;
      maybe: number;
      total: number;
    }
  >;
  totalResponses: number;
}

export interface FormResults {
  pollId: string;
  countsByQuestion: Record<string, Record<string, number>>;
  textAnswers: Record<string, string[]>;
  dateResults: Record<string, DateQuestionResults>;
  totalResponses: number;
}

export interface FormPollSettings {
  allowAnonymousResponses?: boolean;
  expiresAt?: string;
}

export interface FormPoll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: FormPollSettings;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string;
  type: "form";
  questions?: FormQuestionShape[];
  conditionalRules?: any[];
  themeId?: string;
  displayMode?: "all-at-once" | "multi-step";
  relatedConversationId?: string;
  conversationId?: string;
  resultsVisibility?: "creator-only" | "voters" | "public";
}

// Import ConditionalRule type
import type { ConditionalRule } from "../../../types/conditionalRules";

// Constants
const STORAGE_KEY = "doodates_polls";
const FORM_RESPONSES_KEY = "doodates_form_responses";

// Validation spécifique aux Form Polls
export function validateFormPoll(poll: FormPoll): void {
  if (!poll.title || typeof poll.title !== "string" || poll.title.trim() === "") {
    throw ErrorFactory.validation(
      "Invalid form poll: title must be a non-empty string",
      { pollId: poll.id, title: poll.title }
    );
  }

  if (poll.questions && Array.isArray(poll.questions)) {
    poll.questions.forEach((question, index) => {
      if (!question.id || !question.title || !question.kind) {
        throw ErrorFactory.validation(
          `Invalid form poll question at index ${index}: missing required fields`,
          { pollId: poll.id, questionIndex: index, question }
        );
      }
    });
  }

  logger.info("Form poll validated successfully", {
    pollId: poll.id,
    title: poll.title,
    questionsCount: poll.questions?.length || 0,
  });
}

// Helper functions
function isFormPoll(poll: any): poll is FormPoll {
  return poll?.type === "form" || (poll?.questions && Array.isArray(poll.questions));
}

// CRUD Operations
export function getFormPolls(): FormPoll[] {
  try {
    if (!hasWindow()) return [];

    const raw = readFromStorage(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validFormPolls: FormPoll[] = [];
    for (const p of parsed) {
      if (isFormPoll(p)) {
        validateFormPoll(p);
        validFormPolls.push(p);
      }
    }

    return deduplicateFormPolls(validFormPolls);
  } catch (error) {
    logError(error, "getFormPolls", {
      operation: "getFormPolls",
      storageKey: STORAGE_KEY,
    });
    return [];
  }
}

function deduplicateFormPolls(polls: FormPoll[]): FormPoll[] {
  const seen = new Set<string>();
  return polls
    .sort((a, b) => {
      const currentDate = new Date(a.updated_at || a.created_at).getTime();
      const nextDate = new Date(b.updated_at || b.created_at).getTime();
      return nextDate - currentDate;
    })
    .filter((poll) => {
      if (seen.has(poll.id)) {
        logger.warn("Duplicate form poll found and removed", { pollId: poll.id });
        return false;
      }
      seen.add(poll.id);
      return true;
    });
}

export function saveFormPolls(polls: FormPoll[]): void {
  try {
    if (!hasWindow()) return;

    const existingPolls = getFormPolls();
    const mergedPolls = [...existingPolls, ...polls];
    const deduplicatedPolls = deduplicateFormPolls(mergedPolls);

    writeToStorage(STORAGE_KEY, JSON.stringify(deduplicatedPolls));
    logger.info("Form polls saved successfully", {
      count: deduplicatedPolls.length,
    });
  } catch (error) {
    logError(error, "saveFormPolls", {
      operation: "saveFormPolls",
      pollCount: polls.length,
    });
    throw error;
  }
}

export function getFormPollBySlugOrId(idOrSlug: string | undefined | null): FormPoll | null {
  if (!idOrSlug) return null;
  
  const polls = getFormPolls();
  return polls.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function addFormPoll(poll: FormPoll): Promise<void> {
  try {
    validateFormPoll(poll);
    
    const polls = getFormPolls();
    const existingIndex = polls.findIndex((p) => p.id === poll.id);
    
    if (existingIndex >= 0) {
      polls[existingIndex] = poll;
      logger.info("Form poll updated", { pollId: poll.id });
    } else {
      polls.push(poll);
      logger.info("Form poll created", { pollId: poll.id });
    }
    
    saveFormPolls(polls);
  } catch (error) {
    logError(error, "addFormPoll", {
      operation: "addFormPoll",
      pollId: poll.id,
    });
    throw error;
  }
}

export function deleteFormPollById(id: string): void {
  try {
    const polls = getFormPolls();
    const next = polls.filter((p) => p.id !== id);
    saveFormPolls(next);
    logger.info("Form poll deleted", { pollId: id });
  } catch (error) {
    logError(error, "deleteFormPollById", {
      operation: "deleteFormPollById",
      pollId: id,
    });
    throw error;
  }
}

export function duplicateFormPoll(poll: FormPoll): FormPoll {
  const newPoll: FormPoll = {
    ...poll,
    id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug: `${poll.slug}-${Date.now()}`,
    title: `${poll.title} (copie)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  logger.info("Form poll duplicated", { 
    originalId: poll.id, 
    newId: newPoll.id 
  });

  return newPoll;
}

// Form Responses Management
function readAllFormResponses(): FormResponse[] {
  try {
    if (!hasWindow()) return [];

    const raw = readFromStorage(FORM_RESPONSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logError(error, "readAllFormResponses", {
      operation: "readAllFormResponses",
      storageKey: FORM_RESPONSES_KEY,
    });
    return [];
  }
}

function writeAllFormResponses(resps: FormResponse[]): void {
  try {
    if (!hasWindow()) return;
    writeToStorage(FORM_RESPONSES_KEY, JSON.stringify(resps));
  } catch (error) {
    logError(error, "writeAllFormResponses", {
      operation: "writeAllFormResponses",
      responseCount: resps.length,
    });
    throw error;
  }
}

export function getFormPollById(pollId: string): FormPoll | null {
  const poll = getFormPolls().find((p) => p.id === pollId) || null;
  if (!poll) {
    logger.warn("Form poll not found", { pollId });
  }
  return poll;
}

function assertValidFormAnswer(poll: FormPoll, items: FormResponseItem[]): void {
  const qIndex = new Map<string, FormQuestionShape>();
  for (const q of (poll.questions || []) as FormQuestionShape[]) {
    qIndex.set(q.id, q);
  }

  for (const item of items) {
    const q = qIndex.get(item.questionId);
    if (!q) continue;

    if (q.required && (!item.value || (Array.isArray(item.value) && item.value.length === 0))) {
      throw ErrorFactory.validation(
        `Missing required answer for question ${q.id}`,
        { pollId: poll.id, questionId: q.id, questionTitle: q.title }
      );
    }

    if (q.kind === "text" && typeof item.value !== "string") {
      throw ErrorFactory.validation(
        "Text answer required",
        { pollId: poll.id, questionId: q.id }
      );
    }
  }
}

export function addFormResponse(params: {
  pollId: string;
  items: FormResponseItem[];
  respondentName?: string;
  respondentEmail?: string;
}): void {
  const { pollId, items, respondentName, respondentEmail } = params;

  try {
    const poll = getFormPollById(pollId);
    if (!poll) {
      throw ErrorFactory.notFound(
        "Form poll not found",
        { pollId }
      );
    }

    assertValidFormAnswer(poll, items);

    const deviceId = getDeviceId();
    const response: FormResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      respondentName,
      respondentEmail,
      deviceId,
      created_at: new Date().toISOString(),
      items,
    };

    const all = readAllFormResponses();
    all.push(response);
    writeAllFormResponses(all);

    logger.info("Form response added", {
      responseId: response.id,
      pollId,
      itemsCount: items.length,
    });
  } catch (error) {
    logError(error, "addFormResponse", {
      operation: "addFormResponse",
      pollId,
      itemsCount: items.length,
    });
    throw error;
  }
}

export function getFormResults(pollId: string): FormResults {
  const poll = getFormPollById(pollId);
  if (!poll) {
    throw ErrorFactory.notFound(
      "Form poll not found",
      { pollId }
    );
  }

  const all = readAllFormResponses().filter((r) => r.pollId === pollId);
  const countsByQuestion: Record<string, Record<string, number>> = {};
  const textAnswers: Record<string, string[]> = {};
  const dateResults: Record<string, DateQuestionResults> = {};

  const qIndex = new Map<string, FormQuestionShape>();
  for (const q of (poll.questions || []) as FormQuestionShape[]) {
    qIndex.set(q.id, q);
    const kind = q.kind || q.type;
    if (kind !== "text" && kind !== "date") countsByQuestion[q.id] = {};
    if (kind === "text") textAnswers[q.id] = [];
  }

  for (const it of all) {
    for (const item of it.items) {
      const q = qIndex.get(item.questionId);
      if (!q) continue;

      const kind = q.kind || q.type;
      if (kind === "text") {
        textAnswers[q.id].push(item.value as string);
      } else if (kind === "date") {
        // Handle date questions
        const dateValue = item.value as DateVoteValue;
        if (Array.isArray(dateValue)) {
          const questionResults = dateResults[q.id] || {
            votesByDate: {},
            votesByTimeSlot: {},
            totalResponses: 0,
          };

          dateValue.forEach((voteData) => {
            const { date, timeSlots, vote } = voteData;
            
            if (!questionResults.votesByDate[date]) {
              questionResults.votesByDate[date] = { yes: 0, no: 0, maybe: 0, total: 0 };
            }
            questionResults.votesByDate[date][vote]++;
            questionResults.votesByDate[date].total++;

            timeSlots.forEach((slot) => {
              const timeSlotKey = `${date}-${slot.hour}-${slot.minute}`;
              if (!questionResults.votesByTimeSlot[timeSlotKey]) {
                questionResults.votesByTimeSlot[timeSlotKey] = { yes: 0, no: 0, maybe: 0, total: 0 };
              }
              questionResults.votesByTimeSlot[timeSlotKey][vote]++;
              questionResults.votesByTimeSlot[timeSlotKey].total++;
            });
          });

          questionResults.totalResponses++;
          dateResults[q.id] = questionResults;
        }
      } else if (Array.isArray(item.value)) {
        for (const optId of item.value as string[]) {
          countsByQuestion[q.id][optId] = (countsByQuestion[q.id][optId] || 0) + 1;
        }
      } else if (typeof item.value === "string") {
        countsByQuestion[q.id][item.value] = (countsByQuestion[q.id][item.value] || 0) + 1;
      } else if (typeof item.value === "number") {
        const key = item.value.toString();
        countsByQuestion[q.id][key] = (countsByQuestion[q.id][key] || 0) + 1;
      }
    }
  }

  return {
    pollId,
    countsByQuestion,
    textAnswers,
    dateResults,
    totalResponses: all.length,
  };
}

export function getFormResponses(pollId: string): FormResponse[] {
  const all = readAllFormResponses();
  return all.filter((r) => r.pollId === pollId);
}

// Utility functions
function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getDeviceId(): string {
  if (!hasWindow()) return `server_${Date.now()}`;
  
  let deviceId = localStorage.getItem("doodates_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("doodates_device_id", deviceId);
  }
  return deviceId;
}
