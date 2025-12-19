/**
 * Service pour la gestion des Availability Polls
 */

export interface AvailabilityPollSettings {
  // UI display settings
  showLogo?: boolean;
  // Access control settings
  requireAuth?: boolean;
  oneResponsePerPerson?: boolean;
  allowEditAfterSubmit?: boolean;
  maxResponses?: number;
  expiresAt?: string;
  // Results visibility
  resultsVisibility?: 'creator-only' | 'voters' | 'public';
  // Scheduling rules
  minLatencyMinutes?: number;
  maxLatencyMinutes?: number;
  preferNearTerm?: boolean;
  preferHalfDays?: boolean;
  slotDurationMinutes?: number;
}

export interface AvailabilityPoll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: AvailabilityPollSettings;
  status: 'draft' | 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
  type: 'availability';
  clientAvailabilities?: string;
  parsedAvailabilities?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  proposedSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    score?: number;
  }>;
}
