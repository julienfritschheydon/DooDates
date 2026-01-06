#!/usr/bin/env node
/**
 * Gemini Predictive Analyzer - Analyse prédictive des échecs workflow avec Google Gemini
 *
 * Utilise l'Edge Function Supabase 'hyper-task' pour les appels Gemini
 * Fournit des analyses prédictives et des recommandations proactives
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Charger les variables d'environnement
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const HYPER_TASK_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/hyper-task` : null;

/**
 * Service Gemini Predictor via Supabase Edge Function
 */
export const geminiPredictor = {
  isAvailable: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
  model: "gemini-1.5-flash",

  /**
   * Appel générique à Gemini via Supabase Edge Function
   */
  async callGemini(prompt) {
    if (!this.isAvailable) {
      return {
        available: false,
        error: "Supabase configuration missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)",
      };
    }

    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Supabase Edge Function error: ${response.status} - ${errorData.message || response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Edge Function returned success: false");
      }

      return {
        available: true,
        text: data.data,
      };
    } catch (error) {
      console.error("❌ Erreur appel Supabase Edge Function:", error.message);
      return {
        available: false,
        error: error.message,
      };
    }
  },
};

/**
 * Analyse le risque d'un commit spécifique
 */
export async function analyzeCommitRisk(commitData, failures) {
  if (!geminiPredictor.isAvailable) {
    return getFallbackCommitRisk(commitData, failures);
  }

  const prompt = `Analyse le risque de ce commit GitHub:

Commit: ${commitData.sha}
Branche: ${commitData.branch}
Auteur: ${commitData.author}
Message: ${commitData.message}

Échecs détectés: ${failures.length}
${failures.map((f) => `- ${f.name}: ${f.error}`).join("\n")}

Fournis une analyse JSON avec:
{
  "riskLevel": "low|medium|high|critical",
  "confidence": 0-100,
  "reasons": ["raison1", "raison2"],
  "riskyWorkflows": ["workflow1"],
  "recommendations": ["rec1", "rec2"],
  "preventiveActions": ["action1"],
  "estimatedTimeToFailure": "immediate|hours|days|unknown"
}`;

  const result = await geminiPredictor.callGemini(prompt);

  if (!result.available) {
    return getFallbackCommitRisk(commitData, failures);
  }

  try {
    // Extraire le JSON de la réponse
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return { available: true, ...analysis };
    }
  } catch (error) {
    console.error("❌ Erreur parsing réponse Gemini:", error.message);
  }

  return getFallbackCommitRisk(commitData, failures);
}

/**
 * Analyse les tendances d'échec
 */
export async function analyzeFailureTrends(failureHistory) {
  if (!geminiPredictor.isAvailable) {
    return getFallbackTrendAnalysis(failureHistory);
  }

  const prompt = `Analyse les tendances d'échec de workflows GitHub:

Historique (${failureHistory.length} échecs):
${failureHistory
  .slice(0, 10)
  .map((f) => `- ${f.timestamp}: ${f.workflow} - ${f.error}`)
  .join("\n")}

Fournis une analyse JSON avec:
{
  "riskScore": 0-100,
  "trends": ["tendance1", "tendance2"],
  "emergingRisks": ["risque1"],
  "predictions": ["prediction1"],
  "preventiveActions": ["action1"]
}`;

  const result = await geminiPredictor.callGemini(prompt);

  if (!result.available) {
    return getFallbackTrendAnalysis(failureHistory);
  }

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return { available: true, ...analysis };
    }
  } catch (error) {
    console.error("❌ Erreur parsing réponse Gemini:", error.message);
  }

  return getFallbackTrendAnalysis(failureHistory);
}

/**
 * Génère des recommandations proactives
 */
