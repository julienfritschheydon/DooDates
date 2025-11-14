/**
 * Service de réservation temporaire pour gestion conflits multi-clients
 * Phase 3 : Gestion conflits avancée
 *
 * Lorsqu'un client sélectionne un créneau, celui-ci est réservé temporairement (15 min)
 * pour éviter qu'un autre client ne le sélectionne simultanément.
 */

import { logger } from "@/lib/logger";

export interface TemporaryReservation {
  pollId: string;
  slot: {
    date: string;
    start: string;
    end: string;
  };
  reservedAt: number; // Timestamp (ms)
  expiresAt: number; // Timestamp (ms) - reservedAt + 15 min
}

const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = "doodates_temporary_reservations";

/**
 * Créer une réservation temporaire pour un créneau
 */
export function createTemporaryReservation(
  pollId: string,
  slot: { date: string; start: string; end: string },
): TemporaryReservation {
  const now = Date.now();
  const reservation: TemporaryReservation = {
    pollId,
    slot,
    reservedAt: now,
    expiresAt: now + RESERVATION_DURATION_MS,
  };

  // Sauvegarder dans localStorage
  const reservations = getTemporaryReservations();
  reservations.push(reservation);
  saveTemporaryReservations(reservations);

  logger.info("Réservation temporaire créée", "temporaryReservation", {
    pollId,
    slot,
    expiresAt: new Date(reservation.expiresAt).toISOString(),
  });

  return reservation;
}

/**
 * Vérifier si un créneau est déjà réservé temporairement
 */
export function isSlotReserved(
  pollId: string,
  slot: { date: string; start: string; end: string },
): boolean {
  const reservations = getTemporaryReservations();
  const now = Date.now();

  // Nettoyer les réservations expirées
  const activeReservations = reservations.filter((r) => r.expiresAt > now);
  if (activeReservations.length !== reservations.length) {
    saveTemporaryReservations(activeReservations);
  }

  // Vérifier si le créneau est réservé (même poll ou autre poll)
  const conflictingReservation = activeReservations.find((r) => {
    // Même créneau (date + heures)
    return r.slot.date === slot.date && r.slot.start === slot.start && r.slot.end === slot.end;
  });

  return conflictingReservation !== undefined;
}

/**
 * Libérer une réservation temporaire (lors de la validation finale ou annulation)
 */
export function releaseTemporaryReservation(
  pollId: string,
  slot: { date: string; start: string; end: string },
): void {
  const reservations = getTemporaryReservations();
  const filtered = reservations.filter(
    (r) =>
      !(
        r.pollId === pollId &&
        r.slot.date === slot.date &&
        r.slot.start === slot.start &&
        r.slot.end === slot.end
      ),
  );
  saveTemporaryReservations(filtered);

  logger.info("Réservation temporaire libérée", "temporaryReservation", {
    pollId,
    slot,
  });
}

/**
 * Nettoyer toutes les réservations expirées
 */
export function cleanupExpiredReservations(): void {
  const reservations = getTemporaryReservations();
  const now = Date.now();
  const activeReservations = reservations.filter((r) => r.expiresAt > now);

  if (activeReservations.length !== reservations.length) {
    saveTemporaryReservations(activeReservations);
    logger.info("Réservations expirées nettoyées", "temporaryReservation", {
      removed: reservations.length - activeReservations.length,
    });
  }
}

/**
 * Obtenir toutes les réservations temporaires actives
 */
function getTemporaryReservations(): TemporaryReservation[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as TemporaryReservation[];
  } catch (error) {
    logger.warn(
      "Erreur lors de la lecture des réservations temporaires",
      "temporaryReservation",
      error,
    );
    return [];
  }
}

/**
 * Sauvegarder les réservations temporaires
 */
function saveTemporaryReservations(reservations: TemporaryReservation[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  } catch (error) {
    logger.warn(
      "Erreur lors de la sauvegarde des réservations temporaires",
      "temporaryReservation",
      error,
    );
  }
}

/**
 * Obtenir le temps restant avant expiration d'une réservation (en secondes)
 */
export function getReservationTimeRemaining(
  pollId: string,
  slot: { date: string; start: string; end: string },
): number | null {
  const reservations = getTemporaryReservations();
  const reservation = reservations.find(
    (r) =>
      r.pollId === pollId &&
      r.slot.date === slot.date &&
      r.slot.start === slot.start &&
      r.slot.end === slot.end,
  );

  if (!reservation) {
    return null;
  }

  const now = Date.now();
  const remaining = Math.max(0, Math.floor((reservation.expiresAt - now) / 1000));
  return remaining;
}
