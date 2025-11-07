/**
 * Schémas de validation Zod pour le système de conversations
 * DooDates - Conversation Validation Schemas
 */
import { z } from "zod";
import { type ConversationErrorCode } from "../../types/conversation";
export declare const ConversationStatusSchema: z.ZodEnum<["active", "completed", "archived"]>;
export declare const MessageRoleSchema: z.ZodEnum<["user", "assistant"]>;
export declare const ConversationMetadataSchema: z.ZodOptional<
  z.ZodObject<
    {
      pollGenerated: z.ZodOptional<z.ZodBoolean>;
      errorOccurred: z.ZodOptional<z.ZodBoolean>;
      aiModel: z.ZodOptional<z.ZodString>;
      language: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
      userAgent: z.ZodOptional<z.ZodString>;
    },
    "strip",
    z.ZodTypeAny,
    {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    },
    {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    }
  >
>;
export declare const MessageMetadataSchema: z.ZodOptional<
  z.ZodObject<
    {
      pollGenerated: z.ZodOptional<z.ZodBoolean>;
      errorOccurred: z.ZodOptional<z.ZodBoolean>;
      processingTime: z.ZodOptional<z.ZodNumber>;
      tokenCount: z.ZodOptional<z.ZodNumber>;
    },
    "strip",
    z.ZodTypeAny,
    {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    },
    {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    }
  >
>;
export declare const ConversationSchema: z.ZodObject<
  {
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["active", "completed", "archived"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    firstMessage: z.ZodString;
    messageCount: z.ZodNumber;
    relatedPollId: z.ZodOptional<z.ZodString>;
    isFavorite: z.ZodBoolean;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<
      z.ZodObject<
        {
          pollGenerated: z.ZodOptional<z.ZodBoolean>;
          errorOccurred: z.ZodOptional<z.ZodBoolean>;
          aiModel: z.ZodOptional<z.ZodString>;
          language: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
          userAgent: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          language?: "fr" | "en";
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          aiModel?: string;
          userAgent?: string;
        },
        {
          language?: "fr" | "en";
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          aiModel?: string;
          userAgent?: string;
        }
      >
    >;
    userId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    title?: string;
    metadata?: {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    };
    id?: string;
    status?: "active" | "archived" | "completed";
    createdAt?: Date;
    updatedAt?: Date;
    firstMessage?: string;
    messageCount?: number;
    relatedPollId?: string;
    isFavorite?: boolean;
    tags?: string[];
    userId?: string;
  },
  {
    title?: string;
    metadata?: {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    };
    id?: string;
    status?: "active" | "archived" | "completed";
    createdAt?: Date;
    updatedAt?: Date;
    firstMessage?: string;
    messageCount?: number;
    relatedPollId?: string;
    isFavorite?: boolean;
    tags?: string[];
    userId?: string;
  }
>;
export declare const ConversationMessageSchema: z.ZodObject<
  {
    id: z.ZodString;
    conversationId: z.ZodString;
    role: z.ZodEnum<["user", "assistant"]>;
    content: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<
      z.ZodObject<
        {
          pollGenerated: z.ZodOptional<z.ZodBoolean>;
          errorOccurred: z.ZodOptional<z.ZodBoolean>;
          processingTime: z.ZodOptional<z.ZodNumber>;
          tokenCount: z.ZodOptional<z.ZodNumber>;
        },
        "strip",
        z.ZodTypeAny,
        {
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          processingTime?: number;
          tokenCount?: number;
        },
        {
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          processingTime?: number;
          tokenCount?: number;
        }
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    metadata?: {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    };
    id?: string;
    role?: "user" | "assistant";
    content?: string;
    conversationId?: string;
    timestamp?: Date;
  },
  {
    metadata?: {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    };
    id?: string;
    role?: "user" | "assistant";
    content?: string;
    conversationId?: string;
    timestamp?: Date;
  }
>;
export declare const CreateConversationRequestSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    firstMessage: z.ZodString;
    metadata: z.ZodOptional<
      z.ZodObject<
        {
          pollGenerated: z.ZodOptional<z.ZodBoolean>;
          errorOccurred: z.ZodOptional<z.ZodBoolean>;
          aiModel: z.ZodOptional<z.ZodString>;
          language: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
          userAgent: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          language?: "fr" | "en";
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          aiModel?: string;
          userAgent?: string;
        },
        {
          language?: "fr" | "en";
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          aiModel?: string;
          userAgent?: string;
        }
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    title?: string;
    metadata?: {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    };
    firstMessage?: string;
  },
  {
    title?: string;
    metadata?: {
      language?: "fr" | "en";
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      aiModel?: string;
      userAgent?: string;
    };
    firstMessage?: string;
  }
>;
export declare const UpdateConversationRequestSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "completed", "archived"]>>;
    isFavorite: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedPollId: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    title?: string;
    status?: "active" | "archived" | "completed";
    relatedPollId?: string;
    isFavorite?: boolean;
    tags?: string[];
  },
  {
    title?: string;
    status?: "active" | "archived" | "completed";
    relatedPollId?: string;
    isFavorite?: boolean;
    tags?: string[];
  }
