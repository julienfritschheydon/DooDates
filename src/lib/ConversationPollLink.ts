/**
 * conversationPollLink.ts
 *
 * Utilitaire partagé pour lier un poll à sa conversation
 * Utilisé par PollCreator.tsx (sondages de dates) et ConversationProvider.tsx (formulaires)
 */

import { getConversation, updateConversation } from "./storage/ConversationStorageSimple";
import { logger } from "./logger";

/**
 * Lie un poll à sa conversation en mettant à jour les métadonnées
 * @param pollTitle - Titre du poll à lier
 * @returns Promise<void>
 */
export async function linkPollToConversation(pollTitle: string, pollId?: string): Promise<void> {
  try {
    console.log("🔗 linkPollToConversation appelé avec:", {
      pollTitle,
      pollId,
    });

    // Récupérer conversationId depuis l'URL (approche unifiée)
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversationId");

    console.log("🔍 URL actuelle:", window.location.search);
    console.log("🔍 conversationId trouvé:", conversationId);

    if (conversationId) {
      console.log("🔍 Recherche de la conversation:", conversationId);
      const conversation = getConversation(conversationId);
      console.log("🔍 Conversation trouvée:", !!conversation);

      if (conversation) {
        console.log("🔍 Mise à jour des métadonnées...");
        updateConversation({
          ...conversation,
          metadata: {
            ...conversation.metadata,
            pollGenerated: true,
            pollTitle: pollTitle,
            pollId: pollId, // Ajouter l'ID du poll pour une liaison fiable
          },
        });
        console.log("✅ Métadonnées mises à jour avec succès");
      } else {
        console.log("❌ Conversation non trouvée");
      }
    } else {
      console.log("❌ Aucun conversationId dans l'URL");
    }
  } catch (error) {
    logger.error("❌ Erreur liaison poll-conversation", error);
  }
}
