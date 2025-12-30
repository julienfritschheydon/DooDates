export interface TimeSlot {
  start: string;
  end: string;
  dates?: string[];
}
export interface PollSettings {
  selectedDates?: string[];
  timeSlotsByDate?: Record<
    string,
    Array<{
      hour: number;
      minute: number;
      enabled: boolean;
      duration?: number;
    }>
  >;
  timeGranularity?: number;
}
export type FormQuestionKind =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps";
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
}
import type { ConditionalRule } from "../types/conditionalRules";
export interface FormResponseItem {
  questionId: string;
  value: string | string[] | Record<string, string | string[]> | number;
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
// Résultats agrégés pour une question de type "date"
export type DateVoteValue = Array<{
  date: string;
  timeSlots: Array<{ hour: number; minute: number }>;
  vote: "yes" | "no" | "maybe";
}>;

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
  totalResponses: number;
}
export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: PollSettings;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string;
  dates?: string[];
  type?: "date" | "form";
  questions?: FormQuestionShape[];
  conditionalRules?: ConditionalRule[];
  themeId?: string;
  displayMode?: "all-at-once" | "multi-step";
  relatedConversationId?: string;
  conversationId?: string;
  resultsVisibility?: "creator-only" | "voters" | "public";
}
export declare function getPolls(): Poll[];
export declare function savePolls(polls: Poll[]): void;
export declare function getPollBySlugOrId(idOrSlug: string | undefined | null): Poll | null;
export declare function addPoll(poll: Poll): void;
export declare function deletePollById(id: string): void;
export declare function duplicatePoll(poll: Poll): Poll;
export declare function buildPublicLink(slug: string): string;
export declare function copyToClipboard(text: string): Promise<void>;
export declare function getAllPolls(): Poll[];
export declare function addFormResponse(params: {
  pollId: string;
  respondentName?: string;
  respondentEmail?: string;
  items: FormResponseItem[];
}): FormResponse;
export declare function getFormResults(pollId: string): FormResults;
export declare function getFormResponses(pollId: string): FormResponse[];
export declare function getDeviceId(): string;
export interface Vote {
  id?: string;
  poll_id: string;
  voter_email?: string;
  voter_name?: string;
  created_at?: string;
  [key: string]: unknown;
}
export declare function getVoterId(vote: {
  voter_email?: string;
  voter_name?: string;
  id?: string;
  created_at?: string;
}): string;
export declare function getAllVotes(): Vote[];
export declare function saveVotes(votes: Vote[]): void;
export declare function getVotesByPollId(pollId: string): Vote[];
export declare function deleteVotesByPollId(pollId: string): void;
export declare function getRespondentId(resp: FormResponse): string;
export declare function anonymizeFormResponsesForPoll(pollId: string): { anonymizedCount: number };
/**
 * Récupère l'ID de l'utilisateur actuel (device ID ou user ID si authentifié)
 *
 * @param authenticatedUserId - ID utilisateur Supabase si authentifié (optionnel)
 * @returns user.id si authentifié, sinon deviceId
 */
export declare function getCurrentUserId(authenticatedUserId?: string | null): string;
/**
 * Vérifie si l'utilisateur actuel a voté sur ce poll
 * Vérifie par deviceId stocké dans la réponse (fonctionne pour votes anonymes et avec nom)
 */
export declare function checkIfUserHasVoted(pollId: string): boolean;
/**
 * Récupère un poll par son conversationId
 */
export declare function getPollByConversationId(conversationId: string): Poll | null;
/**
 * Met à jour le lien entre un poll et une conversation
 */
export declare function updatePollConversationLink(pollId: string, conversationId: string): void;
