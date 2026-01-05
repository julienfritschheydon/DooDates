import React, { useState, useRef, useEffect } from "react";
import { Clock, Plus, Settings, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PollCreatorService } from "@/services/PollCreatorService";
import type { TimeSlot } from "@/services/PollCreationBusinessLogic";
import { useDragToSelect } from "@/hooks/useDragToSelect";

// Type TimeSlot compatible avec PollCreatorService
interface TimeSlotCompat {
  hour: number;
  minute: number;
  enabled: boolean;
  duration?: number;
}

export interface WeeklyTimeSlots {
  [day: string]: TimeSlotCompat[]; // day: "monday", "tuesday", etc.
}

interface WeeklyTimeSlotsGridProps {
  value: WeeklyTimeSlots;
  onChange: (slots: WeeklyTimeSlots) => void;
  timeGranularity?: number; // Granularité en minutes (15, 30, 60)
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Lundi", short: "Lun" },
  { value: "tuesday", label: "Mardi", short: "Mar" },
  { value: "wednesday", label: "Mercredi", short: "Mer" },
  { value: "thursday", label: "Jeudi", short: "Jeu" },
  { value: "friday", label: "Vendredi", short: "Ven" },
  { value: "saturday", label: "Samedi", short: "Sam" },
  { value: "sunday", label: "Dimanche", short: "Dim" },
];

