import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Mail,
  Clock,
  Plus,
  Check,
  AlertCircle,
  Settings,
  Menu,
  Share2,
  Copy,
  Loader2,
} from "lucide-react";
import Calendar from "./Calendar";
import { usePolls, type PollData } from "../hooks/usePolls";
import { PollCreatorService } from "../services/PollCreatorService";
import { logger } from "@/lib/logger";
import type {
  PollCreationState as ServicePollCreationState,
  TimeSlot as ServiceTimeSlot,
} from "../services/PollCreatorService";
import {
  PollCreationBusinessLogic,
  type PollCreationState,
  type TimeSlot,
} from "../services/PollCreationBusinessLogic";
import { useAuth } from "../contexts/AuthContext";
import { googleCalendar } from "../lib/google-calendar";
import { UserMenu } from "./UserMenu";
import { type PollSuggestion } from "../lib/gemini";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { VoteGrid } from "@/components/voting/VoteGrid";
import TopNav from "./TopNav";

interface PollCreatorProps {
  onBack?: () => void;
  onOpenMenu?: () => void;
  initialData?: PollSuggestion;
  withBackground?: boolean;
}

const PollCreator: React.FC<PollCreatorProps> = ({
  onBack,
  onOpenMenu,
  initialData,
  withBackground = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createPoll, loading: pollLoading, error: pollError } = usePolls();

  // Récupérer l'ID du sondage à éditer depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const editPollId = urlParams.get("edit");
  const [createdPollSlug, setCreatedPollSlug] = useState<string | null>(null);
  const [createdPoll, setCreatedPoll] = useState<any>(null);
  const { toast } = useToast();
  const shareRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const canFinalize = () => PollCreatorService.canFinalize(state);
  const handleFinalize = async () => {
    try {
      const result = await createPoll({
        title: state.pollTitle,
        description: null,
        selectedDates: state.selectedDates,
        timeSlotsByDate: timeSlotsByDate,
        participantEmails: state.participantEmails
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean),
        settings: {
          timeGranularity: state.timeGranularity,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: state.notificationsEnabled,
          expiresAt: state.expirationDays
            ? new Date(
                Date.now() + state.expirationDays * 24 * 60 * 60 * 1000,
              ).toISOString()
            : undefined,
        },
      });
      if (result.poll) {
        setCreatedPollSlug(result.poll.slug);
      }
    } catch (error) {
      logger.error('Error creating poll', 'poll', error);
    }
  };
  const toggleDate = (dateString: string) =>
    PollCreatorService.toggleDate(dateString, state.selectedDates, setState);
  const isGranularityCompatible = (
    granularity: number,
    timeSlots: TimeSlot[],
  ) => PollCreatorService.isGranularityCompatible(granularity, timeSlots);
  const handleGranularityChange = (granularity: number) =>
    PollCreatorService.handleGranularityChange(granularity, setState);
  const initialGranularityState = PollCreatorService.initialGranularityState;
  const undoGranularityChange = () =>
    PollCreatorService.undoGranularityChange(setState);
  const validateEmails = (emailString: string) =>
    PollCreatorService.validateEmails(emailString);

  const handleEmailInput = (emailString: string) => {
    setState((prev) => ({
      ...prev,
      participantEmails: emailString,
      emailErrors: PollCreatorService.validateEmails(emailString),
    }));
  };

  const getVisibleTimeSlots = () => {
    const slots = [];
    const startHour = state.showExtendedHours ? 6 : 8;
    const endHour = state.showExtendedHours ? 23 : 20;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += state.timeGranularity) {
        slots.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        });
      }
    }
    return slots;
  };

  const getTimeSlotBlocks = (dateStr: string) => {
    return PollCreatorService.getTimeSlotBlocks(
      timeSlotsByDate[dateStr] || [],
      state.timeGranularity,
    );
  };

  // Fonction pour réinitialiser complètement l'état
  const resetPollState = () => {
    localStorage.removeItem("doodates-draft");
    const initialState = PollCreatorService.initializeWithGeminiData(
      initialData,
    ) as PollCreationState;
    // Vérification de sécurité pour s'assurer que currentMonth est un objet Date valide
    if (
      !(initialState.currentMonth instanceof Date) ||
      isNaN(initialState.currentMonth.getTime())
    ) {
      initialState.currentMonth = new Date();
    }
    setState(initialState);
    setTimeSlotsByDate({});
    setCreatedPollSlug(null);
  };

  // Charger les données du sondage à éditer
  useEffect(() => {
    if (!editPollId) {
      if (!initialData) {
        localStorage.removeItem("doodates-draft");
      }
      return;
    }

    let isMounted = true;

    const loadPollData = async () => {
      try {
        // Nettoyer le draft avant de charger les données
        localStorage.removeItem("doodates-draft");

        const existingPolls = JSON.parse(
          localStorage.getItem("dev-polls") || "[]",
        );
        const pollToEdit = existingPolls.find(
          (poll: any) => poll.id === editPollId,
        );

        if (!pollToEdit || !isMounted) return;

        // Extraire les dates depuis les options du sondage
        const pollDates = [];

        // Méthode 1: Depuis settings.selectedDates
        if (pollToEdit.settings?.selectedDates?.length > 0) {
          pollDates.push(...pollToEdit.settings.selectedDates);
        }

        // Méthode 2: Depuis les options du sondage (mapping ID -> date)
        if (pollDates.length === 0 && pollToEdit.options) {
          pollToEdit.options.forEach((option: any) => {
            if (option.option_date && !pollDates.includes(option.option_date)) {
              pollDates.push(option.option_date);
            }
          });
        }

        // Méthode 3: Fallback - générer des dates par défaut
        if (pollDates.length === 0) {
          const today = new Date();
          for (let i = 0; i < 3; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i + 1);
            pollDates.push(futureDate.toISOString().split("T")[0]);
          }
        }

        // Réinitialiser complètement l'état avec toutes les propriétés requises
        const newState = {
          pollTitle: pollToEdit.title || "",
          selectedDates: pollDates,
          currentMonth: pollDates[0] ? new Date(pollDates[0]) : new Date(),
          showTimeSlots: pollToEdit.settings?.showTimeSlots || false,
          participantEmails: pollToEdit.settings?.participantEmails || "",
          calendarConnected: false,
          timeSlots: [],
          notificationsEnabled: false,
          userEmail: "",
          showCalendarConnect: false,
          showShare: false,
          showDescription: false,
          emailErrors: [],
          showExtendedHours: false,
          timeGranularity: 60,
          showGranularitySettings: false,
          pollLinkCopied: false,
          expirationDays: 30,
          showExpirationSettings: false,
          showCalendarConnection: false,
        };

        if (isMounted) {
          setState(newState);

          // Charger les créneaux horaires si disponibles
          if (pollToEdit.settings?.timeSlotsByDate) {
            setTimeSlotsByDate(pollToEdit.settings.timeSlotsByDate);

            // Activer l'affichage des créneaux horaires si des créneaux existent
            const hasTimeSlots = Object.values(
              pollToEdit.settings.timeSlotsByDate,
            ).some((slots: any) => slots && slots.length > 0);
            if (hasTimeSlots) {
              newState.showTimeSlots = true;
            }
          } else {
            setTimeSlotsByDate({});
          }

          // Charger la granularité temporelle
          if (pollToEdit.settings?.timeGranularity) {
            newState.timeGranularity = pollToEdit.settings.timeGranularity;
          }
        }
      } catch (error) {
        logger.error('Error loading poll data', 'poll', error);
      }
    };

    loadPollData();

    return () => {
      isMounted = false;
    };
  }, [editPollId, initialData]);

  const [state, setState] = useState<PollCreationState>(
    PollCreatorService.initializeWithGeminiData(
      initialData,
    ) as PollCreationState,
  );
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [timeSlotsByDate, setTimeSlotsByDate] = useState<
    Record<string, TimeSlot[]>
  >({});

  // Effet pour s'assurer que les dates sont bien initialisées
  useEffect(() => {
    if (
      initialData?.dates &&
      initialData.dates.length > 0 &&
      (!state.selectedDates.length ||
        JSON.stringify(state.selectedDates) !==
          JSON.stringify(initialData.dates))
    ) {
      setState((prev) => ({
        ...prev,
        selectedDates: initialData.dates,
        showTimeSlots: true,
      }));
    }
  }, [initialData]);

  const copyPollLink = async () => {
    try {
      const baseUrl = import.meta.env.DEV
        ? window.location.origin
        : "https://doodates.app";
      const pollUrl = createdPollSlug
        ? `${baseUrl}/vote/${createdPollSlug}`
        : `${baseUrl}/vote/${state.pollTitle.replace(/\s+/g, "-").toLowerCase() || "nouveau-sondage"}`;

      await navigator.clipboard.writeText(pollUrl);
      setState((prev) => ({ ...prev, pollLinkCopied: true }));

      // Reset après 3 secondes
      setTimeout(() => {
        setState((prev) => ({ ...prev, pollLinkCopied: false }));
      }, 3000);
    } catch (err) {
      logger.error('Erreur lors de la copie', 'poll', err);
    }
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Effet pour activer automatiquement les horaires si des créneaux sont présélectionnés
  useEffect(() => {
    if (!initialData?.timeSlots?.length) return;

    setState((prev) => ({
      ...prev,
      showTimeSlots: true,
      showGranularitySettings: false, // Ne pas ouvrir automatiquement le panneau
    }));
  }, [initialData]);

  // Fonction pour rediriger vers le dashboard
  const handleBackToHome = () => {
    // Get conversation ID from URL parameters (passed from GeminiChatInterface)
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversationId");

    if (conversationId) {
      navigate(`/dashboard?resume=${conversationId}`);
    } else {
      navigate("/dashboard");
    }
  };

  // Fonction pour gérer le clic sur le bouton principal
  const handleMainButtonClick = () => {
    logger.debug('Clic bouton principal', 'poll', {
      createdPollSlug,
      canFinalize: PollCreatorService.canFinalize(state),
      pollLoading,
      label: pollLoading
        ? "Création en cours..."
        : createdPollSlug
          ? "Sondage créé !"
          : state.participantEmails.trim()
            ? "Partager"
            : "Enregistrer",
    });
    if (createdPollSlug) {
      // Si le sondage est créé, rediriger vers le dashboard
      logger.debug('Bouton après création: redirection dashboard', 'poll');
      handleBackToHome();
    } else {
      // Sinon, créer le sondage
      logger.debug('Lancement de handleFinalize (création)', 'poll');
      handleFinalize();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav />
      <div className="p-4 md:p-6 lg:p-8 xl:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 lg:p-8 xl:p-12">
            <div className="space-y-6 md:space-y-8 lg:space-y-10">
              <div className="w-full overflow-hidden">
                <Calendar
                  visibleMonths={visibleMonths}
                  selectedDates={state.selectedDates}
                  onDateToggle={(date: Date) =>
                    toggleDate(date.toISOString().split("T")[0])
                  }
                  onMonthChange={(direction) => {
                    if (direction === "prev") {
                      const prevMonth = new Date(visibleMonths[0]);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      // Ajouter un mois précédent et garder jusqu'à 23 mois
                      setVisibleMonths([
                        prevMonth,
                        ...visibleMonths.slice(0, 23),
                      ]);
                    } else {
                      const nextMonth = new Date(
                        visibleMonths[visibleMonths.length - 1],
                      );
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      // Ajouter un mois suivant et garder jusqu'à 23 mois
                      const twoYearsFromNow = new Date();
                      twoYearsFromNow.setFullYear(
                        twoYearsFromNow.getFullYear() + 2,
                      );
                      if (nextMonth <= twoYearsFromNow) {
                        setVisibleMonths([
                          ...visibleMonths.slice(1),
                          nextMonth,
                        ]);
                      }
                    }
                  }}
                  onMonthsChange={setVisibleMonths}
                />
              </div>

              {state.selectedDates.length > 0 && (
                <div className="space-y-4">
                  {state.showCalendarConnect && !state.calendarConnected && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => {
                            // Sauvegarder l'état actuel avant redirection
                            localStorage.setItem(
                              "doodates-return-to",
                              "create",
                            );
                            localStorage.setItem(
                              "doodates-connect-calendar",
                              "true",
                            );
                            localStorage.setItem(
                              "doodates-poll-draft",
                              JSON.stringify({
                                title: state.pollTitle,
                                selectedDates: state.selectedDates,
                                timeSlotsByDate: timeSlotsByDate,
                                participantEmails: state.participantEmails,
                              }),
                            );
                            // Rediriger vers la page de connexion avec intention calendrier
                            window.location.href = "/auth?connect=calendar";
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                        >
                          Connecter votre calendrier (optionnel)
                        </button>
                        <button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              showCalendarConnect: false,
                            }))
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {state.calendarConnected && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Calendrier Google connecté
                          </span>
                        </div>
                        {state.selectedDates.length > 0 && (
                          <button
                            onClick={() =>
                              PollCreatorService.analyzeCalendarAvailability(
                                state.selectedDates,
                              )
                            }
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                          >
                            📊 Analyser disponibilités
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {state.selectedDates.length > 0
                          ? 'Cliquez sur "Analyser disponibilités" pour suggérer des créneaux libres basés sur votre agenda.'
                          : "Sélectionnez des dates pour analyser vos disponibilités."}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        logger.debug('Bouton Horaires cliqué - toggle showTimeSlots', 'poll');
                        setState((prev) => {
                          const newState = {
                            ...prev,
                            showTimeSlots: !prev.showTimeSlots,
                          };
                          logger.debug('État après clic', 'poll', {
                            selectedDates: prev.selectedDates.length,
                            showTimeSlots: newState.showTimeSlots,
                            conditionMet:
                              prev.selectedDates.length > 0 &&
                              newState.showTimeSlots,
                          });
                          return newState;
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-base border border-gray-300 rounded-lg hover:border-blue-300 transition-colors"
                      data-testid="add-time-slots-button"
                    >
                      <Clock className="w-5 h-5" />
                      Horaires
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section horaires */}
            {state.selectedDates.length > 0 && state.showTimeSlots && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {/* <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Horaires</h3> */}
                </div>

                {/* Paramètres d'expiration */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-800">
                        Expiration du sondage
                      </h3>
                    </div>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showExpirationSettings: !prev.showExpirationSettings,
                        }))
                      }
                      className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                    >
                      {state.showExpirationSettings ? "Masquer" : "Modifier"}
                    </button>
                  </div>

                  {state.showExpirationSettings && (
                    <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-100">
                      <p className="text-sm text-gray-700 mb-3">
                        Définissez la durée de validité de votre sondage. Après
                        cette période, le sondage sera marqué comme expiré.
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={state.expirationDays}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              expirationDays: Math.max(
                                1,
                                Math.min(365, parseInt(e.target.value) || 30),
                              ),
                            }))
                          }
                          className="w-20 px-3 py-2 border border-orange-200 rounded-lg bg-white text-center"
                        />
                        <span className="text-sm text-gray-700">jours</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Par défaut: 30 jours
                      </p>
                    </div>
                  )}
                </div>

                {/* Paramètres de granularité */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">
                        Précision des horaires
                      </h3>
                    </div>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showGranularitySettings:
                            !prev.showGranularitySettings,
                        }))
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {state.showGranularitySettings ? "Masquer" : "Modifier"}
                    </button>
                  </div>

                  {state.showGranularitySettings && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Intervalle entre les créneaux
                        </h4>
                        <button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              showGranularitySettings: false,
                            }))
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: 15, label: "15 min" },
                          { value: 30, label: "30 min" },
                          { value: 60, label: "1 heure" },
                          { value: 120, label: "2 heures" },
                          { value: 240, label: "4 heures" },
                        ].map((option) => {
                          const compatible =
                            PollCreatorService.isGranularityCompatible(
                              option.value,
                              state.timeSlots,
                            );
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                PollCreatorService.handleGranularityChange(
                                  option.value,
                                  setState,
                                )
                              }
                              disabled={!compatible}
                              className={`px-3 py-1 text-sm rounded-full transition-colors
                                ${
                                  state.timeGranularity === option.value
                                    ? "bg-blue-500 text-white"
                                    : compatible
                                      ? "bg-white border border-gray-300 hover:border-blue-300"
                                      : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                                }
                              `}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {PollCreatorService.initialGranularityState && (
                        <button
                          onClick={() =>
                            PollCreatorService.undoGranularityChange(setState)
                          }
                          className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Annuler les changements
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile: Section horaires avec scroll */}
                <div className="md:hidden" data-testid="time-slots-section">
                  <div className="border rounded-lg bg-white overflow-hidden">
                    {/* En-têtes des dates */}
                    <div className="flex bg-gray-50">
                      <div className="w-16 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                        Heure
                      </div>
                      {state.selectedDates.map((dateStr) => {
                        const dateInfo =
                          PollCreatorService.formatSelectedDateHeader(dateStr);
                        return (
                          <div
                            key={dateStr}
                            className="flex-1 p-2 text-center border-r bg-green-600 text-white"
                          >
                            <div className="text-xs font-medium">
                              {dateInfo.dayName}
                            </div>
                            <div className="text-sm font-bold">
                              {dateInfo.dayNumber}
                            </div>
                            <div className="text-xs opacity-90">
                              {dateInfo.month}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Créneaux horaires */}
                    <div
                      className="max-h-48 overflow-y-auto"
                      data-testid="time-slots-grid"
                    >
                      {getVisibleTimeSlots().map((timeSlot) => (
                        <div
                          key={`${timeSlot.hour}-${timeSlot.minute}`}
                          className="flex border-b border-gray-100"
                        >
                          <div className="w-16 p-2 text-xs text-gray-600 flex items-center justify-center border-r bg-gray-50">
                            {timeSlot.label}
                          </div>
                          {state.selectedDates.map((dateStr, colIndex) => {
                            const slot = timeSlotsByDate[dateStr]?.find(
                              (s) =>
                                s.hour === timeSlot.hour &&
                                s.minute === timeSlot.minute,
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
                            const isBlockEnd = blocks.some(
                              (block) =>
                                block.end.hour === timeSlot.hour &&
                                block.end.minute === timeSlot.minute,
                            );
                            const isBlockMiddle =
                              currentBlock && !isBlockStart && !isBlockEnd;

                            return (
                              <button
                                key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                onClick={() =>
                                  PollCreatorService.toggleDate(
                                    dateStr,
                                    state.selectedDates,
                                    setState,
                                  )
                                }
                                className={`flex-1 relative transition-colors hover:bg-gray-50 border-r
                                  ${slot?.enabled ? "bg-green-50" : "bg-white"}
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
                                `}
                              >
                                {slot?.enabled && (
                                  <div
                                    className={`absolute bg-green-500 transition-all
                                    ${isBlockStart && isBlockEnd ? "inset-1 rounded-lg" : ""}
                                    ${isBlockStart && !isBlockEnd ? "inset-x-1 top-1 bottom-0 rounded-t-lg" : ""}
                                    ${isBlockEnd && !isBlockStart ? "inset-x-1 bottom-1 top-0 rounded-b-lg" : ""}
                                    ${isBlockMiddle ? "inset-x-1 top-0 bottom-0" : ""}
                                  `}
                                  >
                                    {isBlockStart && (
                                      <div className="absolute top-0.5 left-0.5 right-0.5">
                                        <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                          {timeSlot.label}
                                        </div>
                                      </div>
                                    )}
                                    {isBlockEnd && (
                                      <div className="absolute bottom-0.5 left-0.5 right-0.5">
                                        <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                          {(() => {
                                            const endMinutes =
                                              timeSlot.hour * 60 +
                                              timeSlot.minute +
                                              state.timeGranularity;
                                            const endHour = Math.floor(
                                              endMinutes / 60,
                                            );
                                            const endMin = endMinutes % 60;
                                            return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
                                          })()}
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
                <div
                  className="hidden md:block"
                  data-testid="time-slots-section"
                >
                  <div className="border rounded-lg bg-white overflow-hidden">
                    {/* En-têtes des dates */}
                    <div className="flex bg-gray-50">
                      <div className="w-16 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                        Heure
                      </div>
                      {state.selectedDates.map((dateStr) => {
                        const dateInfo =
                          PollCreatorService.formatSelectedDateHeader(dateStr);
                        return (
                          <div
                            key={dateStr}
                            className="flex-1 p-2 text-center border-r bg-green-600 text-white"
                          >
                            <div className="text-xs font-medium">
                              {dateInfo.dayName}
                            </div>
                            <div className="text-sm font-bold">
                              {dateInfo.dayNumber}
                            </div>
                            <div className="text-xs opacity-90">
                              {dateInfo.month}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Créneaux horaires */}
                    <div
                      className="max-h-48 overflow-y-auto"
                      data-testid="time-slots-grid"
                    >
                      {getVisibleTimeSlots().map((timeSlot) => (
                        <div
                          key={`${timeSlot.hour}-${timeSlot.minute}`}
                          className="flex border-b border-gray-100"
                        >
                          <div className="w-16 p-2 text-xs text-gray-600 flex items-center justify-center border-r bg-gray-50">
                            {timeSlot.label}
                          </div>
                          {state.selectedDates.map((dateStr, colIndex) => {
                            const slot = timeSlotsByDate[dateStr]?.find(
                              (s) =>
                                s.hour === timeSlot.hour &&
                                s.minute === timeSlot.minute,
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
                            const isBlockEnd = blocks.some(
                              (block) =>
                                block.end.hour === timeSlot.hour &&
                                block.end.minute === timeSlot.minute,
                            );
                            const isBlockMiddle =
                              currentBlock && !isBlockStart && !isBlockEnd;

                            return (
                              <button
                                key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                onClick={() =>
                                  PollCreatorService.toggleDate(
                                    dateStr,
                                    state.selectedDates,
                                    setState,
                                  )
                                }
                                className={`flex-1 relative transition-colors hover:bg-gray-50 border-r
                                  ${slot?.enabled ? "bg-green-50" : "bg-white"}
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
                                `}
                              >
                                {slot?.enabled && (
                                  <div
                                    className={`absolute bg-green-500 transition-all
                                    ${isBlockStart && isBlockEnd ? "inset-1 rounded-lg" : ""}
                                    ${isBlockStart && !isBlockEnd ? "inset-x-1 top-1 bottom-0 rounded-t-lg" : ""}
                                    ${isBlockEnd && !isBlockStart ? "inset-x-1 bottom-1 top-0 rounded-b-lg" : ""}
                                    ${isBlockMiddle ? "inset-x-1 top-0 bottom-0" : ""}
                                  `}
                                  >
                                    {isBlockStart && (
                                      <div className="absolute top-0.5 left-0.5 right-0.5">
                                        <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                          {timeSlot.label}
                                        </div>
                                      </div>
                                    )}
                                    {isBlockEnd && (
                                      <div className="absolute bottom-0.5 left-0.5 right-0.5">
                                        <div className="text-white text-[10px] font-semibold text-center bg-green-600 rounded px-0.5 py-0.5">
                                          {(() => {
                                            const endMinutes =
                                              timeSlot.hour * 60 +
                                              timeSlot.minute +
                                              state.timeGranularity;
                                            const endHour = Math.floor(
                                              endMinutes / 60,
                                            );
                                            const endMin = endMinutes % 60;
                                            return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
                                          })()}
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
                <div className="p-3 bg-gray-50 border-t">
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        showExtendedHours: !prev.showExtendedHours,
                      }))
                    }
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Plus className="w-3 h-3" />
                    <span>
                      {state.showExtendedHours
                        ? "Masquer les horaires étendus"
                        : "Afficher plus d'horaires"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Aperçu en direct du sondage (lecture seule) */}
            {state.selectedDates.length > 0 && (
              <div className="mt-8">
                <div className="bg-white border rounded-2xl shadow-sm">
                  <div className="px-4 py-3 border-b bg-gray-50 rounded-t-2xl">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Aperçu (lecture seule)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Cet aperçu utilise l'interface de vote, mais les
                      interactions sont désactivées.
                    </p>
                  </div>
                  <div className="p-4 pointer-events-none select-none">
                    {(() => {
                      // Construire les options à partir des dates sélectionnées et créneaux activés
                      const previewOptions = state.selectedDates.map(
                        (dateStr, idx) => ({
                          id: `opt-${idx}`,
                          poll_id: "preview",
                          option_date: dateStr,
                          time_slots: (timeSlotsByDate[dateStr] || [])
                            .filter((s) => s.enabled)
                            .map((s) => ({ hour: s.hour, minute: s.minute })),
                          display_order: idx,
                        }),
                      );

                      const emptyVotes: Array<{
                        id: string;
                        poll_id: string;
                        voter_email: string;
                        voter_name: string;
                        selections: Record<string, "yes" | "no" | "maybe">;
                        created_at: string;
                      }> = [];

                      const currentVote: Record<
                        string,
                        "yes" | "no" | "maybe"
                      > = {};
                      const userHasVoted: Record<string, boolean> = {};

                      return (
                        <VoteGrid
                          options={previewOptions}
                          votes={emptyVotes}
                          currentVote={currentVote}
                          userHasVoted={userHasVoted}
                          onVoteChange={() => {
                            /* lecture seule */
                          }}
                          onHaptic={() => {
                            /* désactivé */
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton Partager - Toujours visible */}
            <div className="mt-8">
              <button
                onClick={() => {
                  setState((prev) => ({ ...prev, showShare: true }));
                  // Scroll vers la section partage après un délai pour permettre le rendu
                  setTimeout(() => {
                    shareRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 100);
                }}
                className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white flex items-center justify-center gap-3 transition-all duration-200 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                data-testid="share-poll-button"
              >
                <Share2 className="w-5 h-5" />
                <span>Partager</span>
              </button>
            </div>

            {/* Section partage accessible depuis le bouton principal */}
            {state.showShare && (
              <div ref={shareRef} className="p-6 bg-gray-50 rounded-lg">
                <div className="space-y-6">
                  {/* Affichage utilisateur connecté */}
                  <UserMenu />

                  {/* Paramètres d'expiration */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-gray-800">
                          Expiration du sondage
                        </h3>
                      </div>
                      <button
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            showExpirationSettings:
                              !prev.showExpirationSettings,
                          }))
                        }
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        {state.showExpirationSettings ? "Masquer" : "Modifier"}
                      </button>
                    </div>

                    {state.showExpirationSettings && (
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-700 mb-3">
                          Le sondage expirera après :
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={state.expirationDays}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                expirationDays: parseInt(e.target.value) || 30,
                              }))
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="text-sm text-gray-700">jours</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Par défaut: 30 jours
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre du sondage{" "}
                        <span className="text-gray-400 text-sm">
                          (optionnel)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={state.pollTitle}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            pollTitle: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="Ex: Réunion équipe marketing"
                        data-testid="poll-title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emails des participants (séparés par des virgules)
                      </label>
                      <textarea
                        value={state.participantEmails}
                        onChange={(e) => handleEmailInput(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                        placeholder="email1@exemple.com, email2@exemple.com"
                      />
                    </div>
                  </div>

                  {/* Suggestion de connexion pour utilisateur non connecté */}
                  {!user && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Connexion recommandée
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Connectez-vous pour gérer vos sondages et accéder à plus
                        de fonctionnalités.
                      </p>
                      <button
                        onClick={() => (window.location.href = "/auth")}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Se connecter maintenant
                      </button>
                    </div>
                  )}

                  {/* Affichage des erreurs */}
                  {pollError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Erreur</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1 break-words">
                        {pollError}
                      </p>
                    </div>
                  )}

                  {/* Affichage des erreurs d'email */}
                  {state.emailErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Emails invalides
                        </span>
                      </div>
                      <ul className="text-sm text-red-700 mt-1 list-disc list-inside break-words">
                        {state.emailErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Succès de création */}
                  {createdPollSlug && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Sondage créé avec succès !
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Votre sondage est maintenant disponible à l'adresse :
                      </p>
                      <div className="mt-2 p-2 bg-white border border-green-200 rounded text-sm font-mono text-green-900 break-all">
                        {import.meta.env.DEV
                          ? "http://localhost:8080"
                          : "https://doodates.app"}
                        /vote/{createdPollSlug}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          onClick={copyPollLink}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                          title="Copier le lien du sondage"
                        >
                          <Copy className="w-4 h-4" />
                          <span>
                            {state.pollLinkCopied
                              ? "✓ Copié"
                              : "Copier le lien"}
                          </span>
                        </button>
                        <button
                          onClick={handleMainButtonClick}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                          title="Créer un nouveau sondage"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Nouveau sondage</span>
                        </button>
                      </div>
                      {state.notificationsEnabled &&
                        state.participantEmails && (
                          <div className="mt-2 text-sm text-green-700">
                            📧 Emails envoyés aux participants (
                            {
                              state.participantEmails
                                .split(",")
                                .filter(
                                  (email) =>
                                    email.trim() &&
                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                      email.trim(),
                                    ),
                                ).length
                            }{" "}
                            destinataires)
                          </div>
                        )}

                      {/* Lien d'administration pour sondages anonymes */}
                      {!user && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800 mb-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              🔑 Lien d'administration (sondage anonyme)
                            </span>
                          </div>
                          <p className="text-xs text-orange-700 mb-2">
                            Gardez ce lien pour gérer votre sondage (modifier,
                            supprimer) :
                          </p>
                          <div className="flex gap-2">
                            <div className="flex-1 p-2 bg-white border border-orange-200 rounded text-xs font-mono text-orange-900 break-all">
                              {import.meta.env.DEV
                                ? "http://localhost:8080"
                                : "https://doodates.app"}
                              /poll/{createdPollSlug}/results
                            </div>
                            <button
                              onClick={() => {
                                const adminUrl = `${import.meta.env.DEV ? "http://localhost:8080" : "https://doodates.app"}/poll/${createdPollSlug}/results`;
                                navigator.clipboard.writeText(adminUrl);
                                toast({
                                  title: "Lien copié !",
                                  description:
                                    "Le lien d'administration a été copié dans le presse-papiers.",
                                });
                              }}
                              className="px-3 py-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 rounded border border-orange-300 transition-colors flex-shrink-0"
                            >
                              📋 Copier
                            </button>
                          </div>
                          <p className="text-xs text-orange-600 mt-2">
                            ⚠️ <strong>Important :</strong> Sauvegardez ce lien
                            ! Sans compte, c'est le seul moyen de gérer votre
                            sondage.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aide pour les exigences */}
                  {!canFinalize() && !pollLoading && !createdPollSlug && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">
                        Pour créer le sondage :
                      </p>
                      <ul className="space-y-1">
                        {state.emailErrors.length > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                            <span>Corrigez les emails invalides</span>
                          </li>
                        )}
                        {state.selectedDates.length === 0 && (
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                            <span>Sélectionnez au moins une date</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handleMainButtonClick}
                      disabled={
                        createdPollSlug ? false : !canFinalize() || pollLoading
                      }
                      className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                        createdPollSlug
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:bg-green-700 cursor-pointer"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {pollLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {createdPollSlug && !pollLoading && (
                        <Check className="w-5 h-5" />
                      )}
                      <span>
                        {pollLoading
                          ? "Création en cours..."
                          : createdPollSlug
                            ? "Sondage créé !"
                            : state.participantEmails.trim()
                              ? "Partager"
                              : "Enregistrer"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollCreator;
