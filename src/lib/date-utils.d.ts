/**
 * Utilitaires de manipulation de dates pour DooDates
 *
 * RÈGLE CRITIQUE: Ne jamais utiliser toISOString() pour convertir des dates locales
 * en string YYYY-MM-DD car toISOString() retourne en UTC.
 *
 * En France (UTC+2), new Date(2025, 9, 25).toISOString() retourne "2025-10-24T22:00:00Z"
 * ce qui cause un décalage d'un jour.
 */
/**
 * Convertit une Date en string YYYY-MM-DD en utilisant l'heure locale
 * (pas UTC comme toISOString)
 *
 * @param date - La date à convertir
 * @returns String au format "YYYY-MM-DD" en heure locale
 *
 * @example
 * const date = new Date(2025, 9, 25); // 25 octobre 2025
 * formatDateLocal(date); // "2025-10-25" (pas "2025-10-24"!)
 */
export declare function formatDateLocal(date: Date): string;
/**
 * Convertit une Date en string YYYY-MM-DD HH:MM en utilisant l'heure locale
 *
 * @param date - La date à convertir
 * @returns String au format "YYYY-MM-DD HH:MM" en heure locale
 */
export declare function formatDateTimeLocal(date: Date): string;
/**
 * Compare deux dates (YYYY-MM-DD) et retourne true si date1 >= date2
 *
 * @param date1 - Première date (string YYYY-MM-DD)
 * @param date2 - Deuxième date (string YYYY-MM-DD)
 * @returns true si date1 >= date2
 */
export declare function isDateAfterOrEqual(date1: string, date2: string): boolean;
/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD en heure locale
 *
 * @returns String "YYYY-MM-DD" pour aujourd'hui
 */
export declare function getTodayLocal(): string;
/**
 * Génère une liste de dates consécutives
 *
 * @param startDate - Date de début
 * @param daysCount - Nombre de jours à générer
 * @returns Array de strings YYYY-MM-DD
 */
export declare function generateDateRange(startDate: Date, daysCount: number): string[];
/**
 * Filtre un tableau de dates pour ne garder que les dates futures ou aujourd'hui
 *
 * @param dates - Array de strings YYYY-MM-DD
 * @param referenceDate - Date de référence (optionnel, par défaut aujourd'hui)
 * @returns Array filtré avec seulement les dates >= référence
 */
export declare function filterFutureDates(dates: string[], referenceDate?: string): string[];
/**
 * Type pour représenter un groupe de dates consécutives
 */
export interface DateGroup {
    dates: string[];
    label: string;
    type: "weekend" | "week" | "fortnight" | "custom";
}
/**
 * Détecte et groupe les dates consécutives en périodes significatives
 * (semaines complètes, quinzaines)
 * Les week-ends et autres périodes de moins de 7 jours restent individuels
 * sauf si allowWeekendGrouping est true (pour les suggestions du chat)
 *
 * @param dates - Array de dates YYYY-MM-DD triées
 * @param allowWeekendGrouping - Si true, permet de regrouper les samedi-dimanche consécutifs (pour suggestions chat)
 * @returns Array de DateGroup
 *
 * @example
 * const dates = ["2025-12-06", "2025-12-07", "2025-12-08", "2025-12-09", "2025-12-10", "2025-12-11", "2025-12-12"];
 * groupConsecutiveDates(dates);
 * // [
 * //   { dates: [...], label: "Semaine du 6 au 12 décembre", type: "week" }
 * // ]
 */
export declare function groupConsecutiveDates(dates: string[], allowWeekendGrouping?: boolean): DateGroup[];
