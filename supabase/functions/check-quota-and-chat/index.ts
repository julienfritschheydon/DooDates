// @ts-nocheck
// Edge Function pour sécuriser les appels Gemini API
// Vérifie les quotas et appelle Gemini API côté serveur

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface RateLimitEntry {
  hourlyCount: number;
  hourlyResetAt: number;
  dailyCount: number;
  dailyResetAt: number;
}

// Rate limiting en mémoire (pour Edge Functions stateless, utiliser Redis en production)
const rateLimitCache = new Map<string, RateLimitEntry>();

// Rate limits
const RATE_LIMITS = {
  authenticated: { perHour: 100, perDay: 1000 },
  guest: { perHour: 10, perDay: 20 }, // Limite stricte pour invités
  ip: { perHour: 100, perDay: 500 },
};

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    // Vérifier méthode
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Récupérer l'IP du client
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier l'authentification (optionnelle pour invités)
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let isAuthenticated = false;

    if (authHeader) {
      // Vérifier le JWT si présent
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && user) {
        userId = user.id;
        isAuthenticated = true;
      }
    }

    // Rate limiting par IP
    const ipKey = `ip:${clientIp}`;
    const ipLimit = checkRateLimit(ipKey, RATE_LIMITS.ip);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RATE_LIMIT_EXCEEDED",
          message: `Limite de requêtes dépassée. Réessayez dans ${ipLimit.retryAfter} secondes.` 
        }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": ipLimit.retryAfter.toString(),
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Rate limiting par userId (si authentifié)
    if (isAuthenticated) {
      const userKey = `user:${userId}`;
      const userLimit = checkRateLimit(userKey, RATE_LIMITS.authenticated);
      if (!userLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "RATE_LIMIT_EXCEEDED",
            message: `Limite de requêtes dépassée. Réessayez dans ${userLimit.retryAfter} secondes.` 
          }),
          {
            status: 429,
            headers: { 
              "Content-Type": "application/json",
              "Retry-After": userLimit.retryAfter.toString(),
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    } else {
      // Rate limiting pour invités
      const guestKey = `guest:${clientIp}`;
      const guestLimit = checkRateLimit(guestKey, RATE_LIMITS.guest);
      if (!guestLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "RATE_LIMIT_EXCEEDED",
            message: `Limite de requêtes dépassée pour les invités. Créez un compte pour plus de crédits.` 
          }),
          {
            status: 429,
            headers: { 
              "Content-Type": "application/json",
              "Retry-After": guestLimit.retryAfter.toString(),
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    }

    // Vérifier et consommer le quota (si authentifié)
    if (isAuthenticated && userId) {
      const quotaCheck = await checkAndConsumeQuota(supabase, userId);
      if (!quotaCheck.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: quotaCheck.error,
            message: quotaCheck.message,
            creditsRemaining: quotaCheck.creditsRemaining 
          }),
          {
            status: 403,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    }

    // Récupérer le body de la requête
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "INVALID_REQUEST",
          message: "Body JSON invalide" 
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
    const { userInput, prompt } = body;

    if (!userInput && !prompt) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "INVALID_REQUEST",
          message: "userInput ou prompt requis" 
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Récupérer la clé API Gemini (variable serveur)
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY non configurée");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SERVER_ERROR",
          message: "Configuration serveur manquante" 
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Appeler Gemini API
    const geminiPrompt = prompt || userInput;
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: geminiPrompt,
            }],
          }],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      
      // Si erreur de quota Gemini, ne pas consommer notre quota
      if (geminiResponse.status === 429) {
        // Rollback quota si authentifié
        if (isAuthenticated && userId) {
          await rollbackQuota(supabase, userId);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "GEMINI_API_ERROR",
          message: "Erreur lors de l'appel à l'API Gemini" 
        }),
        {
          status: geminiResponse.status,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "PARSE_ERROR",
          message: "Réponse Gemini invalide" 
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Log audit (optionnel - peut être stocké en DB)
    if (isAuthenticated) {
      console.log(`[AUDIT] User ${userId} consumed 1 credit at ${new Date().toISOString()}`);
    }

    // Retourner la réponse
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseText 
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erreur serveur" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

// Fonction pour vérifier et consommer le quota
async function checkAndConsumeQuota(
  supabase: any,
  userId: string,
): Promise<{ success: boolean; error?: string; message?: string; creditsRemaining?: number }> {
  try {
    // Transaction atomique : vérifier et consommer en une seule opération
    const { data, error } = await supabase.rpc("consume_ai_credit", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Quota check error:", error);
      return {
        success: false,
        error: "QUOTA_ERROR",
        message: "Erreur lors de la vérification du quota",
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: "QUOTA_EXCEEDED",
        message: data?.message || "Quota dépassé",
        creditsRemaining: data?.credits_remaining || 0,
      };
    }

    return {
      success: true,
      creditsRemaining: data.credits_remaining,
    };
  } catch (error) {
    console.error("Quota check exception:", error);
    return {
      success: false,
      error: "QUOTA_ERROR",
      message: "Erreur lors de la vérification du quota",
    };
  }
}

// Fonction pour rollback le quota en cas d'erreur Gemini
async function rollbackQuota(supabase: any, userId: string): Promise<void> {
  try {
    await supabase.rpc("rollback_ai_credit", {
      p_user_id: userId,
    });
  } catch (error) {
    console.error("Rollback quota error:", error);
  }
}

// Fonction de rate limiting
function checkRateLimit(
  key: string,
  limits: { perHour: number; perDay: number },
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  let entry = rateLimitCache.get(key);
  
  // Initialiser si première requête
  if (!entry) {
    entry = {
      hourlyCount: 0,
      hourlyResetAt: now + oneHour,
      dailyCount: 0,
      dailyResetAt: now + oneDay,
    };
  }
  
  // Réinitialiser fenêtre horaire si expirée
  if (entry.hourlyResetAt < now) {
    entry.hourlyCount = 0;
    entry.hourlyResetAt = now + oneHour;
  }
  
  // Réinitialiser fenêtre quotidienne si expirée
  if (entry.dailyResetAt < now) {
    entry.dailyCount = 0;
    entry.dailyResetAt = now + oneDay;
  }

  // Vérifier limite horaire
  if (entry.hourlyCount >= limits.perHour) {
    const retryAfter = Math.ceil((entry.hourlyResetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Vérifier limite quotidienne
  if (entry.dailyCount >= limits.perDay) {
    const retryAfter = Math.ceil((entry.dailyResetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrémenter les compteurs
  entry.hourlyCount++;
  entry.dailyCount++;
  rateLimitCache.set(key, entry);

  return { allowed: true, retryAfter: 0 };
}