>;
export declare const AddMessageRequestSchema: z.ZodObject<
  {
    conversationId: z.ZodString;
    role: z.ZodEnum<["user", "assistant"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<
      z.ZodObject<
        {
          pollGenerated: z.ZodOptional<z.ZodBoolean>;
          errorOccurred: z.ZodOptional<z.ZodBoolean>;
          processingTime: z.ZodOptional<z.ZodNumber>;
          tokenCount: z.ZodOptional<z.ZodNumber>;
        },
        "strip",
        z.ZodTypeAny,
        {
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          processingTime?: number;
          tokenCount?: number;
        },
        {
          pollGenerated?: boolean;
          errorOccurred?: boolean;
          processingTime?: number;
          tokenCount?: number;
        }
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    metadata?: {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    };
    role?: "user" | "assistant";
    content?: string;
    conversationId?: string;
  },
  {
    metadata?: {
      pollGenerated?: boolean;
      errorOccurred?: boolean;
      processingTime?: number;
      tokenCount?: number;
    };
    role?: "user" | "assistant";
    content?: string;
    conversationId?: string;
  }
>;
export declare const ConversationSearchFiltersSchema: z.ZodEffects<
  z.ZodObject<
    {
      status: z.ZodOptional<z.ZodArray<z.ZodEnum<["active", "completed", "archived"]>, "many">>;
      isFavorite: z.ZodOptional<z.ZodBoolean>;
      hasRelatedPoll: z.ZodOptional<z.ZodBoolean>;
      dateFrom: z.ZodOptional<z.ZodDate>;
      dateTo: z.ZodOptional<z.ZodDate>;
      tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    },
    "strip",
    z.ZodTypeAny,
    {
      status?: ("active" | "archived" | "completed")[];
      isFavorite?: boolean;
      tags?: string[];
      hasRelatedPoll?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
    },
    {
      status?: ("active" | "archived" | "completed")[];
      isFavorite?: boolean;
      tags?: string[];
      hasRelatedPoll?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
    }
  >,
  {
    status?: ("active" | "archived" | "completed")[];
    isFavorite?: boolean;
    tags?: string[];
    hasRelatedPoll?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  },
  {
    status?: ("active" | "archived" | "completed")[];
    isFavorite?: boolean;
    tags?: string[];
    hasRelatedPoll?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }
>;
export declare const LocalStorageConversationDataSchema: z.ZodObject<
  {
    conversations: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          title: z.ZodString;
          status: z.ZodEnum<["active", "completed", "archived"]>;
          createdAt: z.ZodDate;
          updatedAt: z.ZodDate;
          firstMessage: z.ZodString;
          messageCount: z.ZodNumber;
          relatedPollId: z.ZodOptional<z.ZodString>;
          isFavorite: z.ZodBoolean;
          tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
          metadata: z.ZodOptional<
            z.ZodObject<
              {
                pollGenerated: z.ZodOptional<z.ZodBoolean>;
                errorOccurred: z.ZodOptional<z.ZodBoolean>;
                aiModel: z.ZodOptional<z.ZodString>;
                language: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
                userAgent: z.ZodOptional<z.ZodString>;
              },
              "strip",
              z.ZodTypeAny,
              {
                language?: "fr" | "en";
                pollGenerated?: boolean;
                errorOccurred?: boolean;
                aiModel?: string;
                userAgent?: string;
              },
              {
                language?: "fr" | "en";
                pollGenerated?: boolean;
                errorOccurred?: boolean;
                aiModel?: string;
                userAgent?: string;
              }
            >
          >;
          userId: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          title?: string;
          metadata?: {
            language?: "fr" | "en";
            pollGenerated?: boolean;
            errorOccurred?: boolean;
            aiModel?: string;
            userAgent?: string;
          };
          id?: string;
          status?: "active" | "archived" | "completed";
          createdAt?: Date;
          updatedAt?: Date;
          firstMessage?: string;
          messageCount?: number;
          relatedPollId?: string;
          isFavorite?: boolean;
          tags?: string[];
          userId?: string;
        },
        {
          title?: string;
          metadata?: {
            language?: "fr" | "en";
            pollGenerated?: boolean;
            errorOccurred?: boolean;
            aiModel?: string;
            userAgent?: string;
          };
          id?: string;
          status?: "active" | "archived" | "completed";
          createdAt?: Date;
          updatedAt?: Date;
          firstMessage?: string;
          messageCount?: number;
          relatedPollId?: string;
          isFavorite?: boolean;
          tags?: string[];
          userId?: string;
        }
      >,
      "many"
    >;
    messages: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          conversationId: z.ZodString;
          role: z.ZodEnum<["user", "assistant"]>;
          content: z.ZodString;
          timestamp: z.ZodDate;
          metadata: z.ZodOptional<
            z.ZodObject<
              {
                pollGenerated: z.ZodOptional<z.ZodBoolean>;
                errorOccurred: z.ZodOptional<z.ZodBoolean>;
                processingTime: z.ZodOptional<z.ZodNumber>;
                tokenCount: z.ZodOptional<z.ZodNumber>;
              },
              "strip",
              z.ZodTypeAny,
              {
                pollGenerated?: boolean;
                errorOccurred?: boolean;
                processingTime?: number;
                tokenCount?: number;
              },
              {
                pollGenerated?: boolean;
                errorOccurred?: boolean;
                processingTime?: number;
                tokenCount?: number;
              }
            >
          >;
        },
        "strip",
        z.ZodTypeAny,
        {
          metadata?: {
            pollGenerated?: boolean;
            errorOccurred?: boolean;
            processingTime?: number;
            tokenCount?: number;
          };
          id?: string;
          role?: "user" | "assistant";
          content?: string;
          conversationId?: string;
          timestamp?: Date;
        },
        {
          metadata?: {
            pollGenerated?: boolean;
            errorOccurred?: boolean;
            processingTime?: number;
            tokenCount?: number;
          };
          id?: string;
          role?: "user" | "assistant";
          content?: string;
          conversationId?: string;
          timestamp?: Date;
        }
      >,
      "many"
    >;
    lastCleanup: z.ZodDate;
    version: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    version?: string;
    conversations?: {
      title?: string;
      metadata?: {
        language?: "fr" | "en";
        pollGenerated?: boolean;
        errorOccurred?: boolean;
        aiModel?: string;
        userAgent?: string;
      };
      id?: string;
      status?: "active" | "archived" | "completed";
      createdAt?: Date;
      updatedAt?: Date;
      firstMessage?: string;
      messageCount?: number;
      relatedPollId?: string;
      isFavorite?: boolean;
      tags?: string[];
      userId?: string;
    }[];
    messages?: {
      metadata?: {
        pollGenerated?: boolean;
        errorOccurred?: boolean;
        processingTime?: number;
        tokenCount?: number;
      };
      id?: string;
      role?: "user" | "assistant";
      content?: string;
      conversationId?: string;
      timestamp?: Date;
    }[];
    lastCleanup?: Date;
  },
  {
    version?: string;
    conversations?: {
      title?: string;
      metadata?: {
        language?: "fr" | "en";
        pollGenerated?: boolean;
        errorOccurred?: boolean;
        aiModel?: string;
        userAgent?: string;
      };
      id?: string;
      status?: "active" | "archived" | "completed";
      createdAt?: Date;
      updatedAt?: Date;
      firstMessage?: string;
      messageCount?: number;
      relatedPollId?: string;
      isFavorite?: boolean;
      tags?: string[];
      userId?: string;
    }[];
    messages?: {
      metadata?: {
        pollGenerated?: boolean;
        errorOccurred?: boolean;
        processingTime?: number;
        tokenCount?: number;
      };
      id?: string;
      role?: "user" | "assistant";
      content?: string;
      conversationId?: string;
      timestamp?: Date;
    }[];
    lastCleanup?: Date;
  }
