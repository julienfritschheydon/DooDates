/**
 * Parser temporel robuste pour analyser les expressions temporelles dans les prompts utilisateur.
 *
 * Ce parser centralise toute la logique de parsing temporel avant l'appel à Gemini,
 * permettant une meilleure maintenabilité, extensibilité multilingue et performance.
 */

import { formatDateLocal } from "./date-utils";
import { ErrorFactory } from "./error-handling";

// Logger optionnel pour debug (éviter import circulaire)
let debugLogger: typeof import("./ai/geminiDebugLogger") | null = null;
async function getDebugLogger() {
  if (!debugLogger) {
    try {
      debugLogger = await import("./ai/geminiDebugLogger");
    } catch {
      // Ignore si le module n'est pas disponible
    }
  }
  return debugLogger;
}

// Type for chrono-node parse result
interface ChronoParsedDate {
  text: string;
  start: {
    date(): Date;
  };
}

interface ChronoParser {
  parse(text: string, refDate?: Date, options?: { forwardDate?: boolean }): ChronoParsedDate[];
}

export interface ParsedTemporalInput {
  // Dates détectées
  targetDates: Date[]; // Dates cibles calculées
  allowedDates: string[]; // Fenêtre de dates autorisées (format YYYY-MM-DD)

  // Type de demande
  type: "specific_date" | "period" | "day_of_week" | "month" | "relative" | "unknown";

  // Contraintes temporelles
  dayOfWeek?: number[]; // [1] pour lundi, [0,6] pour week-end, etc.
  month?: number; // 11 pour décembre, 2 pour mars, etc.
  period?: "start" | "end"; // "début mars" ou "fin mars"
  relativeDays?: number; // +5 pour "dans 5 jours"
  relativeWeeks?: number; // +2 pour "dans 2 semaines"
  dateNumeric?: { day: number; dayOfWeek?: number }; // { day: 23, dayOfWeek: 6 } pour "samedi 23"

  // Contexte détecté
  isMealContext: boolean;
  isProfessionalContext: boolean;

  // Attentes de génération
  expectedDatesCount: number | string; // 1, "3-5", "5-7", etc.
  expectedSlotsCount: number | string; // 1, "2-3", etc.

  // Métadonnées
  chronoParsedText?: string; // Texte parsé par Chrono-node
  detectedKeywords: string[]; // Mots-clés détectés (pour debug)
  timeSlots?: Array<{ start: string; end: string; dates?: string[] }>; // Créneaux horaires imposés
}

interface LanguageConfig {
  chrono: ChronoParser | null; // chrono.fr, chrono.en, etc.
  dayNames: string[];
  monthNames: string[];
  patterns: {
    dayOfWeek: RegExp;
    month: RegExp;
    dateNumeric: RegExp;
    periodStart: RegExp;
    periodEnd: RegExp;
    relativeDays: RegExp;
    relativeWeeks: RegExp;
  };
}

// Configuration française (par défaut)
const FRENCH_CONFIG: LanguageConfig = {
  chrono: null, // Sera chargé dynamiquement
  dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  monthNames: [
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
  ],
  patterns: {
    dayOfWeek: /\b(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)\b/i,
    month:
      /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
    dateNumeric: /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\b/gi, // 'g' flag pour trouver toutes les occurrences
    periodStart:
      /\bdébut\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
    periodEnd:
      /\bfin\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
    relativeDays: /\bdans\s+(\d+)\s+jours?\b/i,
    relativeWeeks: /\bdans\s+(\d+)\s+semaines?\b/i,
  },
};

