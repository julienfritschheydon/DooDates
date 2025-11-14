/**
 * Validateur pour vérifier la cohérence du parsing temporel.
 *
 * Ce validateur détecte les erreurs de parsing tôt, permettant de corriger
 * avant d'appeler Gemini et d'améliorer la qualité des résultats.
 */

import { ParsedTemporalInput } from "./temporalParser";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  code: string;
  message: string;
}

/**
 * Valide un résultat de parsing temporel.
 */
export function validateParsedInput(parsed: ParsedTemporalInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Vérifier que des dates ont été détectées
  if (parsed.allowedDates.length === 0 && parsed.type !== "unknown") {
    errors.push({
      code: "NO_DATES_DETECTED",
      message: "Aucune date n'a été détectée malgré un type de demande identifié",
      severity: "error",
    });
  }

  // 2. Vérifier la cohérence mois / dates
  if (parsed.month !== undefined) {
    const datesInMonth = parsed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return date.getMonth() === parsed.month;
    });

    if (datesInMonth.length === 0 && parsed.allowedDates.length > 0) {
      errors.push({
        code: "MONTH_MISMATCH",
        message: `Le mois "${parsed.month}" a été détecté mais aucune date dans ce mois n'est présente dans allowedDates`,
        severity: "error",
      });
    } else if (datesInMonth.length < parsed.allowedDates.length) {
      warnings.push({
        code: "MONTH_PARTIAL_MATCH",
        message: `Le mois "${parsed.month}" a été détecté mais certaines dates ne sont pas dans ce mois`,
      });
    }
  }

  // 3. Vérifier la cohérence jour de la semaine / dates
  if (parsed.dayOfWeek && parsed.dayOfWeek.length > 0) {
    const datesMatchingDay = parsed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return parsed.dayOfWeek!.includes(date.getDay());
    });

    if (datesMatchingDay.length === 0 && parsed.allowedDates.length > 0) {
      errors.push({
        code: "DAY_MISMATCH",
        message: `Le jour de la semaine "${parsed.dayOfWeek}" a été détecté mais aucune date correspondante n'est présente dans allowedDates`,
        severity: "error",
      });
    } else if (datesMatchingDay.length < parsed.allowedDates.length) {
      warnings.push({
        code: "DAY_PARTIAL_MATCH",
        message: `Le jour de la semaine "${parsed.dayOfWeek}" a été détecté mais certaines dates ne correspondent pas`,
      });
    }
  }

  // 4. Vérifier la cohérence période ("fin mars" / "début avril")
  if (parsed.period && parsed.month !== undefined) {
    const datesMatchingPeriod = parsed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDate();
      if (parsed.period === "end") {
        return day >= 15;
      } else if (parsed.period === "start") {
        return day <= 15;
      }
      return true;
    });

    if (datesMatchingPeriod.length === 0 && parsed.allowedDates.length > 0) {
      warnings.push({
        code: "PERIOD_PARTIAL_MATCH",
        message: `La période "${parsed.period}" a été détectée mais certaines dates ne correspondent pas`,
      });
    }
  }

  // 5. Vérifier la cohérence date numérique
  if (parsed.dateNumeric) {
    const datesMatchingNumeric = parsed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return date.getDate() === parsed.dateNumeric!.day;
    });

    if (datesMatchingNumeric.length === 0 && parsed.allowedDates.length > 0) {
      errors.push({
        code: "DATE_NUMERIC_MISMATCH",
        message: `La date numérique "${parsed.dateNumeric.day}" a été détectée mais aucune date correspondante n'est présente`,
        severity: "error",
      });
    }
  }

  // 6. Vérifier que les dates sont dans le futur
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const pastDates = parsed.allowedDates.filter((dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < now;
  });

  if (pastDates.length > 0) {
    warnings.push({
      code: "PAST_DATES",
      message: `${pastDates.length} date(s) dans le passé détectée(s): ${pastDates.slice(0, 3).join(", ")}`,
    });
  }

  // 7. Vérifier la cohérence expectedDatesCount / allowedDates
  if (typeof parsed.expectedDatesCount === "number") {
    if (parsed.allowedDates.length < parsed.expectedDatesCount) {
      warnings.push({
        code: "INSUFFICIENT_DATES",
        message: `Expected ${parsed.expectedDatesCount} date(s) but only ${parsed.allowedDates.length} available`,
      });
    }
  }

  // 8. Vérifier le contexte repas + date spécifique
  if (parsed.isMealContext && parsed.type === "specific_date") {
    if (parsed.expectedSlotsCount !== 1 && parsed.expectedSlotsCount !== "2-3") {
      // Exception partenariats autorisée
      warnings.push({
        code: "MEAL_SLOTS_COUNT",
        message: `Repas + date spécifique devrait avoir 1 créneau (ou 2-3 pour partenariats), mais ${parsed.expectedSlotsCount} détecté`,
      });
    }
  }

  return {
    isValid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
    warnings,
  };
}

/**
 * Corrige automatiquement les erreurs détectées si possible.
 */
export function autoFixParsedInput(
  parsed: ParsedTemporalInput,
  validation: ValidationResult,
): ParsedTemporalInput {
  const fixed = { ...parsed };

  // Corriger les dates dans le passé
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  fixed.allowedDates = fixed.allowedDates.filter((dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date >= now;
  });

  // Filtrer par mois si détecté mais dates non cohérentes
  if (fixed.month !== undefined) {
    const datesInMonth = fixed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return date.getMonth() === fixed.month;
    });
    if (datesInMonth.length > 0) {
      fixed.allowedDates = datesInMonth;
    }
  }

  // Filtrer par jour de la semaine si détecté mais dates non cohérentes
  if (fixed.dayOfWeek && fixed.dayOfWeek.length > 0) {
    const datesMatchingDay = fixed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return fixed.dayOfWeek!.includes(date.getDay());
    });
    if (datesMatchingDay.length > 0) {
      fixed.allowedDates = datesMatchingDay;
    }
  }

  // Filtrer par date numérique si détectée
  if (fixed.dateNumeric) {
    const datesMatchingNumeric = fixed.allowedDates.filter((dateStr) => {
      const date = new Date(dateStr);
      return date.getDate() === fixed.dateNumeric!.day;
    });
    if (datesMatchingNumeric.length > 0) {
      fixed.allowedDates = datesMatchingNumeric;
    }
  }

  return fixed;
}
