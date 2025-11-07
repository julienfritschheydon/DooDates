/**
 * Utility functions for date and time formatting
 */
export declare const formatDate: (dateString: string) => string;
export declare const formatTime: (
  timeSlots: Array<{
    hour?: number;
    minute?: number;
    duration?: number;
    start_hour?: number;
    start_minute?: number;
    end_hour?: number;
    end_minute?: number;
    label?: string;
  }>,
) => string;
