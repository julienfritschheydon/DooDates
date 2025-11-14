/**
 * Service d'apprentissage des préférences clients
 * Phase 3 : Apprentissage préférences
 *
 * Analyse les sélections historiques de créneaux par les CLIENTS pour apprendre leurs préférences :
 * - Jours préférés des clients
 * - Heures préférées des clients
 * - Patterns de sélection des clients
 *
 * Les préférences sont regroupées par professionnel (chaque professionnel a ses propres clients avec leurs préférences).
 * Ces préférences sont utilisées pour mieux proposer des créneaux qu'ils vont accepter.
 */

import { logger } from "@/lib/logger";

export interface ClientPreferences {
  professionalId: string; // ID du professionnel (pour regrouper les préférences de ses clients)
  preferredDays: Record<string, number>; // Jour de la semaine → nombre de sélections par les clients
  preferredHours: Record<string, number>; // Heure (HH:MM) → nombre de sélections par les clients
  preferredTimeRanges: Array<{ start: string; end: string; count: number }>; // Plages horaires préférées par les clients
  lastUpdated: number; // Timestamp
}

export interface SlotSelection {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  selectedAt: number; // Timestamp
}

const STORAGE_KEY_PREFIX = "doodates_user_preferences_";
const MAX_HISTORY_DAYS = 90; // Conserver 90 jours d'historique

/**
 * Enregistrer une sélection de créneau par un CLIENT pour apprentissage des préférences clients
 * @param professionalId ID du professionnel (pour regrouper les préférences de ses clients)
 * @param slot Créneau sélectionné par le client
 */
export function recordSlotSelection(
  professionalId: string,
  slot: { date: string; start: string; end: string },
): void {
  try {
    const selection: SlotSelection = {
      ...slot,
      selectedAt: Date.now(),
    };

    // Récupérer l'historique des sélections des clients de ce professionnel
    const history = getSelectionHistory(professionalId);
    history.push(selection);

    // Nettoyer l'historique (garder seulement les 90 derniers jours)
    const cutoffTime = Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;
    const cleanedHistory = history.filter((s) => s.selectedAt >= cutoffTime);

    // Sauvegarder l'historique nettoyé
    saveSelectionHistory(professionalId, cleanedHistory);

    // Mettre à jour les préférences clients pour ce professionnel
    updatePreferences(professionalId, cleanedHistory);

    logger.info("Sélection de créneau client enregistrée", "userPreferences", {
      professionalId,
      slot,
    });
  } catch (error) {
    logger.warn("Erreur lors de l'enregistrement de la sélection", "userPreferences", error);
  }
}

/**
 * Obtenir les préférences clients apprises pour un professionnel
 * @param professionalId ID du professionnel
 * @returns Préférences des clients de ce professionnel (jours/heures qu'ils choisissent le plus souvent)
 */
