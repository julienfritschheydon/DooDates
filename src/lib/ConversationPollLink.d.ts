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
import { type Poll } from "./pollStorage";
import type { Conversation } from "../types/conversation";
/**
 * Lie bidirectionnellement un poll à une conversation
 * Met à jour à la fois la conversation ET le poll
 *
 * @param conversationId - ID de la conversation
 * @param pollId - ID du poll
 * @param pollType - Type du poll ("date" ou "form")
 */
export declare function linkPollToConversationBidirectional(conversationId: string, pollId: string, pollType: "date" | "form"): void;
/**
 * Supprime le lien entre une conversation et son poll
 *
 * @param conversationId - ID de la conversation
 */
export declare function unlinkPollFromConversation(conversationId: string): void;
/**
 * Crée une conversation vide et lie un poll existant
 * Utilisé quand un poll est créé manuellement (sans IA)
 *
 * @param pollId - ID du poll
 * @param pollTitle - Titre du poll
 * @param pollType - Type du poll ("date" ou "form")
 * @returns ID de la conversation créée ou existante
 */
export declare function createConversationForPoll(pollId: string, pollTitle: string, pollType: "date" | "form"): string;
/**
 * Récupère une conversation avec son poll enrichi
 *
 * @param conversationId - ID de la conversation
 * @returns Objet contenant la conversation et le poll (si existe)
 */
export declare function getConversationWithPoll(conversationId: string): {
    conversation: Conversation;
    poll: Poll | null;
} | null;
