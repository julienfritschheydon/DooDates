import { DatePollSuggestion } from "@/lib/gemini";
import type { ParsedTemporalInput } from "@/lib/temporalParser";

export interface PostProcessingOptions {
  userInput: string;
  allowedDates?: string[];
  parsedTemporal?: ParsedTemporalInput; // Optionnel : si fourni, on l'utilise au lieu de recalculer
}

interface ProcessedSuggestion {
  dates: string[];
  timeSlots: DatePollSuggestion["timeSlots"];
  type: DatePollSuggestion["type"];
}

// Associe les mots-clés détectés dans le prompt aux jours recherchés (0 = dimanche → 6 = samedi).
// Ces patterns nous permettent de filtrer les dates selon la contrainte exprimée par l'utilisateur.
const DAY_KEYWORD_PATTERNS: Array<{ pattern: RegExp; days: number[] }> = [
  { pattern: /\bdimanche(s)?\b/, days: [0] },
  { pattern: /\blundi(s)?\b/, days: [1] },
  { pattern: /\bmardi(s)?\b/, days: [2] },
  { pattern: /\bmercredi(s)?\b/, days: [3] },
  { pattern: /\bjeudi(s)?\b/, days: [4] },
  { pattern: /\bvendredi(s)?\b/, days: [5] },
  { pattern: /\bsamedi(s)?\b/, days: [6] },
  { pattern: /\bweek-?end\b/, days: [0, 6] },
];

// Formate un entier en chaîne d'heure avec zéro padding (ex. 8 → "08").
function formatTimePart(value: number): string {
  return value.toString().padStart(2, "0");
}

// Calcule l'heure de fin en ajoutant une durée (en minutes) au couple (heure, minute) de départ.
function addDuration(startHour: number, startMinute: number, durationMinutes: number): string {
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);
  startDate.setMinutes(startDate.getMinutes() + durationMinutes);
  return `${formatTimePart(startDate.getHours())}:${formatTimePart(startDate.getMinutes())}`;
}

// Crée un créneau horaire standardisé pour la suggestion.
// On accepte soit une date unique, soit un tableau (cas Gemini : slot partagé sur plusieurs dates).
function createSlot(
  date: string[] | string,
  startHour: number,
  startMinute: number,
  durationMinutes: number,
): DatePollSuggestion["timeSlots"][number] {
  const datesArray = Array.isArray(date) ? date : [date];
  const start = `${formatTimePart(startHour)}:${formatTimePart(startMinute)}`;
  const end = addDuration(startHour, startMinute, durationMinutes);

  return {
    start,
    end,
    dates: datesArray,
  };
}

// Analyse le prompt à la recherche d'horaires explicites du type "10h" ou "18h30".
// Retourne toutes les occurrences pour pouvoir générer des créneaux précis.
function extractTimesFromInput(input: string): Array<{ hour: number; minute: number }> {
  const matches: Array<{ hour: number; minute: number }> = [];
  const timeRegex = /(\d{1,2})h(?:\s?([0-5]\d))?/g;
  let match: RegExpExecArray | null;

  while ((match = timeRegex.exec(input)) !== null) {
    const hour = parseInt(match[1], 10);
    if (Number.isNaN(hour) || hour > 23) {
      continue;
    }

    const minute = match[2] ? parseInt(match[2], 10) : 0;
    matches.push({ hour, minute });
  }

  return matches;
}

// Filtre la liste des dates proposées par Gemini selon les mots-clés de jours présents dans le prompt.
// Si aucun mot-clé n'est détecté, on retourne la liste complète (pas de filtrage).
function filterDatesByDayKeywords(dates: string[], input: string): string[] {
  const matchedDays = new Set<number>();

  DAY_KEYWORD_PATTERNS.forEach(({ pattern, days }) => {
    if (pattern.test(input)) {
      days.forEach((day) => matchedDays.add(day));
    }
  });

  if (matchedDays.size === 0) {
    return dates;
  }

  return dates.filter((date) => matchedDays.has(new Date(date).getDay()));
}

// Génère un fallback de créneaux basiques (matin / fin de matinée / début d'après-midi)
// utilisé lorsque ni Gemini ni nos règles contextualisées ne fournissent de slots pertinents.
function buildDefaultSlots(dates: string[]): DatePollSuggestion["timeSlots"] | undefined {
  if (dates.length === 0) {
    return undefined;
  }

  return [
    { start: "09:00", end: "10:00", dates },
    { start: "11:00", end: "12:00", dates },
    { start: "14:00", end: "15:00", dates },
  ];
}

function isDay(date: string, day: number): boolean {
  return new Date(date).getDay() === day;
}

function buildDisabledTimeSlots(dates: string[]): DatePollSuggestion["timeSlots"] {
  return dates.map((date) => ({
    start: "00:00",
    end: "23:59",
    dates: [date],
  }));
}

function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function clampDatesToWindow(
  dates: string[] | undefined,
  allowedDates: string[] | undefined,
): string[] | undefined {
  if (!dates) {
    return dates;
  }

  if (!allowedDates || allowedDates.length === 0) {
    return dates;
  }

  const allowed = new Set(allowedDates);
  return dates.filter((date) => allowed.has(date));
}