export function getClientPreferences(professionalId: string): ClientPreferences | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${professionalId}`;
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as ClientPreferences;
  } catch (error) {
    logger.warn("Erreur lors de la lecture des préférences clients", "userPreferences", error);
    return null;
  }
}

/**
 * @deprecated Utiliser getClientPreferences() à la place
 * Alias pour compatibilité
 */
export function getUserPreferences(professionalId: string): ClientPreferences | null {
  return getClientPreferences(professionalId);
}

/**
 * Calculer le score de préférence pour un créneau basé sur l'historique des choix des CLIENTS
 * Plus les clients ont choisi ce type de créneau dans le passé, plus le score est élevé
 * @param professionalId ID du professionnel
 * @param slot Créneau à évaluer
 * @returns Score de préférence (0-25 points) basé sur les choix historiques des clients
 */
export function calculatePreferenceScore(
  professionalId: string,
  slot: { date: string; start: string; end: string },
): number {
  const preferences = getClientPreferences(professionalId);
  if (!preferences) {
    return 0; // Pas de préférences clients apprises
  }

  let score = 0;

  // Extraire le jour de la semaine
  const date = new Date(`${slot.date}T00:00:00`);
  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
  const dayPreference = preferences.preferredDays[dayName] || 0;

  // Bonus pour jours préférés (normalisé sur 0-10)
  const maxDaySelections = Math.max(...Object.values(preferences.preferredDays), 1);
  score += (dayPreference / maxDaySelections) * 10;

  // Bonus pour heures préférées
  const hourPreference = preferences.preferredHours[slot.start] || 0;
  const maxHourSelections = Math.max(...Object.values(preferences.preferredHours), 1);
  score += (hourPreference / maxHourSelections) * 10;

  // Bonus pour plages horaires préférées
  const matchingRange = preferences.preferredTimeRanges.find(
    (range) => slot.start >= range.start && slot.end <= range.end,
  );
  if (matchingRange) {
    const maxRangeCount = Math.max(...preferences.preferredTimeRanges.map((r) => r.count), 1);
    score += (matchingRange.count / maxRangeCount) * 5;
  }

  return Math.min(25, score); // Score max de préférence = 25 points
}

/**
 * Mettre à jour les préférences clients à partir de l'historique des sélections
 */
function updatePreferences(professionalId: string, history: SlotSelection[]): void {
  const preferences: ClientPreferences = {
    professionalId,
    preferredDays: {},
    preferredHours: {},
    preferredTimeRanges: [],
    lastUpdated: Date.now(),
  };

  // Analyser les jours préférés
  history.forEach((selection) => {
    const date = new Date(`${selection.date}T00:00:00`);
    const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
    preferences.preferredDays[dayName] = (preferences.preferredDays[dayName] || 0) + 1;
  });

  // Analyser les heures préférées
  history.forEach((selection) => {
    preferences.preferredHours[selection.start] =
      (preferences.preferredHours[selection.start] || 0) + 1;
  });

  // Analyser les plages horaires préférées (groupement par tranches de 2h)
  const timeRanges: Record<string, number> = {};
  history.forEach((selection) => {
    const [startHour] = selection.start.split(":").map(Number);
    const [endHour] = selection.end.split(":").map(Number);

    // Grouper par tranches de 2h (ex: 9h-11h, 11h-13h, etc.)
    const rangeStart = Math.floor(startHour / 2) * 2;
    const rangeEnd = rangeStart + 2;
    const rangeKey = `${rangeStart.toString().padStart(2, "0")}:00-${rangeEnd.toString().padStart(2, "0")}:00`;

    timeRanges[rangeKey] = (timeRanges[rangeKey] || 0) + 1;
  });

  // Convertir en tableau trié par popularité
  preferences.preferredTimeRanges = Object.entries(timeRanges)
    .map(([key, count]) => {
      const [start, end] = key.split("-");
      return {
        start: start.replace(":", ":"),
        end: end.replace(":", ":"),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Garder les 10 plages les plus populaires

  // Sauvegarder les préférences clients
  saveUserPreferences(professionalId, preferences);
}

/**
 * Obtenir l'historique des sélections des clients pour un professionnel
 */
function getSelectionHistory(professionalId: string): SlotSelection[] {
  const key = `${STORAGE_KEY_PREFIX}history_${professionalId}`;
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as SlotSelection[];
  } catch (error) {
    logger.warn("Erreur lors de la lecture de l'historique", "userPreferences", error);
    return [];
  }
}

/**
 * Sauvegarder l'historique des sélections des clients
 */
function saveSelectionHistory(professionalId: string, history: SlotSelection[]): void {
  const key = `${STORAGE_KEY_PREFIX}history_${professionalId}`;
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    logger.warn("Erreur lors de la sauvegarde de l'historique", "userPreferences", error);
  }
}

/**
 * Sauvegarder les préférences clients pour un professionnel
 */
function saveUserPreferences(professionalId: string, preferences: ClientPreferences): void {
  const key = `${STORAGE_KEY_PREFIX}${professionalId}`;
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    logger.warn("Erreur lors de la sauvegarde des préférences", "userPreferences", error);
  }
}
