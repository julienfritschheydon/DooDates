interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}

export const generateTimeSlots = (
  showExtendedHours: boolean,
  timeGranularity: number,
): { hour: number; minute: number; label: string }[] => {
  const slots: { hour: number; minute: number; label: string }[] = [];
  const startHour = showExtendedHours ? 6 : 8;
  const endHour = showExtendedHours ? 23 : 20;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += timeGranularity) {
      if (hour === endHour && minute > 0) break;

      const label = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push({ hour, minute, label });
    }
  }

  return slots;
};

export const getVisibleTimeSlots = (
  showExtendedHours: boolean,
  timeGranularity: number,
  timeSlotsByDate: Record<string, TimeSlot[]>,
) => {
  const allSlots = generateTimeSlots(showExtendedHours, timeGranularity);

  if (showExtendedHours) {
    return allSlots;
  } else {
    // Détecter la plage d'horaires pré-sélectionnés - optimisé
    const enabledHours = new Set<number>();

    Object.values(timeSlotsByDate).forEach((slots) => {
      slots
        .filter((slot) => slot.enabled)
        .forEach((slot) => {
          enabledHours.add(slot.hour);
        });
    });

    let result;
    if (enabledHours.size > 0) {
      // Si des créneaux sont pré-sélectionnés, afficher une plage autour d'eux
      const minHour = Math.max(Math.min(...enabledHours) - 1, 0);
      const maxHour = Math.min(Math.max(...enabledHours) + 2, 23);
      result = allSlots.filter((slot) => slot.hour >= minHour && slot.hour <= maxHour);
    } else {
      // Plage par défaut réduite si aucun créneau pré-sélectionné
      result = allSlots.filter((slot) => slot.hour >= 8 && slot.hour <= 20);
    }

    return result;
  }
};

export const getTimeSlotBlocks = (
  dateStr: string,
  timeSlotsByDate: Record<string, TimeSlot[]>,
  timeGranularity: number,
): {
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
}[] => {
  const slots = timeSlotsByDate[dateStr] || [];
  const enabledSlots = slots
    .filter((slot) => slot.enabled)
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  const blocks: {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  }[] = [];

  let currentBlock = null;

  enabledSlots.forEach((slot) => {
    const slotMinutes = slot.hour * 60 + slot.minute;

    if (!currentBlock) {
      currentBlock = { start: slot, end: slot };
    } else {
      const blockEndMinutes = currentBlock.end.hour * 60 + currentBlock.end.minute;

      if (slotMinutes === blockEndMinutes + timeGranularity) {
        currentBlock.end = slot;
      } else {
        blocks.push(currentBlock);
        currentBlock = { start: slot, end: slot };
      }
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
};

export const toggleTimeSlotForDate = (
  dateStr: string,
  hour: number,
  minute: number,
  timeSlotsByDate: Record<string, TimeSlot[]>,
): Record<string, TimeSlot[]> => {
  const currentSlots = timeSlotsByDate[dateStr] || [];
  const existingSlot = currentSlots.find((s) => s.hour === hour && s.minute === minute);

  let newSlots;
  if (existingSlot) {
    newSlots = currentSlots.map((slot) =>
      slot.hour === hour && slot.minute === minute ? { ...slot, enabled: !slot.enabled } : slot,
    );
  } else {
    newSlots = [...currentSlots, { hour, minute, enabled: true }];
  }

  const result = {
    ...timeSlotsByDate,
    [dateStr]: newSlots,
  };

  return result;
};

export const formatSelectedDateHeader = (dateStr: string) => {
  // Parser la date en mode local pour éviter les décalages timezone
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

  const result = {
    dayName: date.toLocaleDateString("fr-FR", { weekday: "short" }).toLowerCase(),
    dayNumber: date.getDate(),
    month: date.toLocaleDateString("fr-FR", { month: "short" }).toLowerCase(),
  };

  return result;
};

export const isGranularityCompatible = (
  newGranularity: number,
  selectedDates: string[],
  timeSlotsByDate: Record<string, TimeSlot[]>,
  currentGranularity: number,
): boolean => {
  if (newGranularity > currentGranularity) {
    for (const dateStr of selectedDates) {
      const slots = timeSlotsByDate[dateStr] || [];
      const enabledSlots = slots
        .filter((slot) => slot.enabled)
        .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

      for (const slot of enabledSlots) {
        const slotMinutes = slot.hour * 60 + slot.minute;
        if (slotMinutes % newGranularity !== 0) {
          return false;
        }
      }
    }
  }

  return true;
};
