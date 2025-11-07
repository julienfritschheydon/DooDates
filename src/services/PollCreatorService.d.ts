/**
 * PollCreatorService - Business logic for poll creation
 * Extracted from PollCreator component to improve separation of concerns
 */
import type { PollData } from "../hooks/usePolls";
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
}
export declare class PollCreatorService {
  /**
   * Check if poll can be finalized
   */
  static canFinalize(state: PollCreationState): boolean;
  /**
   * Handle poll finalization
   */
  static handleFinalize(
    state: PollCreationState,
    createPoll: (pollData: PollData) => Promise<string>,
    onPollCreated?: (slug: string) => void,
  ): Promise<void>;
  /**
   * Toggle date selection
   */
  static toggleDate(
    dateString: string,
    selectedDates: string[],
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void;
  /**
   * Analyze calendar availability (placeholder)
   */
  static analyzeCalendarAvailability(dates: string[]): Promise<any[]>;
  /**
   * Check if granularity is compatible with selected time slots
   */
  static isGranularityCompatible(granularity: number, timeSlots: TimeSlot[]): boolean;
  /**
   * Handle granularity change
   */
  static handleGranularityChange(
    newGranularity: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void;
  /**
   * Get initial granularity state
   */
  static get initialGranularityState(): number;
  /**
   * Undo granularity change
   */
  static undoGranularityChange(
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void;
  /**
   * Format selected date header
   */
  static formatSelectedDateHeader(dateString: string): {
    dayName: string;
    dayNumber: string;
    month: string;
    fullFormat: string;
  };
  /**
   * Get visible time slots for a date
   */
  static getVisibleTimeSlots(
    dateString: string,
    timeSlots: TimeSlot[],
    showExtendedHours: boolean,
  ): TimeSlot[];
  /**
   * Get time slot blocks for display
   */
  static getTimeSlotBlocks(
    timeSlots: TimeSlot[],
    granularity: number,
  ): Array<{
    start: TimeSlot;
    end: {
      hour: number;
      minute: number;
      enabled: boolean;
    };
  }>;
  /**
   * Toggle time slot for a specific date
   */
  static toggleTimeSlotForDate(
    dateString: string,
    hour: number,
    minute: number,
    setState: (updater: (prev: PollCreationState) => PollCreationState) => void,
  ): void;
  /**
   * Initialize default time slots
   */
  static initializeTimeSlots(granularity?: number): TimeSlot[];
  /**
   * Validate email addresses
   */
  static validateEmails(emailString: string): string[];
  /**
   * Initialize state with Gemini data
   */
  static initializeWithGeminiData(initialData?: {
    title?: string;
    dates?: string[];
    participants?: string[];
    timeSlots?: unknown;
  }): PollCreationState;
}
