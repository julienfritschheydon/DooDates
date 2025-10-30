/**
 * Intent Detection Service - Détection des intentions de modification
 *
 * Utilise Chrono.js pour un parsing de dates robuste et multilingue :
 * - Jours de la semaine (lundi, mardi, etc.)
 * - Dates complètes (DD/MM/YYYY, YYYY-MM-DD)
 * - Dates relatives (demain, la semaine prochaine, jeudi prochain)
 * - Plages de dates (du 4 au 8)
 * - Support multilingue (FR, EN, etc.)
 */

import * as chrono from "chrono-node";
import type { Poll } from "../lib/pollStorage";
import type { PollAction } from "../reducers/pollReducer";
import { formatDateLocal } from "../lib/date-utils";
import { logger } from "../lib/logger";

// Patterns de détection des ACTIONS (pas des dates)
const ACTION_PATTERNS = {
  // Actions d'ajout
  ADD: /(?:r?ajout(?:e|er)|met(?:s|tre)?|inclus|propose|suggère)(?:\s+aussi|\s+encore)?/i,
  
  // Actions de suppression
  REMOVE: /(?:retire|supprime|enl[èe]ve|vire|oublie|annule|efface)/i,
  
  // Modification de titre
  UPDATE_TITLE: /(?:renomme|change\s+le\s+titre)\s+en\s+(.+)/i,
} as const;

export interface ModificationIntent {
  isModification: boolean;
  action: PollAction["type"];
  payload: any;
  confidence: number; // 0-1
  explanation?: string;
}

export interface MultiModificationIntent {
  isModification: boolean;
  intents: ModificationIntent[];
  confidence: number;
  explanation?: string;
}

/**
 * Détecte si le message utilisateur contient une intention de modification
 */
export class IntentDetectionService {
  /**
   * Détecte plusieurs intentions dans une même phrase
   * Ex: "ajoute vendredi 7 et jeudi 13" → 2 intentions
   */
  static detectMultipleIntents(
    message: string,
    currentPoll: Poll | null,
  ): MultiModificationIntent | null {
    if (!currentPoll) return null;

    // Découper la phrase sur les conjonctions
    const separators = /\s+et\s+|\s*,\s*|\s+puis\s+/i;
    const parts = message.split(separators).map((p) => p.trim()).filter((p) => p.length > 0);

    // Si une seule partie, utiliser detectSimpleIntent
    if (parts.length === 1) {
      const singleIntent = this.detectSimpleIntent(message, currentPoll);
      if (singleIntent) {
        return {
          isModification: true,
          intents: [singleIntent],
          confidence: singleIntent.confidence,
          explanation: singleIntent.explanation,
        };
      }
      return null;
    }

    // Extraire le verbe d'action de la phrase originale
    let actionVerb = "";
    if (ACTION_PATTERNS.ADD.test(message)) {
      const match = message.match(/^(r?ajout(?:e|er)|met(?:s|tre)?|inclus|propose|suggère)/i);
      actionVerb = match ? match[1] : "ajoute";
    } else if (ACTION_PATTERNS.REMOVE.test(message)) {
      const match = message.match(/^(retire|supprime|enl[èe]ve|vire|oublie|annule|efface)/i);
      actionVerb = match ? match[1] : "supprime";
    }

    // Détecter l'intention pour chaque partie
    const intents: ModificationIntent[] = [];
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      
      // Si la partie n'a pas de verbe d'action, ajouter celui de la phrase originale
      if (actionVerb && !ACTION_PATTERNS.ADD.test(part) && !ACTION_PATTERNS.REMOVE.test(part)) {
        part = `${actionVerb} ${part}`;
      }
      
      const intent = this.detectSimpleIntent(part, currentPoll);
      if (intent) {
        intents.push(intent);
      }
    }

    if (intents.length === 0) {
      return null;
    }

    // Calculer la confiance moyenne
    const avgConfidence = intents.reduce((sum, i) => sum + i.confidence, 0) / intents.length;

    // Générer l'explication combinée
    const explanations = intents.map((i) => i.explanation).filter(Boolean);
    const combinedExplanation = explanations.join(" + ");

