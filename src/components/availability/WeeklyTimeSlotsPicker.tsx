import React, { useState, useMemo } from "react";
import { Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
  duration?: number;
}

export interface WeeklyTimeSlots {
  [day: string]: TimeSlot[]; // day: "monday", "tuesday", etc.
}

interface WeeklyTimeSlotsPickerProps {
  value: WeeklyTimeSlots;
  onChange: (slots: WeeklyTimeSlots) => void;
  timeGranularity?: number; // Granularité en minutes (15, 30, 60)
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" },
];

export function WeeklyTimeSlotsPicker({
  value,
  onChange,
  timeGranularity = 30,
}: WeeklyTimeSlotsPickerProps) {
  // Ouvrir tous les jours par défaut si aucun créneau n'est configuré
  const hasAnySlots = Object.values(value).some((slots) => slots.some((s) => s.enabled));
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    // Si aucun créneau configuré, ouvrir tous les jours pour faciliter la configuration
    if (!hasAnySlots) {
      return new Set(DAYS_OF_WEEK.map((d) => d.value));
    }
    return new Set();
  });

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const getVisibleTimeSlots = () => {
    const slots: Array<{ hour: number; minute: number; label: string }> = [];
    const startHour = 8;
    const endHour = 20;

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
      // Slot n'existe pas → Créer nouveau slot
      const newSlot: TimeSlot = {
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
  };

  const getTimeSlotBlocks = (day: string) => {
    const slots = value[day] || [];
    const enabledSlots = slots
      .filter((s) => s.enabled)
      .sort((a, b) => {
        const aMinutes = a.hour * 60 + a.minute;
        const bMinutes = b.hour * 60 + b.minute;
        return aMinutes - bMinutes;
      });

    if (enabledSlots.length === 0) return [];

    const blocks: Array<{
      start: { hour: number; minute: number };
      end: { hour: number; minute: number };
    }> = [];
    let currentBlock: {
      start: { hour: number; minute: number };
      end: { hour: number; minute: number };
    } | null = null;

    for (const slot of enabledSlots) {
      const slotMinutes = slot.hour * 60 + slot.minute;
      const slotEndMinutes = slotMinutes + (slot.duration || timeGranularity);

      if (!currentBlock) {
        currentBlock = {
          start: { hour: slot.hour, minute: slot.minute },
          end: {
            hour: Math.floor(slotEndMinutes / 60),
            minute: slotEndMinutes % 60,
          },
        };
      } else {
        const currentEndMinutes = currentBlock.end.hour * 60 + currentBlock.end.minute;
        if (slotMinutes <= currentEndMinutes + timeGranularity) {
          // Slot adjacent ou chevauchant → Étendre le bloc
          currentBlock.end = {
            hour: Math.floor(slotEndMinutes / 60),
            minute: slotEndMinutes % 60,
          };
        } else {
          // Nouveau bloc
          blocks.push(currentBlock);
          currentBlock = {
            start: { hour: slot.hour, minute: slot.minute },
            end: {
              hour: Math.floor(slotEndMinutes / 60),
              minute: slotEndMinutes % 60,
            },
          };
        }
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  };

  const visibleTimeSlots = getVisibleTimeSlots();

  return (
    <div className="space-y-4">
      {DAYS_OF_WEEK.map((day) => {
        const daySlots = value[day.value] || [];
        const enabledCount = daySlots.filter((s) => s.enabled).length;
        const blocks = getTimeSlotBlocks(day.value);
        const isExpanded = expandedDays.has(day.value);

        return (
          <Card key={day.value} className="bg-[#1e1e1e] border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <CardTitle className="text-base text-white">{day.label}</CardTitle>
                  {enabledCount > 0 && (
                    <span className="text-xs text-gray-400">
                      ({enabledCount} créneau{enabledCount > 1 ? "x" : ""})
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  {isExpanded ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0">
                {blocks.length > 0 && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-600/30 rounded-lg">
                    <div className="text-sm text-green-300 font-medium mb-2">
                      Plages horaires configurées :
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {blocks.map((block, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs font-mono"
                        >
                          {`${block.start.hour.toString().padStart(2, "0")}:${block.start.minute.toString().padStart(2, "0")} - ${block.end.hour.toString().padStart(2, "0")}:${block.end.minute.toString().padStart(2, "0")}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border border-gray-700 rounded-lg bg-[#0a0a0a] overflow-hidden">
                  <div className="max-h-64 overflow-y-auto p-2">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                      {visibleTimeSlots.map((timeSlot) => {
                        const slot = daySlots.find(
                          (s) => s.hour === timeSlot.hour && s.minute === timeSlot.minute,
                        );
                        const isEnabled = slot?.enabled || false;
                        const blocks = getTimeSlotBlocks(day.value);
                        const currentBlock = blocks.find(
                          (block) =>
                            timeSlot.hour * 60 + timeSlot.minute >=
                              block.start.hour * 60 + block.start.minute &&
                            timeSlot.hour * 60 + timeSlot.minute <
                              block.end.hour * 60 + block.end.minute,
                        );

                        return (
                          <button
                            key={`${timeSlot.hour}-${timeSlot.minute}`}
                            type="button"
                            onClick={() =>
                              handleTimeSlotToggle(day.value, timeSlot.hour, timeSlot.minute)
                            }
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              isEnabled
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-[#1e1e1e] text-gray-400 hover:bg-[#2a2a2a] border border-gray-700"
                            }`}
                            title={timeSlot.label}
                          >
                            {timeSlot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {blocks.length === 0 && (
                  <p className="text-xs text-gray-500 italic mt-2 text-center">
                    Aucun créneau sélectionné pour ce jour
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
