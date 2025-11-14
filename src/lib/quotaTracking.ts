/**
 * Système de tracking des crédits consommés (créations et actions IA)
 *
 * Les crédits consommés ne se remboursent jamais (sauf reset mensuel pour auth users)
 * - 1 conversation créée = 1 crédit consommé
 * - 1 poll créé = 1 crédit consommé
 * - 1 message IA = 1 crédit consommé
 * - 1 query analytics IA = 1 crédit consommé
 * - 1 simulation complète = 5 crédits consommés
 *
 * Même si l'utilisateur supprime ses conversations/polls, les crédits restent consommés.
 */

import { getCurrentUserId } from "./pollStorage";
import { logger } from "./logger";
import { consumeGuestCredits } from "./guestQuotaService";
import { ErrorFactory, logError } from "./error-handling";
import { isE2ETestingEnvironment } from "./e2e-detection";
import { callSupabaseEdgeFunction } from "./supabaseApi";

const STORAGE_KEY = "doodates_quota_consumed";
const JOURNAL_KEY = "doodates_quota_journal";

// Cache pour éviter les appels répétés à l'Edge Function
const quotaCache = new Map<string, { data: QuotaConsumedData; timestamp: number }>();
const QUOTA_CACHE_TTL = 5000; // 5 secondes

export type CreditActionType =
  | "conversation_created"
  | "poll_created"
  | "ai_message"
  | "analytics_query"
  | "simulation"
  | "other";

export interface CreditJournalEntry {
  id: string;
  timestamp: string;
  action: CreditActionType;
  credits: number;
  userId: string;
  metadata?: {
    conversationId?: string;
    pollId?: string;
    simulationId?: string;
    analyticsQuery?: string;
    [key: string]: unknown;
  };
}

interface QuotaConsumedData {
  conversationsCreated: number;
  pollsCreated: number;
  aiMessages: number;
  analyticsQueries: number;
  simulations: number;
  totalCreditsConsumed: number; // Total de tous les crédits
  subscriptionStartDate?: string; // Date de début d'abonnement (pour reset mensuel)
  lastResetDate?: string; // Date du dernier reset
  userId: string; // "guest" ou user.id
}

interface AllQuotaData {
  [userId: string]: QuotaConsumedData;
}

/**
 * Obtenir la date de début d'abonnement depuis le profil utilisateur
 */
