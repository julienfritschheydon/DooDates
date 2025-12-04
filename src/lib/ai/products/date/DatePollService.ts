import CalendarQuery from "../../../calendar-generator";
import { formatDateLocal, getTodayLocal } from "../../../date-utils";
import type { ParsedTemporalInput } from "../../../temporalParser";
import { logger } from "../../../logger";

export interface DatePollSuggestion {
    title: string;
    description?: string;
    dates: string[];
    timeSlots?: Array<{
        start: string;
        end: string;
        dates?: string[]; // Dates spécifiques auxquelles ce créneau s'applique
    }>;
    type: "date" | "datetime" | "custom";
    participants?: string[];
    // 🔧 Groupes de dates (week-ends, semaines, quinzaines)
    dateGroups?: Array<{
        dates: string[];
        label: string;
        type: "weekend" | "week" | "fortnight" | "custom" | "range";
    }>;
}

export class DatePollService {
    private static instance: DatePollService;
    private calendarQuery: CalendarQuery;

    private constructor() {
        this.calendarQuery = new CalendarQuery();
    }

    public static getInstance(): DatePollService {
        if (!DatePollService.instance) {
            DatePollService.instance = new DatePollService();
        }
        return DatePollService.instance;
    }

    /**
     * Génère les hints Gemini basés sur le parsing temporel robuste.
     */
    public buildDateHintsFromParsed(parsed: ParsedTemporalInput, userInput: string): string {
        const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
        const monthNames = [
            "janvier",
            "février",
            "mars",
            "avril",
            "mai",
            "juin",
            "juillet",
            "août",
            "septembre",
            "octobre",
            "novembre",
            "décembre",
        ];

        let hints = "";

        // 1. Instructions sur les dates autorisées
        if (parsed.allowedDates.length > 0) {
            const formattedDates = parsed.allowedDates
                .map((d) => {
                    const date = new Date(d);
                    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
                })
                .join(", ");

            // Déterminer combien de dates on attend
            const expectedDatesCount = parsed.allowedDates.length;

            hints += `\n⚠️⚠️⚠️ INSTRUCTIONS STRICTES SUR LES DATES ⚠️⚠️⚠️\n`;
            hints += `Basé sur l'analyse temporelle de "${userInput}":\n`;
            hints += `DATES AUTORISÉES UNIQUEMENT: ${formattedDates}\n`;
            hints += `NOMBRE DE DATES ATTENDUES: ${expectedDatesCount}\n`;

            hints += `\nRÈGLE ABSOLUE - PLUSIEURS JOURS:\n`;
            hints += `→ OBLIGATOIRE : Générer EXACTEMENT ${expectedDatesCount} DATES (une pour chaque jour mentionné)\n`;
            hints += `→ OBLIGATOIRE : Chaque date doit correspondre au bon jour de la semaine\n`;
            hints += `→ INTERDIT : Ne générer qu'une seule date (l'utilisateur veut voir les options pour tous les jours)\n`;
            if (parsed.isMealContext) {
                hints += `→ OBLIGATOIRE : 1 CRÉNEAU UNIQUEMENT (partagé entre toutes les dates ou 1 par date selon le contexte)\n`;
            }

            hints += `\nDates autorisées (OBLIGATOIRE de générer TOUTES ces dates):\n`;
            hints += `${parsed.allowedDates.join("\n")}\n`;
        }

        // 2. Instructions sur les créneaux horaires
        if (parsed.timeSlots && parsed.timeSlots.length > 0) {
            hints += `\n⚠️⚠️⚠️ INSTRUCTIONS STRICTES SUR LES HORAIRES ⚠️⚠️⚠️\n`;
            hints += `CRÉNEAUX IMPOSÉS PAR LA DEMANDE:\n`;

            parsed.timeSlots.forEach((slot) => {
                hints += `- ${slot.start} à ${slot.end}`;
                if (slot.dates && slot.dates.length > 0) {
                    hints += ` (uniquement pour: ${slot.dates.join(", ")})`;
                }
                hints += "\n";
            });

            hints += `→ OBLIGATOIRE : Utiliser ces créneaux exacts\n`;
        } else if (parsed.isMealContext) {
            // Hints spécifiques pour les repas
            hints += `\n⚠️ CONTEXTE REPAS DÉTECTÉ ⚠️\n`;
            hints += `→ Générer UN SEUL créneau par date (ex: 12h-14h pour déjeuner, 19h-21h pour dîner)\n`;
            hints += `→ NE PAS générer de multiples créneaux pour un repas\n`;
        }

        return hints;
    }

