/**
 * Intent Detection Service - Détection des intentions de modification
 *
 * Utilise Chrono.js pour un parsing de dates robuste et multilingue :
 * - Jours de la semaine (lundi, mardi, etc.)
 * - Dates complètes (DD/MM/YYYY, YYYY-MM-DD)
 * - Dates partielles (DD/MM, DD)
 * - Mois en texte (DD mois YYYY)
 * - Dates relatives (demain, la semaine prochaine)
 * - Support multilingue (FR, EN, etc.)
 */

import * as chrono from "chrono-node";
import type { Poll } from "../lib/pollStorage";
import type { PollAction } from "../reducers/pollReducer";
import { formatDateLocal } from "../lib/date-utils";

// Patterns de détection
const PATTERNS = {
  // "ajoute/ajouter [jour de la semaine]"
  ADD_DAY: /ajout(?:e|er)\s+(le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,

  // "ajoute/ajouter [date]" - Formats multiples
  ADD_DATE:
    /ajout(?:e|er)\s+(le\s+)?(\d{4}-\d{2}-\d{2}|\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?|\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})?)/i,

  // "retire/supprime/enlève [jour de la semaine]"
  REMOVE_DAY:
    /(?:retire|supprime|enl[èe]ve)\s+(le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,

  // "retire/supprime/enlève [date]" - Formats multiples
  REMOVE_DATE:
    /(?:retire|supprime|enl[èe]ve)\s+(le\s+)?(\d{4}-\d{2}-\d{2}|\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?|\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})?)/i,

  // "renomme en [titre]" / "change le titre en [titre]"
  UPDATE_TITLE: /(?:renomme|change\s+le\s+titre)\s+en\s+(.+)/i,

  // "ajoute [heure]-[heure] le [date]" - Pattern principal
  TIMESLOT_1:
    /ajout(?:e|er)\s+(\d{1,2})h?(\d{2})?\s*-\s*(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i,

  // "ajoute de [heure] à [heure] le [date]"
  TIMESLOT_2:
    /ajout(?:e|er)\s+de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i,

  // "ajoute le [date] de [heure] à [heure]"
  TIMESLOT_3:
    /ajout(?:e|er)\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)\s+de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?/i,

  // "ajoute [heure] le [date]" (sans heure de fin - durée 1h par défaut)
  TIMESLOT_4: /ajout(?:e|er)\s+(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i,
} as const;

// Mapping jours de la semaine
const DAYS_MAP: { [key: string]: number } = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
} as const;

// Mapping mois en texte
const MONTHS_MAP: { [key: string]: string } = {
  janvier: "01",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  décembre: "12",
} as const;

// Parser Chrono configuré pour le français (installé pour migration future)
const frParser = chrono.fr;
const enParser = chrono.en;

export interface ModificationIntent {
  isModification: boolean;
  action: PollAction["type"];
  payload: any;
  confidence: number; // 0-1
  explanation?: string;
}

/**
 * Détecte si le message utilisateur contient une intention de modification
 */
export class IntentDetectionService {
  /**
   * Infère la date complète à partir d'un jour seul en utilisant le contexte du sondage
   * Ex: "3" + poll contient ["2025-11-03", "2025-11-04"] → "2025-11-03"
   */
  private static inferDateFromContext(dayStr: string, currentPoll: Poll | null): string | null {
    if (!currentPoll || !currentPoll.dates || currentPoll.dates.length === 0) {
      return null;
    }

    const day = dayStr.padStart(2, "0");

    // Chercher une date dans le sondage qui correspond au jour
    const matchingDate = currentPoll.dates.find((date) => {
      const dateParts = date.split("-");
      return dateParts[2] === day; // Compare le jour
    });

    return matchingDate || null;
  }