export function WeeklyTimeSlotsGrid({
  value,
  onChange,
  timeGranularity = 30,
}: WeeklyTimeSlotsGridProps) {
  const [showExtendedHours, setShowExtendedHours] = useState(false);
  const [showGranularitySettings, setShowGranularitySettings] = useState(false);
  const timeGridRefMobile = useRef<HTMLDivElement>(null);
  const timeGridRefDesktop = useRef<HTMLDivElement>(null);
  const targetTimeSlotRefMobile = useRef<HTMLDivElement>(null);
  const targetTimeSlotRefDesktop = useRef<HTMLDivElement>(null);

  // Type pour identifier un slot avec son jour
  interface TimeSlotWithDay {
    day: string;
    hour: number;
    minute: number;
  }

  // Helper: Formater un slot en clé unique
  const formatSlotKey = (slot: TimeSlotWithDay): string => {
    return `${slot.day}:${slot.hour}-${slot.minute}`;
  };

  // Helper: Obtenir tous les slots entre deux slots (même jour uniquement)
  const getSlotsInRange = (start: TimeSlotWithDay, end: TimeSlotWithDay): TimeSlotWithDay[] => {
    if (start.day !== end.day) return [start]; // Pas de drag entre jours différents

    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const [earlierMinutes, laterMinutes] =
      startMinutes <= endMinutes ? [startMinutes, endMinutes] : [endMinutes, startMinutes];

    const slots: TimeSlotWithDay[] = [];
    for (let m = earlierMinutes; m <= laterMinutes; m += timeGranularity) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push({ day: start.day, hour: h, minute: min });
    }

    return slots;
  };

  // Drag-to-extend avec le hook réutilisable
  const { isDragging, handleDragStart, handleDragMove, handleDragEnd, isDraggedOver } =
    useDragToSelect<TimeSlotWithDay>({
      onDragEnd: (draggedItems, startSlot) => {
        if (!startSlot || draggedItems.size === 0) return;

        const day = startSlot.day;
        const currentSlots = value[day] || [];
        const newSlots = [...currentSlots];

        // Activer tous les slots dans le range
        draggedItems.forEach((slotKey) => {
          const parts = slotKey.split(":");
          if (parts.length !== 2) return;
          const [, timeStr] = parts;
          const [hourStr, minuteStr] = timeStr.split("-");
          const hour = parseInt(hourStr);
          const minute = parseInt(minuteStr);

          const existingIndex = newSlots.findIndex((s) => s.hour === hour && s.minute === minute);
          if (existingIndex >= 0) {
            newSlots[existingIndex] = { ...newSlots[existingIndex], enabled: true };
          } else {
            newSlots.push({
              hour,
              minute,
              duration: timeGranularity,
              enabled: true,
            });
          }
        });

        onChange({
          ...value,
          [day]: newSlots,
        });
      },
      getItemKey: formatSlotKey,
      getItemsInRange: getSlotsInRange,
      disableOnMobile: false, // Activer aussi sur mobile pour les créneaux horaires
    });

  const getVisibleTimeSlots = () => {
    const slots: Array<{ hour: number; minute: number; label: string }> = [];
    const startHour = 8;
    const endHour = showExtendedHours ? 23 : 20;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeGranularity) {
        slots.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        });
      }
    }

    return slots;
  };

  const handleTimeSlotToggle = (day: string, hour: number, minute: number) => {
    const currentSlots = value[day] || [];
    const clickedMinutes = hour * 60 + minute;

    const existingSlotIndex = currentSlots.findIndex((s) => s.hour === hour && s.minute === minute);

    if (existingSlotIndex >= 0) {
      // Slot existe → Toggle enabled
      const newSlots = [...currentSlots];
      newSlots[existingSlotIndex] = {
        ...newSlots[existingSlotIndex],
        enabled: !newSlots[existingSlotIndex].enabled,
      };

      onChange({
        ...value,
        [day]: newSlots,
      });
    } else {
      // Slot n'existe pas → Vérifier si adjacent à un bloc existant
      const adjacentAfter = currentSlots.find(
        (s) => s.hour * 60 + s.minute === clickedMinutes + timeGranularity && s.enabled,
      );
      const adjacentBefore = currentSlots.find(
        (s) => s.hour * 60 + s.minute === clickedMinutes - timeGranularity && s.enabled,
      );

      if (adjacentBefore || adjacentAfter) {
        // Adjacent à un bloc → Étendre le bloc
        const newSlot: TimeSlotCompat = {
          hour,
          minute,
          duration: timeGranularity,
          enabled: true,
        };

        onChange({
          ...value,
          [day]: [...currentSlots, newSlot],
        });
      } else {
        // Isolé → Créer nouveau slot
        const newSlot: TimeSlotCompat = {
          hour,
          minute,
          duration: timeGranularity,
          enabled: true,
        };

        onChange({
          ...value,
          [day]: [...currentSlots, newSlot],
        });
      }
    }
  };

  // Les handlers de drag sont maintenant fournis par le hook useDragToSelect

  const getTimeSlotBlocks = (day: string) => {
    const slots = value[day] || [];
    // Convertir TimeSlotCompat vers TimeSlot pour PollCreatorService
    const compatibleSlots: TimeSlot[] = slots.map((s) => ({
      hour: s.hour,
      minute: s.minute,
      enabled: s.enabled,
      duration: s.duration,
    }));
    return PollCreatorService.getTimeSlotBlocks(compatibleSlots, timeGranularity);
  };

  const visibleTimeSlots = getVisibleTimeSlots();

  // Scroll vers 12:00 au montage
  useEffect(() => {
    if (targetTimeSlotRefMobile.current) {
      targetTimeSlotRefMobile.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (targetTimeSlotRefDesktop.current) {
      targetTimeSlotRefDesktop.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Le listener global pointerup est maintenant géré par le hook useDragToSelect

  return (
    <div className="space-y-4" style={{ userSelect: isDragging ? "none" : "auto" }}>
      {/* Paramètres de granularité */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <Label className="text-gray-200 font-semibold">Précision des horaires</Label>
        </div>
        <button
          onClick={() => setShowGranularitySettings(!showGranularitySettings)}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          aria-label={showGranularitySettings ? "Masquer" : "Modifier"}
         data-testid="weeklytimeslotsgrid-button">
          {showGranularitySettings ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </button>
      </div>

      {showGranularitySettings && (
        <div className="mb-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-300">Intervalle entre les créneaux</h4>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 15, label: "15 min" },
              { value: 30, label: "30 min" },
              { value: 60, label: "1 heure" },
              { value: 120, label: "2 heures" },
            ].map((option) => {
              const isCompatible = true; // Simplifié pour MVP
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    // Note: Pour MVP v0.5, on garde la granularité fixe
                    // Dans v1.0, on pourra changer la granularité dynamiquement
                  }}
                  disabled={!isCompatible || option.value !== timeGranularity}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    timeGranularity === option.value
                      ? "bg-blue-500 text-white"
                      : isCompatible
                        ? "bg-[#1e1e1e] border border-gray-700 hover:border-blue-500 text-white"
                        : "bg-[#0a0a0a] border border-gray-800 text-gray-600 cursor-not-allowed"
                  }`}
                 data-testid="weeklytimeslotsgrid-button">
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile: Section horaires avec scroll */}
      <div className="md:hidden">
        <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden">
          {/* En-têtes des jours */}
          <div className="flex bg-[#0a0a0a]">
            <div className="w-16 p-2 text-xs font-medium text-gray-200 flex items-center justify-center border-r border-gray-700">
              Heure
            </div>
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.value}
                className="flex-1 p-2 text-center border-r bg-green-600 text-white"
              >
                <div className="text-xs font-medium">{day.short}</div>
              </div>
            ))}
          </div>

          {/* Créneaux horaires */}
          <div ref={timeGridRefMobile} className="max-h-64 overflow-y-auto">
            {visibleTimeSlots.map((timeSlot) => (
              <div
                key={`${timeSlot.hour}-${timeSlot.minute}`}
                data-time-hour={timeSlot.hour}
                ref={timeSlot.hour === 12 && timeSlot.minute === 0 ? targetTimeSlotRefMobile : null}
                className="flex border-b border-gray-700"
              >
                <div className="w-16 p-2 text-xs text-gray-200 flex items-center justify-center border-r border-gray-700 bg-[#0a0a0a]">
                  {timeSlot.label}
                </div>
                {DAYS_OF_WEEK.map((day, colIndex) => {
                  const slot = value[day.value]?.find(
                    (s) => s.hour === timeSlot.hour && s.minute === timeSlot.minute,
                  );
                  const blocks = getTimeSlotBlocks(day.value);
                  const currentBlock = blocks.find(
                    (block) =>
                      timeSlot.hour * 60 + timeSlot.minute >=
                        block.start.hour * 60 + block.start.minute &&
                      timeSlot.hour * 60 + timeSlot.minute <=
                        block.end.hour * 60 + block.end.minute,
                  );
                  const isBlockStart = blocks.some(
                    (block) =>
                      block.start.hour === timeSlot.hour && block.start.minute === timeSlot.minute,
                  );
                  const isBlockEnd =
                    currentBlock &&
                    ((currentBlock.end.hour === timeSlot.hour &&
                      currentBlock.end.minute === timeSlot.minute) ||
                      (timeSlot.hour * 60 + timeSlot.minute <
                        currentBlock.end.hour * 60 + currentBlock.end.minute &&
                        timeSlot.hour * 60 + timeSlot.minute + timeGranularity >=
                          currentBlock.end.hour * 60 + currentBlock.end.minute));
                  const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;
                  const slotKey = formatSlotKey({
                    day: day.value,
                    hour: timeSlot.hour,
                    minute: timeSlot.minute,
                  });
                  const isSlotDraggedOver = isDraggedOver(slotKey);

                  return (
                    <button
                      key={`${day.value}-${timeSlot.hour}-${timeSlot.minute}`}
                      aria-label={`${day.label} à ${timeSlot.label}`}
                      aria-pressed={slot?.enabled || isSlotDraggedOver}
                      onClick={() =>
                        handleTimeSlotToggle(day.value, timeSlot.hour, timeSlot.minute)
                      }
                      onPointerDown={(e) =>
                        handleDragStart(
                          { day: day.value, hour: timeSlot.hour, minute: timeSlot.minute },
                          e,
                        )
                      }
                      onPointerMove={(e) => {
                        if (isDragging) {
                          handleDragMove(
                            { day: day.value, hour: timeSlot.hour, minute: timeSlot.minute },
                            e,
                          );
                        }
                      }}
                      onPointerUp={handleDragEnd}
                      className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700 ${
                        isSlotDraggedOver
                          ? "bg-green-500/50 border-2 border-green-400"
                          : slot?.enabled
                            ? "bg-green-900/30"
                            : "bg-[#1e1e1e]"
                      } ${timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}`}
                      style={{ touchAction: "none" }}
                     data-testid="weeklytimeslotsgrid-button">
                      {slot?.enabled && (
                        <div
                          className={`absolute bg-green-500 transition-all ${
                            isBlockStart && isBlockEnd ? "inset-1 rounded-lg" : ""
                          } ${isBlockStart && !isBlockEnd ? "inset-x-1 top-1 bottom-0 rounded-t-lg" : ""} ${
                            isBlockEnd && !isBlockStart
                              ? "inset-x-1 bottom-1 top-0 rounded-b-lg"
                              : ""
                          } ${isBlockMiddle ? "inset-x-1 top-0 bottom-0" : ""}`}
                        >
                          {isBlockStart && currentBlock && (
                            <div className="absolute top-0.5 left-0.5 right-0.5">
                              <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                {`${currentBlock.start.hour.toString().padStart(2, "0")}:${currentBlock.start.minute.toString().padStart(2, "0")}`}
                              </div>
                            </div>
                          )}
                          {isBlockEnd && currentBlock && (
                            <div className="absolute bottom-0.5 left-0.5 right-0.5">
                              <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                {`${currentBlock.end.hour.toString().padStart(2, "0")}:${currentBlock.end.minute.toString().padStart(2, "0")}`}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Section horaires avec scroll */}
      <div className="hidden md:block">
        <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden">
          {/* En-têtes des jours */}
          <div className="flex bg-[#0a0a0a]">
            <div className="w-16 p-2 text-xs font-medium text-gray-200 flex items-center justify-center border-r border-gray-700">
              Heure
            </div>
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.value}
                className="flex-1 p-2 text-center border-r bg-green-600 text-white"
              >
                <div className="text-xs font-medium">{day.label}</div>
              </div>
            ))}
          </div>

          {/* Créneaux horaires */}
          <div ref={timeGridRefDesktop} className="max-h-64 overflow-y-auto">
            {visibleTimeSlots.map((timeSlot) => (
              <div
                key={`${timeSlot.hour}-${timeSlot.minute}`}
                data-time-hour={timeSlot.hour}
                ref={
                  timeSlot.hour === 12 && timeSlot.minute === 0 ? targetTimeSlotRefDesktop : null
                }
                className="flex border-b border-gray-700"
              >
                <div className="w-16 p-2 text-xs text-gray-200 flex items-center justify-center border-r border-gray-700 bg-[#0a0a0a]">
                  {timeSlot.label}
                </div>
                {DAYS_OF_WEEK.map((day, colIndex) => {
                  const slot = value[day.value]?.find(
                    (s) => s.hour === timeSlot.hour && s.minute === timeSlot.minute,
                  );
                  const blocks = getTimeSlotBlocks(day.value);
                  const currentBlock = blocks.find(
                    (block) =>
                      timeSlot.hour * 60 + timeSlot.minute >=
                        block.start.hour * 60 + block.start.minute &&
                      timeSlot.hour * 60 + timeSlot.minute <=
                        block.end.hour * 60 + block.end.minute,
                  );
                  const isBlockStart = blocks.some(
                    (block) =>
                      block.start.hour === timeSlot.hour && block.start.minute === timeSlot.minute,
                  );
                  const isBlockEnd =
                    currentBlock &&
                    ((currentBlock.end.hour === timeSlot.hour &&
                      currentBlock.end.minute === timeSlot.minute) ||
                      (timeSlot.hour * 60 + timeSlot.minute <
                        currentBlock.end.hour * 60 + currentBlock.end.minute &&
                        timeSlot.hour * 60 + timeSlot.minute + timeGranularity >=
                          currentBlock.end.hour * 60 + currentBlock.end.minute));
                  const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;
                  const slotKey = formatSlotKey({
                    day: day.value,
                    hour: timeSlot.hour,
                    minute: timeSlot.minute,
                  });
                  const isSlotDraggedOver = isDraggedOver(slotKey);

                  return (
                    <button
                      key={`${day.value}-${timeSlot.hour}-${timeSlot.minute}`}
                      aria-label={`${day.label} à ${timeSlot.label}`}
                      aria-pressed={slot?.enabled || isSlotDraggedOver}
                      onClick={() =>
                        handleTimeSlotToggle(day.value, timeSlot.hour, timeSlot.minute)
                      }
                      onPointerDown={(e) =>
                        handleDragStart(
                          { day: day.value, hour: timeSlot.hour, minute: timeSlot.minute },
                          e,
                        )
                      }
                      onPointerMove={(e) => {
                        if (isDragging) {
                          handleDragMove(
                            { day: day.value, hour: timeSlot.hour, minute: timeSlot.minute },
                            e,
                          );
                        }
                      }}
                      onPointerUp={handleDragEnd}
                      className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700 ${
                        isSlotDraggedOver
                          ? "bg-green-500/50 border-2 border-green-400"
                          : slot?.enabled
                            ? "bg-green-900/30"
                            : "bg-[#1e1e1e]"
                      } ${timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}`}
                      style={{ touchAction: "none" }}
                     data-testid="weeklytimeslotsgrid-button">
                      {slot?.enabled && (
                        <div
                          className={`absolute bg-green-500 transition-all ${
                            isBlockStart && isBlockEnd ? "inset-1 rounded-lg" : ""
                          } ${isBlockStart && !isBlockEnd ? "inset-x-1 top-1 bottom-0 rounded-t-lg" : ""} ${
                            isBlockEnd && !isBlockStart
                              ? "inset-x-1 bottom-1 top-0 rounded-b-lg"
                              : ""
                          } ${isBlockMiddle ? "inset-x-1 top-0 bottom-0" : ""}`}
                        >
                          {isBlockStart && currentBlock && (
                            <div className="absolute top-0.5 left-0.5 right-0.5">
                              <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                {`${currentBlock.start.hour.toString().padStart(2, "0")}:${currentBlock.start.minute.toString().padStart(2, "0")}`}
                              </div>
                            </div>
                          )}
                          {isBlockEnd && currentBlock && (
                            <div className="absolute bottom-0.5 left-0.5 right-0.5">
                              <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                {`${currentBlock.end.hour.toString().padStart(2, "0")}:${currentBlock.end.minute.toString().padStart(2, "0")}`}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton Afficher plus d'horaires */}
      <div className="p-3 bg-[#0a0a0a] border-t border-gray-700 rounded-b-lg">
        <button
          onClick={() => setShowExtendedHours(!showExtendedHours)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
         data-testid="weeklytimeslotsgrid-button">
          <Plus className="w-3 h-3" />
          <span>
            {showExtendedHours ? "Masquer les horaires étendus" : "Afficher plus d'horaires"}
          </span>
        </button>
      </div>
    </div>
  );
}
