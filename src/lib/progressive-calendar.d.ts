import type { PreGeneratedCalendar, CalendarDay } from "./calendar-generator";
interface YearCalendarData {
    year: number;
    totalDays: number;
    days: CalendarDay[];
    byMonth: Record<string, CalendarDay[]>;
    byDayOfWeek: Record<number, CalendarDay[]>;
    weekends: CalendarDay[];
    weekdays: CalendarDay[];
    isLeapYear: boolean;
    weekendsCount: number;
    weekdaysCount: number;
}
declare class ProgressiveCalendarManager {
    private loadedYears;
    private loadingPromises;
    private currentYear;
    private preloadThresholdMonths;
    loadYear(year: number): Promise<YearCalendarData>;
    private loadYearData;
    private generateYearFallback;
    checkAndPreloadNext(currentDate: string): void;
    getDateRange(startDate: string, endDate: string): Promise<CalendarDay[]>;
    getMonth(year: number, month: number): Promise<CalendarDay[]>;
    getCacheStats(): {
        loadedYears: number[];
        loadingYears: number[];
        totalLoadedDays: number;
    };
    cleanupCache(): void;
}
declare const progressiveCalendar: ProgressiveCalendarManager;
export { progressiveCalendar, type YearCalendarData };
export declare function getProgressiveCalendar(): Promise<PreGeneratedCalendar>;
