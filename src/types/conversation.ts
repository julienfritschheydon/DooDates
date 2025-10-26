/**
 * Types et interfaces pour le système d'historique des conversations IA
 * DooDates - Conversation History System
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const CONVERSATION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export const MESSAGE_ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export const CONVERSATION_LIMITS = {
  GUEST_MAX_CONVERSATIONS: 10,
  AUTHENTICATED_MAX_CONVERSATIONS: 1000,
  GUEST_RETENTION_DAYS: 30,
  MAX_CONVERSATION_SIZE: 10000, // caractères
  FIRST_MESSAGE_PREVIEW_LENGTH: 100,
  MAX_TITLE_LENGTH: 100,
} as const;

// ============================================================================
// BASE TYPES
// ============================================================================

export type ConversationStatus =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];
export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];
export type StorageProvider = "localStorage" | "supabase";

export interface ConversationMetadata {
  pollGenerated?: boolean;
  pollTitle?: string; // Titre du sondage créé (pour rétrocompatibilité)
  errorOccurred?: boolean;
  aiModel?: string;
  language?: "fr" | "en";
  userAgent?: string;
}

export interface MessageMetadata {
  pollGenerated?: boolean;
  errorOccurred?: boolean;
  processingTime?: number;
  tokenCount?: number;
  // Poll suggestion data when pollGenerated is true
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
  // NOUVEAU : Sauvegarder la suggestion complète (Date Poll ou Form Poll)
  pollSuggestion?: any; // PollSuggestion type (DatePollSuggestion | FormPollSuggestion)
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

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

// ============================================================================
// STORAGE TYPES
// ============================================================================

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

// ============================================================================
// API TYPES
// ============================================================================

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

// ============================================================================
// ERROR TYPES
// ============================================================================

import {
  DooDatesError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorFactory,
} from "../lib/error-handling";

export class ConversationError extends DooDatesError {
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.STORAGE,
    context: ErrorContext = {},
  ) {
    super(message, message, severity, category, context);
    this.name = "ConversationError";
  }
}

export const CONVERSATION_ERROR_CODES = {
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  CONVERSATION_NOT_FOUND: "CONVERSATION_NOT_FOUND",
  INVALID_MESSAGE_ROLE: "INVALID_MESSAGE_ROLE",
  STORAGE_FULL: "STORAGE_FULL",
  MIGRATION_FAILED: "MIGRATION_FAILED",
  SYNC_CONFLICT: "SYNC_CONFLICT",
  CORRUPTED_DATA: "CORRUPTED_DATA",
} as const;

export type ConversationErrorCode =
  (typeof CONVERSATION_ERROR_CODES)[keyof typeof CONVERSATION_ERROR_CODES];

// Factory functions for conversation-specific errors
export const ConversationErrorFactory = {
  quotaExceeded: (maxConversations: number) =>
    ErrorFactory.validation(
      `Quota exceeded: maximum ${maxConversations} conversations allowed`,
      `Quota dépassé: maximum ${maxConversations} conversation(s) autorisées`,
    ),

  notFound: (conversationId: string) =>
    ErrorFactory.storage(
      `Conversation not found: ${conversationId}`,
      `Conversation non trouvée`,
    ),

  invalidRole: (role: string) =>
    ErrorFactory.validation(
      `Invalid message role: ${role}`,
      `Rôle de message invalide`,
    ),

  storageFull: () =>
    ErrorFactory.storage(
      "Storage capacity exceeded",
      "Capacité de stockage dépassée",
    ),

  migrationFailed: (reason: string) =>
    ErrorFactory.storage(
      `Migration failed: ${reason}`,
      "Échec de la migration",
    ),

  syncConflict: (conversationId: string) =>
    ErrorFactory.storage(
      `Sync conflict for conversation: ${conversationId}`,
      "Conflit de synchronisation",
    ),

  corruptedData: (details: string) =>
    ErrorFactory.storage(
      `Corrupted data detected: ${details}`,
      "Données corrompues détectées",
    ),
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

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

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidConversationStatus(
  status: string,
): status is ConversationStatus {
  return Object.values(CONVERSATION_STATUS).includes(
    status as ConversationStatus,
  );
}

export function isValidMessageRole(role: string): role is MessageRole {
  return Object.values(MESSAGE_ROLE).includes(role as MessageRole);
}

export function isConversation(obj: any): obj is Conversation {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  return (
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    isValidConversationStatus(obj.status) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    typeof obj.firstMessage === "string" &&
    typeof obj.messageCount === "number" &&
    typeof obj.isFavorite === "boolean" &&
    Array.isArray(obj.tags)
  );
}

export function isConversationMessage(obj: any): obj is ConversationMessage {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  return (
    typeof obj.id === "string" &&
    typeof obj.conversationId === "string" &&
    isValidMessageRole(obj.role) &&
    typeof obj.content === "string" &&
    obj.timestamp instanceof Date
  );
}
