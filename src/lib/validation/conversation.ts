/**
 * Schémas de validation Zod pour le système de conversations
 * DooDates - Conversation Validation Schemas
 */

import { z } from 'zod';
import {
  CONVERSATION_STATUS,
  MESSAGE_ROLE,
  CONVERSATION_LIMITS,
  CONVERSATION_ERROR_CODES,
  type ConversationStatus,
  type MessageRole,
  type ConversationErrorCode
} from '../../types/conversation';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const ConversationStatusSchema = z.enum([
  CONVERSATION_STATUS.ACTIVE,
  CONVERSATION_STATUS.COMPLETED,
  CONVERSATION_STATUS.ARCHIVED
]);

export const MessageRoleSchema = z.enum([
  MESSAGE_ROLE.USER,
  MESSAGE_ROLE.ASSISTANT
]);

export const ConversationMetadataSchema = z.object({
  pollGenerated: z.boolean().optional(),
  errorOccurred: z.boolean().optional(),
  aiModel: z.string().optional(),
  language: z.enum(['fr', 'en']).optional(),
  userAgent: z.string().optional()
}).optional();

export const MessageMetadataSchema = z.object({
  pollGenerated: z.boolean().optional(),
  errorOccurred: z.boolean().optional(),
  processingTime: z.number().positive().optional(),
  tokenCount: z.number().positive().optional()
}).optional();

// ============================================================================
// CORE ENTITY SCHEMAS
// ============================================================================

export const ConversationSchema = z.object({
  id: z.string().min(1, 'ID de conversation invalide'),
  title: z.string()
    .min(1, 'Le titre ne peut pas être vide')
    .max(CONVERSATION_LIMITS.MAX_TITLE_LENGTH, `Le titre ne peut pas dépasser ${CONVERSATION_LIMITS.MAX_TITLE_LENGTH} caractères`),
  status: ConversationStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  firstMessage: z.string()
    .min(1, 'Le premier message ne peut pas être vide')
    .max(CONVERSATION_LIMITS.FIRST_MESSAGE_PREVIEW_LENGTH, 'Aperçu du premier message trop long'),
  messageCount: z.number()
    .int('Le nombre de messages doit être un entier')
    .min(0, 'Le nombre de messages ne peut pas être négatif'),
  relatedPollId: z.string().uuid().optional(),
  isFavorite: z.boolean(),
  tags: z.array(z.string()).default([]),
  metadata: ConversationMetadataSchema,
  userId: z.string().optional()
});

export const ConversationMessageSchema = z.object({
  id: z.string().min(1, 'ID de message invalide'),
  conversationId: z.string().min(1, 'ID de conversation invalide'),
  role: MessageRoleSchema,
  content: z.string()
    .min(1, 'Le contenu du message ne peut pas être vide')
    .max(CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE, 'Message trop long'),
  timestamp: z.date(),
  metadata: MessageMetadataSchema
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const CreateConversationRequestSchema = z.object({
  title: z.string()
    .max(CONVERSATION_LIMITS.MAX_TITLE_LENGTH, `Le titre ne peut pas dépasser ${CONVERSATION_LIMITS.MAX_TITLE_LENGTH} caractères`)
    .optional(),
  firstMessage: z.string()
    .min(1, 'Le premier message est requis')
    .max(CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE, 'Premier message trop long'),
  metadata: ConversationMetadataSchema
});

export const UpdateConversationRequestSchema = z.object({
  title: z.string()
    .min(1, 'Le titre ne peut pas être vide')
    .max(CONVERSATION_LIMITS.MAX_TITLE_LENGTH, `Le titre ne peut pas dépasser ${CONVERSATION_LIMITS.MAX_TITLE_LENGTH} caractères`)
    .optional(),
  status: ConversationStatusSchema.optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  relatedPollId: z.string().uuid().optional(),
});

export const AddMessageRequestSchema = z.object({
  conversationId: z.string().min(1, 'ID de conversation invalide'),
  role: MessageRoleSchema,
  content: z.string()
    .min(1, 'Le contenu du message ne peut pas être vide')
    .max(CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE, 'Message trop long'),
  metadata: MessageMetadataSchema
});

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const ConversationSearchFiltersSchema = z.object({
  status: z.array(ConversationStatusSchema).optional(),
  isFavorite: z.boolean().optional(),
  hasRelatedPoll: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional()
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  {
    message: 'La date de début doit être antérieure à la date de fin',
    path: ['dateFrom']
  }
);

// ============================================================================
// STORAGE SCHEMAS
// ============================================================================

export const LocalStorageConversationDataSchema = z.object({
  conversations: z.array(ConversationSchema),
  messages: z.array(ConversationMessageSchema),
  lastCleanup: z.date(),
  version: z.string()
});

export const ConversationQuotaSchema = z.object({
  maxConversations: z.number().int().positive(),
  currentCount: z.number().int().min(0),
  isAuthenticated: z.boolean(),
  expiresAt: z.date().optional()
}).refine(
  (data) => data.currentCount <= data.maxConversations,
  {
    message: 'Le nombre actuel de conversations ne peut pas dépasser la limite',
    path: ['currentCount']
  }
);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateConversation(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof ConversationSchema>> {
  return ConversationSchema.safeParse(data);
}

export function validateConversationMessage(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof ConversationMessageSchema>> {
  return ConversationMessageSchema.safeParse(data);
}

export function validateCreateConversationRequest(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof CreateConversationRequestSchema>> {
  return CreateConversationRequestSchema.safeParse(data);
}

export function validateUpdateConversationRequest(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof UpdateConversationRequestSchema>> {
  return UpdateConversationRequestSchema.safeParse(data);
}

export function validateAddMessageRequest(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof AddMessageRequestSchema>> {
  return AddMessageRequestSchema.safeParse(data);
}

export function validateLocalStorageData(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof LocalStorageConversationDataSchema>> {
  return LocalStorageConversationDataSchema.safeParse(data);
}

export function validateConversationQuota(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof ConversationQuotaSchema>> {
  return ConversationQuotaSchema.safeParse(data);
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

export function sanitizeConversationTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .slice(0, CONVERSATION_LIMITS.MAX_TITLE_LENGTH);
}

export function sanitizeMessageContent(content: string): string {
  return content
    .trim()
    .slice(0, CONVERSATION_LIMITS.MAX_CONVERSATION_SIZE);
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index) // Supprimer les doublons
    .slice(0, 10); // Limiter à 10 tags max
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

export function createValidationError(
  code: ConversationErrorCode,
  message: string,
  zodError?: z.ZodError
): Error {
  const error = new Error(message);
  error.name = 'ConversationValidationError';
  (error as any).code = code;
  (error as any).zodError = zodError;
  return error;
}

export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ValidatedConversation = z.infer<typeof ConversationSchema>;
export type ValidatedConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type ValidatedCreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type ValidatedUpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
export type ValidatedAddMessageRequest = z.infer<typeof AddMessageRequestSchema>;
export type ValidatedLocalStorageData = z.infer<typeof LocalStorageConversationDataSchema>;
export type ValidatedConversationQuota = z.infer<typeof ConversationQuotaSchema>;
