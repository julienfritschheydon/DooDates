import { GoogleCalendarService } from "../lib/google-calendar";
import { TimeSlot } from "./PollCreationBusinessLogic";

export interface TimeSlotConflict {
  date: string;
  timeSlot: TimeSlot;
  status: "busy" | "partial";
  conflicts: Array<{
    start: string;
    end: string;
    eventTitle?: string;
  }>;
  suggestions?: Array<{
    start: string;
    end: string;
  }>;
}

export class CalendarConflictDetector {
  constructor(private calendarService: GoogleCalendarService) {}

  /**
   * Détecte les conflits pour une liste de dates et de créneaux
   */
  async detectConflicts(
    dates: string[],
    timeSlotsByDate: Record<string, TimeSlot[]>,
    granularity: number,
  ): Promise<TimeSlotConflict[]> {
    const conflicts: TimeSlotConflict[] = [];

    // Grouper les appels par date pour optimiser (Google Calendar API supporte timeMin/timeMax)
    // Pour l'instant on fait date par date comme analyzeAvailability
    for (const date of dates) {
      const slots = timeSlotsByDate[date]?.filter((s) => s.enabled) || [];
      if (slots.length === 0) continue;

      try {
        const dateConflicts = await this.analyzeDate(date, slots, granularity);
        conflicts.push(...dateConflicts);
      } catch (error) {
        // Ignorer les erreurs d'analyse pour une date spécifique
        // L'utilisateur verra simplement qu'il n'y a pas de conflit détecté pour cette date
      }
    }

    return conflicts;
  }

  /**
   * Analyse une date spécifique pour trouver les conflits
   */
  private async analyzeDate(
    date: string,
    slots: TimeSlot[],
    granularity: number,
  ): Promise<TimeSlotConflict[]> {
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    // Récupérer les créneaux occupés (busy)
    const busySlots = await this.calendarService.getFreeBusy(startOfDay, endOfDay);

    const conflicts: TimeSlotConflict[] = [];

    for (const slot of slots) {
      const slotStart = new Date(
        `${date}T${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}:00`,
      );
      const slotEnd = new Date(slotStart.getTime() + granularity * 60000);

      // Vérifier les chevauchements
      const overlappingEvents = busySlots.filter((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (overlappingEvents.length > 0) {
        // Déterminer le statut (busy ou partial)
        // Si au moins un événement couvre TOUT le créneau, c'est busy
        // Sinon c'est partial
        let status: "busy" | "partial" = "partial";

        for (const evt of overlappingEvents) {
          const evtStart = new Date(evt.start);
          const evtEnd = new Date(evt.end);

          // Si l'événement commence avant ou au début du créneau
          // ET finit après ou à la fin du créneau
          if (evtStart <= slotStart && evtEnd >= slotEnd) {
            status = "busy";
            break;
          }
        }

        // Générer des suggestions (créneaux libres adjacents)
        const suggestions = this.generateSuggestions(date, slot, busySlots, granularity);

        conflicts.push({
          date,
          timeSlot: {
            ...slot,
            duration: granularity, // S'assurer que la durée est là
          },
          status,
          conflicts: overlappingEvents.map((evt) => ({
            start: evt.start,
            end: evt.end,
            eventTitle: "Événement", // L'API freeBusy ne donne pas les titres, il faudrait listEvents pour ça
          })),
          suggestions,
        });
      }
    }

    return conflicts;
  }

  /**
   * Génère des suggestions de créneaux libres proches
   */
  private generateSuggestions(
    date: string,
    conflictSlot: TimeSlot,
    busySlots: Array<{ start: string; end: string }>,
    granularity: number,
  ): Array<{ start: string; end: string }> {
    const suggestions: Array<{ start: string; end: string }> = [];
    const slotStart = new Date(
      `${date}T${String(conflictSlot.hour).padStart(2, "0")}:${String(conflictSlot.minute).padStart(2, "0")}:00`,
    );

    // Chercher 30 min avant et après
    const candidates = [
      new Date(slotStart.getTime() - granularity * 60000),
      new Date(slotStart.getTime() + granularity * 60000),
    ];

    for (const candidate of candidates) {
      const candidateEnd = new Date(candidate.getTime() + granularity * 60000);

      // Vérifier si ce candidat est libre
      const isBusy = busySlots.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return candidate < busyEnd && candidateEnd > busyStart;
      });

      if (!isBusy) {
        suggestions.push({
          start: `${String(candidate.getHours()).padStart(2, "0")}:${String(candidate.getMinutes()).padStart(2, "0")}`,
          end: `${String(candidateEnd.getHours()).padStart(2, "0")}:${String(candidateEnd.getMinutes()).padStart(2, "0")}`,
        });
      }
    }

    return suggestions;
  }
}