// Filtre les dates générées selon les contraintes explicites de mois mentionnées dans le prompt.
function filterDatesByExplicitConstraints(dates: string[], userInput: string): string[] {
  const lowerInput = userInput.toLowerCase();

  // Détection de mois explicites
  const currentYear = new Date().getFullYear();
  const monthPatterns = [
    { pattern: /\bdécembre\b/i, month: 11 },
    { pattern: /\bnovembre\b/i, month: 10 },
    { pattern: /\boctobre\b/i, month: 9 },
    { pattern: /\bseptembre\b/i, month: 8 },
    { pattern: /\baoût\b/i, month: 7 },
    { pattern: /\bjuillet\b/i, month: 6 },
    { pattern: /\bjuin\b/i, month: 5 },
    { pattern: /\bmai\b/i, month: 4 },
    { pattern: /\bavril\b/i, month: 3 },
    { pattern: /\bmars\b/i, month: 2 },
    { pattern: /\bfévrier\b/i, month: 1 },
    { pattern: /\bjanvier\b/i, month: 0 },
  ];

  const targetMonths: number[] = [];
  monthPatterns.forEach(({ pattern, month }) => {
    if (pattern.test(lowerInput)) {
      targetMonths.push(month);
    }
  });

  if (targetMonths.length === 0) {
    return dates;
  }

  // Filtrer pour ne garder que les dates dans les mois cibles
  return dates.filter((date) => {
    const dateObj = new Date(date);
    const month = dateObj.getMonth();
    return targetMonths.includes(month);
  });
}

// Filtre les dates selon les périodes mentionnées ("fin [mois]", "début [mois]").
function filterDatesByPeriod(dates: string[], userInput: string): string[] {
  const lowerInput = userInput.toLowerCase();

  if (
    /\bfin\s+(décembre|novembre|mars|avril|mai|juin|juillet|août|septembre|octobre)/i.test(
      lowerInput,
    )
  ) {
    // Pour "fin [mois]", ne garder que les dates de la dernière quinzaine (jour >= 15)
    return dates.filter((date) => {
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      return day >= 15;
    });
  }

  if (
    /\bdébut\s+(décembre|novembre|mars|avril|mai|juin|juillet|août|septembre|octobre)/i.test(
      lowerInput,
    )
  ) {
    // Pour "début [mois]", ne garder que les dates de la première quinzaine (jour <= 15)
    return dates.filter((date) => {
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      return day <= 15;
    });
  }

  return dates;
}

// Pour les requêtes mentionnant explicitement le week-end, on force la présence
// d'un samedi et d'un dimanche (si disponibles) afin de respecter la règle métier.
function ensureWeekendCoverage(
  dates: string[] | undefined,
  userInput: string,
): string[] | undefined {
  if (!dates || dates.length <= 2) {
    return dates;
  }

  if (!/week-?end|samedi|dimanche/.test(userInput)) {
    return dates;
  }

  const saturdays = dates.filter((date) => new Date(date).getDay() === 6);
  const sundays = dates.filter((date) => new Date(date).getDay() === 0);

  if (saturdays.length === 0 || sundays.length === 0) {
    return dates;
  }

  const firstSaturday = saturdays[0];
  const firstSunday = sundays[0];
  return [firstSaturday, firstSunday];
}

// Ajuste les créneaux existants selon les règles métier détectées dans le prompt :
// - stand-up / express → 30 min
// - réunion d'équipe → 60 min minimum
// - visio → entre 18h et 20h, max 2 propositions
// - week-end → conserve uniquement les slots week-end (pair samedi/dimanche)
function enforceDurationRules(
  suggestion: DatePollSuggestion,
  userInput: string,
): DatePollSuggestion["timeSlots"] | undefined {
  if (!suggestion.timeSlots || suggestion.timeSlots.length === 0) {
    return suggestion.timeSlots;
  }

  const lowerInput = userInput.toLowerCase();
  const requiresShortDuration = /stand-up|standup|express|rapide/.test(lowerInput);
  const requiresWeekendPair = /week-end|weekend/.test(lowerInput);
  const isVisio = /visio|visioconférence|visioconference/.test(lowerInput);
  const isReunionEquipe =
    /réunion d'équipe|reunion d'equipe|équipe éducative|equipe educative/.test(lowerInput);

  let processedSlots = suggestion.timeSlots;

  if (requiresShortDuration) {
    processedSlots = processedSlots.map((slot) => ({
      ...slot,
      end: addMinutes(slot.start, 30),
    }));
  }

  if (isReunionEquipe) {
    processedSlots = processedSlots.map((slot) => ({
      ...slot,
      end: addMinutes(slot.start, 60),
    }));
  }

  if (isVisio) {
    processedSlots = processedSlots.filter((slot) => {
      const start = parseTime(slot.start);
      const end = parseTime(slot.end);
      return start.hour >= 18 && end.hour <= 20;
    });

    if (processedSlots.length > 2) {
      processedSlots = processedSlots.slice(0, 2);
    }
  }

  if (requiresWeekendPair) {
    const weekendSlots = processedSlots.filter((slot) => {
      const slotDates = slot.dates || suggestion.dates || [];
      return slotDates.some((date) => isWeekend(date));
    });

    if (weekendSlots.length > 0) {
      processedSlots = weekendSlots.slice(0, 2);
    }
  }

  return processedSlots;
}

