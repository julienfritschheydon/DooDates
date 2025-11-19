/**
 * Service de logique métier pour la création de sondages
 * Extrait du composant PollCreator.tsx pour séparer les préoccupations
 */
export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
  duration?: number;
}
export interface PollCreationState {
  selectedDates: string[];
  currentMonth: Date;
  calendarConnected: boolean;
  pollTitle: string;
  participantEmails: string;
  showTimeSlots: boolean;
  timeSlots: TimeSlot[];
  notificationsEnabled: boolean;
  userEmail: string;
  showCalendarConnect: boolean;
  showShare: boolean;
  showDescription: boolean;
  emailErrors: string[];
  showExtendedHours: boolean;
  timeGranularity: number;
  showGranularitySettings: boolean;
  showCalendarConnection: boolean;
  pollLinkCopied: boolean;
  expirationDays: number;
  showExpirationSettings: boolean;
  showSettingsPanel: boolean;
}
export interface PollEditData {
  id: string;
  title: string;
  settings?: {
    selectedDates?: string[];
    showTimeSlots?: boolean;
    participantEmails?: string;
    timeGranularity?: number;
    expirationDays?: number;
  };
  options?: Array<{
    option_date?: string;
  }>;
}
export declare class PollCreationBusinessLogic {
  /**
   * Initialise l'état par défaut pour la création d'un sondage
   */
  static getInitialState(): PollCreationState;
  /**
   * Charge les données d'un sondage existant depuis localStorage
   */
  static loadPollData(editPollId: string): Promise<PollCreationState | null>;
  /**
   * Extrait les dates d'un sondage avec plusieurs méthodes de fallback
   */
  private static extractDatesFromPoll;
  /**
   * Génère les créneaux horaires par défaut
   */
  static generateDefaultTimeSlots(): TimeSlot[];
  /**
   * Génère les créneaux horaires étendus
   */
  static generateExtendedTimeSlots(): TimeSlot[];
  /**
   * Valide les emails des participants
   */
  static validateParticipantEmails(emailsString: string): {
    validEmails: string[];
    errors: string[];
    isValid: boolean;
  };
  /**
   * Valide si le sondage peut être finalisé
   */
  static canFinalize(state: PollCreationState): boolean;
  /**
   * Sauvegarde automatique dans localStorage (draft)
   */
  static saveDraft(state: PollCreationState): void;
  /**
   * Charge un brouillon depuis localStorage
   */
  static loadDraft(): Partial<PollCreationState> | null;
  /**
   * Nettoie les brouillons et données temporaires
   */
  static cleanup(): void;
}
