// Calendrier VRAIMENT statique - Import du JSON pré-généré !
// Généré une seule fois par le script: node scripts/generate-static-calendar.cjs
// Plus AUCUN calcul à l'exécution !

import type { PreGeneratedCalendar } from "./calendar-generator";

// Import statique du JSON pré-généré (5.58 MB)
let staticCalendarData: any = null;

async function loadStaticCalendarData() {
  if (!staticCalendarData) {
    //console.time("📥 Import JSON statique");
    try {
      // Import dynamique pour éviter d'alourdir le bundle principal
      const module = await import("../data/calendar-10years.json");
      staticCalendarData = module.default;
      //console.timeEnd("📥 Import JSON statique");
      //console.log(
      //  `✅ Calendrier JSON chargé: ${staticCalendarData.totalDays} jours (${staticCalendarData.startYear}-${staticCalendarData.endYear})`,
      //);
    } catch (error) {
      console.error("❌ Erreur import calendrier JSON:", error);
      throw error;
    }
  }
  return staticCalendarData;
}

// Version synchrone avec cache mémoire
let cachedCalendar: PreGeneratedCalendar | null = null;

export async function getStaticCalendar(): Promise<PreGeneratedCalendar> {
  if (cachedCalendar) {
    //console.log("⚡ Calendrier statique - Cache mémoire instantané");
    return cachedCalendar;
  }

  //console.log("🚀 Chargement du calendrier JSON statique...");
  const data = await loadStaticCalendarData();

  // Convertir en format PreGeneratedCalendar
  cachedCalendar = {
    startYear: data.startYear,
    endYear: data.endYear,
    totalDays: data.totalDays,
    days: data.days,
    byYear: data.byYear,
    byMonth: data.byMonth,
    byDayOfWeek: data.byDayOfWeek,
    weekends: data.weekends,
    weekdays: data.weekdays,
  };

  //console.log("🎯 Calendrier statique prêt !");
  return cachedCalendar;
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