// Cache pour les dates d'abonnement (évite les appels Supabase répétés)
const subscriptionDateCache = new Map<string, { date: Date | null; timestamp: number }>();
const SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSubscriptionStartDate(userId: string | null | undefined): Promise<Date | null> {
  if (!userId || userId === "guest") return null;

  // Vérifier le cache d'abord
  const cached = subscriptionDateCache.get(userId);
  if (cached && Date.now() - cached.timestamp < SUBSCRIPTION_CACHE_TTL) {
    return cached.date;
  }

  try {
    const { supabase } = await import("./supabase");

    // Timeout de 2 secondes pour éviter de bloquer
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });

    const fetchPromise = supabase
      .from("profiles")
      .select("subscription_expires_at, created_at")
      .eq("id", userId)
      .single();

    const result = await Promise.race([
      fetchPromise.then(({ data: profile }) => {
        if (profile?.subscription_expires_at) {
          return new Date(profile.subscription_expires_at);
        }
        if (profile?.created_at) {
          return new Date(profile.created_at);
        }
        return null;
      }),
      timeoutPromise,
    ]);

    // Mettre en cache (même si timeout, on cache null pour éviter les appels répétés)
    subscriptionDateCache.set(userId, { date: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    logger.debug("Impossible de récupérer la date d'abonnement", "quota", { error });
    // Mettre null en cache pour éviter les appels répétés en cas d'erreur
    subscriptionDateCache.set(userId, { date: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Calculer la prochaine date de reset basée sur la date d'abonnement
 */
function calculateNextResetDate(subscriptionStartDate: Date | null): Date {
  if (!subscriptionStartDate) {
    // Par défaut, reset le 1er du mois suivant
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    return nextReset;
  }

  // Calculer le reset mensuel basé sur la date d'abonnement
  const now = new Date();
  const subscriptionDay = subscriptionStartDate.getDate();
  const subscriptionMonth = subscriptionStartDate.getMonth();
  const subscriptionYear = subscriptionStartDate.getFullYear();

  // Prochaine date de reset = même jour du mois suivant
  let nextReset = new Date(subscriptionYear, subscriptionMonth, subscriptionDay);

  // Si on est déjà passé ce mois, prendre le mois suivant
  if (nextReset <= now) {
    nextReset = new Date(subscriptionYear, subscriptionMonth + 1, subscriptionDay);
  }

  return nextReset;
}

/**
 * Appeler l'Edge Function pour récupérer le quota depuis Supabase
 */
async function fetchQuotaFromServer(userId: string): Promise<QuotaConsumedData | null> {
  try {
    const { supabase } = await import("./supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return null;
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/quota-tracking`;

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });

    const fetchPromise = fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({
        endpoint: "checkQuota",
        action: "other",
        credits: 0,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      if (!data.success || !data.currentQuota) {
        return null;
      }
      return {
        conversationsCreated: data.currentQuota.conversationsCreated || 0,
        pollsCreated: data.currentQuota.pollsCreated || 0,
        aiMessages: data.currentQuota.aiMessages || 0,
        analyticsQueries: data.currentQuota.analyticsQueries || 0,
        simulations: data.currentQuota.simulations || 0,
        totalCreditsConsumed: data.currentQuota.totalCreditsConsumed || 0,
        subscriptionStartDate: data.currentQuota.subscriptionStartDate,
        lastResetDate: data.currentQuota.lastResetDate,
        userId: userId,
      };
    });

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (error) {
    logger.debug("Erreur récupération quota serveur", "quota", { error });
    return null;
  }
}

/**
 * Obtenir les données de quota consommé pour l'utilisateur actuel
 */
export async function getQuotaConsumed(
  userId: string | null | undefined,
): Promise<QuotaConsumedData> {
  try {
    const currentUserId = userId || getCurrentUserId();
    const isGuest = !userId || userId === "guest";
    const isE2E =
      isE2ETestingEnvironment() ||
      (typeof window !== "undefined" &&
        ((window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true ||
          localStorage.getItem("e2e") === "1" ||
          localStorage.getItem("dev-local-mode") === "1"));

    // Pour les utilisateurs authentifiés, essayer de récupérer depuis le serveur
    if (!isGuest && !isE2E && userId) {
      // Vérifier le cache d'abord
      const cached = quotaCache.get(userId);
      if (cached && Date.now() - cached.timestamp < QUOTA_CACHE_TTL) {
        return cached.data;
      }

      // Migrer automatiquement localStorage → Supabase si nécessaire (une seule fois)
      const migrationKey = `quota_migrated_${userId}`;
      if (!localStorage.getItem(migrationKey)) {
        try {
          // Migration inline pour éviter problème de chemin
          const STORAGE_KEY_MIG = "doodates_quota_consumed";
          const JOURNAL_KEY_MIG = "doodates_quota_journal";
          const storageDataMig = localStorage.getItem(STORAGE_KEY_MIG);
          const journalDataMig = localStorage.getItem(JOURNAL_KEY_MIG);

          if (storageDataMig) {
            const allDataMig: AllQuotaData = JSON.parse(storageDataMig);
            const userDataMig = allDataMig[userId];

            if (userDataMig) {
              // Appeler Edge Function pour créer/mettre à jour le quota
              const { supabase: supabaseMig } = await import("./supabase");
              const {
                data: { session },
              } = await supabaseMig.auth.getSession();

              if (session?.access_token) {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (supabaseUrl) {
                  // Créer le quota via Edge Function (consumeCredits avec 0 crédits pour juste créer)
                  await fetch(`${supabaseUrl}/functions/v1/quota-tracking`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session.access_token}`,
                      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
                    },
                    body: JSON.stringify({
                      endpoint: "consumeCredits",
                      action: "other",
                      credits: 0,
                      metadata: { migrated: true },
                    }),
                  }).catch(() => {
                    // Ignorer les erreurs de migration
                  });

                  // Marquer comme migré
                  localStorage.setItem(migrationKey, "true");
                }
              }
            }
          }
        } catch (error) {
          logger.debug("Erreur migration automatique", "quota", { error });
          // Continuer même si migration échoue
        }
      }

      const serverQuota = await fetchQuotaFromServer(userId);
      if (serverQuota) {
        quotaCache.set(userId, { data: serverQuota, timestamp: Date.now() });
        return serverQuota;
      }
      // Si serveur indisponible, fallback localStorage
    }

    // Fallback localStorage (pour guests, E2E, ou si serveur indisponible)
    const storageData = localStorage.getItem(STORAGE_KEY);

    if (!storageData) {
      const subscriptionStart = await getSubscriptionStartDate(userId);
      return {
        conversationsCreated: 0,
        pollsCreated: 0,
        aiMessages: 0,
        analyticsQueries: 0,
        simulations: 0,
        totalCreditsConsumed: 0,
        subscriptionStartDate: subscriptionStart?.toISOString(),
        userId: currentUserId,
      };
    }

    const allData: AllQuotaData = JSON.parse(storageData);
    let userData = allData[currentUserId];

    if (!userData) {
      const subscriptionStart = await getSubscriptionStartDate(userId);
      userData = {
        conversationsCreated: 0,
        pollsCreated: 0,
        aiMessages: 0,
        analyticsQueries: 0,
        simulations: 0,
        totalCreditsConsumed: 0,
        subscriptionStartDate: subscriptionStart?.toISOString(),
        userId: currentUserId,
      };
    }

    // Vérifier reset mensuel pour auth users basé sur la date d'abonnement
    if (userId && userId !== "guest") {
      const subscriptionStart = userData.subscriptionStartDate
        ? new Date(userData.subscriptionStartDate)
        : await getSubscriptionStartDate(userId);

      if (subscriptionStart) {
        const nextReset = calculateNextResetDate(subscriptionStart);
        const now = new Date();

        // Si on a dépassé la date de reset, réinitialiser
        if (!userData.lastResetDate || new Date(userData.lastResetDate) < now) {
          if (now >= nextReset) {
            const resetData: QuotaConsumedData = {
              conversationsCreated: 0,
              pollsCreated: 0,
              aiMessages: 0,
              analyticsQueries: 0,
              simulations: 0,
              totalCreditsConsumed: 0,
              subscriptionStartDate: subscriptionStart.toISOString(),
              lastResetDate: calculateNextResetDate(subscriptionStart).toISOString(),
              userId: userId,
            };

            // Sauvegarder le reset
            allData[userId] = resetData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));

            return resetData;
          }
        }
      }
    }

    return userData;
  } catch (error) {
    logger.error("Erreur lors de la lecture du quota consommé", error);
    return {
      conversationsCreated: 0,
      pollsCreated: 0,
      aiMessages: 0,
      analyticsQueries: 0,
      simulations: 0,
      totalCreditsConsumed: 0,
      userId: userId || "guest",
    };
  }
}

