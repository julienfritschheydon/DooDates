/**
 * PollCreatorService - Business logic for poll creation
 * Extracted from PollCreator component to improve separation of concerns
 */

import type { PollData } from '../hooks/usePolls';
import { handleError, ErrorFactory, logError } from '../lib/error-handling';

export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
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

export class PollCreatorService {
  /**
   * Check if poll can be finalized
   */
  static canFinalize(state: PollCreationState): boolean {
    return state.selectedDates.length > 0 && 
           state.pollTitle.trim().length > 0 &&
           state.emailErrors.length === 0;
  }

  /**
   * Handle poll finalization
   */
  static async handleFinalize(
    state: PollCreationState,
    createPoll: (pollData: PollData) => Promise<string>,
    onPollCreated?: (slug: string) => void
  ): Promise<void> {
    if (!this.canFinalize(state)) {
      throw ErrorFactory.validation(
        'Poll cannot be finalized - missing required fields',
        'Veuillez remplir tous les champs requis pour finaliser le sondage.'
      );
    }

    const pollData: PollData = {
      title: state.pollTitle,
      description: null,
      selectedDates: state.selectedDates,
      timeSlotsByDate: state.showTimeSlots ? 
        state.selectedDates.reduce((acc, date) => {
          acc[date] = state.timeSlots;
          return acc;
        }, {} as Record<string, typeof state.timeSlots>) : {},
      participantEmails: state.participantEmails.split(',').map(email => email.trim()).filter(Boolean),
      settings: {
        timeGranularity: state.timeGranularity,
        allowAnonymousVotes: true,
        allowMaybeVotes: true,
        sendNotifications: state.notificationsEnabled,
      }
    };

    try {
      const slug = await createPoll(pollData);
      onPollCreated?.(slug);
    } catch (error) {
      throw handleError(error, {
        component: 'PollCreatorService',
        operation: 'handleFinalize'
      }, 'Erreur lors de la création du sondage');
    }
  }

  /**
   * Toggle date selection
   */
  static toggleDate(
    dateString: string,
    selectedDates: string[],
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void
  ): void {
    setState(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(dateString)
        ? prev.selectedDates.filter(d => d !== dateString)
        : [...prev.selectedDates, dateString]
    }));
  }

  /**
   * Analyze calendar availability (placeholder)
   */
  static async analyzeCalendarAvailability(dates: string[]): Promise<any[]> {
    try {
      // Placeholder for calendar integration
      logError(new Error('Calendar integration not implemented'), {
        component: 'PollCreatorService',
        operation: 'analyzeCalendarAvailability'
      });
      return [];
    } catch (error) {
      throw handleError(error, {
        component: 'PollCreatorService',
        operation: 'analyzeCalendarAvailability'
      }, 'Erreur lors de l\'analyse du calendrier');
    }
  }

  /**
   * Check if granularity is compatible with selected time slots
   */
  static isGranularityCompatible(granularity: number, timeSlots: TimeSlot[]): boolean {
    return timeSlots.every(slot => (slot.minute % granularity) === 0);
  }

  /**
   * Handle granularity change
   */
  static handleGranularityChange(
    newGranularity: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void
  ): void {
    setState(prev => ({
      ...prev,
      timeGranularity: newGranularity,
      showGranularitySettings: false
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
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void
  ): void {
    setState(prev => ({
      ...prev,
      timeGranularity: this.initialGranularityState,
      showGranularitySettings: false
    }));
  }

  /**
   * Format selected date header
   */
  static formatSelectedDateHeader(dateString: string): {
    dayName: string;
    dayNumber: string;
    month: string;
    fullFormat: string;
  } {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayNumber = date.getDate().toString();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const fullFormat = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return { dayName, dayNumber, month, fullFormat };
  }

  /**
   * Get visible time slots for a date
   */
  static getVisibleTimeSlots(
    dateString: string,
    timeSlots: TimeSlot[],
    showExtendedHours: boolean
  ): TimeSlot[] {
    const startHour = showExtendedHours ? 6 : 8;
    const endHour = showExtendedHours ? 23 : 20;
    
    return timeSlots.filter(slot => 
      slot.hour >= startHour && slot.hour <= endHour
    );
  }

  /**
   * Get time slot blocks for display
   */
  static getTimeSlotBlocks(timeSlots: TimeSlot[], granularity: number): any[] {
    const blocks = [];
    let currentBlock = null;
    
    for (const slot of timeSlots) {
      if (slot.enabled) {
        if (!currentBlock) {
          currentBlock = { start: slot, end: slot };
        } else {
          currentBlock.end = slot;
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
   * Toggle time slot for a specific date
   */
  static toggleTimeSlotForDate(
    dateString: string,
    hour: number,
    minute: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void
  ): void {
    setState(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.hour === hour && slot.minute === minute
          ? { ...slot, enabled: !slot.enabled }
          : slot
      )
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
          enabled: false
        });
      }
    }
    
    return slots;
  }

  /**
   * Validate email addresses
   */
  static validateEmails(emailString: string): string[] {
    const emails = emailString.split(',').map(email => email.trim()).filter(Boolean);
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    emails.forEach(email => {
      if (!emailRegex.test(email)) {
        errors.push(`Email invalide: ${email}`);
      }
    });
    
    return errors;
  }

  /**
   * Initialize state with Gemini data
   */
  static initializeWithGeminiData(initialData?: any): PollCreationState {
    const baseState: PollCreationState = {
      selectedDates: [],
      currentMonth: new Date(),
      calendarConnected: false,
      pollTitle: '',
      participantEmails: '',
      showTimeSlots: false,
      timeSlots: this.initializeTimeSlots(),
      notificationsEnabled: true,
      userEmail: '',
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
      showExpirationSettings: false
    };

    if (initialData) {
      return {
        ...baseState,
        pollTitle: initialData.title || '',
        selectedDates: initialData.dates || [],
        participantEmails: initialData.participants?.join(', ') || '',
        showTimeSlots: !!initialData.timeSlots,
      };
    }

    return baseState;
  }
}
