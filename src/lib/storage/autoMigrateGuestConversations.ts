/**
 * Auto-migrate guest conversations to Supabase when user logs in
 * DooDates - Conversation History System
 */

import * as ConversationStorage from "./ConversationStorageSimple";
import { logger } from "../logger";
import { handleError, ErrorFactory, logError } from "../error-handling";
import type { Conversation, ConversationMessage } from "../../types/conversation";

const MIGRATION_FLAG_KEY = "doodates_guest_conversations_migrated";

/**
 * Check if guest conversations have already been migrated for this user
 */
export function hasMigratedGuestConversations(userId: string): boolean {
  try {
    const migratedUsers = JSON.parse(
      localStorage.getItem(MIGRATION_FLAG_KEY) || "[]",
    ) as string[];
    return migratedUsers.includes(userId);
  } catch {
    return false;
  }
}

/**
 * Mark guest conversations as migrated for this user
 */
function markAsMigrated(userId: string): void {
  try {
    const migratedUsers = JSON.parse(
      localStorage.getItem(MIGRATION_FLAG_KEY) || "[]",
    ) as string[];
    if (!migratedUsers.includes(userId)) {
      migratedUsers.push(userId);
      localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(migratedUsers));
    }
  } catch (error) {
    logger.error("Erreur lors du marquage de la migration", "conversation", error);
  }
}

/**
 * Migrate guest conversations to Supabase for the logged-in user
 */
export async function migrateGuestConversations(userId: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  // Check if already migrated
  if (hasMigratedGuestConversations(userId)) {
    logger.debug("Conversations guest déjà migrées pour cet utilisateur", "conversation", {
      userId,
    });
    return { success: true, migratedCount: 0, errors: [] };
  }

  try {
    // Get all conversations from localStorage
    const allConversations = ConversationStorage.getConversations();
    
    // Filter guest conversations (userId === null, undefined, or "guest")
    const guestConversations = allConversations.filter(
      (conv) =>
        !conv.userId || conv.userId === "guest" || conv.userId === null || conv.userId === undefined,
    );

    if (guestConversations.length === 0) {
      logger.debug("Aucune conversation guest à migrer", "conversation", { userId });
      markAsMigrated(userId);
      return { success: true, migratedCount: 0, errors: [] };
    }

    logger.info("Début migration conversations guest", "conversation", {
      userId,
      count: guestConversations.length,
    });

    const errors: string[] = [];
    let migratedCount = 0;

    // Import Supabase storage
    const {
      createConversation: createSupabaseConversation,
      addMessages: addSupabaseMessages,
    } = await import("./ConversationStorageSupabase");

    // Migrate each conversation
    for (const conversation of guestConversations) {
      try {
        // Get messages for this conversation first
        const messages = ConversationStorage.getMessages(conversation.id);

        // Create conversation in Supabase with new UUID (Supabase requires UUID)
        // Keep old ID in metadata for reference
        const { createConversation: createSupabaseConversation } = await import(
          "./ConversationStorageSupabase"
        );
        
        const migratedConversation = await createSupabaseConversation(
          {
            ...conversation,
            userId,
            metadata: {
              ...conversation.metadata,
              originalLocalId: conversation.id, // Keep reference to original ID
            } as any, // Allow additional metadata fields
          },
          userId,
        );

        // Save messages to Supabase if any
        if (messages.length > 0) {
          // Update conversationId in messages to point to new Supabase conversation
          const migratedMessages = messages.map((msg) => ({
            ...msg,
            conversationId: migratedConversation.id,
          }));

          const { addMessages: addSupabaseMessages } = await import(
            "./ConversationStorageSupabase"
          );
          await addSupabaseMessages(migratedConversation.id, migratedMessages, userId);
        }

        // Update local conversation to mark as migrated and link to Supabase version
        ConversationStorage.updateConversation({
          ...conversation,
          userId,
          metadata: {
            ...conversation.metadata,
            supabaseId: migratedConversation.id, // Link to Supabase version
          } as any, // Allow additional metadata fields
        });

        migratedCount++;
        logger.debug("Conversation migrée", "conversation", {
          conversationId: conversation.id,
          messageCount: messages.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Erreur migration conversation ${conversation.id}: ${errorMessage}`);
        logger.error("Erreur lors de la migration d'une conversation", "conversation", {
          conversationId: conversation.id,
          error,
        });
      }
    }

    // Mark as migrated if at least some conversations were migrated
    if (migratedCount > 0) {
      markAsMigrated(userId);
    }

    logger.info("Migration conversations guest terminée", "conversation", {
      userId,
      migratedCount,
      totalCount: guestConversations.length,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      migratedCount,
      errors,
    };
  } catch (error) {
    const processedError = handleError(
      error,
      {
        component: "autoMigrateGuestConversations",
        operation: "migrateGuestConversations",
      },
      "Erreur lors de la migration des conversations guest",
    );

    logError(processedError, {
      component: "autoMigrateGuestConversations",
      operation: "migrateGuestConversations",
    });

    return {
      success: false,
      migratedCount: 0,
      errors: [processedError.message],
    };
  }
}

