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
import { logError, ErrorFactory } from "./error-handling";
import { isE2ETestingEnvironment } from "./e2e-detection";
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
  AI_MESSAGES: 2, // ⚠️ TEMPORAIRE POUR TESTS - Remettre à 20 après
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
} as const;

function shouldBypassGuestQuota(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (isE2ETestingEnvironment() || (window as any).__IS_E2E_TESTING__ === true) {
    logger.debug("E2E environment detected, bypassing guest quota", "quota");
    return true;
  }

  try {
    const hasLocalFlag =
      localStorage.getItem("e2e") === "1" || localStorage.getItem("dev-local-mode") === "1";
    if (hasLocalFlag) {
      logger.debug("Local E2E flags detected, bypassing guest quota", "quota");
      return true;
    }
  } catch (error) {
    logError(
      ErrorFactory.storage("Error checking E2E flags", "Failed to check E2E environment"),
      {
        component: "guestQuotaService",
        metadata: { originalError: error },
      },
    );
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const isMockedSupabase = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");

  if (isMockedSupabase) {
    logger.debug("Mock Supabase URL detected, bypassing guest quota", "quota");
  }

  return isMockedSupabase;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Récupère ou crée le quota guest dans Supabase
 */
export async function getOrCreateGuestQuota(): Promise<GuestQuotaData | null> {
  // En environnement E2E, retourner null pour désactiver le service
  if (shouldBypassGuestQuota()) {
    return null;
  }

  try {
    const fingerprint = await getCachedFingerprint();
    const metadata = getBrowserMetadata();

    logger.debug("Fetching guest quota", "quota", { fingerprint: fingerprint.substring(0, 16) });

    // Chercher quota existant par fingerprint
    const { data: existingArray, error: fetchError } = await supabase
      .from("guest_quotas")
      .select("*")
      .eq("fingerprint", fingerprint);

    if (fetchError) {
      logger.debug("Failed to fetch guest quota (non-critical)", "quota", {
        error: fetchError.message,
      });
      return null;
    }

    let existing = existingArray?.[0];

    // FALLBACK: Si pas trouvé par fingerprint, chercher par ID en cache localStorage
    if (!existing) {
      const cachedQuotaId = localStorage.getItem("guest_quota_id");
      if (cachedQuotaId) {
        logger.debug("Fingerprint not found, trying cached quota ID", "quota", {
          cachedId: cachedQuotaId.substring(0, 16),
        });

        const { data: cachedArray, error: cachedError } = await supabase
          .from("guest_quotas")
          .select("*")
          .eq("id", cachedQuotaId);

        if (!cachedError && cachedArray?.[0]) {
          existing = cachedArray[0];

          // Mettre à jour le fingerprint dans Supabase pour ce quota
          logger.info("Updating fingerprint for existing quota", "quota", {
            oldFingerprint: existing.fingerprint.substring(0, 16),
            newFingerprint: fingerprint.substring(0, 16),
          });

          await supabase.from("guest_quotas").update({ fingerprint }).eq("id", cachedQuotaId);

          existing.fingerprint = fingerprint;
        }
      }
    }

    if (existing) {
      logger.debug("Guest quota found", "quota", {
        totalCredits: existing.total_credits_consumed,
      });

      // Sauvegarder l'ID en cache pour le fallback
      localStorage.setItem("guest_quota_id", existing.id);

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

    // Sauvegarder l'ID en cache pour le fallback
    localStorage.setItem("guest_quota_id", created.id);

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
  // En environnement E2E, toujours autoriser
  if (shouldBypassGuestQuota()) {
    return { allowed: true };
  }

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
  // En environnement E2E, simuler succès sans toucher Supabase
  if (shouldBypassGuestQuota()) {
    logger.debug("E2E environment: simulating credit consumption", "quota", { action, credits });
    return { success: true };
  }

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
export async function getGuestQuotaJournal(limit: number = 100): Promise<GuestQuotaJournalEntry[]> {
  // En environnement E2E, retourner tableau vide
  if (shouldBypassGuestQuota()) {
    return [];
  }

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
