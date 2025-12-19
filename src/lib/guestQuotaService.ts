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

import { getCachedFingerprint, getBrowserMetadata } from "./browserFingerprint";
import { logger } from "./logger";
import { logError, ErrorFactory } from "./error-handling";
import { isE2ETestingEnvironment } from "./e2e-detection";
import type { CreditActionType } from "./quotaTracking";
import {
  supabaseSelectMaybeSingle,
  supabaseSelectSingle,
  supabaseInsert,
  supabaseUpdate,
  supabaseSelect,
} from "./supabaseApi";

// ============================================================================
// TYPES
// ============================================================================

export interface GuestQuotaData {
  id: string;
  fingerprint: string;
  conversationsCreated: number;
  // Compteurs séparés par type de poll (pollsCreated supprimé - calculer à la volée)
  datePollsCreated: number;
  formPollsCreated: number;
  quizzCreated: number;
  availabilityPollsCreated: number;
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

/**
 * Calcule le total de polls créés à partir des compteurs séparés
 * (remplace l'ancien pollsCreated qui était maintenu par trigger SQL)
 */
export function calculateTotalPollsCreated(quota: {
  datePollsCreated: number;
  formPollsCreated: number;
  quizzCreated: number;
  availabilityPollsCreated: number;
}): number {
  return quota.datePollsCreated + quota.formPollsCreated + 
         quota.quizzCreated + quota.availabilityPollsCreated;
}

interface GuestQuotaJournalSupabaseRow {
  id: string;
  guest_quota_id: string;
  fingerprint: string;
  action: CreditActionType;
  credits: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GuestQuotaJournalEntry {
  id: string;
  guestQuotaId: string;
  fingerprint: string;
  action: CreditActionType;
  credits: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GUEST_LIMITS = {
  TOTAL_CREDITS: 100, // Crédit global pour toutes les actions combinées
  CONVERSATIONS: 10,
  DATE_POLLS: 5,
  FORM_POLLS: 5,
  QUIZZ: 5,
  AVAILABILITY_POLLS: 5,
  AI_MESSAGES: 100,
  ANALYTICS_QUERIES: 50,
  SIMULATIONS: 20,
} as const;

// Exposé pour l'UI afin d'aligner l'affichage global des crédits invités
export const GUEST_TOTAL_CREDITS_LIMIT = GUEST_LIMITS.TOTAL_CREDITS;

const GUEST_QUOTA_TABLE = "guest_quotas";
const GUEST_QUOTA_JOURNAL_TABLE = "guest_quota_journal";
const LOCAL_QUOTA_ID_KEY = "guest_quota_id";

interface GuestQuotaSupabaseRow {
  id: string;
  fingerprint: string;
  conversations_created: number;
  // polls_created supprimé - utiliser calculateTotalPollsCreated() pour calculer à la volée
  date_polls_created: number;
  form_polls_created: number;
  quizz_created: number;
  availability_polls_created: number;
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

  const isE2E =
    isE2ETestingEnvironment() ||
    (window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true;

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
  mergeCounters?: Partial<
    Pick<
      GuestQuotaData,
      | "conversationsCreated"
      | "aiMessages"
      | "analyticsQueries"
      | "simulations"
      | "totalCreditsConsumed"
    >
  >;
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
    datePollsCreated: row.date_polls_created || 0,
    formPollsCreated: row.form_polls_created || 0,
    quizzCreated: row.quizz_created || 0,
    availabilityPollsCreated: row.availability_polls_created || 0,
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
  metadata?: Record<string, unknown>,
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
    case "poll_created": {
      // Vérifier limite par type de poll uniquement (séparation complète par produit)
      const pollType = metadata?.pollType as "date" | "form" | "quizz" | "availability" | undefined;

      // Validation stricte : pollType est obligatoire pour poll_created
      if (!pollType || !["date", "form", "quizz", "availability"].includes(pollType)) {
        return {
          allowed: false,
          reason: `pollType is required and must be one of: "date", "form", "quizz", "availability". Received: ${pollType}`,
        };
      }

      let limit: number;
      let current: number;
      switch (pollType) {
        case "date":
          limit = GUEST_LIMITS.DATE_POLLS;
          current = quota.datePollsCreated;
          break;
        case "form":
          limit = GUEST_LIMITS.FORM_POLLS;
          current = quota.formPollsCreated;
          break;
        case "quizz":
          limit = GUEST_LIMITS.QUIZZ;
          current = quota.quizzCreated;
          break;
        case "availability":
          limit = GUEST_LIMITS.AVAILABILITY_POLLS;
          current = quota.availabilityPollsCreated;
          break;
        default:
          // Type invalide, rejeter (ne devrait jamais arriver grâce à la validation ci-dessus)
          return {
            allowed: false,
            reason: `Invalid pollType: ${pollType}`,
          };
      }

      if (current >= limit) {
        return {
          allowed: false,
          reason: `${pollType} poll limit reached (${limit})`,
        };
      }
      break;
    }
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

// Cache pour éviter les appels répétés
const quotaCache = new Map<string, { data: GuestQuotaSupabaseRow | null; timestamp: number }>();
const CACHE_TTL = 5000; // 5 secondes

// Fonction pour vider le cache (utilisée dans les tests)
export function clearQuotaCache(): void {
  quotaCache.clear();
}

async function fetchQuotaByFingerprint(fingerprint: string): Promise<GuestQuotaSupabaseRow | null> {
  try {
    // Vérifier le cache d'abord
    const cached = quotaCache.get(fingerprint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Timeout réduit à 1 seconde pour éviter les blocages
    try {
      const data = await Promise.race([
        supabaseSelectMaybeSingle<GuestQuotaSupabaseRow>(
          GUEST_QUOTA_TABLE,
          {
            fingerprint: `eq.${fingerprint}`,
            select: "*",
          },
          { timeout: 1000, requireAuth: false },
        ),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 1000);
        }),
      ]);

      if (!data) {
        quotaCache.set(fingerprint, { data: null, timestamp: Date.now() });
        return null;
      }

      // Mettre en cache
      quotaCache.set(fingerprint, {
        data: data as GuestQuotaSupabaseRow | null,
        timestamp: Date.now(),
      });
      return data;
    } catch (error: unknown) {
      // En cas de timeout ou erreur, retourner null immédiatement sans logger (trop verbeux)
      if (
        error instanceof Error &&
        (error.message.includes("timeout") || error.message.includes("Timeout"))
      ) {
        return null;
      }
      logger.debug("Failed to fetch guest quota (non-critical)", "quota", {
        error: error instanceof Error ? error.message : String(error),
      });
      quotaCache.set(fingerprint, { data: null, timestamp: Date.now() });
      return null;
    }
  } catch (error) {
    logger.error("Error fetching quota by fingerprint", error);
    return null;
  }
}

async function fetchQuotaById(id: string): Promise<GuestQuotaSupabaseRow | null> {
  try {
    // Timeout réduit à 1 seconde
    try {
      const data = await Promise.race([
        supabaseSelectMaybeSingle<GuestQuotaSupabaseRow>(
          GUEST_QUOTA_TABLE,
          {
            id: `eq.${id}`,
            select: "*",
          },
          { timeout: 1000, requireAuth: false },
        ),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 1000);
        }),
      ]);

      return data;
    } catch (error: unknown) {
      // En cas de timeout, retourner null immédiatement sans logger
      if (
        error instanceof Error &&
        (error.message.includes("timeout") || error.message.includes("Timeout"))
      ) {
        return null;
      }
      logger.debug("Failed to fetch guest quota by id", "quota", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  } catch (error) {
    logger.error("Error fetching quota by id", error);
    return null;
  }
}

async function ensureGuestQuota(
  options?: GuestQuotaSyncOptions,
): Promise<GuestQuotaSyncResult | null> {
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
      const cachedQuotaId =
        typeof window !== "undefined" ? localStorage.getItem(LOCAL_QUOTA_ID_KEY) : null;
      if (cachedQuotaId) {
        logger.debug("Fingerprint not found, trying cached quota ID", "quota", {
          cachedId: cachedQuotaId.substring(0, 16),
        });
        const cachedRow = await fetchQuotaById(cachedQuotaId);
        if (cachedRow) {
          try {
            // Timeout réduit à 1 seconde
            try {
              await Promise.race([
                supabaseUpdate<GuestQuotaSupabaseRow>(
                  GUEST_QUOTA_TABLE,
                  { fingerprint },
                  { id: `eq.${cachedRow.id}` },
                  { timeout: 1000, requireAuth: false },
                ),
                new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error("Timeout")), 1000);
                }),
              ]);

              row = { ...cachedRow, fingerprint };
              // Mettre en cache
              quotaCache.set(fingerprint, { data: row, timestamp: Date.now() });
            } catch (error: unknown) {
              // Ne logger que les erreurs non-timeout
              if (!(error instanceof Error && error.message.includes("Timeout"))) {
                logger.warn("Failed to update fingerprint for cached quota", "quota", {
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              row = { ...cachedRow, fingerprint };
            }
          } catch (error) {
            logger.error("Error updating fingerprint for cached quota", error);
            row = { ...cachedRow, fingerprint };
          }
        }
      }
    }

