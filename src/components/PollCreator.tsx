import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Calendar as CalendarIconLucide,
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
  Eye,
  Shield,
  User,
} from "lucide-react";
import Calendar from "./Calendar";
import { usePolls, type PollData } from "../hooks/usePolls";
import type { Poll } from "../lib/pollStorage";
import { GoogleCalendarService } from "@/lib/google-calendar";
import {
  CalendarConflictDetector,
  type TimeSlotConflict,
} from "@/services/calendarConflictDetection";
import { CalendarConflictsPanel } from "./calendar/CalendarConflictsPanel";
import { PollCreatorService } from "../services/PollCreatorService";
import { logger } from "../lib/logger";
import { createConversationForPoll } from "../lib/ConversationPollLink";
import type {
  PollCreationState as ServicePollCreationState,
  TimeSlot as ServiceTimeSlot,
} from "../services/PollCreatorService";
import { useAuth } from "../contexts/AuthContext";
// ❌ RETIRÉ: googleCalendar et geminiService - imports inutilisés
import { UserMenu } from "./UserMenu";
import type { DatePollSuggestion } from "../lib/gemini";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { linkPollToConversationBidirectional } from "@/lib/ConversationPollLink";
import { useDragToSelect } from "@/hooks/useDragToSelect";
import { usePollCreatorState } from "@/hooks/usePollCreatorState";
import type { TimeSlot, PollCreationState } from "@/services/PollCreationBusinessLogic";
import { PollSettingsForm } from "./polls/PollSettingsForm";
import { guestEmailService } from "@/lib/guestEmailService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { DatePollSettings } from "@/lib/products/date-polls/date-polls-service";
import { GuestPollSuccessDialog } from "./polls/GuestPollSuccessDialog";
import { SafeguardSection } from "./polls/SafeguardSection";

// Type pour identifier un slot avec sa date (défini en dehors du composant)
interface TimeSlotWithDate {
  date: string;
  hour: number;
  minute: number;
}

// Helper: Formater un slot en clé unique (défini en dehors pour éviter recréation)
const formatSlotKey = (slot: TimeSlotWithDate): string => {
  return `${slot.date}:${slot.hour}-${slot.minute}`;
};

// Helper: Obtenir tous les slots entre deux slots (défini en dehors pour éviter recréation)
const createGetSlotsInRange = (timeGranularity: number) => {
  return (start: TimeSlotWithDate, end: TimeSlotWithDate): TimeSlotWithDate[] => {
    if (start.date !== end.date) {
      return [start];
    }

    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const [earlierMinutes, laterMinutes] =
      startMinutes <= endMinutes ? [startMinutes, endMinutes] : [endMinutes, startMinutes];

    const slots: TimeSlotWithDate[] = [];
    for (let m = earlierMinutes; m <= laterMinutes; m += timeGranularity) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push({ date: start.date, hour: h, minute: min });
    }

    return slots;
  };
};

// Lazy load VoteGrid - utilisé uniquement dans la preview conditionnelle (code actuellement commenté)
const VoteGrid = lazy(() =>
  import("@/components/voting/VoteGrid").then((m) => ({ default: m.VoteGrid })),
);
import { groupConsecutiveDates } from "../lib/date-utils";
import { SettingsPanel, type SettingsTab } from "./ui/SettingsPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PollCreatorProps {
  onBack?: (createdPoll?: Poll) => void;
  onOpenMenu?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    dates?: string[];
    participants?: string[];
    timeSlots?: Array<{
      start: string;
      end: string;
      dates?: string[];
    }>;
    dateGroups?: Array<{
      dates: string[];
      label: string;
      type: "weekend" | "range" | "custom";
    }>;
  };
  withBackground?: boolean;
}

