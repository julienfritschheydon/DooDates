import { formatDateLocal, getTodayLocal } from "../../../date-utils";
import { logger } from "../../../logger";

/**
 * Validate form poll response structure
 */
export function validateFormPollResponse(response: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation basique
  if (!response || typeof response !== "object") {
    errors.push("La réponse doit être un objet");
    return { isValid: false, errors };
  }

  // Validation du titre
  if (!response.title || typeof response.title !== "string" || response.title.trim().length === 0) {
    errors.push("Le titre est requis et doit être une chaîne non vide");
  }

  // Validation du type
  if (!response.type || response.type !== "form") {
    errors.push("Le type doit être 'form'");
  }

  // Validation des questions
  if (!Array.isArray(response.questions) || response.questions.length === 0) {
    errors.push("Au moins une question est requise");
  } else {
    response.questions.forEach((question: any, index: number) => {
      const questionErrors = validateQuestion(question, index);
      errors.push(...questionErrors);
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate individual question structure
 */
function validateQuestion(question: any, index: number): string[] {
  const errors: string[] = [];
  const questionPrefix = `Question ${index + 1}`;

  // Validation du titre
  if (!question.title || typeof question.title !== "string" || question.title.trim().length === 0) {
    errors.push(`${questionPrefix}: le titre est requis`);
  }

  // Validation du type
  const validTypes = ["single", "multiple", "text", "long-text", "rating", "nps", "matrix", "date"];
  if (!question.type || !validTypes.includes(question.type)) {
    errors.push(`${questionPrefix}: type invalide (${question.type})`);
  }

  // Validation des options pour single/multiple
  if (question.type === "single" || question.type === "multiple") {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(
        `${questionPrefix}: les questions single/multiple doivent avoir au moins 2 options`,
      );
    }
  }

  // Validation des dates pour type date
  if (question.type === "date") {
    if (!Array.isArray(question.selectedDates) || question.selectedDates.length === 0) {
      errors.push(`${questionPrefix}: les questions date doivent avoir des dates sélectionnées`);
    } else {
      // Vérifier le format des dates
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      question.selectedDates.forEach((date: string) => {
        if (!dateRegex.test(date)) {
          errors.push(`${questionPrefix}: format de date invalide (${date})`);
        }
      });
    }
  }

  return errors;
}

/**
 * Validate date poll response structure
 */
export function validateDatePollResponse(response: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation basique
  if (!response || typeof response !== "object") {
    errors.push("La réponse doit être un objet");
    return { isValid: false, errors };
  }

  // Validation du titre
  if (!response.title || typeof response.title !== "string" || response.title.trim().length === 0) {
    errors.push("Le titre est requis et doit être une chaîne non vide");
  }

  // Validation du type
  const validTypes = ["date", "datetime", "custom"];
  if (!response.type || !validTypes.includes(response.type)) {
    errors.push(`Le type doit être parmi: ${validTypes.join(", ")}`);
  }

  // Validation des dates
  if (!Array.isArray(response.dates) || response.dates.length === 0) {
    errors.push("Au moins une date est requise");
  } else {
    // Vérifier le format des dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    response.dates.forEach((date: string) => {
      if (!dateRegex.test(date)) {
        errors.push(`Format de date invalide: ${date}`);
      }
      // Vérifier que la date est dans le futur
      if (date < getTodayLocal()) {
        errors.push(`La date doit être dans le futur: ${date}`);
      }
    });
  }

  // Validation des timeSlots si présents
  if (response.timeSlots && Array.isArray(response.timeSlots)) {
    response.timeSlots.forEach((slot: any, index: number) => {
      if (!slot.start || !slot.end) {
        errors.push(`TimeSlot ${index + 1}: start et end sont requis`);
      }
      // Validation du format HH:MM
      const timeRegex = /^\d{2}:\d{2}$/;
      if (slot.start && !timeRegex.test(slot.start)) {
        errors.push(`TimeSlot ${index + 1}: format start invalide (${slot.start})`);
      }
      if (slot.end && !timeRegex.test(slot.end)) {
        errors.push(`TimeSlot ${index + 1}: format end invalide (${slot.end})`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}
