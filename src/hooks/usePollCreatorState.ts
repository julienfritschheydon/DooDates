import { useEffect, useState } from "react";
import type { Poll } from "../lib/pollStorage";
import type { PollOption } from "../types/poll";
import { PollCreatorService } from "../services/PollCreatorService";
import type { PollCreationState, TimeSlot } from "../services/PollCreationBusinessLogic";
import {
  calculateOptimalGranularity,
  convertGeminiSlotsToTimeSlotsByDate,
} from "../services/TimeSlotConverter";
import { logger } from "../lib/logger";
import { formatDateLocal } from "../lib/date-utils";
import { toast as toastFn } from "@/hooks/use-toast";

interface UsePollCreatorStateParams {
  editPollId: string | null;
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
  toast: (args: Parameters<typeof toastFn>[0]) => void;
}

interface UsePollCreatorStateResult {
  state: PollCreationState;
  setState: React.Dispatch<React.SetStateAction<PollCreationState>>;
  visibleMonths: Date[];
  setVisibleMonths: React.Dispatch<React.SetStateAction<Date[]>>;
  timeSlotsByDate: Record<string, TimeSlot[]>;
  setTimeSlotsByDate: React.Dispatch<React.SetStateAction<Record<string, TimeSlot[]>>>;
}

export function usePollCreatorState({
  editPollId,
  initialData,
  toast,
}: UsePollCreatorStateParams): UsePollCreatorStateResult {
  const [state, setState] = useState<PollCreationState>(
    PollCreatorService.initializeWithGeminiData(initialData) as PollCreationState,
  );

  const [visibleMonths, setVisibleMonths] = useState<Date[]>(() => {
    const now = new Date();
    const months: Date[] = [];
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(month);
    }
    return months;
  });

  const [timeSlotsByDate, setTimeSlotsByDate] = useState<Record<string, TimeSlot[]>>({});

  useEffect(() => {
    if (!editPollId) {
      if (!initialData) {
        try {
          const draftJson = localStorage.getItem("doodates-draft");
          if (draftJson) {
            const draftData = JSON.parse(draftJson) as {
              title?: string;
              selectedDates?: string[];
              timeSlotsByDate?: Record<string, TimeSlot[]>;
              participantEmails?: string;
              settings?: {
                timeGranularity?: number;
                sendNotifications?: boolean;
                expiresAt?: string;
              };
            };

            if (draftData.selectedDates && draftData.selectedDates.length > 0) {
              setState((prev) => ({
                ...prev,
                pollTitle: draftData.title || prev.pollTitle,
                selectedDates: draftData.selectedDates || prev.selectedDates,
                participantEmails: draftData.participantEmails || prev.participantEmails,
                timeGranularity: draftData.settings?.timeGranularity || prev.timeGranularity,
                notificationsEnabled:
                  draftData.settings?.sendNotifications || prev.notificationsEnabled,
                expirationDays: draftData.settings?.expiresAt
                  ? Math.ceil(
                      (new Date(draftData.settings.expiresAt).getTime() - Date.now()) /
                        (24 * 60 * 60 * 1000),
                    )
                  : prev.expirationDays,
                showTimeSlots: true,
              }));

              if (draftData.timeSlotsByDate) {
                setTimeSlotsByDate(draftData.timeSlotsByDate);
              }

              localStorage.removeItem("doodates-draft");

              toast({
                title: "Brouillon restauré",
                description: "Votre sondage en cours a été restauré.",
              });
            }
          }
        } catch (error) {
          logger.error("Erreur lors de la restauration du brouillon", "poll", error);
          localStorage.removeItem("doodates-draft");
        }
      }
      return;
    }

    let isMounted = true;

    const loadPollData = async () => {
      try {
        localStorage.removeItem("doodates-draft");

        const existingPolls = JSON.parse(localStorage.getItem("dev-polls") || "[]") as Poll[];
        const pollToEdit = existingPolls.find((poll) => poll.id === editPollId);

        if (!pollToEdit || !isMounted) return;

        const pollDates: string[] = [];

        if (pollToEdit.settings?.selectedDates?.length > 0) {
          pollDates.push(...pollToEdit.settings.selectedDates);
        }

        if (pollDates.length === 0) {
          const pollWithOptions = pollToEdit as Poll & { options?: PollOption[] };
          if (pollWithOptions.options) {
            pollWithOptions.options.forEach((option) => {
              if (option.option_date && !pollDates.includes(option.option_date)) {
                pollDates.push(option.option_date);
              }
            });
          }
        }

        if (pollDates.length === 0) {
          const today = new Date();
          for (let i = 0; i < 3; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i + 1);
            pollDates.push(formatDateLocal(futureDate));
          }
        }

        const newState: PollCreationState = {
          pollTitle: pollToEdit.title || "",
          selectedDates: pollDates,
          currentMonth: pollDates[0] ? new Date(pollDates[0]) : new Date(),
          showTimeSlots: false,
          participantEmails: "",
          calendarConnected: false,
          timeSlots: [],
          notificationsEnabled: false,
          userEmail: "",
          showCalendarConnect: false,
          showShare: false,
          showSettingsPanel: false,
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

          if (pollToEdit.settings?.timeSlotsByDate) {
            setTimeSlotsByDate(pollToEdit.settings.timeSlotsByDate as Record<string, TimeSlot[]>);

            const hasTimeSlots = Object.values(pollToEdit.settings.timeSlotsByDate || {}).some(
              (slots) => slots && Array.isArray(slots) && slots.length > 0,
            );
            if (hasTimeSlots) {
              newState.showTimeSlots = true;
            }
          } else {
            setTimeSlotsByDate({});
          }

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

  useEffect(() => {
    if (initialData?.dates && initialData.dates.length > 0) {
      const firstDate = new Date(initialData.dates[0]);
      if (!isNaN(firstDate.getTime())) {
        const months: Date[] = [];
        for (let i = 0; i < 6; i++) {
          const month = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, 1);
          months.push(month);
        }
        setVisibleMonths(months);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData?.dates && initialData.dates.length > 0 && state.selectedDates.length === 0) {
      setState((prev) => ({
        ...prev,
        selectedDates: initialData.dates || [],
        showTimeSlots: true,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData?.timeSlots || initialData.timeSlots.length === 0) {
      return;
    }

    const convertedTimeSlots = convertGeminiSlotsToTimeSlotsByDate(
      initialData.timeSlots,
      initialData.dates || [],
      30,
    );

    setTimeSlotsByDate(convertedTimeSlots);

    const optimalGranularity = calculateOptimalGranularity(convertedTimeSlots);

    setState((prev) => ({
      ...prev,
      showGranularitySettings: true,
      timeGranularity: optimalGranularity,
    }));
  }, [initialData]);

  return {
    state,
    setState,
    visibleMonths,
    setVisibleMonths,
    timeSlotsByDate,
    setTimeSlotsByDate,
  };
}
