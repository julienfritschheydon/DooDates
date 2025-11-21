import React, { useState, useCallback, useMemo } from "react";
import { X, Clock, Settings, Check } from "lucide-react";
import Calendar from "../Calendar";
import type { Question } from "./QuestionCard";
import { formatDateLocal } from "../../lib/date-utils";
import { PollCreatorService } from "../../services/PollCreatorService";
import type { TimeSlot } from "../../services/PollCreatorService";
import { useDragToSelect } from "../../hooks/useDragToSelect";

interface DateQuestionEditorProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
  onClose?: () => void;
}

export default function DateQuestionEditor({
  question,
  onChange,
  onClose,
}: DateQuestionEditorProps) {
  // Initialiser avec 2 mois visibles (mois actuel + mois suivant)
  const [visibleMonths, setVisibleMonths] = useState<Date[]>(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return [currentMonth, nextMonth];
  });

  const selectedDates = useMemo(() => question.selectedDates || [], [question.selectedDates]);
  const timeSlotsByDate = useMemo(() => question.timeSlotsByDate || {}, [question.timeSlotsByDate]);
  const timeGranularity = question.timeGranularity || "30min";
  const allowMaybeVotes = question.allowMaybeVotes ?? false;
  const allowAnonymousVotes = question.allowAnonymousVotes ?? false;

  // Convertir granularité string en minutes
  const granularityMinutes = useMemo(() => {
    switch (timeGranularity) {
      case "15min":
        return 15;
      case "30min":
        return 30;
      case "1h":
        return 60;
      default:
        return 30;
    }
  }, [timeGranularity]);

  const handleDateToggle = useCallback(
    (date: Date) => {
      const dateString = formatDateLocal(date);
      const currentDates = [...selectedDates];
      const index = currentDates.indexOf(dateString);

      if (index >= 0) {
        // Retirer la date
        currentDates.splice(index, 1);
        // Retirer aussi les horaires associés
        const newTimeSlots = { ...timeSlotsByDate };
        delete newTimeSlots[dateString];
        onChange({
          selectedDates: currentDates,
          timeSlotsByDate: newTimeSlots,
        });
      } else {
        // Ajouter la date
        onChange({
          selectedDates: [...currentDates, dateString],
        });
      }
    },
    [selectedDates, timeSlotsByDate, onChange],
  );

  const handleBatchDateToggle = useCallback(
    (dates: Date[], action: 'add' | 'remove') => {
      const currentDates = [...selectedDates];
      const currentTimeSlots = { ...timeSlotsByDate };

      if (action === 'add') {
        // Ajouter toutes les dates qui ne sont pas déjà sélectionnées
        dates.forEach((date) => {
          const dateString = formatDateLocal(date);
          if (!currentDates.includes(dateString)) {
            currentDates.push(dateString);
          }
        });
        onChange({ selectedDates: currentDates });
      } else {
        // Retirer toutes les dates
        dates.forEach((date) => {
          const dateString = formatDateLocal(date);
          const index = currentDates.indexOf(dateString);
          if (index >= 0) {
            currentDates.splice(index, 1);
            delete currentTimeSlots[dateString];
          }
        });
        onChange({
          selectedDates: currentDates,
          timeSlotsByDate: currentTimeSlots,
        });
      }
    },
    [selectedDates, timeSlotsByDate, onChange],
  );

  const handleMonthChange = useCallback((direction: "prev" | "next") => {
    setVisibleMonths((prev) => {
      if (direction === "prev") {
        // Ajouter le mois précédent au début et retirer le dernier
        const firstMonth = prev[0];
        const newMonth = new Date(firstMonth.getFullYear(), firstMonth.getMonth() - 1, 1);
        return [newMonth, ...prev.slice(0, -1)];
      } else {
        // Retirer le premier mois et ajouter le mois suivant à la fin
        const lastMonth = prev[prev.length - 1];
        const newMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);
        return [...prev.slice(1), newMonth];
      }
    });
  }, []);

  const handleTimeSlotToggle = useCallback(
    (dateStr: string, hour: number, minute: number) => {
      const newTimeSlotsByDate = PollCreatorService.handleTimeSlotToggle(
        dateStr,
        hour,
        minute,
        timeSlotsByDate,
        granularityMinutes,
        false, // includeDuration = false pour DateQuestionEditor
      );
      onChange({
        timeSlotsByDate: newTimeSlotsByDate,
      });
    },
    [timeSlotsByDate, granularityMinutes, onChange],
  );

  const getVisibleTimeSlots = useCallback(() => {
    return PollCreatorService.generateVisibleTimeSlots(granularityMinutes, false);
  }, [granularityMinutes]);

  const getTimeSlotBlocks = useCallback(
    (dateStr: string) => {
      // Convertir les slots au format TimeSlot de PollCreatorService
      const slots: TimeSlot[] = (timeSlotsByDate[dateStr] || []).map((slot) => ({
        hour: slot.hour,
        minute: slot.minute,
        enabled: slot.enabled,
        duration: granularityMinutes,
      }));
      // Utiliser la même méthode que PollCreator
      return PollCreatorService.getTimeSlotBlocks(slots, granularityMinutes);
    },
    [timeSlotsByDate, granularityMinutes],
  );

  // Types pour le drag des horaires
  type TimeSlotWithDate = { date: string; hour: number; minute: number };

  // Helpers pour le drag
  const formatSlotKey = useCallback(
    (slot: TimeSlotWithDate) => `${slot.date}-${slot.hour}-${slot.minute}`,
    [],
  );

  const getSlotsInRange = useMemo(
    () => (start: TimeSlotWithDate, end: TimeSlotWithDate): TimeSlotWithDate[] => {
      // Si les dates sont différentes, retourner seulement le slot de départ
      if (start.date !== end.date) {
        return [start];
      }

      const startMinutes = start.hour * 60 + start.minute;
      const endMinutes = end.hour * 60 + end.minute;
      const [minMinutes, maxMinutes] =
        startMinutes <= endMinutes ? [startMinutes, endMinutes] : [endMinutes, startMinutes];

      const slots: TimeSlotWithDate[] = [];
      for (let minutes = minMinutes; minutes <= maxMinutes; minutes += granularityMinutes) {
        slots.push({
          date: start.date,
          hour: Math.floor(minutes / 60),
          minute: minutes % 60,
        });
      }
      return slots;
    },
    [granularityMinutes],
  );

  // Hook drag-to-extend pour les horaires
  const { isDragging, handleDragStart, handleDragMove, handleDragEnd, isDraggedOver, isLongPressActive } =
    useDragToSelect<TimeSlotWithDate>({
      onDragEnd: (draggedItems, startSlot) => {
        if (!startSlot || draggedItems.size === 0) return;

        const startKey = formatSlotKey(startSlot);
        const startSlotData = timeSlotsByDate[startSlot.date]?.find(
          (s) => s.hour === startSlot.hour && s.minute === startSlot.minute,
        );
        const wasEnabled = startSlotData?.enabled ?? false;

        // Collecter tous les slots à toggler
        const slotsToToggle: Array<{ dateStr: string; hour: number; minute: number }> = [];
        
        draggedItems.forEach((slotKey) => {
          const parts = slotKey.split("-");
          const dateStr = parts.slice(0, 3).join("-");
          const hour = parseInt(parts[3]);
          const minute = parseInt(parts[4]);

          const currentSlot = timeSlotsByDate[dateStr]?.find(
            (s) => s.hour === hour && s.minute === minute,
          );
          const isCurrentlyEnabled = currentSlot?.enabled ?? false;

          // Si le slot de départ était enabled et celui-ci aussi, on toggle (disable)
          // Si le slot de départ était disabled et celui-ci aussi, on toggle (enable)
          if ((wasEnabled && isCurrentlyEnabled) || (!wasEnabled && !isCurrentlyEnabled)) {
            slotsToToggle.push({ dateStr, hour, minute });
          }
        });

        // Appliquer tous les toggles en un seul appel
        if (slotsToToggle.length > 0) {
          let newTimeSlotsByDate = { ...timeSlotsByDate };
          slotsToToggle.forEach(({ dateStr, hour, minute }) => {
            newTimeSlotsByDate = PollCreatorService.handleTimeSlotToggle(
              dateStr,
              hour,
              minute,
              newTimeSlotsByDate,
              granularityMinutes,
              false,
            );
          });
          onChange({ timeSlotsByDate: newTimeSlotsByDate });
        }
      },
      getItemKey: formatSlotKey,
      getItemsInRange: getSlotsInRange,
      disableOnMobile: true,
    });

  return (
    <div className="rounded-lg border border-gray-700 bg-[#1a1a1a] p-4 space-y-4" style={{ userSelect: isDragging ? "none" : "auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Configuration des dates</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Calendrier */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Sélectionner les dates</label>
        <Calendar
          visibleMonths={visibleMonths}
          selectedDates={selectedDates}
          onDateToggle={handleDateToggle}
          onBatchDateToggle={handleBatchDateToggle}
          onMonthChange={handleMonthChange}
          onMonthsChange={setVisibleMonths}
        />
      </div>

      {/* Configuration des horaires pour chaque date */}
      {selectedDates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">Configurer les horaires</label>
              {isLongPressActive && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-400 rounded-md text-xs text-blue-400 animate-pulse">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Mode sélection actif
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Granularité:</label>
              <select
                value={timeGranularity}
                onChange={(e) =>
                  onChange({
                    timeGranularity: e.target.value as "15min" | "30min" | "1h",
                  })
                }
                className="rounded-md border border-gray-700 bg-[#3c4043] text-white px-2 py-1 text-xs"
              >
                <option value="15min">15 min</option>
                <option value="30min">30 min</option>
                <option value="1h">1 h</option>
              </select>
            </div>
          </div>

          {/* Grille des horaires avec dates en colonnes */}
          <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden">
            {/* En-têtes des dates */}
            <div className="flex bg-[#0a0a0a]">
              <div className="w-16 p-2 text-xs font-medium text-gray-300 flex items-center justify-center border-r border-gray-700">
                Heure
              </div>
              {selectedDates.map((dateStr) => {
                const dateInfo = PollCreatorService.formatSelectedDateHeader(dateStr);
                return (
                  <div
                    key={dateStr}
                    className="flex-1 p-2 text-center border-r bg-blue-600 text-white"
                  >
                    <div className="text-xs font-medium">{dateInfo.dayName}</div>
                    <div className="text-sm font-bold">{dateInfo.dayNumber}</div>
                    <div className="text-xs opacity-90">{dateInfo.month}</div>
                  </div>
                );
              })}
            </div>

            {/* Créneaux horaires */}
            <div className="max-h-96 overflow-y-auto" style={{ touchAction: "pan-y" }}>
              {getVisibleTimeSlots().map((timeSlot) => {
                return (
                  <div key={`${timeSlot.hour}-${timeSlot.minute}`} className="flex">
                    <div className="w-16 p-2 text-xs text-gray-300 flex items-center justify-center border-r border-gray-700 bg-[#0a0a0a]">
                      {timeSlot.label}
                    </div>
                    {selectedDates.map((dateStr) => {
                      const slot = timeSlotsByDate[dateStr]?.find(
                        (s) => s.hour === timeSlot.hour && s.minute === timeSlot.minute,
                      );
                      const blocks = getTimeSlotBlocks(dateStr);
                      const currentBlock = blocks.find(
                        (block) =>
                          timeSlot.hour * 60 + timeSlot.minute >=
                            block.start.hour * 60 + block.start.minute &&
                          timeSlot.hour * 60 + timeSlot.minute <=
                            block.end.hour * 60 + block.end.minute,
                      );
                      const isBlockStart = blocks.some(
                        (block) =>
                          block.start.hour === timeSlot.hour &&
                          block.start.minute === timeSlot.minute,
                      );
                      const isBlockEnd =
                        currentBlock &&
                        ((currentBlock.end.hour === timeSlot.hour &&
                          currentBlock.end.minute === timeSlot.minute) ||
                          (timeSlot.hour * 60 + timeSlot.minute <
                            currentBlock.end.hour * 60 + currentBlock.end.minute &&
                            timeSlot.hour * 60 + timeSlot.minute + granularityMinutes >=
                              currentBlock.end.hour * 60 + currentBlock.end.minute));
                      const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;
                      const slotKey = formatSlotKey({ date: dateStr, hour: timeSlot.hour, minute: timeSlot.minute });
                      const isSlotDraggedOver = isDraggedOver(slotKey);

                      return (
                        <button
                          key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}-${isSlotDraggedOver ? "dragged" : ""}-${slot?.enabled ? "enabled" : ""}`}
                          type="button"
                          onClick={() =>
                            handleTimeSlotToggle(dateStr, timeSlot.hour, timeSlot.minute)
                          }
                          onPointerDown={(e) =>
                            handleDragStart({ date: dateStr, hour: timeSlot.hour, minute: timeSlot.minute }, e)
                          }
                          onPointerMove={(e) => {
                            if (isDragging) {
                              handleDragMove({ date: dateStr, hour: timeSlot.hour, minute: timeSlot.minute }, e);
                            }
                          }}
                          onPointerUp={handleDragEnd}
                          className={`flex-1 relative transition-all hover:bg-[#2a2a2a] border-r border-gray-700
                            ${isSlotDraggedOver ? "bg-blue-500/50 border-2 border-blue-400" : slot?.enabled ? "bg-blue-900/30" : "bg-[#1e1e1e]"}
                            ${granularityMinutes >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
                            ${isLongPressActive && isSlotDraggedOver ? "animate-pulse ring-2 ring-blue-400" : ""}
                          `}
                          style={{ touchAction: "none" }}
                        >
                          {slot?.enabled && (
                            <div
                              className={`absolute bg-blue-500 transition-all
                                ${isBlockStart && isBlockEnd ? "inset-1 rounded-lg" : ""}
                                ${isBlockStart && !isBlockEnd ? "inset-x-1 top-1 bottom-0 rounded-t-lg" : ""}
                                ${isBlockEnd && !isBlockStart ? "inset-x-1 bottom-1 top-0 rounded-b-lg" : ""}
                                ${isBlockMiddle ? "inset-x-1 top-0 bottom-0" : ""}
                              `}
                            >
                              {isBlockStart && currentBlock && (
                                <div className="absolute top-0.5 left-0.5 right-0.5">
                                  <div className="text-white text-[10px] font-semibold text-center bg-blue-600 rounded px-0.5 py-0.5">
                                    {`${currentBlock.start.hour.toString().padStart(2, "0")}:${currentBlock.start.minute.toString().padStart(2, "0")}`}
                                  </div>
                                </div>
                              )}
                              {isBlockEnd && currentBlock && (
                                <div className="absolute bottom-0.5 left-0.5 right-0.5">
                                  <div className="text-white text-[10px] font-semibold text-center bg-blue-600 rounded px-0.5 py-0.5">
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Options</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMaybeVotes}
            onChange={(e) => onChange({ allowMaybeVotes: e.target.checked })}
            className="cursor-pointer"
          />
          <span className="text-sm text-gray-300">Permettre les votes "peut-être"</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowAnonymousVotes}
            onChange={(e) => onChange({ allowAnonymousVotes: e.target.checked })}
            className="cursor-pointer"
          />
          <span className="text-sm text-gray-300">Permettre les votes anonymes</span>
        </label>
      </div>

      {/* Résumé */}
      {selectedDates.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Check className="w-4 h-4" />
            <span>
              {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} sélectionnée
              {selectedDates.length > 1 ? "s" : ""}
              {Object.keys(timeSlotsByDate).length > 0 &&
              Object.values(timeSlotsByDate).some((slots) => slots.length > 0) ? (
                <span className="ml-2">• Horaires configurés</span>
              ) : null}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
