/**
 * Validation des emails
 */
export declare function validateEmail(email: string): boolean;
/**
 * Validation du titre de sondage
 */
export declare function validatePollTitle(title: string): boolean;
/**
 * Validation d'une date au format YYYY-MM-DD
 */
export declare function isValidDate(dateString: string): boolean;
/**
 * Validation qu'une date est future
 */
export declare function isFutureDate(dateString: string): boolean;
/**
 * Validation d'une liste d'emails séparés par des virgules
 */
export declare function validateEmailList(emailList: string): {
  valid: string[];
  invalid: string[];
};
/**
 * Validation d'un créneau horaire (HH:MM format)
 */
export declare function validateTimeSlot(timeSlot: string): boolean;
/**
 * Validation qu'un créneau de fin est après le début
 */
export declare function validateTimeRange(startTime: string, endTime: string): boolean;
