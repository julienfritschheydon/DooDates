/**
 * Patterns de validation pour champs structurés
 */

export const VALIDATION_PATTERNS = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Adresse email invalide",
    placeholder: "exemple@email.com",
  },
  phone: {
    // Format français : 06 12 34 56 78 ou +33 6 12 34 56 78
    pattern: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    message: "Numéro de téléphone invalide (format français)",
    placeholder: "06 12 34 56 78",
  },
  url: {
    pattern:
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: "URL invalide (doit commencer par http:// ou https://)",
    placeholder: "https://exemple.com",
  },
  number: {
    pattern: /^-?\d+(\.\d+)?$/,
    message: "Nombre invalide",
    placeholder: "123",
  },
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: "Date invalide (format YYYY-MM-DD)",
    placeholder: "2025-01-31",
  },
} as const;

export type ValidationType = keyof typeof VALIDATION_PATTERNS;

/**
 * Valide une valeur selon le type de validation
 */
export function validateValue(value: string, type: ValidationType): boolean {
  if (!value || value.trim() === "") return true; // Champ vide = valide (sauf si required)

  const validation = VALIDATION_PATTERNS[type];
  return validation.pattern.test(value.trim());
}

/**
 * Retourne le message d'erreur pour un type de validation
 */
export function getValidationMessage(type: ValidationType): string {
  return VALIDATION_PATTERNS[type].message;
}

/**
 * Retourne le placeholder pour un type de validation
 */
export function getValidationPlaceholder(type: ValidationType): string {
  return VALIDATION_PATTERNS[type].placeholder;
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  return validateValue(email, "email");
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhone(phone: string): boolean {
  return validateValue(phone, "phone");
}

/**
 * Valide une URL
 */
export function isValidUrl(url: string): boolean {
  return validateValue(url, "url");
}

/**
 * Valide un nombre
 */
export function isValidNumber(value: string): boolean {
  return validateValue(value, "number");
}

/**
 * Valide une date
 */
export function isValidDate(date: string): boolean {
  return validateValue(date, "date");
}