// Utilitaire pour décaler une heure de début existante (format "HH:MM") d'une durée donnée.
function addMinutes(start: string, minutesToAdd: number): string {
  const { hour, minute } = parseTime(start);
  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute + minutesToAdd);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// Parse un horaire au format "HH:MM" pour des calculs ultérieurs.
function parseTime(time: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = time.split(":");
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
  };
}

// Détecte le nombre explicite de créneaux/dates attendu dans le prompt.
// Retourne null si aucun nombre explicite n'est détecté.
function detectExpectedSlotCount(userInput: string): number | null {
  const lowerInput = userInput.toLowerCase();

  // Détection de nombres explicites (priorité aux nombres plus élevés)
  const explicitCounts = [
    { pattern: /\bcinq\s+(créneaux?|dates?)\b/, count: 5 },
    { pattern: /\bquatre\s+(créneaux?|dates?)\b/, count: 4 },
    { pattern: /\btrois\s+(créneaux?|dates?|soirées?)\b/, count: 3 },
    { pattern: /\bdeux\s+(créneaux?|dates?|soirées?|slots?)\b/, count: 2 },
    // "un créneau" seulement si pas dans un contexte nécessitant plusieurs créneaux (déjeuner, etc.)
    {
      pattern: /\bun\s+(créneau|slot|horaire)\b/,
      count: 1,
      skipIf: /déjeuner|dejeuner|partenariats/,
    },
  ];

  for (const { pattern, count, skipIf } of explicitCounts) {
    if (pattern.test(lowerInput)) {
      // Ignorer si le contexte nécessite plusieurs créneaux
      if (skipIf && skipIf.test(lowerInput)) {
        continue;
      }
      return count;
    }
  }

  // Détection de quantités implicites
  if (/\bun\s+(après-midi|matin|soirée)\b/.test(lowerInput)) {
    return 1;
  }

  return null;
}

// Retourne le nombre maximum de créneaux recommandé selon le contexte détecté dans le prompt.
// Version optimisée avec ParsedTemporalInput
function getMaxSlotsForContextFromParsed(parsed: ParsedTemporalInput, lowerInput: string): number {
  // ⚠️ EXCEPTION : Partenariats nécessite toujours 2-3 créneaux même avec date spécifique
  if (/partenariats/.test(lowerInput)) {
    return 3;
  }

  // ⚠️ CAS SPÉCIAL : Repas + date spécifique → 1 créneau uniquement
  if (parsed.isMealContext && (parsed.type === "specific_date" || parsed.type === "day_of_week")) {
    return 1;
  }

  // Contextes nécessitant peu de créneaux
  if (/visite|musée|exposition|footing|course|sport/.test(lowerInput)) {
    return 3;
  }

  // Contextes nécessitant quelques créneaux
  if (/comité/.test(lowerInput)) {
    return 2;
  }

  if (/réunion|atelier|déjeuner|brunch/.test(lowerInput)) {
    return 3;
  }

  // Contextes nécessitant plusieurs créneaux
  if (/apéro|soirée|événement/.test(lowerInput)) {
    return 5;
  }

  // Par défaut : 3 créneaux max
  return 3;
}

// Retourne le nombre maximum de créneaux recommandé selon le contexte détecté dans le prompt.
// Optimisé : accepte lowerInput et flags déjà calculés pour éviter les recalculs
function getMaxSlotsForContext(
  lowerInput: string,
  isMealContext?: boolean,
  isSpecificDate?: boolean,
): number {
  // ⚠️ EXCEPTION : Partenariats nécessite toujours 2-3 créneaux même avec date spécifique
  if (/partenariats/.test(lowerInput)) {
    return 3;
  }

  // ⚠️ CAS SPÉCIAL : Repas + date spécifique → 1 créneau uniquement
  if (isMealContext !== undefined && isSpecificDate !== undefined) {
    if (isMealContext && isSpecificDate) {
      return 1;
    }
  } else {
    // Fallback si flags non fournis (pour compatibilité)
    const mealContext = /(déjeuner|dîner|brunch|lunch|repas)/i.test(lowerInput);
    const specificDate =
      /(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)/i.test(
        lowerInput,
      );
    if (mealContext && specificDate && !/partenariats/.test(lowerInput)) {
      return 1;
    }
  }

  // Contextes nécessitant peu de créneaux
  if (/visite|musée|exposition|footing|course|sport/.test(lowerInput)) {
    return 3; // Augmenté de 2 à 3 pour visite musée
  }

  // Contextes nécessitant quelques créneaux
  // "comité" → généralement 2 créneaux (réunions de quartier sont courtes)
  if (/comité/.test(lowerInput)) {
    return 2;
  }

  if (/réunion|atelier|déjeuner|brunch/.test(lowerInput)) {
    return 3;
  }

  // Contextes nécessitant plusieurs créneaux
  if (/apéro|soirée|événement/.test(lowerInput)) {
    return 5;
  }

  // Par défaut : 3 créneaux max
  return 3;
}

