import React, { useMemo, useCallback } from "react";
import { VoteGrid } from "../voting/VoteGrid";
import type { FormQuestionShape, DateVoteValue } from "../../lib/pollStorage";

interface DateQuestionVoteProps {
  question: FormQuestionShape;
  value: DateVoteValue | undefined;
  onChange: (value: DateVoteValue) => void;
  required?: boolean;
}

export default function DateQuestionVote({
  question,
  value,
  onChange,
  required = false,
}: DateQuestionVoteProps) {
  const selectedDates = useMemo(() => question.selectedDates || [], [question.selectedDates]);
  const timeSlotsByDate = useMemo(() => question.timeSlotsByDate || {}, [question.timeSlotsByDate]);
  const allowMaybeVotes = question.allowMaybeVotes ?? false;

  // Convertir les données de la question en format PollOption pour VoteGrid
  // Créer une option par créneau horaire (une ligne par créneau)
  const pollOptions = useMemo(() => {
    const options: Array<{
      id: string;
      poll_id: string;
      option_date: string;
      time_slots: Array<{ hour: number; minute: number; duration?: number }>;
      display_order: number;
    }> = [];

    selectedDates.forEach((date, dateIndex) => {
      const timeSlots = timeSlotsByDate[date] || [];
      // Filtrer uniquement les créneaux activés
      const enabledTimeSlots = timeSlots.filter((slot) => slot.enabled);

      if (enabledTimeSlots.length === 0) {
        // Si pas de créneaux, créer une option pour la date complète
        options.push({
          id: `date-${date}-${dateIndex}`,
          poll_id: question.id,
          option_date: date,
          time_slots: [],
          display_order: dateIndex * 1000,
        });
      } else {
        // Créer une option pour chaque créneau horaire
        enabledTimeSlots.forEach((slot, slotIndex) => {
          options.push({
            id: `date-${date}-slot-${slot.hour}-${slot.minute}-${slotIndex}`,
            poll_id: question.id,
            option_date: date,
            time_slots: [
              {
                hour: slot.hour,
                minute: slot.minute,
                duration: getDurationFromGranularity(question.timeGranularity),
              },
            ],
            display_order: dateIndex * 1000 + slotIndex,
          });
        });
      }
    });

    return options;
  }, [selectedDates, timeSlotsByDate, question.id, question.timeGranularity]);

  // Convertir la valeur actuelle en format VoteGrid (Record<optionId, vote>)
  const currentVote = useMemo(() => {
    const voteMap: Record<string, "yes" | "no" | "maybe"> = {};
    if (!value || !Array.isArray(value)) return voteMap;

    value.forEach((voteEntry) => {
      // Trouver toutes les options qui correspondent à cette date et ce créneau
      pollOptions.forEach((opt) => {
        if (opt.option_date === voteEntry.date) {
          // Vérifier si le créneau horaire correspond
          const hasMatchingSlot = opt.time_slots.some((slot) =>
            voteEntry.timeSlots.some(
              (voteSlot) => voteSlot.hour === slot.hour && voteSlot.minute === slot.minute,
            ),
          );
          // Si c'est une option sans créneaux spécifiques ou si le créneau correspond
          if (opt.time_slots.length === 0 || hasMatchingSlot) {
            voteMap[opt.id] = voteEntry.vote;
          }
        }
      });
    });

    return voteMap;
  }, [value, pollOptions]);

  // Gérer le changement de vote depuis VoteGrid
  const handleVoteChange = useCallback(
    (optionId: string, voteValue: "yes" | "no" | "maybe") => {
      const option = pollOptions.find((opt) => opt.id === optionId);
      if (!option) return;

      const date = option.option_date;
      const currentValue = value || [];
      const timeSlots = option.time_slots.map((slot) => ({
        hour: slot.hour,
        minute: slot.minute,
      }));

      // Retirer les votes existants pour cette date et ces créneaux spécifiques
      const updatedValue = currentValue.filter((v) => {
        if (v.date !== date) return true;
        // Vérifier si les créneaux se chevauchent
        const hasOverlap = v.timeSlots.some((voteSlot) =>
          timeSlots.some((slot) => slot.hour === voteSlot.hour && slot.minute === voteSlot.minute),
        );
        return !hasOverlap;
      });

      // Ajouter le nouveau vote avec les créneaux horaires spécifiques
      updatedValue.push({
        date,
        timeSlots,
        vote: voteValue,
      });

      onChange(updatedValue);
    },
    [pollOptions, value, onChange],
  );

  // Pas de votes existants pour l'affichage (on est en mode vote, pas résultats)
  const existingVotes: unknown[] = [];
  const userHasVoted: Record<string, boolean> = {};

  // Fonction haptique vide (peut être implémentée plus tard)
  const handleHaptic = useCallback((type: "light" | "medium" | "heavy") => {
    // TODO: Implémenter le feedback haptique si nécessaire
  }, []);

  if (pollOptions.length === 0) {
    return <div className="text-sm text-gray-500">Aucune date configurée pour cette question.</div>;
  }

  return (
    <div className="w-full">
      <VoteGrid
        options={pollOptions}
        votes={existingVotes}
        currentVote={currentVote}
        userHasVoted={userHasVoted}
        onVoteChange={handleVoteChange}
        onHaptic={handleHaptic}
      />
    </div>
  );
}

// Convertir la granularité string en durée en minutes
function getDurationFromGranularity(granularity?: "15min" | "30min" | "1h"): number {
  switch (granularity) {
    case "15min":
      return 15;
    case "30min":
      return 30;
    case "1h":
      return 60;
    default:
      return 30; // Par défaut 30 minutes
  }
}
