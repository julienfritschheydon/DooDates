/**
 * Service de tri unifié pour conversations et sondages
 * Gère le tri par favoris avec favorite_rank et tri par activité
 */
import { Conversation } from "../types/conversation";
export interface UnifiedItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  favorite_rank?: number;
  status?: string;
  messageCount?: number;
}
export type SortCriteria = "createdAt" | "updatedAt" | "title" | "activity";
export type SortOrder = "asc" | "desc";
export interface SortOptions {
  criteria: SortCriteria;
  order: SortOrder;
  favoriteFirst: boolean;
}
/**
 * Compare deux éléments unifiés avec gestion des favoris et favorite_rank
 */
export declare function compareUnifiedItems<T extends UnifiedItem>(
  a: T,
  b: T,
  options?: SortOptions,
): number;
/**
 * Trie un tableau de conversations avec gestion des favoris
 */
export declare function sortConversations(
  conversations: Conversation[],
  options?: Partial<SortOptions>,
): Conversation[];
/**
 * Met à jour le favorite_rank d'une conversation
 */
export declare function updateFavoriteRank(
  conversations: Conversation[],
  conversationId: string,
  newRank: number,
): Conversation[];
/**
 * Réordonne automatiquement les rangs des favoris
 */
export declare function reorderFavoriteRanks(conversations: Conversation[]): Conversation[];
/**
 * Obtient le prochain rang disponible pour un nouveau favori
 */
export declare function getNextFavoriteRank(conversations: Conversation[]): number;
/**
 * Valide la cohérence des rangs de favoris
 */
export declare function validateFavoriteRanks(conversations: Conversation[]): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
};
