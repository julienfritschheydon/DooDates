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
export declare class GoogleCalendarService {
    private accessToken;
    constructor();
    private initializeToken;
    private refreshTokenIfNeeded;
    /**
     * Récupérer les événements du calendrier principal
     */
    getEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]>;
    /**
     * Vérifier les créneaux occupés/libres
     */
    getFreeBusy(startDate: string, endDate: string): Promise<Array<{
        start: string;
        end: string;
    }>>;
    /**
     * Analyser les disponibilités pour une liste de dates
     */
    analyzeAvailability(dates: string[]): Promise<{
        [date: string]: {
            busy: Array<{
                start: string;
                end: string;
            }>;
            suggested: Array<{
                start: string;
                end: string;
            }>;
        };
    }>;
    /**
     * Suggérer des créneaux libres basés sur les créneaux occupés
     */
    private suggestFreeSlots;
    /**
     * Vérifier si deux créneaux se chevauchent
     */
    private slotsOverlap;
    /**
     * Vérifier si l'utilisateur a autorisé l'accès au calendrier
     */
    hasCalendarAccess(): Promise<boolean>;
}
export declare const googleCalendar: GoogleCalendarService;
export {};
