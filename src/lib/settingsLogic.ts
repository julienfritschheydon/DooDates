/**
 * Logique métier pour les paramètres avancés des polls
 * Validation, transformation et utilitaires
 */

import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import type { FormPollSettings } from "@/lib/products/form-polls/form-polls-service";
import type { QuizzSettings } from "@/lib/products/quizz/quizz-settings";

export type AdvancedSettings = DatePollSettings | FormPollSettings | QuizzSettings;

/**
 * Interface pour les validations de paramètres
 */
export interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Interface pour les transformations de paramètres
 */
export interface SettingsTransformOptions {
  removeEmpty?: boolean;
  validateDates?: boolean;
  sanitizeEmail?: boolean;
}

/**
 * Validation d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation d'une date limite
 */
export function isValidExpirationDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== "string" || dateString.trim() === "") return true; // Optionnel

  try {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  } catch {
    return false;
  }
}

/**
 * Validation du nombre maximum de réponses
 */
export function isValidMaxResponses(maxResponses: number | undefined): boolean {
  if (maxResponses === undefined) return true; // Illimité
  return Number.isInteger(maxResponses) && maxResponses > 0;
}

/**
 * Validation du temps limite pour les quizz (en minutes)
 */
export function isValidTimeLimit(timeLimit: number | undefined): boolean {
  if (timeLimit === undefined) return true; // Optionnel
  return Number.isInteger(timeLimit) && timeLimit > 0 && timeLimit <= 1440; // Max 24h
}

/**
 * Validation complète des paramètres avancés
 */
