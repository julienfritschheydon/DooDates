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

const STORAGE_KEY = "doodates_quota_consumed";
const JOURNAL_KEY = "doodates_quota_journal";

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
    [key: string]: any;
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
async function getSubscriptionStartDate(userId: string | null | undefined): Promise<Date | null> {
  if (!userId || userId === "guest") return null;

  try {
    const { supabase } = await import("./supabase");
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_expires_at, created_at")
      .eq("id", userId)
      .single();

    if (profile?.subscription_expires_at) {
      // Utiliser la date d'abonnement si disponible
      return new Date(profile.subscription_expires_at);
    }

    // Sinon, utiliser la date de création du compte comme date de début
    if (profile?.created_at) {
      return new Date(profile.created_at);
    }

    return null;
  } catch (error) {
    logger.debug("Impossible de récupérer la date d'abonnement", "quota", { error });
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
 * Obtenir les données de quota consommé pour l'utilisateur actuel
 */
export async function getQuotaConsumed(
  userId: string | null | undefined,
): Promise<QuotaConsumedData> {
  try {
    const storageData = localStorage.getItem(STORAGE_KEY);
    const currentUserId = userId || getCurrentUserId();

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
export function getConsumptionJournal(
  userId: string | null | undefined,
  limit: number = 100,
): CreditJournalEntry[] {
  try {
    const journalData = localStorage.getItem(JOURNAL_KEY);
    if (!journalData) return [];

    const journal: CreditJournalEntry[] = JSON.parse(journalData);
    const currentUserId = userId || getCurrentUserId();

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
    const currentUserId = userId || getCurrentUserId();

    // Pour les guests, utiliser le service Supabase sécurisé
    if (!userId || userId === "guest") {
      const result = await consumeGuestCredits(action, credits, metadata);
      if (!result.success) {
        logger.warn("Guest credit consumption failed", "quota", {
          action,
          credits,
          error: result.error,
        });
      }
      return;
    }

    // Pour les utilisateurs authentifiés, utiliser localStorage
    const storageData = localStorage.getItem(STORAGE_KEY);
    const allData: AllQuotaData = storageData ? JSON.parse(storageData) : {};

    // Obtenir les données actuelles (avec vérification de reset)
    const currentData = await getQuotaConsumed(userId);
    const userData = allData[currentUserId] || currentData;

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
    if (userId && userId !== "guest" && !userData.subscriptionStartDate) {
      const subscriptionStart = await getSubscriptionStartDate(userId);
      if (subscriptionStart) {
        userData.subscriptionStartDate = subscriptionStart.toISOString();
        userData.lastResetDate = calculateNextResetDate(subscriptionStart).toISOString();
      }
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

    logger.debug("Crédits consommés", "quota", {
      action,
      credits,
      total: userData.totalCreditsConsumed,
      userId: currentUserId,
    });
  } catch (error) {
    logger.error("Erreur lors de la consommation de crédits", error);
  }
}

/**
 * Incrémenter le compteur de conversations créées
 */
export function incrementConversationCreated(
  userId: string | null | undefined,
  conversationId?: string,
): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, 1, "conversation_created", { conversationId }).catch((error) => {
    logger.error("Erreur lors de l'incrémentation conversation", error);
  });
}

/**
 * Incrémenter le compteur de polls créés
 */
export function incrementPollCreated(userId: string | null | undefined, pollId?: string): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, 1, "poll_created", { pollId }).catch((error) => {
    logger.error("Erreur lors de l'incrémentation poll", error);
  });
}

/**
 * Consommer des crédits pour un message IA
 */
export function consumeAiMessageCredits(
  userId: string | null | undefined,
  conversationId?: string,
): void {
  // Fire and forget - ne pas bloquer l'exécution
  consumeCredits(userId, 1, "ai_message", { conversationId }).catch((error) => {
    logger.error("Erreur lors de la consommation message IA", error);
  });
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
