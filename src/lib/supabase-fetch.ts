const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Local/test mode detection:
// - Vitest or Vite test mode
// - Missing Supabase env vars
// - Playwright E2E: runtime flag injected before app init via addInitScript
const IS_LOCAL_MODE =
  import.meta.env.MODE === "test" ||
  Boolean(import.meta.env.VITEST) ||
  // Runtime E2E flags (set by Playwright before bundle runs)
  (typeof window !== "undefined" &&
    ((window as Window & { __E2E__?: boolean }).__E2E__ === true ||
      (() => {
        try {
          return (
            localStorage.getItem("e2e") === "1" || localStorage.getItem("dev-local-mode") === "1"
          );
        } catch {
          return false;
        }
      })())) ||
  // Fallback when env vars are missing
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY;

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  creator_id?: string;
  admin_token?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  dates?: string[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_date: string;
  time_slots: Array<{
    hour: number;
    minute: number;
    duration?: number;
  }> | null;
  display_order?: number;
  created_at?: string;
  // Champs pour les groupes de dates (week-ends, semaines, quinzaines)
  date_group?: string[]; // Liste des dates du groupe
  date_group_label?: string; // Label à afficher ("Week-end du 6-7 décembre")
  date_group_type?: "weekend" | "week" | "fortnight" | "custom"; // Type de groupe
}

export interface Vote {
  id: string;
  poll_id: string;
  voter_email: string;
  voter_name: string;
  selections: Record<string, "yes" | "no" | "maybe">;
  created_at: string;
}

import { ErrorFactory } from "./error-handling";

// Fonction utilitaire pour gérer les erreurs
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw ErrorFactory.api(
      `HTTP ${response.status}: ${error}`,
      "Erreur de communication avec le serveur",
      {
        status: response.status,
        responseText: error,
      },
    );
  }
  return response.json();
};

// API pour les sondages
export const pollsApi = IS_LOCAL_MODE
  ? {
      async getBySlug(slug: string): Promise<Poll | null> {
        const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
        return polls.find((p: Poll) => p.slug === slug) || null;
      },
      async create(poll: Omit<Poll, "id" | "created_at" | "updated_at">): Promise<Poll> {
        const now = new Date().toISOString();
        const newPoll: Poll = {
          ...poll,
          id: `local-${Date.now()}`,
          created_at: now,
          updated_at: now,
        } as Poll;
        const polls = JSON.parse(localStorage.getItem("dev-polls") || "[]");
        polls.push(newPoll);
        localStorage.setItem("dev-polls", JSON.stringify(polls));
        return newPoll;
      },
      async update(id: string, updates: Partial<Poll>): Promise<Poll> {
        const polls: Poll[] = JSON.parse(localStorage.getItem("dev-polls") || "[]");
        const idx = polls.findIndex((p) => p.id === id);
        if (idx >= 0) {
          polls[idx] = {
            ...polls[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          } as Poll;
          localStorage.setItem("dev-polls", JSON.stringify(polls));
          return polls[idx];
        }
        throw ErrorFactory.storage("Poll not found", "Sondage non trouvé");
      },
    }
  : {
      // Récupérer un sondage par slug
      async getBySlug(slug: string): Promise<Poll | null> {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/polls?slug=eq.${slug}&status=eq.active`,
          { headers },
        );

        const data = await handleResponse(response);
        return data.length > 0 ? data[0] : null;
      },

      // Créer un nouveau sondage
      async create(poll: Omit<Poll, "id" | "created_at" | "updated_at">): Promise<Poll> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/polls`, {
          method: "POST",
          headers,
          body: JSON.stringify(poll),
        });

        const data = await handleResponse(response);
        return data[0];
      },

      // Mettre à jour un sondage
      async update(id: string, updates: Partial<Poll>): Promise<Poll> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/polls?id=eq.${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(updates),
        });

        const data = await handleResponse(response);
        return data[0];
      },
    };

