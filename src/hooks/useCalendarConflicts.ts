import { useState, useCallback } from "react";
import { GoogleCalendarService } from "@/lib/google-calendar";
import { ProposedSlot } from "@/services/schedulingOptimizer";
import { logger } from "@/lib/logger";

export const useCalendarConflicts = () => {
  const [conflictingSlots, setConflictingSlots] = useState<ProposedSlot[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkConflicts = useCallback(async (
    datesToCheck: { date: string; start?: string; end?: string }[],
    calendarService: GoogleCalendarService
  ) => {
    setIsChecking(true);
    try {
      if (datesToCheck.length === 0) {
        setConflictingSlots([]);
        return;
      }

      // Sort dates to find range
      const sortedDates = [...datesToCheck].sort((a, b) => a.date.localeCompare(b.date));
      const startDate = new Date(sortedDates[0].date);
      const endDate = new Date(sortedDates[sortedDates.length - 1].date);
      
      // Extend end date to end of day
      endDate.setHours(23, 59, 59, 999);

      const allEvents = await calendarService.getAllEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      logger.info("📅 Checking conflicts", "calendar", { 
        datesToCheck, 
        range: { start: startDate.toISOString(), end: endDate.toISOString() },
        eventsFound: allEvents.length 
      });

      const conflicts: ProposedSlot[] = [];

      for (const check of datesToCheck) {
        const checkStart = new Date(`${check.date}T${check.start || "00:00:00"}`);
        const checkEnd = new Date(`${check.date}T${check.end || "23:59:59"}`);

        for (const event of allEvents) {
            const eventStart = new Date(event.start.dateTime || event.start.date!);
            const eventEnd = new Date(event.end.dateTime || event.end.date!);

            // Chevauchement ?
            if (checkStart < eventEnd && checkEnd > eventStart) {
                logger.debug("💥 Conflict found", "calendar", { 
                    check: { start: checkStart, end: checkEnd },
                    event: { summary: event.summary, start: eventStart, end: eventEnd }
                });
                conflicts.push({
                    date: check.date,
                    start: check.start || "Journée entière",
                    end: check.end || "Journée entière",
                    conflictDetails: {
                        summary: event.summary,
                        start: eventStart.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                        end: eventEnd.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                        location: event.location,
                        calendarSummary: event.calendarSummary
                    },
                    reasons: ["Conflit détecté"]
                });
            }
        }
      }

      setConflictingSlots(conflicts);
    } catch (error) {
      logger.error("Error checking conflicts", "calendar", error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { conflictingSlots, checkConflicts, isChecking };
};
