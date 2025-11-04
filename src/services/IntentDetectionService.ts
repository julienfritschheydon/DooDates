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
  payload: unknown; // Payload générique, sera typé selon l'action
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

    // Découper la phrase en segments avec leurs verbes d'action
    // Ex: "ajoute mercredi à 15h et enlève le lundi" → ["ajoute mercredi à 15h", "enlève le lundi"]
    const segments: string[] = [];
    const separatorRegex = /\s+(et|puis)\s+/gi;
    let lastIndex = 0;
    let match;

    while ((match = separatorRegex.exec(message)) !== null) {
      const separatorIndex = match.index;
      const segment = message.substring(lastIndex, separatorIndex).trim();
      if (segment) {
        segments.push(segment);
      }
      lastIndex = separatorIndex + match[0].length;
    }

    // Ajouter le dernier segment
    const lastSegment = message.substring(lastIndex).trim();
    if (lastSegment) {
      segments.push(lastSegment);
    }

    // Si aucune conjonction trouvée, essayer avec les virgules
    if (segments.length === 1) {
      const commaParts = message
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (commaParts.length > 1) {
        segments.length = 0;
        segments.push(...commaParts);
      }
    }

    // Si une seule partie, utiliser detectSimpleIntent
    if (segments.length === 1) {
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

    // Détecter l'intention pour chaque segment
    // Chaque segment peut avoir son propre verbe d'action (ex: "ajoute X et enlève Y")
    const intents: ModificationIntent[] = [];
    for (const segment of segments) {
      // Chaque segment devrait déjà contenir son verbe d'action
      // Si ce n'est pas le cas, on essaie quand même detectSimpleIntent
      const intent = this.detectSimpleIntent(segment, currentPoll);
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
      segments,
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
    const timeslotPattern1 =
      /(\d{1,2})h?(\d{2})?\s*[-–]\s*(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;
    const timeslotPattern2 =
      /de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;
    const timeslotPattern3 =
      /le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)\s+de\s+(\d{1,2})h?(\d{2})?\s+[àa]\s+(\d{1,2})h?(\d{2})?/i;
    const timeslotPattern4 = /(\d{1,2})h?(\d{2})?\s+le\s+(\d{1,2}(?:\/\d{1,2}(?:\/\d{4})?)?)/i;

    let timeslotMatch = message.match(timeslotPattern1);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(
        dateStr,
        startHour,
        startMinute,
        endHour,
        endMinute,
        currentPoll,
      );
    }

    timeslotMatch = message.match(timeslotPattern2);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", endHour, endMinute = "00", dateStr] = timeslotMatch;
      return this.buildTimeslotIntent(
        dateStr,
        startHour,
        startMinute,
        endHour,
        endMinute,
        currentPoll,
      );
    }

    timeslotMatch = message.match(timeslotPattern3);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, dateStr, startHour, startMinute = "00", endHour, endMinute = "00"] = timeslotMatch;
      return this.buildTimeslotIntent(
        dateStr,
        startHour,
        startMinute,
        endHour,
        endMinute,
        currentPoll,
      );
    }

    timeslotMatch = message.match(timeslotPattern4);
    if (timeslotMatch && action === "ADD_DATE") {
      const [, startHour, startMinute = "00", dateStr] = timeslotMatch;
      const endHour = String(parseInt(startHour) + 1); // +1h par défaut
      const endMinute = startMinute;
      return this.buildTimeslotIntent(
        dateStr,
        startHour,
        startMinute,
        endHour,
        endMinute,
        currentPoll,
      );
    }

    // 1.6. Détecter les créneaux horaires avec jours de la semaine
    // Supporte : "le samedi 15 à 15h" / "samedi 15 à 15h" / "samedi 15 15h" / "samedi à 15h" / "samedi 15h" / "samedi à midi" / "samedi 12h00"
    if (action === "ADD_DATE") {
      // Pattern 1 : avec numéro de jour explicite (ex: "samedi 15 à 15h" / "samedi 15 midi" / "samedi 15 12h00")
      const patternWithDay = message.match(
        /(?:^|\s+)(?:r?ajout(?:e|er)?\s+)?(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(?:[àa]\s+)?(?:(\d{1,2})h(?:(\d{2}))?|midi)(?:\s|$|,|et)/i,
      );

      // Pattern 2 : sans numéro de jour (ex: "samedi à 15h" / "samedi 15h" / "samedi à midi" / "samedi 12h00")
      const patternWithoutDay = !patternWithDay
        ? message.match(
            /(?:^|\s+)(?:r?ajout(?:e|er)?\s+)?(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(?:[àa]\s+)?(?:(\d{1,2})h(?:(\d{2}))?|midi)(?:\s|$|,|et)/i,
          )
        : null;

      const match = patternWithDay || patternWithoutDay;
      // Si un créneau horaire est détecté, le traiter ; sinon continuer avec le parsing Chrono
      if (match) {
        // Extraire les composants
        const weekdayName = match[1];
        const dayNumber = patternWithDay ? match[2] : null; // Numéro du jour si présent

        // Détecter l'heure : "midi" = 12h00, sinon prendre le nombre
        let hour: string;
        let minute: string;

        if (patternWithDay) {
          // Avec numéro de jour : groupe 3 = heure numérique, sinon "midi" détecté
          if (match[3]) {
            hour = match[3];
            minute = match[4] || "00";
          } else {
            // "midi" détecté
            hour = "12";
            minute = "00";
          }
        } else {
          // Sans numéro de jour : groupe 2 = heure numérique, sinon "midi" détecté
          if (match[2]) {
            hour = match[2];
            minute = match[3] || "00";
          } else {
            // "midi" détecté
            hour = "12";
            minute = "00";
          }
        }

        console.log("🔍 Créneau horaire détecté", {
          message,
          weekdayName,
          dayNumber,
          hour,
          minute,
        });

        // Construire la date cible
        let targetDate: string | null = null;

        // Si on a un numéro de jour explicite, construire la date directement
        if (dayNumber) {
          let referenceDate = new Date();
          if (currentPoll.dates && currentPoll.dates.length > 0) {
            const lastDate = currentPoll.dates[currentPoll.dates.length - 1];
            referenceDate = new Date(lastDate);
          }
          const refMonth = referenceDate.getMonth();
          const refYear = referenceDate.getFullYear();

          const date = new Date(refYear, refMonth, parseInt(dayNumber));
          // Vérifier que le jour de la semaine correspond
          if (date.getDay() === this.getWeekdayNumber(weekdayName)) {
            targetDate = formatDateLocal(date);
          }
        }

        // Si pas de date spécifique trouvée, chercher dans les dates existantes
        if (!targetDate) {
          targetDate = this.findDateByWeekday(weekdayName, currentPoll, true);
        }

        // Si pas trouvé, calculer le prochain jour correspondant
        if (!targetDate) {
          targetDate = this.findDateByWeekday(weekdayName, currentPoll, false);
        }

        console.log("📅 Date cible trouvée", {
          weekdayName,
          dayNumber,
          targetDate,
          dateExists: targetDate ? currentPoll.dates?.includes(targetDate) : false,
        });

        if (targetDate) {
          const startHour = hour;
          const startMinute = minute;
          const endHour = String(parseInt(startHour) + 1); // +1h par défaut
          const endMinute = startMinute;

          // Le reducer ADD_TIMESLOT ajoutera automatiquement la date si elle n'existe pas
          return this.buildTimeslotIntent(
            targetDate,
            startHour,
            startMinute,
            endHour,
            endMinute,
            currentPoll,
          );
        }
        // Si aucun créneau horaire valide n'a été construit, continuer avec le parsing Chrono
      }
    }

    // 1.7. Pour REMOVE avec jour de la semaine, chercher d'abord dans les dates existantes
    // Ex: "enlève le lundi" → chercher le lundi existant dans le sondage (pas le prochain lundi)
    if (action === "REMOVE_DATE") {
      const weekdayPattern =
        /(?:^|\s+)(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;
      const weekdayMatch = message.match(weekdayPattern);

      if (weekdayMatch && currentPoll.dates && currentPoll.dates.length > 0) {
        console.log("🔍 Recherche jour de la semaine dans dates existantes (REMOVE)", {
          message,
          weekday: weekdayMatch[1],
          existingDates: currentPoll.dates,
        });

        const matchingDate = this.findDateByWeekday(weekdayMatch[1], currentPoll, true);
        if (matchingDate) {
          console.log("✅ Jour de la semaine trouvé dans les dates existantes (REMOVE)", {
            weekday: weekdayMatch[1],
            date: matchingDate,
          });
          return {
            isModification: true,
            action: "REMOVE_DATE",
            payload: matchingDate,
            confidence: 0.9,
            explanation: `Suppression de la date ${matchingDate.split("-").reverse().join("/")}`,
          };
        } else {
          console.warn("⚠️ Jour de la semaine non trouvé dans les dates existantes", {
            weekday: weekdayMatch[1],
            existingDates: currentPoll.dates,
          });
        }
      }
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
        const refMonth = referenceDate.toLocaleDateString("fr-FR", { month: "long" });
        const refYear = referenceDate.getFullYear();

        // Remplacer "le 27" par "le 27 octobre 2025"
        enhancedMessage = message.replace(dayOnlyPattern, `le ${dayNumber} ${refMonth} ${refYear}`);

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
    const dayWithNumberPattern =
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\b/i;
    const dayNumberMatch = enhancedMessage.match(dayWithNumberPattern);

    if (dayNumberMatch) {
      const dayName = dayNumberMatch[1];
      const dayNumber = dayNumberMatch[2];
      const refMonth = referenceDate.toLocaleDateString("fr-FR", { month: "long" });
      const refYear = referenceDate.getFullYear();

      // Remplacer "dimanche 16" par "dimanche 16 novembre 2025"
      enhancedMessage = enhancedMessage.replace(
        dayWithNumberPattern,
        `${dayName} ${dayNumber} ${refMonth} ${refYear}`,
      );

      logger.info("🔧 Message amélioré pour Chrono", "poll", {
        original: message,
        enhanced: enhancedMessage,
        referenceMonth: refMonth,
        referenceYear: refYear,
      });
    }

    // 🔧 FIX 3: Détecter les jours de la semaine simples (sans numéro ni heure) et améliorer pour Chrono
    // Ex: "ajouter mercredi" → "mercredi prochain" pour aider Chrono à détecter
    if (!dayNumberMatch && action === "ADD_DATE") {
      const weekdayOnlyPattern =
        /\b(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b(?:\s|$)/i;
      const weekdayOnlyMatch = enhancedMessage.match(weekdayOnlyPattern);

      // Vérifier qu'il n'y a pas déjà d'heure détectée et qu'aucun créneau horaire n'a été détecté
      if (weekdayOnlyMatch && !enhancedMessage.match(/\d{1,2}h/i)) {
        const weekdayName = weekdayOnlyMatch[1];
        // Remplacer le jour de la semaine par "mercredi prochain" pour aider Chrono
        enhancedMessage = enhancedMessage.replace(
          weekdayOnlyPattern,
          `${weekdayName} prochain`,
        );

        logger.info("🔧 Jour de la semaine simple détecté et amélioré", "poll", {
          original: message,
          enhanced: enhancedMessage,
          weekday: weekdayName,
        });
      }
    }

    const parsedDates = chrono.fr.parse(enhancedMessage, referenceDate, { forwardDate: true });

    // Si aucune date trouvée par Chrono, essayer de détecter un jour de la semaine
    if (parsedDates.length === 0) {
      // Pour REMOVE, chercher dans les dates existantes du sondage
      if (action === "REMOVE_DATE") {
        const weekdayPattern =
          /(?:^|\s+)(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;
        const weekdayMatch = message.match(weekdayPattern);

        if (weekdayMatch && currentPoll.dates && currentPoll.dates.length > 0) {
          const matchingDate = this.findDateByWeekday(weekdayMatch[1], currentPoll, true);
          if (matchingDate) {
            logger.info("✅ Jour de la semaine trouvé dans les dates existantes", "poll", {
              weekday: weekdayMatch[1],
              date: matchingDate,
            });
            return {
              isModification: true,
              action: "REMOVE_DATE",
              payload: matchingDate,
              confidence: 0.85,
              explanation: `Suppression de la date ${matchingDate.split("-").reverse().join("/")}`,
            };
          }
        }
      }

      logger.warn("❌ Aucune date détectée par Chrono", "poll", {
        message,
        enhancedMessage,
        referenceDate: referenceDate.toISOString(),
      });
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
      explanation:
        action === "ADD_DATE"
          ? `Ajout de la date ${normalizedDate.split("-").reverse().join("/")}`
          : `Suppression de la date ${normalizedDate.split("-").reverse().join("/")}`,
    };

    logger.info(`✅ Intention détectée via Chrono.js`, "poll", {
      action,
      input: { message, chronoText: firstDate.text },
      output: { date: normalizedDate, formatted: normalizedDate.split("-").reverse().join("/") },
      confidence: result.confidence,
    });

    // 4.5. Si action est REMOVE et qu'on a un jour de la semaine,
    // vérifier si la date trouvée par Chrono est dans le sondage
    // Sinon, chercher dans les dates existantes du sondage
    if (action === "REMOVE_DATE") {
      const weekdayPattern =
        /(?:^|\s+)(?:le\s+)?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;
      const weekdayMatch = message.match(weekdayPattern);

      if (weekdayMatch && parsedDates.length > 0) {
        // Chrono a trouvé une date, mais on veut vérifier si c'est dans le sondage
        const chronoDate = formatDateLocal(parsedDates[0].start.date());
        console.log("🔍 Chrono a trouvé une date pour REMOVE", {
          chronoDate,
          isInPoll: currentPoll.dates?.includes(chronoDate),
          weekday: weekdayMatch[1],
        });

        if (currentPoll.dates?.includes(chronoDate)) {
          // La date trouvée par Chrono est dans le sondage, on l'utilise
          console.log("✅ Date Chrono trouvée dans le sondage, utilisation", { chronoDate });
          return {
            isModification: true,
            action: "REMOVE_DATE",
            payload: chronoDate,
            confidence: 0.9,
            explanation: `Suppression de la date ${chronoDate.split("-").reverse().join("/")}`,
          };
        } else {
          console.log("⚠️ Date Chrono hors sondage, recherche dans dates existantes", {
            chronoDate,
            weekday: weekdayMatch[1],
          });
          // La date trouvée par Chrono n'est pas dans le sondage
          // Chercher dans les dates existantes du sondage (priorité sur le calcul)
          const matchingDate = this.findDateByWeekday(weekdayMatch[1], currentPoll, true);
          if (matchingDate) {
            console.log("✅ Date Chrono hors sondage, utilisation du jour existant", {
              chronoDate,
              weekday: weekdayMatch[1],
              matchingDate,
            });
            return {
              isModification: true,
              action: "REMOVE_DATE",
              payload: matchingDate,
              confidence: 0.9,
              explanation: `Suppression de la date ${matchingDate.split("-").reverse().join("/")}`,
            };
          }
        }
      }
    }

    return result;
  }

  /**
   * Obtient le numéro du jour de la semaine (0=dimanche, 1=lundi, etc.)
   */
  private static getWeekdayNumber(weekdayName: string): number {
    const weekdayMap: { [key: string]: number } = {
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
      dimanche: 0,
    };
    return weekdayMap[weekdayName.toLowerCase()] ?? -1;
  }

  /**
   * Trouve une date correspondant à un jour de la semaine
   * @param weekdayName Nom du jour (lundi, mardi, etc.)
   * @param currentPoll Le sondage actuel
   * @param onlyExisting Si true, cherche uniquement dans les dates existantes du sondage
   * @returns Date au format YYYY-MM-DD ou null
   */
  private static findDateByWeekday(
    weekdayName: string,
    currentPoll: Poll,
    onlyExisting: boolean = false,
  ): string | null {
    const targetWeekday = this.getWeekdayNumber(weekdayName);
    if (targetWeekday === -1) {
      return null;
    }

    // Si on cherche uniquement dans les dates existantes
    if (onlyExisting && currentPoll.dates && currentPoll.dates.length > 0) {
      for (const dateStr of currentPoll.dates) {
        // Parser la date manuellement pour éviter les problèmes de timezone
        // Format attendu: YYYY-MM-DD
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // getMonth() est 0-indexé
          const day = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          if (date.getDay() === targetWeekday) {
            // Retourner la date au format YYYY-MM-DD (déjà normalisée)
            return dateStr;
          }
        }
      }
      return null;
    }

    // Sinon, calculer le prochain jour correspondant
    let referenceDate = new Date();
    if (currentPoll.dates && currentPoll.dates.length > 0) {
      const lastDate = currentPoll.dates[currentPoll.dates.length - 1];
      referenceDate = new Date(lastDate);
    }

    // Trouver le prochain jour de la semaine après la date de référence
    const currentDay = referenceDate.getDay();
    let daysToAdd = targetWeekday - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Semaine prochaine
    }

    const targetDate = new Date(referenceDate);
    targetDate.setDate(referenceDate.getDate() + daysToAdd);

    return formatDateLocal(targetDate);
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

    // Format YYYY-MM-DD (déjà normalisé)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      normalizedDate = dateStr;
    }
    // Format DD/MM/YYYY ou DD/MM
    else if (dateStr.includes("/")) {
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
