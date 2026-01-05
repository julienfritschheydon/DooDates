import React from "react";
import { AlertCircle, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeSlotConflict } from "@/services/calendarConflictDetection";

interface CalendarConflictsPanelProps {
  conflicts: TimeSlotConflict[];
  onRemoveSlot: (conflict: TimeSlotConflict) => void;
  onReplaceSlot: (conflict: TimeSlotConflict, suggestion: { start: string; end: string }) => void;
  onDismiss: () => void;
}

export const CalendarConflictsPanel: React.FC<CalendarConflictsPanelProps> = ({
  conflicts,
  onRemoveSlot,
  onReplaceSlot,
  onDismiss,
}) => {
  if (conflicts.length === 0) {
    return null;
  }

  // Grouper les conflits par date
  const conflictsByDate = conflicts.reduce(
    (acc, conflict) => {
      if (!acc[conflict.date]) {
        acc[conflict.date] = [];
      }
      acc[conflict.date].push(conflict);
      return acc;
    },
    {} as Record<string, TimeSlotConflict[]>,
  );

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const busyCount = conflicts.filter((c) => c.status === "busy").length;
  const partialCount = conflicts.filter((c) => c.status === "partial").length;

  return (
    <Card className="border-orange-600 bg-orange-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span>
                {conflicts.length} Conflit{conflicts.length > 1 ? "s" : ""} détecté
                {conflicts.length > 1 ? "s" : ""}
              </span>
              <span className="text-sm font-normal text-gray-400">
                ({busyCount} occupé{busyCount > 1 ? "s" : ""}
                {partialCount > 0 ? `, ${partialCount} partiel${partialCount > 1 ? "s" : ""}` : ""})
              </span>
            </div>
          </CardTitle>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
           data-testid="calendarconflictspanel-button">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(conflictsByDate).map(([date, dateConflicts]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-semibold text-white capitalize">{formatDate(date)}</h3>
            {dateConflicts.map((conflict, idx) => (
              <div
                key={`${date}-${idx}`}
                className="p-3 bg-orange-900/20 rounded-lg border border-orange-700/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <p className="font-medium text-white">
                        {conflict.timeSlot.hour.toString().padStart(2, "0")}:
                        {conflict.timeSlot.minute.toString().padStart(2, "0")}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          conflict.status === "busy"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-orange-500/20 text-orange-300"
                        }`}
                      >
                        {conflict.status === "busy" ? "Occupé" : "Partiel"}
                      </span>
                    </div>
                    {conflict.conflicts.map((evt, evtIdx) => (
                      <p key={evtIdx} className="text-sm text-gray-400 ml-6">
                        Conflit avec : {evt.eventTitle}
                        <span className="text-xs ml-1">
                          (
                          {new Date(evt.start).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(evt.end).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          )
                        </span>
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => onRemoveSlot(conflict)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-900/20"
                   data-testid="calendarconflictspanel-retirer">
                    Retirer
                  </button>
                </div>

                {/* Suggestions */}
                {conflict.suggestions && conflict.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-700/30">
                    <p className="text-xs text-gray-400 mb-2">Créneaux libres suggérés :</p>
                    <div className="flex gap-2 flex-wrap">
                      {conflict.suggestions.map((suggestion, suggIdx) => (
                        <button
                          key={suggIdx}
                          onClick={() => onReplaceSlot(conflict, suggestion)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
                         data-testid="calendarconflictspanel-button">
                          {suggestion.start} - {suggestion.end}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
