import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types"; 
import { handleError, ErrorFactory, logError } from "./error-handling";

// 🚧 MODE DÉVELOPPEMENT LOCAL ACTIVÉ
// L'URL Supabase actuelle n'est plus accessible
// Configuration commentée en attendant une nouvelle URL valide

/*
// Configuration Supabase originale (URL inaccessible)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw ErrorFactory.critical("Variables d'environnement Supabase manquantes", "Configuration Supabase requise");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetch.bind(globalThis),
  },
});
*/

// Configuration temporaire pour éviter les erreurs
const MOCK_SUPABASE_URL = "https://mock.supabase.co";
const MOCK_SUPABASE_KEY = "mock-key";

export const supabase = createClient(MOCK_SUPABASE_URL, MOCK_SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetch.bind(globalThis),
  },
});

// Mode développement local détecté
export const isLocalDevelopment = true;

console.warn("🚧 Mode développement local activé - Supabase désactivé");
console.log("📝 Les données sont stockées dans localStorage");

// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          preferences: Record<string, any>;
          plan_type: "free" | "pro" | "premium";
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: Record<string, any>;
          plan_type?: "free" | "pro" | "premium";
          subscription_expires_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: Record<string, any>;
          plan_type?: "free" | "pro" | "premium";
          subscription_expires_at?: string | null;
        };
      };
      polls: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          slug: string;
          settings: Record<string, any>;
          status: "draft" | "active" | "closed" | "archived";
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          creator_id: string;
          title: string;
          description?: string | null;
          slug: string;
          settings?: Record<string, any>;
          status?: "draft" | "active" | "closed" | "archived";
          expires_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          settings?: Record<string, any>;
          status?: "draft" | "active" | "closed" | "archived";
          expires_at?: string | null;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          option_date: string;
          time_slots: Record<string, any>[];
          display_order: number;
          created_at: string;
        };
        Insert: {
          poll_id: string;
          option_date: string;
          time_slots?: Record<string, any>[];
          display_order?: number;
        };
        Update: {
          option_date?: string;
          time_slots?: Record<string, any>[];
          display_order?: number;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          voter_email: string;
          voter_name: string;
          voter_id: string | null;
          selections: Record<string, any>;
          comment: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          poll_id: string;
          voter_email: string;
          voter_name: string;
          voter_id?: string | null;
          selections: Record<string, any>;
          comment?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          voter_name?: string;
          selections?: Record<string, any>;
          comment?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string;
          title: string | null;
          messages: Record<string, any>[];
          context: Record<string, any>;
          poll_id: string | null;
          status: "active" | "completed" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string | null;
          session_id: string;
          title?: string | null;
          messages?: Record<string, any>[];
          context?: Record<string, any>;
          poll_id?: string | null;
          status?: "active" | "completed" | "abandoned";
        };
        Update: {
          title?: string | null;
          messages?: Record<string, any>[];
          context?: Record<string, any>;
          poll_id?: string | null;
          status?: "active" | "completed" | "abandoned";
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          event_data: Record<string, any>;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          event_type: string;
          event_data: Record<string, any>;
          user_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
    };
  };
};

// Helper pour les erreurs Supabase
export function handleSupabaseError(error: any) {
  const processedError = handleError(error, {
    component: 'Supabase',
    operation: 'database'
  }, 'Erreur de base de données');

  logError(processedError, { component: 'Supabase' });

  if (processedError?.userMessage) {
    return processedError.userMessage;
  }

  return "Une erreur inattendue s'est produite";
}