// Limite intelligemment le nombre de créneaux selon le contexte et les attentes explicites.
// Optimisé : accepte lowerInput et flags déjà calculés pour éviter les recalculs
function limitSlotsCount(
  slots: DatePollSuggestion["timeSlots"] | undefined,
  userInput: string,
  lowerInput?: string,
  isMealContext?: boolean,
  isSpecificDate?: boolean,
): DatePollSuggestion["timeSlots"] | undefined {
  if (!slots || slots.length === 0) {
    return slots;
  }

  const explicitCount = detectExpectedSlotCount(userInput);
  const inputLower = lowerInput || userInput.toLowerCase();
  const maxSlots =
    explicitCount || getMaxSlotsForContext(inputLower, isMealContext, isSpecificDate);

  if (slots.length <= maxSlots) {
    return slots;
  }

  // Stratégie 1 : Si plusieurs dates, prendre 1 créneau par date
  const slotsByDate = new Map<string, DatePollSuggestion["timeSlots"][number]>();

  slots.forEach((slot) => {
    const dates = slot.dates || [];
    dates.forEach((date) => {
      if (!slotsByDate.has(date)) {
        slotsByDate.set(date, slot);
      }
    });
  });

  if (slotsByDate.size <= maxSlots && slotsByDate.size > 0) {
    return Array.from(slotsByDate.values()).slice(0, maxSlots);
  }

  // Stratégie 2 : Sélectionner les créneaux les plus représentatifs (début, milieu, fin)
  const step = Math.floor(slots.length / maxSlots);
  const selected: DatePollSuggestion["timeSlots"][number][] = [];

  for (let i = 0; i < maxSlots; i++) {
    const index = Math.min(i * step, slots.length - 1);
    selected.push(slots[index]);
  }

  return selected;
}

// Génère des créneaux horaires "intelligents" en fonction des indices détectés dans le prompt.
// Chaque bloc gère un scénario métier identifié dans la documentation (stand-up, chorale, etc.).
/**
 * Génère des créneaux contextualisés comme FALLBACK uniquement si Gemini n'a pas généré de créneaux.
 *
 * STRATÉGIE :
 * - Les contextes spécifiques (visite musée, footing, visio, brunch, déjeuner, etc.) sont PRINCIPALEMENT
 *   gérés par Gemini via les hints contextuels dans `buildContextualHints()`.
 * - Cette fonction sert de FALLBACK de sécurité pour garantir qu'on génère toujours des créneaux
 *   même si Gemini n'a pas respecté les hints (cas rares).
 *
 * RÈGLES MÉTIER STRICTES (gardées comme fallback) :
 * - Stand-up express : 3 créneaux de 30min le matin
 * - Réunion parents-profs : 2 créneaux début de soirée (18h30-20h00)
 * - Séance photo dimanche matin : 2-3 créneaux (09h00-12h00)
 * - Répétition chorale : samedi matin + dimanche après-midi
 * - Aide aux devoirs : mercredi/vendredi
 * - Kermesse : samedi 10h
 * - Brunch : 11h30-13h00
 * - Déjeuner/partenariats : 2-3 créneaux 11h30-13h30
 * - Plages génériques : matin (09h-12h), après-midi (14h-17h), soirée (18h30-21h)
 *
 * NOTE : Ces fallbacks ne devraient normalement pas être utilisés car Gemini génère directement
 * les bons créneaux grâce aux hints contextuels. Ils servent de sécurité pour les cas limites.
 */
