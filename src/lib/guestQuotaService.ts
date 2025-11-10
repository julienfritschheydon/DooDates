/**
 * Guest Quota Service
 * Gère les quotas des utilisateurs guests avec validation serveur via Supabase
 * 
 * Sécurité:
 * - Fingerprinting navigateur pour identifier les guests
 * - Validation serveur (Supabase) avant chaque action
 * - localStorage comme cache local uniquement
 * - Impossible de contourner en effaçant localStorage
 */

import { supabase } from "./supabase";
import { getCachedFingerprint, getBrowserMetadata } from "./browserFingerprint";
import { logger } from "./logger";
import type { CreditActionType } from "./quotaTracking";

// ============================================================================
// TYPES
// ============================================================================

export interface GuestQuotaData {
  id: string;
  fingerprint: string;
  conversationsCreated: number;
  pollsCreated: number;
  aiMessages: number;
  analyticsQueries: number;
  simulations: number;
  totalCreditsConsumed: number;
  firstSeenAt: string;
  lastActivityAt: string;
}

export interface GuestQuotaJournalEntry {
  id: string;
  guestQuotaId: string;
  fingerprint: string;
  action: CreditActionType;
  credits: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GUEST_LIMITS = {
  CONVERSATIONS: 5,
  POLLS: 5,
  AI_MESSAGES: 20,
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
} as const;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Récupère ou crée le quota guest dans Supabase
 */
export async function getOrCreateGuestQuota(): Promise<GuestQuotaData | null> {
  try {
    const fingerprint = await getCachedFingerprint();
    const metadata = getBrowserMetadata();

    logger.debug("Fetching guest quota", "quota", { fingerprint: fingerprint.substring(0, 16) });

    // Chercher quota existant
    const { data: existing, error: fetchError } = await supabase
      .from("guest_quotas")
      .select("*")
      .eq("fingerprint", fingerprint)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = not found (OK)
      logger.error("Failed to fetch guest quota", fetchError);
      return null;
    }

    if (existing) {
      logger.debug("Guest quota found", "quota", {
        totalCredits: existing.total_credits_consumed,
      });

      return {
        id: existing.id,
        fingerprint: existing.fingerprint,
        conversationsCreated: existing.conversations_created,
        pollsCreated: existing.polls_created,
        aiMessages: existing.ai_messages,
        analyticsQueries: existing.analytics_queries,
        simulations: existing.simulations,
        totalCreditsConsumed: existing.total_credits_consumed,
        firstSeenAt: existing.first_seen_at,
        lastActivityAt: existing.last_activity_at,
      };
    }

    // Créer nouveau quota
    logger.info("Creating new guest quota", "quota", { fingerprint: fingerprint.substring(0, 16) });

    const { data: created, error: createError } = await supabase
      .from("guest_quotas")
      .insert({
        fingerprint,
        user_agent: metadata.userAgent,
        timezone: metadata.timezone,
        language: metadata.language,
        screen_resolution: metadata.screenResolution,
      })
      .select()
      .single();

    if (createError) {
      logger.error("Failed to create guest quota", createError);
      return null;
    }

    return {
      id: created.id,
      fingerprint: created.fingerprint,
      conversationsCreated: 0,
      pollsCreated: 0,
      aiMessages: 0,
      analyticsQueries: 0,
      simulations: 0,
      totalCreditsConsumed: 0,
      firstSeenAt: created.first_seen_at,
      lastActivityAt: created.last_activity_at,
    };
  } catch (error) {
    logger.error("Failed to get or create guest quota", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur guest peut consommer des crédits
 */
export async function canConsumeCredits(
  action: CreditActionType,
  credits: number,
): Promise<{ allowed: boolean; reason?: string; currentQuota?: GuestQuotaData }> {
  try {
    const quota = await getOrCreateGuestQuota();
    if (!quota) {
      return { allowed: false, reason: "Failed to fetch quota" };
    }

    // Vérifier limite totale
    if (quota.totalCreditsConsumed + credits > GUEST_LIMITS.TOTAL_CREDITS) {
      return {
        allowed: false,
        reason: `Total credit limit reached (${GUEST_LIMITS.TOTAL_CREDITS})`,
        currentQuota: quota,
      };
    }

    // Vérifier limites spécifiques par action
    switch (action) {
      case "conversation_created":
        if (quota.conversationsCreated >= GUEST_LIMITS.CONVERSATIONS) {
          return {
            allowed: false,
            reason: `Conversation limit reached (${GUEST_LIMITS.CONVERSATIONS})`,
            currentQuota: quota,
          };
        }
        break;

      case "poll_created":
        if (quota.pollsCreated >= GUEST_LIMITS.POLLS) {
          return {
            allowed: false,
            reason: `Poll limit reached (${GUEST_LIMITS.POLLS})`,
            currentQuota: quota,
          };
        }
        break;

      case "ai_message":
        if (quota.aiMessages >= GUEST_LIMITS.AI_MESSAGES) {
          return {
            allowed: false,
            reason: `AI message limit reached (${GUEST_LIMITS.AI_MESSAGES})`,
            currentQuota: quota,
          };
        }
        break;

      case "analytics_query":
        if (quota.analyticsQueries >= GUEST_LIMITS.ANALYTICS_QUERIES) {
          return {
            allowed: false,
            reason: `Analytics query limit reached (${GUEST_LIMITS.ANALYTICS_QUERIES})`,
            currentQuota: quota,
          };
        }
        break;

      case "simulation":
        if (quota.simulations >= GUEST_LIMITS.SIMULATIONS) {
          return {
            allowed: false,
            reason: `Simulation limit reached (${GUEST_LIMITS.SIMULATIONS})`,
            currentQuota: quota,
          };
        }
        break;
    }

    return { allowed: true, currentQuota: quota };
  } catch (error) {
    logger.error("Failed to check credit consumption", error);
    return { allowed: false, reason: "Internal error" };
  }
}

/**
 * Consomme des crédits et met à jour Supabase
 */
export async function consumeGuestCredits(
  action: CreditActionType,
  credits: number,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; quota?: GuestQuotaData; error?: string }> {
  try {
    // Vérifier d'abord si autorisé
    const check = await canConsumeCredits(action, credits);
    if (!check.allowed) {
      logger.warn("Credit consumption denied", "quota", {
        action,
        credits,
        reason: check.reason,
      });
      return { success: false, error: check.reason };
    }

    const fingerprint = await getCachedFingerprint();
    const quota = check.currentQuota!;

    // Calculer nouveaux compteurs
    const updates: any = {
      total_credits_consumed: quota.totalCreditsConsumed + credits,
    };

    switch (action) {
      case "conversation_created":
        updates.conversations_created = quota.conversationsCreated + 1;
        break;
      case "poll_created":
        updates.polls_created = quota.pollsCreated + 1;
        break;
      case "ai_message":
        updates.ai_messages = quota.aiMessages + 1;
        break;
      case "analytics_query":
        updates.analytics_queries = quota.analyticsQueries + 1;
        break;
      case "simulation":
        updates.simulations = quota.simulations + 1;
        break;
    }

    // Mettre à jour quota
    const { data: updated, error: updateError } = await supabase
      .from("guest_quotas")
      .update(updates)
      .eq("fingerprint", fingerprint)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to update guest quota", updateError);
      return { success: false, error: "Failed to update quota" };
    }

    // Ajouter entrée au journal
    const { error: journalError } = await supabase.from("guest_quota_journal").insert({
      guest_quota_id: quota.id,
      fingerprint,
      action,
      credits,
      metadata: metadata || {},
    });

    if (journalError) {
      logger.error("Failed to add journal entry", journalError);
      // Ne pas bloquer si le journal échoue
    }

    logger.info("Credits consumed", "quota", {
      action,
      credits,
      totalCredits: updated.total_credits_consumed,
    });

    return {
      success: true,
      quota: {
        id: updated.id,
        fingerprint: updated.fingerprint,
        conversationsCreated: updated.conversations_created,
        pollsCreated: updated.polls_created,
        aiMessages: updated.ai_messages,
        analyticsQueries: updated.analytics_queries,
        simulations: updated.simulations,
        totalCreditsConsumed: updated.total_credits_consumed,
        firstSeenAt: updated.first_seen_at,
        lastActivityAt: updated.last_activity_at,
      },
    };
  } catch (error) {
    logger.error("Failed to consume credits", error);
    return { success: false, error: "Internal error" };
  }
}

/**
 * Récupère le journal de consommation
 */
export async function getGuestQuotaJournal(
  limit: number = 100,
): Promise<GuestQuotaJournalEntry[]> {
  try {
    const fingerprint = await getCachedFingerprint();

    const { data, error } = await supabase
      .from("guest_quota_journal")
      .select("*")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to fetch journal", error);
      return [];
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      guestQuotaId: entry.guest_quota_id,
      fingerprint: entry.fingerprint,
      action: entry.action,
      credits: entry.credits,
      metadata: entry.metadata,
      createdAt: entry.created_at,
    }));
  } catch (error) {
    logger.error("Failed to get journal", error);
    return [];
  }
}

/**
 * Récupère les limites pour affichage UI
 */
export function getGuestLimits() {
  return { ...GUEST_LIMITS };
}
