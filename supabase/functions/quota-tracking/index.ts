// Edge Function pour gestion des quotas utilisateurs authentifiés ET guests
// Migration Phase 3: Remplace localStorage par validation serveur

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Origines CORS autorisées
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://julienfritschheydon.github.io",
];

const ALLOWED_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/julienfritschheydon\.github\.io$/,
  /^https:\/\/.*\.github\.io$/,
];

function getCorsHeaders(origin: string | null): HeadersInit {
  let allowedOrigin: string | null = null;

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    } else {
      for (const pattern of ALLOWED_PATTERNS) {
        if (pattern.test(origin)) {
          allowedOrigin = origin;
          break;
        }
      }
    }
  }

  if (!allowedOrigin) {
    allowedOrigin = ALLOWED_ORIGINS[0];
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface RequestBody {
  endpoint: string;
  action?: "conversation_created" | "poll_created" | "ai_message" | "analytics_query" | "simulation" | "other";
  credits?: number;
  metadata?: Record<string, unknown>;
  fingerprint?: string; // Pour les guests
  limit?: number;
}

// Limites pour les guests (doit matcher src/lib/guestQuotaService.ts)
const GUEST_LIMITS = {
  CONVERSATIONS: 5,
  POLLS: 5,
  AI_MESSAGES: 20,
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
};

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  console.log(`[${timestamp}] [${requestId}] 🚀 QUOTA TRACKING EDGE FUNCTION`);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser le body
    const body: RequestBody = await req.json();
    const { endpoint, fingerprint } = body;

    // Vérifier l'authentification
    const authHeader = req.headers.get("authorization");
    let user = null;
    let isGuest = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // Si pas d'utilisateur authentifié, vérifier si c'est un guest avec fingerprint
    if (!user) {
      if (fingerprint) {
        isGuest = true;
        console.log(`[${timestamp}] [${requestId}] 👤 Guest détecté: ${fingerprint}`);
      } else {
        console.log(`[${timestamp}] [${requestId}] ❌ Authentification échouée (ni token ni fingerprint)`);
        return new Response(
          JSON.stringify({ success: false, error: "Authentication required (Token or Fingerprint)" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
    } else {
      console.log(`[${timestamp}] [${requestId}] ✅ Utilisateur authentifié: ${user.id}`);
    }

    // Router vers le bon endpoint
    switch (endpoint) {
      case "checkQuota": {
        const { action, credits = 0 } = body;
        console.log(`[${timestamp}] [${requestId}] 📊 Check quota (${isGuest ? 'Guest' : 'User'}): ${action}, ${credits} crédits`);

        if (isGuest) {
          // Logique Guest
          const { data: quota, error: quotaError } = await supabase
            .from("guest_quotas")
            .select("*")
            .eq("fingerprint", fingerprint)
            .maybeSingle();

          if (quotaError) {
            console.log(`[${timestamp}] [${requestId}] ❌ Erreur récupération quota guest:`, quotaError);
            return new Response(JSON.stringify({ success: false, error: "Failed to fetch guest quota" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }

          // Si pas de quota, on considère qu'il est nouveau donc autorisé (sera créé à la consommation)
          if (!quota) {
            return new Response(
              JSON.stringify({
                success: true,
                allowed: true,
                currentQuota: null, // Nouveau guest
              }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // Vérifier les limites guest
          const totalCredits = quota.total_credits_consumed || 0;
          const allowed = totalCredits + credits <= GUEST_LIMITS.TOTAL_CREDITS;
          // Ajouter d'autres vérifications spécifiques si nécessaire (comme dans guestQuotaService.ts)

          return new Response(
            JSON.stringify({
              success: true,
              allowed,
              currentQuota: {
                conversationsCreated: quota.conversations_created,
                pollsCreated: quota.polls_created,
                aiMessages: quota.ai_messages,
                analyticsQueries: quota.analytics_queries,
                simulations: quota.simulations,
                totalCreditsConsumed: quota.total_credits_consumed,
              },
              reason: allowed ? undefined : "Guest quota limit reached",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );

        } else {
          // Logique Authentifié (existante)
          const userId = user!.id;
          const { data: quota, error: quotaError } = await supabase
            .from("quota_tracking")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (quotaError && quotaError.code !== "PGRST116") {
            // ... erreur handling ...
            return new Response(JSON.stringify({ success: false, error: "Failed to fetch quota" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }

          let currentQuota = quota;
          if (!quota) {
            // Créer quota si inexistant
            const { data: newQuota, error: createError } = await supabase.rpc("ensure_quota_tracking_exists", { p_user_id: userId });
            if (createError) return new Response(JSON.stringify({ success: false, error: "Failed to create quota" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

            const { data: createdQuota } = await supabase.from("quota_tracking").select("*").eq("user_id", userId).single();
            currentQuota = createdQuota;
          }

          // Vérifier limites (valeurs par défaut simplifiées)
          const totalLimit = 100;
          const currentTotal = currentQuota?.total_credits_consumed || 0;
          const allowed = currentTotal + credits <= totalLimit;

          return new Response(
            JSON.stringify({
              success: true,
              allowed,
              currentQuota: currentQuota ? {
                totalCreditsConsumed: currentQuota.total_credits_consumed,
                // ... autres champs ...
              } : null,
              reason: allowed ? undefined : "Quota limit reached",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      case "consumeCredits": {
        const { action, credits = 0, metadata } = body;
        console.log(`[${timestamp}] [${requestId}] 💳 Consume credits (${isGuest ? 'Guest' : 'User'}): ${action}, ${credits} crédits`);

        if (isGuest) {
          // Logique Guest
          // 1. Récupérer ou créer le quota guest
          const { data: existingQuota, error: quotaError } = await supabase
            .from("guest_quotas")
            .select("*")
            .eq("fingerprint", fingerprint)
            .maybeSingle();

          let quota = existingQuota;

          if (!quota) {
            const { data: newQuota, error: createError } = await supabase
              .from("guest_quotas")
              .insert([{ fingerprint, ...metadata }]) // Utiliser metadata pour user_agent etc.
              .select()
              .single();

            if (createError) {
              console.log(`[${timestamp}] [${requestId}] ❌ Erreur création guest quota:`, createError);
              return new Response(JSON.stringify({ success: false, error: "Failed to create guest quota" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
            }
            quota = newQuota;
          }

          // 2. Vérifier limites
          const totalCredits = quota.total_credits_consumed || 0;
          if (totalCredits + credits > GUEST_LIMITS.TOTAL_CREDITS) {
            return new Response(JSON.stringify({ success: false, error: "Guest quota limit reached", currentTotal: totalCredits }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }

          // 3. Mettre à jour (incrémenter)
          const updates: Record<string, unknown> = {
            total_credits_consumed: totalCredits + credits,
            last_activity_at: new Date().toISOString(),
          };

          // Mapping action -> colonne
          if (action === "conversation_created") updates.conversations_created = (quota.conversations_created || 0) + 1;
          if (action === "poll_created") updates.polls_created = (quota.polls_created || 0) + 1;
          if (action === "ai_message") updates.ai_messages = (quota.ai_messages || 0) + 1;
          if (action === "analytics_query") updates.analytics_queries = (quota.analytics_queries || 0) + 1;
          if (action === "simulation") updates.simulations = (quota.simulations || 0) + 1;

          const { data: updatedQuota, error: updateError } = await supabase
            .from("guest_quotas")
            .update(updates)
            .eq("id", quota.id)
            .select()
            .single();

          if (updateError) {
            return new Response(JSON.stringify({ success: false, error: "Failed to update guest quota" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }

          // 4. Journaliser (fire and forget ou await)
          await supabase.from("guest_quota_journal").insert({
            guest_quota_id: quota.id,
            fingerprint,
            action,
            credits,
            metadata: metadata || {}
          });

          return new Response(
            JSON.stringify({
              success: true,
              quota: {
                conversationsCreated: updatedQuota.conversations_created,
                pollsCreated: updatedQuota.polls_created,
                aiMessages: updatedQuota.ai_messages,
                analyticsQueries: updatedQuota.analytics_queries,
                simulations: updatedQuota.simulations,
                totalCreditsConsumed: updatedQuota.total_credits_consumed,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );

        } else {
          // Logique Authentifié (existante via RPC)
          const userId = user!.id;
          const { data, error } = await supabase.rpc("consume_quota_credits", {
            p_user_id: userId,
            p_action: action,
            p_credits: credits,
            p_metadata: metadata || {},
          });

          if (error) {
            return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }
          if (!data.success) {
            return new Response(JSON.stringify({ success: false, error: data.error, currentTotal: data.current_total }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
          }

          return new Response(
            JSON.stringify({
              success: true,
              quota: {
                totalCreditsConsumed: data.quota.total_credits_consumed,
                // ... autres champs ...
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      case "getJournal": {
        const { limit = 100 } = body;

        if (isGuest) {
          const { data: journal, error } = await supabase
            .from("guest_quota_journal")
            .select("*")
            .eq("fingerprint", fingerprint)
            .order("created_at", { ascending: false })
            .limit(limit);

          if (error) return new Response(JSON.stringify({ success: false, error: "Failed to fetch guest journal" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

          return new Response(
            JSON.stringify({
              success: true,
              journal: (journal || []).map((entry: { id: string; created_at: string; action: string; credits: number; metadata: Record<string, unknown> }) => ({
                id: entry.id,
                timestamp: entry.created_at,
                action: entry.action,
                credits: entry.credits,
                metadata: entry.metadata,
              })),
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          // Logique Authentifié
          const userId = user!.id;
          const { data: journal, error: journalError } = await supabase
            .from("quota_tracking_journal")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

          if (journalError) return new Response(JSON.stringify({ success: false, error: "Failed to fetch journal" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

          return new Response(
            JSON.stringify({
              success: true,
              journal: (journal || []).map((entry: { id: string; created_at: string; action: string; credits: number; user_id: string; metadata: Record<string, unknown> }) => ({
                id: entry.id,
                timestamp: entry.created_at,
                action: entry.action,
                credits: entry.credits,
                userId: entry.user_id,
                metadata: entry.metadata,
              })),
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid endpoint" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
    }
  } catch (error) {
    console.error(`[${timestamp}] [${requestId}] ❌ Erreur Edge Function:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