function buildContextualSlots(
  dates: string[],
  userInput: string,
): DatePollSuggestion["timeSlots"] | undefined {
  if (dates.length === 0) {
    return undefined;
  }

  const lowerInput = userInput.toLowerCase();
  const filteredDates = filterDatesByDayKeywords(dates, lowerInput);
  const effectiveDates = filteredDates.length > 0 ? filteredDates : dates;

  // RÈGLE MÉTIER STRICTE : Stand-up express (30min, matin)
  if (
    /stand-?up|standup/.test(lowerInput) ||
    (/express|rapide/.test(lowerInput) && /matin/.test(lowerInput))
  ) {
    const targetDate = effectiveDates[0];
    return targetDate
      ? [
          createSlot(targetDate, 8, 0, 30),
          createSlot(targetDate, 8, 30, 30),
          createSlot(targetDate, 9, 0, 30),
        ]
      : undefined;
  }

  // FALLBACK : Visite musée/exposition (gardé pour compatibilité tests)
  if (/visite|musée|exposition/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    if (targets.length === 0) {
      return undefined;
    }
    // Générer 2-3 créneaux par date en après-midi (14h-17h)
    const slots: DatePollSuggestion["timeSlots"] = [];
    targets.forEach((date) => {
      slots.push(createSlot(date, 14, 0, 90)); // 14h00-15h30
      slots.push(createSlot(date, 15, 0, 90)); // 15h00-16h30
      slots.push(createSlot(date, 16, 0, 60)); // 16h00-17h00
    });
    return slots.length > 0 ? slots : undefined;
  }

  // FALLBACK : Réunion parents-profs (gardé pour compatibilité tests)
  if (/parents?-?profs?/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 2);
    if (targets.length === 0) {
      return undefined;
    }
    return targets.map((date) => createSlot(date, 18, 30, 90));
  }

  // FALLBACK : Kermesse samedi 10h (gardé pour compatibilité tests)
  if (/kermesse/.test(lowerInput) || (/samedi/.test(lowerInput) && /10h/.test(lowerInput))) {
    const saturday = effectiveDates.find((date) => isDay(date, 6)) || effectiveDates[0];
    return saturday ? [createSlot(saturday, 10, 0, 60)] : undefined;
  }

  // FALLBACK : Aide aux devoirs (gardé pour compatibilité tests)
  if (/aide aux devoirs|devoirs/.test(lowerInput)) {
    const slots: DatePollSuggestion["timeSlots"] = [];
    const wednesday = effectiveDates.find((date) => isDay(date, 3));
    const friday = effectiveDates.find((date) => isDay(date, 5));

    if (wednesday) {
      slots.push(createSlot(wednesday, 17, 0, 60));
    }
    if (friday) {
      slots.push(createSlot(friday, 18, 0, 60));
    }

    return slots.length > 0 ? slots : undefined;
  }

  // FALLBACK : Répétition chorale (gardé pour compatibilité tests)
  if (
    /chorale|répétition/.test(lowerInput) &&
    /samedi/.test(lowerInput) &&
    /dimanche/.test(lowerInput)
  ) {
    const saturday = effectiveDates.find((date) => isDay(date, 6));
    const sunday = effectiveDates.find((date) => isDay(date, 0));

    const slots: DatePollSuggestion["timeSlots"] = [];
    if (saturday) {
      slots.push(createSlot(saturday, 10, 0, 120));
    }
    if (sunday) {
      slots.push(createSlot(sunday, 15, 0, 120));
    }

    return slots.length > 0 ? slots : undefined;
  }

  // FALLBACK : Séance photo dimanche matin (gardé pour compatibilité tests)
  if (/photo/.test(lowerInput) && /dimanche/.test(lowerInput) && /matin/.test(lowerInput)) {
    const slots = effectiveDates
      .filter((date) => isDay(date, 0))
      .slice(0, 3)
      .map((date) => createSlot(date, 9, 0, 180));

    return slots.length > 0 ? slots : undefined;
  }

  // FALLBACK : Soirée générique (gardé pour compatibilité tests)
  if (/soir|soirée|soiree|début de soirée|debut de soiree/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 18, 30, 120)) : undefined;
  }

  // FALLBACK : Après-midi générique (gardé pour compatibilité tests)
  if (/après-midi|apres-midi/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 14, 0, 180)) : undefined; // 14h-17h (corrigé)
  }

  // FALLBACK : Matin générique (gardé pour compatibilité tests)
  if (/matin/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 9, 0, 180)) : undefined; // 9h-12h (corrigé)
  }

  // FALLBACK : Brunch (gardé pour compatibilité tests)
  if (/brunch/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 2);
    if (targets.length === 0) {
      return undefined;
    }
    return targets.map((date) => createSlot(date, 11, 30, 90));
  }

  // FALLBACK : Déjeuner/partenariats (gardé pour compatibilité tests)
  if (/déjeuner|dejeuner|partenariats|midi/.test(lowerInput)) {
    const isPartenariats = /partenariats/.test(lowerInput);
    const targets = effectiveDates.slice(0, isPartenariats ? 1 : 2);
    if (targets.length === 0) {
      return undefined;
    }

    // ⚠️ EXCEPTION : Partenariats nécessite toujours 2-3 créneaux même avec date spécifique
    if (isPartenariats) {
      // Générer 2-3 créneaux pour partenariats (11h30-12h30, 12h00-13h00, 12h30-13h30)
      const slots: DatePollSuggestion["timeSlots"] = [];
      slots.push(createSlot(targets[0], 11, 30, 60)); // 11h30-12h30
      slots.push(createSlot(targets[0], 12, 0, 60)); // 12h00-13h00
      slots.push(createSlot(targets[0], 12, 30, 60)); // 12h30-13h30
      return slots;
    }

    // ⚠️ CAS SPÉCIAL : Si date spécifique ("demain", "lundi", etc.) → 1 créneau uniquement
    // Optimisation : utiliser regex déjà compilée (testée une seule fois)
    const hasSpecificDate =
      /(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)/i.test(
        lowerInput,
      );

    if (hasSpecificDate) {
      // Date spécifique → 1 créneau uniquement (12h30-13h30)
      return [createSlot(targets[0], 12, 30, 60)];
    }

    // Période vague → plusieurs créneaux OK
    const slots: DatePollSuggestion["timeSlots"] = [];
    targets.forEach((date) => {
      slots.push(createSlot(date, 11, 30, 60));
      slots.push(createSlot(date, 12, 0, 60));
    });

    if (targets.length > 1 && targets[1]) {
      slots.push(createSlot(targets[1], 12, 30, 60));
    }

    return slots.slice(0, 3);
  }

  // Extraction d'horaires explicites depuis le prompt (ex: "10h", "14h30")
  // Gardé car extraction précise nécessaire même avec hints Gemini
  const explicitTimes = extractTimesFromInput(lowerInput);
  if (explicitTimes.length > 0) {
    const targets = effectiveDates.slice(0, explicitTimes.length || 1);
    if (targets.length === 0) {
      return undefined;
    }

    return explicitTimes.map((time, index) => {
      const targetDate = targets[index] || targets[targets.length - 1];
      return createSlot(targetDate, time.hour, time.minute, 60);
    });
  }

  return undefined;
}