    private getTargetYear(month: number): number {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Si le mois demandé est déjà passé cette année, utiliser l'année prochaine
        return month < currentMonth ? currentYear + 1 : currentYear;
    }

    public parseWeekendRange(startMonth: number, endMonth: number, year?: number): string[] {
        // Utiliser le calendrier pré-généré pour une performance optimale
        const targetYear = year || this.getTargetYear(startMonth);

        // Formater les mois pour la requête
        const startMonthKey = `${targetYear}-${startMonth.toString().padStart(2, "0")}`;
        const endMonthKey = `${targetYear}-${endMonth.toString().padStart(2, "0")}`;

        // Obtenir tous les week-ends de la période en une seule requête
        const weekendDays = this.calendarQuery.getWeekendsInMonths(startMonthKey, endMonthKey);

        // Reconstruire les paires (samedi, dimanche)
        const weekendPairs: string[] = [];
        for (let i = 0; i < weekendDays.length; i++) {
            const day = weekendDays[i];
            // Si c'est un samedi
            if (day.dayOfWeek === 6) {
                weekendPairs.push(day.date);

                // Vérifier si le jour suivant est un dimanche
                const currentDate = new Date(day.date);
                const nextDay = weekendDays[i + 1];
                if (nextDay && nextDay.dayOfWeek === 0) {
                    const nextDate = new Date(nextDay.date);
                    const dayDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

                    // Si le dimanche est bien le lendemain du samedi
                    if (dayDiff === 1) {
                        weekendPairs.push(nextDay.date);
                        i++; // Sauter le dimanche car on l'a déjà traité
                    }
                }
            }
            // Si c'est un dimanche isolé (pas précédé d'un samedi), on l'ignore
            // car un week-end = samedi + dimanche
        }

        return weekendPairs;
    }