>;
export declare const ConversationQuotaSchema: z.ZodEffects<
  z.ZodObject<
    {
      maxConversations: z.ZodNumber;
      currentCount: z.ZodNumber;
      isAuthenticated: z.ZodBoolean;
      expiresAt: z.ZodOptional<z.ZodDate>;
    },
    "strip",
    z.ZodTypeAny,
    {
      expiresAt?: Date;
      maxConversations?: number;
      currentCount?: number;
      isAuthenticated?: boolean;
    },
    {
      expiresAt?: Date;
      maxConversations?: number;
      currentCount?: number;
      isAuthenticated?: boolean;
    }
  >,
  {
    expiresAt?: Date;
    maxConversations?: number;
    currentCount?: number;
    isAuthenticated?: boolean;
  },
  {
    expiresAt?: Date;
    maxConversations?: number;
    currentCount?: number;
    isAuthenticated?: boolean;
  }
>;
export declare function validateConversation(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof ConversationSchema>>;
export declare function validateConversationMessage(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof ConversationMessageSchema>>;
export declare function validateCreateConversationRequest(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof CreateConversationRequestSchema>>;
export declare function validateUpdateConversationRequest(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof UpdateConversationRequestSchema>>;
export declare function validateAddMessageRequest(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof AddMessageRequestSchema>>;
export declare function validateLocalStorageData(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof LocalStorageConversationDataSchema>>;
export declare function validateConversationQuota(
  data: unknown,
): z.SafeParseReturnType<unknown, z.infer<typeof ConversationQuotaSchema>>;
export declare function sanitizeConversationTitle(title: string): string;
export declare function sanitizeMessageContent(content: string): string;
export declare function sanitizeTags(tags: string[]): string[];
export declare function createValidationError(
  code: ConversationErrorCode,
  message: string,
  zodError?: z.ZodError,
): Error;
export declare function formatZodError(error: z.ZodError): string;
export type ValidatedConversation = z.infer<typeof ConversationSchema>;
export type ValidatedConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type ValidatedCreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type ValidatedUpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
export type ValidatedAddMessageRequest = z.infer<typeof AddMessageRequestSchema>;
export type ValidatedLocalStorageData = z.infer<typeof LocalStorageConversationDataSchema>;
export type ValidatedConversationQuota = z.infer<typeof ConversationQuotaSchema>;
