/**
 * PollCreatorService - Business logic for poll creation
 * Extracted from PollCreator component to improve separation of concerns
 */

import type { PollData } from "../hooks/usePolls";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";

export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
  duration?: number; // Durée en minutes
}

export interface DateGroup {
  dates: string[];
  label: string;
  type: "weekend" | "range" | "custom";
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
  dateGroups?: DateGroup[];
}

export class PollCreatorService {
  /**
   * Check if poll can be finalized
   */
  static canFinalize(state: PollCreationState): boolean {
    return (
      state.selectedDates.length > 0 &&
      state.pollTitle.trim().length > 0 &&
      state.emailErrors.length === 0
    );
  }

  /**
   * Handle poll finalization
   */
  static async handleFinalize(
    state: PollCreationState,
    createPoll: (pollData: PollData) => Promise<string>,
    onPollCreated?: (slug: string) => void,
  ): Promise<void> {
    if (!this.canFinalize(state)) {
      throw ErrorFactory.validation(
        "Poll cannot be finalized - missing required fields",
        "Veuillez remplir tous les champs requis pour finaliser le sondage.",
      );
    }

    const pollData: PollData = {
      type: "date",
      title: state.pollTitle,
      description: null,
      selectedDates: state.selectedDates,
      timeSlotsByDate: state.showTimeSlots
        ? state.selectedDates.reduce(
            (acc, date) => {
              acc[date] = state.timeSlots;
              return acc;
            },
            {} as Record<string, typeof state.timeSlots>,
          )
        : {},
      participantEmails: state.participantEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean),
      settings: {
        timeGranularity: state.timeGranularity,
        allowAnonymousVotes: true,
        allowMaybeVotes: true,
        sendNotifications: state.notificationsEnabled,
      },
    };

