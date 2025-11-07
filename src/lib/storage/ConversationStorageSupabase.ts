/**
 * Supabase Conversation Storage
 * DooDates - Conversation History System
 *
 * Stores conversations and messages in Supabase for authenticated users
 * Provides synchronization across devices and persistence after logout
 */

import { supabase } from "../supabase";
import type { Conversation, ConversationMessage } from "../../types/conversation";
import { ConversationErrorFactory } from "../../types/conversation";
import { logger } from "../logger";
import { handleError, ErrorFactory, logError } from "../error-handling";

// Local cache for performance (in-memory)
const conversationCache = new Map<string, Conversation>();
const messageCache = new Map<string, ConversationMessage[]>();

/**
 * Convert Supabase conversation row to Conversation type
 */
function fromSupabaseConversation(row: any): Conversation {
  return {
    id: row.id,
    title: row.title,
    status: row.status as Conversation["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    firstMessage: row.first_message,
    messageCount: row.message_count || 0,
    relatedPollId: row.related_poll_id,
    pollId: row.related_poll_id, // Map related_poll_id to pollId
    pollType: row.metadata?.pollType || null,
    pollStatus: row.metadata?.pollStatus || undefined,
    isFavorite: row.is_favorite || false,
    favorite_rank: row.metadata?.favorite_rank,
    tags: row.tags || [],
    metadata: row.metadata || {},
    userId: row.user_id || undefined,
  };
}

/**
 * Convert Conversation to Supabase insert/update format
 */
function toSupabaseConversation(conversation: Conversation): any {
  return {
    id: conversation.id,
    user_id: conversation.userId || null,
    session_id: conversation.id, // Utiliser l'ID comme session_id
    title: conversation.title,
    first_message: conversation.firstMessage || null,
    message_count: conversation.messageCount || 0,
    messages: [], // JSONB vide par défaut
    context: conversation.metadata || {}, // Mapper metadata vers context
    poll_id: conversation.pollId || conversation.relatedPollId || null,
    related_poll_id: conversation.pollId || conversation.relatedPollId || null,
    is_favorite: conversation.isFavorite || false,
    status: conversation.status,
  };
}

/**
 * Convert Supabase message row to ConversationMessage type
 */
function fromSupabaseMessage(row: any): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as ConversationMessage["role"],
    content: row.content,
    timestamp: new Date(row.timestamp),
    metadata: row.metadata || {},
  };
}

/**
 * Convert ConversationMessage to Supabase insert format
 */
