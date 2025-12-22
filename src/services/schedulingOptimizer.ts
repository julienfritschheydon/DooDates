/**
 * Service d'optimisation des créneaux pour sondages disponibilités
 * Matching disponibilités client ↔ créneaux libres calendrier professionnel
 * + Optimisation selon règles (gaps, priorité proche, demi-journées)
 */

import { GoogleCalendarService } from "@/lib/google-calendar";
import { logger } from "@/lib/logger";
import { getTodayLocal, formatDateLocal } from "@/lib/date-utils";

export interface ParsedAvailability {
  date: string; // Date ISO (YYYY-MM-DD)
  timeRanges: Array<{ start: string; end: string }>; // Ex: [{start: "09:00", end: "12:00"}]
}

export interface SchedulingRules {
  minLatencyMinutes?: number; // Temps minimum entre séances (15-30 min)
  maxLatencyMinutes?: number; // Temps maximum entre séances
  preferNearTerm?: boolean; // Prioriser créneaux proches
  preferHalfDays?: boolean; // Créer demi-journées complètes
  preferredTimes?: Array<{ day: string; start: string; end: string }>; // Heures préférées par jour
  slotDurationMinutes?: number; // Durée standard des créneaux (ex: 60)
}

export interface ProposedSlot {
  date: string;
  start: string; // HH:MM
  end: string; // HH:MM
  score?: number; // Score d'optimisation (0-100)
  reasons?: string[]; // Raisons de la recommandation
}

export interface CalendarBusySlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

/**
 * Convertir disponibilités parsées (jours de la semaine) en dates concrètes
 */
function convertDaysToDates(
  availabilities: Array<{ day: string; timeRange: { start: string; end: string } }>,
  lookAheadWeeks: number = 4,
): ParsedAvailability[] {
  const todayStr = getTodayLocal();
  const todayDate = new Date(todayStr);
  const result: ParsedAvailability[] = [];
  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  // Grouper par jour de la semaine
  const byDay: Record<string, Array<{ start: string; end: string }>> = {};
  availabilities.forEach((avail) => {
    if (!byDay[avail.day]) {
      byDay[avail.day] = [];
    }
    byDay[avail.day].push(avail.timeRange);
  });

  // Pour chaque jour de la semaine, trouver les dates correspondantes dans les prochaines semaines
  Object.entries(byDay).forEach(([dayName, timeRanges]) => {
    const targetDay = dayMap[dayName];
    if (targetDay === undefined) return;

    for (let week = 0; week < lookAheadWeeks; week++) {
      const date = new Date(todayDate);
      const currentDay = date.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysUntilTarget + week * 7);

      // Éviter les dates passées
      if (date < todayDate) continue;

      const dateStr = formatDateLocal(date);
      result.push({
        date: dateStr,
        timeRanges,
      });
    }
  });

  return result;
}

/**
 * Trouver les créneaux libres dans une journée
 */
function findFreeSlots(
  date: string,
  timeRanges: Array<{ start: string; end: string }>,
  busySlots: CalendarBusySlot[],
  slotDurationMinutes: number = 60,
): Array<{ start: string; end: string }> {
  const freeSlots: Array<{ start: string; end: string }> = [];

  // Convertir busy slots en minutes pour cette date
  const busyMinutes: Array<{ start: number; end: number }> = [];
  busySlots.forEach((busy) => {
    const busyDate = new Date(busy.start);
    const busyDateStr = formatDateLocal(busyDate);
    if (busyDateStr === date) {
      const startMinutes = busyDate.getHours() * 60 + busyDate.getMinutes();
      const endDate = new Date(busy.end);
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      busyMinutes.push({ start: startMinutes, end: endMinutes });
    }
  });

  // Pour chaque plage horaire demandée, trouver les créneaux libres
  timeRanges.forEach((range) => {
    const [startHour, startMinute] = range.start.split(":").map(Number);
    const [endHour, endMinute] = range.end.split(":").map(Number);
    const rangeStartMinutes = startHour * 60 + startMinute;
    const rangeEndMinutes = endHour * 60 + endMinute;

    // Chercher créneaux libres dans cette plage
    for (
      let slotStart = rangeStartMinutes;
      slotStart + slotDurationMinutes <= rangeEndMinutes;
      slotStart += slotDurationMinutes
    ) {
      const slotEnd = slotStart + slotDurationMinutes;

      // Vérifier si le créneau chevauche un créneau occupé
      const overlaps = busyMinutes.some(
        (busy) => !(slotEnd <= busy.start || slotStart >= busy.end),
      );

      if (!overlaps) {
        const startHourStr = Math.floor(slotStart / 60)
          .toString()
          .padStart(2, "0");
        const startMinStr = (slotStart % 60).toString().padStart(2, "0");
        const endHourStr = Math.floor(slotEnd / 60)
          .toString()
          .padStart(2, "0");
        const endMinStr = (slotEnd % 60).toString().padStart(2, "0");

        freeSlots.push({
          start: `${startHourStr}:${startMinStr}`,
          end: `${endHourStr}:${endMinStr}`,
        });
      }
    }
  });

  return freeSlots;
}