  /**
   * Normalise une date string en YYYY-MM-DD avec contexte du sondage
   */
  private static normalizeDateString(dateStr: string, currentPoll: Poll | null): string | null {
    // Format : DD mois YYYY (ex: 27 octobre 2025)
    const monthTextMatch = dateStr.match(
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    );
    if (monthTextMatch) {
      const day = monthTextMatch[1].padStart(2, "0");
      const month = MONTHS_MAP[monthTextMatch[2].toLowerCase()];
      const year = monthTextMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Format : DD/MM/YYYY ou DD/MM ou DD
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      const day = parts[0].padStart(2, "0");
      const month = parts[1]
        ? parts[1].padStart(2, "0")
        : String(new Date().getMonth() + 1).padStart(2, "0");
      const year = parts[2] || String(new Date().getFullYear());
      return `${year}-${month}-${day}`;
    }

    // Format : YYYY-MM-DD
    if (dateStr.includes("-")) {
      return dateStr;
    }

    // Format : DD seul - Essayer d'inférer depuis le contexte
    if (/^\d{1,2}$/.test(dateStr)) {
      const inferredDate = this.inferDateFromContext(dateStr, currentPoll);
      if (inferredDate) {
        return inferredDate;
      }
      // Fallback: mois/année courants
      const day = dateStr.padStart(2, "0");
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const year = String(new Date().getFullYear());
      return `${year}-${month}-${day}`;
    }

    return null; // Format non reconnu
  }

  /**
   * Construit un intent ADD_TIMESLOT à partir des paramètres
   */
  private static buildTimeslotIntent(
    dateStr: string,
    startHour: string,
    startMinute: string,
    endHour: string,
    endMinute: string,
  ): ModificationIntent {
    // Normaliser la date
    let normalizedDate: string;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      const day = parts[0].padStart(2, "0");
      const month = parts[1]
        ? parts[1].padStart(2, "0")
        : String(new Date().getMonth() + 1).padStart(2, "0");
      const year = parts[2] || String(new Date().getFullYear());
      normalizedDate = `${year}-${month}-${day}`;
    } else {
      const day = dateStr.padStart(2, "0");
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const year = String(new Date().getFullYear());
      normalizedDate = `${year}-${month}-${day}`;
    }

    const start = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
    const end = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

