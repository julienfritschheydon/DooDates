/**
 * Patterns de validation pour champs structurés
 */
export declare const VALIDATION_PATTERNS: {
    readonly email: {
        readonly pattern: RegExp;
        readonly message: "Adresse email invalide";
        readonly placeholder: "exemple@email.com";
    };
    readonly phone: {
        readonly pattern: RegExp;
        readonly message: "Numéro de téléphone invalide (format français)";
        readonly placeholder: "06 12 34 56 78";
    };
    readonly url: {
        readonly pattern: RegExp;
        readonly message: "URL invalide (doit commencer par http:// ou https://)";
        readonly placeholder: "https://exemple.com";
    };
    readonly number: {
        readonly pattern: RegExp;
        readonly message: "Nombre invalide";
        readonly placeholder: "123";
    };
    readonly date: {
        readonly pattern: RegExp;
        readonly message: "Date invalide (format YYYY-MM-DD)";
        readonly placeholder: "2025-01-31";
    };
};
export type ValidationType = keyof typeof VALIDATION_PATTERNS;
/**
 * Valide une valeur selon le type de validation
 */
export declare function validateValue(value: string, type: ValidationType): boolean;
/**
 * Retourne le message d'erreur pour un type de validation
 */
export declare function getValidationMessage(type: ValidationType): string;
/**
 * Retourne le placeholder pour un type de validation
 */
export declare function getValidationPlaceholder(type: ValidationType): string;
/**
 * Valide un email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Valide un numéro de téléphone français
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Valide une URL
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Valide un nombre
 */
export declare function isValidNumber(value: string): boolean;
/**
 * Valide une date
 */
export declare function isValidDate(date: string): boolean;
