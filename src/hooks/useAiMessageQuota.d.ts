/**
 * Hook pour gérer le quota de messages IA (Freemium)
 *
 * Système de quota :
 * - Guest : 10 messages IA max (réduit pour reconnaissance vocale)
 * - Authenticated : 100 messages/mois (réduit pour reconnaissance vocale)
 * - Limite 2 polls par conversation (guest), 5 (auth)
 *
 * Empêche :
 * - Chat infini (spam messages)
 * - Création infinie de polls dans une conversation
 * - Abus du système gratuit
 *
 * Note : Quotas réduits car reconnaissance vocale facilite l'usage
 * et augmente la consommation de tokens Gemini
 */
interface AiMessageQuotaData {
    aiMessagesUsed: number;
    lastMessageTimestamp: number;
    resetDate?: string;
}
export interface AiMessageQuota {
    aiMessagesUsed: number;
    aiMessagesLimit: number;
    aiMessagesRemaining: number;
    canSendMessage: boolean;
    pollsInConversation: number;
    pollsLimit: number;
    canCreatePoll: boolean;
    incrementAiMessages: () => void;
    incrementPollCount: (conversationId: string) => void;
    resetQuota: () => void;
    isInCooldown: boolean;
    cooldownRemaining: number;
}
/**
 * Fonction pure pour gérer le reset mensuel du quota
 * Testable indépendamment de React
 */
export declare function processMonthlyQuotaReset(currentQuotaData: AiMessageQuotaData, isGuest: boolean): AiMessageQuotaData | null;
/**
 * Hook pour gérer le quota de messages IA
 */
export declare function useAiMessageQuota(currentConversationId?: string): AiMessageQuota;
export {};
