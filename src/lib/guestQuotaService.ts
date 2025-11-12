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
  lastResetAt: string | null;
  browserMetadata?: {
    userAgent?: string | null;
    timezone?: string | null;
    language?: string | null;
    screenResolution?: string | null;
  };
}

interface GuestQuotaJournalSupabaseRow {
  id: string;
  guest_quota_id: string;
  fingerprint: string;
  action: CreditActionType;
  credits: number;
  metadata: Record<string, any> | null;
  created_at: string;
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

const GUEST_QUOTA_TABLE = "guest_quotas";
const GUEST_QUOTA_JOURNAL_TABLE = "guest_quota_journal";
const LOCAL_QUOTA_ID_KEY = "guest_quota_id";

interface GuestQuotaSupabaseRow {
  id: string;
  fingerprint: string;
  conversations_created: number;
  polls_created: number;
  ai_messages: number;
  analytics_queries: number;
  simulations: number;
  total_credits_consumed: number;
  first_seen_at: string;
  last_activity_at: string;
  last_reset_at: string | null;
  user_agent?: string | null;
  timezone?: string | null;
  language?: string | null;
  screen_resolution?: string | null;
}

function shouldBypassGuestQuota(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isE2E = isE2ETestingEnvironment() || (window as any).__IS_E2E_TESTING__ === true;

  if (isE2E) {
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
    logError(ErrorFactory.storage("Error checking E2E flags", "Failed to check E2E environment"), {
      component: "guestQuotaService",
      metadata: { originalError: error },
    });
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const isMockedSupabase = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");

  if (isMockedSupabase) {
    logger.debug("Mock Supabase URL detected, bypassing guest quota", "quota");
  }

  return isMockedSupabase;
}

interface GuestQuotaSyncOptions {
  mergeCounters?: Partial<Pick<GuestQuotaData, "conversationsCreated" | "pollsCreated" | "aiMessages" | "analyticsQueries" | "simulations" | "totalCreditsConsumed">>;
}

interface GuestQuotaSyncResult {
  quota: GuestQuotaData;
  fingerprint: string;
}

function mapSupabaseRowToGuestQuota(row: GuestQuotaSupabaseRow): GuestQuotaData {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    conversationsCreated: row.conversations_created,
    pollsCreated: row.polls_created,
    aiMessages: row.ai_messages,
    analyticsQueries: row.analytics_queries,
    simulations: row.simulations,
    totalCreditsConsumed: row.total_credits_consumed,
    firstSeenAt: row.first_seen_at,
    lastActivityAt: row.last_activity_at,
    lastResetAt: row.last_reset_at,
    browserMetadata: {
      userAgent: row.user_agent,
      timezone: row.timezone,
      language: row.language,
      screenResolution: row.screen_resolution,
    },
  };
}

function evaluateQuotaLimits(
  quota: GuestQuotaData,
  action: CreditActionType,
  credits: number,
): { allowed: boolean; reason?: string } {
  if (quota.totalCreditsConsumed + credits > GUEST_LIMITS.TOTAL_CREDITS) {
    return {
      allowed: false,
      reason: `Total credit limit reached (${GUEST_LIMITS.TOTAL_CREDITS})`,
    };
  }

  switch (action) {
    case "conversation_created":
      if (quota.conversationsCreated >= GUEST_LIMITS.CONVERSATIONS) {
        return {
          allowed: false,
          reason: `Conversation limit reached (${GUEST_LIMITS.CONVERSATIONS})`,
        };
      }
      break;
    case "poll_created":
      if (quota.pollsCreated >= GUEST_LIMITS.POLLS) {
        return {
          allowed: false,
          reason: `Poll limit reached (${GUEST_LIMITS.POLLS})`,
        };
      }
      break;
    case "ai_message":
      if (quota.aiMessages >= GUEST_LIMITS.AI_MESSAGES) {
        return {
          allowed: false,
          reason: `AI message limit reached (${GUEST_LIMITS.AI_MESSAGES})`,
        };
      }
      break;
    case "analytics_query":
      if (quota.analyticsQueries >= GUEST_LIMITS.ANALYTICS_QUERIES) {
        return {
          allowed: false,
          reason: `Analytics query limit reached (${GUEST_LIMITS.ANALYTICS_QUERIES})`,
        };
      }
      break;
    case "simulation":
      if (quota.simulations >= GUEST_LIMITS.SIMULATIONS) {
        return {
          allowed: false,
          reason: `Simulation limit reached (${GUEST_LIMITS.SIMULATIONS})`,
        };
      }
      break;
    default:
      break;
  }

  return { allowed: true };
}

async function fetchQuotaByFingerprint(
  fingerprint: string,
): Promise<GuestQuotaSupabaseRow | null> {
  const { data, error } = await supabase
    .from(GUEST_QUOTA_TABLE)
    .select("*")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    logger.debug("Failed to fetch guest quota (non-critical)", "quota", {
      error: error.message,
    });
    return null;
  }

