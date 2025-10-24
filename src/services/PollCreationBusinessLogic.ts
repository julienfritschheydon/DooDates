/**
 * Service de logique métier pour la création de sondages
 * Extrait du composant PollCreator.tsx pour séparer les préoccupations
 */

import { logError, ErrorFactory } from "../lib/error-handling";
import { formatDateLocal } from "../lib/date-utils";

export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
  duration?: number; // Durée en minutes
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

export class PollCreationBusinessLogic {
  /**
   * Initialise l'état par défaut pour la création d'un sondage
   */
  static getInitialState(): PollCreationState {
    return {
      selectedDates: [],
      currentMonth: new Date(),
      calendarConnected: false,
      pollTitle: "",
      participantEmails: "",
      showTimeSlots: false,
      timeSlots: [],
      notificationsEnabled: false,
      userEmail: "",
      showCalendarConnect: false,
      showShare: false,
      showDescription: false,
      emailErrors: [],
      showExtendedHours: false,
      timeGranularity: 30,
      showGranularitySettings: false,
      showCalendarConnection: false,
      pollLinkCopied: false,
      expirationDays: 30,
      showExpirationSettings: false,
    };
  }

  /**
   * Charge les données d'un sondage existant depuis localStorage
   */
  static async loadPollData(
    editPollId: string,
  ): Promise<PollCreationState | null> {
    try {
      const existingPolls = JSON.parse(
        localStorage.getItem("dev-polls") || "[]",
      );
      const pollToEdit = existingPolls.find(
        (poll: any) => poll.id === editPollId,
      );

      if (!pollToEdit) {
        logError(
          ErrorFactory.validation(
            "Poll not found for editing",
            "Sondage à éditer non trouvé",
          ),
          {
            component: "PollCreationBusinessLogic",
            operation: "loadPollData",
            metadata: { editPollId },
          },
        );
        return null;
      }

      // Extraire les dates depuis les options du sondage
      const pollDates = this.extractDatesFromPoll(pollToEdit);

      return {
        ...this.getInitialState(),
        pollTitle: pollToEdit.title || "",
        selectedDates: pollDates,
        currentMonth: pollDates[0] ? new Date(pollDates[0]) : new Date(),
        showTimeSlots: pollToEdit.settings?.showTimeSlots || false,
        participantEmails: pollToEdit.settings?.participantEmails || "",
        timeGranularity: pollToEdit.settings?.timeGranularity || 30,
        expirationDays: pollToEdit.settings?.expirationDays || 30,
      };
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error loading poll data",
          "Erreur lors du chargement des données du sondage",
        ),
        {
          component: "PollCreationBusinessLogic",
          operation: "loadPollData",
          metadata: { editPollId, error },
        },
      );
      return null;
    }
  }

  /**
   * Extrait les dates d'un sondage avec plusieurs méthodes de fallback
   */
  private static extractDatesFromPoll(pollData: PollEditData): string[] {
    const pollDates: string[] = [];

    // Méthode 1: Depuis settings.selectedDates
    if (pollData.settings?.selectedDates?.length) {
      pollDates.push(...pollData.settings.selectedDates);
    }

    // Méthode 2: Depuis les options du sondage
    if (pollDates.length === 0 && pollData.options) {
      pollData.options.forEach((option) => {
        if (option.option_date && !pollDates.includes(option.option_date)) {
          pollDates.push(option.option_date);
        }
      });
    }

    // Méthode 3: Fallback - générer des dates par défaut
    if (pollDates.length === 0) {
      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i + 1);
        pollDates.push(formatDateLocal(futureDate));
      }
    }

    return pollDates;
  }

  /**
   * Génère les créneaux horaires par défaut
   */
  static generateDefaultTimeSlots(): TimeSlot[] {
    const defaultSlots: TimeSlot[] = [];

    // Créneaux standard de 9h à 18h
    for (let hour = 9; hour <= 17; hour++) {
      defaultSlots.push({
        hour,
        minute: 0,
        enabled: false,
      });
      defaultSlots.push({
        hour,
        minute: 30,
        enabled: false,
      });
    }

    return defaultSlots;
  }

  /**
   * Génère les créneaux horaires étendus
   */
  static generateExtendedTimeSlots(): TimeSlot[] {
    const extendedSlots: TimeSlot[] = [];

    // Créneaux étendus de 8h à 20h
    for (let hour = 8; hour <= 19; hour++) {
      extendedSlots.push({
        hour,
        minute: 0,
        enabled: false,
      });
      extendedSlots.push({
        hour,
        minute: 30,
        enabled: false,
      });
    }

    return extendedSlots;
  }

  /**
   * Valide les emails des participants
   */
  static validateParticipantEmails(emailsString: string): {
    validEmails: string[];
    errors: string[];
    isValid: boolean;
  } {
    if (!emailsString.trim()) {
      return { validEmails: [], errors: [], isValid: true };
    }

    const emails = emailsString
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    const validEmails: string[] = [];
    const errors: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emails.forEach((email, index) => {
      if (emailRegex.test(email)) {
        validEmails.push(email);
      } else {
        errors.push(`Email ${index + 1} invalide: ${email}`);
      }
    });

    return {
      validEmails,
      errors,
      isValid: errors.length === 0,
    };
  }

  /**
   * Valide si le sondage peut être finalisé
   */
  static canFinalize(state: PollCreationState): boolean {
    const hasTitle = state.pollTitle.trim().length > 0;
    const hasDates = state.selectedDates.length > 0;
    const emailValidation = this.validateParticipantEmails(
      state.participantEmails,
    );

    return hasTitle && hasDates && emailValidation.isValid;
  }

  /**
   * Sauvegarde automatique dans localStorage (draft)
   */
  static saveDraft(state: PollCreationState): void {
    try {
      // Ne sauvegarder que si l'état a du contenu significatif
      if (state.pollTitle.trim() || state.selectedDates.length > 0) {
        const draftData = {
          pollTitle: state.pollTitle,
          selectedDates: state.selectedDates,
          participantEmails: state.participantEmails,
          showTimeSlots: state.showTimeSlots,
          timeGranularity: state.timeGranularity,
          expirationDays: state.expirationDays,
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem("doodates-draft", JSON.stringify(draftData));
      }
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error saving draft",
          "Erreur lors de la sauvegarde automatique",
        ),
        {
          component: "PollCreationBusinessLogic",
          operation: "saveDraft",
          metadata: { error },
        },
      );
    }
  }

  /**
   * Charge un brouillon depuis localStorage
   */
  static loadDraft(): Partial<PollCreationState> | null {
    try {
      const draftData = localStorage.getItem("doodates-draft");
      if (!draftData) return null;

      const parsed = JSON.parse(draftData);

      // Vérifier que le brouillon n'est pas trop ancien (plus de 24h)
      const savedAt = new Date(parsed.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        localStorage.removeItem("doodates-draft");
        return null;
      }

      return {
        pollTitle: parsed.pollTitle || "",
        selectedDates: parsed.selectedDates || [],
        participantEmails: parsed.participantEmails || "",
        showTimeSlots: parsed.showTimeSlots || false,
        timeGranularity: parsed.timeGranularity || 30,
        expirationDays: parsed.expirationDays || 30,
      };
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error loading draft",
          "Erreur lors du chargement du brouillon",
        ),
        {
          component: "PollCreationBusinessLogic",
          operation: "loadDraft",
          metadata: { error },
        },
      );
      return null;
    }
  }

  /**
   * Nettoie les brouillons et données temporaires
   */
  static cleanup(): void {
    try {
      localStorage.removeItem("doodates-draft");
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error cleaning up draft data",
          "Erreur lors du nettoyage",
        ),
        {
          component: "PollCreationBusinessLogic",
          operation: "cleanup",
          metadata: { error },
        },
      );
    }
  }
}
