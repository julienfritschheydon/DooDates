export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings: Record<string, unknown>;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string;
  dates?: string[];
  type?: "date" | "form";
  questions?: Array<{
    id: string;
    type: string;
    title: string;
    required?: boolean;
    options?: Array<{ id: string; label: string }>;
  }>;
  conversationId?: string;
}
export interface PollData {
  title: string;
  description?: string | null;
  selectedDates: string[];
  timeSlotsByDate: Record<
    string,
    Array<{
      hour: number;
      minute: number;
      enabled: boolean;
    }>
  >;
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
  time_slots: Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>;
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
