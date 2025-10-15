import { logError, ErrorFactory } from '../error-handling';
import { hasWindow } from './storageUtils';

/**
 * Lifetime statistics storage for quota management
 * DooDates - Anti-cheat quota system
 */

export type ContentType = 'conversations' | 'polls';

interface LifetimeStats {
  conversations: {
    totalCreated: number;
  };
  polls: {
    totalCreated: number;
  };
}

const STORAGE_KEY = 'doodates.lifetime.stats';
const DEFAULT_STATS: LifetimeStats = {
  conversations: { totalCreated: 0 },
  polls: { totalCreated: 0 }
};

/**
 * Get lifetime count for a content type
 */
export function getLifetimeCount(type: ContentType): number {
  try {
    if (!hasWindow()) return 0;
    
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stats: LifetimeStats = raw ? JSON.parse(raw) : DEFAULT_STATS;
    
    return stats[type]?.totalCreated || 0;
  } catch (error) {
    logError(ErrorFactory.storage(
      `Failed to get lifetime count for ${type}`,
      `Échec de lecture du compteur lifetime pour ${type}`
    ), {
      component: 'statsStorage',
      operation: 'getLifetimeCount',
      metadata: { type, originalError: error }
    });
    return 0;
  }
}

/**
 * Increment lifetime count for a content type
 * Called ONLY on successful creation
 */
export function incrementLifetimeCount(type: ContentType): void {
  try {
    if (!hasWindow()) return;
    
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stats: LifetimeStats = raw ? JSON.parse(raw) : DEFAULT_STATS;
    
    // Atomic increment
    stats[type].totalCreated += 1;
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    logError(ErrorFactory.storage(
      `Failed to increment lifetime count for ${type}`,
      `Échec d'incrémentation du compteur lifetime pour ${type}`
    ), {
      component: 'statsStorage',
      operation: 'incrementLifetimeCount',
      metadata: { type, originalError: error }
    });
  }
}

/**
 * Reset lifetime count for a content type
 * ADMIN ONLY - for testing or data cleanup
 */
export function resetLifetimeCount(type: ContentType): void {
  try {
    if (!hasWindow()) return;
    
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stats: LifetimeStats = raw ? JSON.parse(raw) : DEFAULT_STATS;
    
    stats[type].totalCreated = 0;
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    logError(ErrorFactory.storage(
      `Failed to reset lifetime count for ${type}`,
      `Échec de remise à zéro du compteur lifetime pour ${type}`
    ), {
      component: 'statsStorage',
      operation: 'resetLifetimeCount',
      metadata: { type, originalError: error }
    });
  }
}

/**
 * Get all lifetime stats
 */
export function getAllLifetimeStats(): LifetimeStats {
  try {
    if (!hasWindow()) return DEFAULT_STATS;
    
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STATS;
  } catch (error) {
    logError(ErrorFactory.storage(
      'Failed to get all lifetime stats',
      'Échec de lecture de toutes les statistiques lifetime'
    ), {
      component: 'statsStorage',
      operation: 'getAllLifetimeStats',
      metadata: { originalError: error }
    });
    return DEFAULT_STATS;
  }
}

/**
 * Check if creation is allowed based on quota
 */
export function canCreate(type: ContentType, limit: number): boolean {
  const currentCount = getLifetimeCount(type);
  return currentCount < limit;
}

/**
 * Get quota usage info for UI display
 */
export function getQuotaUsage(type: ContentType, limit: number) {
  const totalCreated = getLifetimeCount(type);
  
  return {
    totalCreated,
    limit,
    remaining: Math.max(0, limit - totalCreated),
    isAtLimit: totalCreated >= limit,
    usagePercentage: Math.min(100, (totalCreated / limit) * 100)
  };
}
