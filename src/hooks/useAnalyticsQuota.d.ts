/**
 * Hook pour gérer les quotas d'analytics conversationnels
 *
 * Limites freemium :
 * - Utilisateurs anonymes : 5 queries par jour
 * - Utilisateurs authentifiés : 50 queries par jour
 *
 * Les insights automatiques ne comptent pas dans le quota
 * (1 seul appel par poll, mis en cache)
 */
interface AnalyticsQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  canQuery: boolean;
}
export declare function useAnalyticsQuota(): {
  quota: AnalyticsQuota;
  incrementQuota: () => boolean;
  checkQuota: () => boolean;
  resetQuota: () => void;
  getQuotaMessage: () => string;
};
export {};
