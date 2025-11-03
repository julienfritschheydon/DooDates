/**
 * BetaKeyService - Gestion des clés beta testeurs
 *
 * Permet:
 * - Génération de clés par admin
 * - Redemption (activation) de clés par utilisateurs
 * - Suivi des clés (statut, usage)
 */

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ErrorFactory, logError } from "@/lib/error-handling";

// ================================================
// TYPES
// ================================================

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

// ================================================
// SERVICE
// ================================================

export class BetaKeyService {
  /**
   * Génère de nouvelles clés beta (Admin uniquement)
   */
  static async generateKeys(
    count: number = 1,
    notes?: string,
    durationMonths: number = 3,
  ): Promise<BetaKeyGeneration[]> {
    try {
      const { data, error } = await supabase.rpc("generate_beta_key", {
        p_count: count,
        p_notes: notes,
        p_duration_months: durationMonths,
      });

      if (error) {
        const err = ErrorFactory.storage(
          `Failed to generate beta keys: ${error.message}`,
          "Erreur lors de la génération des clés beta",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "generateKeys",
          metadata: { error },
        });
        throw err;
      }

      logger.info(`Generated ${count} beta keys`, "beta-keys", { count, notes });
      return data as BetaKeyGeneration[];
    } catch (error) {
      logger.error("Exception generating beta keys", "beta-keys", { error });
      throw error;
    }
  }

  /**
   * Active une clé beta pour un utilisateur
   */
  static async redeemKey(userId: string, code: string): Promise<RedemptionResult> {
    try {
      // Normaliser le code (uppercase, trim)
      const normalizedCode = code.trim().toUpperCase();

      const { data, error } = await supabase.rpc("redeem_beta_key", {
        p_user_id: userId,
        p_code: normalizedCode,
      });

      if (error) {
        logger.error("Failed to redeem beta key", "beta-keys", { error, userId });
        return {
          success: false,
          error: "Erreur lors de l'activation de la clé",
        };
      }

      const result = data as RedemptionResult;

      if (result.success) {
        logger.info("Beta key redeemed successfully", "beta-keys", {
          userId,
          code: normalizedCode,
          tier: result.tier,
        });
      } else {
        logger.warn("Beta key redemption failed", "beta-keys", {
          userId,
          code: normalizedCode,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      logger.error("Exception redeeming beta key", "beta-keys", { error, userId });
      return {
        success: false,
        error: "Une erreur inattendue s'est produite",
      };
    }
  }

  /**
   * Récupère toutes les clés beta (Admin)
   */
  static async getAllKeys(): Promise<BetaKey[]> {
    try {
      const { data, error } = await supabase
        .from("beta_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const err = ErrorFactory.storage(
          `Failed to fetch beta keys: ${error.message}`,
          "Erreur lors de la récupération des clés beta",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "getAllKeys",
          metadata: { error },
        });
        throw err;
      }

      return data as BetaKey[];
    } catch (error) {
      logger.error("Exception fetching beta keys", "beta-keys", { error });
      throw error;
    }
  }

  /**
   * Récupère les clés actives uniquement
   */
  static async getActiveKeys(): Promise<BetaKey[]> {
    try {
      const { data, error } = await supabase
        .from("beta_keys")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        const err = ErrorFactory.storage(
          `Failed to fetch active beta keys: ${error.message}`,
          "Erreur lors de la récupération des clés actives",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "getActiveKeys",
          metadata: { error },
        });
        throw err;
      }

      return data as BetaKey[];
    } catch (error) {
      logger.error("Exception fetching active beta keys", "beta-keys", { error });
      throw error;
    }
  }

  /**
   * Récupère la clé beta d'un utilisateur
   */
  static async getUserKey(userId: string): Promise<BetaKey | null> {
    try {
      const { data, error } = await supabase
        .from("beta_keys")
        .select("*")
        .eq("assigned_to", userId)
        .eq("status", "used")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Pas de clé trouvée (normal)
          return null;
        }
        const err = ErrorFactory.storage(
          `Failed to fetch user beta key: ${error.message}`,
          "Erreur lors de la récupération de la clé utilisateur",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "getUserKey",
          metadata: { error, userId },
        });
        throw err;
      }

      return data as BetaKey;
    } catch (error) {
      logger.error("Exception fetching user beta key", "beta-keys", { error, userId });
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a une clé beta active
   */
  static async hasActiveBetaKey(userId: string): Promise<boolean> {
    try {
      const key = await this.getUserKey(userId);

      if (!key) return false;

      // Vérifier que la clé n'est pas expirée
      const expiresAt = new Date(key.expires_at);
      const now = new Date();

      return expiresAt > now;
    } catch (error) {
      logger.error("Exception checking beta key status", "beta-keys", { error, userId });
      return false;
    }
  }

  /**
   * Révoquer une clé (Admin)
   */
  static async revokeKey(keyId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("beta_keys")
        .update({
          status: "revoked",
          notes: reason ? `Révoquée: ${reason}` : "Révoquée",
        })
        .eq("id", keyId);

      if (error) {
        const err = ErrorFactory.storage(
          `Failed to revoke beta key: ${error.message}`,
          "Erreur lors de la révocation de la clé",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "revokeKey",
          metadata: { error, keyId },
        });
        throw err;
      }

      logger.info("Beta key revoked", "beta-keys", { keyId, reason });
    } catch (error) {
      logger.error("Exception revoking beta key", "beta-keys", { error, keyId });
      throw error;
    }
  }

  /**
   * Enregistrer un bug reporté par un beta testeur
   */
  static async recordBugReport(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("increment_bug_count", {
        p_user_id: userId,
      });

      if (error) {
        logger.error("Failed to record bug report", "beta-keys", { error, userId });
      }

      logger.info("Bug report recorded", "beta-keys", { userId });
    } catch (error) {
      logger.error("Exception recording bug report", "beta-keys", { error, userId });
    }
  }

  /**
   * Enregistrer un feedback d'un beta testeur
   */
  static async recordFeedback(userId: string, score: number): Promise<void> {
    try {
      if (score < 1 || score > 5) {
        throw ErrorFactory.validation(
          "Score must be between 1 and 5",
          "Le score doit être compris entre 1 et 5",
        );
      }

      const { error } = await supabase
        .from("beta_keys")
        .update({
          feedback_score: score,
          last_feedback_at: new Date().toISOString(),
        })
        .eq("assigned_to", userId);

      if (error) {
        const err = ErrorFactory.storage(
          `Failed to record feedback: ${error.message}`,
          "Erreur lors de l'enregistrement du feedback",
        );
        logError(err, {
          component: "BetaKeyService",
          operation: "recordFeedback",
          metadata: { error, userId },
        });
        throw err;
      }

      logger.info("Feedback recorded", "beta-keys", { userId, score });
    } catch (error) {
      logger.error("Exception recording feedback", "beta-keys", { error, userId });
      throw error;
    }
  }

  /**
   * Exporter les clés en CSV (Admin)
   */
  static exportToCSV(keys: BetaKey[]): string {
    const headers = [
      "Code",
      "Status",
      "Utilisateur",
      "Activée le",
      "Expire le",
      "Bugs reportés",
      "Score feedback",
      "Notes",
    ];

    const rows = keys.map((key) => [
      key.code,
      key.status,
      key.assigned_to || "Non assignée",
      key.redeemed_at || "Non utilisée",
      key.expires_at,
      key.bugs_reported.toString(),
      key.feedback_score?.toString() || "N/A",
      key.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  /**
   * Télécharger CSV
   */
  static downloadCSV(keys: BetaKey[], filename: string = "beta-keys.csv"): void {
    const csv = this.exportToCSV(keys);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info("Beta keys exported to CSV", "beta-keys", { filename, count: keys.length });
  }

  /**
   * Statistiques beta testeurs (Admin)
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    used: number;
    expired: number;
    revoked: number;
    avgBugsReported: number;
    avgFeedbackScore: number;
  }> {
    try {
      const keys = await this.getAllKeys();

      const stats = {
        total: keys.length,
        active: keys.filter((k) => k.status === "active").length,
        used: keys.filter((k) => k.status === "used").length,
        expired: keys.filter((k) => k.status === "expired").length,
        revoked: keys.filter((k) => k.status === "revoked").length,
        avgBugsReported: keys.reduce((sum, k) => sum + k.bugs_reported, 0) / keys.length || 0,
        avgFeedbackScore:
          keys
            .filter((k) => k.feedback_score !== null)
            .reduce((sum, k) => sum + (k.feedback_score || 0), 0) /
            keys.filter((k) => k.feedback_score !== null).length || 0,
      };

      return stats;
    } catch (error) {
      logger.error("Exception calculating beta key statistics", "beta-keys", { error });
      throw error;
    }
  }
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Valider le format d'une clé beta
 */
export function isValidBetaKeyFormat(code: string): boolean {
  const pattern = /^BETA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code.trim().toUpperCase());
}

/**
 * Formater une clé beta (ajout tirets automatique)
 */
export function formatBetaKey(input: string): string {
  // Enlever tout ce qui n'est pas alphanumérique
  const cleaned = input.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  // Si commence par BETA, l'enlever
  const withoutPrefix = cleaned.startsWith("BETA") ? cleaned.slice(4) : cleaned;

  // Limiter à 12 caractères max
  const limited = withoutPrefix.slice(0, 12);

  // Ajouter tirets tous les 4 caractères
  const segments = [];
  for (let i = 0; i < limited.length; i += 4) {
    segments.push(limited.slice(i, i + 4));
  }

  return "BETA-" + segments.join("-");
}
