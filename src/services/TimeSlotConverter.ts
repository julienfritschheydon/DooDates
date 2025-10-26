/**
 * Service de conversion des créneaux horaires
 * Réutilise la logique de conversion de Gemini → Format interne
 */

export interface GeminiTimeSlot {
  start: string; // "10:00"
  end: string; // "11:00"
  dates?: string[]; // ["2025-10-29"] (optionnel)
}

export interface InternalTimeSlot {
  hour: number;
  minute: number;
  duration: number; // en minutes
  enabled: boolean;
}

/**
 * Convertit un créneau au format Gemini vers le format interne
 * Cette fonction réutilise la logique testée et validée de PollCreator
 */
export function convertGeminiSlotToInternal(
  geminiSlot: GeminiTimeSlot,
): InternalTimeSlot {
  // Calculer la durée en minutes entre start et end
  const startHour = parseInt(geminiSlot.start.split(":")[0]);
  const startMinute = parseInt(geminiSlot.start.split(":")[1]);
  const endHour = parseInt(geminiSlot.end.split(":")[0]);
  const endMinute = parseInt(geminiSlot.end.split(":")[1]);

  const durationMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);

  // Créer UN SEUL slot avec la durée complète
  return {
    hour: startHour,
    minute: startMinute,
    duration: durationMinutes,
    enabled: true,
  };
}

/**
 * Convertit plusieurs créneaux Gemini vers le format timeSlotsByDate
 * GÉNÈRE TOUS LES SLOTS INTERMÉDIAIRES (code d'hier restauré)
 */
export function convertGeminiSlotsToTimeSlotsByDate(
  geminiSlots: GeminiTimeSlot[],
  defaultDates: string[] = [],
  granularity: number = 30, // Granularité par défaut 30 min
): Record<string, InternalTimeSlot[]> {
  const convertedTimeSlots: Record<string, InternalTimeSlot[]> = {};

  geminiSlots.forEach((slot) => {
    // Si le slot n'a pas de dates spécifiques, l'appliquer à toutes les dates par défaut
    const targetDates =
      slot.dates && slot.dates.length > 0 ? slot.dates : defaultDates;

    targetDates.forEach((date: string) => {
      if (!convertedTimeSlots[date]) {
        convertedTimeSlots[date] = [];
      }

      // Calculer la durée
      const startHour = parseInt(slot.start.split(":")[0]);
      const startMinute = parseInt(slot.start.split(":")[1]);
      const endHour = parseInt(slot.end.split(":")[0]);
      const endMinute = parseInt(slot.end.split(":")[1]);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Générer TOUS les slots intermédiaires
      for (
        let currentMinutes = startMinutes;
        currentMinutes < endMinutes;
        currentMinutes += granularity
      ) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;

        convertedTimeSlots[date].push({
          hour,
          minute,
          duration: Math.min(granularity, endMinutes - currentMinutes),
          enabled: true,
        });
      }
    });
  });

  return convertedTimeSlots;
}

/**
 * Calcule la granularité optimale basée sur les slots
 * Utilise le PGCD (Plus Grand Commun Diviseur) des minutes de début
 */
export function calculateOptimalGranularity(
  timeSlotsByDate: Record<string, InternalTimeSlot[]>,
): number {
  const allSlots = Object.values(timeSlotsByDate).flat();

  if (allSlots.length === 0) {
    return 60; // Défaut: 1 heure
  }

  // Fonction PGCD (Plus Grand Commun Diviseur)
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // Calculer le PGCD de toutes les minutes de début
  const minutes = allSlots.map((s) => s.minute);
  const minutesGCD = minutes.reduce((acc, minute) => gcd(acc, minute), 60);

  // Granularité optimale = PGCD des minutes (min 15min, max 60min)
  return Math.max(15, Math.min(60, minutesGCD));
}