function finalizeType(
  suggestion: DatePollSuggestion,
  processedSlots: DatePollSuggestion["timeSlots"] | undefined,
): DatePollSuggestion["type"] {
  if (!processedSlots || processedSlots.length === 0) {
    return "date";
  }

  return suggestion.type === "date" ? "datetime" : suggestion.type;
}

// Point d'entrée : applique successivement le clamp sur la fenêtre autorisée,
// les règles de durée, la génération de slots contextualisés puis le fallback générique.
export function postProcessSuggestion(
  suggestion: DatePollSuggestion,
  options: PostProcessingOptions,
): DatePollSuggestion {
  let dates = clampDatesToWindow(suggestion.dates, options.allowedDates) || [];

  // Si ParsedTemporalInput est fourni, utiliser ses données au lieu de recalculer
  const parsed = options.parsedTemporal;

  if (parsed) {
    // Utiliser les dates déjà filtrées par le parser
    dates = clampDatesToWindow(suggestion.dates, parsed.allowedDates) || [];

    // Filtrer par jour de la semaine si spécifié dans le parsing
    if (parsed.dayOfWeek && parsed.dayOfWeek.length > 0) {
      dates = dates.filter((dateStr) => {
        const date = new Date(dateStr);
        return parsed.dayOfWeek!.includes(date.getDay());
      });
    }

    // Filtrer par mois si spécifié
    if (parsed.month !== undefined) {
      dates = dates.filter((dateStr) => {
        const date = new Date(dateStr);
        return date.getMonth() === parsed.month;
      });
    }

    // Filtrer par période (fin/début mois) si spécifié
    if (parsed.period && parsed.month !== undefined) {
      dates = dates.filter((dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        if (parsed.period === "end") {
          return day >= 15;
        } else if (parsed.period === "start") {
          return day <= 15;
        }
        return true;
      });
    }
  } else {
    // Fallback : utiliser les anciennes fonctions si ParsedTemporalInput n'est pas fourni
    dates = filterDatesByExplicitConstraints(dates, options.userInput);
    dates = filterDatesByPeriod(dates, options.userInput);
  }

  const ensuredWeekend = ensureWeekendCoverage(dates, options.userInput);
  const contextualDatesPreClamp = ensuredWeekend || dates;
  const contextualDates =
    options.allowedDates || parsed?.allowedDates
      ? clampDatesToWindow(
          contextualDatesPreClamp,
          options.allowedDates || parsed?.allowedDates || [],
        ) || []
      : contextualDatesPreClamp;

  const finalDates =
    contextualDates.length > 0
      ? contextualDates
      : options.allowedDates || parsed?.allowedDates || dates;

  let processedSlots = enforceDurationRules(suggestion, options.userInput);

  // Si pas de créneaux ou nombre insuffisant, générer des créneaux contextualisés
  const lowerInput = options.userInput.toLowerCase();

  // Utiliser les données du parser si disponibles, sinon recalculer
  let isMealContext =
    parsed?.isMealContext ?? /(déjeuner|dîner|brunch|lunch|repas)/i.test(lowerInput);

  // ⚠️ EXCEPTION : Si une plage horaire explicite est spécifiée (ex: "entre 11h et 13h"),
  // ignorer le contexte "repas" car l'utilisateur veut des créneaux dans cette plage, pas la règle "1 créneau uniquement"
  const hasExplicitTimeRange =
    /(entre|de|à)\s+\d+h/i.test(lowerInput) || /\d+h\s*-\s*\d+h/i.test(lowerInput);
  if (hasExplicitTimeRange) {
    isMealContext = false; // Ignorer le contexte repas si plage horaire explicite
  }

  const isSpecificDate = parsed
    ? parsed.type === "specific_date" || parsed.type === "day_of_week"
    : /(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)/i.test(
        lowerInput,
      );
  const isMealWithSpecificDate = isMealContext && isSpecificDate;

  const expectedCount = detectExpectedSlotCount(options.userInput);
  // Utiliser les données du parser si disponibles
  const maxSlotsForContext = parsed
    ? getMaxSlotsForContextFromParsed(parsed, lowerInput)
    : getMaxSlotsForContext(lowerInput, isMealContext, isSpecificDate);

  // ⚠️ CAS SPÉCIAL : Si plusieurs jours de la semaine sont détectés ("vendredi ou samedi"),
  // ignorer "un créneau" car cela signifie "un créneau par jour", pas "un seul créneau total"
  const hasMultipleDays = parsed?.dayOfWeek && parsed.dayOfWeek.length > 1;
  const hasMultipleDates = finalDates.length > 1;

  // Pour certains contextes (déjeuner, visite), ignorer "un créneau" et utiliser le contexte
  // MAIS : si repas + date spécifique, on veut vraiment 1 créneau
  // MAIS : si plusieurs jours/dates, ignorer "un créneau" car cela signifie "un par jour"
  const shouldIgnoreSingleSlot =
    !isMealWithSpecificDate &&
    (/déjeuner|dejeuner|partenariats|visite|musée/.test(lowerInput) ||
      hasMultipleDays ||
      hasMultipleDates);
  const effectiveExpectedCount =
    shouldIgnoreSingleSlot && expectedCount === 1 ? null : expectedCount;
  const targetCount = effectiveExpectedCount || maxSlotsForContext;

  // ⚠️ CAS SPÉCIAL : "un après-midi libre" / "un matin libre" → Accepter 1 créneau si approprié
  // Si le prompt demande explicitement "un" créneau et que Gemini a généré 1 créneau approprié,
  // ne pas forcer l'ajout de créneaux supplémentaires
  const isSingleTimeSlotRequest = /(un|une)\s+(après-midi|matin|soir|soirée|créneau)/i.test(
    options.userInput,
  );
  const hasAppropriateSingleSlot =
    processedSlots &&
    processedSlots.length === 1 &&
    processedSlots[0].dates &&
    processedSlots[0].dates.length > 0;

  const hasInsufficientSlots =
    !processedSlots ||
    processedSlots.length === 0 ||
    (!isSingleTimeSlotRequest && processedSlots.length < targetCount);

  if (hasInsufficientSlots) {
    const contextualSlots = buildContextualSlots(finalDates, options.userInput);
    if (contextualSlots && contextualSlots.length > 0) {
      // Fusionner les créneaux existants avec les nouveaux (éviter les doublons)
      const existingSlots = processedSlots || [];
      const mergedSlots = [...existingSlots];

      // Optimisation : utiliser un Set pour détecter les doublons plus rapidement
      const existingKeys = new Set<string>();
      existingSlots.forEach((slot) => {
        const datesKey = (slot.dates || []).sort().join(",");
        existingKeys.add(`${slot.start}-${slot.end}-${datesKey}`);
      });

      contextualSlots.forEach((newSlot) => {
        const datesKey = (newSlot.dates || []).sort().join(",");
        const key = `${newSlot.start}-${newSlot.end}-${datesKey}`;
        if (!existingKeys.has(key)) {
          mergedSlots.push(newSlot);
          existingKeys.add(key); // Ajouter pour éviter les doublons entre nouveaux slots
        }
      });

      processedSlots = mergedSlots;

      // Si on a toujours pas assez de créneaux après fusion, prendre les premiers créneaux contextualisés
      // ⚠️ IMPORTANT : Ne pas remplacer si on a déjà assez de créneaux, même si c'est moins que contextualSlots
      if (processedSlots.length < targetCount && contextualSlots.length >= targetCount) {
        // Prendre les créneaux contextualisés qui ne sont pas déjà dans mergedSlots
        const contextualOnly = contextualSlots.filter((slot) => {
          const datesKey = (slot.dates || []).sort().join(",");
          const key = `${slot.start}-${slot.end}-${datesKey}`;
          return !existingKeys.has(key);
        });
        if (contextualOnly.length >= targetCount) {
          processedSlots = [
            ...mergedSlots,
            ...contextualOnly.slice(0, targetCount - mergedSlots.length),
          ];
        } else {
          processedSlots = contextualSlots.slice(0, targetCount);
        }
      }
    }
  }

  if (!processedSlots || processedSlots.length === 0) {
    processedSlots = buildDefaultSlots(finalDates);
  }

  // ⚠️ CAS SPÉCIAL : Repas + date spécifique → Forcer 1 créneau uniquement
  if (isMealWithSpecificDate && processedSlots && processedSlots.length > 1) {
    // Forcer 1 créneau uniquement pour repas + date spécifique
    processedSlots = [processedSlots[0]];
  } else {
    // ⚠️ CAS SPÉCIAL : Plusieurs dates détectées → Générer 1 créneau par date si nécessaire
    // Ex: "brunch samedi 23 ou dimanche 24", "footing vendredi soir ou samedi matin"
    // ⚠️ IMPORTANT : Ne pas séparer les créneaux partagés si la réponse de Gemini est appropriée
    // (ex: "brunch samedi 23 ou dimanche 24" avec 1 créneau partagé est correct)
    if (finalDates.length > 1 && processedSlots) {
      // Détecter les créneaux partagés entre plusieurs dates (ex: slot.dates.length > 1)
      const sharedSlots: DatePollSuggestion["timeSlots"] = [];
      const singleDateSlots: DatePollSuggestion["timeSlots"] = [];

      processedSlots.forEach((slot) => {
        const slotDates = slot.dates || [];
        if (slotDates.length > 1) {
          // Créneau partagé → vérifier si on doit le séparer
          sharedSlots.push(slot);
        } else {
          singleDateSlots.push(slot);
        }
      });

      // Si on a des créneaux partagés, vérifier si on doit les séparer
      // Ne séparer QUE si le prompt demande explicitement des créneaux différents
      // Exemples où on DOIT séparer :
      // - "vendredi soir ou samedi matin" → horaires différents mentionnés
      // - "mardi 14h ou jeudi 10h" → horaires explicites différents
      // Exemples où on NE DOIT PAS séparer :
      // - "brunch samedi 23 ou dimanche 24" → même type d'événement, pas d'horaires différents
      // - "réunion lundi ou mardi" → même type d'événement, pas d'horaires différents
      const hasExplicitDifferentTimes =
        // Détecter des horaires différents mentionnés explicitement (ex: "soir" + "matin", "14h" + "10h")
        (/soir|soirée/i.test(options.userInput) && /matin|matinée/i.test(options.userInput)) ||
        // Détecter des heures explicites différentes (ex: "14h" et "10h")
        (/\d+h.*ou.*\d+h/i.test(options.userInput) &&
          (() => {
            const timeMatches = options.userInput.matchAll(/\d+h/i);
            const times = Array.from(timeMatches).map((m) => m[0]);
            return times.length >= 2 && new Set(times).size > 1;
          })());

      const shouldSeparateSharedSlots = sharedSlots.length > 0 && hasExplicitDifferentTimes;

      if (shouldSeparateSharedSlots) {
        const separatedSlots: DatePollSuggestion["timeSlots"] = [];

        sharedSlots.forEach((sharedSlot) => {
          const slotDates = sharedSlot.dates || [];
          slotDates.forEach((date) => {
            // Détecter le contexte (soir/matin) depuis le prompt et la date
            const isEvening = /soir|soirée/i.test(options.userInput);
            const isMorning = /matin|matinée/i.test(options.userInput);

            // Extraire l'heure du créneau partagé
            const [startHour, startMinute] = sharedSlot.start.split(":").map(Number);
            const [endHour, endMinute] = sharedSlot.end.split(":").map(Number);
            const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

            // Si le prompt mentionne des horaires différents pour différentes dates
            // (ex: "vendredi soir ou samedi matin"), adapter l'heure selon la date
            if (isEvening && isMorning) {
              // Les deux contextes sont mentionnés → adapter selon la date
              const dateObj = new Date(date);
              const dayOfWeek = dateObj.getDay(); // 0 = dimanche, 5 = vendredi, 6 = samedi

              if (dayOfWeek === 5) {
                // Vendredi → soir
                separatedSlots.push(createSlot(date, 18, 0, 60)); // 18h-19h
              } else if (dayOfWeek === 6) {
                // Samedi → matin
                separatedSlots.push(createSlot(date, 9, 0, 60)); // 9h-10h
              } else {
                // Par défaut, utiliser l'heure du créneau partagé
                separatedSlots.push(createSlot(date, startHour, startMinute, durationMinutes));
              }
            } else if (isEvening) {
              separatedSlots.push(createSlot(date, 18, 0, 60)); // 18h-19h
            } else if (isMorning) {
              separatedSlots.push(createSlot(date, 9, 0, 60)); // 9h-10h
            } else {
              // Par défaut : utiliser l'heure du créneau partagé ou générer selon le contexte
              if (/brunch/i.test(options.userInput)) {
                separatedSlots.push(createSlot(date, 11, 30, 90)); // 11h30-13h
              } else {
                // Utiliser l'heure du créneau partagé
                separatedSlots.push(createSlot(date, startHour, startMinute, durationMinutes));
              }
            }
          });
        });

        // Remplacer les créneaux partagés par les créneaux séparés
        processedSlots = [...singleDateSlots, ...separatedSlots];
      } else if (processedSlots.length < finalDates.length) {
        // Pas de créneaux partagés mais pas assez de créneaux → générer pour les dates manquantes
        const datesWithSlots = new Set<string>();
        processedSlots.forEach((slot) => {
          (slot.dates || []).forEach((date) => datesWithSlots.add(date));
        });

        const datesWithoutSlots = finalDates.filter((date) => !datesWithSlots.has(date));
        if (datesWithoutSlots.length > 0) {
          // Générer des créneaux contextualisés pour les dates manquantes
          const additionalSlots = buildContextualSlots(datesWithoutSlots, options.userInput);
          if (additionalSlots && additionalSlots.length > 0) {
            processedSlots = [...processedSlots, ...additionalSlots];
          } else {
            // Fallback : générer 1 créneau par date avec horaires appropriés
            datesWithoutSlots.forEach((date) => {
              // Détecter le contexte (soir/matin) depuis le prompt
              const isEvening = /soir|soirée/i.test(options.userInput);
              const isMorning = /matin|matinée/i.test(options.userInput);

              if (isEvening) {
                processedSlots.push(createSlot(date, 18, 0, 60)); // 18h-19h
              } else if (isMorning) {
                processedSlots.push(createSlot(date, 9, 0, 60)); // 9h-10h
              } else {
                // Par défaut : midi pour brunch, matin pour footing
                if (/brunch/i.test(options.userInput)) {
                  processedSlots.push(createSlot(date, 11, 30, 90)); // 11h30-13h
                } else {
                  processedSlots.push(createSlot(date, 9, 0, 60)); // 9h-10h
                }
              }
            });
          }
        }
      }
    }

    // Limiter le nombre de créneaux selon le contexte et les attentes explicites
    // ⚠️ IMPORTANT : Si plusieurs dates et "un créneau" détecté, ignorer la limitation
    // car "un créneau" signifie "un créneau par jour", pas "un seul créneau total"
    if (!isMealWithSpecificDate) {
      const shouldLimit = !(hasMultipleDays || hasMultipleDates) || effectiveExpectedCount !== null;
      if (shouldLimit) {
        processedSlots = limitSlotsCount(
          processedSlots,
          options.userInput,
          lowerInput,
          isMealContext,
          isSpecificDate,
        );
      }
      // Si plusieurs dates détectées et "un créneau" signifie "un par jour", on ignore limitSlotsCount
    }
  }

  const type = finalizeType(suggestion, processedSlots);

  return {
    ...suggestion,
    dates: finalDates,
    timeSlots: processedSlots,
    type,
  };
}
