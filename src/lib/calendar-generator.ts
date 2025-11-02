// Générateur de calendrier pré-calculé pour 100 ans
// Ce fichier génère toutes les dates possibles avec leurs métadonnées
// pour éviter les calculs répétitifs et améliorer les performances

import { formatDateLocal } from "./date-utils";
import { logger } from "./logger";

export interface CalendarDay {
  date: string; // Format YYYY-MM-DD
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0=dimanche, 1=lundi, ..., 6=samedi
  dayName: string; // lundi, mardi, etc.
  monthName: string; // janvier, février, etc.
  isWeekend: boolean;
  isHoliday?: boolean; // Optionnel pour les jours fériés
  weekNumber: number; // Numéro de la semaine dans l'année
  quarterNumber: number; // 1, 2, 3, 4
}

export interface PreGeneratedCalendar {
  startYear: number;
  endYear: number;
  totalDays: number;
  days: CalendarDay[];
  // Index pour recherche rapide
  byYear: Record<number, CalendarDay[]>;
  byMonth: Record<string, CalendarDay[]>; // "YYYY-MM"
  byDayOfWeek: Record<number, CalendarDay[]>; // 0-6
  weekends: CalendarDay[];
  weekdays: CalendarDay[];
}

import { getStaticCalendarSync } from "./calendar-data";

class CalendarGenerator {
  private dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  private monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  // Jours fériés fixes français (optionnel)
  private fixedHolidays = [
    { month: 1, day: 1 }, // Jour de l'An
    { month: 5, day: 1 }, // Fête du Travail
    { month: 5, day: 8 }, // Victoire 1945
    { month: 7, day: 14 }, // Fête Nationale
    { month: 8, day: 15 }, // Assomption
    { month: 11, day: 1 }, // Toussaint
    { month: 11, day: 11 }, // Armistice
    { month: 12, day: 25 }, // Noël
  ];

