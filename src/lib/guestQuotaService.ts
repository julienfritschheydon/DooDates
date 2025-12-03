/**
 * Guest Quota Service
 * Gère les quotas des utilisateurs guests via l'Edge Function quota-tracking
 *
 * Sécurité:
 * - Fingerprinting navigateur pour identifier les guests
 * - Validation serveur (Edge Function)
 * - Plus d'accès direct à la base de données
 */

import { getCachedFingerprint, getBrowserMetadata } from "./browserFingerprint";
import { logger } from "./logger";
import { isE2ETestingEnvironment } from "./e2e-detection";
import type { CreditActionType } from "./quotaTracking";
import { ErrorFactory } from "./error-handling";

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
  CONVERSATIONS: 5,
  POLLS: 5,
  AI_MESSAGES: 20,
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
} as const;

// Configuration object for testing purposes
export const GuestQuotaConfig = {
  bypass: true, // Default to true for safety/backward compatibility
  forceEnable: false, // Set to true in tests to force logic execution
};

function shouldBypassGuestQuota(): boolean {
  // Allow tests to force enable the logic even in E2E/Mock environments
  if (GuestQuotaConfig.forceEnable) {
    return false;
  }

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
    // Ignore localStorage errors
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const isMockedSupabase = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");

  if (isMockedSupabase) {
    logger.debug("Mock Supabase URL detected, bypassing guest quota", "quota");
  }

  return isMockedSupabase;
}

// ============================================================================
// EDGE FUNCTION CALLS
// ============================================================================

async function callQuotaEdgeFunction(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<any> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const functionUrl = `${supabaseUrl}/functions/v1/quota-tracking`;

  const fingerprint = await getCachedFingerprint();

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      // Pas d'Authorization header pour les guests, l'Edge Function utilisera le fingerprint
    },
    body: JSON.stringify({
      endpoint,
      fingerprint,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw ErrorFactory.api(errorData.error || `Edge Function error: ${response.status}`, "Erreur de communication avec le serveur");
  }

  return await response.json();
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Récupère ou crée le quota guest (via checkQuota)
 */
export async function getOrCreateGuestQuota(): Promise<GuestQuotaData | null> {
  if (shouldBypassGuestQuota()) {
    return null;
  }

  try {
    const result = await callQuotaEdgeFunction("checkQuota", {
      action: "other",
      credits: 0,
    });

    return result.currentQuota || null;
  } catch (error) {
    logger.error("Failed to get guest quota", "quota", error);
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
  if (shouldBypassGuestQuota()) {
    return { allowed: true };
  }

  try {
    const result = await callQuotaEdgeFunction("checkQuota", {
      action,
      credits,
    });

    return {
      allowed: result.allowed,
      reason: result.reason,
      currentQuota: result.currentQuota,
    };
  } catch (error) {
    logger.error("Failed to check credit consumption", "quota", error);
    // Fail safe: allow if check fails (to avoid blocking users on errors)
    // OR deny if strict security is needed. Here we choose to be permissive on error.
    return { allowed: true };
  }
}

/**
 * Consomme des crédits via l'Edge Function
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
    const browserMetadata = getBrowserMetadata();
    const mergedMetadata = { ...browserMetadata, ...metadata };

    const result = await callQuotaEdgeFunction("consumeCredits", {
      action,
      credits,
      metadata: mergedMetadata,
    });

    return {
      success: true,
      quota: result.quota,
    };
  } catch (error) {
    logger.error("Failed to consume credits", "quota", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    };
  }
}

/**
 * Récupère le journal de consommation
 */
export async function getGuestQuotaJournal(limit: number = 100): Promise<GuestQuotaJournalEntry[]> {
  if (shouldBypassGuestQuota()) {
    return [];
  }

  try {
    const result = await callQuotaEdgeFunction("getJournal", {
      limit,
    });

    return result.journal || [];
  } catch (error) {
    logger.error("Failed to get journal", "quota", error);
    return [];
  }
}

/**
 * Récupère les limites pour affichage UI
 */
export function getGuestLimits() {
  return { ...GUEST_LIMITS };
}

// Fonction pour vider le cache (utilisée dans les tests - no-op maintenant)
export function clearQuotaCache(): void {
  // No-op as we don't cache locally anymore
}
