import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
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
import type { Poll, PollOption } from "../lib/pollStorage";
import { PollCreatorService } from "../services/PollCreatorService";
import { logger } from "../lib/logger";
import { createConversationForPoll } from "../lib/ConversationPollLink";
import {
  convertGeminiSlotsToTimeSlotsByDate,
  calculateOptimalGranularity,
} from "../services/TimeSlotConverter";
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
// ❌ RETIRÉ: googleCalendar et geminiService - imports inutilisés
import { UserMenu } from "./UserMenu";
import type { DatePollSuggestion } from "../lib/gemini";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { linkPollToConversationBidirectional } from "@/lib/ConversationPollLink";
// Lazy load VoteGrid - utilisé uniquement dans la preview conditionnelle (code actuellement commenté)
const VoteGrid = lazy(() =>
  import("@/components/voting/VoteGrid").then((m) => ({ default: m.VoteGrid })),
);
import { groupConsecutiveDates } from "../lib/date-utils";

interface PollCreatorProps {
  onBack?: (createdPoll?: Poll) => void;
  onOpenMenu?: () => void;
  initialData?: DatePollSuggestion;
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
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null);
  const { toast } = useToast();
  const shareRef = useRef<HTMLDivElement>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const timeGridRefMobile = useRef<HTMLDivElement>(null); // Grille mobile
  const timeGridRefDesktop = useRef<HTMLDivElement>(null); // Grille desktop
  const targetTimeSlotRefMobile = useRef<HTMLDivElement>(null); // 12:00 mobile
  const targetTimeSlotRefDesktop = useRef<HTMLDivElement>(null); // 12:00 desktop
  const hasAutoScrolled = useRef<boolean>(false);

  // Helper functions
  const canFinalize = () => PollCreatorService.canFinalize(state);

  const handleSaveDraft = async () => {
    // Pour l'instant, on sauvegarde en localStorage directement
    // TODO: Implémenter un vrai système de brouillon avec status="draft"
    try {
      const draftData = {
        title: state.pollTitle,
        selectedDates: state.selectedDates,
        timeSlotsByDate: timeSlotsByDate,
        participantEmails: state.participantEmails,
        settings: {
          timeGranularity: state.timeGranularity,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: state.notificationsEnabled,
          expiresAt: state.expirationDays
            ? new Date(Date.now() + state.expirationDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        },
      };

      localStorage.setItem("doodates-draft", JSON.stringify(draftData));

      toast({
        title: "Brouillon enregistré",
        description: "Votre sondage a été sauvegardé en brouillon.",
      });
    } catch (error) {
      logger.error("Error saving draft", "poll", error);
    }
  };

  const handleFinalize = async () => {
    try {
      const result = await createPoll({
        type: "date",
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
            ? new Date(Date.now() + state.expirationDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        },
      });

      logger.debug("createPoll result", "poll", {
        hasPoll: !!result.poll,
        hasError: !!result.error,
        error: result.error,
      });

      if (result.error) {
        logger.error("Poll creation failed", "poll", { error: result.error });
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.poll) {
        setCreatedPollSlug(result.poll.slug);
        setCreatedPoll(result.poll);

        // Lier bidirectionnellement le sondage à la conversation (Session 1 - Architecture centrée conversations)
        const urlParams = new URLSearchParams(window.location.search);
        const conversationId = urlParams.get("conversationId");

        if (conversationId) {
          // Poll créé via IA → Lier à la conversation existante
          linkPollToConversationBidirectional(conversationId, result.poll.id, "date");
        } else {
          // Poll créé manuellement → Créer une conversation vide (Session 2)
          createConversationForPoll(result.poll.id, result.poll.title, "date");
          logger.info("✅ Conversation vide créée pour poll manuel", "poll", {
            pollId: result.poll.id,
          });
        }

        // Déclencher l'écran de succès via onBack
        logger.debug("Poll created, calling onBack", "poll", {
          hasOnBack: !!onBack,
          pollId: result.poll.id,
          pollSlug: result.poll.slug,
        });
        if (onBack) {
          onBack(result.poll);
        } else {
          logger.warn("onBack not provided, cannot show success screen", "poll");
        }
      } else {
        logger.error("No poll in result and no error", "poll", { result });
      }
    } catch (error) {
      logger.error("Error creating poll", "poll", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du sondage.",
        variant: "destructive",
      });
    }
  };
  const toggleDate = (dateString: string) =>
    PollCreatorService.toggleDate(dateString, state.selectedDates, setState);
  const isGranularityCompatible = (granularity: number, timeSlots: TimeSlot[]) =>
    PollCreatorService.isGranularityCompatible(granularity, timeSlots);
  const handleGranularityChange = (granularity: number) =>
    PollCreatorService.handleGranularityChange(granularity, setState);
  const initialGranularityState = PollCreatorService.initialGranularityState;
  const undoGranularityChange = () => PollCreatorService.undoGranularityChange(setState);
  const validateEmails = (emailString: string) => PollCreatorService.validateEmails(emailString);

  const handleEmailInput = (emailString: string) => {
    setState((prev) => ({
      ...prev,
      participantEmails: emailString,
      emailErrors: PollCreatorService.validateEmails(emailString),
    }));
  };

  const handleTimeSlotToggle = (dateStr: string, hour: number, minute: number) => {
    setTimeSlotsByDate((prev) => {
      const currentSlots = prev[dateStr] || [];
      const clickedMinutes = hour * 60 + minute;

      const existingSlotIndex = currentSlots.findIndex(
        (s) => s.hour === hour && s.minute === minute,
      );

      if (existingSlotIndex >= 0) {
        // Slot existe → Toggle enabled
        const newSlots = [...currentSlots];
        newSlots[existingSlotIndex] = {
          ...newSlots[existingSlotIndex],
          enabled: !newSlots[existingSlotIndex].enabled,
        };

        return {
          ...prev,
          [dateStr]: newSlots,
        };
      } else {
        // Slot n'existe pas → Vérifier si adjacent à un bloc existant
        // adjacentAfter : Y a-t-il un slot juste APRÈS le clic ? (clic avant le bloc)
        const adjacentAfter = currentSlots.find(
          (s) => s.hour * 60 + s.minute === clickedMinutes + state.timeGranularity && s.enabled,
        );
        // adjacentBefore : Y a-t-il un slot juste AVANT le clic ? (clic après le bloc)
        const adjacentBefore = currentSlots.find(
          (s) => s.hour * 60 + s.minute === clickedMinutes - state.timeGranularity && s.enabled,
        );

        if (adjacentBefore || adjacentAfter) {
          // Adjacent à un bloc → Étendre le bloc
          const newSlot = {
            hour,
            minute,
            duration: state.timeGranularity,
            enabled: true,
          };

          return {
            ...prev,
            [dateStr]: [...currentSlots, newSlot],
          };
        } else {
          // Isolé → Créer nouveau slot
          const newSlot = {
            hour,
            minute,
            duration: state.timeGranularity,
            enabled: true,
          };

          return {
            ...prev,
            [dateStr]: [...currentSlots, newSlot],
          };
        }
      }
    });
  };

  const getVisibleTimeSlots = () => {
    const slots = [];
    const startHour = 8;
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

        const existingPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]") as Poll[];
        const pollToEdit = existingPolls.find((poll) => poll.id === editPollId);

        if (!pollToEdit || !isMounted) return;

        // Extraire les dates depuis les options du sondage
        const pollDates = [];

        // Méthode 1: Depuis settings.selectedDates
        if (pollToEdit.settings?.selectedDates?.length > 0) {
          pollDates.push(...pollToEdit.settings.selectedDates);
        }

        // Méthode 2: Depuis les options du sondage (mapping ID -> date)
        if (pollDates.length === 0 && pollToEdit.options) {
          (pollToEdit.options as PollOption[]).forEach((option) => {
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
            const hasTimeSlots = Object.values(pollToEdit.settings.timeSlotsByDate || {}).some(
              (slots) => slots && Array.isArray(slots) && slots.length > 0,
            );
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
        logger.error("Error loading poll data", "poll", error);
      }
    };

    loadPollData();

    return () => {
      isMounted = false;
    };
  }, [editPollId, initialData]);

  const [state, setState] = useState<PollCreationState>(
    PollCreatorService.initializeWithGeminiData(initialData) as PollCreationState,
  );
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [timeSlotsByDate, setTimeSlotsByDate] = useState<Record<string, TimeSlot[]>>({});

  // Initialize visible months on mount
  useEffect(() => {
    if (visibleMonths.length === 0) {
      // Si on a des dates initiales, commencer par le mois de la première date
      let startDate = new Date();

      if (initialData?.dates && initialData.dates.length > 0) {
        const firstDate = new Date(initialData.dates[0]);
        if (!isNaN(firstDate.getTime())) {
          startDate = firstDate;
        }
      }

      const months: Date[] = [];
      for (let i = 0; i < 6; i++) {
        const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        months.push(month);
      }
      setVisibleMonths(months);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // Intentionnel : visibleMonths.length changerait à chaque render, on veut seulement initialData

  // Effet pour s'assurer que les dates sont bien initialisées
  useEffect(() => {
    if (
      initialData?.dates &&
      initialData.dates.length > 0 &&
      (!state.selectedDates.length ||
        JSON.stringify(state.selectedDates) !== JSON.stringify(initialData.dates))
    ) {
      setState((prev) => ({
        ...prev,
        selectedDates: initialData.dates,
        showTimeSlots: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // Intentionnel : state.selectedDates changerait à chaque render, on compare via JSON.stringify

  // Effet séparé pour initialiser les timeSlots
  useEffect(() => {
    if (!initialData?.timeSlots || initialData.timeSlots.length === 0) {
      return;
    }

    // Utiliser le service de conversion (code réutilisé et testé)
    // Utiliser granularité 30 min par défaut pour la grille
    const convertedTimeSlots = convertGeminiSlotsToTimeSlotsByDate(
      initialData.timeSlots,
      initialData.dates || [],
      30, // Granularité fixe 30 min pour compatibilité grille
    );

    setTimeSlotsByDate(convertedTimeSlots);

    // Calculer la granularité optimale (code réutilisé)
    const optimalGranularity = calculateOptimalGranularity(convertedTimeSlots);

    // Ouvrir automatiquement le panneau de précision des horaires
    setState((prev) => ({
      ...prev,
      showGranularitySettings: true,
      timeGranularity: optimalGranularity,
    }));
  }, [initialData]);

  // Fonction helper pour scroller vers une heure spécifique
  const scrollToTime = useCallback((hour: number, minute: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const mobileContainer = timeGridRefMobile.current;
          const desktopContainer = timeGridRefDesktop.current;

          let container: HTMLElement | null = null;

          if (mobileContainer && mobileContainer.offsetParent !== null) {
            container = mobileContainer;
          } else if (desktopContainer && desktopContainer.offsetParent !== null) {
            container = desktopContainer;
          }

          if (!container) return;

          const targetTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
          const children = Array.from(container.children);
          const targetElement = children.find((child) =>
            child.textContent?.includes(targetTime),
          ) as HTMLElement;

          if (!targetElement) return;

          // Calculer l'index et scroller
          const index = children.indexOf(targetElement);
          const elementHeight = targetElement.offsetHeight;
          const elementPosition = index * elementHeight;
          const scrollTop = elementPosition - container.clientHeight / 2 + elementHeight / 2;

          container.scrollTop = Math.max(0, scrollTop);
        }, 1000);
      });
    });
  }, []);

  // Scroller automatiquement vers la première heure sélectionnée
  useEffect(() => {
    if (hasAutoScrolled.current) return;
    if (state.selectedDates.length === 0) return;

    // Trouver la première heure sélectionnée dans timeSlotsByDate
    const allSlots = Object.values(timeSlotsByDate).flat();
    if (allSlots.length === 0) {
      // Fallback: chercher dans state.timeSlots
      if (!state.timeSlots || state.timeSlots.length === 0) return;

      // Trouver le premier créneau ACTIVÉ (enabled: true)
      const enabledSlots = state.timeSlots.filter((slot) => slot.enabled);
      if (enabledSlots.length === 0) return;

      const firstEnabledSlot = enabledSlots[0];
      hasAutoScrolled.current = true;
      scrollToTime(firstEnabledSlot.hour, firstEnabledSlot.minute);
      return;
    }

    // Trier par heure pour trouver le premier
    const sortedSlots = allSlots.sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });

    const firstSlot = sortedSlots[0];
    hasAutoScrolled.current = true;
    scrollToTime(firstSlot.hour, firstSlot.minute);
  }, [state.selectedDates, state.timeSlots, timeSlotsByDate, scrollToTime]);

  const copyPollLink = async () => {
    try {
      const baseUrl = import.meta.env.DEV ? window.location.origin : "https://doodates.app";
      const pollUrl = createdPollSlug
        ? `${baseUrl}/vote/${createdPollSlug}`
        : `${baseUrl}/vote/${state.pollTitle.replace(/\s+/g, "-").toLowerCase() || "nouveau-sondage"}`;

      // Fallback pour environnements non-sécurisés (HTTP local)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pollUrl);
      } else {
        // Fallback: créer un input temporaire
        const textArea = document.createElement("textarea");
        textArea.value = pollUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setState((prev) => ({ ...prev, pollLinkCopied: true }));

      // Reset après 3 secondes
      setTimeout(() => {
        setState((prev) => ({ ...prev, pollLinkCopied: false }));
      }, 3000);
    } catch (err) {
      logger.error("Erreur lors de la copie", "poll", err);
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

  // Fonction pour rediriger vers le dashboard
  const handleBackToHome = () => {
    // Si onBack est fourni, l'appeler avec le poll créé
    if (onBack) {
      onBack(createdPoll);
      return;
    }

    // Sinon, navigation par défaut
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversationId");

    if (conversationId) {
      navigate(`/dashboard?resume=${conversationId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="bg-[#0a0a0a]">
      <div className="px-4 md:px-6 pb-32 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0a0a0a] p-4 md:p-6">
            <div className="space-y-6">
              {/* Titre du sondage - En haut */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre du sondage <span className="text-red-400 text-sm">*</span>
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
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-white placeholder-gray-500"
                  placeholder="Ex: Réunion équipe marketing"
                  data-testid="poll-title"
                  required
                />
              </div>

              <div className="w-full overflow-hidden">
                <Calendar
                  visibleMonths={visibleMonths}
                  selectedDates={state.selectedDates}
                  onDateToggle={(date: Date) => {
                    // Convertir en string YYYY-MM-DD en heure locale (pas UTC)
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const dateStr = `${year}-${month}-${day}`;
                    toggleDate(dateStr);
                  }}
                  onMonthChange={(direction) => {
                    if (direction === "prev") {
                      // Supprimer le dernier mois et ajouter un mois au début
                      const prevMonth = new Date(visibleMonths[0]);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setVisibleMonths([prevMonth, ...visibleMonths.slice(0, -1)]);
                    } else {
                      // Supprimer le premier mois et ajouter un mois à la fin
                      const nextMonth = new Date(visibleMonths[visibleMonths.length - 1]);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      const twoYearsFromNow = new Date();
                      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
                      if (nextMonth <= twoYearsFromNow) {
                        setVisibleMonths([...visibleMonths.slice(1), nextMonth]);
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
                            localStorage.setItem("doodates-return-to", "create");
                            localStorage.setItem("doodates-connect-calendar", "true");
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
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Calendrier Google connecté</span>
                        </div>
                        {state.selectedDates.length > 0 && (
                          <button
                            onClick={() =>
                              PollCreatorService.analyzeCalendarAvailability(state.selectedDates)
                            }
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            📊 Analyser disponibilités
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {state.selectedDates.length > 0
                          ? 'Cliquez sur "Analyser disponibilités" pour suggérer des créneaux libres basés sur votre agenda.'
                          : "Sélectionnez des dates pour analyser vos disponibilités."}
                      </p>
                    </div>
                  )}

                  {/* Bouton Horaires - Masqué si les dates forment des groupes */}
                  {(() => {
                    const dateGroups = groupConsecutiveDates(state.selectedDates);
                    const hasGroupedDates = dateGroups.some((group) => group.dates.length > 1);

                    // Ne pas afficher le bouton si les dates sont groupées
                    if (hasGroupedDates) {
                      return null;
                    }

                    return (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            logger.debug("Bouton Horaires cliqué - toggle showTimeSlots", "poll");
                            setState((prev) => {
                              const newState = {
                                ...prev,
                                showTimeSlots: !prev.showTimeSlots,
                              };
                              logger.debug("État après clic", "poll", {
                                selectedDates: prev.selectedDates.length,
                                showTimeSlots: newState.showTimeSlots,
                                conditionMet:
                                  prev.selectedDates.length > 0 && newState.showTimeSlots,
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
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Section horaires - Masquée si les dates forment des groupes (week-ends, semaines, quinzaines) */}
            {(() => {
              // Détecter si les dates sélectionnées forment des groupes RÉELS
              const dateGroups = groupConsecutiveDates(state.selectedDates);
              // Ne masquer que si c'est un vrai groupe (weekend, week, fortnight)
              // Pas si ce sont juste des dates consécutives individuelles
              const hasGroupedDates = dateGroups.some(
                (group) => group.type && ["weekend", "week", "fortnight"].includes(group.type),
              );

              // Si des dates sont groupées, ne pas afficher la section horaires
              if (hasGroupedDates) {
                return null;
              }

              // Sinon, afficher normalement si conditions remplies
              return state.selectedDates.length > 0 && state.showTimeSlots ? (
                <div className="space-y-3" data-testid="time-slots-section">
                  <div className="flex items-center gap-2">
                    {/* <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Horaires</h3> */}
                  </div>

                  {/* Paramètres d'expiration - SUPPRIMÉ (doublon) */}

                  {/* Paramètres de granularité */}
                  <div ref={timeSlotsRef} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-white">Précision des horaires</h3>
                      </div>
                      <button
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            showGranularitySettings: !prev.showGranularitySettings,
                          }))
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {state.showGranularitySettings ? "Masquer" : "Modifier"}
                      </button>
                    </div>

                    {state.showGranularitySettings && (
                      <div className="mb-4 p-4 bg-[#0a0a0a] rounded-lg">
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
                            const compatible = PollCreatorService.isGranularityCompatible(
                              option.value,
                              state.timeSlots,
                            );
                            return (
                              <button
                                key={option.value}
                                onClick={() =>
                                  PollCreatorService.handleGranularityChange(option.value, setState)
                                }
                                disabled={!compatible}
                                className={`px-3 py-1 text-sm rounded-full transition-colors
                                ${
                                  state.timeGranularity === option.value
                                    ? "bg-blue-500 text-white"
                                    : compatible
                                      ? "bg-[#1e1e1e] border border-gray-700 hover:border-blue-500 text-white"
                                      : "bg-[#0a0a0a] border border-gray-800 text-gray-600 cursor-not-allowed"
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
                            onClick={() => PollCreatorService.undoGranularityChange(setState)}
                            className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Annuler les changements
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile: Section horaires avec scroll */}
                  <div className="md:hidden" data-testid="time-slots-section-mobile">
                    <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden">
                      {/* En-têtes des dates */}
                      <div className="flex bg-[#0a0a0a]">
                        <div className="w-16 p-2 text-xs font-medium text-gray-300 flex items-center justify-center border-r border-gray-700">
                          Heure
                        </div>
                        {state.selectedDates.map((dateStr) => {
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
                      <div
                        ref={timeGridRefMobile}
                        className="max-h-48 overflow-y-auto"
                        data-testid="time-slots-grid-mobile"
                      >
                        {getVisibleTimeSlots().map((timeSlot) => (
                          <div
                            key={`${timeSlot.hour}-${timeSlot.minute}`}
                            data-time-hour={timeSlot.hour}
                            ref={
                              timeSlot.hour === 12 && timeSlot.minute === 0
                                ? targetTimeSlotRefMobile
                                : null
                            }
                            className="flex border-b border-gray-100"
                          >
                            <div className="w-16 p-2 text-xs text-gray-300 flex items-center justify-center border-r border-gray-700 bg-[#0a0a0a]">
                              {timeSlot.label}
                            </div>
                            {state.selectedDates.map((dateStr, colIndex) => {
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
                              // isBlockEnd : dernière ligne VISIBLE du bloc (pas forcément block.end exact)
                              const isBlockEnd =
                                currentBlock &&
                                // Soit c'est exactement la fin du bloc
                                ((currentBlock.end.hour === timeSlot.hour &&
                                  currentBlock.end.minute === timeSlot.minute) ||
                                  // Soit c'est la dernière ligne enabled avant la fin
                                  (timeSlot.hour * 60 + timeSlot.minute <
                                    currentBlock.end.hour * 60 + currentBlock.end.minute &&
                                    timeSlot.hour * 60 + timeSlot.minute + state.timeGranularity >=
                                      currentBlock.end.hour * 60 + currentBlock.end.minute));
                              const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;

                              return (
                                <button
                                  key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                  data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                  onClick={() =>
                                    handleTimeSlotToggle(dateStr, timeSlot.hour, timeSlot.minute)
                                  }
                                  className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700
                                  ${slot?.enabled ? "bg-blue-900/30" : "bg-[#1e1e1e]"}
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
                                `}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Section horaires avec scroll */}
                  <div className="hidden md:block" data-testid="time-slots-section-desktop">
                    <div className="border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden">
                      {/* En-têtes des dates */}
                      <div className="flex bg-[#0a0a0a]">
                        <div className="w-16 p-2 text-xs font-medium text-gray-300 flex items-center justify-center border-r border-gray-700">
                          Heure
                        </div>
                        {state.selectedDates.map((dateStr) => {
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
                      <div
                        ref={timeGridRefDesktop}
                        className="max-h-48 overflow-y-auto"
                        data-testid="time-slots-grid-desktop"
                      >
                        {getVisibleTimeSlots().map((timeSlot) => (
                          <div
                            key={`${timeSlot.hour}-${timeSlot.minute}`}
                            data-time-hour={timeSlot.hour}
                            ref={
                              timeSlot.hour === 12 && timeSlot.minute === 0
                                ? targetTimeSlotRefDesktop
                                : null
                            }
                            className="flex border-b border-gray-100"
                          >
                            <div className="w-16 p-2 text-xs text-gray-300 flex items-center justify-center border-r border-gray-700 bg-[#0a0a0a]">
                              {timeSlot.label}
                            </div>
                            {state.selectedDates.map((dateStr, colIndex) => {
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
                              // isBlockEnd : dernière ligne VISIBLE du bloc (pas forcément block.end exact)
                              const isBlockEnd =
                                currentBlock &&
                                // Soit c'est exactement la fin du bloc
                                ((currentBlock.end.hour === timeSlot.hour &&
                                  currentBlock.end.minute === timeSlot.minute) ||
                                  // Soit c'est la dernière ligne enabled avant la fin
                                  (timeSlot.hour * 60 + timeSlot.minute <
                                    currentBlock.end.hour * 60 + currentBlock.end.minute &&
                                    timeSlot.hour * 60 + timeSlot.minute + state.timeGranularity >=
                                      currentBlock.end.hour * 60 + currentBlock.end.minute));
                              const isBlockMiddle = currentBlock && !isBlockStart && !isBlockEnd;

                              return (
                                <button
                                  key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                  data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                  onClick={() =>
                                    handleTimeSlotToggle(dateStr, timeSlot.hour, timeSlot.minute)
                                  }
                                  className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700
                                  ${slot?.enabled ? "bg-blue-900/30" : "bg-[#1e1e1e]"}
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
                                `}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bouton Afficher plus d'horaires */}
                  <div className="p-3 bg-[#0a0a0a] border-t border-gray-700">
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
              ) : null;
            })()}

            {/* Aperçu en direct du sondage (lecture seule) - MASQUÉ 
            {state.selectedDates.length > 0 && (
              <div className="mt-8">
                <div className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-700 bg-[#0a0a0a] rounded-t-2xl">
                    <h3 className="text-sm font-semibold text-gray-800">Aperçu (lecture seule)</h3>
                    <p className="text-xs text-gray-500">
                      Cet aperçu utilise l'interface de vote, mais les interactions sont
                      désactivées.
                    </p>
                  </div>
                  <div className="p-4 pointer-events-none select-none">
                    {(() => {
                      // Construire les options à partir des dates sélectionnées et créneaux activés
                      const previewOptions = state.selectedDates.map((dateStr, idx) => ({
                        id: `opt-${idx}`,
                        poll_id: "preview",
                        option_date: dateStr,
                        time_slots: (timeSlotsByDate[dateStr] || [])
                          .filter((s) => s.enabled)
                          .map((s) => ({ hour: s.hour, minute: s.minute })),
                        display_order: idx,
                      }));

                      const emptyVotes: Array<{
                        id: string;
                        poll_id: string;
                        voter_email: string;
                        voter_name: string;
                        selections: Record<string, "yes" | "no" | "maybe">;
                        created_at: string;
                      }> = [];

                      const currentVote: Record<string, "yes" | "no" | "maybe"> = {};
                      const userHasVoted: Record<string, boolean> = {};

                      return (
                        <VoteGrid
                          options={previewOptions}
                          votes={emptyVotes}
                          currentVote={currentVote}
                          userHasVoted={userHasVoted}
                          onVoteChange={() => {}}
                          onHaptic={() => {}}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            */}

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
                className="w-full py-4 px-6 rounded-2xl font-semibold text-lg text-white flex items-center justify-center transition-all duration-200 bg-blue-500 hover:bg-blue-600 shadow-lg"
                data-testid="share-poll-button"
              >
                <span>Partager</span>
              </button>
            </div>

            {/* Section partage accessible depuis le bouton principal */}
            {state.showShare && (
              <div ref={shareRef} className="p-6 bg-[#0a0a0a] rounded-lg">
                <div className="space-y-6">
                  {/* Affichage utilisateur connecté */}
                  <UserMenu />

                  {/* Paramètres d'expiration */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-white">Expiration du sondage</h3>
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
                      <div className="p-4 bg-orange-900/20 rounded-lg">
                        <p className="text-sm text-gray-300 mb-3">Le sondage expirera après :</p>
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
                            className="w-16 px-2 py-1 border border-orange-700 bg-[#1e1e1e] text-white rounded text-center"
                          />
                          <span className="text-sm text-gray-300">jours</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Par défaut: 30 jours</p>
                      </div>
                    )}
                  </div>
                  <div>
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
                    <div className="p-4 bg-blue-500/5 border border-blue-600 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Connexion recommandée</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Connectez-vous pour gérer vos sondages et accéder à plus de fonctionnalités.
                      </p>
                      {/* TODO: Implémenter AuthModal ici */}
                    </div>
                  )}

                  {/* Affichage des erreurs */}
                  {pollError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Erreur</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1 break-words">{pollError}</p>
                    </div>
                  )}

                  {/* Affichage des erreurs d'email */}
                  {state.emailErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Emails invalides</span>
                      </div>
                      <ul className="text-sm text-red-700 mt-1 list-disc list-inside break-words">
                        {state.emailErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Aide pour les exigences */}
                  {!canFinalize() && !pollLoading && !createdPollSlug && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">Pour créer le sondage :</p>
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

                  {/* Boutons d'action - Style cohérent avec FormEditor */}
                  <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={
                        !state.pollTitle.trim() || state.selectedDates.length === 0 || pollLoading
                      }
                      className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalize}
                      disabled={!canFinalize() || pollLoading}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pollLoading ? "Création en cours..." : "Finaliser"}
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
