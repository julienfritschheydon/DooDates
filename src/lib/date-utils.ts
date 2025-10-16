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
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convertit une Date en string YYYY-MM-DD HH:MM en utilisant l'heure locale
 *
 * @param date - La date à convertir
 * @returns String au format "YYYY-MM-DD HH:MM" en heure locale
 */
export function formatDateTimeLocal(date: Date): string {
  const dateStr = formatDateLocal(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Compare deux dates (YYYY-MM-DD) et retourne true si date1 >= date2
 *
 * @param date1 - Première date (string YYYY-MM-DD)
 * @param date2 - Deuxième date (string YYYY-MM-DD)
 * @returns true si date1 >= date2
 */
export function isDateAfterOrEqual(date1: string, date2: string): boolean {
  return date1 >= date2;
}

/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD en heure locale
 *
 * @returns String "YYYY-MM-DD" pour aujourd'hui
 */
export function getTodayLocal(): string {
  return formatDateLocal(new Date());
}

/**
 * Génère une liste de dates consécutives
 *
 * @param startDate - Date de début
 * @param daysCount - Nombre de jours à générer
 * @returns Array de strings YYYY-MM-DD
 */
export function generateDateRange(
  startDate: Date,
  daysCount: number,
): string[] {
  const dates: string[] = [];

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(formatDateLocal(date));
  }

  return dates;
}

/**
 * Filtre un tableau de dates pour ne garder que les dates futures ou aujourd'hui
 *
 * @param dates - Array de strings YYYY-MM-DD
 * @param referenceDate - Date de référence (optionnel, par défaut aujourd'hui)
 * @returns Array filtré avec seulement les dates >= référence
 */
export function filterFutureDates(
  dates: string[],
  referenceDate?: string,
): string[] {
  const today = referenceDate || getTodayLocal();
  return dates.filter((date) => date >= today);
}