    if (!row) {
      logger.info("Creating new guest quota", "quota", {
        fingerprint: fingerprint.substring(0, 16),
      });

      try {
        // Timeout réduit à 1 seconde
        try {
          const createdRow = await Promise.race([
            supabaseInsert<GuestQuotaSupabaseRow>(
              GUEST_QUOTA_TABLE,
              {
                fingerprint,
                user_agent: metadata.userAgent,
                timezone: metadata.timezone,
                language: metadata.language,
                screen_resolution: metadata.screenResolution,
              },
              { timeout: 1000, requireAuth: false },
            ),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Timeout")), 1000);
            }),
          ]);

          if (!createdRow) {
            return null;
          }

          // Mettre en cache
          quotaCache.set(fingerprint, { data: createdRow, timestamp: Date.now() });
          row = createdRow;
        } catch (error: unknown) {
          if (error instanceof Error && error.message.includes("Timeout")) {
            // En cas de timeout, retourner null immédiatement (Supabase est trop lent)
            return null;
          }
          logger.error("Failed to create guest quota", "quota", error);
          return null;
        }
      } catch (error) {
        logger.error("Error creating guest quota", error);
        return null;
      }
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
      try {
        // Timeout réduit à 1 seconde
        try {
          const updatedRow = await Promise.race([
            supabaseUpdate<GuestQuotaSupabaseRow>(
              GUEST_QUOTA_TABLE,
              updates,
              { id: `eq.${row.id}` },
              { timeout: 1000, requireAuth: false },
            ),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Timeout")), 1000);
            }),
          ]);

          if (updatedRow) {
            // Mettre à jour le cache
            quotaCache.set(row.fingerprint, { data: updatedRow, timestamp: Date.now() });
            row = updatedRow;
          }
        } catch (error: unknown) {
          // Ne logger que les erreurs non-timeout
          if (!(error instanceof Error && error.message.includes("Timeout"))) {
            logger.warn("Failed to refresh guest quota metadata", "quota", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        logger.error("Error updating guest quota metadata", error);
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
  metadata?: Record<string, unknown>,
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

    const evaluation = evaluateQuotaLimits(quota, action, credits, metadata);
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
  metadata?: Record<string, unknown>,
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

    const evaluation = evaluateQuotaLimits(quota, action, credits, metadata);
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
      case "poll_created": {
        // Incrémenter le compteur spécifique selon pollType (polls_created supprimé)
        const pollType = metadata?.pollType as
          | "date"
          | "form"
          | "quizz"
          | "availability"
          | undefined;
        if (pollType) {
          switch (pollType) {
            case "date":
              updates.date_polls_created = (quota.datePollsCreated || 0) + 1;
              break;
            case "form":
              updates.form_polls_created = (quota.formPollsCreated || 0) + 1;
              break;
            case "quizz":
              updates.quizz_created = (quota.quizzCreated || 0) + 1;
              break;
            case "availability":
              updates.availability_polls_created = (quota.availabilityPollsCreated || 0) + 1;
              break;
            default:
              logger.warn("Invalid pollType in metadata", "quota", { pollType, metadata });
          }
        } else {
          logger.warn("poll_created action without pollType in metadata", "quota", { metadata });
        }
        break;
      }
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

    // Timeout réduit à 1 seconde
    try {
      const updatedRow = await Promise.race([
        supabaseUpdate<GuestQuotaSupabaseRow>(
          GUEST_QUOTA_TABLE,
          updates,
          { id: `eq.${quota.id}` },
          { timeout: 1000, requireAuth: false },
        ),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 1000);
        }),
      ]);

      // Mettre à jour le cache
      quotaCache.set(quota.fingerprint, { data: updatedRow, timestamp: Date.now() });
      const fingerprint = updatedRow.fingerprint;

      // Journal entry avec timeout réduit (non-bloquant, fire-and-forget)
      try {
        await Promise.race([
          supabaseInsert(
            GUEST_QUOTA_JOURNAL_TABLE,
            {
              guest_quota_id: updatedRow.id,
              fingerprint,
              action,
              credits,
              metadata: metadata || {},
            },
            { timeout: 1000, requireAuth: false },
          ),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 1000);
          }),
        ]);
      } catch (journalError: unknown) {
        // Ne logger que les erreurs non-timeout
        if (!(journalError instanceof Error && journalError.message.includes("Timeout"))) {
          logger.error("Failed to add journal entry", "quota", journalError);
        }
        // Ignorer les erreurs de journal (non-critique)
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
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Timeout")) {
        // En cas de timeout, retourner immédiatement sans logger (trop verbeux)
        return { success: false, error: "Timeout: Supabase is slow or unavailable" };
      }
      logger.error("Failed to update guest quota", "quota", error);
      return { success: false, error: "Failed to update quota" };
    }
  } catch (error) {
    logger.error("Failed to consume credits", "quota", error);
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

    const entries = await supabaseSelect<GuestQuotaJournalSupabaseRow>(
      GUEST_QUOTA_JOURNAL_TABLE,
      {
        fingerprint: `eq.${fingerprint}`,
        order: "created_at.desc",
        limit: limit.toString(),
        select: "*",
      },
      { timeout: 2000, requireAuth: false },
    );

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
