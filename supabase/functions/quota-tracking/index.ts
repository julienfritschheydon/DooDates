// Edge Function pour gestion des quotas utilisateurs authentifiés
// Migration Phase 3: Remplace localStorage par validation serveur

// Deno global is available in the Edge Function runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error: Deno URL imports are valid in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno URL imports are valid in Deno runtime
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

interface CheckQuotaRequest {
  action: "conversation_created" | "poll_created" | "ai_message" | "analytics_query" | "simulation" | "other";
  credits: number;
}

interface ConsumeCreditsRequest {
  action: "conversation_created" | "poll_created" | "ai_message" | "analytics_query" | "simulation" | "other";
  credits: number;
  metadata?: Record<string, unknown>;
}

interface GetJournalRequest {
  limit?: number;
}

// Limites horaires par type d'action (rate limiting backend, complément des quotas globaux)
const DEFAULT_HOURLY_LIMIT = 100;

const HOURLY_LIMITS: Record<CheckQuotaRequest["action"], number> = {
  conversation_created: 50,
  poll_created: 50,
  ai_message: 100,
  analytics_query: 50,
  simulation: 20,
  other: 100,
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

    // Extraire l'adresse IP (utilisée pour le rate limiting par IP)
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      null;

    // Vérifier l'authentification (OBLIGATOIRE pour cette fonction)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log(`[${timestamp}] [${requestId}] ❌ Authentification échouée`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const userId = user.id;
    console.log(`[${timestamp}] [${requestId}] ✅ Utilisateur authentifié: ${userId}`);

    // Parser le body
    const body = await req.json();
    const { endpoint } = body;

    // Router vers le bon endpoint
    switch (endpoint) {
      case "checkQuota": {
        const { action, credits }: CheckQuotaRequest = body;
        console.log(`[${timestamp}] [${requestId}] 📊 Check quota: ${action}, ${credits} crédits`);

        // Récupérer le quota actuel
        const { data: quota, error: quotaError } = await supabase
          .from("quota_tracking")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (quotaError && quotaError.code !== "PGRST116") {
          console.log(`[${timestamp}] [${requestId}] ❌ Erreur récupération quota:`, quotaError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch quota" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        // Si pas de quota, créer un
        let currentQuota = quota;
        if (!quota) {
          const { data: newQuota, error: createError } = await supabase.rpc(
            "ensure_quota_tracking_exists",
            { p_user_id: userId }
          );

          if (createError) {
            console.log(`[${timestamp}] [${requestId}] ❌ Erreur création quota:`, createError);
            return new Response(
              JSON.stringify({ success: false, error: "Failed to create quota" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          // Récupérer le quota créé
          const { data: createdQuota } = await supabase
            .from("quota_tracking")
            .select("*")
            .eq("user_id", userId)
            .single();

          currentQuota = createdQuota;
        }

        // Vérifier les limites (valeurs par défaut pour l'instant)
        const totalLimit = 100;
        const actionLimit = {
          conversation_created: 100,
          poll_created: 50,
          ai_message: 100,
          analytics_query: 100,
          simulation: 20,
          other: 100,
        }[action] || 100;

        const currentTotal = currentQuota?.total_credits_consumed || 0;
        const currentActionCount = {
          conversation_created: currentQuota?.conversations_created || 0,
          poll_created: currentQuota?.polls_created || 0,
          ai_message: currentQuota?.ai_messages || 0,
          analytics_query: currentQuota?.analytics_queries || 0,
          simulation: currentQuota?.simulations || 0,
          other: 0,
        }[action] || 0;

        const allowed = 
          currentTotal + credits <= totalLimit &&
          currentActionCount < actionLimit;

        return new Response(
          JSON.stringify({
            success: true,
            allowed,
            currentQuota: currentQuota ? {
              conversationsCreated: currentQuota.conversations_created,
              pollsCreated: currentQuota.polls_created,
              datePollsCreated: currentQuota.date_polls_created || 0,
              formPollsCreated: currentQuota.form_polls_created || 0,
              quizzCreated: currentQuota.quizz_created || 0,
              availabilityPollsCreated: currentQuota.availability_polls_created || 0,
              aiMessages: currentQuota.ai_messages,
              analyticsQueries: currentQuota.analytics_queries,
              simulations: currentQuota.simulations,
              totalCreditsConsumed: currentQuota.total_credits_consumed,
              subscriptionStartDate: currentQuota.subscription_start_date,
              lastResetDate: currentQuota.last_reset_date,
              userId: currentQuota.user_id,
            } : null,
            reason: allowed ? undefined : "Quota limit reached",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      case "consumeCredits": {
        const { action, credits, metadata }: ConsumeCreditsRequest = body;
        console.log(`[${timestamp}] [${requestId}] 💳 Consume credits: ${action}, ${credits} crédits`);

        // 1) Vérifier le rate limiting horaire (userId + IP) avant de consommer les crédits
        const hourlyLimit = HOURLY_LIMITS[action] ?? DEFAULT_HOURLY_LIMIT;

        const { data: rateLimit, error: rateError } = await supabase.rpc(
          "can_consume_rate_limit",
          {
            p_user_id: userId,
            p_ip: ip,
            p_action: action,
            p_limit_per_hour: hourlyLimit,
          },
        );

        if (rateError) {
          console.log(
            `[${timestamp}] [${requestId}] ❌ Erreur rate limit:`,
            rateError,
          );
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to check rate limit",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        if (rateLimit && rateLimit.allowed === false) {
          console.log(
            `[${timestamp}] [${requestId}] ⚠️  Rate limit exceeded pour ${action}`,
            rateLimit,
          );
          return new Response(
            JSON.stringify({
              success: false,
              error: "Rate limit exceeded",
              userCount: rateLimit.user_count ?? null,
              ipCount: rateLimit.ip_count ?? null,
              limit: rateLimit.limit ?? hourlyLimit,
            }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        // 2) Enrichir les metadata avec l'IP avant consommation (pour suivi et rate limiting futur)
        const enrichedMetadata = {
          ...(metadata || {}),
          ...(ip ? { ip } : {}),
        };

        // 3) Utiliser la fonction SQL atomique de consommation des crédits
        const { data, error } = await supabase.rpc("consume_quota_credits", {
          p_user_id: userId,
          p_action: action,
          p_credits: credits,
          p_metadata: enrichedMetadata,
        });

        if (error) {
          console.log(`[${timestamp}] [${requestId}] ❌ Erreur consommation:`, error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        if (!data.success) {
          console.log(`[${timestamp}] [${requestId}] ⚠️  Consommation refusée:`, data.error);
          return new Response(
            JSON.stringify({ success: false, error: data.error, currentTotal: data.current_total }),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const quota = data.quota;
        return new Response(
          JSON.stringify({
            success: true,
            quota: {
              conversationsCreated: quota.conversations_created,
              pollsCreated: quota.polls_created,
              datePollsCreated: quota.date_polls_created || 0,
              formPollsCreated: quota.form_polls_created || 0,
              quizzCreated: quota.quizz_created || 0,
              availabilityPollsCreated: quota.availability_polls_created || 0,
              aiMessages: quota.ai_messages,
              analyticsQueries: quota.analytics_queries,
              simulations: quota.simulations,
              totalCreditsConsumed: quota.total_credits_consumed,
              subscriptionStartDate: quota.subscription_start_date,
              lastResetDate: quota.last_reset_date,
              userId: quota.user_id,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      case "getJournal": {
        const { limit = 100 }: GetJournalRequest = body;
        console.log(`[${timestamp}] [${requestId}] 📜 Get journal: limit=${limit}`);

        // Récupérer le quota_tracking_id
        const { data: quota } = await supabase
          .from("quota_tracking")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!quota) {
          return new Response(
            JSON.stringify({ success: true, journal: [] }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const { data: journal, error: journalError } = await supabase
          .from("quota_tracking_journal")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (journalError) {
          console.log(`[${timestamp}] [${requestId}] ❌ Erreur récupération journal:`, journalError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch journal" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            journal: (journal || []).map((entry: any) => ({
              id: entry.id,
              timestamp: entry.created_at,
              action: entry.action,
              credits: entry.credits,
              userId: entry.user_id,
              metadata: entry.metadata,
            })),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
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