    public getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
        const resultDate = new Date(date.getTime());
        resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));
        if (resultDate <= date) {
            resultDate.setDate(resultDate.getDate() + 7);
        }
        return resultDate;
    }

    public getNextNDaysOfWeek(dayOfWeek: number, count: number, month: number): string[] {
        // Utiliser le calendrier pré-généré pour une performance optimale
        const targetYear = this.getTargetYear(month);
        const fromDate = `${targetYear}-${month.toString().padStart(2, "0")}-01`;

        // Obtenir directement N occurrences du jour de la semaine
        const dayOccurrences = this.calendarQuery.getNextNDaysOfWeek(dayOfWeek, count, fromDate);

        return dayOccurrences.map((day: { date: string }) => day.date);
    }

    public parseConsecutiveDays(firstDay: number, daysCount: number, fromDate?: Date): string[] {
        const dates: string[] = [];
        const startDate = fromDate || this.getNextDayOfWeek(new Date(), firstDay);

        for (let i = 0; i < daysCount; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(formatDateLocal(date));
        }

        return dates;
    }

    public parseSessionPattern(text: string): Array<{
        type: string;
        count: number;
        dayOfWeek: string;
        timeOfDay: string;
        month: string;
        format: string;
    }> {
        const patterns = [];

        // Analyse le texte pour trouver les patterns de sessions
        // Ex: "3 sessions en présentiel les lundis matins de mars"
        const sessionMatches = text.matchAll(
            /(\d+)\s+sessions?\s+en\s+(\w+)\s+les\s+(\w+)s?\s+(\w+)s?\s+(?:de|en|d'|du)\s+(\w+)/g,
        );

        for (const match of sessionMatches) {
            const [_, count, format, day, timing, month] = match;
            patterns.push({
                type: "session",
                count: parseInt(count),
                dayOfWeek: day,
                timeOfDay: timing,
                month: month,
                format: format,
            });
        }

        return patterns;
    }

    public parseTimeRange(
        start: string,
        end: string,
        dates: string[],
    ): { start: string; end: string; dates: string[] } {
        return {
            start,
            end,
            dates,
        };
    }

    public parseTimePattern(timeStr: string): { hour: number; minute: number } {
        // Convertit "9h", "9:00", "09h00", etc. en { hour: 9, minute: 0 }
        const cleanTime = timeStr
            .toLowerCase()
            .replace("h", ":")
            .replace(/[^0-9:]/g, "");
        const [hours, minutes = "0"] = cleanTime.split(":");
        return {
            hour: parseInt(hours, 10),
            minute: parseInt(minutes, 10),
        };
    }

    public generateSequentialTimeSlots(
        date: string,
        mainStartTime: string,
        durations: { brief?: number; main: number; debrief?: number },
    ): Array<{ start: string; end: string; dates: string[]; description?: string }> {
        const timeSlots = [];
        const currentTime = new Date(`${date}T${mainStartTime}`);

        // Si brief, on le met avant la réunion principale
        if (durations.brief) {
            const briefStart = new Date(currentTime);
            briefStart.setMinutes(briefStart.getMinutes() - durations.brief);

            timeSlots.push({
                start: briefStart.toTimeString().slice(0, 5),
                end: currentTime.toTimeString().slice(0, 5),
                dates: [date],
                description: "Briefing",
            });
        }

        // Réunion principale
        const mainEnd = new Date(currentTime);
        mainEnd.setMinutes(mainEnd.getMinutes() + durations.main);

        timeSlots.push({
            start: currentTime.toTimeString().slice(0, 5),
            end: mainEnd.toTimeString().slice(0, 5),
            dates: [date],
            description: "Réunion principale",
        });

        // Si débrief, on le met après la réunion principale
        if (durations.debrief) {
            const debriefStart = new Date(mainEnd);
            const debriefEnd = new Date(debriefStart);
            debriefEnd.setMinutes(debriefEnd.getMinutes() + durations.debrief);

            timeSlots.push({
                start: debriefStart.toTimeString().slice(0, 5),
                end: debriefEnd.toTimeString().slice(0, 5),
                dates: [date],
                description: "Débrief d'équipe",
            });
        }

        return timeSlots;
    }

    public convertGeminiTimeSlots(
        timeSlots: Array<{ start: string; end: string; dates: string[] }>,
    ): Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> {
        const result: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> = {};

        timeSlots.forEach((slot: { start: string; end: string; dates: string[] }) => {
            slot.dates.forEach((date: string) => {
                if (!result[date]) {
                    // Initialiser avec toutes les heures désactivées
                    result[date] = Array.from({ length: 24 }, (_, i) => ({
                        hour: i,
                        minute: 0,
                        enabled: false,
                    }));
                }

                // Activer les heures correspondant au créneau
                const startHour = parseInt(slot.start.split(":")[0]);
                const endHour = parseInt(slot.end.split(":")[0]);

                for (let hour = startHour; hour < endHour; hour++) {
                    if (result[date][hour]) {
                        result[date][hour].enabled = true;
                    }
                }
            });
        });

        return result;
    }

    public getTimeRangeForPeriod(period: string): {
        start: string;
        end: string;
    } {
        const timeRanges: Record<string, { start: string; end: string }> = {
            matin: { start: "09:00", end: "12:00" },
            midi: { start: "12:00", end: "14:00" },
            "après-midi": { start: "14:00", end: "17:00" },
            soir: { start: "17:00", end: "19:00" },
        };

        return timeRanges[period] || { start: "09:00", end: "17:00" };
    }

    public formatTime(hour: number, minute: number): string {
        // Formate en "HH:MM"
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }

    public getNextThursdayAfterTuesday(tuesday: Date): Date {
        // Si on est mardi, on veut le jeudi de la même semaine
        const thursday = new Date(tuesday);
        thursday.setDate(tuesday.getDate() + 2); // +2 jours pour aller de mardi à jeudi
        return thursday;
    }
}

export const datePollService = DatePollService.getInstance();
