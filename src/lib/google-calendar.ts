import { supabase } from "./supabase";
import { handleError, ErrorFactory, logError } from "./error-handling";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
}

interface FreeBusyResponse {
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
    };
  };
}

export class GoogleCalendarService {
  private accessToken: string | null = null;

  constructor() {
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.provider_token) {
        this.accessToken = session.provider_token;
        console.log("🗓️ Token Google Calendar récupéré");
      }
    } catch (error) {
      const tokenError = handleError(
        error,
        {
          component: "GoogleCalendarService",
          operation: "initializeToken",
        },
        "Erreur lors de la récupération du token Google Calendar",
      );

      logError(tokenError, {
        component: "GoogleCalendarService",
        operation: "initializeToken",
      });
    }
  }

  private async refreshTokenIfNeeded() {
    if (!this.accessToken) {
      await this.initializeToken();
    }
  }

  /**
   * Récupérer les événements du calendrier principal
   */
  async getEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    await this.refreshTokenIfNeeded();

    if (!this.accessToken) {
      const authError = ErrorFactory.auth(
        "Pas de token Google Calendar disponible",
        "Connexion Google Calendar requise",
      );

      logError(authError, {
        component: "GoogleCalendarService",
        operation: "getFreeBusy",
      });

      throw authError;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(startDate)}&` +
          `timeMax=${encodeURIComponent(endDate)}&` +
          `singleEvents=true&` +
          `orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const apiError = ErrorFactory.api(
          `Erreur API Google Calendar: ${response.status}`,
          "Erreur lors de la récupération des événements du calendrier",
          { status: response.status },
        );

        logError(apiError, {
          component: "GoogleCalendarService",
          operation: "getEvents",
          status: response.status,
        });

        throw apiError;
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "GoogleCalendarService",
          operation: "getEvents",
        },
        "Erreur lors de la récupération des événements",
      );

      logError(processedError, {
        component: "GoogleCalendarService",
        operation: "getEvents",
      });

      throw processedError;
    }
  }

  /**
   * Vérifier les créneaux occupés/libres
   */
  async getFreeBusy(
    startDate: string,
    endDate: string,
  ): Promise<Array<{ start: string; end: string }>> {
    await this.refreshTokenIfNeeded();

    if (!this.accessToken) {
      const authError = ErrorFactory.auth(
        "Pas de token Google Calendar disponible",
        "Connexion Google Calendar requise",
      );

      logError(authError, {
        component: "GoogleCalendarService",
        operation: "getFreeBusy",
      });

      throw authError;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: startDate,
          timeMax: endDate,
          items: [{ id: "primary" }],
        }),
      });

      if (!response.ok) {
        const apiError = ErrorFactory.api(
          `Erreur API FreeBusy: ${response.status}`,
          "Erreur lors de la vérification des créneaux occupés",
          { status: response.status },
        );

        logError(apiError, {
          component: "GoogleCalendarService",
          operation: "getFreeBusy",
          status: response.status,
        });

        throw apiError;
      }

      const data: FreeBusyResponse = await response.json();
      return data.calendars.primary?.busy || [];
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "GoogleCalendarService",
          operation: "getFreeBusy",
        },
        "Erreur lors de la récupération des créneaux occupés",
      );

      logError(processedError, {
        component: "GoogleCalendarService",
        operation: "getFreeBusy",
      });

      throw processedError;
    }
  }

  /**
   * Analyser les disponibilités pour une liste de dates
   */
  async analyzeAvailability(dates: string[]): Promise<{
    [date: string]: {
      busy: Array<{ start: string; end: string }>;
      suggested: Array<{ start: string; end: string }>;
    };
  }> {
    const result: { [date: string]: any } = {};

    for (const date of dates) {
      try {
        const startDate = `${date}T00:00:00Z`;
        const endDate = `${date}T23:59:59Z`;

        const busySlots = await this.getFreeBusy(startDate, endDate);

        // Suggérer des créneaux libres (exemple : 9h-12h et 14h-17h si libres)
        const suggested = this.suggestFreeSlots(date, busySlots);

        result[date] = {
          busy: busySlots,
          suggested: suggested,
        };
      } catch (error) {
        const analysisError = handleError(
          error,
          {
            component: "GoogleCalendarService",
            operation: "analyzeAvailability",
          },
          `Erreur lors de l'analyse pour ${date}`,
        );

        logError(analysisError, {
          component: "GoogleCalendarService",
          operation: "analyzeAvailability",
          metadata: { date },
        });

        result[date] = {
          busy: [],
          suggested: [],
        };
      }
    }

    return result;
  }

  /**
   * Suggérer des créneaux libres basés sur les créneaux occupés
   */
  private suggestFreeSlots(
    date: string,
    busySlots: Array<{ start: string; end: string }>,
  ): Array<{ start: string; end: string }> {
    const suggestions: Array<{ start: string; end: string }> = [];

    // Créneaux par défaut à vérifier (9h-12h et 14h-17h)
    const defaultSlots = [
      { start: `${date}T09:00:00`, end: `${date}T12:00:00` },
      { start: `${date}T14:00:00`, end: `${date}T17:00:00` },
    ];

    for (const slot of defaultSlots) {
      const isSlotFree = !busySlots.some((busy) => this.slotsOverlap(slot, busy));

      if (isSlotFree) {
        suggestions.push(slot);
      }
    }

    return suggestions;
  }

  /**
   * Vérifier si deux créneaux se chevauchent
   */
  private slotsOverlap(
    slot1: { start: string; end: string },
    slot2: { start: string; end: string },
  ): boolean {
    const start1 = new Date(slot1.start);
    const end1 = new Date(slot1.end);
    const start2 = new Date(slot2.start);
    const end2 = new Date(slot2.end);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Vérifier si l'utilisateur a autorisé l'accès au calendrier
   */
  async hasCalendarAccess(): Promise<boolean> {
    await this.refreshTokenIfNeeded();
    return !!this.accessToken;
  }
}

// Instance singleton
export const googleCalendar = new GoogleCalendarService();
