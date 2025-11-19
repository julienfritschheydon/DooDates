import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Check, X, HelpCircle, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }>;
  display_order: number;
}

interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}

interface VoteGridProps {
  options: PollOption[];
  votes: Vote[];
  currentVote: Record<string, "yes" | "no" | "maybe">;
  userHasVoted: Record<string, boolean>;
  onVoteChange: (optionId: string, value: "yes" | "no" | "maybe") => void;
  onHaptic: (type: "light" | "medium" | "heavy") => void;
}

const VoteButton: React.FC<{
  type: "yes" | "no" | "maybe";
  isSelected: boolean;
  isColored: boolean;
  onSelect: () => void;
  onHaptic: (type: "light" | "medium" | "heavy") => void;
}> = ({ type, isSelected, isColored, onSelect, onHaptic }) => {
  const config = {
    yes: {
      icon: Check,
      bgColor: "bg-blue-500",
      bgColorBright: "bg-blue-600",
      hoverColor: "hover:bg-blue-100",
      textColor: "text-blue-600",
      borderColor: "border-blue-500",
      label: "Oui",
    },
    no: {
      icon: X,
      bgColor: "bg-red-500",
      bgColorBright: "bg-red-600",
      hoverColor: "hover:bg-red-100",
      textColor: "text-red-600",
      borderColor: "border-red-500",
      label: "Non",
    },
    maybe: {
      icon: HelpCircle,
      bgColor: "bg-orange-500",
      bgColorBright: "bg-orange-600",
      hoverColor: "hover:bg-orange-100",
      textColor: "text-orange-600",
      borderColor: "border-orange-500",
      label: "Peut-être",
    },
  };

  const {
    icon: Icon,
    bgColor,
    bgColorBright,
    hoverColor,
    textColor,
    borderColor,
    label,
  } = config[type];

  const handleSelect = () => {
    onHaptic("medium");
    onSelect();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={handleSelect}
      className={`
        flex-1 min-h-[44px] min-w-[80px] rounded-xl flex items-center justify-center gap-1.5 font-medium text-sm
        transition-all duration-200 border-2 active:scale-95
        ${
          isColored
            ? `bg-white ${borderColor} shadow-lg scale-105`
            : `bg-white ${textColor} ${hoverColor} border-gray-200`
        }
      `}
    >
      {type === "maybe" ? (
        <span className={`${textColor} text-2xl font-bold`}>?</span>
      ) : (
        <Icon className={`h-6 w-6 ${textColor}`} />
      )}
    </motion.button>
  );
};

const ProgressBar: React.FC<{
  type: "yes" | "no" | "maybe";
  existingCount: number;
  totalExisting: number;
  userVote?: "yes" | "no" | "maybe";
  userHasVoted: boolean;
}> = ({ type, existingCount, totalExisting, userVote, userHasVoted }) => {
  const config = {
    yes: { color: "bg-blue-500", colorLight: "bg-blue-200" },
    no: { color: "bg-red-500", colorLight: "bg-red-200" },
    maybe: { color: "bg-orange-500", colorLight: "bg-orange-200" },
  };

  const { color, colorLight } = config[type];

  // Calcul des pourcentages
  const existingPercentage = totalExisting > 0 ? (existingCount / totalExisting) * 100 : 0;
  const withUserPercentage =
    totalExisting > 0
      ? ((existingCount + (userVote === type && userHasVoted ? 1 : 0)) /
          (totalExisting + (userHasVoted ? 1 : 0))) *
        100
      : 0;

  // Condition pour afficher la barre de surbrillance
  const showUserEffect = userVote === type && userHasVoted;

  return (
    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
      {/* Barre de fond (vraies statistiques, 20% opacité) */}
      {existingPercentage > 0 && (
        <div
          className={`absolute top-0 left-0 h-full ${colorLight} opacity-30`}
          style={{ width: `${existingPercentage}%` }}
        />
      )}

      {/* Barre de surbrillance - SEULEMENT l'ajout du vote utilisateur */}
      {showUserEffect && (
        <div
          className={`absolute top-0 h-full ${color} opacity-75`}
          style={{
            left: `${existingPercentage}%`,
            width: `${Math.max(0, withUserPercentage - existingPercentage)}%`,
          }}
        />
      )}
    </div>
  );
};