function toSupabaseMessage(message: ConversationMessage): any {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    role: message.role,
    content: message.content,
    metadata: message.metadata || {},
  };
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    const conversations = (data || []).map(fromSupabaseConversation);

    // Update cache
    conversations.forEach((conv) => {
      conversationCache.set(conv.id, conv);
    });

    logger.debug("Conversations chargées depuis Supabase", "conversation", {
      count: conversations.length,
      userId,
    });

    return conversations;
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "getConversations",
      },
      "Erreur lors de la récupération des conversations",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "getConversations",
    });

    throw processedError;
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string, userId: string): Promise<Conversation | null> {
  // Check cache first
  const cached = conversationCache.get(id);
  if (cached && cached.userId === userId) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw error;
    }

    if (!data) return null;

    const conversation = fromSupabaseConversation(data);
    conversationCache.set(conversation.id, conversation);

    return conversation;
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "getConversation",
      },
      "Erreur lors de la récupération de la conversation",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "getConversation",
      conversationId: id,
    });

    throw processedError;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
  userId: string,
): Promise<Conversation> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [${requestId}] 🗄️ ConversationStorageSupabase.createConversation DÉBUT`,
    {
      userId,
      title: conversation.title?.substring(0, 30),
    },
  );

  try {
    const now = new Date();
    const newConversation: Conversation = {
      ...conversation,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId,
    };
    console.log(`[${timestamp}] [${requestId}] 🗄️ Conversation créée localement:`, {
      id: newConversation.id,
    });

    console.log(`[${timestamp}] [${requestId}] 🗄️ Conversion vers format Supabase...`);
    const supabaseData = toSupabaseConversation(newConversation);
    console.log(`[${timestamp}] [${requestId}] 🗄️ Données Supabase préparées:`, {
      id: supabaseData.id,
      title: supabaseData.title,
      user_id: supabaseData.user_id,
    });

    console.log(`[${timestamp}] [${requestId}] 🗄️ Appel Supabase insert...`);
    const insertStartTime = Date.now();

    // Log actual request details
    console.log(`[${timestamp}] [${requestId}] 🗄️ Supabase URL:`, supabase["supabaseUrl"]);
    console.log(
      `[${timestamp}] [${requestId}] 🗄️ Data to insert:`,
      JSON.stringify(supabaseData, null, 2),
    );

    // INSERT and get response
    const { data, error } = await supabase.from("conversations").insert(supabaseData).select();
    const insertDuration = Date.now() - insertStartTime;
    console.log(`[${timestamp}] [${requestId}] 🗄️ Réponse Supabase reçue (${insertDuration}ms)`, {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    });

    if (error) {
      const detailedError = ErrorFactory.storage(
        "Erreur Supabase lors de l'insertion",
        error.message || "Impossible de créer la conversation",
      );
      logError(detailedError, {
        operation: "ConversationStorageSupabase.createConversation",
        metadata: {
          requestId,
          userId,
          duration: `${insertDuration}ms`,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        },
      });
      throw detailedError;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      const noDataError = ErrorFactory.storage(
        "Aucune donnée retournée par Supabase",
        "Échec de la création de la conversation",
      );
      logError(noDataError, {
        operation: "ConversationStorageSupabase.createConversation",
        metadata: {
          requestId,
          userId,
          hasData: !!data,
          isArray: Array.isArray(data),
          dataLength: Array.isArray(data) ? data.length : 0,
        },
      });
      throw noDataError;
    }

    console.log(`[${timestamp}] [${requestId}] 🗄️ Conversion réponse Supabase...`);
    const created = fromSupabaseConversation(data[0]);
    console.log(`[${timestamp}] [${requestId}] 🗄️ Mise en cache...`);
    conversationCache.set(created.id, created);

    console.log(
      `[${timestamp}] [${requestId}] ✅ ConversationStorageSupabase.createConversation TERMINÉ`,
      {
        conversationId: created.id,
        userId,
      },
    );
    logger.info("Conversation créée dans Supabase", "conversation", {
      conversationId: created.id,
      userId,
    });

    return created;
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "createConversation",
      },
      "Erreur lors de la création de la conversation",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "createConversation",
    });

    throw processedError;
  }
}

/**
 * Update an existing conversation
 */
export async function updateConversation(
  conversation: Conversation,
  userId: string,
): Promise<Conversation> {
  try {
    // Verify ownership
    if (conversation.userId !== userId) {
      const authError = ErrorFactory.auth(
        "Vous n'avez pas l'autorisation de modifier cette conversation",
      );
      throw authError;
    }

    const supabaseData = toSupabaseConversation({
      ...conversation,
      updatedAt: new Date(),
    });

    const { data, error } = await supabase
      .from("conversations")
      .update(supabaseData)
      .eq("id", conversation.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const updated = fromSupabaseConversation(data);
    conversationCache.set(updated.id, updated);

    logger.debug("Conversation mise à jour dans Supabase", "conversation", {
      conversationId: updated.id,
      userId,
    });

    return updated;
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "updateConversation",
      },
      "Erreur lors de la mise à jour de la conversation",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "updateConversation",
      conversationId: conversation.id,
    });

    throw processedError;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string, userId: string): Promise<void> {
  try {
    // Delete messages first (CASCADE should handle this, but explicit is better)
    await deleteMessages(id, userId);

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    conversationCache.delete(id);
    messageCache.delete(id);

    logger.info("Conversation supprimée de Supabase", "conversation", {
      conversationId: id,
      userId,
    });
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "deleteConversation",
      },
      "Erreur lors de la suppression de la conversation",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "deleteConversation",
      conversationId: id,
    });

    throw processedError;
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  userId: string,
): Promise<ConversationMessage[]> {
  // Check cache first
  const cached = messageCache.get(conversationId);
  if (cached) {
    return cached;
  }

  try {
    // Verify conversation ownership and get messages from JSONB column
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      return [];
    }

    // Messages are stored in the conversations.messages JSONB column
    const { data, error } = await supabase
      .from("conversations")
      .select("messages")
      .eq("id", conversationId)
      .single();

    if (error) {
      throw error;
    }

    // Parse messages from JSONB (already in correct format)
    const messages = (data?.messages || []) as ConversationMessage[];
    messageCache.set(conversationId, messages);

    return messages;
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "getMessages",
      },
      "Erreur lors de la récupération des messages",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "getMessages",
      conversationId,
    });

    throw processedError;
  }
}

/**
 * Save messages for a conversation (replace all)
 */
export async function saveMessages(
  conversationId: string,
  messages: ConversationMessage[],
  userId: string,
): Promise<void> {
  try {
    // Verify conversation ownership
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      throw ConversationErrorFactory.notFound(conversationId);
    }

    // Update messages in JSONB column (all at once)
    const { error } = await supabase
      .from("conversations")
      .update({
        messages: messages,
        message_count: messages.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    messageCache.set(conversationId, messages);

    logger.debug("Messages sauvegardés dans Supabase", "conversation", {
      conversationId,
      messageCount: messages.length,
      userId,
    });
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "saveMessages",
      },
      "Erreur lors de la sauvegarde des messages",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "saveMessages",
      conversationId,
    });

    throw processedError;
  }
}

/**
 * Add messages to a conversation (append)
 */
export async function addMessages(
  conversationId: string,
  newMessages: ConversationMessage[],
  userId: string,
): Promise<void> {
  try {
    // Get existing messages
    const existingMessages = await getMessages(conversationId, userId);
    const allMessages = [...existingMessages, ...newMessages];

    // Save all messages
    await saveMessages(conversationId, allMessages, userId);
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "addMessages",
      },
      "Erreur lors de l'ajout des messages",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "addMessages",
      conversationId,
    });

    throw processedError;
  }
}

/**
 * Delete messages for a conversation
 * (Now just clears the JSONB messages array)
 */
async function deleteMessages(conversationId: string, userId: string): Promise<void> {
  try {
    // Verify conversation ownership
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      return; // Conversation doesn't exist or not owned by user
    }

    // Clear messages in JSONB column
    const { error } = await supabase
      .from("conversations")
      .update({
        messages: [],
        message_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    messageCache.delete(conversationId);
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "ConversationStorageSupabase",
        operation: "deleteMessages",
      },
      "Erreur lors de la suppression des messages",
    );

    logError(processedError, {
      component: "ConversationStorageSupabase",
      operation: "deleteMessages",
      conversationId,
    });

    throw processedError;
  }
}

/**
 * Get conversation with its messages
 */
export async function getConversationWithMessages(
  id: string,
  userId: string,
): Promise<{ conversation: Conversation; messages: ConversationMessage[] } | null> {
  try {
    const conversation = await getConversation(id, userId);
    if (!conversation) {
      return null;
    }

    const messages = await getMessages(id, userId);
    return { conversation, messages };
  } catch (error) {
    logError(
      ErrorFactory.storage(
        "Erreur lors de la récupération de la conversation avec messages",
        "Erreur lors du chargement",
      ),
      {
        component: "ConversationStorageSupabase",
        operation: "getConversationWithMessages",
        conversationId: id,
      },
    );
    return null;
  }
}

/**
 * Clear local cache
 */
export function clearCache(): void {
  conversationCache.clear();
  messageCache.clear();
}
