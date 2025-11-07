/**
 * BetaKeyService - Gestion des clés beta testeurs
 *
 * Permet:
 * - Génération de clés par admin
 * - Redemption (activation) de clés par utilisateurs
 * - Suivi des clés (statut, usage)
 */
export interface BetaKey {
    id: string;
    code: string;
    status: "active" | "used" | "expired" | "revoked";
    credits_monthly: number;
    max_polls: number;
    duration_months: number;
    assigned_to: string | null;
    redeemed_at: string | null;
    expires_at: string;
    created_by: string | null;
    created_at: string;
    notes: string | null;
    last_feedback_at: string | null;
    bugs_reported: number;
    feedback_score: number | null;
}
export interface BetaKeyGeneration {
    code: string;
    expires_at: string;
}
export interface RedemptionResult {
    success: boolean;
    error?: string;
    tier?: string;
    credits?: number;
    expires_at?: string;
}
export declare class BetaKeyService {
    /**
     * Génère de nouvelles clés beta (Admin uniquement)
     */
    static generateKeys(count?: number, notes?: string, durationMonths?: number): Promise<BetaKeyGeneration[]>;
    /**
     * Active une clé beta pour un utilisateur
     */
    static redeemKey(userId: string, code: string, accessToken?: string): Promise<RedemptionResult>;
    /**
     * Récupère toutes les clés beta (Admin)
     */
    static getAllKeys(): Promise<BetaKey[]>;
    /**
     * Récupère les clés actives uniquement
     */
    static getActiveKeys(): Promise<BetaKey[]>;
    /**
     * Récupère la clé beta d'un utilisateur
     */
    static getUserKey(userId: string): Promise<BetaKey | null>;
    /**
     * Vérifie si un utilisateur a une clé beta active
     */
    static hasActiveBetaKey(userId: string): Promise<boolean>;
    /**
     * Révoquer une clé (Admin)
     */
    static revokeKey(keyId: string, reason?: string): Promise<void>;
    /**
     * Enregistrer un bug reporté par un beta testeur
     */
    static recordBugReport(userId: string): Promise<void>;
    /**
     * Enregistrer un feedback d'un beta testeur
     */
    static recordFeedback(userId: string, score: number): Promise<void>;
    /**
     * Exporter les clés en CSV (Admin)
     */
    static exportToCSV(keys: BetaKey[]): string;
    /**
     * Télécharger CSV
     */
    static downloadCSV(keys: BetaKey[], filename?: string): void;
    /**
     * Statistiques beta testeurs (Admin)
     */
    static getStatistics(): Promise<{
        total: number;
        active: number;
        used: number;
        expired: number;
        revoked: number;
        avgBugsReported: number;
        avgFeedbackScore: number;
    }>;
}
/**
 * Valider le format d'une clé beta
 */
export declare function isValidBetaKeyFormat(code: string): boolean;
/**
 * Formater une clé beta (ajout tirets automatique)
 */
export declare function formatBetaKey(input: string): string;