const PollCreator: React.FC<PollCreatorProps> = ({
  onBack,
  onOpenMenu,
  initialData,
  withBackground = false,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { createPoll, loading: pollLoading, error: pollError } = usePolls();
  const { toast } = useToast();

  // Récupérer l'ID du sondage à éditer depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const editPollId = urlParams.get("edit");
  const [createdPollSlug, setCreatedPollSlug] = useState<string | null>(null);
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null);
  const googleCalendarRef = useRef<GoogleCalendarService | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const timeGridRefMobile = useRef<HTMLDivElement>(null); // Grille mobile
  const timeGridRefDesktop = useRef<HTMLDivElement>(null); // Grille desktop
  const targetTimeSlotRefMobile = useRef<HTMLDivElement>(null); // 12:00 mobile
  const targetTimeSlotRefDesktop = useRef<HTMLDivElement>(null); // 12:00 desktop
  const hasAutoScrolled = useRef<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { state, setState, visibleMonths, setVisibleMonths, timeSlotsByDate, setTimeSlotsByDate } =
    usePollCreatorState({
      editPollId,
      initialData,
      toast,
    });

  // État pour la détection de conflits
  const [calendarConflicts, setCalendarConflicts] = useState<TimeSlotConflict[]>([]);
  const [isAnalyzingCalendar, setIsAnalyzingCalendar] = useState(false);

  // État pour les paramètres avancés du sondage
  const [advancedSettings, setAdvancedSettings] = useState<DatePollSettings>({
    showLogo: true,
    requireAuth: false,
    oneResponsePerPerson: false,
    allowEditAfterSubmit: true,
    maxResponses: undefined,
    resultsVisibility: "public",
  });

  const handleAnalyzeCalendar = useCallback(async () => {
    if (!googleCalendarRef.current || state.selectedDates.length === 0) {
      return;
    }

    // Si des créneaux sont activés, on analyse les créneaux.
    // Sinon, on analyse les dates entières (pour les sondages de dates sans horaires).
    const hasEnabledSlots = Object.values(timeSlotsByDate).some((slots) =>
      slots.some((s) => s.enabled),
    );

    if (!hasEnabledSlots && state.showTimeSlots) {
      // Si l'utilisateur a activé l'affichage des horaires mais n'en a sélectionné aucun, on le prévient mais on continue l'analyse (date-only)
      // Ou on pourrait bloquer. Le user dit "il peut y avoir des sondages de dates sans horaires".
      // Donc on continue.
    }

    setIsAnalyzingCalendar(true);

    // Feedback visuel sur le compte utilisé
    if (user?.email) {
      toast({
        title: "Analyse en cours",
        description: `Vérification du calendrier pour ${user.email}...`,
        duration: 2000,
      });
    }

    logger.debug("📊 Démarrage analyse conflits", "calendar", {
      selectedDates: state.selectedDates,
      timeSlotsByDate: Object.keys(timeSlotsByDate).map((date) => ({
        date,
        slots: timeSlotsByDate[date]?.filter((s) => s.enabled).map((s) => `${s.hour}:${s.minute}`),
      })),
      granularity: state.timeGranularity,
      hasEnabledSlots,
    });

    try {
      const detector = new CalendarConflictDetector(googleCalendarRef.current);
      const conflicts = await detector.detectConflicts(
        state.selectedDates,
        timeSlotsByDate,
        state.timeGranularity,
      );
      setCalendarConflicts(conflicts);

      logger.info("✅ Analyse terminée", "calendar", {
        conflictsCount: conflicts.length,
        conflicts: conflicts.map((c) => ({
          date: c.date,
          slot: c.timeSlot ? `${c.timeSlot.hour}:${c.timeSlot.minute}` : "date-only",
          status: c.status,
          eventsCount: c.conflicts.length,
        })),
      });

      // Afficher un toast UNIQUEMENT s'il y a des conflits
      if (conflicts.length > 0) {
        toast({
          title: `${conflicts.length} conflit${conflicts.length > 1 ? "s" : ""} détecté${conflicts.length > 1 ? "s" : ""}`,
          description: "Consultez le panneau des conflits pour les résoudre.",
          variant: "destructive",
          duration: 5000, // 5 secondes pour laisser le temps de lire
        });
      }
      // Si pas de conflits, ne rien afficher (pas besoin de notifier l'absence de problème)
    } catch (error) {
      logger.error("Erreur lors de l'analyse du calendrier", "calendar", error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser votre calendrier. Vérifiez votre connexion.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingCalendar(false);
    }
  }, [
    state.selectedDates,
    timeSlotsByDate,
    state.timeGranularity,
    toast,
    state.showTimeSlots,
    user?.email,
  ]);

  // Détection automatique avec debounce - UNIQUEMENT si le calendrier est connecté
  useEffect(() => {
    // Ne pas analyser si le calendrier n'est pas connecté
    if (!state.calendarConnected || !googleCalendarRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (state.selectedDates.length > 0 && Object.keys(timeSlotsByDate).length > 0) {
        // Vérifier s'il y a des slots activés avant de lancer l'auto-analyse
        const hasEnabledSlots = Object.values(timeSlotsByDate).some((slots) =>
          slots.some((s) => s.enabled),
        );
        if (hasEnabledSlots) {
          handleAnalyzeCalendar();
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [state.selectedDates, timeSlotsByDate, handleAnalyzeCalendar, state.calendarConnected]);

  const handleRemoveConflictSlot = (conflict: TimeSlotConflict) => {
    if (conflict.timeSlot) {
      handleTimeSlotToggle(conflict.date, conflict.timeSlot.hour, conflict.timeSlot.minute);
    } else {
      // Si c'est un conflit de date entière, on retire la date
      toggleDate(conflict.date);
    }
    setCalendarConflicts((prev) => prev.filter((c) => c !== conflict));
  };

  const handleReplaceConflictSlot = (
    conflict: TimeSlotConflict,
    suggestion: { start: string; end: string },
  ) => {
    if (!conflict.timeSlot) return;

    // 1. Désactiver le slot en conflit
    handleTimeSlotToggle(conflict.date, conflict.timeSlot.hour, conflict.timeSlot.minute);

    // 2. Activer le slot suggéré
    const [startHour, startMinute] = suggestion.start.split(":").map(Number);
    handleTimeSlotToggle(conflict.date, startHour, startMinute);

    // 3. Retirer le conflit de la liste
    setCalendarConflicts((prev) => prev.filter((c) => c !== conflict));
  };

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
      // Calculer la date d'expiration par défaut si aucune durée n'est définie
      let expiresAt: string | undefined;

      if (state.expirationDays) {
        expiresAt = new Date(Date.now() + state.expirationDays * 24 * 60 * 60 * 1000).toISOString();
      } else if (state.selectedDates && state.selectedDates.length > 0) {
        // Par défaut : 12 mois après la dernière date de l'événement
        const sortedDates = [...state.selectedDates].sort();
        const lastDateStr = sortedDates[sortedDates.length - 1];

        // Construire une date en milieu de journée locale pour limiter les effets de fuseau
        const [year, month, day] = lastDateStr.split("-").map(Number);
        const eventDate = new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);

        const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
        const expirationDate = new Date(eventDate.getTime() + twelveMonthsMs);
        expiresAt = expirationDate.toISOString();
      }

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
          expiresAt,
          // Paramètres avancés
          ...advancedSettings,
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

        // Déclencher l'écran de succès ou la navigation
        if (!user) {
          setShowSuccessDialog(true);
        } else {
          if (onBack) {
            onBack(result.poll);
          } else {
            handleBackToHome();
          }
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
    setTimeSlotsByDate((prev) =>
      PollCreatorService.handleTimeSlotToggle(
        dateStr,
        hour,
        minute,
        prev,
        state.timeGranularity,
        true, // includeDuration pour PollCreator
      ),
    );
  };

  const getVisibleTimeSlots = () => {
    return PollCreatorService.generateVisibleTimeSlots(
      state.timeGranularity,
      state.showExtendedHours,
    );
  };

  const getTimeSlotBlocks = (dateStr: string) => {
    return PollCreatorService.getTimeSlotBlocks(
      timeSlotsByDate[dateStr] || [],
      state.timeGranularity,
    );
  };

  // Créer getSlotsInRange avec useMemo pour qu'il soit stable (après state)
  const getSlotsInRange = React.useMemo(
    () => createGetSlotsInRange(state.timeGranularity),
    [state.timeGranularity],
  );

  // Drag-to-extend avec le hook réutilisable
  const { isDragging, handleDragStart, handleDragMove, handleDragEnd, isDraggedOver } =
    useDragToSelect<TimeSlotWithDate>({
      onDragEnd: (draggedItems, startSlot) => {
        if (!startSlot || draggedItems.size === 0) {
          return;
        }

        const date = startSlot.date;

        // Activer tous les slots dans le range
        draggedItems.forEach((slotKey) => {
          const parts = slotKey.split(":");
          if (parts.length !== 2) {
            return;
          }
          const [, timeStr] = parts;
          const [hourStr, minuteStr] = timeStr.split("-");
          const hour = parseInt(hourStr);
          const minute = parseInt(minuteStr);

          // Utiliser handleTimeSlotToggle pour activer le slot
          const currentSlot = timeSlotsByDate[date]?.find(
            (s) => s.hour === hour && s.minute === minute,
          );

          // Seulement activer si le slot n'est pas déjà activé
          if (!currentSlot?.enabled) {
            handleTimeSlotToggle(date, hour, minute);
          }
        });
      },
      getItemKey: formatSlotKey,
      getItemsInRange: getSlotsInRange,
      disableOnMobile: false, // Activer aussi sur mobile
    });

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

  // Initialiser le service Google Calendar
  useEffect(() => {
    if (!googleCalendarRef.current) {
      googleCalendarRef.current = new GoogleCalendarService();
    }
  }, [state.calendarConnected]);

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
        <div className="max-w-none w-full">
          <div className="bg-[#0a0a0a] p-4 md:p-6">
            <div className="space-y-6">
              {/* Titre du sondage */}
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
                    logger.info("PollCreator - toggleDate from Calendar", "calendar", {
                      dateStr,
                      beforeCount: state.selectedDates.length,
                      isAlreadySelected: state.selectedDates.includes(dateStr),
                    });
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
                          data-testid="pollcreator-button"
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
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {state.selectedDates.length > 0
                          ? "Vos dates sélectionnées seront synchronisées avec votre calendrier connecté."
                          : "Sélectionnez des dates pour les synchroniser avec votre calendrier."}
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
                        {state.selectedDates.length > 0 && (
                          <button
                            onClick={handleAnalyzeCalendar}
                            disabled={isAnalyzingCalendar || !user}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-600"
                            data-testid="pollcreator-button"
                          >
                            {isAnalyzingCalendar ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyse...
                              </>
                            ) : (
                              <>
                                <CalendarIconLucide className="w-5 h-5" />
                                Analyser disponibilités
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Section horaires - Masquée si les dates forment des groupes (week-ends, semaines, quinzaines) */}
            {(() => {
              // 🔧 PRIORITÉ 1: Utiliser dateGroups fourni par l'IA si disponible
              // PRIORITÉ 2: Sinon, détecter automatiquement les groupes dans les dates sélectionnées
              const dateGroups =
                initialData?.dateGroups || groupConsecutiveDates(state.selectedDates);

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
                        data-testid="pollcreator-button"
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
                            data-testid="pollcreator-button"
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
                                data-testid="pollcreator-button"
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
                            data-testid="pollcreator-annuler-les-changements"
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
                          const dateInfo = PollCreatorService.formatSelectedDateHeader(
                            dateStr,
                            true,
                          );
                          return (
                            <div
                              key={dateStr}
                              className="flex-1 p-1 text-center border-r bg-blue-600 text-white min-w-0"
                            >
                              <div className="text-xs font-medium truncate">{dateInfo.dayName}</div>
                              <div className="text-sm font-bold">{dateInfo.dayNumber}</div>
                              <div className="text-xs opacity-90 truncate">{dateInfo.month}</div>
                            </div>
                          );
                        })}
                        {/* Espace pour compenser la largeur du scrollbar */}
                        <div className="w-0 md:w-3 flex-shrink-0 bg-blue-600" />
                      </div>

                      {/* Créneaux horaires */}
                      <div
                        ref={timeGridRefMobile}
                        className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                        style={{ scrollbarWidth: "thin" }}
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
                            className="flex"
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

                              // Vérifier si ce slot est en cours de drag (MOBILE)
                              const slotKey = formatSlotKey({
                                date: dateStr,
                                hour: timeSlot.hour,
                                minute: timeSlot.minute,
                              });
                              const isSlotDraggedOver = isDraggedOver(slotKey);

                              return (
                                <button
                                  key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                  aria-label={`${timeSlot.label} le ${PollCreatorService.formatSelectedDateHeader(dateStr, true).dayName} ${PollCreatorService.formatSelectedDateHeader(dateStr, true).dayNumber} ${PollCreatorService.formatSelectedDateHeader(dateStr, true).month}`}
                                  data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                  onClick={() =>
                                    handleTimeSlotToggle(dateStr, timeSlot.hour, timeSlot.minute)
                                  }
                                  onPointerDown={(e) => {
                                    handleDragStart(
                                      {
                                        date: dateStr,
                                        hour: timeSlot.hour,
                                        minute: timeSlot.minute,
                                      },
                                      e,
                                    );
                                  }}
                                  onPointerMove={() => {
                                    if (isDragging) {
                                      handleDragMove({
                                        date: dateStr,
                                        hour: timeSlot.hour,
                                        minute: timeSlot.minute,
                                      });
                                    }
                                  }}
                                  onPointerUp={() => {
                                    handleDragEnd();
                                  }}
                                  className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700
                                  ${
                                    isSlotDraggedOver && isDragging
                                      ? "bg-blue-500/50 border-2 border-blue-400"
                                      : slot?.enabled
                                        ? "bg-blue-900/30"
                                        : "bg-[#1e1e1e]"
                                  }
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
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
                          const dateInfo = PollCreatorService.formatSelectedDateHeader(
                            dateStr,
                            false,
                          );
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
                        {/* Espace pour compenser la largeur du scrollbar */}
                        <div className="w-0 md:w-3 flex-shrink-0 bg-blue-600" />
                      </div>

                      {/* Créneaux horaires */}
                      <div
                        ref={timeGridRefDesktop}
                        className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                        style={{ scrollbarWidth: "thin" }}
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
                            className="flex"
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

                              // Vérifier si ce slot est en cours de drag (DESKTOP)
                              const slotKey = formatSlotKey({
                                date: dateStr,
                                hour: timeSlot.hour,
                                minute: timeSlot.minute,
                              });
                              const isSlotDraggedOver = isDraggedOver(slotKey);

                              return (
                                <button
                                  key={`${dateStr}-${timeSlot.hour}-${timeSlot.minute}`}
                                  aria-label={`${timeSlot.label} le ${PollCreatorService.formatSelectedDateHeader(dateStr, false).dayName} ${PollCreatorService.formatSelectedDateHeader(dateStr, false).dayNumber} ${PollCreatorService.formatSelectedDateHeader(dateStr, false).month}`}
                                  data-testid={`time-slot-${String(timeSlot.hour).padStart(2, "0")}-${String(timeSlot.minute).padStart(2, "0")}-col-${colIndex}`}
                                  onClick={() =>
                                    handleTimeSlotToggle(dateStr, timeSlot.hour, timeSlot.minute)
                                  }
                                  onPointerDown={(e) => {
                                    handleDragStart(
                                      {
                                        date: dateStr,
                                        hour: timeSlot.hour,
                                        minute: timeSlot.minute,
                                      },
                                      e,
                                    );
                                  }}
                                  onPointerMove={() => {
                                    if (isDragging) {
                                      handleDragMove({
                                        date: dateStr,
                                        hour: timeSlot.hour,
                                        minute: timeSlot.minute,
                                      });
                                    }
                                  }}
                                  onPointerUp={() => {
                                    handleDragEnd();
                                  }}
                                  className={`flex-1 relative transition-colors hover:bg-[#2a2a2a] border-r border-gray-700
                                  ${
                                    isSlotDraggedOver && isDragging
                                      ? "bg-blue-500/50 border-2 border-blue-400"
                                      : slot?.enabled
                                        ? "bg-blue-900/30"
                                        : "bg-[#1e1e1e]"
                                  }
                                  ${state.timeGranularity >= 60 ? "min-h-[32px] p-1" : "min-h-[24px] p-0.5"}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bouton Afficher plus d'horaires */}
                  <div className="p-3 bg-[#0a0a0a]">
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          showExtendedHours: !prev.showExtendedHours,
                        }))
                      }
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                      data-testid="pollcreator-button"
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

            {/* Panneau de configuration avec onglets */}
            <div className="mt-8" ref={shareRef}>
              <SettingsPanel
                tabs={[
                  {
                    id: "display",
                    label: "Affichage",
                    icon: <Eye className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Paramètres d'affichage */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">Paramètres d'affichage</h3>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Eye className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-white">
                                    Afficher le logo DooDates
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Montrer le branding DooDates sur le formulaire
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={advancedSettings.showLogo ?? true}
                                  onChange={(e) =>
                                    setAdvancedSettings((prev) => ({
                                      ...prev,
                                      showLogo: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "access",
                    label: "Accès",
                    icon: <Shield className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Contrôle d'accès */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">Contrôle d'accès</h3>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-white">Connexion requise</p>
                                  <p className="text-sm text-gray-400">
                                    Les utilisateurs doivent se connecter avec Google
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={advancedSettings.requireAuth ?? false}
                                  onChange={(e) =>
                                    setAdvancedSettings((prev) => ({
                                      ...prev,
                                      requireAuth: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-white">Une réponse par personne</p>
                                  <p className="text-sm text-gray-400">
                                    Prévenir les réponses multiples (cookie)
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={advancedSettings.oneResponsePerPerson ?? false}
                                  onChange={(e) =>
                                    setAdvancedSettings((prev) => ({
                                      ...prev,
                                      oneResponsePerPerson: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Eye className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-white">
                                    Modification après soumission
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Permettre de modifier sa réponse
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={advancedSettings.allowEditAfterSubmit ?? false}
                                  onChange={(e) =>
                                    setAdvancedSettings((prev) => ({
                                      ...prev,
                                      allowEditAfterSubmit: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Limites */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">Limites</h3>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Nombre maximum de réponses
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Illimité"
                              value={advancedSettings.maxResponses || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined;
                                setAdvancedSettings((prev) => ({ ...prev, maxResponses: value }));
                              }}
                              className="w-full px-3 py-2 border border-gray-600 bg-[#1e1e1e] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Laisser vide pour illimité</p>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "visibility",
                    label: "Visibilité",
                    icon: <Eye className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Visibilité des résultats */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">
                            Visibilité des résultats
                          </h3>

                          <div className="space-y-3">
                            {[
                              {
                                value: "creator-only",
                                label: "Créateur uniquement",
                                description: "Seul le créateur peut voir les résultats",
                              },
                              {
                                value: "voters",
                                label: "Participants après vote",
                                description: "Visible après avoir voté",
                              },
                              {
                                value: "public",
                                label: "Public",
                                description: "Tout le monde peut voir les résultats",
                              },
                            ].map((option) => (
                              <div key={option.value} className="flex items-center">
                                <input
                                  type="radio"
                                  id={option.value}
                                  name="resultsVisibility"
                                  value={option.value}
                                  checked={
                                    (advancedSettings.resultsVisibility || "public") ===
                                    option.value
                                  }
                                  onChange={(e) => {
                                    setAdvancedSettings((prev) => ({
                                      ...prev,
                                      resultsVisibility: e.target.value as
                                        | "creator-only"
                                        | "voters"
                                        | "public",
                                    }));
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                                />
                                <label htmlFor={option.value} className="ml-3">
                                  <div className="font-medium text-white">{option.label}</div>
                                  <div className="text-sm text-gray-400">{option.description}</div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "expiration",
                    label: "Expiration",
                    icon: <Clock className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Paramètres d'expiration */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">Expiration du sondage</h3>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-white">
                                    Le sondage expirera après
                                  </p>
                                  <p className="text-sm text-gray-400">Par défaut: 30 jours</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
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
                                  className="w-16 px-2 py-1 border border-gray-600 bg-[#1e1e1e] text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <span className="text-sm text-gray-400">jours</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Suggestion de connexion pour utilisateur non connecté */}
                        {!user && (
                          <div className="p-4 bg-blue-500/5 border border-blue-600 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium">Connexion recommandée</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">
                              Connectez-vous pour gérer vos sondages et accéder à plus de
                              fonctionnalités. Connectez votre calendrier Google Calendar pour une
                              meilleure gestion des créneaux.
                            </p>
                            <button
                              onClick={async () => {
                                // Sauvegarder le brouillon avant la redirection OAuth
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
                                        ? new Date(
                                            Date.now() + state.expirationDays * 24 * 60 * 60 * 1000,
                                          ).toISOString()
                                        : undefined,
                                    },
                                  };
                                  localStorage.setItem("doodates-draft", JSON.stringify(draftData));
                                } catch (error) {
                                  logger.error(
                                    "Erreur lors de la sauvegarde du brouillon",
                                    "poll",
                                    error,
                                  );
                                }

                                const result = await signInWithGoogle();
                                if (result.error) {
                                  toast({
                                    title: "Erreur de connexion",
                                    description:
                                      result.error.message ||
                                      "Impossible de se connecter à Google Calendar.",
                                    variant: "destructive",
                                  });
                                } else {
                                  toast({
                                    title: "Connexion en cours",
                                    description:
                                      "Redirection vers Google pour autoriser l'accès à votre calendrier...",
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                              data-testid="pollcreator-button"
                            >
                              <CalendarIconLucide className="w-4 h-4" />
                              Connecter Google Calendar
                            </button>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "share",
                    label: "Partage",
                    icon: <Share2 className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Affichage utilisateur connecté */}
                        <UserMenu />

                        {/* Emails des participants */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Emails des participants (séparés par des virgules)
                          </label>
                          <textarea
                            value={state.participantEmails}
                            onChange={(e) => handleEmailInput(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-700 bg-[#1e1e1e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                            placeholder="email1@exemple.com, email2@exemple.com"
                          />
                        </div>
                      </div>
                    ),
                  },
                ]}
                defaultTab="display"
                isOpen={state.showSettingsPanel}
                onOpenChange={(open) => setState((prev) => ({ ...prev, showSettingsPanel: open }))}
                title="Paramètres et Partage"
              />
            </div>

            {/* Boutons d'action - Toujours visibles, désactivés si aucune date sélectionnée */}
            <TooltipProvider>
              {/* Safeguard for guest users (RGPD Compliance) */}
              {!user && (
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <SafeguardSection />
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3 justify-end pt-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={
                          !state.pollTitle.trim() || state.selectedDates.length === 0 || pollLoading
                        }
                        className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="pollcreator-enregistrer-le-brouillon"
                      >
                        Enregistrer le brouillon
                      </button>
                    </span>
                  </TooltipTrigger>
                  {(!state.pollTitle.trim() || state.selectedDates.length === 0 || pollLoading) && (
                    <TooltipContent>
                      <p>
                        {!state.pollTitle.trim()
                          ? "Veuillez saisir un titre pour le sondage"
                          : state.selectedDates.length === 0
                            ? "Veuillez sélectionner au moins une date"
                            : "Enregistrement en cours..."}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <button
                        type="button"
                        onClick={handleFinalize}
                        disabled={!canFinalize() || pollLoading}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="pollcreator-button"
                      >
                        {pollLoading ? "Création en cours..." : "Publier le sondage"}
                      </button>
                    </span>
                  </TooltipTrigger>
                  {(!canFinalize() || pollLoading) && (
                    <TooltipContent>
                      <p>
                        {pollLoading
                          ? "Publication en cours..."
                          : !state.pollTitle.trim()
                            ? "Veuillez saisir un titre pour le sondage"
                            : state.selectedDates.length === 0
                              ? "Veuillez sélectionner au moins une date"
                              : "Veuillez remplir tous les champs requis"}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <GuestPollSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          if (onBack && createdPoll) onBack(createdPoll);
          else handleBackToHome();
        }}
        pollUrl={
          createdPoll ? `${window.location.origin}/vote/${createdPoll.slug || createdPoll.id}` : ""
        }
        pollTitle={createdPoll?.title || ""}
      />
    </div>
  );
};

export default PollCreator;
