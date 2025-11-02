import serina from "serina";
import { parseISO, isValid, parse } from "date-fns";
import { logError, ErrorFactory } from "./error-handling";
import { parse as soonerOrLaterParse } from "soonerorlater";
import { formatDateLocal, getTodayLocal } from "./date-utils";
import { logger } from "./logger";

// Types pour le parsing temporel avancé
export interface TemporalContext {
  currentDate: Date;
  userTimezone: string;
  workingHours: { start: string; end: string };
  workingDays: number[]; // 0=dimanche, 1=lundi, etc.
}

export interface ParsedTemporal {
  originalText: string;
  confidence: number;
  temporalType: "date" | "datetime" | "recurring" | "duration" | "relative";
  extracted: {
    dates: string[];
    times: string[];
    durations: string[];
    recurring: {
      pattern?: string;
      frequency?: string;
      weekdays?: string[];
    };
    constraints: {
      beforeTime?: string;
      afterTime?: string;
      workingHours?: boolean;
      weekendsOnly?: boolean;
      weekdaysOnly?: boolean;
    };
  };
  counterfactualChecks: {
    passed: boolean;
    conflicts: string[];
    suggestions: string[];
  };
}

export class AdvancedTemporalParser {
  private context: TemporalContext;

  constructor(context?: Partial<TemporalContext>) {
    this.context = {
      currentDate: new Date(),
      userTimezone: "Europe/Paris",
      workingHours: { start: "09:00", end: "17:00" },
      workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi
      ...context,
    };
  }

  /**
   * Parse le texte avec plusieurs techniques combinées
   */
  async parseText(text: string): Promise<ParsedTemporal> {
    const normalizedText = this.normalizeText(text);

    // 1. Parsing avec Serina
    const serinaResult = this.parseWithSerina(normalizedText);

    // 2. Parsing avec SoonerOrLater pour les récurrences
    const recurringResult = this.parseRecurring(normalizedText);

    // 3. Extraction des contraintes implicites
    const constraints = this.extractConstraints(normalizedText);

    // 4. Analyse contextuelle pour les références temporelles relatives
    const contextualDates = this.resolveRelativeReferences(normalizedText);

    // 5. Vérifications de cohérence counterfactual
    const counterfactualChecks = this.performCounterfactualChecks(
      normalizedText,
      [...serinaResult.dates, ...contextualDates],
      serinaResult.times,
    );

    // 6. Fusion intelligente des résultats
    const mergedResult = this.mergeResults(
      serinaResult,
      recurringResult,
      contextualDates,
      constraints,
      counterfactualChecks,
    );

    return {
      originalText: text,
      confidence: this.calculateConfidence(mergedResult, counterfactualChecks),
      temporalType: this.determineTemporalType(mergedResult),
      extracted: mergedResult,
      counterfactualChecks,
    };
  }

  /**
   * Normalise le texte pour améliorer le parsing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/(\d+)h(\d+)/g, "$1:$2") // 14h30 -> 14:30
      .replace(/(\d+)h/g, "$1:00") // 14h -> 14:00
      .replace(/midi/g, "12:00")
      .replace(/minuit/g, "00:00")
      .replace(/week-?end/g, "weekend")
      .replace(/fin de semaine/g, "weekend")
      .replace(/cette semaine/g, "this week")
      .replace(/la semaine prochaine/g, "next week")
      .replace(/semaine suivante/g, "next week")
      .trim();
  }

  /**
   * Parse avec Serina pour les dates et heures
   */
  private parseWithSerina(text: string): { dates: string[]; times: string[] } {
    try {
      const result = serina(text);

      if (result.isValid && result.matches) {
        const todayStr = getTodayLocal();

        const dates = result.matches
          .map((match) => match.dateTime)
          .filter((dt) => dt)
          .map((dt) => formatDateLocal(new Date(dt)))
          .filter((dateStr) => dateStr >= todayStr);

        const times = result.matches
          .map((match) => {
            const date = new Date(match.dateTime);
            return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
          })
          .filter((time) => time !== "00:00");

        return {
          dates: [...new Set(dates)] as string[],
          times: [...new Set(times)] as string[],
        };
      }
    } catch (error) {
      logError(
        ErrorFactory.api("Serina temporal parsing failed", "Erreur d'analyse temporelle Serina"),
        { component: "temporal-parser", metadata: { originalError: error } },
      );
    }

    return { dates: [], times: [] };
  }