// Cache pour les résultats de parsing (TTL: 5 minutes)
const parsingCache = new Map<string, { result: ParsedTemporalInput; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Parse une expression temporelle et retourne une structure analysée.
 */
export async function parseTemporalInput(
  userInput: string,
  lang: "fr" | "en" = "fr",
): Promise<ParsedTemporalInput> {
  // Vérifier le cache
  const cacheKey = `${lang}:${userInput}`;
  const cached = parsingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const config = lang === "fr" ? FRENCH_CONFIG : FRENCH_CONFIG; // TODO: Ajouter config anglaise

  // Charger Chrono-node dynamiquement
  if (!config.chrono) {
    const chrono = await import("chrono-node");
    config.chrono = lang === "fr" ? chrono.fr : chrono.en;
  }

  const lowerInput = userInput.toLowerCase();
  const detectedKeywords: string[] = [];

  // 1. Parsing avec Chrono-node (expressions temporelles relatives)
  let chronoParsedDates: ChronoParsedDate[] = [];
  let chronoParsedText: string | undefined;
  try {
    if (!config.chrono) {
      throw ErrorFactory.validation(
        "Chrono parser not initialized",
        "Le parser temporel n'est pas initialisé",
      );
    }
    chronoParsedDates = config.chrono.parse(userInput, new Date(), { forwardDate: true });
    if (chronoParsedDates.length > 0) {
      chronoParsedText = chronoParsedDates[0].text.trim();
      detectedKeywords.push(`chrono:${chronoParsedText}`);
    }
  } catch (error) {
    // Si Chrono-node échoue, continuer avec les détections manuelles
  }

  // 2. Détection manuelle des jours de la semaine (peut y avoir plusieurs : "vendredi ou samedi")
  // Créer une copie globale du regex pour matchAll
  const dayOfWeekRegex = new RegExp(
    config.patterns.dayOfWeek.source,
    config.patterns.dayOfWeek.flags + "g",
  );
  const dayOfWeekMatches = Array.from(userInput.matchAll(dayOfWeekRegex));
  const dayOfWeek: number[] | undefined =
    dayOfWeekMatches.length > 0
      ? Array.from(
        new Set(dayOfWeekMatches.map((match) => config.dayNames.indexOf(match[1].toLowerCase()))),
      )
      : undefined;
  if (dayOfWeek && dayOfWeek.length > 0) {
    detectedKeywords.push(`day:${dayOfWeek.map((d) => config.dayNames[d]).join(",")}`);
  }

  // 3. Détection des mois explicites
  const monthMatch = userInput.match(config.patterns.month);
  const month: number | undefined = monthMatch
    ? config.monthNames.indexOf(monthMatch[1].toLowerCase())
    : undefined;
  if (month !== undefined) {
    detectedKeywords.push(`month:${config.monthNames[month]}`);
  }

  // 4. Détection des dates numériques ("samedi 23", "dimanche 24")
  // ⚠️ IMPORTANT : Peut y avoir plusieurs dates numériques ("samedi 23 ou dimanche 24")
  const dateNumericMatches = Array.from(userInput.matchAll(config.patterns.dateNumeric));
  const dateNumerics: Array<{ day: number; dayOfWeek?: number }> = dateNumericMatches.map(
    (match) => ({
      day: parseInt(match[2], 10),
      dayOfWeek: config.dayNames.indexOf(match[1].toLowerCase()),
    }),
  );
  const dateNumeric: { day: number; dayOfWeek?: number } | undefined =
    dateNumerics.length > 0 ? dateNumerics[0] : undefined;
  // Si plusieurs dates numériques détectées, stocker toutes pour le calcul de fenêtre
  if (dateNumerics.length > 0) {
    detectedKeywords.push(`dateNumeric:${dateNumerics.map((d) => d.day).join(",")}`);
  }

  // 5. Détection des périodes ("fin mars", "début avril", "semaine du 12")
  const periodStartMatch = userInput.match(config.patterns.periodStart);
  const periodEndMatch = userInput.match(config.patterns.periodEnd);
  // Détecter "semaine du X" où X est un jour du mois
  const semaineDuMatch = userInput.match(/\bsemaine\s+du\s+(\d{1,2})\b/i);
  const period: "start" | "end" | undefined = periodStartMatch
    ? "start"
    : periodEndMatch
      ? "end"
      : undefined;
  if (period) {
    detectedKeywords.push(`period:${period}`);
  }
  // Stocker le jour du mois pour "semaine du X"
  const semaineDuDay: number | undefined = semaineDuMatch
    ? parseInt(semaineDuMatch[1], 10)
    : undefined;
  if (semaineDuDay) {
    detectedKeywords.push(`semaineDu:${semaineDuDay}`);
  }

  // 6. Détection des expressions relatives ("dans X jours", "dans X semaines", "dans 1 mois")
  const relativeDaysMatch = userInput.match(config.patterns.relativeDays);
  const relativeWeeksMatch = userInput.match(config.patterns.relativeWeeks);
  // Détecter "dans 1 mois" = ~4 semaines
  const relativeMonthsMatch = userInput.match(/\bdans\s+(\d+)\s+mois\b/i);
  const relativeDays: number | undefined = relativeDaysMatch
    ? parseInt(relativeDaysMatch[1], 10)
    : undefined;
  let relativeWeeks: number | undefined = relativeWeeksMatch
    ? parseInt(relativeWeeksMatch[1], 10)
    : undefined;
  // Convertir "dans 1 mois" en semaines (~4 semaines)
  if (relativeMonthsMatch) {
    const months = parseInt(relativeMonthsMatch[1], 10);
    relativeWeeks = months * 4; // Approximation : 1 mois = 4 semaines
    detectedKeywords.push(`relativeMonths:${months} (→ ${relativeWeeks} semaines)`);
  }
  if (relativeDays) {
    detectedKeywords.push(`relativeDays:${relativeDays}`);
  }
  if (relativeWeeks) {
    detectedKeywords.push(`relativeWeeks:${relativeWeeks}`);
  }

  // 7. Détection du contexte
  const isMealContext = /(déjeuner|dîner|brunch|lunch|repas|partenariats)/i.test(userInput);
  const isProfessionalContext =
    /(réunion|travail|équipe|meeting|bureau|projet|client|présentation)/i.test(userInput);

  // 8. Calculer les dates cibles et la fenêtre autorisée
  const { targetDates, allowedDates } = calculateDateWindow({
    chronoParsedDates,
    dayOfWeek,
    month,
    period,
    dateNumeric,
    dateNumerics: dateNumerics.length > 0 ? dateNumerics : undefined,
    relativeDays,
    relativeWeeks,
    semaineDuDay,
    isProfessionalContext,
  });

  // 9. Déterminer le type de demande
  const type = determineRequestType({
    dayOfWeek,
    month,
    period,
    dateNumeric,
    relativeDays,
    relativeWeeks,
    chronoParsedText,
  });

  // 10. Calculer les attentes de génération
  const { expectedDatesCount, expectedSlotsCount } = calculateExpectedCounts({
    type,
    dayOfWeek,
    month,
    relativeDays,
    relativeWeeks,
    isMealContext,
    dateNumerics: dateNumerics.length > 0 ? dateNumerics : undefined,
  });

  const result: ParsedTemporalInput = {
    targetDates,
    allowedDates,
    type,
    dayOfWeek,
    month,
    period,
    relativeDays,
    relativeWeeks,
    dateNumeric,
    isMealContext,
    isProfessionalContext,
    expectedDatesCount,
    expectedSlotsCount,
    chronoParsedText,
    detectedKeywords,
  };

  // Log détaillé du parsing chrono (ÉTAPE 3)
  getDebugLogger().then((logger) => {
    if (logger?.isGeminiDebugEnabled()) {
      logger.GeminiFlowLogger.logChronoParsing("temporal-parser", {
        chronoResult: chronoParsedDates.map((d) => ({
          text: d.text,
          date: d.start.date().toISOString(),
        })),
        chronoText: chronoParsedText,
        chronoDate: chronoParsedDates[0]?.start.date().toISOString(),
        detectedKeywords,
        dayOfWeek,
        month,
        dateNumeric,
        relativeDays,
        relativeWeeks,
        allowedDates,
        targetDates: targetDates.map((d) => d.toISOString()),
        parseType: type,
      });
    }
  });

  // Mettre en cache
  parsingCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

/**
 * Calcule la fenêtre de dates autorisées basée sur les contraintes détectées.
 */
function calculateDateWindow(params: {
  chronoParsedDates: ChronoParsedDate[];
  dayOfWeek?: number[];
  month?: number;
  period?: "start" | "end";
  dateNumeric?: { day: number; dayOfWeek?: number };
  dateNumerics?: Array<{ day: number; dayOfWeek?: number }>; // Pour plusieurs dates numériques
  relativeDays?: number;
  relativeWeeks?: number;
  semaineDuDay?: number; // Jour du mois pour "semaine du X"
  isProfessionalContext: boolean;
}): { targetDates: Date[]; allowedDates: string[] } {
  const {
    chronoParsedDates,
    dayOfWeek,
    month,
    period,
    dateNumeric,
    dateNumerics,
    relativeDays,
    relativeWeeks,
    semaineDuDay,
    isProfessionalContext,
  } = params;

  const targetDates: Date[] = [];
  const allowedDates: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Cas 1: Dates numériques explicites ("samedi 23", "dimanche 24")
  if (dateNumerics && dateNumerics.length > 0) {
    // Si plusieurs dates numériques, générer pour chacune
    dateNumerics.forEach((dn) => {
      const targetDate = new Date(currentYear, now.getMonth(), dn.day);
      // Si la date est passée ce mois, prendre le mois suivant
      if (targetDate < now) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      // Vérifier que c'est le bon jour de la semaine si spécifié
      if (dn.dayOfWeek !== undefined && targetDate.getDay() !== dn.dayOfWeek) {
        // Ajuster pour trouver le bon jour de la semaine dans le mois
        const daysDiff = dn.dayOfWeek - targetDate.getDay();
        targetDate.setDate(targetDate.getDate() + daysDiff);
      }
      targetDates.push(targetDate);
      allowedDates.push(formatDateLocal(targetDate));
    });
    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas 1b: Une seule date numérique (fallback pour compatibilité)
  if (dateNumeric) {
    const targetDate = new Date(currentYear, now.getMonth(), dateNumeric.day);
    // Si la date est passée ce mois, prendre le mois suivant
    if (targetDate < now) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    // Vérifier que c'est le bon jour de la semaine si spécifié
    if (dateNumeric.dayOfWeek !== undefined && targetDate.getDay() !== dateNumeric.dayOfWeek) {
      const daysDiff = dateNumeric.dayOfWeek - targetDate.getDay();
      targetDate.setDate(targetDate.getDate() + daysDiff);
    }
    targetDates.push(targetDate);
    allowedDates.push(formatDateLocal(targetDate));
    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas 1.5: "Semaine du X" (ex: "semaine du 12")
  if (semaineDuDay !== undefined) {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // Trouver la date du jour X dans le mois courant ou suivant
    const targetDate = new Date(currentYear, currentMonth, semaineDuDay);
    if (targetDate < now) {
      // Si la date est passée, prendre le mois suivant
      targetDate.setMonth(targetDate.getMonth() + 1);
    }

    // Trouver le lundi de cette semaine
    const dayOfWeekTarget = targetDate.getDay();
    const daysToMonday = dayOfWeekTarget === 0 ? -6 : 1 - dayOfWeekTarget;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + daysToMonday);

    // Générer lundi à dimanche (ou lundi à vendredi si contexte pro)
    const daysToGenerate = isProfessionalContext ? 5 : 7;
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      if (date >= now) {
        targetDates.push(date);
        allowedDates.push(formatDateLocal(date));
      }
    }
    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas 2: Mois explicite ("décembre", "mars")
  if (month !== undefined) {
    const startDate = new Date(currentYear, month, 1);
    const endDate = new Date(currentYear, month + 1, 0); // Dernier jour du mois

    // Si période "fin" ou "début"
    if (period === "end") {
      // Dernière quinzaine (jour >= 15)
      for (let day = 15; day <= endDate.getDate(); day++) {
        const date = new Date(currentYear, month, day);
        if (
          date >= now &&
          (!isProfessionalContext || (date.getDay() !== 0 && date.getDay() !== 6))
        ) {
          allowedDates.push(formatDateLocal(date));
        }
      }
    } else if (period === "start") {
      // Première quinzaine (jour <= 15)
      for (let day = 1; day <= 15; day++) {
        const date = new Date(currentYear, month, day);
        if (
          date >= now &&
          (!isProfessionalContext || (date.getDay() !== 0 && date.getDay() !== 6))
        ) {
          allowedDates.push(formatDateLocal(date));
        }
      }
    } else {
      // Tout le mois
      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(currentYear, month, day);
        if (
          date >= now &&
          (!isProfessionalContext || (date.getDay() !== 0 && date.getDay() !== 6))
        ) {
          allowedDates.push(formatDateLocal(date));
        }
      }
    }

    // Filtrer par jour de la semaine si spécifié
    if (dayOfWeek) {
      const filtered = allowedDates.filter((dateStr) => {
        const date = new Date(dateStr);
        return dayOfWeek.includes(date.getDay());
      });
      return { targetDates, allowedDates: filtered };
    }

    return { targetDates, allowedDates };
  }

  // Cas 3: Expression relative "dans X semaines" (AVANT Chrono-node pour éviter les conflits)
  // ⚠️ IMPORTANT : Traiter relativeWeeks AVANT Chrono-node pour éviter que Chrono-node capture
  // "dans 4 semaines" et génère seulement 1 date au lieu d'utiliser la logique relativeWeeks
  if (relativeWeeks && !dayOfWeek) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + relativeWeeks * 7);
    targetDates.push(targetDate);

    // Pour "dans X semaines", générer une fenêtre plus large pour avoir 5-7 dates
    // ±5 jours pour avoir assez de dates
    for (let offset = -5; offset <= 5; offset++) {
      const windowDate = new Date(targetDate);
      windowDate.setDate(targetDate.getDate() + offset);
      // Filtrer les dates passées
      if (windowDate < now) {
        continue;
      }
      if (!isProfessionalContext || (windowDate.getDay() !== 0 && windowDate.getDay() !== 6)) {
        allowedDates.push(formatDateLocal(windowDate));
      }
    }
    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas 3b: Jour de la semaine avec période ("lundi dans 2 semaines")
  if (dayOfWeek && relativeWeeks) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + relativeWeeks * 7);

    // Trouver les lundis autour de cette date
    const daysToTarget = dayOfWeek[0] - targetDate.getDay();
    const firstTargetDay = new Date(targetDate);
    firstTargetDay.setDate(targetDate.getDate() + daysToTarget);

    // Générer 1-2 dates (le lundi de la semaine cible et celui d'après si nécessaire)
    for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
      const date = new Date(firstTargetDay);
      date.setDate(firstTargetDay.getDate() + weekOffset * 7);
      if (date >= now) {
        targetDates.push(date);
        allowedDates.push(formatDateLocal(date));
      }
    }

    return { targetDates, allowedDates };
  }

  // Cas 4: Chrono-node a détecté quelque chose (seulement si relativeWeeks n'a pas été traité)
  if (chronoParsedDates.length > 0 && !relativeWeeks) {
    let targetDateObj = chronoParsedDates[0].start.date();

    // Si chrono a renvoyé une date passée ET qu'un jour de semaine est spécifié,
    // recalculer vers la prochaine occurrence de ce jour
    if (targetDateObj < now && dayOfWeek && dayOfWeek.length > 0) {
      const targetDayOfWeek = dayOfWeek[0]; // Premier jour spécifié (ex: 3 pour mercredi)
      const today = new Date(now);
      const currentDayOfWeek = today.getDay();
      // Calculer les jours jusqu'à la prochaine occurrence
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Semaine prochaine
      }
      targetDateObj = new Date(today);
      targetDateObj.setDate(today.getDate() + daysUntilTarget);
    }

    targetDates.push(targetDateObj);

    // Vérifier si c'est "semaine prochaine" pour générer plus de dates
    const isWeekExpression = /semaine/i.test(chronoParsedDates[0].text);

    if (isWeekExpression && (!dayOfWeek || dayOfWeek.length === 0)) {
      // "semaine prochaine" sans jour spécifique → générer toute la semaine (5-7 dates)
      const dayOfWeekTarget = targetDateObj.getDay();
      const daysToMonday = dayOfWeekTarget === 0 ? -6 : 1 - dayOfWeekTarget;
      const monday = new Date(targetDateObj);
      monday.setDate(targetDateObj.getDate() + daysToMonday);

      // Générer lundi à dimanche (ou lundi à vendredi si contexte pro)
      const daysToGenerate = isProfessionalContext ? 5 : 7;
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        if (date >= now) {
          allowedDates.push(formatDateLocal(date));
        }
      }
      return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
    }

    // Fenêtre normale ±3 jours autour de la date cible
    for (let offset = -3; offset <= 3; offset++) {
      const windowDate = new Date(targetDateObj);
      windowDate.setDate(targetDateObj.getDate() + offset);

      // Filtrer les dates passées
      if (windowDate < now) {
        continue;
      }

      // Si contexte professionnel, exclure week-end
      const dayOfWeekNum = windowDate.getDay();
      if (isProfessionalContext && (dayOfWeekNum === 0 || dayOfWeekNum === 6)) {
        continue;
      }

      // Filtrer par jour de la semaine si spécifié (peut être plusieurs jours)
      if (dayOfWeek && dayOfWeek.length > 0 && !dayOfWeek.includes(dayOfWeekNum)) {
        continue;
      }

      allowedDates.push(formatDateLocal(windowDate));
    }

    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas 5: Expression relative "dans X jours"
  if (relativeDays) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + relativeDays);
    targetDates.push(targetDate);

    // Fenêtre ±2 jours autour (pour "dans 5 jours" = 5 dates possibles)
    // Mais si relativeDays > 3, générer plus de dates pour avoir 3-5 dates valides
    const windowSize = relativeDays <= 3 ? 2 : 3; // ±2 pour "dans 3 jours", ±3 pour "dans 5 jours"
    for (let offset = -windowSize; offset <= windowSize; offset++) {
      const windowDate = new Date(targetDate);
      windowDate.setDate(targetDate.getDate() + offset);
      // Filtrer les dates passées
      if (windowDate < now) {
        continue;
      }
      if (!isProfessionalContext || (windowDate.getDay() !== 0 && windowDate.getDay() !== 6)) {
        allowedDates.push(formatDateLocal(windowDate));
      }
    }
    return { targetDates, allowedDates: Array.from(new Set(allowedDates)) };
  }

  // Cas par défaut: aucune date détectée
  return { targetDates: [], allowedDates: [] };
}

