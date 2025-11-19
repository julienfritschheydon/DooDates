import React, { useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { logger } from "../lib/logger";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarProps {
  visibleMonths: Date[];
  selectedDates: string[];
  onDateToggle: (date: Date) => void;
  onMonthChange: (direction: "prev" | "next") => void;
  onMonthsChange?: (months: Date[]) => void;
}

interface CalendarDay {
  date: Date | null;
  isCurrentMonth: boolean;
  isEmpty: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  visibleMonths,
  selectedDates,
  onDateToggle,
  onMonthChange,
  onMonthsChange,
}) => {
  // Timer optimisé pour éviter les conflits
  const timerId = logger.time("Calendar - Rendu total", "calendar");
  logger.log(
    `Calendar - Début du rendu (${visibleMonths.length} mois, ${selectedDates.length} dates sélectionnées)`,
    "calendar",
  );

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const calendarRef = useRef<HTMLDivElement>(null);

  // Mise en cache des jours du calendrier avec useMemo
  const generateCalendarDays = useMemo(() => {
    const memoTimerId = logger.time("Calendar - useMemo generateCalendarDays", "calendar");

    const result = (monthDate: Date): CalendarDay[] => {
      const dayTimerId = logger.time("Calendar - Génération des jours d'un mois", "calendar");
      // Générer seulement les jours du mois en cours
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Convertir getDay() (0=Dim, 1=Lun) vers position dans notre grille (0=Lun, 6=Dim)
      let firstDayOfWeek = firstDay.getDay(); // 0=Dim, 1=Lun, 2=Mar, etc.
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0=Lun, 1=Mar, ..., 6=Dim

      const days = [];

      // Espaces vides au début pour aligner correctement le premier jour
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ date: null, isCurrentMonth: false, isEmpty: true });
      }

      // Jours du mois en cours seulement
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const currentDate = new Date(year, month, i);
        days.push({ date: currentDate, isCurrentMonth: true, isEmpty: false });
      }

      logger.timeEnd(dayTimerId);
      return days;
    };
    logger.timeEnd(memoTimerId);
    return result;
  }, []); // Pas de dépendances car c'est une fonction pure

  const renderCalendarGrid = (month: Date, isMobile: boolean = false) => {
    const days = generateCalendarDays(month);

    return (
      <div className="space-y-2">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 px-2 py-2 bg-[#0a0a0a] rounded-lg">
          {weekDays.map((day) => (
            <div
              key={day}
              className={`text-center text-gray-400 py-1 font-medium ${
                isMobile ? "text-sm" : "text-sm"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {days.map(({ date, isCurrentMonth, isEmpty }, index) => {
            // Si c'est une case vide, on affiche juste un espace
            if (isEmpty || !date) {
              return (
                <div key={`empty-${index}`} className={`${isMobile ? "w-9 h-9" : "w-10 h-10"}`} />
              );
            }

            const year = date.getFullYear();
            const monthNum = (date.getMonth() + 1).toString().padStart(2, "0");
            const dayStr = date.getDate().toString().padStart(2, "0");
            const dateStr = `${year}-${monthNum}-${dayStr}`;
            const isSelected = selectedDates.includes(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();
            const isPastDay = date < today;

            return (
              <motion.button
                key={`${dateStr}-${isSelected ? "selected" : "unselected"}`}
                initial={{
                  scale: 1,
                  boxShadow: "0 0 0 0 rgba(37, 99, 235, 0)",
                }}
                animate={
                  isSelected
                    ? {
                        scale: [1, 1.15, 1, 1.05, 1, 1.05, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(37, 99, 235, 0)",
                          "0 0 0 4px rgba(37, 99, 235, 0.4)",
                          "0 0 0 8px rgba(37, 99, 235, 0)",
                          "0 0 0 4px rgba(37, 99, 235, 0.4)",
                          "0 0 0 8px rgba(37, 99, 235, 0)",
                          "0 0 0 4px rgba(37, 99, 235, 0.4)",
                          "0 0 0 0 rgba(37, 99, 235, 0)",
                        ],
                      }
                    : { scale: 1, boxShadow: "0 0 0 0 rgba(37, 99, 235, 0)" }
                }
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation(); // Empêcher la propagation du clic au parent
                  if (!isPastDay) {
                    onDateToggle(date);
                  }
                }}
                onPointerDown={(e) => {
                  e.stopPropagation(); // Empêcher le drag du parent
                }}
                disabled={isPastDay}
                data-date={dateStr}
                className={`${isMobile ? "w-9 h-9" : "w-10 h-10"} text-sm rounded-lg transition-all duration-200 font-medium flex items-center justify-center touch-none
                  ${
                    isPastDay
                      ? "text-gray-600 bg-[#1e1e1e] cursor-not-allowed"
                      : isSelected
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : isToday
                          ? "bg-blue-900/30 text-blue-400 border-2 border-blue-700 hover:bg-blue-900/50"
                          : "text-gray-300 hover:bg-[#2a2a2a]"
                  }`}
                style={{ touchAction: "none" }}
              >
                {date.getDate()}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  // Gestion du scroll avec lazy loading pour desktop
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;

    // Charger plus de mois si on approche de la fin (jusqu'à 60 mois = 5 ans)
    if (scrollWidth - scrollLeft <= clientWidth + 200 && visibleMonths.length < 60) {
      const lastMonth = visibleMonths[visibleMonths.length - 1];

      // Charger 3 mois à la fois pour navigation plus fluide
      const newMonths: Date[] = [];
      for (let i = 1; i <= 3; i++) {
        const nextMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1);

        // Vérifier qu'on ne dépasse pas 5 ans depuis AUJOURD'HUI (dynamique)
        // Ex: En 2025 → jusqu'en 2030, En 2028 → jusqu'en 2033, etc.
        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

        if (nextMonth <= fiveYearsFromNow) {
          newMonths.push(nextMonth);
        }
      }

      if (newMonths.length > 0 && onMonthsChange) {
        onMonthsChange([...visibleMonths, ...newMonths]);
      }
    }
  };

  // Terminer le timer principal avant le rendu
  logger.timeEnd(timerId);

  return (
    <div className="w-full" data-testid="calendar">
      {/* Mobile: Un seul mois avec navigation */}
      <div className="block md:hidden">
        {visibleMonths.length > 0 && (
          <div className="border border-gray-700 rounded-lg p-3 bg-[#1e1e1e] overflow-hidden">
            {/* Navigation mobile */}
            <TooltipProvider>
              <div className="flex items-center justify-between mb-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onMonthChange("prev")}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Mois précédent"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-300" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mois précédent</p>
                  </TooltipContent>
                </Tooltip>

                <AnimatePresence mode="wait">
                  <motion.h3
                    key={visibleMonths[0]?.getTime()}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-semibold text-white"
                  >
                    {visibleMonths[0]?.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </motion.h3>
                </AnimatePresence>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onMonthChange("next")}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mois suivant</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Calendrier avec swipe - SOLUTION CRITIQUE */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={visibleMonths[0]?.getTime()}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.3}
                  dragMomentum={false}
                  onDragEnd={(_, info) => {
                    const threshold = 75; // Seuil plus élevé pour éviter les swipes accidentels
                    const velocity = Math.abs(info.velocity.x);

                    // Prendre en compte la vélocité ET la distance
                    if ((info.offset.x > threshold && velocity > 100) || info.offset.x > 120) {
                      // Swipe vers la droite = mois précédent
                      onMonthChange("prev");
                    } else if (
                      (info.offset.x < -threshold && velocity > 100) ||
                      info.offset.x < -120
                    ) {
                      // Swipe vers la gauche = mois suivant
                      onMonthChange("next");
                    }
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  className="select-none touch-pan-x"
                  style={{
                    // Empêcher le scroll vertical pendant le drag horizontal
                    touchAction: "pan-x",
                  }}
                >
                  {renderCalendarGrid(visibleMonths[0], true)}
                </motion.div>
              </AnimatePresence>

              {/* Indicateurs visuels de swipe */}
              <div className="absolute top-1/2 left-2 transform -translate-y-1/2 opacity-30 pointer-events-none">
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </div>
              <div className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-30 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Scroll avec navigation par flèches */}
      <TooltipProvider>
        <div className="hidden md:block relative">
          {/* Flèche gauche - positionnée au niveau des titres des mois */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onMonthChange("prev")}
                className="absolute left-2 top-6 z-20 bg-[#1e1e1e]/90 backdrop-blur-sm hover:bg-[#2a2a2a] shadow-lg rounded-full p-2 transition-all border border-gray-700 hover:shadow-xl"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-5 h-5 text-gray-300" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mois précédent</p>
            </TooltipContent>
          </Tooltip>

          {/* Flèche droite - positionnée au niveau des titres des mois */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onMonthChange("next")}
                className="absolute right-2 top-6 z-20 bg-[#1e1e1e]/90 backdrop-blur-sm hover:bg-[#2a2a2a] shadow-lg rounded-full p-2 transition-all border border-gray-700 hover:shadow-xl"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mois suivant</p>
            </TooltipContent>
          </Tooltip>

          <div
            ref={calendarRef}
            onScroll={handleScroll}
            className="overflow-x-auto border border-gray-700 rounded-lg bg-[#1e1e1e]"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex gap-4 min-w-max px-16 py-3">
              {visibleMonths.map((month, index) => (
                <motion.div
                  key={`${month.getFullYear()}-${month.getMonth()}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-none w-80"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Titre du mois */}
                  <div className="mb-3 text-center">
                    <h3 className="text-lg font-semibold text-white">
                      {month.toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                  </div>

                  {renderCalendarGrid(month, false)}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Calendar;
