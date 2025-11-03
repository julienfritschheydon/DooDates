/**
 * Quotas centralisés DooDates
 * 
 * ⚠️ SOURCE DE VÉRITÉ UNIQUE - Ne pas dupliquer ces valeurs ailleurs
 * 
 * Système de quotas freemium :
 * - Anonyme : Limité pour encourager l'inscription
 * - Authentifié : Généreux pour encourager l'adoption
 * 
 * Dernière mise à jour : 03 Nov 2025
 */

// ============================================================================
// QUOTAS CONVERSATIONS
// ============================================================================

/**
 * Nombre maximum de conversations IA
 * 
 * Une conversation = une session de création de sondage avec l'IA
 * Les modifications d'un sondage existant ne comptent pas comme nouvelle conversation
 */
export const CONVERSATION_QUOTAS = {
  /** Utilisateurs anonymes : 5 conversations */
  ANONYMOUS: 5,
  
  /** Utilisateurs authentifiés : 1000 conversations */
  AUTHENTICATED: 1000,
} as const;

// ============================================================================
// QUOTAS MESSAGES IA
// ============================================================================

/**
 * Nombre maximum de messages IA par conversation
 * 
 * Limite anti-spam pour éviter les conversations infinies
 * Réduit pour compenser l'usage facilité par reconnaissance vocale
 */
export const AI_MESSAGE_QUOTAS = {
  /** Utilisateurs anonymes : 10 messages par conversation */
  ANONYMOUS: 10,
  
  /** Utilisateurs authentifiés : 100 messages par mois */
  AUTHENTICATED: 100,
} as const;

// ============================================================================
// QUOTAS POLLS
// ============================================================================

/**
 * Nombre maximum de sondages créés par conversation
 * 
 * Empêche la création excessive de sondages dans une même conversation
 */
export const POLL_CREATION_QUOTAS = {
  /** Utilisateurs anonymes : 2 polls par conversation */
  ANONYMOUS: 2,
  
  /** Utilisateurs authentifiés : 5 polls par conversation */
  AUTHENTICATED: 5,
} as const;

// ============================================================================
// QUOTAS ANALYTICS IA
// ============================================================================

/**
 * Nombre maximum de requêtes analytics conversationnels par jour
 * 
 * Les insights automatiques ne comptent pas (1 seul appel par poll, mis en cache)
 */
export const ANALYTICS_QUOTAS = {
  /** Utilisateurs anonymes : 5 queries par jour */
  ANONYMOUS: 5,
  
  /** Utilisateurs authentifiés : 50 queries par jour */
  AUTHENTICATED: 50,
} as const;

// ============================================================================
// QUOTAS STOCKAGE
// ============================================================================

/**
 * Limites de stockage localStorage (approximatif)
 */
export const STORAGE_QUOTAS = {
  /** Utilisateurs anonymes : 50 MB */
  ANONYMOUS: 50,
  
  /** Utilisateurs authentifiés : 1000 MB (1 GB) */
  AUTHENTICATED: 1000,
} as const;

// ============================================================================
// RÉTENTION DES DONNÉES
// ============================================================================

/**
 * Durée de conservation des données avant auto-suppression
 */
export const RETENTION_DAYS = {
  /** Utilisateurs anonymes : 30 jours */
  ANONYMOUS: 30,
  
  /** Utilisateurs authentifiés : 365 jours (1 an) */
  AUTHENTICATED: 365,
} as const;

// ============================================================================
// COOLDOWNS ANTI-SPAM
// ============================================================================

/**
 * Délais minimum entre actions pour éviter le spam
 */
export const COOLDOWNS = {
  /** Délai minimum entre messages IA : 3 secondes */
  AI_MESSAGE: 3000,
  
  /** Délai minimum entre créations de poll : 5 secondes */
  POLL_CREATION: 5000,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Récupère les limites de conversations selon le type d'utilisateur
 */
export function getConversationLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? CONVERSATION_QUOTAS.AUTHENTICATED : CONVERSATION_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites de messages IA selon le type d'utilisateur
 */
export function getAiMessageLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? AI_MESSAGE_QUOTAS.AUTHENTICATED : AI_MESSAGE_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites de création de polls selon le type d'utilisateur
 */
export function getPollCreationLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? POLL_CREATION_QUOTAS.AUTHENTICATED : POLL_CREATION_QUOTAS.ANONYMOUS;
}

/**
 * Récupère les limites d'analytics selon le type d'utilisateur
 */
export function getAnalyticsLimit(isAuthenticated: boolean): number {
  return isAuthenticated ? ANALYTICS_QUOTAS.AUTHENTICATED : ANALYTICS_QUOTAS.ANONYMOUS;
}

/**
 * Récupère toutes les limites pour un type d'utilisateur
 */
export function getAllQuotas(isAuthenticated: boolean) {
  return {
    conversations: getConversationLimit(isAuthenticated),
    aiMessages: getAiMessageLimit(isAuthenticated),
    pollCreation: getPollCreationLimit(isAuthenticated),
    analytics: getAnalyticsLimit(isAuthenticated),
    storage: isAuthenticated ? STORAGE_QUOTAS.AUTHENTICATED : STORAGE_QUOTAS.ANONYMOUS,
    retentionDays: isAuthenticated ? RETENTION_DAYS.AUTHENTICATED : RETENTION_DAYS.ANONYMOUS,
  };
}

