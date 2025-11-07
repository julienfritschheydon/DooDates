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
/**
 * Nombre maximum de conversations IA
 *
 * Une conversation = une session de création de sondage avec l'IA
 * Les modifications d'un sondage existant ne comptent pas comme nouvelle conversation
 */
export declare const CONVERSATION_QUOTAS: {
    /** Utilisateurs anonymes : 5 conversations */
    readonly ANONYMOUS: 5;
    /** Utilisateurs authentifiés : 1000 conversations */
    readonly AUTHENTICATED: 1000;
};
/**
 * Nombre maximum de messages IA par conversation
 *
 * Limite anti-spam pour éviter les conversations infinies
 * Réduit pour compenser l'usage facilité par reconnaissance vocale
 */
export declare const AI_MESSAGE_QUOTAS: {
    /** Utilisateurs anonymes : 10 messages par conversation */
    readonly ANONYMOUS: 10;
    /** Utilisateurs authentifiés : 100 messages par mois */
    readonly AUTHENTICATED: 100;
};
/**
 * Nombre maximum de sondages créés par conversation
 *
 * Empêche la création excessive de sondages dans une même conversation
 */
export declare const POLL_CREATION_QUOTAS: {
    /** Utilisateurs anonymes : 2 polls par conversation */
    readonly ANONYMOUS: 2;
    /** Utilisateurs authentifiés : 5 polls par conversation */
    readonly AUTHENTICATED: 5;
};
/**
 * Nombre maximum de requêtes analytics conversationnels par jour
 *
 * Les insights automatiques ne comptent pas (1 seul appel par poll, mis en cache)
 */
export declare const ANALYTICS_QUOTAS: {
    /** Utilisateurs anonymes : 5 queries par jour */
    readonly ANONYMOUS: 5;
    /** Utilisateurs authentifiés : 50 queries par jour */
    readonly AUTHENTICATED: 50;
};
/**
 * Limites de stockage localStorage (approximatif)
 */
export declare const STORAGE_QUOTAS: {
    /** Utilisateurs anonymes : 50 MB */
    readonly ANONYMOUS: 50;
    /** Utilisateurs authentifiés : 1000 MB (1 GB) */
    readonly AUTHENTICATED: 1000;
};
/**
 * Durée de conservation des données avant auto-suppression
 */
export declare const RETENTION_DAYS: {
    /** Utilisateurs anonymes : 30 jours */
    readonly ANONYMOUS: 30;
    /** Utilisateurs authentifiés : 365 jours (1 an) */
    readonly AUTHENTICATED: 365;
};
/**
 * Délais minimum entre actions pour éviter le spam
 */
export declare const COOLDOWNS: {
    /** Délai minimum entre messages IA : 3 secondes */
    readonly AI_MESSAGE: 3000;
    /** Délai minimum entre créations de poll : 5 secondes */
    readonly POLL_CREATION: 5000;
};
/**
 * Récupère les limites de conversations selon le type d'utilisateur
 */
export declare function getConversationLimit(isAuthenticated: boolean): number;
/**
 * Récupère les limites de messages IA selon le type d'utilisateur
 */
export declare function getAiMessageLimit(isAuthenticated: boolean): number;
/**
 * Récupère les limites de création de polls selon le type d'utilisateur
 */
export declare function getPollCreationLimit(isAuthenticated: boolean): number;
/**
 * Récupère les limites d'analytics selon le type d'utilisateur
 */
export declare function getAnalyticsLimit(isAuthenticated: boolean): number;
/**
 * Récupère toutes les limites pour un type d'utilisateur
 */
export declare function getAllQuotas(isAuthenticated: boolean): {
    conversations: number;
    aiMessages: number;
    pollCreation: number;
    analytics: number;
    storage: 1000 | 50;
    retentionDays: 30 | 365;
};
