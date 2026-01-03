/**
 * Script de migration : localStorage → quota_tracking (Supabase)
 *
 * Ce script migre les données de quota depuis localStorage vers la table quota_tracking
 *
 * Usage:
 * 1. Exporter les données localStorage depuis le navigateur (DevTools → Application → Local Storage)
 * 2. Sauvegarder dans un fichier JSON
 * 3. Exécuter ce script avec les données
 *
 * OU
 *
 * Exécuter côté client lors de la première connexion d'un utilisateur authentifié
 */

import { supabase } from "../src/lib/supabase";

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

interface AllQuotaData {
  [userId: string]: QuotaConsumedData;
}

interface CreditJournalEntry {
  id: string;
  timestamp: string;
  action: string;
  credits: number;
  userId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Migrer les données de quota d'un utilisateur depuis localStorage vers Supabase
 *
 * @param userId - ID de l'utilisateur authentifié
 * @param quotaData - Données de quota depuis localStorage
 * @param journalEntries - Entrées du journal depuis localStorage
 */
export async function migrateUserQuotaToSupabase(
  userId: string,
  quotaData: QuotaConsumedData,
  journalEntries: CreditJournalEntry[] = [],
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    // Vérifier si le quota existe déjà dans Supabase
    const { data: existingQuota } = await supabase
      .from("quota_tracking")
      .select("id, total_credits_consumed")
      .eq("user_id", userId)
      .single();

    if (existingQuota) {
      // Fusionner les données : prendre le maximum de chaque compteur
      const { data: merged } = await supabase.rpc("ensure_quota_tracking_exists", {
        p_user_id: userId,
      });

      const { error: updateError } = await supabase
        .from("quota_tracking")
        .update({
          conversations_created: Math.max(
            existingQuota.conversations_created || 0,
            quotaData.conversationsCreated || 0,
          ),
          polls_created: Math.max(existingQuota.polls_created || 0, quotaData.pollsCreated || 0),
          date_polls_created: Math.max(
            existingQuota.date_polls_created || 0,
            quotaData.datePollsCreated || 0,
          ),
          form_polls_created: Math.max(
            existingQuota.form_polls_created || 0,
            quotaData.formPollsCreated || 0,
          ),
          quizz_created: Math.max(existingQuota.quizz_created || 0, quotaData.quizzCreated || 0),
          availability_polls_created: Math.max(
            existingQuota.availability_polls_created || 0,
            quotaData.availabilityPollsCreated || 0,
          ),
          ai_messages: Math.max(existingQuota.ai_messages || 0, quotaData.aiMessages || 0),
          analytics_queries: Math.max(
            existingQuota.analytics_queries || 0,
            quotaData.analyticsQueries || 0,
          ),
          simulations: Math.max(existingQuota.simulations || 0, quotaData.simulations || 0),
          total_credits_consumed: Math.max(
            existingQuota.total_credits_consumed || 0,
            quotaData.totalCreditsConsumed || 0,
          ),
          subscription_start_date: quotaData.subscriptionStartDate
            ? new Date(quotaData.subscriptionStartDate).toISOString()
            : null,
          last_reset_date: quotaData.lastResetDate
            ? new Date(quotaData.lastResetDate).toISOString()
            : null,
        })
        .eq("user_id", userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Créer nouveau quota
      const { error: createError } = await supabase.from("quota_tracking").insert({
        user_id: userId,
        conversations_created: quotaData.conversationsCreated || 0,
        polls_created: quotaData.pollsCreated || 0,
        date_polls_created: quotaData.datePollsCreated || 0,
        form_polls_created: quotaData.formPollsCreated || 0,
        quizz_created: quotaData.quizzCreated || 0,
        availability_polls_created: quotaData.availabilityPollsCreated || 0,
        ai_messages: quotaData.aiMessages || 0,
        analytics_queries: quotaData.analyticsQueries || 0,
        simulations: quotaData.simulations || 0,
        total_credits_consumed: quotaData.totalCreditsConsumed || 0,
        subscription_start_date: quotaData.subscriptionStartDate
          ? new Date(quotaData.subscriptionStartDate).toISOString()
          : null,
        last_reset_date: quotaData.lastResetDate
          ? new Date(quotaData.lastResetDate).toISOString()
          : null,
      });

      if (createError) {
        return { success: false, error: createError.message };
      }
    }

    // Migrer le journal (seulement les entrées qui n'existent pas déjà)
    if (journalEntries.length > 0) {
      const { data: quota } = await supabase
        .from("quota_tracking")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (quota) {
        // Insérer les entrées du journal (limitées aux 1000 plus récentes)
        const recentEntries = journalEntries
          .filter((entry) => entry.userId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 1000);

        if (recentEntries.length > 0) {
          const journalInserts = recentEntries.map((entry) => ({
            quota_tracking_id: quota.id,
            user_id: userId,
            action: entry.action,
            credits: entry.credits,
            metadata: entry.metadata || {},
            created_at: entry.timestamp,
          }));

          // Insérer par batch de 100
          for (let i = 0; i < journalInserts.length; i += 100) {
            const batch = journalInserts.slice(i, i + 100);
            const { error: journalError } = await supabase
              .from("quota_tracking_journal")
              .insert(batch);

            if (journalError) {
              console.warn("Erreur migration journal batch:", journalError);
              // Continuer avec les autres batches
            }
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Migrer automatiquement les données localStorage lors de la première connexion
 * Cette fonction est appelée automatiquement par quotaTracking.ts
 */
export async function autoMigrateLocalStorageQuota(userId: string): Promise<void> {
  try {
    const STORAGE_KEY = "doodates_quota_consumed";
    const JOURNAL_KEY = "doodates_quota_journal";

    // Lire localStorage
    const storageData = localStorage.getItem(STORAGE_KEY);
    const journalData = localStorage.getItem(JOURNAL_KEY);

    if (!storageData) {
      return; // Rien à migrer
    }

    const allData: AllQuotaData = JSON.parse(storageData);
    const userData = allData[userId];

    if (!userData) {
      return; // Pas de données pour cet utilisateur
    }

    // Vérifier si déjà migré (marqueur dans localStorage)
    const migrationKey = `quota_migrated_${userId}`;
    if (localStorage.getItem(migrationKey)) {
      return; // Déjà migré
    }

    // Migrer les données
    const journalEntries: CreditJournalEntry[] = journalData ? JSON.parse(journalData) : [];

    const result = await migrateUserQuotaToSupabase(userId, userData, journalEntries);

    if (result.success) {
      // Marquer comme migré
      localStorage.setItem(migrationKey, "true");
      console.log("✅ Quota migré vers Supabase pour", userId);
    } else {
      console.warn("⚠️ Échec migration quota:", result.error);
    }
  } catch (error) {
    console.error("Erreur migration automatique:", error);
    // Ne pas bloquer l'utilisateur si la migration échoue
  }
}