export async function generateProactiveRecommendations(systemContext) {
  if (!geminiPredictor.isAvailable) {
    return getFallbackRecommendations(systemContext);
  }

  const prompt = `Génère des recommandations proactives pour un système CI/CD:

Contexte:
- Dernier succès: ${systemContext.lastSuccess}
- Taux d'échec: ${systemContext.failureRate}
- Workflows critiques: ${systemContext.criticalWorkflows.join(", ")}
- Technologies: ${systemContext.technologies.join(", ")}

Fournis des recommandations JSON avec:
{
  "quickWins": ["action rapide 1"],
  "longTerm": ["amélioration long terme 1"],
  "recommendations": [
    {
      "title": "Titre",
      "description": "Description",
      "priority": "high|medium|low",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "category": "testing|build|deployment|monitoring"
    }
  ]
}`;

  const result = await geminiPredictor.callGemini(prompt);

  if (!result.available) {
    return getFallbackRecommendations(systemContext);
  }

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return { available: true, ...analysis };
    }
  } catch (error) {
    console.error("❌ Erreur parsing réponse Gemini:", error.message);
  }

  return getFallbackRecommendations(systemContext);
}

/**
 * Fonctions de fallback (quand Supabase/Gemini n'est pas disponible)
 */
function getFallbackCommitRisk(commitData, failures) {
  const failureCount = failures.length;
  let riskLevel = "low";

  if (failureCount >= 3) riskLevel = "critical";
  else if (failureCount >= 2) riskLevel = "high";
  else if (failureCount >= 1) riskLevel = "medium";

  return {
    available: true,
    riskLevel,
    confidence: 60,
    reasons: [
      `${failureCount} échec(s) détecté(s) pour ce commit`,
      "Analyse basique sans IA (Supabase non configuré)",
    ],
    riskyWorkflows: failures.map((f) => f.name),
    recommendations: [
      "Vérifier les logs détaillés des workflows en échec",
      "Exécuter les tests localement avant de pousser",
      "Configurer Supabase pour une analyse approfondie avec Gemini",
    ],
    preventiveActions: ["Activer les pre-commit hooks", "Ajouter des tests de régression"],
    estimatedTimeToFailure: failureCount > 0 ? "immediate" : "unknown",
  };
}

function getFallbackTrendAnalysis(failureHistory) {
  const recentFailures = failureHistory.slice(0, 10);
  const riskScore = Math.min(100, recentFailures.length * 10);

  return {
    available: true,
    riskScore,
    trends: [
      `${recentFailures.length} échecs récents détectés`,
      "Analyse basique sans IA (Supabase non configuré)",
    ],
    emergingRisks: ["Impossible de détecter les risques émergents sans analyse IA"],
    predictions: ["Configurer Supabase pour des prédictions précises avec Gemini"],
    preventiveActions: [
      "Monitorer régulièrement les workflows",
      "Maintenir une couverture de tests élevée",
    ],
  };
}

function getFallbackRecommendations(systemContext) {
  return {
    available: true,
    quickWins: [
      "Activer le cache npm dans les workflows",
      "Paralléliser les tests indépendants",
      "Configurer Supabase pour des recommandations personnalisées avec Gemini",
    ],
    longTerm: [
      "Mettre en place une stratégie de tests progressive",
      "Implémenter des health checks automatiques",
      "Optimiser les temps de build",
    ],
    recommendations: [
      {
        title: "Activer l'analyse IA Gemini via Supabase",
        description:
          "Configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour obtenir des recommandations personnalisées basées sur l'IA",
        priority: "high",
        impact: "high",
        effort: "low",
        category: "monitoring",
      },
      {
        title: "Optimiser le cache des dépendances",
        description: "Utiliser le cache GitHub Actions pour npm/playwright",
        priority: "medium",
        impact: "medium",
        effort: "low",
        category: "build",
      },
      {
        title: "Paralléliser les tests E2E",
        description: "Exécuter les tests Playwright en parallèle sur plusieurs workers",
        priority: "medium",
        impact: "high",
        effort: "medium",
        category: "testing",
      },
    ],
  };
}
