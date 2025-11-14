/**
 * Test de charge pour l'Edge Function quota-tracking
 * 
 * Usage:
 *   k6 run --env JWT_TOKEN="votre_token" --env SUPABASE_URL="https://xxx.supabase.co" quota-tracking-load-test.js
 * 
 * Ou avec variables d'environnement:
 *   export JWT_TOKEN="votre_token"
 *   export SUPABASE_URL="https://xxx.supabase.co"
 *   k6 run quota-tracking-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');
const quotaCheckDuration = new Rate('quota_check_fast'); // < 500ms
const consumeDuration = new Rate('consume_fast'); // < 500ms

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Montée progressive : 0 → 10 utilisateurs
    { duration: '1m', target: 50 },    // Charge normale : 50 utilisateurs simultanés
    { duration: '30s', target: 100 },  // Pic de charge : 100 utilisateurs
    { duration: '1m', target: 50 },     // Retour à la normale
    { duration: '30s', target: 0 },    // Descente progressive
  ],
  thresholds: {
    // 95% des requêtes doivent être < 2s
    http_req_duration: ['p(95)<2000'],
    // < 1% d'erreurs
    http_req_failed: ['rate<0.01'],
    // Taux d'erreur personnalisé
    errors: ['rate<0.01'],
    // 80% des checkQuota doivent être < 500ms
    quota_check_fast: ['rate>0.8'],
    // 80% des consumeCredits doivent être < 500ms
    consume_fast: ['rate>0.8'],
  },
};

export default function () {
  const token = __ENV.JWT_TOKEN;
  const baseUrl = __ENV.SUPABASE_URL || 'https://outmbbisrrdiumlweira.supabase.co';
  
  if (!token) {
    console.error('❌ JWT_TOKEN manquant. Utilisez: k6 run --env JWT_TOKEN="votre_token" quota-tracking-load-test.js');
    return;
  }
  
  const edgeFunctionUrl = `${baseUrl}/functions/v1/quota-tracking`;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Test 1: checkQuota
  const checkQuotaBody = JSON.stringify({
    endpoint: 'checkQuota',
    action: 'other',
    credits: 0,
  });
  
  const checkRes = http.post(edgeFunctionUrl, checkQuotaBody, { headers });
  
  const checkQuotaOk = check(checkRes, {
    'checkQuota status is 200': (r) => r.status === 200,
    'checkQuota response time < 2s': (r) => r.timings.duration < 2000,
    'checkQuota has success field': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!checkQuotaOk);
  quotaCheckDuration.add(checkRes.timings.duration < 500);
  
  // Pause entre les requêtes (simuler comportement utilisateur)
  sleep(1);
  
  // Test 2: consumeCredits (seulement si checkQuota OK)
  if (checkRes.status === 200) {
    const consumeBody = JSON.stringify({
      endpoint: 'consumeCredits',
      action: 'other',
      credits: 1,
      metadata: {
        test: true,
        loadTest: true,
        timestamp: new Date().toISOString(),
      },
    });
    
    const consumeRes = http.post(edgeFunctionUrl, consumeBody, { headers });
    
    const consumeOk = check(consumeRes, {
      'consumeCredits status is 200': (r) => r.status === 200,
      'consumeCredits response time < 2s': (r) => r.timings.duration < 2000,
      'consumeCredits has success field': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.success !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!consumeOk);
    consumeDuration.add(consumeRes.timings.duration < 500);
  }
  
  // Pause avant prochaine itération
  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}📊 Résultats du test de charge\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Métriques HTTP
  const httpMetrics = data.metrics.http_req_duration;
  if (httpMetrics) {
    summary += `${indent}⏱️  Temps de réponse:\n`;
    summary += `${indent}  - Moyenne: ${httpMetrics.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  - Médiane (p50): ${httpMetrics.values.med.toFixed(2)}ms\n`;
    summary += `${indent}  - p95: ${httpMetrics.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  - p99: ${httpMetrics.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  - Max: ${httpMetrics.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Taux d'erreur
  const errorMetrics = data.metrics.http_req_failed;
  if (errorMetrics) {
    const errorRate = (errorMetrics.values.rate * 100).toFixed(2);
    summary += `${indent}❌ Taux d'erreur: ${errorRate}%\n\n`;
  }
  
  // Throughput
  const httpReqMetrics = data.metrics.http_reqs;
  if (httpReqMetrics) {
    summary += `${indent}📈 Throughput:\n`;
    summary += `${indent}  - Total requêtes: ${httpReqMetrics.values.count}\n`;
    summary += `${indent}  - Requêtes/seconde: ${httpReqMetrics.values.rate.toFixed(2)}\n\n`;
  }
  
  // Vérification des seuils
  summary += `${indent}✅ Seuils:\n`;
  const thresholds = data.metrics;
  for (const [name, metric] of Object.entries(thresholds)) {
    if (metric.thresholds) {
      for (const [threshold, passed] of Object.entries(metric.thresholds)) {
        const status = passed ? '✅' : '❌';
        summary += `${indent}  ${status} ${name}: ${threshold}\n`;
      }
    }
  }
  
  return summary;
}

