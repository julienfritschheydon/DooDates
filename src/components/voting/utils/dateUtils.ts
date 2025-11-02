/**
 * Utility functions for date and time formatting
 */

import { logger } from "@/lib/logger";

// Formater la date de façon ultra-simple (éviter les décalages timezone)
export const formatDate = (dateString: string) => {
  // Parser la date en mode local pour éviter les décalages timezone
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Comparer uniquement les dates sans les heures
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return "Aujourd'hui";
  if (dateOnly.getTime() === tomorrowOnly.getTime()) return "Demain";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

// Formater l'heure de façon simple
export const formatTime = (
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
) => {
  if (!timeSlots?.length) return "Toute la journée";
  const slot = timeSlots[0];

  // Si le format est celui de l'API (start_hour, end_hour)
  if (slot.start_hour !== undefined && slot.end_hour !== undefined) {
    const startHour = slot.start_hour;
    const startMinute = slot.start_minute || 0;
    const endHour = slot.end_hour;
    const endMinute = slot.end_minute || 0;

    const start = `${startHour}h${startMinute ? startMinute.toString().padStart(2, "0") : ""}`;
    const end = `${endHour}h${endMinute ? endMinute.toString().padStart(2, "0") : ""}`;

    return `${start} - ${end}`;
  }

  // Sinon, utiliser l'ancien format (hour, minute, duration)
  if (slot.hour === undefined) {
    logger.warn("formatTime: hour undefined in timeSlot", "vote", { slot });
    return "Horaire non défini";
  }

  const start = `${slot.hour}h${slot.minute ? slot.minute.toString().padStart(2, "0") : ""}`;
  if (slot.duration) {
    const endHour = Math.floor((slot.hour * 60 + (slot.minute || 0) + slot.duration) / 60);
    const endMinute = (slot.hour * 60 + (slot.minute || 0) + slot.duration) % 60;
    const end = `${endHour}h${endMinute ? endMinute.toString().padStart(2, "0") : ""}`;
    return `${start} - ${end}`;
  }
  return start;
};
