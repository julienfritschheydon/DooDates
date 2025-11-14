/**
 * Types communs pour remplacer les `any` dans tout le projet
 */

import type { Poll } from "./poll";
import type { Conversation, ConversationMessage } from "./conversation";
import type { PollSuggestion } from "../lib/gemini";
import type { FormQuestionShape } from "../lib/pollStorage";

// Types pour les composants React génériques
export type ReactComponent = React.ComponentType<Record<string, unknown>>;
export type ReactComponentProps = Record<string, unknown>;

// Types pour les événements
export type EventHandler = (event: Event) => void;
export type ErrorHandler = (error: Error) => void;

// Types pour les données génériques
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = Record<string, JsonValue>;
export type JsonArray = JsonValue[];

// Types pour les métadonnées
export type Metadata = Record<string, unknown>;

// Types pour les options de questions
export type QuestionOption = FormQuestionShape["options"][number];

// Types pour les votes
export type VoteSelection = Record<string, "yes" | "no" | "maybe">;

// Types pour les résultats de requêtes
export type QueryResult<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
};

// Types pour les callbacks génériques
export type Callback<T = void> = (value: T) => void;
export type AsyncCallback<T = void> = (value: T) => Promise<void>;

// Types pour les fonctions de transformation
export type Transform<T, R> = (value: T) => R;
export type AsyncTransform<T, R> = (value: T) => Promise<R>;

// Types pour les erreurs
export type ErrorWithCode = Error & { code?: string };
export type ErrorWithMetadata = Error & { metadata?: Metadata };

// Types pour les données de formulaire
export type FormData = Record<string, string | number | boolean | null | undefined>;

// Types pour les données de poll
export type PollData = Poll | Partial<Poll>;
export type PollMetadata = Poll["metadata"];

// Types pour les données de conversation
export type ConversationData = Conversation | Partial<Conversation>;
export type ConversationMetadata = Conversation["metadata"];

// Types pour les messages
export type MessageData = ConversationMessage | Partial<ConversationMessage>;
export type MessageMetadata = ConversationMessage["metadata"];

// Types pour les suggestions de poll
export type PollSuggestionData = PollSuggestion | Partial<PollSuggestion>;

// Types pour les réponses API
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Types pour les résultats de mutation
export type MutationResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: Error;
};

// Types pour les données de stockage
export type StorageData = Record<string, unknown>;

// Types pour les données de configuration
export type ConfigData = Record<string, string | number | boolean | null | undefined>;

// Types pour les données de quota
export type QuotaData = {
  used: number;
  limit: number;
  remaining: number;
  resetAt?: Date;
};

// Types pour les données d'analytics
export type AnalyticsData = Record<string, number | string | boolean | null>;

// Types pour les données de performance
export type PerformanceData = {
  duration: number;
  timestamp: number;
  metadata?: Metadata;
};

// Types pour les données de test
export type TestData = Record<string, unknown>;

// Types pour les données E2E
export type E2ETestData = {
  __IS_E2E_TESTING__?: boolean;
  __E2E__?: boolean;
  preloadPollCreator?: () => Promise<void>;
};

// Extension de Window pour les données E2E
declare global {
  interface Window extends E2ETestData {
    [key: string]: unknown;
  }
}