export function validateAdvancedSettings(
  settings: AdvancedSettings,
  pollType: "date" | "form" | "quizz",
): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation email
  if (settings.sendEmailCopy && !settings.emailForCopy) {
    errors.push("L'adresse email est obligatoire si l'envoi par email est activé");
  } else if (settings.emailForCopy && !isValidEmail(settings.emailForCopy)) {
    errors.push("L'adresse email n'est pas valide");
  }

  // Validation date limite (form et quizz)
  if (pollType !== "date" && (settings as FormPollSettings | QuizzSettings).expiresAt) {
    const expiresAt = (settings as FormPollSettings | QuizzSettings).expiresAt;
    if (!isValidExpirationDate(expiresAt!)) {
      errors.push("La date limite doit être dans le futur");
    }
  }

  // Validation nombre maximum de réponses
  if (pollType !== "date") {
    const maxResponses = (settings as FormPollSettings | QuizzSettings).maxResponses;
    if (!isValidMaxResponses(maxResponses)) {
      errors.push("Le nombre maximum de réponses doit être un entier positif");
    }
  }

  // Validation temps limite (quizz uniquement)
  if (pollType === "quizz") {
    const timeLimit = (settings as QuizzSettings).timeLimit;
    if (!isValidTimeLimit(timeLimit)) {
      errors.push("Le temps limite doit être compris entre 1 et 1440 minutes");
    }
  }

  // Warnings
  if (settings.requireAuth && !settings.oneResponsePerPerson) {
    warnings.push("La connexion est requise mais les réponses multiples sont autorisées");
  }

  if (settings.allowEditAfterSubmit && settings.oneResponsePerPerson) {
    warnings.push("La modification après soumission peut permettre plusieurs réponses");
  }

  if ((settings as FormPollSettings | QuizzSettings).maxResponses === 1) {
    warnings.push(
      "Une seule réponse autorisée - considérez utiliser l'option 'Une réponse par personne'",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Transformation et nettoyage des paramètres
 */
export function transformAdvancedSettings(
  settings: AdvancedSettings,
  options: SettingsTransformOptions = {},
): AdvancedSettings {
  const transformed = { ...settings };

  // Supprimer les valeurs vides
  if (options.removeEmpty) {
    Object.keys(transformed).forEach((key) => {
      const value = transformed[key as keyof AdvancedSettings];
      if (value === "" || value === null || value === undefined) {
        delete transformed[key as keyof AdvancedSettings];
      }
    });
  }

  // Valider et nettoyer les emails
  if (options.sanitizeEmail && transformed.emailForCopy) {
    const email = transformed.emailForCopy.trim().toLowerCase();
    if (isValidEmail(email)) {
      transformed.emailForCopy = email;
    }
  }

  // Valider les dates
  if (options.validateDates && (transformed as FormPollSettings | QuizzSettings).expiresAt) {
    const expiresAt = (transformed as FormPollSettings | QuizzSettings).expiresAt;
    if (!isValidExpirationDate(expiresAt!)) {
      delete (transformed as FormPollSettings | QuizzSettings).expiresAt;
    }
  }

  return transformed;
}

/**
 * Calcul du niveau de restriction d'un poll
 */
export function getRestrictionLevel(settings: AdvancedSettings): "low" | "medium" | "high" {
  let score = 0;

  if (settings.requireAuth) score += 2;
  if (settings.oneResponsePerPerson) score += 1;
  if ((settings as FormPollSettings | QuizzSettings).maxResponses) score += 1;
  if (settings.sendEmailCopy) score += 1;
  if (settings.resultsVisibility === "creator-only") score += 2;
  if (settings.resultsVisibility === "voters") score += 1;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

/**
 * Génération d'un résumé des paramètres
 */
export function generateSettingsSummary(settings: AdvancedSettings): string[] {
  const summary: string[] = [];

  if (settings.requireAuth) {
    summary.push("Connexion requise");
  }

  if (settings.oneResponsePerPerson) {
    summary.push("Une réponse par personne");
  }

  if ((settings as FormPollSettings | QuizzSettings).maxResponses) {
    summary.push(`Limite: ${(settings as FormPollSettings | QuizzSettings).maxResponses} réponses`);
  }

  if ((settings as FormPollSettings | QuizzSettings).expiresAt) {
    const date = new Date((settings as FormPollSettings | QuizzSettings).expiresAt!);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    summary.push(`Ferme le ${dateStr}`);
  }

  if (settings.sendEmailCopy) {
    summary.push("Email de confirmation activé");
  }

  const visibilityMap = {
    "creator-only": "Résultats privés",
    voters: "Résultats pour participants",
    public: "Résultats publics",
  };

  const visibility = visibilityMap[settings.resultsVisibility || "public"];
  summary.push(visibility);

  if ((settings as QuizzSettings).allowRetry) {
    summary.push("Autoriser les tentatives multiples");
  }

  if ((settings as QuizzSettings).showCorrectAnswers) {
    summary.push("Montrer les réponses correctes");
  }

  if ((settings as QuizzSettings).timeLimit) {
    summary.push(`Temps limite: ${(settings as QuizzSettings).timeLimit} min`);
  }

  return summary;
}

/**
 * Vérification de compatibilité entre paramètres
 */
export function checkSettingsCompatibility(
  settings: AdvancedSettings,
  pollType: "date" | "form" | "quizz",
): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Incompatibilités spécifiques aux types de polls
  if (pollType === "date") {
    // Les date polls n'ont pas de maxResponses ou expiresAt
    if ("maxResponses" in settings && settings.maxResponses) {
      errors.push("Les sondages de date ne supportent pas la limite de réponses");
    }
    if ("expiresAt" in settings && settings.expiresAt) {
      errors.push("Les sondages de date ne supportent pas de date limite");
    }
  }

  // Incompatibilités générales
  if (settings.allowEditAfterSubmit && settings.oneResponsePerPerson && !settings.requireAuth) {
    warnings.push(
      "La modification après soumission avec 'une réponse par personne' sans connexion peut être contournée",
    );
  }

  if (settings.sendEmailCopy && settings.requireAuth) {
    warnings.push("L'email de confirmation peut être redondant avec la connexion requise");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valeurs par défaut selon le type de poll
 */
export function getDefaultSettings(pollType: "date" | "form" | "quizz"): AdvancedSettings {
  const baseDefaults = {
    showLogo: true,
    showEstimatedTime: false,
    showQuestionCount: false,
    requireAuth: false,
    oneResponsePerPerson: false,
    allowEditAfterSubmit: false,
    sendEmailCopy: false,
    emailForCopy: "",
    resultsVisibility: "public" as const,
  };

  if (pollType === "date") {
    return baseDefaults as DatePollSettings;
  }

  if (pollType === "form") {
    return {
      ...baseDefaults,
      maxResponses: undefined,
      expiresAt: undefined,
    } as FormPollSettings;
  }

  if (pollType === "quizz") {
    return {
      ...baseDefaults,
      maxResponses: undefined,
      expiresAt: undefined,
      allowRetry: false,
      showCorrectAnswers: true,
      timeLimit: undefined,
    } as QuizzSettings;
  }

  return baseDefaults;
}
