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
import { useAuth } from "../contexts/AuthContext";
import { googleCalendar } from "../lib/google-calendar";
import { UserMenu } from "./UserMenu";
import { type PollSuggestion } from "../lib/gemini";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}

interface PollCreationState {
  selectedDates: string[];
  currentMonth: Date;
  calendarConnected: boolean;
  pollTitle: string;
  participantEmails: string;
  showTimeSlots: boolean;
  timeSlots: TimeSlot[];
  notificationsEnabled: boolean;
  userEmail: string;
  showCalendarConnect: boolean;
  showShare: boolean;
  showDescription: boolean;
  emailErrors: string[];
  showExtendedHours: boolean;
  timeGranularity: number;
  showGranularitySettings: boolean;
  pollLinkCopied: boolean;
  expirationDays: number;
  showExpirationSettings: boolean;
}

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

  // Fonction pour réinitialiser complètement l'état
  const resetPollState = () => {
    localStorage.removeItem("doodates-draft");
    const initialState = initializeWithGeminiData();
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
    if (editPollId) {
      console.log("🔄 Mode édition détecté pour l'ID:", editPollId);
      // Nettoyer le draft avant de charger les données
      localStorage.removeItem("doodates-draft");

      const existingPolls = JSON.parse(
        localStorage.getItem("dev-polls") || "[]",
      );
      const pollToEdit = existingPolls.find(
        (poll: any) => poll.id === editPollId,
      );

      if (pollToEdit) {
        console.log("📝 Chargement du sondage à éditer:", pollToEdit);

        // Extraire les dates depuis les options du sondage
        const pollDates = [];

        // Méthode 1: Depuis settings.selectedDates
        if (pollToEdit.settings?.selectedDates?.length > 0) {
          console.log(
            "📅 Méthode 1: Dates trouvées dans settings.selectedDates:",
            pollToEdit.settings.selectedDates,
          );
          pollDates.push(...pollToEdit.settings.selectedDates);
        }

        // Méthode 2: Depuis les options du sondage (mapping ID -> date)
        if (pollDates.length === 0 && pollToEdit.options) {
          console.log("📅 Méthode 2: Extraction depuis poll.options...");
          pollToEdit.options.forEach((option: any) => {
            if (option.option_date && !pollDates.includes(option.option_date)) {
              pollDates.push(option.option_date);
            }
          });
          console.log("📅 Dates extraites depuis options:", pollDates);
        }

        // Méthode 3: Fallback - générer des dates par défaut
        if (pollDates.length === 0) {
          console.log("📅 Méthode 3: Génération de dates par défaut...");
          const today = new Date();
          for (let i = 0; i < 3; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i + 1);
            pollDates.push(futureDate.toISOString().split("T")[0]);
          }
        }

        console.log("📅 Dates finales extraites pour l'édition:", pollDates);

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
        };

        setState(newState);

        // Charger les créneaux horaires si disponibles
        if (pollToEdit.settings?.timeSlotsByDate) {
          console.log(
            "⏰ Chargement des créneaux horaires:",
            pollToEdit.settings.timeSlotsByDate,
          );
          setTimeSlotsByDate(pollToEdit.settings.timeSlotsByDate);

          // Activer l'affichage des créneaux horaires si des créneaux existent
          const hasTimeSlots = Object.values(
            pollToEdit.settings.timeSlotsByDate,
          ).some((slots: any) => slots && slots.length > 0);
          if (hasTimeSlots) {
            console.log("⏰ Activation de l'affichage des créneaux horaires");
            newState.showTimeSlots = true;
          }
        } else {
          setTimeSlotsByDate({});
        }

        // Charger la granularité temporelle
        if (pollToEdit.settings?.timeGranularity) {
          console.log(
            "⚙️ Chargement de la granularité:",
            pollToEdit.settings.timeGranularity,
          );
          newState.timeGranularity = pollToEdit.settings.timeGranularity;
        }
      }
    } else if (!initialData) {
      console.log("🧹 Nouveau sondage : nettoyage du draft");
      localStorage.removeItem("doodates-draft");
    }
  }, [editPollId]);

  const initializeWithGeminiData = (): PollCreationState => {
    if (!initialData) {
      return {
        selectedDates: [],
        currentMonth: new Date(),
        calendarConnected: false,
        pollTitle: "",
        participantEmails: "",
        showTimeSlots: false,
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
      };
    }

    // Définir le mois initial comme le premier mois des dates sélectionnées
    let initialMonth = new Date();
    if (initialData.dates && initialData.dates.length > 0) {
      try {
        const parsedDate = new Date(initialData.dates[0]);
        if (!isNaN(parsedDate.getTime()) && parsedDate instanceof Date) {
          // Check if date is valid
          initialMonth = parsedDate;
        }
      } catch (error) {
        console.error("Error parsing initial date:", error);
        // Garantir que initialMonth reste un objet Date valide
        initialMonth = new Date();
      }
    }

    return {
      selectedDates: initialData.dates || [],
      currentMonth: initialMonth,
      calendarConnected: false,
      pollTitle: initialData.title || "",
      participantEmails: "",
      showTimeSlots:
        initialData.type === "datetime" &&
        initialData.timeSlots &&
        initialData.timeSlots.length > 0
          ? true
          : false,
      timeSlots: initialData.timeSlots
        ? initialData.timeSlots.map((slot) => {
            // Convert start time string (e.g. "09:00") to hour and minute
            const startParts = slot.start.split(":").map(Number);
            return {
              hour: startParts[0] || 0,
              minute: startParts[1] || 0,
              enabled: true,
            };
          })
        : [],
      notificationsEnabled: false,
      userEmail: "",
      showCalendarConnect: false,
      showShare: false,
      showDescription: false,
      emailErrors: [],
      showExtendedHours: false,
      timeGranularity:
        initialData.timeSlots && initialData.timeSlots.length > 0 ? 60 : 60, // Default to 60 minutes
      showGranularitySettings: false,
      pollLinkCopied: false,
      expirationDays: 30,
      showExpirationSettings: false,
    };
  };

  const [state, setState] = useState<PollCreationState>(
    initializeWithGeminiData(),
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
      console.log("🔄 Mise à jour des dates sélectionnées depuis initialData");
      setState((prev) => ({
        ...prev,
        selectedDates: initialData.dates,
        showTimeSlots: true,
      }));
    }

    // Vérifier si le mois actuel correspond aux dates sélectionnées
    if (
      state.selectedDates.length > 0 &&
      state.currentMonth &&
      state.currentMonth instanceof Date
    ) {
      try {
        const firstSelectedDate = new Date(state.selectedDates[0]);
        if (!isNaN(firstSelectedDate.getTime())) {
          const currentMonthStart = new Date(
            state.currentMonth.getFullYear(),
            state.currentMonth.getMonth(),
            1,
          );

          if (
            firstSelectedDate.getMonth() !== currentMonthStart.getMonth() ||
            firstSelectedDate.getFullYear() !== currentMonthStart.getFullYear()
          ) {
            setState((prev) => ({
              ...prev,
              currentMonth: firstSelectedDate,
            }));
          }
        } else {
          console.error(
            "Invalid date format in selectedDates:",
            state.selectedDates[0],
          );
        }
      } catch (error) {
        console.error("Error processing selected date:", error);
      }
    }
  }, [initialData, state.selectedDates]);

  const [initialGranularityState, setInitialGranularityState] = useState<{
    granularity: number;
    timeSlots: Record<string, TimeSlot[]>;
  } | null>(null);
  const [previousGranularityState, setPreviousGranularityState] = useState<{
    granularity: number;
    timeSlots: Record<string, TimeSlot[]>;
  } | null>(null);

  const shareRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    // Déterminer le mois de départ basé sur les données initiales ou la date actuelle
    let startMonth = new Date();

    if (initialData?.dates && initialData.dates.length > 0) {
      try {
        const firstSelectedDate = new Date(initialData.dates[0]);
        if (!isNaN(firstSelectedDate.getTime())) {
          startMonth = firstSelectedDate;
          console.log(
            "📅 Mois de départ basé sur la première date sélectionnée:",
            startMonth.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            }),
          );
        }
      } catch (error) {
        console.error("Error parsing initial date for visible months:", error);
      }
    }

    const months: Date[] = [];

    // Générer 3 mois à partir du mois de départ
    for (let i = 0; i < 3; i++) {
      const month = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + i,
        1,
      );
      months.push(month);
    }

    console.log(
      "📅 Mois générés (optimisé):",
      months.map((m) =>
        m.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      ),
    );
    setVisibleMonths(months);
  }, [initialData]);

  // Nouvel effet pour présélectionner les dates
  useEffect(() => {
    if (initialData?.dates && initialData.dates.length > 0) {
      console.log("🎯 Présélection des dates:", initialData.dates);

      // PROTECTION CRITIQUE : Filtrer les dates passées dans initialData
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const validDates = initialData.dates.filter((dateStr) => {
        const isValid = dateStr >= todayStr;
        if (!isValid) {
          console.warn(
            `🚫 Date passée éliminée dans PollCreator: ${dateStr} (avant ${todayStr})`,
          );
        }
        return isValid;
      });

      if (validDates.length > 0) {
        console.log(
          `✅ Dates pré-sélectionnées validées: ${validDates.length}/${initialData.dates.length} dates futures`,
        );
        setState((prev) => ({
          ...prev,
          selectedDates: validDates,
          showTimeSlots: true,
        }));
      } else {
        console.warn(
          "🚨 Toutes les dates initiales étaient passées, aucune pré-sélection",
        );
      }
    }
  }, [initialData]);

  // Effet pour gérer les créneaux horaires - optimisé avec useMemo
  useEffect(() => {
    if (initialData?.timeSlots && initialData.timeSlots.length > 0) {
      console.log(
        "⏰ Configuration des créneaux horaires:",
        initialData.timeSlots,
      );

      // Délai pour permettre le rendu initial
      const timeoutId = setTimeout(() => {
        const newTimeSlotsByDate: Record<string, TimeSlot[]> = {};

        // Optimisation: générer les créneaux seulement pour les heures pertinentes
        initialData.dates.forEach((dateStr) => {
          const slots: TimeSlot[] = [];

          // Déterminer la plage d'heures nécessaire basée sur les créneaux Gemini
          let minHour = 7; // Heure par défaut
          let maxHour = 22; // Heure par défaut

          if (initialData.timeSlots) {
            const hours = initialData.timeSlots.flatMap((slot) => {
              const [startHour] = slot.start.split(":").map(Number);
              const [endHour] = slot.end.split(":").map(Number);
              return [startHour, endHour];
            });

            if (hours.length > 0) {
              minHour = Math.max(Math.min(...hours) - 1, 0);
              maxHour = Math.min(Math.max(...hours) + 1, 23);
            }
          }

          // Générer seulement les créneaux dans la plage pertinente
          for (let hour = minHour; hour <= maxHour; hour++) {
            for (let minute = 0; minute < 60; minute += state.timeGranularity) {
              slots.push({ hour, minute, enabled: false });
            }
          }
          newTimeSlotsByDate[dateStr] = slots;
        });

        // Activer les créneaux basés sur les suggestions Gemini
        initialData.timeSlots.forEach((geminiSlot) => {
          const [startHour, startMinute] = geminiSlot.start
            .split(":")
            .map(Number);
          const [endHour, endMinute] = geminiSlot.end.split(":").map(Number);

          // Déterminer les dates auxquelles appliquer ce créneau
          const targetDates = geminiSlot.dates || initialData.dates;

          console.log(
            `🎯 Activation créneau ${geminiSlot.start}-${geminiSlot.end} pour dates:`,
            targetDates,
          );

          targetDates.forEach((dateStr) => {
            if (newTimeSlotsByDate[dateStr]) {
              // Activer tous les créneaux dans la plage
              newTimeSlotsByDate[dateStr].forEach((slot) => {
                const slotTime = slot.hour * 60 + slot.minute;
                const startTime = startHour * 60 + startMinute;
                const endTime = endHour * 60 + endMinute;

                if (slotTime >= startTime && slotTime < endTime) {
                  slot.enabled = true;
                  console.log(
                    `✅ Activé pour ${dateStr}: ${slot.hour}:${slot.minute.toString().padStart(2, "0")}`,
                  );
                }
              });
            }
          });
        });

        setTimeSlotsByDate(newTimeSlotsByDate);
      }, 100); // Petit délai pour permettre le rendu initial

      return () => clearTimeout(timeoutId);
    }
  }, [initialData?.timeSlots, initialData?.dates, state.timeGranularity]);

  useEffect(() => {
    const newTimeSlotsByDate: Record<string, TimeSlot[]> = {};
    state.selectedDates.forEach((dateStr) => {
      if (!timeSlotsByDate[dateStr]) {
        newTimeSlotsByDate[dateStr] = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          minute: 0,
          enabled: false,
        }));
      } else {
        newTimeSlotsByDate[dateStr] = timeSlotsByDate[dateStr];
      }
    });
    setTimeSlotsByDate(newTimeSlotsByDate);
  }, [state.selectedDates]);

  useEffect(() => {
    const autoSave = setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Ne pas filtrer les dates futures, même si elles sont dans la même période de l'année
      const validDates = state.selectedDates;

      if (validDates.length > 0 || state.pollTitle || state.participantEmails) {
        const cleanState = {
          ...state,
          selectedDates: validDates,
        };
        localStorage.setItem("doodates-draft", JSON.stringify(cleanState));
      } else {
        localStorage.removeItem("doodates-draft");
      }
    }, 1000);
    return () => clearTimeout(autoSave);
  }, [state]);

  // Restaurer le brouillon après connexion (une seule fois au montage)
  useEffect(() => {
    const pollDraft = localStorage.getItem("doodates-poll-draft");
    if (pollDraft && !initialData) {
      try {
        const draftData = JSON.parse(pollDraft);
        if (draftData.title || draftData.selectedDates?.length > 0) {
          setState((prev) => ({
            ...prev,
            pollTitle: draftData.title || "",
            selectedDates: draftData.selectedDates || [],
            participantEmails: draftData.participantEmails || "",
          }));
          setTimeSlotsByDate(draftData.timeSlotsByDate || {});
          localStorage.removeItem("doodates-poll-draft");
          console.log(
            "📋 Brouillon restauré avec",
            draftData.selectedDates?.length || 0,
            "dates",
          );
        } else {
          // Brouillon vide, le supprimer
          localStorage.removeItem("doodates-poll-draft");
        }
      } catch (error) {
        console.error("Erreur lors de la restauration du brouillon:", error);
        localStorage.removeItem("doodates-poll-draft");
      }
    }
  }, []); // Exécuter une seule fois au montage

  // Vérifier la connexion calendrier automatiquement (une seule fois)
  useEffect(() => {
    if (user && !state.calendarConnected) {
      const timer = setTimeout(() => {
        connectCalendar("google");
      }, 1000); // Délai pour éviter les conflits
      return () => clearTimeout(timer);
    }
  }, [user]); // Enlever state.calendarConnected des dépendances pour éviter les boucles

  // Utiliser un ref pour éviter les re-exécutions
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    // Ne charger le draft qu'une seule fois et pas en mode édition
    if (draftLoadedRef.current || editPollId) return;
    draftLoadedRef.current = true;

    const draft = localStorage.getItem("doodates-draft");
    if (draft && initialData) {
      // On ne charge le draft que si on a des données initiales
      try {
        const parsed = JSON.parse(draft);
        console.log("📝 Draft trouvé dans localStorage:", {
          dates: parsed.selectedDates,
          title: parsed.pollTitle,
        });

        // Ne pas filtrer les dates si elles viennent des données initiales
        if (initialData) {
          console.log("⚠️ InitialData présent, on garde le draft tel quel");
          setState((prev) => ({ ...prev, ...parsed }));
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const validDates =
            parsed.selectedDates?.filter((dateStr: string) => {
              const date = new Date(dateStr);
              return date >= today;
            }) || [];

          console.log("🔍 Dates valides filtrées:", validDates);

          if (validDates.length > 0 || parsed.selectedDates?.length === 0) {
            setState((prev) => ({
              ...prev,
              ...parsed,
              selectedDates: validDates,
            }));
          } else {
            console.log("🗑️ Suppression du draft (dates expirées)");
            localStorage.removeItem("doodates-draft");
          }
        }
      } catch (e) {
        console.warn("❌ Erreur lors du chargement du draft:", e);
        localStorage.removeItem("doodates-draft");
      }
    } else {
      console.log(
        "ℹ️ Pas de draft chargé:",
        initialData ? "draft non trouvé" : "nouveau sondage",
      );
    }
  }, [editPollId]); // Ajouter editPollId comme dépendance

  // Ajout d'un effet pour nettoyer le draft au montage (mais pas si on a un draft d'auth)
  useEffect(() => {
    const pollDraft = localStorage.getItem("doodates-poll-draft");
    if (!initialData && !pollDraft && !editPollId) {
      console.log("🧹 Nettoyage du draft au démarrage");
      localStorage.removeItem("doodates-draft");
    } else if (pollDraft) {
      console.log("📋 Draft d'auth détecté, conservation du draft normal");
    } else if (editPollId) {
      console.log("✏️ Mode édition, pas de nettoyage du draft");
    }
  }, [editPollId]);

  useEffect(() => {
    if (state.selectedDates.length > 0 && !state.showCalendarConnect) {
      setState((prev) => ({ ...prev, showCalendarConnect: true }));
    }
  }, [state.selectedDates.length, state.showCalendarConnect]);

  const isGranularityCompatible = (newGranularity: number): boolean => {
    if (timeSlotFunctions) {
      return timeSlotFunctions.isGranularityCompatible(
        newGranularity,
        state.selectedDates,
        timeSlotsByDate,
        state.timeGranularity,
      );
    }
    // Fallback simple
    return true;
  };

  const handleGranularityChange = (newGranularity: number) => {
    if (!isGranularityCompatible(newGranularity)) {
      return;
    }

    if (!initialGranularityState) {
      setInitialGranularityState({
        granularity: state.timeGranularity,
        timeSlots: { ...timeSlotsByDate },
      });
    }

    if (newGranularity < state.timeGranularity) {
      const newTimeSlotsByDate: Record<string, TimeSlot[]> = {};

      for (const dateStr of state.selectedDates) {
        const slots = timeSlotsByDate[dateStr] || [];
        const newSlots: TimeSlot[] = [];

        const totalMinutes = 24 * 60;
        for (
          let minutes = 0;
          minutes < totalMinutes;
          minutes += newGranularity
        ) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;

          const blocks = getTimeSlotBlocks(dateStr);
          let isEnabled = false;

          for (const block of blocks) {
            const blockStartMinutes =
              block.start.hour * 60 + block.start.minute;
            const blockEndMinutes =
              block.end.hour * 60 + block.end.minute + state.timeGranularity;

            if (minutes >= blockStartMinutes && minutes < blockEndMinutes) {
              isEnabled = true;
              break;
            }
          }

          newSlots.push({ hour, minute, enabled: isEnabled });
        }

        newTimeSlotsByDate[dateStr] = newSlots;
      }

      setTimeSlotsByDate(newTimeSlotsByDate);
    }

    setState((prev) => ({ ...prev, timeGranularity: newGranularity }));
  };

  const undoGranularityChange = () => {
    if (initialGranularityState) {
      setState((prev) => ({
        ...prev,
        timeGranularity: initialGranularityState.granularity,
      }));
      setTimeSlotsByDate(initialGranularityState.timeSlots);
      setInitialGranularityState(null);
    }
  };

  const generateCalendarForMonth = (monthDate: Date) => {
    if (!monthDate) {
      console.warn(
        "⚠️ generateCalendarForMonth appelé avec monthDate undefined",
      );
      return [];
    }
    console.log(
      "📅 Génération du calendrier pour le mois:",
      monthDate.toISOString(),
    );
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajuster le premier jour pour commencer par lundi (1) au lieu de dimanche (0)
    let firstDayOfWeek = firstDay.getDay() || 7;
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;

    console.log("📊 Informations du calendrier:", {
      premierJour: firstDay.toISOString(),
      dernierJour: lastDay.toISOString(),
      premierJourSemaine: firstDayOfWeek,
    });

    const days = [];

    // Ajouter les jours du mois précédent
    for (let i = 1; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, 1 - (firstDayOfWeek - i));
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Ajouter les jours du mois en cours
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Ajouter les jours du mois suivant
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    console.log(`📅 Calendrier généré avec ${days.length} jours`);
    return days;
  };

  // Debug responsive seulement en développement
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const handleResize = () => {
        const newDimensions = {
          width: window.innerWidth,
          height: window.innerHeight,
          mobile: window.innerWidth < 768,
        };
        console.log("📱 Responsive Debug:", newDimensions);
      };

      // Throttle handleResize to prevent excessive calls
      let resizeTimeout: NodeJS.Timeout;
      const throttledHandleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 150); // Throttle to 150ms
      };

      window.addEventListener("resize", throttledHandleResize);
      return () => {
        window.removeEventListener("resize", throttledHandleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }, []);

  // Modification de handleScroll pour limiter l'ajout de mois - avec throttling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Utiliser requestAnimationFrame pour optimiser les performances de scroll
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;

        // Calculer le mois visible au centre
        const monthWidth = containerWidth / 1.5; // Approximation
        const visibleMonthIndex = Math.round(scrollLeft / monthWidth);

        if (
          visibleMonthIndex >= 0 &&
          visibleMonthIndex < visibleMonths.length
        ) {
          const visibleMonth = visibleMonths[visibleMonthIndex];
          if (
            visibleMonth &&
            visibleMonth instanceof Date &&
            !isNaN(visibleMonth.getTime())
          ) {
            setState((prev) => ({
              ...prev,
              currentMonth: visibleMonth,
            }));
          }
        }
      });
    } else {
      // Fallback sans requestAnimationFrame
      const container = e.currentTarget;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      const monthWidth = containerWidth / 1.5;
      const visibleMonthIndex = Math.round(scrollLeft / monthWidth);

      if (visibleMonthIndex >= 0 && visibleMonthIndex < visibleMonths.length) {
        const visibleMonth = visibleMonths[visibleMonthIndex];
        if (
          visibleMonth &&
          visibleMonth instanceof Date &&
          !isNaN(visibleMonth.getTime())
        ) {
          setState((prev) => ({
            ...prev,
            currentMonth: visibleMonth,
          }));
        }
      }
    }
  };

  const toggleDate = (date: Date) => {
    // Utiliser le format local pour éviter les problèmes de timezone
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    setState((prev) => {
      const newDates = prev.selectedDates.includes(dateStr)
        ? prev.selectedDates.filter((d) => d !== dateStr)
        : [...prev.selectedDates, dateStr].sort();

      return { ...prev, selectedDates: newDates };
    });
  };

  const connectCalendar = async (provider: "google" | "outlook") => {
    if (provider === "google") {
      try {
        // Vérifier si l'utilisateur a déjà accès au calendrier
        const hasAccess = await googleCalendar.hasCalendarAccess();

        if (hasAccess) {
          console.log("🗓️ Accès Google Calendar confirmé");
          setState((prev) => ({ ...prev, calendarConnected: true }));

          // Analyser les disponibilités pour les dates sélectionnées
          if (state.selectedDates.length > 0) {
            await analyzeCalendarAvailability();
          }
        } else if (user) {
          console.log("🔄 Utilisateur connecté mais pas d'accès calendrier");
          setState((prev) => ({ ...prev, calendarConnected: true }));
        } else {
          console.log("🚫 Pas d'accès Google Calendar");
        }
      } catch (error) {
        console.error("❌ Erreur connexion calendrier:", error);
      }
    } else {
      // TODO: Implémenter Outlook
      console.log(`Connexion au calendrier ${provider} (non implémenté)`);
    }
  };

  const analyzeCalendarAvailability = async () => {
    try {
      console.log("📊 Analyse des disponibilités calendrier...");

      const availability = await googleCalendar.analyzeAvailability(
        state.selectedDates,
      );

      // Suggérer automatiquement les créneaux libres
      const newTimeSlotsByDate = { ...timeSlotsByDate };

      Object.entries(availability).forEach(([date, { suggested }]) => {
        if (suggested.length > 0) {
          console.log(`✅ Créneaux suggérés pour ${date}:`, suggested);

          // Activer les créneaux suggérés
          if (newTimeSlotsByDate[date]) {
            suggested.forEach((slot) => {
              const startTime = new Date(slot.start);
              const endTime = new Date(slot.end);

              // Activer tous les créneaux dans la plage suggérée
              newTimeSlotsByDate[date].forEach((timeSlot) => {
                const slotTime = new Date(
                  `${date}T${timeSlot.hour.toString().padStart(2, "0")}:${timeSlot.minute.toString().padStart(2, "0")}:00`,
                );

                if (slotTime >= startTime && slotTime < endTime) {
                  timeSlot.enabled = true;
                }
              });
            });
          }
        }
      });

      setTimeSlotsByDate(newTimeSlotsByDate);
      console.log("🎯 Créneaux mis à jour avec les suggestions du calendrier");
    } catch (error) {
      console.error("❌ Erreur analyse calendrier:", error);
    }
  };

  const validateEmails = (
    emailString: string,
  ): { valid: string[]; errors: string[] } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = emailString
      .split(/[,;\s\n]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const valid: string[] = [];
    const errors: string[] = [];

    emails.forEach((email) => {
      if (emailRegex.test(email)) {
        valid.push(email);
      } else {
        errors.push(`Email invalide: ${email}`);
      }
    });

    return { valid, errors };
  };

  const handleEmailInput = (value: string) => {
    setState((prev) => ({ ...prev, participantEmails: value }));

    const { valid, errors } = validateEmails(value);
    setState((prev) => ({
      ...prev,
      emailErrors: errors,
      notificationsEnabled: valid.length > 0, // Activer les notifications si emails valides
    }));
  };

  // OPTIMISATION: Utilisation du cache global des fonctions TimeSlot
  const [timeSlotFunctions, setTimeSlotFunctions] = useState<any>(() => {
    // Essayer de récupérer immédiatement depuis le cache global
    const globalFunctions = (window as any).getTimeSlotFunctions?.();
    if (globalFunctions) {
      console.log(
        "⚡ TimeSlot Functions - Récupération instantanée du cache global",
      );
      return globalFunctions;
    }
    return null;
  });

  useEffect(() => {
    // Si pas encore en cache, charger et utiliser le cache global
    if (!timeSlotFunctions) {
      console.time("⏰ TimeSlot Functions - Chargement avec cache global");

      // Vérifier d'abord le cache global
      const globalFunctions = (window as any).getTimeSlotFunctions?.();
      if (globalFunctions) {
        console.timeEnd("⏰ TimeSlot Functions - Chargement avec cache global");
        setTimeSlotFunctions(globalFunctions);
        return;
      }

      // Sinon, importer et mettre en cache
      import("../lib/timeSlotFunctions").then((module) => {
        console.timeEnd("⏰ TimeSlot Functions - Chargement avec cache global");
        setTimeSlotFunctions(module);
      });
    }
  }, [timeSlotFunctions]);

  const toggleTimeSlotForDate = async (
    dateStr: string,
    hour: number,
    minute: number,
  ) => {
    console.log(`🎯 Clic sur créneau: ${hour}:${minute.toString().padStart(2, '0')} pour ${dateStr}`);
    
    if (timeSlotFunctions) {
      // Utiliser la fonction lazy-loadée
      const newTimeSlotsByDate = timeSlotFunctions.toggleTimeSlotForDate(
        dateStr,
        hour,
        minute,
        timeSlotsByDate,
      );
      setTimeSlotsByDate(newTimeSlotsByDate);
      console.log(`✅ Créneau ${hour}:${minute.toString().padStart(2, '0')} mis à jour`);
    } else {
      // Fallback simple si pas encore chargé
      console.log(`⚠️ Fallback: mise à jour créneau ${hour}:${minute.toString().padStart(2, '0')}`);
      setTimeSlotsByDate((prev) => {
        const currentSlots = prev[dateStr] || [];
        const existingSlot = currentSlots.find(
          (s) => s.hour === hour && s.minute === minute,
        );

        let newSlots;
        if (existingSlot) {
          newSlots = currentSlots.map((slot) =>
            slot.hour === hour && slot.minute === minute
              ? { ...slot, enabled: !slot.enabled }
              : slot,
          );
        } else {
          newSlots = [...currentSlots, { hour, minute, enabled: true }];
        }

        return {
          ...prev,
          [dateStr]: newSlots,
        };
      });
    }
  };

  // OPTIMISATION: Fonctions lazy-loadées avec fallbacks
  const getVisibleTimeSlots = () => {
    if (timeSlotFunctions) {
      return timeSlotFunctions.getVisibleTimeSlots(
        state.showExtendedHours,
        state.timeGranularity,
        timeSlotsByDate,
      );
    }
    // Fallback simple
    return [];
  };

  const getTimeSlotBlocks = (dateStr: string) => {
    if (timeSlotFunctions) {
      return timeSlotFunctions.getTimeSlotBlocks(
        dateStr,
        timeSlotsByDate,
        state.timeGranularity,
      );
    }
    // Fallback simple
    return [];
  };

  const formatSelectedDateHeader = (dateStr: string) => {
    if (timeSlotFunctions) {
      return timeSlotFunctions.formatSelectedDateHeader(dateStr);
    }
    // Fallback simple
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return {
      dayName: date
        .toLocaleDateString("fr-FR", { weekday: "short" })
        .toLowerCase(),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("fr-FR", { month: "short" }).toLowerCase(),
    };
  };

  const canFinalize = () => {
    const noEmailErrors = state.emailErrors.length === 0;
    // Permettre la création de sondages vides (avec juste un titre)
    return noEmailErrors;
  };

  const handleFinalize = async () => {
    console.log("📝 handleFinalize: start", {
      title: state.pollTitle,
      selectedDates: state.selectedDates.length,
      showTimeSlots: state.showTimeSlots,
      timeGranularity: state.timeGranularity,
      notificationsEnabled: state.notificationsEnabled,
    });
    // Calculer la date d'expiration (aujourd'hui + expirationDays)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + state.expirationDays);

    // Préparer les données du sondage
    const pollData: PollData = {
      title: state.pollTitle,
      description: "", // Pas encore implémenté
      selectedDates: state.selectedDates,
      timeSlotsByDate: state.selectedDates.reduce(
        (acc, dateStr) => {
          // Pour chaque date, récupérer les créneaux horaires si activés
          acc[dateStr] = state.showTimeSlots
            ? getTimeSlotBlocks(dateStr).map((slot) => ({
                hour: slot.start.hour,
                minute: slot.start.minute,
                enabled: true,
              }))
            : [];
          return acc;
        },
        {} as Record<
          string,
          Array<{ hour: number; minute: number; enabled: boolean }>
        >,
      ),
      participantEmails: state.participantEmails
        .split(/[,;\s]+/)
        .filter((email) => email.trim() !== ""),
      settings: {
        timeGranularity: state.timeGranularity,
        allowAnonymousVotes: true,
        allowMaybeVotes: true,
        sendNotifications: state.notificationsEnabled,
        expiresAt: expiryDate.toISOString(),
      },
    };

    let result;

    if (editPollId) {
      // Mode édition : mettre à jour le sondage existant
      console.log("✏️ Mise à jour du sondage existant:", editPollId);

      // Vérifier s'il y a des votes existants
      const existingVotes = JSON.parse(
        localStorage.getItem("dev-votes") || "[]",
      );
      const pollVotes = existingVotes.filter(
        (vote: any) => vote.poll_id === editPollId,
      );

      if (pollVotes.length > 0) {
        console.log("⚠️ Votes existants détectés:", pollVotes.length);
        // Stratégie : Autoriser la modification mais conserver les votes compatibles
        // Les votes sur des dates supprimées seront perdus
      }

      // Mettre à jour le sondage dans localStorage
      const existingPolls = JSON.parse(
        localStorage.getItem("dev-polls") || "[]",
      );
      const pollIndex = existingPolls.findIndex(
        (poll: any) => poll.id === editPollId,
      );

      if (pollIndex >= 0) {
        const updatedPoll = {
          ...existingPolls[pollIndex],
          title: pollData.title,
          settings: {
            ...existingPolls[pollIndex].settings,
            ...pollData.settings,
            selectedDates: pollData.selectedDates,
            timeSlotsByDate: timeSlotsByDate, // Utiliser l'état local des créneaux
            showTimeSlots: state.showTimeSlots,
            timeGranularity: state.timeGranularity,
          },
          updated_at: new Date().toISOString(),
        };

        existingPolls[pollIndex] = updatedPoll;
        localStorage.setItem("dev-polls", JSON.stringify(existingPolls));

        result = { poll: updatedPoll };
        console.log("✅ Sondage mis à jour avec succès");
      } else {
        result = { error: "Sondage non trouvé" };
      }
    } else {
      // Mode création : créer un nouveau sondage
      console.log("🆕 Création d'un nouveau sondage");
      console.log("📤 Appel createPoll avec:", pollData);
      result = await createPoll(pollData);
    }

    console.log("📨 Résultat create/update:", result);

    if (result.error) {
      console.error("Erreur lors de la création du sondage:", result.error);
      return;
    }

    if (result.poll) {
      console.log("✅ Sondage créé avec succès:", result.poll);
      setCreatedPollSlug(result.poll.slug);
      setCreatedPoll(result.poll);

      // Nettoyer le brouillon
      localStorage.removeItem("doodates-draft");

      console.log("🏷️ createdPollSlug défini à:", result.poll.slug);

      // Optionnel : rediriger vers le sondage créé
      // window.location.href = `/poll/${poll.slug}`;
    } else {
      console.error("Aucun sondage retourné malgré l'absence d'erreur");
    }
  };

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
      console.error("Erreur lors de la copie:", err);
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
    if (initialData?.timeSlots && initialData.timeSlots.length > 0) {
      setState((prev) => ({
        ...prev,
        showTimeSlots: true,
        showGranularitySettings: false, // Ne pas ouvrir automatiquement le panneau
      }));
    }
  }, [initialData]);

  // Fonction pour rediriger vers la page d'accueil
  const handleBackToHome = () => {
    console.log("↩️ Navigation vers la page d'accueil après création");
    navigate("/");
  };

  // Fonction pour gérer le clic sur le bouton principal
  const handleMainButtonClick = () => {
    console.log("🖱️ Clic bouton principal", {
      createdPollSlug,
      canFinalize: canFinalize(),
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
      // Si le sondage est créé, rediriger vers la page d'accueil
      console.log("➡️ Bouton après création: redirection accueil");
      handleBackToHome();
    } else {
      // Sinon, créer le sondage
      console.log("🚀 Lancement de handleFinalize (création)");
      handleFinalize();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 lg:p-8 xl:p-12">
            <div className="space-y-6 md:space-y-8 lg:space-y-10">
              <div className="w-full overflow-hidden">
                <Calendar
                  visibleMonths={visibleMonths}
                  selectedDates={state.selectedDates}
                  onDateToggle={toggleDate}
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
                            onClick={analyzeCalendarAvailability}
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
                        console.log('🕒 Bouton Horaires cliqué - toggle showTimeSlots');
                        setState((prev) => {
                          const newState = {
                            ...prev,
                            showTimeSlots: !prev.showTimeSlots,
                          };
                          console.log('🕒 État après clic:', { 
                            selectedDates: prev.selectedDates.length, 
                            showTimeSlots: newState.showTimeSlots,
                            conditionMet: prev.selectedDates.length > 0 && newState.showTimeSlots
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
                          const compatible = isGranularityCompatible(
                            option.value,
                          );
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                handleGranularityChange(option.value)
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
                      {initialGranularityState && (
                        <button
                          onClick={undoGranularityChange}
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
                        const dateInfo = formatSelectedDateHeader(dateStr);
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
                    <div className="max-h-48 overflow-y-auto" data-testid="time-slots-grid">
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
                                  toggleTimeSlotForDate(
                                    dateStr,
                                    timeSlot.hour,
                                    timeSlot.minute,
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
                <div className="hidden md:block" data-testid="time-slots-section">
                  <div className="border rounded-lg bg-white overflow-hidden">
                    {/* En-têtes des dates */}
                    <div className="flex bg-gray-50">
                      <div className="w-16 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                        Heure
                      </div>
                      {state.selectedDates.map((dateStr) => {
                        const dateInfo = formatSelectedDateHeader(dateStr);
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
                    <div className="max-h-48 overflow-y-auto" data-testid="time-slots-grid">
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
                                  toggleTimeSlotForDate(
                                    dateStr,
                                    timeSlot.hour,
                                    timeSlot.minute,
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
                              validateEmails(state.participantEmails).valid
                                .length
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
                              /admin/{createdPollSlug}/
                              {createdPoll?.admin_token || "ADMIN_TOKEN"}
                            </div>
                            <button
                              onClick={() => {
                                const adminUrl = `${import.meta.env.DEV ? "http://localhost:8080" : "https://doodates.app"}/admin/${createdPollSlug}/${createdPoll?.admin_token || "ADMIN_TOKEN"}`;
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
                        {state.selectedDates.length === 0 &&
                          state.emailErrors.length === 0 && (
                            <li className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                              <span>
                                Vous pouvez créer un sondage vide (les
                                participants pourront proposer des dates)
                              </span>
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