// API pour les options de sondage
export const pollOptionsApi = IS_LOCAL_MODE
  ? {
      async getByPollId(pollId: string): Promise<PollOption[]> {
        const polls: import("./supabase").Database["public"]["Tables"]["polls"]["Row"][] =
          JSON.parse(localStorage.getItem("dev-polls") || "[]");
        const poll = polls.find((p) => p.id === pollId);
        if (!poll) return [];
        const dates: string[] = poll.settings?.selectedDates || [];
        const map: Record<
          string,
          Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>
        > = (poll.settings?.timeSlotsByDate as
          | Record<
              string,
              Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>
            >
          | undefined) || {};
        return dates.map((d, i) => ({
          id: `option-${i}`,
          poll_id: pollId,
          option_date: d,
          time_slots: map[d] || null,
          display_order: i,
          created_at: poll.created_at,
        }));
      },
      async createMany(options: Omit<PollOption, "id">[]): Promise<PollOption[]> {
        // No-op in local mode: options are derived from settings
        return options.map(
          (o, i) =>
            ({
              ...o,
              id: `option-${i}`,
              created_at: new Date().toISOString(),
            }) as PollOption,
        );
      },
    }
  : {
      // Récupérer les options d'un sondage
      async getByPollId(pollId: string): Promise<PollOption[]> {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/poll_options?poll_id=eq.${pollId}&order=display_order.asc`,
          { headers },
        );

        return handleResponse(response);
      },

      // Créer des options pour un sondage
      async createMany(options: Omit<PollOption, "id">[]): Promise<PollOption[]> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/poll_options`, {
          method: "POST",
          headers,
          body: JSON.stringify(options),
        });

        return handleResponse(response);
      },
    };

// API pour les votes
export const votesApi = IS_LOCAL_MODE
  ? {
      async getByPollId(pollId: string): Promise<Vote[]> {
        const votes: Vote[] = JSON.parse(localStorage.getItem("dev-votes") || "[]");
        return votes.filter((v) => v.poll_id === pollId);
      },
      async create(vote: Omit<Vote, "id" | "created_at">): Promise<Vote> {
        const newVote: Vote = {
          ...(vote as Omit<Vote, "id" | "created_at">),
          id: `vote-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as Vote;
        const votes: Vote[] = JSON.parse(localStorage.getItem("dev-votes") || "[]");
        votes.push(newVote);
        localStorage.setItem("dev-votes", JSON.stringify(votes));
        return newVote;
      },
      async update(id: string, updates: Partial<Vote>): Promise<Vote> {
        const votes: Vote[] = JSON.parse(localStorage.getItem("dev-votes") || "[]");
        const idx = votes.findIndex((v) => v.id === id);
        if (idx >= 0) {
          votes[idx] = { ...votes[idx], ...updates } as Vote;
          localStorage.setItem("dev-votes", JSON.stringify(votes));
          return votes[idx];
        }
        throw ErrorFactory.storage("Vote not found", "Vote non trouvé");
      },
    }
  : {
      // Récupérer les votes d'un sondage
      async getByPollId(pollId: string): Promise<Vote[]> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/votes?poll_id=eq.${pollId}`, {
          headers,
        });

        return handleResponse(response);
      },

      // Créer un nouveau vote
      async create(vote: Omit<Vote, "id" | "created_at">): Promise<Vote> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
          method: "POST",
          headers,
          body: JSON.stringify(vote),
        });

        const data = await handleResponse(response);
        return data[0];
      },

      // Mettre à jour un vote existant
      async update(id: string, updates: Partial<Vote>): Promise<Vote> {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/votes?id=eq.${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(updates),
        });

        const data = await handleResponse(response);
        return data[0];
      },
    };

// Fonction de test pour vérifier la connectivité
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/polls?limit=1`, {
      headers,
    });
    return response.ok;
  } catch {
    return false;
  }
};
