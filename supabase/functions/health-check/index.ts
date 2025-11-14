/**
 * Health Check Edge Function
 * 
 * Vérifie la santé de tous les services critiques :
 * - Base de données Supabase
 * - Edge Functions (quota-tracking)
 * - Storage (si utilisé)
 * 
 * Usage:
 *   GET/POST https://xxx.supabase.co/functions/v1/health-check
 * 
 * Réponse:
 *   {
 *     "timestamp": "2025-11-14T10:00:00Z",
 *     "status": "healthy",
 *     "checks": {
 *       "database": { "status": "ok", "latency": 50 },
 *       "edgeFunctions": { "status": "ok", "latency": 100 },
 *       "storage": { "status": "ok", "latency": 30 }
 *     }
 *   }
 */

// @ts-expect-error: Deno global is available in Deno runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error: Deno URL imports are valid in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno URL imports are valid in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface HealthCheckResult {
  status: 'ok' | 'error';
  latency: number;
  error?: string;
}

interface HealthCheckResponse {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: HealthCheckResult;
    edgeFunctions: HealthCheckResult;
    storage?: HealthCheckResult;
  };
  version?: string;
}

serve(async (req) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check 1: Database
    const dbCheckStart = Date.now();
    let dbCheck: HealthCheckResult;
    try {
      const { error } = await supabase.from('quota_tracking').select('id').limit(1);
      const latency = Date.now() - dbCheckStart;
      dbCheck = {
        status: error ? 'error' : 'ok',
        latency,
        error: error?.message,
      };
    } catch (error) {
      dbCheck = {
        status: 'error',
        latency: Date.now() - dbCheckStart,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    
    // Check 2: Edge Functions (quota-tracking)
    const edgeCheckStart = Date.now();
    let edgeCheck: HealthCheckResult;
    try {
      // Tester l'Edge Function avec une requête simple (sans auth pour health check)
      // Note: L'Edge Function nécessite un token, donc on teste juste la connectivité
      const response = await fetch(`${supabaseUrl}/functions/v1/quota-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'checkQuota',
          action: 'other',
          credits: 0,
        }),
      });
      
      const latency = Date.now() - edgeCheckStart;
      // On accepte 401 (pas de token) comme "ok" car ça signifie que l'Edge Function répond
      edgeCheck = {
        status: (response.status === 401 || response.status === 200) ? 'ok' : 'error',
        latency,
        error: response.status !== 401 && response.status !== 200 ? `HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      edgeCheck = {
        status: 'error',
        latency: Date.now() - edgeCheckStart,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    
    // Check 3: Storage (optionnel)
    const storageCheckStart = Date.now();
    let storageCheck: HealthCheckResult | undefined;
    try {
      // Tester l'accès au storage (si utilisé)
      const { data, error } = await supabase.storage.listBuckets();
      const latency = Date.now() - storageCheckStart;
      storageCheck = {
        status: error ? 'error' : 'ok',
        latency,
        error: error?.message,
      };
    } catch (error) {
      // Storage peut ne pas être utilisé, donc on ignore les erreurs
      storageCheck = undefined;
    }
    
    // Déterminer le statut global
    const allChecks = [dbCheck, edgeCheck, storageCheck].filter(Boolean) as HealthCheckResult[];
    const allOk = allChecks.every(c => c.status === 'ok');
    const someOk = allChecks.some(c => c.status === 'ok');
    
    const globalStatus: 'healthy' | 'degraded' | 'unhealthy' = 
      allOk ? 'healthy' : 
      someOk ? 'degraded' : 
      'unhealthy';
    
    const response: HealthCheckResponse = {
      timestamp,
      status: globalStatus,
      checks: {
        database: dbCheck,
        edgeFunctions: edgeCheck,
        ...(storageCheck && { storage: storageCheck }),
      },
      version: '1.0.0',
    };
    
    const statusCode = globalStatus === 'healthy' ? 200 : globalStatus === 'degraded' ? 200 : 503;
    
    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    const response: HealthCheckResponse = {
      timestamp,
      status: 'unhealthy',
      checks: {
        database: {
          status: 'error',
          latency: 0,
          error: error instanceof Error ? error.message : String(error),
        },
        edgeFunctions: {
          status: 'error',
          latency: 0,
          error: 'Health check failed',
        },
      },
    };
    
    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

