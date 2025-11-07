export interface CalendarDay {
    date: string;
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
    dayName: string;
    monthName: string;
    isWeekend: boolean;
    isHoliday?: boolean;
    weekNumber: number;
    quarterNumber: number;
}
export interface PreGeneratedCalendar {
    startYear: number;
    endYear: number;
    totalDays: number;
    days: CalendarDay[];
    byYear: Record<number, CalendarDay[]>;
    byMonth: Record<string, CalendarDay[]>;
    byDayOfWeek: Record<number, CalendarDay[]>;
    weekends: CalendarDay[];
    weekdays: CalendarDay[];
}
export declare function getPreGeneratedCalendar(): PreGeneratedCalendar;
export declare function getPreGeneratedCalendarSync(): PreGeneratedCalendar;
export declare function initializeGlobalCalendarCache(calendar: PreGeneratedCalendar): void;
export declare function getYearCalendar(year: number): CalendarDay[];
export declare class CalendarQuery {
    private baseCalendar;
    constructor();
    private getDaysInRange;
    private getYearDays;
    getMondaysInRange(startDate: string, endDate: string): CalendarDay[];
    getWeekendsInRange(startDate: string, endDate: string): CalendarDay[];
    getWeekdaysInRange(startDate: string, endDate: string): CalendarDay[];
    getNextNDaysOfWeek(dayOfWeek: number, count: number, fromDate: string): CalendarDay[];
    getDaysInMonth(year: number, month: number): CalendarDay[];
    getDaysOfWeekInRange(dayOfWeek: number, startDate: string, endDate: string): CalendarDay[];
    getWeekendsInMonths(startMonth: string, endMonth: string): CalendarDay[];
    getStats(): {
        totalDays: number;
        weekends: number;
        weekdays: number;
        years: number;
    };
}
export declare function clearCalendarCache(): void;
export default CalendarQuery;
