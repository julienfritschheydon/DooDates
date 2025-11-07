/**
 * Types et interfaces pour le système d'historique des conversations IA
 * DooDates - Conversation History System
 */
export declare const CONVERSATION_STATUS: {
  readonly ACTIVE: "active";
  readonly COMPLETED: "completed";
  readonly ARCHIVED: "archived";
};
export declare const MESSAGE_ROLE: {
  readonly USER: "user";
  readonly ASSISTANT: "assistant";
};
export declare const CONVERSATION_LIMITS: {
  readonly GUEST_MAX_CONVERSATIONS: 10;
  readonly AUTHENTICATED_MAX_CONVERSATIONS: 1000;
  readonly GUEST_RETENTION_DAYS: 30;
  readonly MAX_CONVERSATION_SIZE: 10000;
  readonly FIRST_MESSAGE_PREVIEW_LENGTH: 100;
  readonly MAX_TITLE_LENGTH: 100;
};
export type ConversationStatus = (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];
export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];
export type StorageProvider = "localStorage" | "supabase";
export interface ConversationMetadata {
  pollGenerated?: boolean;
  pollTitle?: string;
  pollId?: string;
  errorOccurred?: boolean;
  aiModel?: string;
  language?: "fr" | "en";
  userAgent?: string;
  folderId?: string;
}
export interface MessageMetadata {
  pollGenerated?: boolean;
  errorOccurred?: boolean;
  processingTime?: number;
  tokenCount?: number;
  title?: string;
  description?: string;
  dates?: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[];
  }>;
  type?: "date" | "datetime" | "custom";
  participants?: string[];
  pollSuggestion?: any;
}
export interface Conversation {
  /** Identifiant unique de la conversation */
  id: string;
  /** Titre personnalisable de la conversation */
  title: string;
  /** Statut actuel de la conversation */
  status: ConversationStatus;
  /** Date de création */
  createdAt: Date;
  /** Date de dernière modification */
  updatedAt: Date;
  /** Aperçu du premier message (100 premiers caractères) */
  firstMessage: string;
  /** Nombre total de messages dans la conversation */
  messageCount: number;
  /** ID du sondage lié à cette conversation (relation 1:1 stricte) */
  relatedPollId?: string;
  /** NOUVEAU : ID du poll lié (remplace progressivement relatedPollId) */
  pollId?: string;
  /** NOUVEAU : Type du poll lié */
  pollType?: "date" | "form" | null;
  /** NOUVEAU : Status du poll lié */
  pollStatus?: "draft" | "active" | "closed" | "archived";
  /** Indique si la conversation est marquée comme favorite */
  isFavorite: boolean;
  /** Rang de tri pour les favoris (1 = premier, 2 = deuxième, etc.) */
  favorite_rank?: number;
  /** Tags pour recherche et filtrage */
  tags: string[];
  /** Métadonnées additionnelles */
  metadata?: ConversationMetadata;
  /** ID utilisateur (null pour invités) */
  userId?: string;
}
export interface ConversationMessage {
  /** Identifiant unique du message */
  id: string;
  /** ID de la conversation parente */
  conversationId: string;
  /** Rôle de l'expéditeur du message */
  role: MessageRole;
  /** Contenu textuel du message */
  content: string;
  /** Horodatage du message */
  timestamp: Date;
  /** Métadonnées du message */
  metadata?: MessageMetadata;
}
export interface LocalStorageConversationData {
  conversations: Conversation[];
  messages: ConversationMessage[];
  lastCleanup: Date;
  version: string;
}
export interface ConversationQuota {
  /** Nombre maximum de conversations autorisées */
  maxConversations: number;
  /** Nombre actuel de conversations */
  currentCount: number;
  /** Indique si l'utilisateur est authentifié */
  isAuthenticated: boolean;
  /** Date d'expiration pour les utilisateurs invités */
  expiresAt?: Date;
}
export interface CreateConversationRequest {
  title?: string;
  firstMessage: string;
  metadata?: ConversationMetadata;
}
export interface UpdateConversationRequest {
  title?: string;
  status?: ConversationStatus;
  isFavorite?: boolean;
  tags?: string[];
  relatedPollId?: string;
}
export interface AddMessageRequest {
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
}
export interface ConversationSearchFilters {
  status?: ConversationStatus[];
  isFavorite?: boolean;
  hasRelatedPoll?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}
export interface ConversationSearchResult {
  conversations: Conversation[];
  totalCount: number;
  hasMore: boolean;
}
import { DooDatesError, ErrorSeverity, ErrorCategory, ErrorContext } from "../lib/error-handling";
export declare class ConversationError extends DooDatesError {
  constructor(
    message: string,
    code: string,
    severity?: ErrorSeverity,
    category?: ErrorCategory,
    context?: ErrorContext,
  );
}
export declare const CONVERSATION_ERROR_CODES: {
  readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
  readonly CONVERSATION_NOT_FOUND: "CONVERSATION_NOT_FOUND";
  readonly INVALID_MESSAGE_ROLE: "INVALID_MESSAGE_ROLE";
  readonly STORAGE_FULL: "STORAGE_FULL";
  readonly MIGRATION_FAILED: "MIGRATION_FAILED";
  readonly SYNC_CONFLICT: "SYNC_CONFLICT";
  readonly CORRUPTED_DATA: "CORRUPTED_DATA";
};
export type ConversationErrorCode =
  (typeof CONVERSATION_ERROR_CODES)[keyof typeof CONVERSATION_ERROR_CODES];
export declare const ConversationErrorFactory: {
  quotaExceeded: (maxConversations: number) => DooDatesError;
  notFound: (conversationId: string) => DooDatesError;
  invalidRole: (role: string) => DooDatesError;
  storageFull: () => DooDatesError;
  migrationFailed: (reason: string) => DooDatesError;
  syncConflict: (conversationId: string) => DooDatesError;
  corruptedData: (details: string) => DooDatesError;
};
export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  archivedConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  pollsGenerated: number;
}
export interface ConversationListItem extends Omit<Conversation, "metadata"> {
  /** Indicateur de statut pour l'UI */
  statusIcon: "🟡" | "🟢" | "📁";
  /** Texte formaté pour l'affichage */
  displayDate: string;
  /** Indique si la conversation peut être reprise */
  canResume: boolean;
}
export declare function isValidConversationStatus(status: string): status is ConversationStatus;
export declare function isValidMessageRole(role: string): role is MessageRole;
export declare function isConversation(obj: any): obj is Conversation;
export declare function isConversationMessage(obj: any): obj is ConversationMessage;
