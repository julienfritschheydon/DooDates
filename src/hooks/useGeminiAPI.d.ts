/**
 * useGeminiAPI Hook
 *
 * Hook dédié pour gérer les appels à l'API Gemini
 * Extrait de GeminiChatInterface pour réduire la complexité
 *
 * Responsabilités :
 * - Appels API Gemini
 * - Gestion des erreurs API
 * - Gestion des quotas
 * - Retry logic
 *
 * @see Docs/Architecture-GeminiChatInterface.md
 */
import { type PollSuggestion } from "../lib/gemini";
export interface GeminiAPIResponse {
    success: boolean;
    data?: PollSuggestion;
    error?: string;
    errorType?: "quota" | "network" | "parsing" | "unknown";
}
export interface UseGeminiAPIOptions {
    onQuotaExceeded?: () => void;
    onNetworkError?: () => void;
    debug?: boolean;
}
export interface UseGeminiAPIReturn {
    isLoading: boolean;
    generatePoll: (userMessage: string) => Promise<GeminiAPIResponse>;
    error: string | null;
    clearError: () => void;
}
/**
 * Hook pour gérer les appels à l'API Gemini
 */
export declare function useGeminiAPI(options?: UseGeminiAPIOptions): UseGeminiAPIReturn;