/**
 * Ajouter une entrée au journal de consommation
 */
function addJournalEntry(entry: Omit<CreditJournalEntry, "id" | "timestamp">): void {
  try {
    const journalData = localStorage.getItem(JOURNAL_KEY);
    const journal: CreditJournalEntry[] = journalData ? JSON.parse(journalData) : [];

    const newEntry: CreditJournalEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    journal.push(newEntry);

    // Garder seulement les 1000 dernières entrées pour éviter l'explosion du localStorage
    if (journal.length > 1000) {
      journal.splice(0, journal.length - 1000);
    }

    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));

    logger.debug("Entrée ajoutée au journal de consommation", "quota", {
      action: entry.action,
      credits: entry.credits,
      userId: entry.userId,
    });
  } catch (error) {
    logger.error("Erreur lors de l'ajout au journal", error);
  }
}

/**
 * Obtenir le journal de consommation pour un utilisateur
 */
export async function getConsumptionJournal(
  userId: string | null | undefined,
  limit: number = 100,
): Promise<CreditJournalEntry[]> {
  try {
    const currentUserId = userId || getCurrentUserId();
    const isGuest = !userId || userId === "guest";
    const isE2E =
      isE2ETestingEnvironment() ||
      (typeof window !== "undefined" &&
        ((window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true ||
          localStorage.getItem("e2e") === "1" ||
          localStorage.getItem("dev-local-mode") === "1"));

    // Pour les utilisateurs authentifiés, essayer de récupérer depuis le serveur
    if (!isGuest && !isE2E && userId) {
      try {
        const { supabase } = await import("./supabase");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (supabaseUrl) {
            const edgeFunctionUrl = `${supabaseUrl}/functions/v1/quota-tracking`;

            const timeoutPromise = new Promise<CreditJournalEntry[]>((resolve) => {
              setTimeout(() => resolve([]), 2000);
            });

            const fetchPromise = fetch(edgeFunctionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
              },
              body: JSON.stringify({
                endpoint: "getJournal",
                limit,
              }),
            }).then(async (res) => {
              if (!res.ok) {
                return [];
              }
              const data = await res.json();
              if (!data.success || !data.journal) {
                return [];
              }
              return data.journal as CreditJournalEntry[];
            });

            const result = await Promise.race([fetchPromise, timeoutPromise]);
            if (result.length > 0) {
              return result;
            }
          }
        }
      } catch (error) {
        logger.debug("Erreur récupération journal serveur", "quota", { error });
        // Fallback localStorage
      }
    }

    // Fallback localStorage
    const journalData = localStorage.getItem(JOURNAL_KEY);
    if (!journalData) return [];

    const journal: CreditJournalEntry[] = JSON.parse(journalData);

    // Filtrer par utilisateur et trier par date (plus récent en premier)
    const userJournal = journal
      .filter((entry) => entry.userId === currentUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return userJournal;
  } catch (error) {
    logger.error("Erreur lors de la lecture du journal", error);
    return [];
  }
}

