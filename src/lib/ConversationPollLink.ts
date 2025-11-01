/**
 * ConversationPollLink.ts
 *
 * Utilitaire partagé pour lier un poll à sa conversation
 * Utilisé par PollCreator.tsx (sondages de dates) et ConversationProvider.tsx (formulaires)
 *
 * ARCHITECTURE CENTRÉE CONVERSATIONS (Session 1):
 * - Lien bidirectionnel Conversation ↔ Poll
 * - Conversation.pollId, pollType, pollStatus
 * - Poll.conversationId
 */

import {
  getConversation,
  updateConversation,
  createConversation,
} from "./storage/ConversationStorageSimple";
import {
  getPollBySlugOrId,
  updatePollConversationLink,
  getPollByConversationId,
  type Poll,
} from "./pollStorage";
import { logger } from "./logger";
import { ErrorFactory } from "./error-handling";
import type { Conversation } from "../types/conversation";

/**
 * Lie bidirectionnellement un poll à une conversation
 * Met à jour à la fois la conversation ET le poll
 *
 * @param conversationId - ID de la conversation
 * @param pollId - ID du poll
 * @param pollType - Type du poll ("date" ou "form")
 */
export function linkPollToConversationBidirectional(
  conversationId: string,
  pollId: string,
  pollType: "date" | "form",
): void {
  try {
    logger.info("🔗 Liaison bidirectionnelle conversation ↔ poll", "conversation", {
      conversationId,
      pollId,
      pollType,
    });

    // 1. Récupérer la conversation
    const conversation = getConversation(conversationId);
    if (!conversation) {
      throw ErrorFactory.storage(
        `Conversation not found: ${conversationId}`,
        "Conversation introuvable",
      );
    }

    // 2. Récupérer le poll
    const poll = getPollBySlugOrId(pollId);
    if (!poll) {
      throw ErrorFactory.storage(`Poll not found: ${pollId}`, "Sondage introuvable");
    }

    // 3. Mettre à jour la conversation avec les infos du poll
    updateConversation({
      ...conversation,
      pollId: poll.id,
      pollType: pollType,
      pollStatus: poll.status,
      metadata: {
        ...conversation.metadata,
        pollGenerated: true,
        pollTitle: poll.title,
      },
    });

    // 4. Mettre à jour le poll avec l'ID de la conversation
    updatePollConversationLink(poll.id, conversationId);

    logger.info("✅ Liaison bidirectionnelle réussie", "conversation", {
      conversationId,
      pollId,
    });
  } catch (error) {
    logger.error("❌ Erreur liaison bidirectionnelle", "conversation", {
      conversationId,
      pollId,
      error,
    });
    throw error;
  }
}

/**
 * Supprime le lien entre une conversation et son poll
 *
 * @param conversationId - ID de la conversation
 */
export function unlinkPollFromConversation(conversationId: string): void {
  try {
    const conversation = getConversation(conversationId);
    if (!conversation) {
      throw ErrorFactory.storage(
        `Conversation not found: ${conversationId}`,
        "Conversation introuvable",
      );
    }

    // Mettre à jour la conversation pour retirer le lien
    updateConversation({
      ...conversation,
      pollId: undefined,
      pollType: null,
      pollStatus: undefined,
      metadata: {
        ...conversation.metadata,
        pollGenerated: false,
        pollTitle: undefined,
      },
    });

    logger.info("✅ Lien poll supprimé de la conversation", "conversation", {
      conversationId,
    });
  } catch (error) {
    logger.error("❌ Erreur suppression lien poll", "conversation", {
      conversationId,
      error,
    });
    throw error;
  }
}

/**
 * Crée une conversation vide et lie un poll existant
 * Utilisé quand un poll est créé manuellement (sans IA)
 *
 * @param pollId - ID du poll
 * @param pollTitle - Titre du poll
 * @param pollType - Type du poll ("date" ou "form")
 * @returns ID de la conversation créée
 */
export function createConversationForPoll(
  pollId: string,
  pollTitle: string,
  pollType: "date" | "form",
): string {
  try {
    logger.info("🆕 Création conversation vide pour poll manuel", "conversation", {
      pollId,
      pollTitle,
      pollType,
    });

    // Créer une conversation vide
    const conversation = createConversation({
      title: pollTitle,
      firstMessage:
        pollType === "date" ? "Sondage de dates créé manuellement" : "Formulaire créé manuellement",
    });

    // Mettre à jour le status à "completed" car le poll est déjà créé
    updateConversation({
      ...conversation,
      status: "completed",
    });

    // Lier le poll à la conversation
    linkPollToConversationBidirectional(conversation.id, pollId, pollType);

    logger.info("✅ Conversation créée et liée au poll", "conversation", {
      conversationId: conversation.id,
      pollId,
    });

    // Déclencher un événement pour rafraîchir le Dashboard
    window.dispatchEvent(
      new CustomEvent("conversation-created", {
        detail: { conversationId: conversation.id },
      }),
    );

    return conversation.id;
  } catch (error) {
    logger.error("❌ Erreur création conversation pour poll", "conversation", {
      pollId,
      error,
    });
    throw error;
  }
}

/**
 * Récupère une conversation avec son poll enrichi
 *
 * @param conversationId - ID de la conversation
 * @returns Objet contenant la conversation et le poll (si existe)
 */
export function getConversationWithPoll(conversationId: string): {
  conversation: Conversation;
  poll: Poll | null;
} | null {
  try {
    const conversation = getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    // Récupérer le poll lié
    let poll: Poll | null = null;
    if (conversation.pollId) {
      poll = getPollBySlugOrId(conversation.pollId);
    } else {
      // Fallback: chercher par conversationId dans les polls
      poll = getPollByConversationId(conversationId);
    }

    return { conversation, poll };
  } catch (error) {
    logger.error("❌ Erreur récupération conversation + poll", "conversation", {
      conversationId,
      error,
    });
    return null;
  }
}