/**
 * Calculer le score d'optimisation pour un créneau
 */
function calculateScore(
  slot: { date: string; start: string; end: string },
  rules: SchedulingRules,
  busySlots: CalendarBusySlot[],
  allSlots?: Array<{ date: string; start: string; end: string }>, // Pour détecter demi-journées
): { score: number; reasons: string[] } {
  let score = 50; // Score de base
  const reasons: string[] = [];

  const slotDate = new Date(`${slot.date}T${slot.start}:00`);
  const todayStr = getTodayLocal();
  const todayDate = new Date(`${todayStr}T00:00:00`);
  const daysUntil = Math.floor((slotDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  // Règle 2 : Prioriser créneaux proches
  if (rules.preferNearTerm) {
    if (daysUntil <= 1) {
      score += 20;
      reasons.push("Créneau très proche (< 2 jours)");
    } else if (daysUntil <= 7) {
      score += 10;
      reasons.push("Créneau proche (< 7 jours)");
    }
  }

  // Règle 1 : Minimiser gaps
  const [startHour, startMinute] = slot.start.split(":").map(Number);
  const [endHour, endMinute] = slot.end.split(":").map(Number);
  const slotStartMinutes = startHour * 60 + startMinute;
  const slotEndMinutes = endHour * 60 + endMinute;

  // Trouver le créneau occupé le plus proche avant
  const busyBefore = busySlots
    .filter((busy) => {
      const busyDate = new Date(busy.end);
      return formatDateLocal(busyDate) === slot.date;
    })
    .map((busy) => {
      const busyDate = new Date(busy.end);
      return busyDate.getHours() * 60 + busyDate.getMinutes();
    })
    .filter((minutes) => minutes <= slotStartMinutes)
    .sort((a, b) => b - a)[0];

  // Trouver le créneau occupé le plus proche après
  const busyAfter = busySlots
    .filter((busy) => {
      const busyDate = new Date(busy.start);
      return formatDateLocal(busyDate) === slot.date;
    })
    .map((busy) => {
      const busyDate = new Date(busy.start);
      return busyDate.getHours() * 60 + busyDate.getMinutes();
    })
    .filter((minutes) => minutes >= slotEndMinutes)
    .sort((a, b) => a - b)[0];

  if (busyBefore !== undefined) {
    const gapBefore = slotStartMinutes - busyBefore;
    if (gapBefore >= 0 && gapBefore <= 60) {
      score += 15;
      reasons.push(`Remplit un gap de ${gapBefore} min`);
    }
  }

  if (busyAfter !== undefined) {
    const gapAfter = busyAfter - slotEndMinutes;
    if (gapAfter >= 0 && gapAfter <= 60) {
      score += 15;
      reasons.push(`Remplit un gap de ${gapAfter} min`);
    }
  }

  // Règle 4 : Respecter heures préférées
  if (rules.preferredTimes) {
    const dayName = new Date(`${slot.date}T00:00:00`)
      .toLocaleDateString("fr-FR", { weekday: "long" })
      .toLowerCase();
    const preferredForDay = rules.preferredTimes.find((pt) => pt.day === dayName);
    if (preferredForDay) {
      const preferredStart = preferredForDay.start.split(":").map(Number);
      const preferredEnd = preferredForDay.end.split(":").map(Number);
      const preferredStartMinutes = preferredStart[0] * 60 + preferredStart[1];
      const preferredEndMinutes = preferredEnd[0] * 60 + preferredEnd[1];

      if (slotStartMinutes >= preferredStartMinutes && slotEndMinutes <= preferredEndMinutes) {
        score += 10;
        reasons.push("Dans les heures préférées");
      }
    }
  }

  // Règle 3 : Créer des demi-journées complètes (Phase 3)
  if (rules.preferHalfDays && allSlots) {
    const slotDuration = rules.slotDurationMinutes || 60;
    const halfDayInfo = detectHalfDayGrouping(slot, allSlots, busySlots, slotDuration);
    if (halfDayInfo.isHalfDay) {
      score += 25; // Bonus important pour demi-journées complètes
      const periodLabel = halfDayInfo.period === "morning" ? "matin" : "après-midi";
      reasons.push(
        `Fait partie d'une demi-journée complète (${periodLabel}, ${halfDayInfo.consecutiveCount} créneaux consécutifs)`,
      );
    }
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Détecter si un créneau fait partie d'une demi-journée complète (matin ou après-midi)
 * Une demi-journée = plusieurs créneaux consécutifs remplissant une période complète (matin: 9h-12h, après-midi: 14h-18h)
 */
function detectHalfDayGrouping(
  slot: { date: string; start: string; end: string },
  allSlots: Array<{ date: string; start: string; end: string }>,
  busySlots: CalendarBusySlot[],
  slotDurationMinutes: number,
): { isHalfDay: boolean; consecutiveCount: number; period: "morning" | "afternoon" | null } {
  const slotDate = slot.date;
  const [startHour] = slot.start.split(":").map(Number);
  const [endHour] = slot.end.split(":").map(Number);

  // Définir les périodes demi-journées
  const morningStart = 9;
  const morningEnd = 12;
  const afternoonStart = 14;
  const afternoonEnd = 18;

  // Déterminer la période (matin ou après-midi)
  let period: "morning" | "afternoon" | null = null;
  if (startHour >= morningStart && endHour <= morningEnd) {
    period = "morning";
  } else if (startHour >= afternoonStart && endHour <= afternoonEnd) {
    period = "afternoon";
  }

  if (!period) {
    return { isHalfDay: false, consecutiveCount: 0, period: null };
  }

  // Trouver tous les créneaux du même jour dans la même période
  const sameDaySlots = allSlots.filter((s) => s.date === slotDate);
  const periodSlots = sameDaySlots.filter((s) => {
    const [sStartHour] = s.start.split(":").map(Number);
    const [sEndHour] = s.end.split(":").map(Number);
    if (period === "morning") {
      return sStartHour >= morningStart && sEndHour <= morningEnd;
    } else {
      return sStartHour >= afternoonStart && sEndHour <= afternoonEnd;
    }
  });

  // Trier par heure de début
  periodSlots.sort((a, b) => {
    const [aHour, aMin] = a.start.split(":").map(Number);
    const [bHour, bMin] = b.start.split(":").map(Number);
    return aHour * 60 + aMin - (bHour * 60 + bMin);
  });

  // Trouver les créneaux consécutifs autour de ce slot
  const slotIndex = periodSlots.findIndex((s) => s.start === slot.start && s.end === slot.end);
  if (slotIndex === -1) {
    return { isHalfDay: false, consecutiveCount: 0, period: null };
  }

  // Compter les créneaux consécutifs avant et après
  let consecutiveCount = 1;
  let currentIndex = slotIndex;

  // Compter vers l'avant (créneaux précédents consécutifs)
  while (currentIndex > 0) {
    const currentSlot = periodSlots[currentIndex];
    const prevSlot = periodSlots[currentIndex - 1];
    const [currentStartHour, currentStartMin] = currentSlot.start.split(":").map(Number);
    const [prevEndHour, prevEndMin] = prevSlot.end.split(":").map(Number);

    const currentStartMinutes = currentStartHour * 60 + currentStartMin;
    const prevEndMinutes = prevEndHour * 60 + prevEndMin;

    // Vérifier si les créneaux sont consécutifs (strictement adjacents)
    if (currentStartMinutes - prevEndMinutes <= 0) {
      consecutiveCount++;
      currentIndex--;
    } else {
      break;
    }
  }

  // Compter vers l'arrière (créneaux suivants consécutifs)
  currentIndex = slotIndex;
  while (currentIndex < periodSlots.length - 1) {
    const currentSlot = periodSlots[currentIndex];
    const nextSlot = periodSlots[currentIndex + 1];
    const [currentEndHour, currentEndMin] = currentSlot.end.split(":").map(Number);
    const [nextStartHour, nextStartMin] = nextSlot.start.split(":").map(Number);

    const currentEndMinutes = currentEndHour * 60 + currentEndMin;
    const nextStartMinutes = nextStartHour * 60 + nextStartMin;

    // Vérifier si les créneaux sont consécutifs
    if (nextStartMinutes - currentEndMinutes <= 0) {
      consecutiveCount++;
      currentIndex++;
    } else {
      break;
    }
  }

  // Une demi-journée complète = au moins 3 créneaux consécutifs remplissant la période
  const periodDuration =
    period === "morning" ? morningEnd - morningStart : afternoonEnd - afternoonStart;
  const minSlotsForHalfDay = Math.ceil((periodDuration * 60) / slotDurationMinutes) - 1; // Au moins 2/3 de la période

  const isHalfDay = consecutiveCount >= minSlotsForHalfDay;

  return { isHalfDay, consecutiveCount, period };
}

/**
 * Optimiser les créneaux proposés selon les règles
 * Accepte soit des jours de la semaine, soit des dates concrètes
 */
export async function optimizeSchedule(
  parsedAvailabilities:
    | Array<{ day: string; timeRange: { start: string; end: string } }>
    | ParsedAvailability[],
  rules: SchedulingRules = {},
  calendarService?: GoogleCalendarService,
): Promise<ProposedSlot[]> {
  logger.info("Optimisation des créneaux", "api", {
    availabilitiesCount: parsedAvailabilities.length,
    rules,
  });

  // Déterminer si on a des dates concrètes ou des jours de la semaine
  const hasDates = parsedAvailabilities.length > 0 && "date" in parsedAvailabilities[0];

  // Convertir jours de la semaine en dates concrètes si nécessaire
  const availabilitiesByDate: ParsedAvailability[] = hasDates
    ? (parsedAvailabilities as ParsedAvailability[])
    : convertDaysToDates(
      parsedAvailabilities as Array<{ day: string; timeRange: { start: string; end: string } }>,
      4,
    );

  if (availabilitiesByDate.length === 0) {
    logger.warn("Aucune disponibilité trouvée", "api");
    return [];
  }

  // Récupérer les créneaux occupés du calendrier
  let busySlots: CalendarBusySlot[] = [];
  if (calendarService) {
    try {
      const todayStr = getTodayLocal();
      const todayDate = new Date(todayStr); // Créer une Date à partir de string
      const endDate = new Date(todayDate);
      endDate.setDate(endDate.getDate() + 28); // 4 semaines

      const startISO = todayDate.toISOString();
      const endISO = endDate.toISOString();

      busySlots = await calendarService.getFreeBusy(startISO, endISO);
      logger.info("Créneaux occupés récupérés", "api", {
        busySlotsCount: busySlots.length,
      });
    } catch (error) {
      logger.warn("Impossible de récupérer les créneaux occupés", "api", error);
      // Continuer sans calendrier (mode dégradé)
    }
  }

  // Trouver tous les créneaux libres possibles
  const allSlots: ProposedSlot[] = [];
  const slotDuration = rules.slotDurationMinutes || 60;

  for (const avail of availabilitiesByDate) {
    const freeSlots = findFreeSlots(avail.date, avail.timeRanges, busySlots, slotDuration);

    for (const slot of freeSlots) {
      const proposedSlot: ProposedSlot = {
        date: avail.date,
        start: slot.start,
        end: slot.end,
      };

      allSlots.push(proposedSlot);
    }
  }

  // Calculer les scores pour tous les créneaux (nécessaire pour détecter demi-journées)
  const slotsWithScores = allSlots.map((slot) => {
    const { score, reasons } = calculateScore(
      slot,
      rules,
      busySlots,
      allSlots.map((s) => ({ date: s.date, start: s.start, end: s.end })), // Passer tous les slots pour détection demi-journées
    );
    return {
      ...slot,
      score,
      reasons,
    };
  });

  // Trier par score décroissant
  slotsWithScores.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Retourner les 5 meilleurs créneaux
  return slotsWithScores.slice(0, 5);
}
