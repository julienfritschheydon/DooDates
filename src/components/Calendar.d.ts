import React from "react";
interface CalendarProps {
  visibleMonths: Date[];
  selectedDates: string[];
  onDateToggle: (date: Date) => void;
  onMonthChange: (direction: "prev" | "next") => void;
  onMonthsChange?: (months: Date[]) => void;
}
declare const Calendar: React.FC<CalendarProps>;
export default Calendar;
