/**
 * Mock data for the voting components
 * This will be gradually replaced with real data from the API
 */
import { Poll, SwipeOption, SwipeVote } from './types';

// Mock poll data
export const mockPoll: Poll = {
  id: "demo-poll-1",
  title: "Réunion d'équipe - Janvier 2025",
  description: "",
  status: "active",
  creator_id: "demo-user",
  created_at: new Date().toISOString(),
  expires_at: "2025-02-15T23:59:59Z", // Date limite
};

// Mock options data
export const swipeOptions: SwipeOption[] = [
  {
    id: "opt-1",
    poll_id: "demo-poll-1",
    option_date: "2025-01-30",
    time_slots: [{ hour: 9, minute: 0, duration: 120 }],
    display_order: 1,
  },
  {
    id: "opt-2",
    poll_id: "demo-poll-1",
    option_date: "2025-01-30",
    time_slots: [{ hour: 14, minute: 0, duration: 120 }],
    display_order: 2,
  },
  {
    id: "opt-3",
    poll_id: "demo-poll-1",
    option_date: "2025-01-31",
    time_slots: [{ hour: 10, minute: 0, duration: 120 }],
    display_order: 3,
  },
  {
    id: "opt-4",
    poll_id: "demo-poll-1",
    option_date: "2025-02-01",
    time_slots: [{ hour: 14, minute: 30, duration: 90 }],
    display_order: 4,
  },
];

// Mock votes data
export const swipeVotes: SwipeVote[] = [
  {
    id: "vote-1",
    poll_id: "demo-poll-1",
    voter_email: "alice@company.com",
    voter_name: "Alice M.",
    selections: {
      "opt-1": "no",
      "opt-2": "yes",
      "opt-3": "maybe",
      "opt-4": "no",
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "vote-2",
    poll_id: "demo-poll-1",
    voter_email: "bob@company.com",
    voter_name: "Bob D.",
    selections: {
      "opt-1": "yes",
      "opt-2": "no",
      "opt-3": "maybe",
      "opt-4": "yes",
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "vote-3",
    poll_id: "demo-poll-1",
    voter_email: "carol@company.com",
    voter_name: "Carol L.",
    selections: {
      "opt-1": "maybe",
      "opt-2": "yes",
      "opt-3": "yes",
      "opt-4": "no",
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "vote-4",
    poll_id: "demo-poll-1",
    voter_email: "david@company.com",
    voter_name: "David R.",
    selections: {
      "opt-1": "yes",
      "opt-2": "yes",
      "opt-3": "maybe",
      "opt-4": "yes",
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "vote-5",
    poll_id: "demo-poll-1",
    voter_email: "emma@company.com",
    voter_name: "Emma T.",
    selections: {
      "opt-1": "yes",
      "opt-2": "no",
      "opt-3": "yes",
      "opt-4": "maybe",
    },
    created_at: new Date().toISOString(),
  },
];