  generateCalendar(
    startYear: number = new Date().getFullYear(),
    yearsCount: number = 100,
  ): PreGeneratedCalendar {
    const endYear = startYear + yearsCount - 1;
    const days: CalendarDay[] = [];

    // Index pour recherche rapide
    const byYear: Record<number, CalendarDay[]> = {};
    const byMonth: Record<string, CalendarDay[]> = {};
    const byDayOfWeek: Record<number, CalendarDay[]> = {};
    const weekends: CalendarDay[] = [];
    const weekdays: CalendarDay[] = [];

    //console.log(
    //  `🗓️ Génération du calendrier ${startYear}-${endYear} (${yearsCount} ans)`,
    //);

    for (let year = startYear; year <= endYear; year++) {
      byYear[year] = [];

      for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${(month + 1).toString().padStart(2, "0")}`;
        byMonth[monthKey] = [];

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateStr = formatDateLocal(date);
          const dayOfWeek = date.getDay();

          // Calculer le numéro de semaine
          const weekNumber = this.getWeekNumber(date);

          // Calculer le trimestre
          const quarterNumber = Math.ceil((month + 1) / 3);

          // Vérifier si c'est un jour férié
          const isHoliday = this.isFixedHoliday(month + 1, day);

          const calendarDay: CalendarDay = {
            date: dateStr,
            year,
            month: month + 1,
            day,
            dayOfWeek,
            dayName: this.dayNames[dayOfWeek],
            monthName: this.monthNames[month],
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            isHoliday,
            weekNumber,
            quarterNumber,
          };

          // Ajouter aux index
          days.push(calendarDay);
          byYear[year].push(calendarDay);
          byMonth[monthKey].push(calendarDay);

          if (!byDayOfWeek[dayOfWeek]) {
            byDayOfWeek[dayOfWeek] = [];
          }
          byDayOfWeek[dayOfWeek].push(calendarDay);

          if (calendarDay.isWeekend) {
            weekends.push(calendarDay);
          } else {
            weekdays.push(calendarDay);
          }
        }
      }
    }

    // Calendar generated successfully
    return {
      startYear,
      endYear,
      totalDays: days.length,
      days,
      byYear,
      byMonth,
      byDayOfWeek,
      weekends,
      weekdays,
    };
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private isFixedHoliday(month: number, day: number): boolean {
    return this.fixedHolidays.some((holiday) => holiday.month === month && holiday.day === day);
  }
}

// Cache optimisé par année pour éviter le dépassement de quota localStorage
const yearlyCalendarCache = new Map<number, CalendarDay[]>();
const CACHE_VERSION = "1.1";

export function getPreGeneratedCalendar(): PreGeneratedCalendar {
  // Initializing progressive calendar

  // NOUVELLE OPTIMISATION: Calendrier progressif par année !
  console.time("⚡ Calendrier progressif");

  // Import du système progressif
  return import("./progressive-calendar")
    .then((module) => {
      console.timeEnd("⚡ Calendrier progressif");
      return module.getProgressiveCalendar();
    })
    .catch(() => {
      // Fallback: ancien système si le progressif échoue
      // Fallback: using static calendar
      return import("./calendar-data").then((module) => {
        return module.getStaticCalendar();
      });
    })
    .catch(() => {
      // Fallback final: génération dynamique
      // Final fallback: dynamic generation
      const generator = new CalendarGenerator();
      const currentYear = new Date().getFullYear();
      return generator.generateCalendar(currentYear, 2);
    }) as any;
}

// Cache global pour le calendrier progressif
let globalProgressiveCalendar: PreGeneratedCalendar | null = null;

// Version synchrone pour compatibilité (utilise le cache global)
export function getPreGeneratedCalendarSync(): PreGeneratedCalendar {
  // Synchronous calendar with cache

  // Vérifier d'abord le cache global du calendrier progressif
  if (globalProgressiveCalendar) {
    // Progressive calendar - global sync cache
    return globalProgressiveCalendar;
  }

  // Essayer d'importer le calendrier statique de manière synchrone
  try {
    const result = getStaticCalendarSync();
    if (result.totalDays > 0) {
      // Static synchronous calendar
      return result;
    }
  } catch (e) {
    logger.debug("Static calendar not available, using fallback", "calendar");
  }

  // Fallback: génération dynamique minimale (1 an seulement)
  // Synchronous fallback: 1 year generation
  const generator = new CalendarGenerator();
  const currentYear = new Date().getFullYear();
  return generator.generateCalendar(currentYear, 1); // 1 an au lieu de 10
}

// Fonction pour initialiser le cache global (appelée par App.tsx)
export function initializeGlobalCalendarCache(calendar: PreGeneratedCalendar) {
  globalProgressiveCalendar = calendar;
  // Global calendar cache initialized
}

// Fonction pour obtenir des données d'une année spécifique (avec cache)
export function getYearCalendar(year: number): CalendarDay[] {
  if (yearlyCalendarCache.has(year)) {
    return yearlyCalendarCache.get(year)!;
  }

  // Vérifier le cache localStorage pour cette année
  if (typeof window !== "undefined") {
    try {
      const cacheKey = `doodates-year-${year}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { version, data } = JSON.parse(cached);
        if (version === CACHE_VERSION) {
          yearlyCalendarCache.set(year, data);
          return data;
        }
      }
    } catch (e) {
      logger.debug("localStorage cache not available for year", "calendar", { year });
    }
  }

  // Générer les données pour cette année
  const generator = new CalendarGenerator();
  const yearCalendar = generator.generateCalendar(year, 1);
  const yearDays = yearCalendar.days;

  // Sauvegarder en cache mémoire
  yearlyCalendarCache.set(year, yearDays);

  // Sauvegarder en localStorage (une année à la fois)
  if (typeof window !== "undefined") {
    try {
      const cacheKey = `doodates-year-${year}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          version: CACHE_VERSION,
          year,
          generated: new Date().toISOString(),
          data: yearDays,
        }),
      );
    } catch (e) {
      logger.warn("Cannot save year to localStorage (quota exceeded)", "calendar", { year });
    }
  }

  return yearDays;
}

// Fonctions utilitaires pour requêter le calendrier optimisé
export class CalendarQuery {
  private baseCalendar: PreGeneratedCalendar;

  constructor() {
    // Utiliser la version synchrone pour éviter les problèmes d'async
    this.baseCalendar = getPreGeneratedCalendarSync();
  }

  // Obtenir les jours dans une plage de dates (avec génération à la demande)
  private getDaysInRange(startDate: string, endDate: string): CalendarDay[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: CalendarDay[] = [];

    // Déterminer les années nécessaires
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearDays = this.getYearDays(year);
      const filteredDays = yearDays.filter((day) => day.date >= startDate && day.date <= endDate);
      days.push(...filteredDays);
    }

    return days;
  }

  // Obtenir les jours d'une année (avec cache)
  private getYearDays(year: number): CalendarDay[] {
    // Vérifier si l'année est dans le calendrier de base
    if (year >= this.baseCalendar.startYear && year <= this.baseCalendar.endYear) {
      return this.baseCalendar.byYear[year] || [];
    }

    // Sinon, charger à la demande
    return getYearCalendar(year);
  }

  // Obtenir tous les lundis d'une période
  getMondaysInRange(startDate: string, endDate: string): CalendarDay[] {
    return this.getDaysOfWeekInRange(1, startDate, endDate);
  }

  // Obtenir tous les week-ends d'une période
  getWeekendsInRange(startDate: string, endDate: string): CalendarDay[] {
    const days = this.getDaysInRange(startDate, endDate);
    return days.filter((day) => day.isWeekend);
  }

  // Obtenir tous les jours ouvrables d'une période
  getWeekdaysInRange(startDate: string, endDate: string): CalendarDay[] {
    const days = this.getDaysInRange(startDate, endDate);
    return days.filter((day) => !day.isWeekend);
  }

  // Obtenir N occurrences d'un jour de la semaine à partir d'une date
  getNextNDaysOfWeek(dayOfWeek: number, count: number, fromDate: string): CalendarDay[] {
    const days: CalendarDay[] = [];
    const fromDateObj = new Date(fromDate);
    const currentYear = fromDateObj.getFullYear();

    // Rechercher dans les années suivantes jusqu'à avoir assez de jours
    for (let year = currentYear; year <= currentYear + 10 && days.length < count; year++) {
      const yearDays = this.getYearDays(year);
      const matchingDays = yearDays
        .filter((day) => day.dayOfWeek === dayOfWeek && day.date >= fromDate)
        .slice(0, count - days.length);
      days.push(...matchingDays);
    }

    return days.slice(0, count);
  }

  // Obtenir tous les jours d'un mois
  getDaysInMonth(year: number, month: number): CalendarDay[] {
    const yearDays = this.getYearDays(year);
    return yearDays.filter((day) => day.month === month);
  }

  // Obtenir les jours d'une semaine spécifique
  getDaysOfWeekInRange(dayOfWeek: number, startDate: string, endDate: string): CalendarDay[] {
    const days = this.getDaysInRange(startDate, endDate);
    return days.filter((day) => day.dayOfWeek === dayOfWeek);
  }

  // Obtenir les week-ends d'une période spécifique (mois)
  getWeekendsInMonths(startMonth: string, endMonth: string): CalendarDay[] {
    const weekends: CalendarDay[] = [];

    // Parcourir tous les mois dans la période
    const [startYear, startMonthNum] = startMonth.split("-").map(Number);
    const [endYear, endMonthNum] = endMonth.split("-").map(Number);

    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonthNum : 1;
      const monthEnd = year === endYear ? endMonthNum : 12;

      for (let month = monthStart; month <= monthEnd; month++) {
        const monthDays = this.getDaysInMonth(year, month);
        weekends.push(...monthDays.filter((day) => day.isWeekend));
      }
    }

    return weekends;
  }

  // Stats rapides (basé sur le calendrier de base)
  getStats(): {
    totalDays: number;
    weekends: number;
    weekdays: number;
    years: number;
  } {
    return {
      totalDays: this.baseCalendar.totalDays,
      weekends: this.baseCalendar.weekends.length,
      weekdays: this.baseCalendar.weekdays.length,
      years: this.baseCalendar.endYear - this.baseCalendar.startYear + 1,
    };
  }
}

// Fonction utilitaire pour nettoyer le cache localStorage
export function clearCalendarCache(): void {
  if (typeof window !== "undefined") {
    // Nettoyer l'ancien cache global
    try {
      localStorage.removeItem("doodates-calendar-cache");
    } catch (e) {
      logger.debug("Cannot clean global cache", "calendar");
    }

    // Nettoyer les caches par année
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("doodates-year-")) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          logger.debug("Cannot clean cache", "calendar", { key });
        }
      }
    }

    // Calendar cache cleaned
  }

  // Nettoyer le cache mémoire
  yearlyCalendarCache.clear();
}

export default CalendarQuery;
