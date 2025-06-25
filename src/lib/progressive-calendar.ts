// Système de chargement progressif intelligent du calendrier
// Charge 1 an au début, puis anticipe quand on approche de la fin

import type { PreGeneratedCalendar, CalendarDay } from "./calendar-generator";

interface YearCalendarData {
  year: number;
  totalDays: number;
  days: CalendarDay[];
  byMonth: Record<string, CalendarDay[]>;
  byDayOfWeek: Record<number, CalendarDay[]>;
  weekends: CalendarDay[];
  weekdays: CalendarDay[];
  isLeapYear: boolean;
  weekendsCount: number;
  weekdaysCount: number;
}

class ProgressiveCalendarManager {
  private loadedYears = new Map<number, YearCalendarData>();
  private loadingPromises = new Map<number, Promise<YearCalendarData>>();
  private currentYear = new Date().getFullYear();
  private preloadThresholdMonths = 2; // Précharger 2 mois avant la fin

  async loadYear(year: number): Promise<YearCalendarData> {
    // Si déjà chargé, retourner immédiatement
    if (this.loadedYears.has(year)) {
      return this.loadedYears.get(year)!;
    }

    // Si déjà en cours de chargement, attendre la promesse existante
    if (this.loadingPromises.has(year)) {
      return this.loadingPromises.get(year)!;
    }

    console.time(`📥 Chargement année ${year}`);

    // Utiliser requestIdleCallback pour les chargements non-critiques
    const loadingPromise = new Promise<YearCalendarData>((resolve, reject) => {
      const loadData = async () => {
        try {
          const yearData = await this.loadYearData(year);
          resolve(yearData);
        } catch (error) {
          reject(error);
        }
      };

      // Si c'est l'année courante, charger immédiatement
      const currentYear = new Date().getFullYear();
      if (year === currentYear || year === currentYear + 1) {
        loadData();
      } else {
        // Années futures: utiliser requestIdleCallback pour ne pas bloquer
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => loadData());
        } else {
          // Fallback pour navigateurs sans requestIdleCallback
          setTimeout(loadData, 10);
        }
      }
    });

    this.loadingPromises.set(year, loadingPromise);

    try {
      const yearData = await loadingPromise;
      this.loadedYears.set(year, yearData);
      this.loadingPromises.delete(year);
      console.timeEnd(`📥 Chargement année ${year}`);
      console.log(`✅ Année ${year} chargée: ${yearData.totalDays} jours`);
      return yearData;
    } catch (error) {
      this.loadingPromises.delete(year);
      console.error(`❌ Erreur chargement année ${year}:`, error);
      throw error;
    }
  }

  private async loadYearData(year: number): Promise<YearCalendarData> {
    try {
      // Import dynamique du fichier JSON de l'année
      const module = await import(`../data/calendar-${year}.json`);
      return module.default;
    } catch (error) {
      console.warn(
        `⚠️ Fichier calendar-${year}.json non trouvé, génération dynamique...`,
      );
      // Fallback: génération dynamique si le fichier n'existe pas
      return this.generateYearFallback(year);
    }
  }

  private generateYearFallback(year: number): YearCalendarData {
    // Génération minimale pour fallback
    const days: CalendarDay[] = [];
    const byMonth: Record<string, CalendarDay[]> = {};
    const byDayOfWeek: Record<number, CalendarDay[]> = {};
    const weekends: CalendarDay[] = [];
    const weekdays: CalendarDay[] = [];

    const dayNames = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];
    const monthNames = [
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

    for (let month = 0; month < 12; month++) {
      const monthKey = `${year}-${(month + 1).toString().padStart(2, "0")}`;
      byMonth[monthKey] = [];

      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split("T")[0];
        const dayOfWeek = date.getDay();

        const calendarDay: CalendarDay = {
          date: dateStr,
          year,
          month: month + 1,
          day,
          dayOfWeek,
          dayName: dayNames[dayOfWeek],
          monthName: monthNames[month],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          weekNumber: 1, // Simplifié pour le fallback
          quarterNumber: Math.ceil((month + 1) / 3),
        };

        days.push(calendarDay);
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

    return {
      year,
      totalDays: days.length,
      days,
      byMonth,
      byDayOfWeek,
      weekends,
      weekdays,
      isLeapYear: new Date(year, 1, 29).getDate() === 29,
      weekendsCount: weekends.length,
      weekdaysCount: weekdays.length,
    };
  }

  // Vérifier si on doit précharger l'année suivante
  checkAndPreloadNext(currentDate: string) {
    const date = new Date(currentDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // Si on est dans les derniers mois de l'année, précharger l'année suivante
    if (month >= 12 - this.preloadThresholdMonths) {
      const nextYear = year + 1;
      if (
        !this.loadedYears.has(nextYear) &&
        !this.loadingPromises.has(nextYear)
      ) {
        console.log(
          `🔮 Préchargement anticipé de l'année ${nextYear} (mois ${month})`,
        );
        this.loadYear(nextYear).catch((error) => {
          console.warn(`⚠️ Erreur préchargement ${nextYear}:`, error);
        });
      }
    }
  }

  // Obtenir les données d'une plage de dates (peut couvrir plusieurs années)
  async getDateRange(
    startDate: string,
    endDate: string,
  ): Promise<CalendarDay[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const results: CalendarDay[] = [];

    // Charger toutes les années nécessaires en parallèle
    const yearsToLoad = [];
    for (let year = startYear; year <= endYear; year++) {
      yearsToLoad.push(year);
    }

    const yearDataPromises = yearsToLoad.map((year) => this.loadYear(year));
    const yearDataArray = await Promise.all(yearDataPromises);

    // Filtrer les jours dans la plage demandée
    for (const yearData of yearDataArray) {
      const filteredDays = yearData.days.filter(
        (day) => day.date >= startDate && day.date <= endDate,
      );
      results.push(...filteredDays);
    }

    // Vérifier si on doit précharger l'année suivante
    this.checkAndPreloadNext(endDate);

    return results;
  }

  // Obtenir les jours d'un mois spécifique
  async getMonth(year: number, month: number): Promise<CalendarDay[]> {
    const yearData = await this.loadYear(year);
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
    return yearData.byMonth[monthKey] || [];
  }

  // Statistiques du cache
  getCacheStats() {
    return {
      loadedYears: Array.from(this.loadedYears.keys()).sort(),
      loadingYears: Array.from(this.loadingPromises.keys()).sort(),
      totalLoadedDays: Array.from(this.loadedYears.values()).reduce(
        (total, yearData) => total + yearData.totalDays,
        0,
      ),
    };
  }

  // Nettoyer le cache (garder seulement les années récentes)
  cleanupCache() {
    const currentYear = new Date().getFullYear();
    const keepYears = [
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2,
    ];

    for (const [year] of this.loadedYears) {
      if (!keepYears.includes(year)) {
        this.loadedYears.delete(year);
        console.log(`🧹 Année ${year} supprimée du cache`);
      }
    }
  }
}

// Instance globale
const progressiveCalendar = new ProgressiveCalendarManager();

export { progressiveCalendar, type YearCalendarData };

// API compatible avec l'ancien système
export async function getProgressiveCalendar(): Promise<PreGeneratedCalendar> {
  const currentYear = new Date().getFullYear();

  // Charger l'année courante immédiatement
  const currentYearData = await progressiveCalendar.loadYear(currentYear);

  // Précharger l'année suivante en arrière-plan
  progressiveCalendar.loadYear(currentYear + 1).catch(() => {
    // Ignore les erreurs de préchargement
  });

  // Convertir au format PreGeneratedCalendar pour compatibilité
  return {
    startYear: currentYear,
    endYear: currentYear,
    totalDays: currentYearData.totalDays,
    days: currentYearData.days,
    byYear: { [currentYear]: currentYearData.days },
    byMonth: currentYearData.byMonth,
    byDayOfWeek: currentYearData.byDayOfWeek,
    weekends: currentYearData.weekends,
    weekdays: currentYearData.weekdays,
  };
}
