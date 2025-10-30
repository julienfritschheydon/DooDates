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
export function generateDateRange(startDate: Date, daysCount: number): string[] {
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
export function filterFutureDates(dates: string[], referenceDate?: string): string[] {
  const today = referenceDate || getTodayLocal();
  return dates.filter((date) => date >= today);
}

/**
 * Type pour représenter un groupe de dates consécutives
 */
export interface DateGroup {
  dates: string[]; // Liste des dates YYYY-MM-DD du groupe
  label: string; // Label à afficher ("Week-end du 6-7 décembre", "Semaine du 2 au 8 décembre")
  type: "weekend" | "week" | "fortnight" | "custom"; // Type de groupe
}

/**
 * Détecte et groupe les dates consécutives en périodes significatives
 * (week-ends, semaines, quinzaines, périodes personnalisées)
 *
 * @param dates - Array de dates YYYY-MM-DD triées
 * @returns Array de DateGroup
 *
 * @example
 * const dates = ["2025-12-06", "2025-12-07", "2025-12-13", "2025-12-14"];
 * groupConsecutiveDates(dates);
 * // [
 * //   { dates: ["2025-12-06", "2025-12-07"], label: "Week-end du 6-7 décembre", type: "weekend" },
 * //   { dates: ["2025-12-13", "2025-12-14"], label: "Week-end du 13-14 décembre", type: "weekend" }
 * // ]
 */
export function groupConsecutiveDates(dates: string[]): DateGroup[] {
  if (dates.length === 0) return [];

  // Trier les dates
  const sortedDates = [...dates].sort();
  const groups: DateGroup[] = [];
  let currentGroup: string[] = [sortedDates[0]];

  // Grouper les dates consécutives
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      // Date consécutive
      currentGroup.push(sortedDates[i]);
    } else {
      // Rupture de séquence, créer un groupe
      const result = createDateGroup(currentGroup);
      // Si createDateGroup retourne un tableau (dates non groupées), l'aplatir
      if (Array.isArray(result)) {
        groups.push(...result);
      } else {
        groups.push(result);
      }
      currentGroup = [sortedDates[i]];
    }
  }

  // Ajouter le dernier groupe
  if (currentGroup.length > 0) {
    const result = createDateGroup(currentGroup);
    // Si createDateGroup retourne un tableau (dates non groupées), l'aplatir
    if (Array.isArray(result)) {
      groups.push(...result);
    } else {
      groups.push(result);
    }
  }

  return groups;
}

/**
 * Crée un DateGroup à partir d'une liste de dates consécutives
 * IMPORTANT : Ne groupe que les périodes significatives (week-ends, semaines, quinzaines)
 * Les autres dates consécutives sont laissées individuelles
 */
function createDateGroup(dates: string[]): DateGroup {
  const count = dates.length;
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[count - 1]);

  // Formater les dates pour l'affichage
  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();
  const firstMonth = firstDate.toLocaleDateString("fr-FR", { month: "long" });
  const lastMonth = lastDate.toLocaleDateString("fr-FR", { month: "long" });
  const year = firstDate.getFullYear();

  // Déterminer le type et le label
  if (count === 2 && firstDate.getDay() === 6 && lastDate.getDay() === 0) {
    // Week-end (samedi-dimanche) - GROUPER
    return {
      dates,
      label: `Week-end du ${firstDay}-${lastDay} ${firstMonth} ${year}`,
      type: "weekend",
    };
  } else if (count === 7) {
    // Semaine complète - GROUPER
    const sameMonth = firstMonth === lastMonth;
    const monthStr = sameMonth ? firstMonth : `${firstMonth}-${lastMonth}`;
    return {
      dates,
      label: `Semaine du ${firstDay} au ${lastDay} ${monthStr} ${year}`,
      type: "week",
    };
  } else if (count >= 14 && count <= 15) {
    // Quinzaine - GROUPER
    const sameMonth = firstMonth === lastMonth;
    const monthStr = sameMonth ? firstMonth : `${firstMonth}-${lastMonth}`;
    return {
      dates,
      label: `Quinzaine du ${firstDay} au ${lastDay} ${monthStr} ${year}`,
      type: "fortnight",
    };
  } else {
    // IMPORTANT : Pour 2-6 jours ou 8-13 jours, NE PAS GROUPER
    // Retourner chaque date individuellement
    // Cela évite de grouper "vendredi + samedi" ou "3 jours consécutifs"
    return dates.map((date) => {
      const singleDate = new Date(date);
      const dayName = singleDate.toLocaleDateString("fr-FR", {
        weekday: "long",
      });
      const day = singleDate.getDate();
      const month = singleDate.toLocaleDateString("fr-FR", { month: "long" });
      const year = singleDate.getFullYear();

      return {
        dates: [date],
        label: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day} ${month} ${year}`,
        type: "custom" as const,
      };
    }) as any; // Retourne un tableau, sera flatté par le parent
  }
}
