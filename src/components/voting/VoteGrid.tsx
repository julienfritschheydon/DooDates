import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Check, X, HelpCircle, Calendar, Clock } from "lucide-react";

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
      bgColor: "bg-green-500",
      bgColorBright: "bg-green-600",
      hoverColor: "hover:bg-green-100",
      textColor: "text-green-600",
      borderColor: "border-green-500",
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
        flex-1 min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-medium text-sm
        transition-all duration-200 border-2 active:scale-95
        ${
          isColored
            ? `bg-white ${borderColor} shadow-lg scale-105`
            : `bg-white ${textColor} ${hoverColor} border-gray-200`
        }
      `}
    >
      <Icon className={`h-4 w-4 ${textColor}`} />
      <span className={`hidden sm:inline ${textColor}`}>{label}</span>
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
    yes: { color: "bg-green-500", colorLight: "bg-green-200" },
    no: { color: "bg-red-500", colorLight: "bg-red-200" },
    maybe: { color: "bg-orange-500", colorLight: "bg-orange-200" },
  };

  const { color, colorLight } = config[type];

  // Calcul des pourcentages
  const existingPercentage =
    totalExisting > 0 ? (existingCount / totalExisting) * 100 : 0;
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
}> = ({
  option,
  currentVote,
  userHasVoted,
  voteCounts,
  onVoteChange,
  onHaptic,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Format de la date (éviter les décalages timezone)
  const formatDate = (dateString: string) => {
    // Parser la date en mode local pour éviter les décalages timezone
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 car JS commence à 0

    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Format des créneaux horaires
  const formatTimeSlots = (
    timeSlots: Array<{ hour: number; minute: number; duration?: number }>,
  ) => {
    if (!timeSlots || timeSlots.length === 0) return "Toute la journée";

    return timeSlots
      .map((slot) => {
        const start = `${slot.hour.toString().padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")}`;
        if (slot.duration) {
          const endHour = Math.floor(
            (slot.hour * 60 + slot.minute + slot.duration) / 60,
          );
          const endMinute = (slot.hour * 60 + slot.minute + slot.duration) % 60;
          const end = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
          return `${start} - ${end}`;
        }
        return start;
      })
      .join(", ");
  };

  // Gestion des gestes de swipe
  const handlePan = (event: any, info: PanInfo) => {
    const { offset } = info;
    const threshold = 50;

    if (Math.abs(offset.x) > threshold) {
      if (offset.x > 0) {
        // Swipe droite = Oui
        onVoteChange("yes");
      } else {
        // Swipe gauche = Non
        onVoteChange("no");
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative
        ${isDragging ? "shadow-lg scale-[1.02]" : ""}
        ${currentVote && userHasVoted ? "ring-2 ring-blue-200" : ""}
      `}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="p-4 cursor-grab active:cursor-grabbing"
      >
        {/* En-tête de l'option */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 capitalize">
              {formatDate(option.option_date)}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimeSlots(option.time_slots)}</span>
            </div>
          </div>
        </div>

        {/* Système de barres de progression à double couche */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </span>
            <span className="flex gap-2">
              <span className="text-green-600 flex items-center gap-1">
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

        {/* Boutons de vote */}
        <div className="flex gap-2">
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
      </motion.div>

      {/* Indicateur de swipe */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/90 rounded-lg px-3 py-1 text-sm font-medium text-gray-600">
            ← Non | Oui →
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
  // Calculer les statistiques de vote par option
  const getVoteCounts = (optionId: string) => {
    const counts = { yes: 0, no: 0, maybe: 0 };
    votes.forEach((vote) => {
      const selection = vote.selections[optionId];
      if (selection && counts.hasOwnProperty(selection)) {
        counts[selection]++;
      }
    });
    return counts;
  };

  if (options.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          Aucune option disponible pour ce sondage.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Options disponibles
        </h2>
        <div className="text-sm text-gray-500">Swipez pour voter</div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <OptionCard
              option={option}
              currentVote={currentVote[option.id]}
              userHasVoted={userHasVoted[option.id] || false}
              voteCounts={getVoteCounts(option.id)}
              onVoteChange={(value) => onVoteChange(option.id, value)}
              onHaptic={onHaptic}
            />
          </motion.div>
        ))}
      </div>

      {/* Aide pour les gestes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 rounded-xl p-3 text-center"
      >
        <p className="text-xs text-blue-600">
          💡 <span className="font-medium">Astuce :</span> Glissez vers la
          droite pour "Oui", vers la gauche pour "Non"
        </p>
      </motion.div>
    </motion.div>
  );
};
