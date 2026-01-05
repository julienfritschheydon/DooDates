import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Check, X, HelpCircle, Calendar, Clock, ArrowLeft } from "lucide-react";

/**
 * Page de test pour l'expérience desktop de vote
 *
 * Cette page permet de tester l'interface de vote sur desktop
 * avec des données de démonstration pour voir comment fonctionnent
 * les interactions (clic sur boutons vs drag avec souris)
 *
 * Route de test : /vote-desktop-test
 */

interface DemoOption {
  id: string;
  date: string;
  timeSlots: Array<{ hour: number; minute: number; duration?: number }>;
}

interface VoteType {
  yes: number;
  maybe: number;
  no: number;
}

const VoteDesktopTest: React.FC = () => {
  // Données de démonstration
  const [options] = useState<DemoOption[]>([
    {
      id: "1",
      date: "2025-11-20",
      timeSlots: [{ hour: 14, minute: 0, duration: 60 }],
    },
    {
      id: "2",
      date: "2025-11-21",
      timeSlots: [
        { hour: 10, minute: 0, duration: 60 },
        { hour: 14, minute: 30, duration: 90 },
      ],
    },
    {
      id: "3",
      date: "2025-11-22",
      timeSlots: [{ hour: 16, minute: 0, duration: 60 }],
    },
  ]);

  const [votes, setVotes] = useState<Record<string, VoteType>>({
    "1": { yes: 3, maybe: 1, no: 0 },
    "2": { yes: 5, maybe: 2, no: 1 },
    "3": { yes: 2, maybe: 0, no: 0 },
  });

  const [userVotes, setUserVotes] = useState<Record<string, "yes" | "maybe" | "no" | null>>({});
  const [currentSwipe, setCurrentSwipe] = useState<Record<string, "yes" | "maybe" | "no" | null>>(
    {},
  );

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTimeSlots = (
    timeSlots: Array<{ hour: number; minute: number; duration?: number }>,
  ) => {
    if (!timeSlots || timeSlots.length === 0) return "Toute la journée";
    return timeSlots
      .map((slot) => {
        const start = `${slot.hour.toString().padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")}`;
        const duration = slot.duration || 30;
        const endHour = Math.floor((slot.hour * 60 + slot.minute + duration) / 60);
        const endMinute = (slot.hour * 60 + slot.minute + duration) % 60;
        const end = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
        return `${start} - ${end}`;
      })
      .join(", ");
  };

  const handleVote = (optionId: string, voteType: "yes" | "maybe" | "no") => {
    setUserVotes((prev) => ({ ...prev, [optionId]: voteType }));
    setCurrentSwipe((prev) => ({ ...prev, [optionId]: null }));
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    optionId: string,
  ) => {
    const direction =
      info.offset.x < -100
        ? "yes" // Swipe GAUCHE = OUI
        : info.offset.x > 100
          ? "no" // Swipe DROITE = NON
          : null; // Petit mouvement = PEUT-ÊTRE

    if (direction) {
      handleVote(optionId, direction);
    } else {
      setCurrentSwipe((prev) => ({ ...prev, [optionId]: null }));
    }
  };

  const getTotalVotes = (optionId: string) => {
    const vote = votes[optionId];
    const userVote = userVotes[optionId];
    let total = vote.yes + vote.maybe + vote.no;
    if (userVote) total += 1;
    return total;
  };

  const getVoteCounts = (optionId: string) => {
    const vote = votes[optionId];
    const userVote = userVotes[optionId];
    return {
      yes: vote.yes + (userVote === "yes" ? 1 : 0),
      maybe: vote.maybe + (userVote === "maybe" ? 1 : 0),
      no: vote.no + (userVote === "no" ? 1 : 0),
    };
  };

  const getExistingVoteCounts = (optionId: string) => {
    return votes[optionId];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* En-tête de test */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 mb-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">🧪 Test Expérience Desktop - Page de Vote</h1>
          <p className="text-blue-100 text-sm">
            Cette page permet de tester les interactions desktop (clic sur boutons et drag avec
            souris)
          </p>
          <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm">
            <p className="font-semibold mb-2">📋 Instructions de test :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-50">
              <li>
                <strong>Méthode 1 (principale)</strong> : Cliquez sur les boutons "Oui",
                "Peut-être", "Non"
              </li>
              <li>
                <strong>Méthode 2 (alternative)</strong> : Cliquez-glissez une carte vers la gauche
                (Oui) ou droite (Non)
              </li>
              <li>
                Observez le message actuel :{" "}
                <span className="font-mono bg-black/30 px-2 py-1 rounded">"Swipez pour voter"</span>{" "}
                - est-il adapté ?
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Message actuel (à tester) */}
        <div className="flex items-center justify-between mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white">Options disponibles</h2>
          <div className="text-sm text-gray-400">Swipez pour voter</div>
        </div>

        {/* Options de vote */}
        <div className="space-y-4">
          {options.map((option, index) => {
            const userVote = userVotes[option.id];
            const voteCounts = getVoteCounts(option.id);
            const existingCounts = getExistingVoteCounts(option.id);
            const totalVotes = getTotalVotes(option.id);
            const isSelected = userVote !== null && userVote !== undefined;

            return (
              <motion.div
                key={option.id}
                className="bg-[#1e1e1e] rounded-xl shadow-md p-4 relative border border-gray-700"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(e, info) => handleDragEnd(e, info, option.id)}
                whileTap={{ scale: 0.98 }}
              >
                {/* Flèche d'indication (seulement sur la première option) */}
                {index === 0 && !Object.values(userVotes).some((v) => v !== null) && (
                  <motion.div
                    className="absolute z-20"
                    style={{
                      left: "-50px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      x: [25, 10, 25],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="bg-blue-500/20 border border-blue-300 rounded-full p-2 shadow-lg">
                      <ArrowLeft className="w-4 h-4 text-blue-600" />
                    </div>
                  </motion.div>
                )}

                {/* En-tête de l'option */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white capitalize">
                      {formatDate(option.date)}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-300 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeSlots(option.timeSlots)}</span>
                    </div>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-300 mb-2">
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
                </div>

                {/* Boutons de vote */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Bouton OUI */}
                  <button
                    onClick={() => handleVote(option.id, "yes")}
                    className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
                      userVote === "yes" || currentSwipe[option.id] === "yes"
                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400"
                        : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
                    }`}
                   data-testid="votedesktoptest-button">
                    <div className="flex flex-col items-center text-center relative z-10">
                      <Check
                        className={`w-5 h-5 mb-1 ${
                          userVote === "yes" || currentSwipe[option.id] === "yes"
                            ? "text-blue-700"
                            : "text-blue-600"
                        }`}
                      />
                      {voteCounts.yes > 0 && (
                        <span
                          className={`text-sm font-bold ${
                            userVote === "yes" || currentSwipe[option.id] === "yes"
                              ? "text-blue-700"
                              : "text-blue-600"
                          }`}
                        >
                          {voteCounts.yes}
                        </span>
                      )}
                    </div>
                    {/* Barre de progression */}
                    {totalVotes > 0 && (
                      <div
                        className="absolute inset-0 bg-blue-200/30"
                        style={{
                          transform: `scaleY(${existingCounts.yes / totalVotes})`,
                          transformOrigin: "bottom",
                        }}
                      />
                    )}
                  </button>

                  {/* Bouton PEUT-ÊTRE */}
                  <button
                    onClick={() => handleVote(option.id, "maybe")}
                    className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
                      userVote === "maybe" || currentSwipe[option.id] === "maybe"
                        ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400"
                        : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
                    }`}
                   data-testid="votedesktoptest-button">
                    <div className="flex flex-col items-center text-center relative z-10">
                      <HelpCircle
                        className={`w-5 h-5 mb-1 ${
                          userVote === "maybe" || currentSwipe[option.id] === "maybe"
                            ? "text-orange-700"
                            : "text-orange-600"
                        }`}
                      />
                      {voteCounts.maybe > 0 && (
                        <span
                          className={`text-sm font-bold ${
                            userVote === "maybe" || currentSwipe[option.id] === "maybe"
                              ? "text-orange-700"
                              : "text-orange-600"
                          }`}
                        >
                          {voteCounts.maybe}
                        </span>
                      )}
                    </div>
                    {/* Barre de progression */}
                    {totalVotes > 0 && (
                      <div
                        className="absolute inset-0 bg-orange-200/30"
                        style={{
                          transform: `scaleY(${existingCounts.maybe / totalVotes})`,
                          transformOrigin: "bottom",
                        }}
                      />
                    )}
                  </button>

                  {/* Bouton NON */}
                  <button
                    onClick={() => handleVote(option.id, "no")}
                    className={`relative overflow-hidden rounded-lg p-3 transition-all border-2 ${
                      userVote === "no" || currentSwipe[option.id] === "no"
                        ? "bg-red-50 border-red-500 ring-2 ring-red-400"
                        : "bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a]"
                    }`}
                   data-testid="votedesktoptest-button">
                    <div className="flex flex-col items-center text-center relative z-10">
                      <X
                        className={`w-5 h-5 mb-1 ${
                          userVote === "no" || currentSwipe[option.id] === "no"
                            ? "text-red-700"
                            : "text-red-600"
                        }`}
                      />
                      {voteCounts.no > 0 && (
                        <span
                          className={`text-sm font-bold ${
                            userVote === "no" || currentSwipe[option.id] === "no"
                              ? "text-red-700"
                              : "text-red-600"
                          }`}
                        >
                          {voteCounts.no}
                        </span>
                      )}
                    </div>
                    {/* Barre de progression */}
                    {totalVotes > 0 && (
                      <div
                        className="absolute inset-0 bg-red-200/30"
                        style={{
                          transform: `scaleY(${existingCounts.no / totalVotes})`,
                          transformOrigin: "bottom",
                        }}
                      />
                    )}
                  </button>
                </div>

                {/* Indicateur de vote utilisateur */}
                {isSelected && (
                  <div className="mt-3 text-xs text-center text-gray-400">
                    Votre vote :{" "}
                    <span className="font-semibold text-white capitalize">{userVote}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Zone de feedback */}
        <div className="mt-8 p-6 bg-[#1e1e1e] rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">💬 Feedback de test</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-white mb-1">
                Question 1 : Le message "Swipez pour voter" est-il clair ?
              </p>
              <p className="text-gray-400">
                → Sur desktop, préféreriez-vous "Cliquez sur les boutons pour voter" ?
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">
                Question 2 : Avez-vous découvert le drag avec la souris ?
              </p>
              <p className="text-gray-400">
                → Était-ce intuitif ou avez-vous d'abord utilisé les boutons ?
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">
                Question 3 : Quelle méthode préférez-vous sur desktop ?
              </p>
              <p className="text-gray-400">→ Clic sur boutons ou drag avec souris ?</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteDesktopTest;
