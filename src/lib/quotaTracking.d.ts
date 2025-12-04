/**
 * Système de tracking des crédits consommés (créations et actions IA)
 *
 * Les crédits consommés ne se remboursent jamais (sauf reset mensuel pour auth users)
 * - 1 conversation créée = 1 crédit consommé
 * - 1 poll créé = 1 crédit consommé
 * - 1 message IA = 1 crédit consommé
 * - 1 query analytics IA = 1 crédit consommé
 * - 1 simulation complète = 5 crédits consommés
 *
 * Même si l'utilisateur supprime ses conversations/polls, les crédits restent consommés.
 */
export type CreditActionType =
  | "conversation_created"
  | "poll_created"
  | "ai_message"
  | "analytics_query"
  | "simulation"
  | "other";
export interface CreditJournalEntry {
  id: string;
  timestamp: string;
  action: CreditActionType;
  credits: number;
  userId: string;
  metadata?: {
    conversationId?: string;
    pollId?: string;
    pollType?: "date" | "form" | "quizz" | "availability"; // Obligatoire pour action = "poll_created"
    simulationId?: string;
    analyticsQuery?: string;
    [key: string]: unknown;
  };
}
interface QuotaConsumedData {
  conversationsCreated: number;
  pollsCreated: number;
  // Compteurs séparés par type de poll
  datePollsCreated: number;
  formPollsCreated: number;
  quizzCreated: number;
  availabilityPollsCreated: number;
  aiMessages: number;
  analyticsQueries: number;
  simulations: number;
  totalCreditsConsumed: number;
  subscriptionStartDate?: string;
  lastResetDate?: string;
  userId: string;
}
/**
 * Obtenir les données de quota consommé pour l'utilisateur actuel
 */
export declare function getQuotaConsumed(
  userId: string | null | undefined,
): Promise<QuotaConsumedData>;
/**
 * Obtenir le journal de consommation pour un utilisateur
 */
export declare function getConsumptionJournal(
  userId: string | null | undefined,
  limit?: number,
): Promise<CreditJournalEntry[]>;
/**
 * Incrémenter le compteur de conversations créées
 */
export declare function incrementConversationCreated(
  userId: string | null | undefined,
  conversationId?: string,
): void;
/**
 * Incrémenter le compteur de polls créés
 * @param userId - ID de l'utilisateur (null pour guests)
 * @param pollId - ID du poll créé (optionnel)
 * @param pollType - Type du poll (OBLIGATOIRE: "date", "form", "quizz", ou "availability")
 */
export declare function incrementPollCreated(
  userId: string | null | undefined,
  pollId: string | undefined,
  pollType: "date" | "form" | "quizz" | "availability",
): Promise<void>;
/**
 * Consommer des crédits pour un message IA
 */
export declare function consumeAiMessageCredits(
  userId: string | null | undefined,
  conversationId?: string,
): void;
/**
 * Consommer des crédits pour une query analytics
 */
export declare function consumeAnalyticsCredits(
  userId: string | null | undefined,
  pollId?: string,
  query?: string,
): void;
/**
 * Consommer des crédits pour une simulation (5 crédits selon la doc)
 */
export declare function consumeSimulationCredits(
  userId: string | null | undefined,
  pollId?: string,
  simulationId?: string,
): void;
/**
 * Consommer des crédits pour une action personnalisée
 */
export declare function consumeCustomCredits(
  userId: string | null | undefined,
  credits: number,
  action: CreditActionType,
  metadata?: CreditJournalEntry["metadata"],
): void;
/**
 * Réinitialiser les quotas consommés (pour tests ou admin)
 */
export declare function resetQuotaConsumed(userId: string | null | undefined): void;
export {};
