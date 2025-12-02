import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, HelpCircle, Calendar, Clock, Trophy } from "lucide-react";
import type { FormQuestionShape, DateQuestionResults } from "../../lib/pollStorage";

interface DateResultsViewProps {
  question: FormQuestionShape;
  results: DateQuestionResults;
  totalRespondents: number;
}

export default function DateResultsView({
  question,
  results,
  totalRespondents,
}: DateResultsViewProps) {
  const selectedDates = useMemo(() => question.selectedDates || [], [question.selectedDates]);
  const timeSlotsByDate = question.timeSlotsByDate || {};

  // Formater une date pour l'affichage
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Formater un créneau horaire
  const formatTimeSlot = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  // Calculer le score pour trier les dates (yes - no*0.5)
  const getDateScore = useCallback(
    (date: string) => {
      const votes = results.votesByDate[date] || { yes: 0, no: 0, maybe: 0, total: 0 };
      return votes.yes - votes.no * 0.5;
    },
    [results],
  );

  // Trier les dates par score décroissant
  const sortedDates = useMemo(() => {
    return [...selectedDates].sort((a, b) => {
      const scoreA = getDateScore(a);
      const scoreB = getDateScore(b);
      return scoreB - scoreA;
    });
  }, [selectedDates, getDateScore]);

  // Obtenir le rang d'une date
  const getDateRank = (date: string) => {
    const score = getDateScore(date);
    const sorted = [...selectedDates].sort((a, b) => getDateScore(b) - getDateScore(a));
    const index = sorted.findIndex((d) => d === date);
    return index + 1;
  };

  // Obtenir la couleur du rang
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 dark:from-yellow-500 dark:to-yellow-600 dark:text-yellow-100";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 dark:from-gray-600 dark:to-gray-700 dark:text-gray-100";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 dark:from-amber-700 dark:to-amber-800 dark:text-amber-50";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-blue-100 dark:from-blue-600 dark:to-blue-700 dark:text-blue-50";
    }
  };

  // Barre de résultat pour yes/no/maybe
  const ResultBar: React.FC<{
    label: string;
    count: number;
    total: number;
    color: string;
    icon: React.ReactNode;
  }> = ({ label, count, total, color, icon }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-[100px]">
          {icon}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full ${color}`}
          />
        </div>
        <div className="min-w-[60px] text-right">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{count}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
    );
  };

  if (results.totalResponses === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">Aucune réponse pour le moment.</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques globales */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {results.totalResponses} réponse{results.totalResponses > 1 ? "s" : ""}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            sur {totalRespondents} participant{totalRespondents > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Résultats par date */}
      <div className="space-y-4">
        {sortedDates.map((date, index) => {
          const votes = results.votesByDate[date] || { yes: 0, no: 0, maybe: 0, total: 0 };
          const rank = getDateRank(date);
          const timeSlots = timeSlotsByDate[date] || [];

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(date)}
                    </div>
                    {timeSlots.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeSlots
                          .filter((slot) => slot.enabled)
                          .map((slot) => formatTimeSlot(slot.hour, slot.minute))
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                {rank <= 3 && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getRankColor(
                      rank,
                    )}`}
                  >
                    <Trophy className="w-3 h-3" />#{rank}
                  </div>
                )}
              </div>

              {/* Barres de résultats */}
              <div className="space-y-2">
                <ResultBar
                  label="Oui"
                  count={votes.yes}
                  total={votes.total}
                  color="bg-blue-500"
                  icon={<Check className="w-4 h-4 text-blue-600" />}
                />
                {question.allowMaybeVotes && (
                  <ResultBar
                    label="Peut-être"
                    count={votes.maybe}
                    total={votes.total}
                    color="bg-orange-500"
                    icon={<HelpCircle className="w-4 h-4 text-orange-600" />}
                  />
                )}
                <ResultBar
                  label="Non"
                  count={votes.no}
                  total={votes.total}
                  color="bg-red-500"
                  icon={<X className="w-4 h-4 text-red-600" />}
                />
              </div>

              {/* Résultats par créneau horaire si présents */}
              {timeSlots.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Détail par créneau horaire :
                  </div>
                  <div className="space-y-2">
                    {timeSlots
                      .filter((slot) => slot.enabled)
                      .map((slot) => {
                        const timeSlotKey = `${date}-${slot.hour.toString().padStart(2, "0")}-${slot.minute.toString().padStart(2, "0")}`;
                        const slotVotes = results.votesByTimeSlot[timeSlotKey] || {
                          yes: 0,
                          no: 0,
                          maybe: 0,
                          total: 0,
                        };

                        if (slotVotes.total === 0) return null;

                        return (
                          <div
                            key={timeSlotKey}
                            className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1"
                          >
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {formatTimeSlot(slot.hour, slot.minute)}
                            </div>
                            <div className="flex gap-3 mt-1">
                              <span className="text-blue-600 dark:text-blue-400">
                                ✓ {slotVotes.yes}
                              </span>
                              {question.allowMaybeVotes && (
                                <span className="text-orange-600 dark:text-orange-400">
                                  ? {slotVotes.maybe}
                                </span>
                              )}
                              <span className="text-red-600 dark:text-red-400">
                                ✗ {slotVotes.no}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
