/**
 * Supabase Conversation Storage
 * DooDates - Conversation History System
 *
 * Stores conversations and messages in Supabase for authenticated users
 * Provides synchronization across devices and persistence after logout
 */

import type { Conversation, ConversationMessage } from "../../types/conversation";
import { ConversationErrorFactory } from "../../types/conversation";
import { logger } from "../logger";
import { handleError, ErrorFactory, logError } from "../error-handling";
import {
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
  supabaseSelect,
  getSupabaseToken,
} from "../supabaseApi";

// Local cache for performance (in-memory)
const conversationCache = new Map<string, Conversation>();
const messageCache = new Map<string, ConversationMessage[]>();

// Export messageCache for cache invalidation when inconsistencies are detected
export { messageCache };

/**
 * Convert Supabase conversation row to Conversation type
 */
function fromSupabaseConversation(row: Record<string, unknown>): Conversation {
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
function toSupabaseConversation(conversation: Conversation): Record<string, unknown> {
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
function fromSupabaseMessage(row: Record<string, unknown>): ConversationMessage {
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
function toSupabaseMessage(message: ConversationMessage): Record<string, unknown> {
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
    const data = await supabaseSelect<Record<string, unknown>>(
      "conversations",
      {
        user_id: `eq.${userId}`,
        order: "updated_at.desc",
        select: "*",
      },
      { timeout: 10000 }, // 10s timeout
    );

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
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [${requestId}] 🗄️ ConversationStorageSupabase.getConversation DÉBUT`,
    {
      id,
      userId,
    },
  );

  // Check cache first
  const cached = conversationCache.get(id);
  console.log(`[${timestamp}] [${requestId}] 🗄️ Cache vérifié:`, {
    found: !!cached,
    cachedId: cached?.id,
    cachedUserId: cached?.userId,
    userIdMatch: cached?.userId === userId,
  });

  if (cached && cached.userId === userId) {
    console.log(`[${timestamp}] [${requestId}] ✅ Conversation trouvée dans cache`);
    return cached;
  }

  try {
    console.log(`[${timestamp}] [${requestId}] 🗄️ Requête Supabase...`);
    const data = await supabaseSelect<Record<string, unknown>>(
      "conversations",
      {
        id: `eq.${id}`,
        user_id: `eq.${userId}`,
        select: "*",
      },
      { timeout: 5000 },
    );

    console.log(`[${timestamp}] [${requestId}] 🗄️ Réponse Supabase:`, {
      found: !!data && data.length > 0,
      count: data?.length || 0,
    });

    if (!data || data.length === 0) {
      return null;
    }

    const conversation = fromSupabaseConversation(data[0]);
    conversationCache.set(conversation.id, conversation);

    return conversation;
  } catch (error: unknown) {
    // If not found, return null
    if (
      error instanceof Error &&
      (error.message?.includes("404") || error.message?.includes("not found"))
    ) {
      return null;
    }

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

    // Check token
    const token = getSupabaseToken();
    console.log(`[${timestamp}] [${requestId}] 🗄️ Auth token:`, {
      hasToken: !!token,
      userId,
    });

    if (!token) {
      throw ErrorFactory.auth("No authentication token found");
    }

    console.log(
      `[${timestamp}] [${requestId}] 🗄️ Data to insert:`,
      JSON.stringify(supabaseData, null, 2),
    );

    // INSERT using centralized API utility with timeout
    let data;
    try {
      data = await supabaseInsert("conversations", supabaseData, { timeout: 5000 });
    } catch (error: unknown) {
      const insertDuration = Date.now() - insertStartTime;

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
          error: error.message,
        },
      });
      throw detailedError;
    }

    const insertDuration = Date.now() - insertStartTime;
    console.log(`[${timestamp}] [${requestId}] 🗄️ Réponse Supabase reçue (${insertDuration}ms)`, {
      hasData: !!data,
    });

    if (!data) {
      const noDataError = ErrorFactory.storage(
        "Aucune donnée retournée par Supabase",
        "Échec de la création de la conversation",
      );
      logError(noDataError, {
        operation: "ConversationStorageSupabase.createConversation",
        metadata: {
          requestId,
          userId,
        },
      });
      throw noDataError;
    }

    console.log(`[${timestamp}] [${requestId}] 🗄️ Conversion réponse Supabase...`);
    const created = fromSupabaseConversation(data);
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

    const data = await supabaseUpdate<Record<string, unknown>>(
      "conversations",
      supabaseData,
      {
        id: `eq.${conversation.id}`,
        user_id: `eq.${userId}`,
      },
      { timeout: 5000 },
    );

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

    await supabaseDelete(
      "conversations",
      {
        id: `eq.${id}`,
        user_id: `eq.${userId}`,
      },
      { timeout: 5000 },
    );

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
    logger.debug("Messages chargés depuis cache mémoire", "conversation", {
      conversationId,
      messageCount: cached.length,
      userId,
    });
    return cached;
  }

  try {
    // Verify conversation ownership and get messages from JSONB column
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      logger.warn("Conversation non trouvée pour getMessages", "conversation", {
        conversationId,
        userId,
      });
      return [];
    }

    logger.debug("Chargement messages depuis Supabase", "conversation", {
      conversationId,
      userId,
      conversationMessageCount: conversation.messageCount,
    });

    // Messages are stored in the conversations.messages JSONB column
    const data = await supabaseSelect<Record<string, unknown>>(
      "conversations",
      {
        id: `eq.${conversationId}`,
        select: "messages",
      },
      { timeout: 5000 },
    );

    if (!data || data.length === 0) {
      logger.warn("Aucune donnée retournée par Supabase pour getMessages", "conversation", {
        conversationId,
        userId,
      });
      return [];
    }

    // Parse messages from JSONB (already in correct format)
    const rawMessages = data[0]?.messages;
    const messages = (rawMessages || []) as ConversationMessage[];

    logger.info("✅ Messages chargés depuis Supabase", "conversation", {
      conversationId,
      userId,
      messageCount: messages.length,
      expectedCount: conversation.messageCount,
      messagesMatch: messages.length === conversation.messageCount,
      messageIds: messages.map((m) => ({
        id: m.id,
        role: m.role,
        contentLength: m.content?.length || 0,
      })),
    });

    // Vérifier si le nombre de messages correspond au messageCount de la conversation
    if (conversation.messageCount > 0 && messages.length !== conversation.messageCount) {
      logger.error("⚠️ INCOHÉRENCE: Nombre de messages ne correspond pas", "conversation", {
        conversationId,
        userId,
        messagesInDB: messages.length,
        messageCountInConversation: conversation.messageCount,
        difference: conversation.messageCount - messages.length,
      });
    }

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
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${requestId}] 🗄️ ConversationStorageSupabase.saveMessages DÉBUT`, {
    conversationId,
    userId,
    messageCount: messages.length,
  });

  try {
    // Verify conversation ownership
    console.log(`[${timestamp}] [${requestId}] 🗄️ Vérification propriété conversation...`);
    const conversation = await getConversation(conversationId, userId);
    console.log(`[${timestamp}] [${requestId}] 🗄️ Conversation récupérée:`, {
      found: !!conversation,
      id: conversation?.id,
      userId: conversation?.userId,
      expectedUserId: userId,
      userIdMatch: conversation?.userId === userId,
    });

    if (!conversation) {
      logError(
        ErrorFactory.storage(
          "Conversation non trouvée",
          "La conversation demandée n'a pas été trouvée",
        ),
        { conversationId, requestId, timestamp },
      );
      throw ConversationErrorFactory.notFound(conversationId);
    }

    // Update messages in JSONB column (all at once)
    await supabaseUpdate(
      "conversations",
      {
        messages: messages,
        message_count: messages.length,
        updated_at: new Date().toISOString(),
      },
      {
        id: `eq.${conversationId}`,
        user_id: `eq.${userId}`,
      },
      { timeout: 8000 }, // Longer timeout for messages
    );

    messageCache.set(conversationId, messages);

    // Invalidate conversation cache to ensure messageCount is updated
    conversationCache.delete(conversationId);

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
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${requestId}] 🗄️ ConversationStorageSupabase.addMessages DÉBUT`, {
    conversationId,
    userId,
    messageCount: newMessages.length,
    messageIds: newMessages.map((m) => ({ id: m.id, role: m.role })),
  });

  try {
    // Invalidate cache to force reload from Supabase (avoid stale cache from other browsers)
    messageCache.delete(conversationId);
    console.log(`[${timestamp}] [${requestId}] 🗄️ Cache invalidé, rechargement depuis Supabase...`);

    // Get existing messages (will reload from Supabase since cache is cleared)
    console.log(`[${timestamp}] [${requestId}] 🗄️ Récupération messages existants...`);
    const existingMessages = await getMessages(conversationId, userId);
    console.log(`[${timestamp}] [${requestId}] 🗄️ Messages existants:`, {
      count: existingMessages.length,
    });

    // Verify message count matches conversation.messageCount to detect inconsistencies
    const conversation = await getConversation(conversationId, userId);
    if (
      conversation &&
      conversation.messageCount > 0 &&
      existingMessages.length !== conversation.messageCount
    ) {
      logger.warn(
        "⚠️ Incohérence détectée dans addMessages, messages peuvent être incomplets",
        "conversation",
        {
          conversationId,
          userId,
          existingMessagesCount: existingMessages.length,
          expectedCount: conversation.messageCount,
          difference: conversation.messageCount - existingMessages.length,
        },
      );
    }

    const allMessages = [...existingMessages, ...newMessages];
    console.log(`[${timestamp}] [${requestId}] 🗄️ Total messages après ajout:`, {
      count: allMessages.length,
    });

    // Save all messages
    console.log(`[${timestamp}] [${requestId}] 🗄️ Sauvegarde de tous les messages...`);
    await saveMessages(conversationId, allMessages, userId);

    // Invalidate conversation cache to ensure messageCount is updated
    conversationCache.delete(conversationId);

    console.log(`[${timestamp}] [${requestId}] ✅ ConversationStorageSupabase.addMessages TERMINÉ`);
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
    await supabaseUpdate(
      "conversations",
      {
        messages: [],
        message_count: 0,
        updated_at: new Date().toISOString(),
      },
      {
        id: `eq.${conversationId}`,
        user_id: `eq.${userId}`,
      },
      { timeout: 5000 },
    );

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
