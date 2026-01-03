/**
 * Test de rate limiting avec k6
 *
 * Ce test vérifie que l'Edge Function respecte les limites horaires
 * en mode test (limites basses pour exécution rapide)
 *
 * Usage:
 *   k6 run --env JWT_TOKEN="votre_token" --env SUPABASE_URL="https://xxx.supabase.co" rate-limiting-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Métriques personnalisées
const errorRate = new Rate("errors");
const rateLimitHits = new Rate("rate_limits_hit");

export const options = {
  stages: [
    { duration: "10s", target: 1 }, // 1 utilisateur pendant 10s
  ],
  thresholds: {
    // Taux d'erreur attendu (HTTP 429 pour rate limiting)
    http_req_failed: ["rate<0.2"], // < 20% d'erreurs
    errors: ["rate<0.2"],
    // Au moins une requête doit être bloquée par rate limiting
    rate_limits_hit: ["rate>0.1"], // > 10% de rate limit hits
  },
};

const BASE_URL = __ENV.SUPABASE_URL || "https://outmbbisrrdiumlweira.supabase.co";
const TOKEN = __ENV.JWT_TOKEN;
const EDGE_FUNCTION_URL = `${BASE_URL}/functions/v1/quota-tracking`;

if (!TOKEN) {
  throw new Error('❌ JWT_TOKEN requis. Utilisez: --env JWT_TOKEN="votre_token"');
}

export default function () {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "X-Test-Mode": "true",
  };

  const testAction = "conversation_created";
  const limit = 3; // Limite de test

  console.log(`🧪 Test rate limiting - Action: ${testAction}, Limite: ${limit}`);

  let successCount = 0;
  let rateLimitCount = 0;
  let otherErrors = 0;

  // Envoyer 5 requêtes (doit dépasser la limite de 3)
  for (let i = 1; i <= 5; i++) {
    console.log(`📊 Requête ${i}/5`);

    const response = http.post(
      EDGE_FUNCTION_URL,
      JSON.stringify({
        action: "consumeCredits",
        action: testAction,
        credits: 1,
        metadata: {
          test: "k6-rate-limiting",
          iteration: i,
          timestamp: new Date().toISOString(),
        },
      }),
      { headers },
    );

    const success = check(response, {
      "status is 200 or 429": (r) => r.status === 200 || r.status === 429,
      "response time < 2000ms": (r) => r.timings.duration < 2000,
    });

    if (!success) {
      errorRate.add(1);
      otherErrors++;
      console.error(`❌ Erreur inattendue: ${response.status} - ${response.body}`);
    } else if (response.status === 429) {
      rateLimitHits.add(1);
      rateLimitCount++;
      console.log(`🚫 Rate limit atteint (HTTP 429) - Requête ${i}`);

      // Vérifier le format de la réponse
      const body = JSON.parse(response.body);
      check(body, {
        "error message is correct": (b) => b.error === "Rate limit exceeded",
        "limit is present": (b) => typeof b.limit === "number",
        "limit matches expected": (b) => b.limit === limit,
      });
    } else if (response.status === 200) {
      successCount++;
      const body = JSON.parse(response.body);
      check(body, {
        "success is true": (b) => b.success === true,
      });
      console.log(`✅ Requête ${i} acceptée`);
    }

    // Petit délai entre les requêtes
    sleep(0.5);
  }

  console.log(`📊 Résultats du test:`);
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   🚫 Rate limit: ${rateLimitCount}`);
  console.log(`   ❌ Autres erreurs: ${otherErrors}`);
  console.log(`   📈 Taux de rate limiting: ${((rateLimitCount / 5) * 100).toFixed(1)}%`);

  // Vérifications finales
  check(rateLimitCount, {
    "at least one request was rate limited": (count) => count >= 1,
    "success count is within limit": (count) => count <= limit,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "rate-limiting-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || "";
  let summary = `${indent}=== Rate Limiting Test Summary ===\n`;

  summary += `${indent}Total Requests: ${data.metrics.http_reqs.count}\n`;
  summary += `${indent}Successful (200): ${data.metrics.http_reqs.tags.status_200?.count || 0}\n`;
  summary += `${indent}Rate Limited (429): ${data.metrics.http_reqs.tags.status_429?.count || 0}\n`;
  summary += `${indent}Other Errors: ${data.metrics.http_reqs.count - (data.metrics.http_reqs.tags.status_200?.count || 0) - (data.metrics.http_reqs.tags.status_429?.count || 0)}\n`;
  summary += `${indent}Error Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}Rate Limit Hit Rate: ${(data.metrics.rate_limits_hit.rate * 100).toFixed(2)}%\n`;

  return summary;
}