    logger.info("✅ Intentions multiples détectées", "poll", {
      message,
      parts,
      intentsCount: intents.length,
      intents: intents.map((i) => ({ action: i.action, payload: i.payload })),
      confidence: avgConfidence,
    });

    return {
      isModification: true,
      intents,
      confidence: avgConfidence,
      explanation: combinedExplanation,
    };
  }

  static detectSimpleIntent(message: string, currentPoll: Poll | null): ModificationIntent | null {
    if (!currentPoll) return null;

    // 📊 Log de la demande de modification
    logger.info("🔍 Détection intention de modification", "poll", {
      message,
      pollId: currentPoll.id,
      pollTitle: currentPoll.title,
      existingDates: currentPoll.dates,
    });

    // 1. Détecter l'ACTION
    let action: "ADD_DATE" | "REMOVE_DATE" | "UPDATE_TITLE" | null = null;
    
    if (ACTION_PATTERNS.ADD.test(message)) {
      action = "ADD_DATE";
    } else if (ACTION_PATTERNS.REMOVE.test(message)) {
      action = "REMOVE_DATE";
    } else if (ACTION_PATTERNS.UPDATE_TITLE.test(message)) {
      action = "UPDATE_TITLE";
      const titleMatch = message.match(ACTION_PATTERNS.UPDATE_TITLE);
      if (titleMatch) {
        const newTitle = titleMatch[1].trim();
        if (newTitle) {
          return {
            isModification: true,
            action: "UPDATE_TITLE",
            payload: newTitle,
            confidence: 0.95,
            explanation: `Titre modifié en "${newTitle}"`,
          };
        }
      }
      return null;
    }

    if (!action) {
      logger.warn("❌ Aucune action détectée", "poll", { message });
      return null;
    }

    // 1.5. Détecter les CRÉNEAUX HORAIRES avant Chrono (patterns spécifiques)
    // Pattern: "ajoute 14h-15h le 29" ou "ajoute de 14h à 15h le 29"
    const timeslotPattern1 = /(\d{1,2})h?(\d{2})?\s*[-–]\s*(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;
    const timeslotPattern2 = /de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;
    const timeslotPattern3 = /le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)\s+de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?/i;
    const timeslotPattern4 = /(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;

    let timeslotMatch = message.match(timeslotPattern1);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute, currentPoll);
    }

    timeslotMatch = message.match(timeslotPattern2);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute, currentPoll);
    }

    timeslotMatch = message.match(timeslotPattern3);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, dateStr, startHour, startMinute = "00", endHour, endMinute = "00"] = timeslotMatch;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute, currentPoll);
    }

    timeslotMatch = message.match(timeslotPattern4);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", dateStr] = timeslotMatch;
      const endHour = String(parseInt(startHour) + 1); // +1h par défaut
      const endMinute = startMinute;
      return this.buildTimeslotIntent(dateStr, startHour, startMinute, endHour, endMinute, currentPoll);
    }

    // 2. Parser les DATES avec Chrono.js (français)
    // Utiliser la dernière date du sondage comme référence pour inférer le mois/année
    let referenceDate = new Date();
    if (currentPoll.dates && currentPoll.dates.length > 0) {
      const lastDate = currentPoll.dates[currentPoll.dates.length - 1];
      referenceDate = new Date(lastDate);
    }

    // 🔧 FIX 1: Détecter "le 27" (jour seul) et construire une date explicite
    // Ex: "ajoute le 27" → "ajoute le 27 octobre 2025"
    let enhancedMessage = message;
    const dayOnlyPattern = /\ble\s+(\d{1,2})\b(?!\s*[/:h-])/i;
    const dayOnlyMatch = message.match(dayOnlyPattern);
    
    if (dayOnlyMatch) {
      const dayNumber = parseInt(dayOnlyMatch[1]);
      
      // Valider que c'est un jour valide (1-31)
      if (dayNumber >= 1 && dayNumber <= 31) {
        const refMonth = referenceDate.toLocaleDateString('fr-FR', { month: 'long' });
        const refYear = referenceDate.getFullYear();
        
        // Remplacer "le 27" par "le 27 octobre 2025"
        enhancedMessage = message.replace(
          dayOnlyPattern,
          `le ${dayNumber} ${refMonth} ${refYear}`
        );
        
        logger.info("🔧 Jour seul détecté et amélioré", "poll", {
          original: message,
          enhanced: enhancedMessage,
          day: dayNumber,
          referenceMonth: refMonth,
          referenceYear: refYear,
        });
      }
    }
    
    // 🔧 FIX 2: Détecter "jour de la semaine + numéro" et construire une date explicite
    // Ex: "dimanche 16" → "dimanche 16 novembre" (en utilisant le mois de référence)
    const dayWithNumberPattern = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\b/i;
    const dayNumberMatch = enhancedMessage.match(dayWithNumberPattern);
    
    if (dayNumberMatch) {
      const dayName = dayNumberMatch[1];
      const dayNumber = dayNumberMatch[2];
      const refMonth = referenceDate.toLocaleDateString('fr-FR', { month: 'long' });
      const refYear = referenceDate.getFullYear();
      
      // Remplacer "dimanche 16" par "dimanche 16 novembre 2025"
      enhancedMessage = enhancedMessage.replace(
        dayWithNumberPattern,
        `${dayName} ${dayNumber} ${refMonth} ${refYear}`
      );
      
      logger.info("🔧 Message amélioré pour Chrono", "poll", {
        original: message,
        enhanced: enhancedMessage,
        referenceMonth: refMonth,
        referenceYear: refYear,
      });
    }

    const parsedDates = chrono.fr.parse(enhancedMessage, referenceDate, { forwardDate: true });

    if (parsedDates.length === 0) {
      logger.warn("❌ Aucune date détectée par Chrono", "poll", { message, enhancedMessage, referenceDate: referenceDate.toISOString() });
      return null;
    }

    // 3. Prendre la première date détectée
    const firstDate = parsedDates[0];
    const date = firstDate.start.date();
    const normalizedDate = formatDateLocal(date);

    // 4. Construire l'intent
    const result: ModificationIntent = {
      isModification: true,
      action: action,
      payload: normalizedDate,
      confidence: 0.9,
      explanation: action === "ADD_DATE" 
        ? `Ajout de la date ${normalizedDate.split("-").reverse().join("/")}`
        : `Suppression de la date ${normalizedDate.split("-").reverse().join("/")}`,
    };

    logger.info(`✅ Intention détectée via Chrono.js`, "poll", {
      action,
      input: { message, chronoText: firstDate.text },
      output: { date: normalizedDate, formatted: normalizedDate.split("-").reverse().join("/") },
      confidence: result.confidence,
    });

    return result;
  }

  /**
   * Construit une intention pour un créneau horaire
   */
  private static buildTimeslotIntent(
    dateStr: string,
    startHour: string,
    startMinute: string,
    endHour: string,
    endMinute: string,
    currentPoll: Poll,
  ): ModificationIntent | null {
    // Normaliser la date
    let normalizedDate: string | null = null;

    // Format DD/MM/YYYY ou DD/MM
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        normalizedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      } else if (parts.length === 2 && currentPoll.dates && currentPoll.dates.length > 0) {
        // Inférer l'année depuis le contexte
        const [day, month] = parts;
        const lastDate = currentPoll.dates[currentPoll.dates.length - 1];
        const year = lastDate.split("-")[0];
        normalizedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    } else if (/^\d{1,2}$/.test(dateStr) && currentPoll.dates && currentPoll.dates.length > 0) {
      // Juste un numéro de jour, inférer mois/année depuis le contexte
      const lastDate = currentPoll.dates[currentPoll.dates.length - 1];
      const [year, month] = lastDate.split("-");
      normalizedDate = `${year}-${month}-${dateStr.padStart(2, "0")}`;
    }

    if (!normalizedDate) {
      logger.warn("❌ Format de date non reconnu pour créneau", "poll", { dateStr });
      return null;
    }

    const start = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
    const end = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

    logger.info("✅ Créneau horaire détecté", "poll", {
      date: normalizedDate,
      start,
      end,
      formatted: `${normalizedDate.split("-").reverse().join("/")} de ${start} à ${end}`,
    });

    return {
      isModification: true,
      action: "ADD_TIMESLOT",
      payload: { date: normalizedDate, start, end },
      confidence: 0.9,
      explanation: `Ajout du créneau ${start}-${end} le ${normalizedDate.split("-").reverse().join("/")}`,
    };
  }
}
