import type { PollSettings, FormQuestionShape } from "../lib/pollStorage";

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings: PollSettings | Record<string, unknown>;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string; // Email du créateur pour les notifications
  dates?: string[]; // Dates sélectionnées pour le sondage (uniquement pour type: "date")
  // Support des formulaires et sondages disponibilités
  type?: "date" | "form" | "availability";
  questions?: FormQuestionShape[]; // Questions du formulaire
  // Champs spécifiques aux sondages disponibilités
  clientAvailabilities?: string; // Texte libre des disponibilités client (pour parsing IA)
  parsedAvailabilities?: Array<{
    date: string;
    timeRanges: Array<{ start: string; end: string }>;
  }>; // Disponibilités parsées par l'IA
  proposedSlots?: Array<{
    date: string;
    start: string;
    end: string;
    score?: number; // Score d'optimisation (pour MVP v1.0)
    reasons?: string[]; // Raisons de la recommandation (MVP v1.0)
  }>; // Créneaux proposés par le professionnel (MVP v0.5) ou système (MVP v1.0)
  validatedSlot?: {
    date: string;
    start: string;
    end: string;
  }; // Créneau validé par le client (MVP v1.0)
  conversationId?: string; // Lien avec conversation
}

export interface PollData {
  title: string;
  description?: string | null;
  selectedDates: string[];
  timeSlotsByDate: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  participantEmails: string[];
  settings: {
    timeGranularity: number;
    allowAnonymousVotes: boolean;
    allowMaybeVotes: boolean;
    sendNotifications: boolean;
    expiresAt?: string;
  };
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{ hour: number; minute: number; enabled: boolean }> | Record<string, unknown>;
  display_order: number;
  created_at: string;
}

export interface Vote {
  id?: string;
  poll_id: string;
  name: string;
  email?: string;
  selectedSlots: Array<{
    date: string;
    hour: number;
    minute: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}
