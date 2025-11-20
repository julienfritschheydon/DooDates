/**
 * Calendar Conflict Detection utilities
 * Functions for detecting conflicts between poll dates and calendar events
 */

/**
 * Interface for calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
}

/**
 * Check if a date range conflicts with any calendar events
 */
export function checkCalendarConflicts(
  pollDates: string[],
  calendarEvents: CalendarEvent[]
): Array<{
  date: string;
  conflicts: CalendarEvent[];
}> {
  const conflicts: Array<{
    date: string;
    conflicts: CalendarEvent[];
  }> = [];

  for (const dateStr of pollDates) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const pollDate = new Date(year, month - 1, day);
    const pollDateEnd = new Date(year, month - 1, day + 1);

    const dateConflicts = calendarEvents.filter(event =>
      event.start < pollDateEnd && event.end > pollDate
    );

    if (dateConflicts.length > 0) {
      conflicts.push({
        date: dateStr,
        conflicts: dateConflicts
      });
    }
  }

  return conflicts;
}

/**
 * Format conflicts for display
 */
export function formatConflicts(conflicts: Array<{
  date: string;
  conflicts: CalendarEvent[];
}>): string {
  if (conflicts.length === 0) {
    return '';
  }

  return conflicts.map(({ date, conflicts: dateConflicts }) => {
    const [year, month, day] = date.split('-').map(Number);
    const formattedDate = new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const conflictList = dateConflicts.map(event =>
      `• ${event.title} (${event.start.toLocaleTimeString('fr-FR')} - ${event.end.toLocaleTimeString('fr-FR')})`
    ).join('\n');

    return `${formattedDate} :\n${conflictList}`;
  }).join('\n\n');
}