    try {
      const slug = await createPoll(pollData);
      onPollCreated?.(slug);
    } catch (error) {
      throw handleError(
        error,
        {
          component: "PollCreatorService",
          operation: "handleFinalize",
        },
        "Erreur lors de la création du sondage",
      );
    }
  }

  /**
   * Toggle date selection
   */
  static toggleDate(
    dateString: string,
    selectedDates: string[],
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void {
    setState((prev) => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(dateString)
        ? prev.selectedDates.filter((d) => d !== dateString)
        : [...prev.selectedDates, dateString],
    }));
  }

  /**
   * Check if granularity is compatible with selected time slots
   */
  static isGranularityCompatible(granularity: number, timeSlots: TimeSlot[]): boolean {
    return timeSlots.every((slot) => slot.minute % granularity === 0);
  }

  /**
   * Handle granularity change
   */
  static handleGranularityChange(
    newGranularity: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void {
    setState((prev) => ({
      ...prev,
      timeGranularity: newGranularity,
      showGranularitySettings: false,
    }));
  }

  /**
   * Get initial granularity state
   */
  static get initialGranularityState(): number {
    return 30; // Default 30-minute intervals
  }

  /**
   * Undo granularity change
   */
  static undoGranularityChange(
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void {
    setState((prev) => ({
      ...prev,
      timeGranularity: this.initialGranularityState,
      showGranularitySettings: false,
    }));
  }

  /**
   * Format selected date header
   * Utilise formatDateFull pour le format complet uniforme
   */
  static formatSelectedDateHeader(
    dateString: string,
    isMobile: boolean = false,
  ): {
    dayName: string;
    dayNumber: string;
    month: string;
    fullFormat: string;
  } {
    // Parser la date en mode local pour éviter les décalages timezone
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

    // Format pour mobile/tablet: acronymes des jours
    const dayNameMobile = date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
    // Format desktop: jours complets
    const dayNameDesktop = date.toLocaleDateString("fr-FR", { weekday: "long" });

    const dayName = isMobile ? dayNameMobile : dayNameDesktop;
    const dayNumber = date.getDate().toString();
    const monthShort = date.toLocaleDateString("fr-FR", { month: "short" });
    // Utiliser le format uniforme pour fullFormat
    const fullFormat = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return { dayName, dayNumber, month: monthShort, fullFormat };
  }

  /**
   * Get visible time slots for a date
   */
  static getVisibleTimeSlots(
    dateString: string,
    timeSlots: TimeSlot[],
    showExtendedHours: boolean,
  ): TimeSlot[] {
    const startHour = showExtendedHours ? 6 : 8;
    const endHour = showExtendedHours ? 23 : 20;

    return timeSlots.filter((slot) => slot.hour >= startHour && slot.hour <= endHour);
  }

  /**
   * Get time slot blocks for display
   */
  static getTimeSlotBlocks(
    timeSlots: TimeSlot[],
    granularity: number,
  ): Array<{
    start: TimeSlot;
    end: { hour: number; minute: number; enabled: boolean };
  }> {
    const blocks = [];
    let currentBlock = null;

    // Trier les slots par heure pour détecter les blocs contigus
    const sortedSlots = [...timeSlots].sort((a, b) => {
      const aMinutes = a.hour * 60 + a.minute;
      const bMinutes = b.hour * 60 + b.minute;
      return aMinutes - bMinutes;
    });

    for (const slot of sortedSlots) {
      if (slot.enabled) {
        if (!currentBlock) {
          // Nouveau bloc - calculer la fin en fonction de la durée
          const duration = slot.duration || granularity;
          const endMinutes = slot.hour * 60 + slot.minute + duration;
          const endHour = Math.floor(endMinutes / 60);
          const endMinute = endMinutes % 60;

          currentBlock = {
            start: slot,
            end: { hour: endHour, minute: endMinute, enabled: true },
          };
        } else {
          // Vérifier si ce slot est contigu au bloc actuel
          const currentEndMinutes = currentBlock.end.hour * 60 + currentBlock.end.minute;
          const slotStartMinutes = slot.hour * 60 + slot.minute;

          if (slotStartMinutes === currentEndMinutes) {
            // Slot contigu - étendre le bloc
            const duration = slot.duration || granularity;
            const endMinutes = slot.hour * 60 + slot.minute + duration;
            const endHour = Math.floor(endMinutes / 60);
            const endMinute = endMinutes % 60;

            currentBlock.end = {
              hour: endHour,
              minute: endMinute,
              enabled: true,
            };
          } else {
            // Slot non contigu - fermer le bloc actuel et en créer un nouveau
            blocks.push(currentBlock);

            const duration = slot.duration || granularity;
            const endMinutes = slot.hour * 60 + slot.minute + duration;
            const endHour = Math.floor(endMinutes / 60);
            const endMinute = endMinutes % 60;

            currentBlock = {
              start: slot,
              end: { hour: endHour, minute: endMinute, enabled: true },
            };
          }
        }
      } else if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Handle time slot toggle for a specific date
   * Returns the new timeSlotsByDate object
   */
  static handleTimeSlotToggle(
    dateStr: string,
    hour: number,
    minute: number,
    timeSlotsByDate: Record<string, TimeSlot[]>,
    granularity: number,
    includeDuration: boolean = true,
  ): Record<string, TimeSlot[]> {
    const currentSlots = timeSlotsByDate[dateStr] || [];
    const clickedMinutes = hour * 60 + minute;

    const existingSlotIndex = currentSlots.findIndex((s) => s.hour === hour && s.minute === minute);

    if (existingSlotIndex >= 0) {
      // Slot existe → Toggle enabled
      const newSlots = [...currentSlots];
      newSlots[existingSlotIndex] = {
        ...newSlots[existingSlotIndex],
        enabled: !newSlots[existingSlotIndex].enabled,
      };

      return {
        ...timeSlotsByDate,
        [dateStr]: newSlots,
      };
    } else {
      // Slot n'existe pas → Vérifier si adjacent à un bloc existant
      const adjacentAfter = currentSlots.find(
        (s) => s.hour * 60 + s.minute === clickedMinutes + granularity && s.enabled,
      );
      const adjacentBefore = currentSlots.find(
        (s) => s.hour * 60 + s.minute === clickedMinutes - granularity && s.enabled,
      );

      const newSlot: TimeSlot = {
        hour,
        minute,
        enabled: true,
      };

      // Ajouter duration si demandé (pour PollCreator)
      if (includeDuration) {
        newSlot.duration = granularity;
      }

      return {
        ...timeSlotsByDate,
        [dateStr]: [...currentSlots, newSlot],
      };
    }
  }

  /**
   * Generate visible time slots for display
   * Returns an array of time slot objects with labels
   */
  static generateVisibleTimeSlots(
    granularity: number,
    showExtendedHours: boolean = false,
  ): Array<{ hour: number; minute: number; label: string }> {
    const slots = [];
    const startHour = 8;
    const endHour = showExtendedHours ? 23 : 20;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += granularity) {
        slots.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        });
      }
    }

    return slots;
  }

  /**
   * Toggle time slot for a specific date
   */
  static toggleTimeSlotForDate(
    dateString: string,
    hour: number,
    minute: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void {
    setState((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot) =>
        slot.hour === hour && slot.minute === minute ? { ...slot, enabled: !slot.enabled } : slot,
      ),
    }));
  }

  /**
   * Initialize default time slots
   */
  static initializeTimeSlots(granularity: number = 30): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += granularity) {
        slots.push({
          hour,
          minute,
          enabled: false,
        });
      }
    }

    return slots;
  }

  /**
   * Validate email addresses
   */
  static validateEmails(emailString: string): string[] {
    const emails = emailString
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emails.forEach((email) => {
      if (!emailRegex.test(email)) {
        errors.push(`Email invalide: ${email}`);
      }
    });

    return errors;
  }

  /**
   * Initialize state with Gemini data
   */
  static initializeWithGeminiData(initialData?: {
    title?: string;
    dates?: string[];
    participants?: string[];
    timeSlots?: unknown;
    dateGroups?: Array<{
      dates: string[];
      label: string;
      type: "weekend" | "range" | "custom";
    }>;
  }): PollCreationState {
    const baseState: PollCreationState = {
      selectedDates: [],
      currentMonth: new Date(),
      calendarConnected: false,
      pollTitle: "",
      participantEmails: "",
      showTimeSlots: false,
      timeSlots: this.initializeTimeSlots(),
      notificationsEnabled: true,
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
      showSettingsPanel: false,
    };

    if (initialData) {
      return {
        ...baseState,
        pollTitle: initialData.title || "",
        selectedDates: initialData.dates || [],
        participantEmails: initialData.participants?.join(", ") || "",
        showTimeSlots: !!initialData.timeSlots,
        dateGroups: initialData.dateGroups,
      };
    }

    return baseState;
  }
}
