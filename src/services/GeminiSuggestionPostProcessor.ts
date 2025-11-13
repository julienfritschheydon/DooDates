import { DatePollSuggestion } from "@/lib/gemini";

export interface PostProcessingOptions {
  userInput: string;
  allowedDates?: string[];
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
    { pattern: /\bun\s+(créneau|slot|horaire)\b/, count: 1, skipIf: /déjeuner|dejeuner|partenariats/ },
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
function getMaxSlotsForContext(userInput: string): number {
  const lowerInput = userInput.toLowerCase();

  // Contextes nécessitant peu de créneaux
  if (/visite|musée|exposition|footing|course|sport/.test(lowerInput)) {
    return 2;
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
function limitSlotsCount(
  slots: DatePollSuggestion["timeSlots"] | undefined,
  userInput: string,
): DatePollSuggestion["timeSlots"] | undefined {
  if (!slots || slots.length === 0) {
    return slots;
  }

  const explicitCount = detectExpectedSlotCount(userInput);
  const maxSlots = explicitCount || getMaxSlotsForContext(userInput);

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

  if (/parents?-?profs?/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 2);
    if (targets.length === 0) {
      return undefined;
    }
    return targets.map((date) => createSlot(date, 18, 30, 90));
  }

  if (/kermesse/.test(lowerInput) || (/samedi/.test(lowerInput) && /10h/.test(lowerInput))) {
    const saturday = effectiveDates.find((date) => isDay(date, 6)) || effectiveDates[0];
    return saturday ? [createSlot(saturday, 10, 0, 60)] : undefined;
  }

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

  if (/photo/.test(lowerInput) && /dimanche/.test(lowerInput) && /matin/.test(lowerInput)) {
    const slots = effectiveDates
      .filter((date) => isDay(date, 0))
      .slice(0, 3)
      .map((date) => createSlot(date, 9, 0, 180));

    return slots.length > 0 ? slots : undefined;
  }

  if (/soir|soirée|soiree|début de soirée|debut de soiree/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 18, 30, 120)) : undefined;
  }

  if (/après-midi|apres-midi/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 15, 0, 120)) : undefined;
  }

  if (/matin/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 3);
    return targets.length > 0 ? targets.map((date) => createSlot(date, 9, 0, 120)) : undefined;
  }

  // Détection "brunch" AVANT "matin" pour appliquer la bonne plage horaire
  if (/brunch/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 2);
    if (targets.length === 0) {
      return undefined;
    }
    // Brunch : 11h30-13h00
    return targets.map((date) => createSlot(date, 11, 30, 90));
  }

  // Détection "déjeuner" ou "partenariats" : générer 2-3 créneaux
  if (/déjeuner|dejeuner|partenariats|midi/.test(lowerInput)) {
    const targets = effectiveDates.slice(0, 2);
    if (targets.length === 0) {
      return undefined;
    }

    // Pour les déjeuners/partenariats, générer 2-3 créneaux dans la plage 11h30-13h30
    const slots: DatePollSuggestion["timeSlots"] = [];

    targets.forEach((date) => {
      // Créneau 1 : 11h30-12h30
      slots.push(createSlot(date, 11, 30, 60));
      // Créneau 2 : 12h00-13h00
      slots.push(createSlot(date, 12, 0, 60));
    });

    // Créneau 3 : 12h30-13h30 (seulement si plusieurs dates)
    if (targets.length > 1 && targets[1]) {
      slots.push(createSlot(targets[1], 12, 30, 60));
    }

    return slots.slice(0, 3); // Max 3 créneaux
  }

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
  const dates = clampDatesToWindow(suggestion.dates, options.allowedDates) || [];
  const ensuredWeekend = ensureWeekendCoverage(dates, options.userInput);
  const contextualDatesPreClamp = ensuredWeekend || dates;
  const contextualDates = options.allowedDates
    ? clampDatesToWindow(contextualDatesPreClamp, options.allowedDates) || []
    : contextualDatesPreClamp;

  const finalDates = contextualDates.length > 0 ? contextualDates : options.allowedDates || dates;

  let processedSlots = enforceDurationRules(suggestion, options.userInput);

  if (!processedSlots || processedSlots.length === 0) {
    processedSlots = buildContextualSlots(finalDates, options.userInput);
  }

  if (!processedSlots || processedSlots.length === 0) {
    processedSlots = buildDefaultSlots(finalDates);
  }

  // Limiter le nombre de créneaux selon le contexte et les attentes explicites
  processedSlots = limitSlotsCount(processedSlots, options.userInput);

  const type = finalizeType(suggestion, processedSlots);

  return {
    ...suggestion,
    dates: finalDates,
    timeSlots: processedSlots,
    type,
  };
}