/**
 * Détermine le type de demande temporelle.
 */
function determineRequestType(params: {
  dayOfWeek?: number[];
  month?: number;
  period?: "start" | "end";
  dateNumeric?: { day: number; dayOfWeek?: number };
  relativeDays?: number;
  relativeWeeks?: number;
  chronoParsedText?: string;
}): ParsedTemporalInput["type"] {
  const { dayOfWeek, month, period, dateNumeric, relativeDays, relativeWeeks, chronoParsedText } =
    params;

  if (dateNumeric) return "specific_date";
  if (dayOfWeek && relativeWeeks) return "day_of_week";
  if (dayOfWeek && !relativeWeeks && !relativeDays) return "day_of_week";
  if (month) return "month";
  if (relativeDays || relativeWeeks) return "relative";
  if (chronoParsedText) {
    // Analyser le texte parsé par Chrono-node
    const lower = chronoParsedText.toLowerCase();
    if (/^(demain|aujourd'hui)$/.test(lower)) return "specific_date";
    if (/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/.test(lower)) return "day_of_week";
    if (/dans \d+ jours?/.test(lower)) return "relative";
    if (/semaine/.test(lower)) return "period";
  }

  return "unknown";
}

/**
 * Calcule les attentes de génération (nombre de dates et créneaux).
 */
function calculateExpectedCounts(params: {
  type: ParsedTemporalInput["type"];
  dayOfWeek?: number[];
  month?: number;
  relativeDays?: number;
  relativeWeeks?: number;
  isMealContext: boolean;
  dateNumerics?: Array<{ day: number; dayOfWeek?: number }>;
}): { expectedDatesCount: number | string; expectedSlotsCount: number | string } {
  const { type, dayOfWeek, month, relativeDays, relativeWeeks, isMealContext, dateNumerics } =
    params;

  // Cas spécial: Repas + date spécifique → 1 date, 1 créneau (sauf partenariats)
  if (isMealContext && (type === "specific_date" || type === "day_of_week")) {
    // Exception partenariats: 1 date mais 2-3 créneaux
    return { expectedDatesCount: 1, expectedSlotsCount: "2-3" };
  }

  // Date spécifique → 1 date (sauf si plusieurs dates numériques ou mois + jour de la semaine)
  if (type === "specific_date") {
    // Cas spécial : "samedi 23 ou dimanche 24" = plusieurs dates numériques
    if (dateNumerics && dateNumerics.length > 1) {
      return { expectedDatesCount: dateNumerics.length, expectedSlotsCount: "2-3" };
    }
    // Cas spécial : "dimanche matin en décembre" = plusieurs dimanches possibles
    if (month !== undefined && dayOfWeek && dayOfWeek.length > 0) {
      return { expectedDatesCount: "2-3", expectedSlotsCount: "2-3" };
    }
    return { expectedDatesCount: 1, expectedSlotsCount: "2-3" };
  }

  // Jour de la semaine avec période → 1-2 dates
  if (type === "day_of_week" && relativeWeeks) {
    return { expectedDatesCount: "1-2", expectedSlotsCount: "2-3" };
  }

  // Jour de la semaine seul → 1 date (sauf si plusieurs jours détectés)
  if (type === "day_of_week") {
    // Cas spécial : "vendredi ou samedi" = plusieurs jours
    if (dayOfWeek && dayOfWeek.length > 1) {
      return { expectedDatesCount: dayOfWeek.length, expectedSlotsCount: "2-3" };
    }
    return { expectedDatesCount: 1, expectedSlotsCount: "2-3" };
  }

  // Expression relative "dans X jours"
  if (type === "relative" && relativeDays) {
    if (relativeDays <= 7) {
      return { expectedDatesCount: "3-5", expectedSlotsCount: "2-3" };
    }
    return { expectedDatesCount: "5-7", expectedSlotsCount: "2-3" };
  }

  // Expression relative "dans X semaines" ou période
  if (type === "relative" || type === "period" || type === "month") {
    return { expectedDatesCount: "5-7", expectedSlotsCount: "2-3" };
  }

  // Par défaut
  return { expectedDatesCount: "3-5", expectedSlotsCount: "2-3" };
}

/**
 * Nettoie le cache de parsing (utile pour les tests).
 */
export function clearParsingCache(): void {
  parsingCache.clear();
}
