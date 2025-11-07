interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}
export declare const generateTimeSlots: (
  showExtendedHours: boolean,
  timeGranularity: number,
) => {
  hour: number;
  minute: number;
  label: string;
}[];
export declare const getVisibleTimeSlots: (
  showExtendedHours: boolean,
  timeGranularity: number,
  timeSlotsByDate: Record<string, TimeSlot[]>,
) => any;
export declare const getTimeSlotBlocks: (
  dateStr: string,
  timeSlotsByDate: Record<string, TimeSlot[]>,
  timeGranularity: number,
) => {
  start: {
    hour: number;
    minute: number;
  };
  end: {
    hour: number;
    minute: number;
  };
}[];
export declare const toggleTimeSlotForDate: (
  dateStr: string,
  hour: number,
  minute: number,
  timeSlotsByDate: Record<string, TimeSlot[]>,
) => Record<string, TimeSlot[]>;
export declare const formatSelectedDateHeader: (dateStr: string) => {
  dayName: string;
  dayNumber: number;
  month: string;
};
export declare const isGranularityCompatible: (
  newGranularity: number,
  selectedDates: string[],
  timeSlotsByDate: Record<string, TimeSlot[]>,
  currentGranularity: number,
) => boolean;
export {};