  /**
   * Parse les patterns récurrents avec SoonerOrLater
   */
  private parseRecurring(text: string): {
    pattern?: string;
    frequency?: string;
    weekdays?: string[];
  } {
    const weekdayPatterns: Record<string, string[]> = {
      "tous les lundis": ["monday"],
      "chaque mardi": ["tuesday"],
      "les mercredis": ["wednesday"],
      "tous les jeudis": ["thursday"],
      "chaque vendredi": ["friday"],
      "les week-ends": ["saturday", "sunday"],
      "tous les week-ends": ["saturday", "sunday"],
    };

    for (const [pattern, days] of Object.entries(weekdayPatterns)) {
      if (text.includes(pattern)) {
        return {
          pattern: "weekly",
          frequency: "weekly",
          weekdays: days,
        };
      }
    }

    return {};
  }

  /**
   * Extraction des contraintes implicites
   */
  private extractConstraints(text: string): ParsedTemporal["extracted"]["constraints"] {
    const constraints: ParsedTemporal["extracted"]["constraints"] = {};

    // Contraintes horaires
    if (text.includes("matin")) {
      constraints.beforeTime = "12:00";
    }
    if (text.includes("après-midi")) {
      constraints.afterTime = "12:00";
      constraints.beforeTime = "18:00";
    }
    if (text.includes("soir")) {
      constraints.afterTime = "18:00";
    }
    if (text.includes("heures de bureau") || text.includes("heures ouvrables")) {
      constraints.workingHours = true;
    }

    // Contraintes de jours
    if (text.includes("weekend") || text.includes("week-end")) {
      constraints.weekendsOnly = true;
    }
    if (text.includes("semaine") && !text.includes("weekend")) {
      constraints.weekdaysOnly = true;
    }

    return constraints;
  }

  /**
   * Résout les références temporelles relatives avec précision
   */
  private resolveRelativeReferences(text: string): string[] {
    const dates: string[] = [];
    const today = new Date(this.context.currentDate);

    // IMPORTANT: Filtrer toujours les dates passées
    const todayStr = getTodayLocal();

    // Cette semaine
    if (text.includes("this week") || text.includes("cette semaine")) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi

      for (let i = 0; i < 5; i++) {
        // Lundi à vendredi
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = formatDateLocal(date);

        // Ne garder que les dates futures ou aujourd'hui
        if (dateStr >= todayStr) {
          dates.push(dateStr);
        }
      }
    }

