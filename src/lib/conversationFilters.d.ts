/**
 * conversationFilters.ts
 *
 * Helpers de filtrage pour l'architecture centrée conversations
 * Session 1 - Architecture Centrée Conversations
 */
import type { Conversation } from "../types/conversation";
/**
 * Type de filtre pour les conversations
 */
export type ConversationFilter = "all" | "with-poll" | "with-form" | "no-poll" | "draft" | "published";
/**
 * Conversation enrichie avec les statistiques du poll lié
 */
export interface EnrichedConversation extends Conversation {
    participants_count?: number;
    votes_count?: number;
    topDates?: {
        date: string;
        score: number;
    }[];
}
/**
 * Filtre les conversations selon le critère spécifié
 *
 * @param conversations - Liste des conversations
 * @param filter - Type de filtre à appliquer
 * @returns Liste filtrée des conversations
 */
export declare function filterConversations(conversations: Conversation[], filter: ConversationFilter): Conversation[];
/**
 * Enrichit une conversation avec les statistiques de son poll lié
 *
 * @param conversation - Conversation à enrichir
 * @returns Conversation enrichie avec les stats
 */
export declare function enrichConversationWithStats(conversation: Conversation): EnrichedConversation;
/**
 * Enrichit une liste de conversations avec leurs statistiques
 *
 * @param conversations - Liste des conversations
 * @returns Liste des conversations enrichies
 */
export declare function enrichConversationsWithStats(conversations: Conversation[]): EnrichedConversation[];
/**
 * Filtre ET enrichit les conversations
 * Fonction utilitaire combinant les deux opérations
 *
 * @param conversations - Liste des conversations
 * @param filter - Type de filtre à appliquer
 * @returns Liste filtrée et enrichie des conversations
 */
export declare function filterAndEnrichConversations(conversations: Conversation[], filter: ConversationFilter): EnrichedConversation[];
