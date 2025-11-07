/**
 * Intent Service - Service unifié de détection d'intentions
 *
 * Utilise le pattern Strategy pour unifier les 3 services existants :
 * - IntentDetectionService (Date Polls)
 * - FormPollIntentService (Form Polls)
 * - GeminiIntentService (Fallback IA)
 *
 * Bénéfices :
 * - API unique et cohérente
 * - Stratégies interchangeables
 * - Testable facilement
 * - Évite duplication de code
 *
 * @see Docs/2. Planning.md - Quick Win #3
 */
import type { Poll } from "../lib/pollStorage";
import type { PollAction } from "../reducers/pollReducer";
import type { FormPollAction } from "../reducers/formPollReducer";
/**
 * Interface commune pour tous les résultats d'intention
 */
export interface IntentResult {
    isModification: boolean;
    action: PollAction["type"] | FormPollAction["type"] | null;
    payload: unknown;
    confidence: number;
    explanation?: string;
    modifiedField?: "title" | "type" | "options" | "required";
    modifiedQuestionId?: string;
    strategy: "regex" | "ai";
}
/**
 * Interface pour les stratégies de détection
 */
export interface IntentDetectionStrategy {
    /**
     * Nom de la stratégie (pour logging)
     */
    name: string;
    /**
     * Détecte l'intention dans le message
     * @returns IntentResult si une intention est détectée, null sinon
     */
    detect(message: string, currentPoll: Poll | null): Promise<IntentResult | null> | IntentResult | null;
    /**
     * Vérifie si cette stratégie peut traiter ce type de poll
     */
    canHandle(pollType: Poll["type"] | null): boolean;
}
/**
 * Service unifié de détection d'intentions
 *
 * Utilise le pattern Strategy pour déléguer la détection
 * aux stratégies appropriées selon le type de poll
 */
export declare class IntentService {
    private static strategies;
    /**
     * Détecte l'intention dans le message utilisateur
     *
     * Processus :
     * 1. Essaie les stratégies regex (rapides, déterministes)
     * 2. Si aucune ne matche, essaie la stratégie IA (fallback)
     *
     * @param message Message utilisateur
     * @param currentPoll Poll actuel (peut être null pour création)
     * @param options Options de détection
     * @returns IntentResult si une intention est détectée, null sinon
     */
    static detectIntent(message: string, currentPoll: Poll | null, options?: {
        useAI?: boolean;
        debug?: boolean;
    }): Promise<IntentResult | null>;
    /**
     * Ajoute une stratégie personnalisée
     * Utile pour les tests ou extensions futures
     */
    static addStrategy(strategy: IntentDetectionStrategy): void;
    /**
     * Retire une stratégie
     */
    static removeStrategy(strategyName: string): void;
    /**
     * Liste les stratégies disponibles
     */
    static getStrategies(): IntentDetectionStrategy[];
    /**
     * Réinitialise les stratégies par défaut
     * Utile pour les tests
     */
    static resetStrategies(): void;
}
