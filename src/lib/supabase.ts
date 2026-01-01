/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClientOptions } from "@supabase/supabase-js";
import { handleError, ErrorFactory, logError } from "./error-handling";
import { getEnv, getMode, isDev } from "./env";

// Configuration Supabase pour production
const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

// Déterminer l'environnement
const mode = getMode();
const isProduction = mode === "production";
// En test, si les variables sont définies, ne pas considérer comme local dev
const isTestEnv = mode === "test" || (typeof process !== "undefined" && process?.env?.NODE_ENV === "test");
const isLocalDev = !supabaseUrl || !supabaseAnonKey;

// Debug: Log des variables d'environnement (développement uniquement)
if (isDev()) {
  console.log("🔧 DooDates Supabase Config:", {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "❌ MISSING",
    key: supabaseAnonKey ? "✅ Configured" : "❌ MISSING",
    isLocalDev,
    mode,
    isProduction,
  });
}

// Configuration Supabase optimisée pour la production
const getSupabaseConfig = (): SupabaseClientOptions<"public"> => {
  if (isLocalDev) {
    // Configuration mock pour développement local
    return {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    };
  }

  // Configuration production optimisée
  if (isProduction) {
    return {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "doo-dates-auth-token",
        flowType: "pkce", // Utiliser PKCE pour meilleure sécurité
      },
      global: {
        headers: {
          "x-client-info": "doo-dates-web@1.0.0",
        },
      },
      // Connection pooling: Supabase gère automatiquement via l'URL
      // Pour utiliser connection pooling explicite, utiliser l'URL avec /rest/v1/ au lieu de /rest/v1/
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Limiter les événements en production
        },
      },
    };
  }

  // Configuration développement/staging
  return {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  };
};

// Configuration Supabase
let supabaseClient;
if (isLocalDev && !isTestEnv) {
  // En mode développement uniquement (pas test), utiliser mock si variables manquantes
  const MOCK_SUPABASE_URL = "https://mock.supabase.co";
  const MOCK_SUPABASE_KEY = "mock-key";

  supabaseClient = createClient(MOCK_SUPABASE_URL, MOCK_SUPABASE_KEY, getSupabaseConfig());
} else {
  // Configuration Supabase réelle avec validation (production ou test avec variables)
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = ErrorFactory.validation(
      "Variables d'environnement Supabase manquantes",
      "Configuration Supabase invalide",
      {
        component: "Supabase",
        operation: "initialization",
        missingVars: {
          url: !supabaseUrl,
          key: !supabaseAnonKey,
        },
      },
    );
    logError(error, { component: "Supabase" });
    throw error;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, getSupabaseConfig());
}

export const supabase = supabaseClient;
export const isLocalDevelopment = isLocalDev;

// Exposer le client Supabase pour les tests E2E
// Permet aux tests d'utiliser le même client que l'app pour l'authentification
if (typeof window !== "undefined") {
  (window as any).__SUPABASE_CLIENT__ = supabaseClient;
}

// Logs de développement désactivés pour réduire le bruit en console
// console.warn("🚧 Mode développement local activé - Supabase désactivé");
// console.log("📝 Les données sont stockées dans localStorage");

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
          preferences: Record<string, unknown>;
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
          preferences?: Record<string, unknown>;
          plan_type?: "free" | "pro" | "premium";
          subscription_expires_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          preferences?: Record<string, unknown>;
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
          settings: Record<string, unknown>;
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
          settings?: Record<string, unknown>;
          status?: "draft" | "active" | "closed" | "archived";
          expires_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          settings?: Record<string, unknown>;
          status?: "draft" | "active" | "closed" | "archived";
          expires_at?: string | null;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          option_date: string;
          time_slots: Array<Record<string, unknown>>;
          display_order: number;
          created_at: string;
        };
        Insert: {
          poll_id: string;
          option_date: string;
          time_slots?: Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>;
          display_order?: number;
        };
        Update: {
          option_date?: string;
          time_slots?: Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>;
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
          selections: Record<string, unknown>;
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
          selections: Record<string, unknown>;
          comment?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          voter_name?: string;
          selections?: Record<string, unknown>;
          comment?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string;
          title: string | null;
          messages: Array<Record<string, unknown>>;
          context: Record<string, unknown>;
          poll_id: string | null;
          status: "active" | "completed" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string | null;
          session_id: string;
          title?: string | null;
          messages?: Array<{ id: string; role: string; content: string; timestamp: string }>;
          context?: Record<string, unknown>;
          poll_id?: string | null;
          status?: "active" | "completed" | "abandoned";
        };
        Update: {
          title?: string | null;
          messages?: Array<{ id: string; role: string; content: string; timestamp: string }>;
          context?: Record<string, unknown>;
          poll_id?: string | null;
          status?: "active" | "completed" | "abandoned";
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          event_data: Record<string, unknown>;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          event_type: string;
          event_data: Record<string, unknown>;
          user_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      guest_quotas: {
        Row: {
          id: string;
          fingerprint: string;
          conversations_created: number;
          // polls_created supprimé - utiliser calculateTotalPollsCreated() pour calculer à la volée
          ai_messages: number;
          analytics_queries: number;
          simulations: number;
          total_credits_consumed: number;
          first_seen_at: string;
          last_activity_at: string;
          user_agent: string | null;
          timezone: string | null;
          language: string | null;
          screen_resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          fingerprint: string;
          conversations_created?: number;
          // polls_created supprimé
          ai_messages?: number;
          analytics_queries?: number;
          simulations?: number;
          total_credits_consumed?: number;
          user_agent?: string | null;
          timezone?: string | null;
          language?: string | null;
          screen_resolution?: string | null;
        };
        Update: {
          conversations_created?: number;
          // polls_created supprimé
          ai_messages?: number;
          analytics_queries?: number;
          simulations?: number;
          total_credits_consumed?: number;
          last_activity_at?: string;
        };
      };
      guest_quota_journal: {
        Row: {
          id: string;
          guest_quota_id: string;
          fingerprint: string;
          action: string;
          credits: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          guest_quota_id: string;
          fingerprint: string;
          action: string;
          credits: number;
          metadata?: Record<string, unknown>;
        };
      };
    };
  };
};

// Helper pour les erreurs Supabase
export function handleSupabaseError(error: unknown) {
  const processedError = handleError(
    error,
    {
      component: "Supabase",
      operation: "database",
    },
    "Erreur de base de données",
  );

  logError(processedError, { component: "Supabase" });

  if (processedError?.userMessage) {
    return processedError.userMessage;
  }

  return "Une erreur inattendue s'est produite";
}