    // Semaine prochaine
    if (text.includes("next week") || text.includes("semaine prochaine")) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + (7 - today.getDay()) + 1); // Lundi suivant

      for (let i = 0; i < 5; i++) {
        // Lundi à vendredi
        const date = new Date(nextWeek);
        date.setDate(nextWeek.getDate() + i);
        const dateStr = formatDateLocal(date);

        // Les dates de la semaine prochaine sont toujours futures
        dates.push(dateStr);
      }
    }

    // Demain
    if (text.includes("demain") || text.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = formatDateLocal(tomorrow);
      dates.push(tomorrowStr);
    }

    return dates;
  }

  /**
   * Vérifications de cohérence counterfactual
   * Inspiré des techniques de "Counterfactual-Consistency Prompting"
   */
  private performCounterfactualChecks(
    text: string,
    dates: string[],
    times: string[],
  ): ParsedTemporal["counterfactualChecks"] {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // Vérification 1: Cohérence jour de semaine
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();

      // Test counterfactual: Si on dit "lundi" mais que la date est un mardi
      if (text.includes("lundi") && dayOfWeek !== 1) {
        conflicts.push(`Date ${dateStr} tombe un ${this.getDayName(dayOfWeek)}, pas un lundi`);
        suggestions.push("Vérifier la correspondance jour/date demandée");
      }

      // Test weekend vs jour de semaine
      if (text.includes("weekend") && ![0, 6].includes(dayOfWeek)) {
        conflicts.push(`Date ${dateStr} n'est pas un weekend`);
      }

      if (text.includes("semaine") && !text.includes("weekend") && [0, 6].includes(dayOfWeek)) {
        conflicts.push(`Date ${dateStr} est un weekend mais le texte demande la semaine`);
      }
    }

    // Vérification 2: Cohérence temporelle "avant/après"
    if (text.includes("avant") && text.includes("après")) {
      const beforeMatch = text.match(/avant (\d{1,2}):?(\d{2})?/);
      const afterMatch = text.match(/après (\d{1,2}):?(\d{2})?/);

      if (beforeMatch && afterMatch) {
        const beforeHour = parseInt(beforeMatch[1]);
        const afterHour = parseInt(afterMatch[1]);

        if (beforeHour <= afterHour) {
          conflicts.push('Incohérence temporelle: "avant" doit être antérieur à "après"');
        }
      }
    }

    // Vérification 3: Cohérence des créneaux avec les contraintes
    for (const time of times) {
      const [hour] = time.split(":").map(Number);

      if (text.includes("matin") && hour >= 12) {
        conflicts.push(`Heure ${time} n'est pas le matin`);
        suggestions.push('Proposer des créneaux avant 12:00 pour "matin"');
      }

      if (text.includes("après-midi") && (hour < 12 || hour >= 18)) {
        conflicts.push(`Heure ${time} n'est pas l'après-midi`);
        suggestions.push('Proposer des créneaux 12:00-18:00 pour "après-midi"');
      }
    }

    return {
      passed: conflicts.length === 0,
      conflicts,
      suggestions,
    };
  }

  /**
   * Fusion intelligente des résultats de parsing
   */
  private mergeResults(
    serinaResult: { dates: string[]; times: string[] },
    recurringResult: {
      pattern?: string;
      frequency?: string;
      weekdays?: string[];
    },
    contextualDates: string[],
    constraints: ParsedTemporal["extracted"]["constraints"],
    counterfactualChecks: ParsedTemporal["counterfactualChecks"],
  ): ParsedTemporal["extracted"] {
    // PROTECTION CRITIQUE : Ne jamais permettre les dates passées
    const todayStr = getTodayLocal();

    // Prioriser les dates avec moins de conflits
    let allDates = [...serinaResult.dates, ...contextualDates];

    // PREMIÈRE PRIORITÉ : Éliminer toute date passée
    allDates = allDates.filter((dateStr) => {
      const isNotPast = dateStr >= todayStr;
      if (!isNotPast) {
        logger.debug("Date passée éliminée", "general", { date: dateStr, today: todayStr });
      }
      return isNotPast;
    });

    // Filtrer selon les contraintes et résoudre les conflits
    if (constraints.weekendsOnly) {
      allDates = allDates.filter((dateStr) => {
        const day = new Date(dateStr).getDay();
        return [0, 6].includes(day);
      });
    }

    if (constraints.weekdaysOnly) {
      allDates = allDates.filter((dateStr) => {
        const day = new Date(dateStr).getDay();
        return ![0, 6].includes(day);
      });
    }

    // Éliminer les doublons et trier
    allDates = [...new Set(allDates)].sort();

    return {
      dates: allDates,
      times: [...new Set(serinaResult.times)],
      durations: [], // À implémenter si nécessaire
      recurring: recurringResult,
      constraints,
    };
  }

  /**
   * Calcule un score de confiance basé sur les vérifications
   */
  private calculateConfidence(
    extracted: ParsedTemporal["extracted"],
    counterfactualChecks: ParsedTemporal["counterfactualChecks"],
  ): number {
    let confidence = 0.5; // Base

    // Bonus pour des dates extraites
    if (extracted.dates.length > 0) confidence += 0.2;

    // Bonus pour des heures extraites
    if (extracted.times.length > 0) confidence += 0.1;

    // Bonus pour des patterns récurrents
    if (extracted.recurring.pattern) confidence += 0.1;

    // Malus pour les conflits
    confidence -= counterfactualChecks.conflicts.length * 0.1;

    // Bonus si pas de conflits
    if (counterfactualChecks.passed) confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Détermine le type temporel principal
   */
  private determineTemporalType(
    extracted: ParsedTemporal["extracted"],
  ): ParsedTemporal["temporalType"] {
    if (extracted.recurring.pattern) return "recurring";
    if (extracted.times.length > 0) return "datetime";
    if (extracted.dates.length > 0) return "date";
    return "relative";
  }

  /**
   * Utilitaire pour obtenir le nom du jour
   */
  private getDayName(dayIndex: number): string {
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    return days[dayIndex];
  }

  /**
   * Génère des suggestions d'amélioration basées sur l'analyse
   */
  public generateSuggestions(parsed: ParsedTemporal): string[] {
    const suggestions: string[] = [];

    if (parsed.confidence < 0.7) {
      suggestions.push("Essayez d'être plus précis sur les dates et heures");
    }

    if (parsed.counterfactualChecks.conflicts.length > 0) {
      suggestions.push("Vérifiez la cohérence entre les jours demandés et les dates");
    }

    if (parsed.extracted.dates.length === 0) {
      suggestions.push("Précisez au moins une date ou période temporelle");
    }

    return [...suggestions, ...parsed.counterfactualChecks.suggestions];
  }
}

// Instance par défaut
export const temporalParser = new AdvancedTemporalParser();