const OptionCard: React.FC<{
  option: PollOption;
  currentVote?: "yes" | "no" | "maybe";
  userHasVoted: boolean;
  voteCounts: { yes: number; no: number; maybe: number };
  onVoteChange: (value: "yes" | "no" | "maybe") => void;
  onHaptic: (type: "light" | "medium" | "heavy") => void;
  rank?: number;
  showDate?: boolean;
}> = ({
  option,
  currentVote,
  userHasVoted,
  voteCounts,
  onVoteChange,
  onHaptic,
  rank,
  showDate = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Format de la date (éviter les décalages timezone)
  const formatDateLocal = (dateString: string) => {
    // Parser la date en mode local pour éviter les décalages timezone
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Format d'un créneau horaire unique (une ligne = un créneau)
  const formatTimeSlot = (timeSlot: {
    hour: number;
    minute: number;
    duration?: number;
  }): string => {
    if (!timeSlot || typeof timeSlot.hour !== "number" || typeof timeSlot.minute !== "number") {
      return "Toute la journée";
    }

    const startHour = timeSlot.hour.toString().padStart(2, "0");
    const startMinute = timeSlot.minute.toString().padStart(2, "0");
    const duration = timeSlot.duration || 30; // Durée par défaut de 30 minutes

    const endTime = timeSlot.hour * 60 + timeSlot.minute + duration;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;
    const endHourStr = endHour.toString().padStart(2, "0");
    const endMinuteStr = endMinute.toString().padStart(2, "0");

    return `${startHour}:${startMinute} - ${endHourStr}:${endMinuteStr}`;
  };

  // Gestion des gestes de swipe
  const handlePan = (_event: unknown, info: PanInfo) => {
    const { offset } = info;
    const threshold = 50;

    if (Math.abs(offset.x) > threshold) {
      if (offset.x > 0) {
        // Swipe droite = Non
        onVoteChange("no");
      } else {
        // Swipe gauche = Oui
        onVoteChange("yes");
      }
      onHaptic("medium");
    }
  };

  const handlePanStart = () => {
    setIsDragging(true);
    onHaptic("light");
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const totalVotes = voteCounts.yes + voteCounts.no + voteCounts.maybe;
  const hasExistingVotes = totalVotes > 0;

  // Extraire la première heure pour le scroll automatique
  const firstHour = option.time_slots?.[0]?.hour ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-hour={firstHour}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative
        ${isDragging ? "shadow-lg scale-[1.02]" : ""}
        ${currentVote && userHasVoted ? "ring-2 ring-blue-200" : ""}
        ${rank === 1 && hasExistingVotes ? "border-2 border-blue-500" : ""}
      `}
    >
      {/* Badge 1er - seulement si des votes existent */}
      {rank === 1 && hasExistingVotes && (
        <div className="absolute -top-2 -left-2 z-30 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          1er
        </div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="p-3 cursor-grab active:cursor-grabbing"
      >
        {/* Contenu sur une seule ligne */}
        <div className="flex items-center gap-3">
          {/* Icône calendrier - seulement si on affiche la date */}
          {showDate && (
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          )}

          {/* Date et horaires */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {showDate && (
                <h3 className="font-semibold text-gray-900 capitalize text-sm">
                  {formatDateLocal(option.option_date)}
                </h3>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>
                  {option.time_slots.length > 0
                    ? formatTimeSlot(option.time_slots[0])
                    : "Toute la journée"}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons de vote */}
          <div className="flex gap-2 flex-shrink-0">
            <VoteButton
              type="yes"
              isSelected={currentVote === "yes"}
              isColored={currentVote === "yes" && userHasVoted}
              onSelect={() => onVoteChange("yes")}
              onHaptic={onHaptic}
            />
            <VoteButton
              type="maybe"
              isSelected={currentVote === "maybe"}
              isColored={
                (currentVote === "maybe" && userHasVoted) ||
                (!userHasVoted && currentVote === "maybe")
              }
              onSelect={() => onVoteChange("maybe")}
              onHaptic={onHaptic}
            />
            <VoteButton
              type="no"
              isSelected={currentVote === "no"}
              isColored={currentVote === "no" && userHasVoted}
              onSelect={() => onVoteChange("no")}
              onHaptic={onHaptic}
            />
          </div>
        </div>

        {/* Système de barres de progression à double couche - seulement si des votes existent */}
        {hasExistingVotes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </span>
              <span className="flex gap-2">
                <span className="text-blue-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {voteCounts.yes}
                </span>
                <span className="text-orange-600 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  {voteCounts.maybe}
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {voteCounts.no}
                </span>
              </span>
            </div>

            {/* Barres de progression pour chaque type de vote */}
            <div className="space-y-1">
              <ProgressBar
                type="yes"
                existingCount={voteCounts.yes}
                totalExisting={totalVotes}
                userVote={currentVote}
                userHasVoted={userHasVoted}
              />
              <ProgressBar
                type="maybe"
                existingCount={voteCounts.maybe}
                totalExisting={totalVotes}
                userVote={currentVote}
                userHasVoted={userHasVoted}
              />
              <ProgressBar
                type="no"
                existingCount={voteCounts.no}
                totalExisting={totalVotes}
                userVote={currentVote}
                userHasVoted={userHasVoted}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Indicateur de swipe */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/90 rounded-lg px-3 py-1 text-sm font-medium text-gray-700">
            ← Oui | Non →
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export const VoteGrid: React.FC<VoteGridProps> = ({
  options,
  votes,
  currentVote,
  userHasVoted,
  onVoteChange,
  onHaptic,
}) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Calculer les statistiques de vote par option
  const getVoteCounts = (optionId: string) => {
    const counts = { yes: 0, no: 0, maybe: 0 };
    votes.forEach((vote) => {
      const selection = vote.selections[optionId];
      if (selection && selection in counts) {
        counts[selection]++;
      }
    });
    return counts;
  };

  if (options.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucune option disponible pour ce sondage.</p>
      </div>
    );
  }

  // Grouper les options par date
  const optionsByDate = new Map<string, PollOption[]>();
  options.forEach((option) => {
    const date = option.option_date;
    if (!optionsByDate.has(date)) {
      optionsByDate.set(date, []);
    }
    optionsByDate.get(date)!.push(option);
  });

  // Trier les dates
  const sortedDates = Array.from(optionsByDate.keys()).sort();

  // Calculer les rangs basés sur le nombre de votes "oui"
  const optionsWithScores = options.map((option) => ({
    ...option,
    score: getVoteCounts(option.id).yes,
  }));

  // Trier par score décroissant
  const sortedOptions = [...optionsWithScores].sort((a, b) => b.score - a.score);

  // Créer un map des rangs
  const rankMap = new Map<string, number>();
  sortedOptions.forEach((option, index) => {
    // Si même score que le précédent, même rang
    if (index > 0 && option.score === sortedOptions[index - 1].score) {
      rankMap.set(option.id, rankMap.get(sortedOptions[index - 1].id)!);
    } else {
      rankMap.set(option.id, index + 1);
    }
  });

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Options disponibles</h2>
        <div className="text-sm text-gray-600">
          {typeof window !== "undefined" && window.innerWidth >= 768
            ? "Cliquez sur les boutons pour voter"
            : "Swipez pour voter"}
        </div>
      </div>

      <div className="space-y-2">
        {sortedDates.map((date, dateIndex) => {
          const dateOptions = optionsByDate.get(date)!;
          const isExpanded = expandedDates.has(date);
          const hasMultipleSlots = dateOptions.length > 1;

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIndex * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* En-tête de date avec bouton d'expansion */}
              {hasMultipleSlots && (
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 capitalize text-sm">
                      {formatDate(date)}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {dateOptions.length} créneau{dateOptions.length > 1 ? "x" : ""}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}

              {/* Liste des créneaux */}
              <div className={hasMultipleSlots && !isExpanded ? "hidden" : ""}>
                {dateOptions.map((option, slotIndex) => (
                  <div
                    key={option.id}
                    className={hasMultipleSlots ? "border-t border-gray-100" : ""}
                  >
                    <OptionCard
                      option={option}
                      currentVote={currentVote[option.id]}
                      userHasVoted={userHasVoted[option.id] || false}
                      voteCounts={getVoteCounts(option.id)}
                      onVoteChange={(value) => onVoteChange(option.id, value)}
                      onHaptic={onHaptic}
                      rank={rankMap.get(option.id)}
                      showDate={!hasMultipleSlots}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Aide pour les gestes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 rounded-xl p-3 text-center"
      >
        <p className="text-xs text-blue-600">
          💡 <span className="font-medium">Astuce :</span> Glissez vers la droite pour "Oui", vers
          la gauche pour "Non"
        </p>
      </motion.div>
    </motion.div>
  );
};
