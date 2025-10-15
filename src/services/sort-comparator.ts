/**
 * Service de tri unifié pour conversations et sondages
 * Gère le tri par favoris avec favorite_rank et tri par activité
 */

import { Conversation } from '../types/conversation';

// ============================================================================
// TYPES
// ============================================================================

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

export type SortCriteria = 'createdAt' | 'updatedAt' | 'title' | 'activity';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  criteria: SortCriteria;
  order: SortOrder;
  favoriteFirst: boolean;
}

// ============================================================================
// CORE SORTING FUNCTION
// ============================================================================

/**
 * Compare deux éléments unifiés avec gestion des favoris et favorite_rank
 */
export function compareUnifiedItems<T extends UnifiedItem>(
  a: T,
  b: T,
  options: SortOptions = {
    criteria: 'updatedAt',
    order: 'desc',
    favoriteFirst: true
  }
): number {
  const { criteria, order, favoriteFirst } = options;

  // 1. Tri par favoris en premier si activé
  if (favoriteFirst) {
    // Les favoris viennent toujours en premier
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Si les deux sont favoris, trier par favorite_rank
    if (a.isFavorite && b.isFavorite) {
      const rankA = a.favorite_rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.favorite_rank ?? Number.MAX_SAFE_INTEGER;
      
      if (rankA !== rankB) {
        return rankA - rankB; // Ordre croissant pour les rangs
      }
      // Si même rang, continuer avec le critère principal
    }
  }

  // 2. Tri par critère principal
  let comparison = 0;

  switch (criteria) {
    case 'createdAt':
      comparison = compareDate(a.createdAt, b.createdAt);
      break;
    
    case 'updatedAt':
      comparison = compareDate(a.updatedAt, b.updatedAt);
      break;
    
    case 'title':
      comparison = a.title.localeCompare(b.title, 'fr', { 
        sensitivity: 'base',
        numeric: true 
      });
      break;
    
    case 'activity':
      // Tri par activité : updatedAt + messageCount
      const activityScoreA = getActivityScore(a);
      const activityScoreB = getActivityScore(b);
      comparison = activityScoreA - activityScoreB;
      break;
    
    default:
      comparison = compareDate(a.updatedAt, b.updatedAt);
  }

  // 3. Appliquer l'ordre (asc/desc)
  return order === 'asc' ? comparison : -comparison;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compare deux dates
 */
function compareDate(dateA: Date, dateB: Date): number {
  return dateA.getTime() - dateB.getTime();
}

/**
 * Calcule un score d'activité basé sur updatedAt et messageCount
 */
function getActivityScore(item: UnifiedItem): number {
  const timeScore = item.updatedAt.getTime();
  const messageBonus = (item.messageCount || 0) * 1000 * 60 * 60; // 1h par message
  return timeScore + messageBonus;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Trie un tableau de conversations avec gestion des favoris
 */
export function sortConversations(
  conversations: Conversation[],
  options: Partial<SortOptions> = {}
): Conversation[] {
  const sortOptions: SortOptions = {
    criteria: 'updatedAt',
    order: 'desc',
    favoriteFirst: true,
    ...options
  };

  return [...conversations].sort((a, b) => 
    compareUnifiedItems(a, b, sortOptions)
  );
}

/**
 * Met à jour le favorite_rank d'une conversation
 */
export function updateFavoriteRank(
  conversations: Conversation[],
  conversationId: string,
  newRank: number
): Conversation[] {
  return conversations.map(conv => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        favorite_rank: newRank,
        isFavorite: true // S'assurer que c'est marqué comme favori
      };
    }
    return conv;
  });
}

/**
 * Réordonne automatiquement les rangs des favoris
 */
export function reorderFavoriteRanks(conversations: Conversation[]): Conversation[] {
  const favorites = conversations.filter(conv => conv.isFavorite);
  const nonFavorites = conversations.filter(conv => !conv.isFavorite);

  // Trier les favoris par leur rang actuel, puis par updatedAt
  favorites.sort((a, b) => {
    const rankA = a.favorite_rank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.favorite_rank ?? Number.MAX_SAFE_INTEGER;
    
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    return compareDate(b.updatedAt, a.updatedAt); // Plus récent en premier
  });

  // Réassigner les rangs de manière séquentielle
  const reorderedFavorites = favorites.map((conv, index) => ({
    ...conv,
    favorite_rank: index + 1
  }));

  return [...reorderedFavorites, ...nonFavorites];
}

/**
 * Obtient le prochain rang disponible pour un nouveau favori
 */
export function getNextFavoriteRank(conversations: Conversation[]): number {
  const favoriteRanks = conversations
    .filter(conv => conv.isFavorite && conv.favorite_rank !== undefined)
    .map(conv => conv.favorite_rank!)
    .sort((a, b) => a - b);

  if (favoriteRanks.length === 0) {
    return 1;
  }

  return Math.max(...favoriteRanks) + 1;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valide la cohérence des rangs de favoris
 */
export function validateFavoriteRanks(conversations: Conversation[]): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  const favorites = conversations.filter(conv => conv.isFavorite);
  const ranks = favorites
    .map(conv => conv.favorite_rank)
    .filter((rank): rank is number => rank !== undefined)
    .sort((a, b) => a - b);

  // Vérifier les doublons
  const duplicates = ranks.filter((rank, index) => ranks.indexOf(rank) !== index);
  if (duplicates.length > 0) {
    errors.push(`Rangs dupliqués détectés: ${duplicates.join(', ')}`);
    suggestions.push('Utiliser reorderFavoriteRanks() pour corriger');
  }

  // Vérifier les trous dans la séquence
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i + 1] - ranks[i] > 1) {
      suggestions.push(`Trou détecté entre les rangs ${ranks[i]} et ${ranks[i + 1]}`);
    }
  }

  // Vérifier les favoris sans rang
  const favoritesWithoutRank = favorites.filter(conv => conv.favorite_rank === undefined);
  if (favoritesWithoutRank.length > 0) {
    errors.push(`${favoritesWithoutRank.length} favoris sans rang détectés`);
    suggestions.push('Assigner des rangs avec getNextFavoriteRank()');
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}
