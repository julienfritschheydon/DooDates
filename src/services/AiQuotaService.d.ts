/**
 * Service pour gérer les vérifications et actions liées au quota AI
 * Extrait de GeminiChatInterface pour réduire sa taille
 */
import { type AiMessageQuota } from "../hooks/useAiMessageQuota";
import { type UseQuotaReturn } from "../hooks/useQuota";
export interface QuotaCheckResult {
    canProceed: boolean;
    reason?: "cooldown" | "quota_exceeded";
    message?: {
        title: string;
        description: string;
        variant: "default" | "destructive";
    };
}
/**
 * Vérifie si l'utilisateur peut envoyer un message IA
 */
export declare function checkAiMessageQuota(aiQuota: AiMessageQuota): QuotaCheckResult;
/**
 * Vérifie si l'utilisateur peut créer un poll dans cette conversation
 */
export declare function checkPollCreationQuota(aiQuota: AiMessageQuota): QuotaCheckResult;
/**
 * Gère l'affichage des messages d'erreur quota et trigger auth incentive
 */
export declare function handleQuotaError(result: QuotaCheckResult, quota: UseQuotaReturn, toast: (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
}) => void): void;
/**
 * Incrémente les compteurs après une action réussie
 */
export declare function incrementQuotaCounters(aiQuota: AiMessageQuota, options: {
    incrementMessages?: boolean;
    incrementPolls?: boolean;
    conversationId?: string;
}): void;
