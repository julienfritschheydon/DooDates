/**
 * conversationFilters.ts
 *
 * Helpers de filtrage pour l'architecture centrée conversations
 * Session 1 - Architecture Centrée Conversations
 */

import type { Conversation } from "../types/conversation";
import { getPollBySlugOrId, getFormResponses, type Poll } from "./pollStorage";
import { getAllVotes } from "./pollStorage";

/**
 * Type de filtre pour les conversations
 */
export type ConversationFilter =
  | "all"
  | "with-poll"
  | "with-form"
  | "no-poll"
  | "draft"
  | "published";

/**
 * Conversation enrichie avec les statistiques du poll lié
 */
export interface EnrichedConversation extends Conversation {
  // Stats du poll lié
  participants_count?: number;
  votes_count?: number;
  topDates?: { date: string; score: number }[];
}

/**
 * Filtre les conversations selon le critère spécifié
 *
 * @param conversations - Liste des conversations
 * @param filter - Type de filtre à appliquer
 * @returns Liste filtrée des conversations
 */
export function filterConversations(
  conversations: Conversation[],
  filter: ConversationFilter,
): Conversation[] {
  switch (filter) {
    case "all":
      return conversations;

    case "with-poll":
      return conversations.filter((c) => c.pollType === "date");

    case "with-form":
      return conversations.filter((c) => c.pollType === "form");

    case "no-poll":
      return conversations.filter((c) => !c.pollType || c.pollType === null);

    case "draft":
      return conversations.filter((c) => c.pollStatus === "draft");

    case "published":
      return conversations.filter((c) => c.pollStatus === "active" || c.pollStatus === "closed");

    default:
      return conversations;
  }
}

/**
 * Enrichit une conversation avec les statistiques de son poll lié
 *
 * @param conversation - Conversation à enrichir
 * @returns Conversation enrichie avec les stats
 */
export function enrichConversationWithStats(conversation: Conversation): EnrichedConversation {
  const enriched: EnrichedConversation = { ...conversation };

  // Si pas de poll lié, retourner tel quel
  if (!conversation.pollId) {
    return enriched;
  }

  // Récupérer le poll
  const poll = getPollBySlugOrId(conversation.pollId);
  if (!poll) {
    return enriched;
  }

  // Calculer les stats selon le type de poll
  if (poll.type === "form") {
    // Stats pour les formulaires
    const responses = getFormResponses(poll.id);
    const uniqueRespondents = new Set(responses.map((r) => r.respondentName || `anon-${r.id}`))
      .size;

    enriched.participants_count = uniqueRespondents;
    enriched.votes_count = responses.length;
  } else {
    // Stats pour les sondages de dates
    const votes = getAllVotes().filter((v) => v.poll_id === poll.id);
    const uniqueVoters = new Set(votes.map((v) => v.voter_email || v.voter_name || `anon-${v.id}`))
      .size;

    enriched.participants_count = uniqueVoters;
    enriched.votes_count = votes.length;

    // Calculer les top dates si des votes existent
    if (votes.length > 0 && poll.dates && poll.dates.length > 0) {
      const dateScores = poll.dates.map((dateStr, index) => {
        const optionId = `option-${index}`;
        let score = 0;

        votes.forEach((vote) => {
          const selection = vote.vote_data?.[optionId] || vote.selections?.[optionId];
          if (selection === "yes") score += 3;
          else if (selection === "maybe") score += 1;
        });

        return { date: dateStr, score };
      });

      // Trier par score et prendre les 2 meilleures
      enriched.topDates = dateScores
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
    }
  }

  return enriched;
}

/**
 * Enrichit une liste de conversations avec leurs statistiques
 *
 * @param conversations - Liste des conversations
 * @returns Liste des conversations enrichies
 */
export function enrichConversationsWithStats(
  conversations: Conversation[],
): EnrichedConversation[] {
  return conversations.map(enrichConversationWithStats);
}

/**
 * Filtre ET enrichit les conversations
 * Fonction utilitaire combinant les deux opérations
 *
 * @param conversations - Liste des conversations
 * @param filter - Type de filtre à appliquer
 * @returns Liste filtrée et enrichie des conversations
 */
export function filterAndEnrichConversations(
  conversations: Conversation[],
  filter: ConversationFilter,
): EnrichedConversation[] {
  const filtered = filterConversations(conversations, filter);
  return enrichConversationsWithStats(filtered);
}
