import { formatDateLocal, getTodayLocal } from "../../../date-utils";
import { isDev } from "../../../env";
import { logger } from "../../../logger";
import type { ParsedTemporalInput } from "../../../temporalParser";

/**
 * Build date hints from parsed temporal input
 */
export function buildDateHintsFromParsed(parsed: ParsedTemporalInput, userInput: string): string {
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  
  // Cas 1: Jour de la semaine + période
  if (parsed.type === "day_of_week" && parsed.relativeWeeks && parsed.dayOfWeek) {
    const hasMultipleDays = parsed.dayOfWeek.length > 1;
    const jourName = hasMultipleDays
      ? parsed.dayOfWeek.map((d) => dayNames[d]).join(" ET ")
      : dayNames[parsed.dayOfWeek[0]];
    
    return `
⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - JOUR SPÉCIFIQUE + PÉRIODE ⚠️⚠️⚠️

Jour demandé: ${jourName}
Période: dans ${parsed.relativeWeeks} semaines

RÈGLE ABSOLUE:
- Proposer UNIQUEMENT les ${jourName}s autour de la période
- Filtrer pour ne garder QUE les ${jourName}s
- Générer 2-3 créneaux par date maximum

Dates autorisées:
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}

⚠️ CRITIQUE : Ne proposer QUE des ${jourName}s, pas d'autres jours !`;
  }

  // Cas 2: Date spécifique OU jour(s) de la semaine
  if (parsed.type === "specific_date" || parsed.type === "day_of_week") {
    const hasMultipleDays = parsed.dayOfWeek && parsed.dayOfWeek.length > 1;
    
    if (hasMultipleDays) {
      const joursNames = parsed.dayOfWeek.map((d) => dayNames[d]).join(" ET ");
      return `
⚠️⚠️⚠️ PLUSIEURS JOURS DÉTECTÉS ⚠️⚠️⚠️

Jours demandés: ${joursNames}

RÈGLE ABSOLUE:
- OBLIGATOIRE : Générer EXACTEMENT ${parsed.dayOfWeek.length} DATES
- OBLIGATOIRE : Chaque date doit correspondre au bon jour de la semaine
- INTERDIT : Ne générer qu'une seule date

Dates autorisées:
${parsed.allowedDates.map((d: string) => {
  const dateObj = new Date(d + "T00:00:00");
  const dayName = dayNames[dateObj.getDay()];
  return `  - ${d} (${dayName})`;
}).join("\n")}

⚠️ CRITIQUE : Générer TOUTES ces dates, pas seulement une !`;
    }
  }

  // Cas 3: Période vague
  if (parsed.type === "period") {
    return `
⚠️⚠️⚠️ PÉRIODE DÉTECTÉE ⚠️⚠️⚠️

Période: ${parsed.period || "non spécifiée"}

RÈGLES:
- Générer des dates sur toute la période
- Espacer les dates de manière logique
- 5-7 dates maximum

Dates autorisées:
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}`;
  }

  // Pas de hints spécifiques
  return "";
}

/**
 * Validate date hints consistency
 */
export function validateDateHints(hints: string, userInput: string): boolean {
  // Validation basique
  if (!hints || hints.trim().length === 0) return true;
  
  // Vérifier que les hints contiennent des dates valides
  const dateRegex = /\d{4}-\d{2}-\d{2}/g;
  const dates = hints.match(dateRegex);
  
  if (!dates) return true;
  
  // Vérifier que toutes les dates sont dans le futur
  const today = getTodayLocal();
  return dates.every(date => date >= today);
}
