import { handleError, ErrorFactory, logError } from "./error-handling";
import { logger } from "./logger";
import { getSupabaseSessionWithTimeout } from "./supabaseApi";

export interface GoogleCalendarEvent {
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
  location?: string;
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

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async initializeToken() {
    try {
      const session = await getSupabaseSessionWithTimeout(2000);

      if (!session) {
        logger.warn("Aucune session Supabase trouvée", "auth");
        return;
      }

      // Debug: logger les informations de session
      logger.info("Initialisation token Google Calendar", "auth", {
        hasProviderToken: !!session.provider_token,
        hasProviderRefreshToken: !!session.provider_refresh_token,
        hasAccessToken: !!session.access_token,
        provider: session.user?.app_metadata?.provider,
      });

      // Pour Google OAuth avec Supabase, le token peut être dans provider_token
      if (session.provider_token) {
        this.accessToken = session.provider_token;
        logger.info("Token Google Calendar récupéré (provider_token)", "auth", {
          tokenLength: session.provider_token.length,
          tokenPreview: session.provider_token.substring(0, 20) + "...",
        });
        return;
      }

      // Note: Supabase ne stocke pas automatiquement provider_token pour Google OAuth
      // Il faut utiliser une fonctionnalité spécifique de Supabase ou une approche différente
      // Pour l'instant, on log les informations disponibles pour debug
      if (session.provider_refresh_token && session.user?.app_metadata?.provider === "google") {
        logger.info("provider_refresh_token disponible mais provider_token manquant", "auth", {
          note: "Supabase ne stocke pas automatiquement le token Google. Il faut peut-être utiliser une approche différente.",
        });
      }

      // Dernière tentative : vérifier si le token est dans les métadonnées utilisateur
      const userMetadata = session.user?.user_metadata;
      if (userMetadata?.provider_token) {
        this.accessToken = userMetadata.provider_token;
        logger.info("Token Google Calendar récupéré (user_metadata)", "auth");
        return;
      }

      // Fallback: localStorage (sauvegardé manuellement par AuthContext)
      const storedToken = localStorage.getItem("google_provider_token");
      if (storedToken) {
        this.accessToken = storedToken;
        logger.info("Token Google Calendar récupéré (localStorage)", "auth");
        return;
      }

      logger.warn("Aucun token Google Calendar trouvé dans la session", "auth", {
        hasProviderToken: !!session.provider_token,
        hasProviderRefreshToken: !!session.provider_refresh_token,
        provider: session.user?.app_metadata?.provider,
      });
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
    // Toujours réinitialiser le token pour s'assurer qu'on a le dernier token de la session
    await this.initializeToken();

    if (!this.accessToken) {
      const authError = ErrorFactory.auth(
        "Pas de token Google Calendar disponible",
        "Connexion Google Calendar requise",
      );
      throw authError;
    }
  }

  /**
   * Forcer la réinitialisation du token (utile après une nouvelle connexion)
   */
  async refreshToken() {
    this.accessToken = null;
    await this.initializeToken();
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
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Erreur API Google Calendar: ${response.status}`;

        if (response.status === 403) {
          errorMessage +=
            ". Vérifiez que :\n" +
            "1. L'API Google Calendar est activée dans Google Cloud Console\n" +
            "2. Vous avez les permissions nécessaires (scopes calendar.readonly et calendar)\n" +
            "3. Vous vous êtes reconnecté après avoir ajouté les scopes";
        }

        const apiError = ErrorFactory.api(
          errorMessage,
          "Erreur lors de la récupération des événements du calendrier",
          { status: response.status, details: errorData },
        );

        logError(apiError, {
          component: "GoogleCalendarService",
          operation: "getEvents",
          status: response.status,
          metadata: { errorDetails: errorData },
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
  /**
   * Récupérer la liste des calendriers de l'utilisateur
   */
  async getCalendars(): Promise<Array<{ id: string; primary?: boolean; summary?: string }>> {
    await this.refreshTokenIfNeeded();

    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) return [{ id: "primary" }];

      const data = await response.json();
      return data.items.map((item: any) => ({
        id: item.id,
        primary: item.primary,
        summary: item.summary,
      }));
    } catch (error) {
      logger.error("Erreur récupération liste calendriers", "calendar", error);
      return [{ id: "primary" }];
    }
  }

  /**
   * Récupérer les événements de TOUS les calendriers sur une période
   */
  async getAllEvents(
    startDate: string,
    endDate: string,
  ): Promise<Array<GoogleCalendarEvent & { calendarSummary?: string; calendarId?: string }>> {
    await this.refreshTokenIfNeeded();

    if (!this.accessToken) return [];

    try {
      // 1. Récupérer tous les calendriers
      const calendars = await this.getCalendars();
      const allEvents: Array<
        GoogleCalendarEvent & { calendarSummary?: string; calendarId?: string }
      > = [];

      // 2. Récupérer les événements pour chaque calendrier (en parallèle)
      const promises = calendars.map(async (cal) => {
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
            `timeMin=${encodeURIComponent(startDate)}&` +
            `timeMax=${encodeURIComponent(endDate)}&` +
            `singleEvents=true&` +
            `orderBy=startTime`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            },
          );

          if (!response.ok) return [];

          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            const events = data.items.map((event: any) => ({
              ...event,
              calendarSummary: cal.summary || (cal.primary ? "Principal" : "Autre"),
              calendarId: cal.id,
            }));
            return events;
          }
          return [];
        } catch (error) {
          // Ignorer les erreurs pour un calendrier spécifique (ex: pas les droits)
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach((events) => allEvents.push(...events));

      return allEvents;
    } catch (error) {
      logger.error("Erreur récupération événements globaux", "calendar", error);
      return [];
    }
  }

  /**
   * Vérifier les créneaux occupés/libres sur TOUS les calendriers
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
      throw authError;
    }

    try {
      // 1. Récupérer tous les calendriers
      const calendars = await this.getCalendars();
      const calendarItems = calendars.map((c) => ({ id: c.id }));

      logger.info(`Vérification disponibilités sur ${calendarItems.length} calendriers`, "calendar");

      // 2. Demander le freeBusy pour tous
      const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: startDate,
          timeMax: endDate,
          items: calendarItems,
        }),
      });

      if (!response.ok) {
        throw ErrorFactory.api(
          `Erreur API FreeBusy: ${response.status}`,
          "Erreur lors de la vérification des créneaux occupés",
        );
      }

      const data: FreeBusyResponse = await response.json();

      // 3. Agréger tous les créneaux occupés de tous les calendriers
      const allBusySlots: Array<{ start: string; end: string }> = [];

      Object.values(data.calendars).forEach((cal) => {
        if (cal.busy && Array.isArray(cal.busy)) {
          allBusySlots.push(...cal.busy);
        }
      });

      return allBusySlots;
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "GoogleCalendarService",
          operation: "getFreeBusy",
        },
        "Erreur lors de la récupération des créneaux occupés",
      );
      logError(processedError, { component: "GoogleCalendarService" });
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
    const result: Record<
      string,
      {
        busy: Array<{ start: string; end: string }>;
        suggested: Array<{ start: string; end: string }>;
      }
    > = {};

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
   * Créer un événement dans le calendrier principal
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }): Promise<GoogleCalendarEvent> {
    await this.refreshTokenIfNeeded();

    if (!this.accessToken) {
      const authError = ErrorFactory.auth(
        "Pas de token Google Calendar disponible",
        "Connexion Google Calendar requise",
      );

      logError(authError, {
        component: "GoogleCalendarService",
        operation: "createEvent",
      });

      throw authError;
    }

    try {
      const timeZone = event.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const eventPayload = {
        summary: event.summary,
        description: event.description || "",
        start: {
          dateTime: event.start.dateTime,
          timeZone: timeZone,
        },
        end: {
          dateTime: event.end.dateTime,
          timeZone: timeZone,
        },
        ...(event.attendees && event.attendees.length > 0 ? { attendees: event.attendees } : {}),
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError = ErrorFactory.api(
          `Erreur API Google Calendar: ${response.status}`,
          "Erreur lors de la création de l'événement",
          { status: response.status, details: errorData },
        );

        logError(apiError, {
          component: "GoogleCalendarService",
          operation: "createEvent",
          status: response.status,
        });

        throw apiError;
      }

      const data = await response.json();
      logger.info("Événement créé dans Google Calendar", "calendar", {
        eventId: data.id,
        summary: data.summary,
      });
      return data;
    } catch (error) {
      const processedError = handleError(
        error,
        {
          component: "GoogleCalendarService",
          operation: "createEvent",
        },
        "Erreur lors de la création de l'événement",
      );

      logError(processedError, {
        component: "GoogleCalendarService",
        operation: "createEvent",
      });

      throw processedError;
    }
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