    return {
      isModification: true,
      action: "ADD_TIMESLOT",
      payload: { date: normalizedDate, start, end },
      confidence: 0.9,
      explanation: `Ajout du créneau ${start}-${end} le ${normalizedDate.split("-").reverse().join("/")}`,
    };
  }

  /**
   * Convertit un jour de la semaine en date YYYY-MM-DD
   * Trouve le prochain jour correspondant à partir d'aujourd'hui
   */
  private static getDayOfWeekDate(dayName: string): string {
    const targetDay = DAYS_MAP[dayName.toLowerCase()];
    if (targetDay === undefined) return "";

    const today = new Date();
    const currentDay = today.getDay();

    // Calculer combien de jours ajouter
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Prendre le prochain (semaine suivante)
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);

    return formatDateLocal(nextDate);
  }

  /**
   * Parse une date avec Chrono.js (supporte FR et EN) - Pour migration future
   */
  private static parseDate(text: string): Date | null {
    // Essayer d'abord en français
    let result = frParser.parseDate(text);
    if (result) return result;

    // Fallback anglais
    result = enParser.parseDate(text);
    return result || null;
  }

  /**
   * Parse un créneau horaire avec Chrono.js - Pour migration future
   */
  private static parseTimeRange(text: string): { start: Date; end: Date } | null {
    const results = frParser.parse(text);
    if (results.length > 0 && results[0].start && results[0].end) {
      return {
        start: results[0].start.date(),
        end: results[0].end.date(),
      };
    }
    return null;
  }

  static detectSimpleIntent(message: string, currentPoll: Poll | null): ModificationIntent | null {
    if (!currentPoll) return null;

    // Pattern ADD_TIMESLOT : Tester tous les formats - DOIT ÊTRE TESTÉ EN PREMIER
    // Sinon "14h-15h le 29" match ADD_DATE au lieu de ADD_TIMESLOT

    // Pattern 1 : "ajoute 14h-15h le 29"
    let timeslotMatch = message.match(PATTERNS.TIMESLOT_1);
    if (timeslotMatch) {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute);
    }

    // Pattern 2 : "ajoute de 14h à 15h le 29"
    timeslotMatch = message.match(PATTERNS.TIMESLOT_2);
    if (timeslotMatch) {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute);
    }

    // Pattern 3 : "ajoute le 29 de 14h à 15h"
    timeslotMatch = message.match(PATTERNS.TIMESLOT_3);
    if (timeslotMatch) {
      const [, dateStr, startHour, startMinute = "00", endHour, endMinute = "00"] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute);
    }

    // Pattern 4 : "ajoute 14h le 29" (durée 1h par défaut)
    timeslotMatch = message.match(PATTERNS.TIMESLOT_4);
    if (timeslotMatch) {
      const [, startHour, startMinute = "00", dateStr] = timeslotMatch;
      const endHour = String(parseInt(startHour) + 1); // +1h par défaut
      const endMinute = startMinute;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute);
    }

    // Pattern 2 : "ajoute/ajouter [jour de la semaine]"
    const dayMatch = message.match(PATTERNS.ADD_DAY);

    if (dayMatch) {
      const dayName = dayMatch[2];
      const normalizedDate = this.getDayOfWeekDate(dayName);

      return {
        isModification: true,
        action: "ADD_DATE",
        payload: normalizedDate,
        confidence: 0.9,
        explanation: `Ajout du ${dayName} (${normalizedDate.split("-").reverse().join("/")})`,
      };
    }

    // Pattern 3 : "ajoute/ajouter [date]" (formats multiples)
    const match = message.match(PATTERNS.ADD_DATE);

    if (match) {
      const dateStr = match[2];
      const normalizedDate = this.normalizeDateString(dateStr, currentPoll);

      if (!normalizedDate) {
        return null; // Format non reconnu
      }

      return {
        isModification: true,
        action: "ADD_DATE",
        payload: normalizedDate,
        confidence: 0.95,
        explanation: `Ajout de la date ${dateStr}`,
      };
    }

    // Pattern 3 : "retire/supprime/enlève [jour de la semaine]"
    const removeDayMatch = message.match(PATTERNS.REMOVE_DAY);

    if (removeDayMatch) {
      const dayName = removeDayMatch[2];
      const normalizedDate = this.getDayOfWeekDate(dayName);

      return {
        isModification: true,
        action: "REMOVE_DATE",
        payload: normalizedDate,
        confidence: 0.9,
        explanation: `Suppression du ${dayName} (${normalizedDate.split("-").reverse().join("/")})`,
      };
    }

    // Pattern 4 : "retire/supprime/enlève [date]" (formats multiples)
    const removeMatch = message.match(PATTERNS.REMOVE_DATE);

    if (removeMatch) {
      const dateStr = removeMatch[2];
      const normalizedDate = this.normalizeDateString(dateStr, currentPoll);

      if (!normalizedDate) {
        return null; // Format non reconnu
      }

      return {
        isModification: true,
        action: "REMOVE_DATE",
        payload: normalizedDate,
        confidence: 0.95,
        explanation: `Suppression de la date ${dateStr}`,
      };
    }

    // Pattern 5 : "renomme en [titre]" / "change le titre en [titre]"
    const titleMatch = message.match(PATTERNS.UPDATE_TITLE);

    if (titleMatch) {
      const newTitle = titleMatch[1].trim();

      // Vérifier que le titre n'est pas vide
      if (!newTitle) {
        return null;
      }

      return {
        isModification: true,
        action: "UPDATE_TITLE",
        payload: newTitle,
        confidence: 0.95,
        explanation: `Titre modifié en "${newTitle}"`,
      };
    }

    return null;
  }
}