/**
 * Fonction générique pour consommer des crédits
 */
async function consumeCredits(
  userId: string | null | undefined,
  credits: number,
  action: CreditActionType,
  metadata?: CreditJournalEntry["metadata"],
): Promise<void> {
  try {
    // Pour les guests, utiliser "guest" comme userId pour le tracking
    // getCurrentUserId() retourne un deviceId, mais on veut "guest" pour le tracking des crédits
    const isGuest = !userId || userId === "guest";
    const currentUserId = userId || "guest";
    const isE2E =
      isE2ETestingEnvironment() ||
      (typeof window !== "undefined" &&
        ((window as Window & { __IS_E2E_TESTING__?: boolean }).__IS_E2E_TESTING__ === true ||
          localStorage.getItem("e2e") === "1" ||
          localStorage.getItem("dev-local-mode") === "1"));

    // Pour les guests, utiliser le service Supabase sécurisé
    // SAUF en mode E2E où on utilise localStorage directement
    if (isGuest && !isE2E) {
      try {
        // Timeout réduit à 2 secondes (les timeouts internes sont déjà à 1s)
        const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
          setTimeout(
            () => resolve({ success: false, error: "Timeout: Supabase is slow or unavailable" }),
            2000,
          );
        });

        const consumePromise = consumeGuestCredits(action, credits, metadata);
        const result = await Promise.race([consumePromise, timeoutPromise]);

        if (!result.success) {
          // Si c'est un timeout, permettre l'action mais logger un avertissement (seulement une fois)
          if (result.error?.includes("Timeout")) {
            // Ne logger qu'une fois toutes les 10 secondes pour éviter le spam
            const lastLogKey = `quota_timeout_${action}`;
            const lastLog =
              (globalThis as typeof globalThis & { [key: string]: number })[lastLogKey] || 0;
            if (Date.now() - lastLog > 10000) {
              logger.warn(
                "Guest credit consumption timeout - allowing action but quota may be inaccurate",
                "quota",
                {
                  action,
                  credits,
                  error: result.error,
                },
              );
              (globalThis as typeof globalThis & { [key: string]: number })[lastLogKey] =
                Date.now();
            }
            // Continuer avec localStorage pour permettre l'action de continuer
          } else {
            // Pour les vraies erreurs de quota (limite atteinte), bloquer l'action
            logger.warn("Guest credit consumption failed", "quota", {
              action,
              credits,
              error: result.error,
            });
            throw ErrorFactory.validation(
              result.error || "Credit limit reached",
              "Limite de crédits atteinte",
            );
          }
        } else {
          // En mode E2E, on continue pour mettre à jour localStorage
          // Sinon, on retourne car consumeGuestCredits a déjà géré la logique serveur
          if (!isE2E) {
            return;
          }
        }
      } catch (error) {
        // Si c'est une erreur de validation (quota atteint), la propager
        if (
          error instanceof Error &&
          (error.message.includes("limit") || error.message.includes("Limite"))
        ) {
          throw error;
        }
        // Pour les autres erreurs (timeout, réseau), continuer silencieusement avec localStorage
        // Ne logger qu'une fois toutes les 10 secondes
        const lastLogKey = `quota_error_${action}`;
        const lastLog =
          (globalThis as typeof globalThis & { [key: string]: number })[lastLogKey] || 0;
        if (Date.now() - lastLog > 10000) {
          logger.warn(
            "Guest credit consumption error - allowing action but quota may be inaccurate",
            "quota",
            {
              action,
              credits,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          (globalThis as typeof globalThis & { [key: string]: number })[lastLogKey] = Date.now();
        }
        // Continuer avec localStorage pour permettre l'action de continuer
      }
    }

    // Pour les utilisateurs authentifiés, utiliser Edge Function (sauf E2E)
    if (!isGuest && !isE2E && userId) {
      console.log(`[quotaTracking] 🔒 consumeCredits - Mode auth, appel Edge Function...`, {
        userId,
        action,
        credits,
      });

      try {
        console.log(`[quotaTracking] 🔒 Appel Edge Function pour consommation quota...`);
        const requestBody = {
          endpoint: "consumeCredits",
          action,
          credits,
          metadata: metadata || {},
        };
        console.log(`[quotaTracking] 🔒 Request body:`, JSON.stringify(requestBody, null, 2));

        const fetchStartTime = Date.now();
        const result = await callSupabaseEdgeFunction<{
          success: boolean;
          quota?: QuotaConsumedData;
          error?: string;
        }>("quota-tracking", requestBody, { timeout: 2000 });
        const fetchDuration = Date.now() - fetchStartTime;

        console.log(`[quotaTracking] 🔒 Réponse Edge Function reçue (${fetchDuration}ms):`, {
          success: result.success,
          error: result.error,
          quota: result.quota
            ? {
                aiMessages: result.quota.aiMessages,
                totalCreditsConsumed: result.quota.totalCreditsConsumed,
              }
            : null,
        });

        if (result.success) {
          console.log(`[quotaTracking] ✅ Crédits consommés via serveur`);
          // Invalider le cache
          quotaCache.delete(userId);
          logger.debug("Crédits consommés via serveur", "quota", {
            action,
            credits,
            total: result.quota?.totalCreditsConsumed,
            userId,
          });
          return; // Succès, on sort
        } else {
          // Erreur, fallback localStorage
          console.log(`[quotaTracking] ⚠️ Edge Function erreur, fallback localStorage`);
          logger.warn("Edge Function erreur, fallback localStorage", "quota", {
            error: result.error,
          });
        }
      } catch (error) {
        logError(
          ErrorFactory.storage(
            "Erreur consommation serveur",
            "Une erreur est survenue lors de la consommation des crédits",
          ),
          { error },
        );
        // Si c'est une erreur de validation (quota atteint), la propager
        if (
          error instanceof Error &&
          (error.message.includes("limit") ||
            error.message.includes("Limite") ||
            error.message.includes("reached"))
        ) {
          throw error;
        }
        // Pour les autres erreurs (timeout, réseau), fallback localStorage
        logger.warn("Erreur consommation serveur, fallback localStorage", "quota", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(`[quotaTracking] 💾 Fallback localStorage...`);
    console.log(`[quotaTracking] 💾 Raison fallback:`, {
      isGuest,
      isE2E,
      hasUserId: !!userId,
      hasSession: false,
    });

    // Fallback localStorage (pour guests, E2E, ou si serveur indisponible)
    const storageData = localStorage.getItem(STORAGE_KEY);
    const allData: AllQuotaData = storageData ? JSON.parse(storageData) : {};

    // En fallback, utiliser directement localStorage sans appeler getQuotaConsumed
    // (qui pourrait bloquer avec getSession()). On utilisera les données existantes
    // ou créer des données par défaut.
    let userData = allData[currentUserId];

    if (!userData) {
      // Créer des données par défaut sans appeler getQuotaConsumed (qui pourrait bloquer)
      console.log(`[quotaTracking] 💾 Création données par défaut (pas d'appel getQuotaConsumed)`);
      userData = {
        conversationsCreated: 0,
        pollsCreated: 0,
        aiMessages: 0,
        analyticsQueries: 0,
        simulations: 0,
        totalCreditsConsumed: 0,
        userId: currentUserId,
      };
    }

    // Mettre à jour les compteurs selon le type d'action
    switch (action) {
      case "conversation_created":
        userData.conversationsCreated = (userData.conversationsCreated || 0) + credits;
        break;
      case "poll_created":
        userData.pollsCreated = (userData.pollsCreated || 0) + credits;
        break;
      case "ai_message":
        userData.aiMessages = (userData.aiMessages || 0) + credits;
        break;
      case "analytics_query":
        userData.analyticsQueries = (userData.analyticsQueries || 0) + credits;
        break;
      case "simulation":
        userData.simulations = (userData.simulations || 0) + credits;
        break;
    }

    // Mettre à jour le total
    userData.totalCreditsConsumed = (userData.totalCreditsConsumed || 0) + credits;
    userData.userId = currentUserId;

    // Mettre à jour la date d'abonnement si nécessaire
    // En fallback localStorage, éviter les appels bloquants - on utilisera la date existante ou null
    if (userId && userId !== "guest" && !userData.subscriptionStartDate) {
      // Ne pas appeler getSubscriptionStartDate en fallback car cela pourrait bloquer
      // La date sera mise à jour lors du prochain appel réussi au serveur
      console.log(`[quotaTracking] 💾 Skip getSubscriptionStartDate en fallback (évite blocage)`);
    }

    allData[currentUserId] = userData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));

    // Ajouter au journal
    addJournalEntry({
      action,
      credits,
      userId: currentUserId,
      metadata,
    });

    logger.debug("Crédits consommés (localStorage)", "quota", {
      action,
      credits,
      total: userData.totalCreditsConsumed,
      userId: currentUserId,
    });
  } catch (error) {
    logger.error("Erreur lors de la consommation de crédits", error);
    throw error; // ✅ PROPAGER l'erreur pour que le try-catch de useMessageSender la capte
  }
}

/**
 * Incrémenter le compteur de conversations créées
 * BLOQUANT : Throw une erreur si la limite est atteinte
 */
export async function incrementConversationCreated(
  userId: string | null | undefined,
  conversationId?: string,
): Promise<void> {
  await consumeCredits(userId, 1, "conversation_created", { conversationId });
}

/**
 * Incrémenter le compteur de polls créés
 * BLOQUANT : Throw une erreur si la limite est atteinte
 */
export async function incrementPollCreated(
  userId: string | null | undefined,
  pollId?: string,
): Promise<void> {
  // Normaliser userId : si c'est un deviceId (commence par "dev-"), c'est un invité
  // On le convertit en null pour que consumeCredits le traite comme "guest"
  let normalizedUserId: string | null | undefined = userId;
  if (userId && userId.startsWith("dev-")) {
    normalizedUserId = null; // deviceId = invité = null pour le tracking
  }
  await consumeCredits(normalizedUserId, 1, "poll_created", { pollId });
}

/**
 * Consommer des crédits pour un message IA
 * BLOQUANT : Throw une erreur si la limite est atteinte
 */
export async function consumeAiMessageCredits(
  userId: string | null | undefined,
  conversationId?: string,
): Promise<void> {
  await consumeCredits(userId, 1, "ai_message", { conversationId });
}

/**
 * Consommer des crédits pour une query analytics
 */
export function consumeAnalyticsCredits(
  userId: string | null | undefined,
  pollId?: string,
  query?: string,
): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, 1, "analytics_query", { pollId, analyticsQuery: query }).catch((error) => {
    logger.error("Erreur lors de la consommation analytics", error);
  });
}

