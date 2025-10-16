// Calendrier avec lazy loading intelligent par année
// Charge seulement l'année nécessaire (260 KB) au lieu de tout (3.5 MB)
// Utilise les fichiers précalculés calendar-2025.json, calendar-2026.json, etc.

import type { PreGeneratedCalendar } from "./calendar-generator";
import { logError, ErrorFactory } from "./error-handling";
import { progressiveCalendar } from "./progressive-calendar";

// Cache mémoire pour éviter les rechargements
let cachedCalendar: PreGeneratedCalendar | null = null;

export async function getStaticCalendar(): Promise<PreGeneratedCalendar> {
  if (cachedCalendar) {
    // Cache hit - instantané
    return cachedCalendar;
  }

  try {
    const currentYear = new Date().getFullYear();

    // Charger année courante avec le système progressif (260 KB au lieu de 3.5 MB !)
    const currentYearData = await progressiveCalendar.loadYear(currentYear);

    // Précharger année suivante en arrière-plan (non-bloquant)
    progressiveCalendar.loadYear(currentYear + 1).catch(() => {
      // Ignore les erreurs de préchargement
    });

    // Convertir en format PreGeneratedCalendar pour compatibilité
    cachedCalendar = {
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

    return cachedCalendar;
  } catch (error) {
    logError(
      ErrorFactory.api(
        "Failed to load calendar",
        "Erreur lors du chargement du calendrier",
      ),
      { metadata: { originalError: error } },
    );
    throw error;
  }
}

// Version synchrone pour compatibilité (avec fallback)
export function getStaticCalendarSync(): PreGeneratedCalendar {
  if (cachedCalendar) {
    //console.log("⚡ Calendrier statique sync - Cache mémoire");
    return cachedCalendar;
  }

  // Si pas encore chargé, on ne peut pas faire de sync, donc fallback minimal
  console.warn("⚠️ Calendrier statique pas encore chargé - Fallback minimal");

  const currentYear = new Date().getFullYear();
  return {
    startYear: currentYear,
    endYear: currentYear + 1,
    totalDays: 0,
    days: [],
    byYear: {},
    byMonth: {},
    byDayOfWeek: {},
    weekends: [],
    weekdays: [],
  };
}
