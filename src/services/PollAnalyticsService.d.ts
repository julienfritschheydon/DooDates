/**
 * Poll Analytics Service - Analytics conversationnels via IA
 *
 * Permet d'interroger les résultats de sondages en langage naturel.
 * Réutilise l'infrastructure Gemini existante pour générer des insights.
 *
 * Fonctionnalités :
 * - Query en langage naturel ("Combien ont voté ?", "Option la plus populaire ?")
 * - Génération d'insights automatiques
 * - Détection de patterns et tendances
 * - Résumés intelligents
 * - Cache des résultats pour optimiser les coûts API
 */
export interface AnalyticsQuery {
  question: string;
  pollId: string;
  context?: "summary" | "detailed" | "trends";
}
export interface AnalyticsResponse {
  answer: string;
  confidence: number;
  insights?: string[];
  data?: Record<string, unknown>;
  cached?: boolean;
}
export interface AutoInsight {
  type: "trend" | "anomaly" | "summary" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  data?: Record<string, unknown>;
}
export declare class PollAnalyticsService {
  private static instance;
  private genAI;
  private model;
  private cache;
  private readonly CACHE_TTL;
  private readonly MAX_CACHE_SIZE;
  private constructor();
  static getInstance(): PollAnalyticsService;
  private initializeGemini;
  /**
   * Génère une clé de cache unique pour une query
   */
  private getCacheKey;
  /**
   * Récupère une réponse du cache si elle existe et n'est pas expirée
   */
  private getFromCache;
  /**
   * Ajoute une réponse au cache
   */
  private addToCache;
  /**
   * Construit le contexte de données pour l'IA
   */
  private buildPollContext;
  /**
   * Interroge les résultats d'un sondage en langage naturel
   */
  queryPoll(query: AnalyticsQuery): Promise<AnalyticsResponse>;
  /**
   * Génère automatiquement des insights pour un sondage
   */
  generateAutoInsights(pollId: string): Promise<AutoInsight[]>;
  /**
   * Vide le cache (utile pour forcer un refresh)
   */
  clearCache(pollId?: string): void;
  /**
   * Obtient des statistiques sur le cache
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
  };
}
export declare const pollAnalyticsService: PollAnalyticsService;