  return (data as GuestQuotaSupabaseRow | null) ?? null;
}

async function fetchQuotaById(id: string): Promise<GuestQuotaSupabaseRow | null> {
  const { data, error } = await supabase
    .from(GUEST_QUOTA_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    logger.debug("Failed to fetch guest quota by id", "quota", {
      error: error.message,
    });
    return null;
  }

  return (data as GuestQuotaSupabaseRow | null) ?? null;
}

async function ensureGuestQuota(options?: GuestQuotaSyncOptions): Promise<GuestQuotaSyncResult | null> {
  if (shouldBypassGuestQuota()) {
    return null;
  }

  try {
    const fingerprint = await getCachedFingerprint();
    const metadata = getBrowserMetadata();

    logger.debug("Synchronizing guest quota", "quota", {
      fingerprint: fingerprint.substring(0, 16),
    });

    let row = await fetchQuotaByFingerprint(fingerprint);

    if (!row) {
      const cachedQuotaId = typeof window !== "undefined" ? localStorage.getItem(LOCAL_QUOTA_ID_KEY) : null;
      if (cachedQuotaId) {
        logger.debug("Fingerprint not found, trying cached quota ID", "quota", {
          cachedId: cachedQuotaId.substring(0, 16),
        });
        const cachedRow = await fetchQuotaById(cachedQuotaId);
        if (cachedRow) {
          await supabase.from(GUEST_QUOTA_TABLE).update({ fingerprint }).eq("id", cachedRow.id);
          row = { ...cachedRow, fingerprint };
        }
      }
    }

    if (!row) {
      logger.info("Creating new guest quota", "quota", {
        fingerprint: fingerprint.substring(0, 16),
      });

      const { data: created, error: createError } = await supabase
        .from(GUEST_QUOTA_TABLE)
        .insert({
          fingerprint,
          user_agent: metadata.userAgent,
          timezone: metadata.timezone,
          language: metadata.language,
          screen_resolution: metadata.screenResolution,
        })
        .select("*")
        .single();

      const createdRow = (created as GuestQuotaSupabaseRow | null) ?? null;

      if (createError || !createdRow) {
        logger.error("Failed to create guest quota", createError);
        return null;
      }

      row = createdRow;
    }

    const updates: Partial<GuestQuotaSupabaseRow> = {};
    const metadataChanged =
      row.user_agent !== metadata.userAgent ||
      row.timezone !== metadata.timezone ||
      row.language !== metadata.language ||
      row.screen_resolution !== metadata.screenResolution;

    if (metadataChanged) {
      updates.user_agent = metadata.userAgent;
      updates.timezone = metadata.timezone;
      updates.language = metadata.language;
      updates.screen_resolution = metadata.screenResolution;
    }

    if (options?.mergeCounters) {
      const merge = options.mergeCounters;
      const countersMapping: Array<{
        key: keyof GuestQuotaSupabaseRow;
        field: keyof typeof merge;
      }> = [
        { key: "conversations_created", field: "conversationsCreated" },
        { key: "polls_created", field: "pollsCreated" },
        { key: "ai_messages", field: "aiMessages" },
        { key: "analytics_queries", field: "analyticsQueries" },
        { key: "simulations", field: "simulations" },
      ];

      countersMapping.forEach(({ key, field }) => {
        const mergeValue = merge[field];
        if (typeof mergeValue === "number") {
          const currentValue = (row?.[key] as number | undefined) ?? 0;
          if (mergeValue > currentValue) {
            updates[key] = mergeValue as never;
          }
        }
      });

      if (
        typeof merge.totalCreditsConsumed === "number" &&
        merge.totalCreditsConsumed > (row?.total_credits_consumed ?? 0)
      ) {
        updates.total_credits_consumed = merge.totalCreditsConsumed;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from(GUEST_QUOTA_TABLE)
        .update(updates)
        .eq("id", row.id)
        .select("*")
        .single();

      const updatedRow = (updated as GuestQuotaSupabaseRow | null) ?? null;

      if (!updateError && updatedRow) {
        row = updatedRow;
      } else if (updateError) {
        logger.warn("Failed to refresh guest quota metadata", "quota", {
          error: updateError.message,
        });
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_QUOTA_ID_KEY, row.id);
    }

    return {
      quota: mapSupabaseRowToGuestQuota(row),
      fingerprint,
    };
  } catch (error) {
    logger.error("Failed to synchronize guest quota", error);
    return null;
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Récupère ou crée le quota guest dans Supabase
 */
export async function getOrCreateGuestQuota(): Promise<GuestQuotaData | null> {
  const result = await ensureGuestQuota();
  return result?.quota ?? null;
}

/**
 * Vérifie si l'utilisateur guest peut consommer des crédits
 */
export async function canConsumeCredits(
  action: CreditActionType,
  credits: number,
): Promise<{ allowed: boolean; reason?: string; currentQuota?: GuestQuotaData }> {
  if (shouldBypassGuestQuota()) {
    return { allowed: true };
  }

  try {
    const result = await ensureGuestQuota();
    const quota = result?.quota;

    if (!quota) {
      return { allowed: false, reason: "Failed to fetch quota" };
    }

    const evaluation = evaluateQuotaLimits(quota, action, credits);
    if (!evaluation.allowed) {
      return { ...evaluation, currentQuota: quota };
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
  if (shouldBypassGuestQuota()) {
    logger.debug("E2E environment: simulating credit consumption", "quota", { action, credits });
    return { success: true };
  }

  try {
    const syncResult = await ensureGuestQuota();
    const quota = syncResult?.quota;

    if (!quota) {
      return { success: false, error: "Failed to fetch quota" };
    }

    const evaluation = evaluateQuotaLimits(quota, action, credits);
    if (!evaluation.allowed) {
      logger.warn("Credit consumption denied", "quota", {
        action,
        credits,
        reason: evaluation.reason,
      });
      return { success: false, error: evaluation.reason };
    }

    const metadataSnapshot = getBrowserMetadata();

    const updates: Partial<GuestQuotaSupabaseRow> = {
      total_credits_consumed: quota.totalCreditsConsumed + credits,
      user_agent: metadataSnapshot.userAgent,
      timezone: metadataSnapshot.timezone,
      language: metadataSnapshot.language,
      screen_resolution: metadataSnapshot.screenResolution,
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

    const { data: updated, error: updateError } = await supabase
      .from(GUEST_QUOTA_TABLE)
      .update(updates)
      .eq("id", quota.id)
      .select("*")
      .single();

    const updatedRow = (updated as GuestQuotaSupabaseRow | null) ?? null;

    if (updateError || !updatedRow) {
      logger.error("Failed to update guest quota", updateError);
      return { success: false, error: "Failed to update quota" };
    }

    const fingerprint = updatedRow.fingerprint;

    const { error: journalError } = await supabase.from(GUEST_QUOTA_JOURNAL_TABLE).insert({
      guest_quota_id: updatedRow.id,
      fingerprint,
      action,
      credits,
      metadata: metadata || {},
    });

    if (journalError) {
      logger.error("Failed to add journal entry", journalError);
    }

    logger.info("Credits consumed", "quota", {
      action,
      credits,
      totalCredits: updatedRow.total_credits_consumed,
    });

    return {
      success: true,
      quota: mapSupabaseRowToGuestQuota(updatedRow),
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
  // Environnement E2E -> bypass
  if (shouldBypassGuestQuota()) {
    return [];
  }

  try {
    const fingerprint = await getCachedFingerprint();

    const { data, error } = await supabase
      .from(GUEST_QUOTA_JOURNAL_TABLE)
      .select("*")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to fetch journal", error);
      return [];
    }

    const entries = (data as GuestQuotaJournalSupabaseRow[] | null) ?? [];

    return entries.map((entry) => ({
      id: entry.id,
      guestQuotaId: entry.guest_quota_id,
      fingerprint: entry.fingerprint,
      action: entry.action,
      credits: entry.credits,
      metadata: entry.metadata ?? {},
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