/**
 * Consommer des crédits pour une simulation (5 crédits selon la doc)
 */
export function consumeSimulationCredits(
  userId: string | null | undefined,
  pollId?: string,
  simulationId?: string,
): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, 5, "simulation", { pollId, simulationId }).catch((error) => {
    logger.error("Erreur lors de la consommation simulation", error);
  });
}

/**
 * Consommer des crédits pour une action personnalisée
 */
export function consumeCustomCredits(
  userId: string | null | undefined,
  credits: number,
  action: CreditActionType,
  metadata?: CreditJournalEntry["metadata"],
): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, credits, action, metadata).catch((error) => {
    logger.error("Erreur lors de la consommation crédits personnalisés", error);
  });
}

/**
 * Réinitialiser les quotas consommés (pour tests ou admin)
 */
export function resetQuotaConsumed(userId: string | null | undefined): void {
  try {
    const storageData = localStorage.getItem(STORAGE_KEY);
    const allData: AllQuotaData = storageData ? JSON.parse(storageData) : {};
    const currentUserId = userId || getCurrentUserId();

    delete allData[currentUserId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));

    logger.info("Quota consommé réinitialisé", "quota", { userId: currentUserId });
  } catch (error) {
    logger.error("Erreur lors de la réinitialisation du quota", error);
  }
}
