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

// Origines CORS autorisées
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173", // Vite dev server par défaut
  "http://localhost:3000", // Autre port dev commun
  "https://julienfritschheydon.github.io", // Production GitHub Pages
];

// Patterns d'origines autorisées (pour plus de flexibilité)
const ALLOWED_PATTERNS = [
  /^http:\/\/localhost:\d+$/, // Tous les localhost avec n'importe quel port
  /^https:\/\/julienfritschheydon\.github\.io$/, // Production GitHub Pages
  /^https:\/\/.*\.github\.io$/, // Tous les GitHub Pages (pour les forks)
];

// Fonction helper pour obtenir les headers CORS
function getCorsHeaders(origin: string | null): HeadersInit {
  let allowedOrigin: string | null = null;
  
  if (origin) {
    // Vérifier si l'origine est dans la liste exacte
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    } else {
      // Vérifier si l'origine correspond à un pattern
      for (const pattern of ALLOWED_PATTERNS) {
        if (pattern.test(origin)) {
          allowedOrigin = origin;
          break;
        }
      }
    }
  }
  
  // Fallback : utiliser la première origine de la liste (localhost:8080)
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

serve(async (req) => {
  // Log IMMÉDIATEMENT au début pour capturer toutes les requêtes
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [${requestId}] ========================================`);
  console.log(`[${timestamp}] [${requestId}] 🚀 EDGE FUNCTION DÉMARRÉE`);
  console.log(`[${timestamp}] [${requestId}] ========================================`);
  
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  console.log(`[${timestamp}] [${requestId}] 📥 Requête reçue:`, {
    method: req.method,
    origin,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
  });

  // CORS preflight
  if (req.method === "OPTIONS") {
    console.log(`[${timestamp}] [${requestId}] ✅ CORS preflight OK`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Vérifier méthode
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Récupérer l'IP du client
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    console.log(`[${timestamp}] [${requestId}] 🌐 IP client: ${clientIp}`);

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
      console.log(`[${timestamp}] [${requestId}] 🔐 Vérification authentification...`);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && user) {
        userId = user.id;
        isAuthenticated = true;
        console.log(`[${timestamp}] [${requestId}] ✅ Utilisateur authentifié: ${userId}`);
      } else {
        console.log(`[${timestamp}] [${requestId}] ⚠️  Authentification échouée:`, authError?.message || "Token invalide");
      }
    } else {
      console.log(`[${timestamp}] [${requestId}] 👤 Mode invité (pas d'authentification)`);
    }

    // Rate limiting par IP
    const ipKey = `ip:${clientIp}`;
    const ipLimit = checkRateLimit(ipKey, RATE_LIMITS.ip);
    console.log(`[${timestamp}] [${requestId}] ⏱️  Rate limit IP:`, { allowed: ipLimit.allowed, retryAfter: ipLimit.retryAfter });
    if (!ipLimit.allowed) {
      console.log(`[${timestamp}] [${requestId}] ❌ Rate limit IP dépassé`);
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
            ...corsHeaders,
          },
        },
      );
    }

    // Rate limiting par userId (si authentifié)
    if (isAuthenticated) {
      const userKey = `user:${userId}`;
      const userLimit = checkRateLimit(userKey, RATE_LIMITS.authenticated);
      console.log(`[${timestamp}] [${requestId}] ⏱️  Rate limit User:`, { allowed: userLimit.allowed, retryAfter: userLimit.retryAfter });
      if (!userLimit.allowed) {
        console.log(`[${timestamp}] [${requestId}] ❌ Rate limit User dépassé`);
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
              ...corsHeaders,
            },
          },
        );
      }
    } else {
      // Rate limiting pour invités
      const guestKey = `guest:${clientIp}`;
      const guestLimit = checkRateLimit(guestKey, RATE_LIMITS.guest);
      console.log(`[${timestamp}] [${requestId}] ⏱️  Rate limit Guest:`, { allowed: guestLimit.allowed, retryAfter: guestLimit.retryAfter });
      if (!guestLimit.allowed) {
        console.log(`[${timestamp}] [${requestId}] ❌ Rate limit Guest dépassé`);
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
              ...corsHeaders,
            },
          },
        );
      }
    }

    // Vérifier et consommer le quota (si authentifié)
    if (isAuthenticated && userId) {
      console.log(`[${timestamp}] [${requestId}] 💳 Vérification quota utilisateur...`);
      const quotaCheck = await checkAndConsumeQuota(supabase, userId);
      console.log(`[${timestamp}] [${requestId}] 💳 Résultat quota:`, { 
        success: quotaCheck.success, 
        creditsRemaining: quotaCheck.creditsRemaining,
        error: quotaCheck.error 
      });
      if (!quotaCheck.success) {
        console.log(`[${timestamp}] [${requestId}] ❌ Quota insuffisant:`, quotaCheck.message);
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
              ...corsHeaders,
            },
          },
        );
      }
    }

    // Récupérer le body de la requête
    let body;
    try {
      body = await req.json();
      console.log(`[${timestamp}] [${requestId}] 📦 Body reçu:`, { 
        hasUserInput: !!body.userInput, 
        hasPrompt: !!body.prompt,
        userInputLength: body.userInput?.length || 0,
        promptLength: body.prompt?.length || 0
      });
    } catch (error) {
      console.log(`[${timestamp}] [${requestId}] ❌ Erreur parsing JSON:`, error);
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
            ...corsHeaders,
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
            ...corsHeaders,
          },
        },
      );
    }

    // Récupérer la clé API Gemini (variable serveur)
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error(`[${timestamp}] [${requestId}] ❌ GEMINI_API_KEY non configurée`);
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
            ...corsHeaders,
          },
        },
      );
    }

    // Appeler Gemini API
    const geminiPrompt = prompt || userInput;
    console.log(`[${timestamp}] [${requestId}] 🤖 Appel Gemini API...`, { 
      promptLength: geminiPrompt?.length || 0 
    });
    
    const geminiStartTime = Date.now();
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
    const geminiDuration = Date.now() - geminiStartTime;

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`[${timestamp}] [${requestId}] ❌ Gemini API error (${geminiResponse.status}):`, errorText);
      
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
            ...corsHeaders,
          },
        },
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`[${timestamp}] [${requestId}] ✅ Gemini API réponse reçue (${geminiDuration}ms)`, { 
      hasResponse: !!responseText,
      responseLength: responseText?.length || 0 
    });

    if (!responseText) {
      console.log(`[${timestamp}] [${requestId}] ❌ Réponse Gemini invalide (pas de texte)`);
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
            ...corsHeaders,
          },
        },
      );
    }

    // Log audit (optionnel - peut être stocké en DB)
    if (isAuthenticated) {
      console.log(`[${timestamp}] [${requestId}] [AUDIT] User ${userId} consumed 1 credit`);
    }

    // Retourner la réponse
    console.log(`[${timestamp}] [${requestId}] ✅ Réponse envoyée avec succès`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseText 
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error(`[${timestamp}] [${requestId}] ❌ Erreur Edge Function:`, error);
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
          ...corsHeaders,
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

