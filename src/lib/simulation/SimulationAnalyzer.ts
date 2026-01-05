/**
 * SimulationAnalyzer - Analyse des résultats et détection de problèmes
 *
 * Analyse les réponses simulées pour détecter les problèmes potentiels
 * dans le questionnaire (biais, abandon, questions complexes, etc.)
 */

import { ErrorFactory } from "../error-handling";
import type {
  SimulationResult,
  SimulatedRespondent,
  DetectedIssue,
  QuestionMetrics,
  SimulationMetrics,
  IssueSeverity,
  ConfidenceLevel,
  SimulationContext,
  ObjectiveValidation,
} from "../../types/simulation";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger";
import { GEMINI_CONFIG } from "../../config/gemini";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_MODEL = GEMINI_CONFIG.MODEL_NAME;

// ============================================================================
// SEUILS DE DÉTECTION (adaptatifs selon contexte)
// ============================================================================

const BIAS_THRESHOLDS: Record<SimulationContext, number> = {
  event: 0.8, // Événement : Variance moyenne
  feedback: 0.7, // Feedback : Haute variance (positif/négatif)
  leisure: 0.75, // Loisirs : Variance moyenne-haute
  association: 0.85, // Association : Moins de variance
  research: 0.9, // Recherche : Très peu de biais acceptable
};

// Seuils réalistes basés sur benchmarks industrie
const DROPOFF_THRESHOLD = 0.4; // 40% d'abandon = warning (normal < 40%)
const CRITICAL_DROPOFF_THRESHOLD = 0.6; // 60% d'abandon = critical
const LOW_RESPONSE_THRESHOLD = 0.4; // < 40% réponses = warning (normal > 40%)
const HIGH_TIME_THRESHOLD = 90; // > 90s par question = warning (normal < 90s)

// ============================================================================
// CALCUL MÉTRIQUES PAR QUESTION
// ============================================================================

/**
 * Calcule les métriques pour une question
 */
function calculateQuestionMetrics(
  questionId: string,
  respondents: SimulatedRespondent[],
  questionIndex: number,
): QuestionMetrics {
  const responses = respondents.map((r) => r.responses[questionIndex]).filter(Boolean);
  const validResponses = responses.filter((r) => r?.value !== null);

  // Taux de réponse
  const responseRate = validResponses.length / respondents.length;

  // Temps moyen
  const avgTimeSpent =
    validResponses.length > 0
      ? validResponses.reduce((sum, r) => sum + r.timeSpent, 0) / validResponses.length
      : 0;

  // Taux d'abandon après cette question
  const respondentsReachingQuestion = respondents.filter(
    (r) => r.responses.length > questionIndex,
  ).length;
  const respondentsCompletingQuestion = respondents.filter(
    (r) => r.responses.length > questionIndex && r.responses[questionIndex]?.value !== null,
  ).length;
  const dropoffRate =
    respondentsReachingQuestion > 0
      ? 1 - respondentsCompletingQuestion / respondentsReachingQuestion
      : 0;

  // Distribution (pour questions à choix)
  const distribution: Record<string, number> = {};
  validResponses.forEach((response) => {
    if (typeof response.value === "string") {
      distribution[response.value] = (distribution[response.value] || 0) + 1;
    } else if (Array.isArray(response.value)) {
      response.value.forEach((val) => {
        distribution[val] = (distribution[val] || 0) + 1;
      });
    }
  });

  return {
    questionId,
    responseRate,
    avgTimeSpent,
    dropoffRate,
    distribution: Object.keys(distribution).length > 0 ? distribution : undefined,
  };
}

// ============================================================================
// DÉTECTION PROBLÈMES
// ============================================================================

/**
 * Détecte un biais dans la distribution des réponses
 */
function detectBias(metrics: QuestionMetrics, context: SimulationContext): DetectedIssue | null {
  if (!metrics.distribution) return null;

  const total = Object.values(metrics.distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;

  const percentages = Object.entries(metrics.distribution).map(([option, count]) => ({
    option,
    percentage: count / total,
  }));

  const maxPercentage = Math.max(...percentages.map((p) => p.percentage));
  const threshold = BIAS_THRESHOLDS[context];

  if (maxPercentage > threshold) {
    const dominantOption = percentages.find((p) => p.percentage === maxPercentage);
    const confidence: ConfidenceLevel = maxPercentage > 0.9 ? "high" : "medium";

    return {
      id: uuidv4(),
      severity: "warning",
      confidence,
      title: "Distribution potentiellement biaisée",
      description: `${(maxPercentage * 100).toFixed(1)}% des répondants choisissent la même option (seuil: ${(threshold * 100).toFixed(0)}%)`,
      questionId: metrics.questionId,
      recommendations: [
        "Vérifier si la question est orientée vers une réponse",
        "S'assurer que toutes les options sont équilibrées",
        "Considérer reformuler la question de manière plus neutre",
      ],
    };
  }

  return null;
}

/**
 * Détecte un taux de réponse faible
 */
function detectLowResponse(metrics: QuestionMetrics): DetectedIssue | null {
  if (metrics.responseRate < LOW_RESPONSE_THRESHOLD) {
    const severity: IssueSeverity = metrics.responseRate < 0.4 ? "critical" : "warning";
    const confidence: ConfidenceLevel = metrics.responseRate < 0.4 ? "high" : "medium";

    return {
      id: uuidv4(),
      severity,
      confidence,
      title: "Taux de réponse faible",
      description: `Seulement ${(metrics.responseRate * 100).toFixed(1)}% des répondants ont répondu à cette question`,
      questionId: metrics.questionId,
      recommendations: [
        "Vérifier si la question est claire et compréhensible",
        "Considérer rendre la question optionnelle si elle est trop personnelle",
        "Simplifier la question si elle semble trop complexe",
      ],
    };
  }

  return null;
}

/**
 * Détecte un taux d'abandon élevé
 */
function detectHighDropoff(metrics: QuestionMetrics): DetectedIssue | null {
  if (metrics.dropoffRate > DROPOFF_THRESHOLD) {
    const severity: IssueSeverity =
      metrics.dropoffRate > CRITICAL_DROPOFF_THRESHOLD ? "critical" : "warning";
    const confidence: ConfidenceLevel =
      metrics.dropoffRate > CRITICAL_DROPOFF_THRESHOLD ? "high" : "medium";

    return {
      id: uuidv4(),
      severity,
      confidence,
      title: "Taux d'abandon élevé",
      description: `${(metrics.dropoffRate * 100).toFixed(1)}% des répondants abandonnent après cette question`,
      questionId: metrics.questionId,
      recommendations: [
        "Cette question pourrait être trop longue ou complexe",
        "Considérer la déplacer plus tard dans le questionnaire",
        "Vérifier si elle est vraiment nécessaire",
      ],
    };
  }

  return null;
}

/**
 * Détecte une question trop longue
 */
function detectHighTime(metrics: QuestionMetrics): DetectedIssue | null {
  if (metrics.avgTimeSpent > HIGH_TIME_THRESHOLD) {
    return {
      id: uuidv4(),
      severity: "info",
      confidence: "medium",
      title: "Question chronophage",
      description: `Temps moyen de ${Math.round(metrics.avgTimeSpent)}s par répondant`,
      questionId: metrics.questionId,
      recommendations: [
        "Considérer simplifier la question",
        "Diviser en plusieurs questions plus courtes",
        "Ajouter des exemples pour clarifier",
      ],
    };
  }

  return null;
}

/**
 * Détecte matrices trop complexes
 */
function detectComplexMatrix(
  questions: Array<{
    id: string;
    type: string;
    title: string;
    matrixRows?: Array<{ id: string; label: string }>;
  }>,
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  questions.forEach((question) => {
    if (question.type === "matrix" && question.matrixRows && question.matrixRows.length > 5) {
      issues.push({
        id: uuidv4(),
        severity: "warning",
        confidence: "medium",
        title: "Matrice trop complexe",
        description: `${question.matrixRows.length} lignes dans la matrice (recommandé : max 5)`,
        questionId: question.id,
        recommendations: [
          "Réduire le nombre de lignes",
          "Diviser en plusieurs matrices plus simples",
          "Considérer utiliser des questions séparées",
        ],
      });
    }
  });

  return issues;
}

/**
 * Détecte trop de questions texte obligatoires
 */
function detectTooManyRequiredText(
  questionMetrics: QuestionMetrics[],
  questions: Array<{ id: string; type: string; required?: boolean }>,
): DetectedIssue | null {
  const requiredTextQuestions = questions.filter((q) => q.type === "text" && q.required === true);

  if (requiredTextQuestions.length > 3) {
    return {
      id: uuidv4(),
      severity: "warning",
      confidence: "medium",
      title: "Trop de questions texte obligatoires",
      description: `${requiredTextQuestions.length} questions texte obligatoires (recommandé : max 3)`,
      recommendations: [
        "Rendre certaines questions texte optionnelles",
        "Remplacer par des questions à choix multiples",
        "Réduire le nombre de questions texte pour éviter la fatigue",
      ],
    };
  }

  return null;
}

/**
 * Détecte un questionnaire trop long
 */
function detectLongSurvey(metrics: SimulationMetrics): DetectedIssue | null {
  if (metrics.avgTotalTime > 300) {
    // > 5 minutes
    const severity: IssueSeverity = metrics.avgTotalTime > 600 ? "critical" : "warning";

    return {
      id: uuidv4(),
      severity,
      confidence: "high",
      title: "Questionnaire trop long",
      description: `Temps moyen de ${Math.round(metrics.avgTotalTime / 60)} minutes (recommandé : < 5 min)`,
      recommendations: [
        "Réduire le nombre de questions",
        "Supprimer les questions non essentielles",
        "Diviser en plusieurs questionnaires plus courts",
      ],
    };
  }

  return null;
}

// ============================================================================
// VALIDATION D'OBJECTIF
// ============================================================================

/**
 * Valide l'alignement du questionnaire avec l'objectif défini
 */
async function validateObjective(
  objective: string,
  questions: Array<{
    id: string;
    type: string;
    title: string;
    options?: Array<{ id: string; label: string }>;
  }>,
  metrics: SimulationMetrics,
): Promise<ObjectiveValidation> {
  // Plus de vérification de API_KEY local

  try {
    const questionsText = questions
      .map((q, i) => {
        const optionsText = q.options
          ? `\nOptions: ${q.options.map((o) => o.label).join(", ")}`
          : "";
        return `${i + 1}. [${q.type}] ${q.title}${optionsText}`;
      })
      .join("\n\n");

    const metricsText = `
Métriques de simulation :
- Taux de complétion moyen : ${(metrics.avgCompletionRate * 100).toFixed(1)}%
- Temps moyen total : ${Math.round(metrics.avgTotalTime)}s
- Taux d'abandon : ${(metrics.dropoffRate * 100).toFixed(1)}%
`;

    const prompt = `Tu es un expert en conception de questionnaires. Analyse l'alignement entre l'objectif utilisateur et le questionnaire.

**OBJECTIF UTILISATEUR :**
"${objective}"

**QUESTIONNAIRE :**
${questionsText}

**MÉTRIQUES SIMULATION :**
${metricsText}

**ANALYSE DEMANDÉE :**
Évalue si le questionnaire permet d'atteindre l'objectif défini.

Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans backticks) :
{
  "alignmentScore": <nombre entre 0 et 100>,
  "strengths": [<2-3 points forts - questions bien alignées avec l'objectif>],
  "weaknesses": [<2-3 points faibles - manques ou questions non pertinentes>],
  "suggestions": [<2-3 suggestions concrètes d'amélioration>]
}

Sois concret et actionnable dans tes recommandations.`;

    // Import dynamique
    const { secureGeminiService } = await import("../../services/SecureGeminiService");

    const result = await secureGeminiService.generateContent("", prompt);

    if (!result.success) {
      throw ErrorFactory.api(result.error || "Gemini error", "Erreur validation IA");
    }

    const responseText = (result.data || "").trim();

    // Parser la réponse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw ErrorFactory.api(
        "Invalid Gemini response: no JSON found",
        "Réponse Gemini invalide (pas de JSON trouvé)",
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      objective,
      alignmentScore: parsed.alignmentScore || 50,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    logger.error("Erreur lors de la validation d'objectif", "api", { error, objective });

    // Fallback en cas d'erreur
    return {
      objective,
      alignmentScore: 50,
      strengths: ["Questionnaire créé"],
      weaknesses: ["Erreur lors de la validation IA"],
      suggestions: ["Réessayer la validation ou vérifier manuellement l'alignement"],
    };
  }
}

// ============================================================================
// ANALYSE COMPLÈTE
// ============================================================================

/**
 * Analyse les résultats de simulation et détecte les problèmes
 */
export async function analyzeSimulation(
  result: SimulationResult,
  questions?: Array<{
    id: string;
    type: string;
    title: string;
    required?: boolean;
    options?: Array<{ id: string; label: string }>;
    matrixRows?: Array<{ id: string; label: string }>;
  }>,
): Promise<SimulationResult> {
  const { respondents, config } = result;

  // Calculer métriques par question
  const questionMetrics: QuestionMetrics[] = [];
  const maxQuestions = Math.max(...respondents.map((r) => r.responses.length));

  for (let i = 0; i < maxQuestions; i++) {
    const questionId = respondents[0]?.responses[i]?.questionId;
    if (questionId) {
      const metrics = calculateQuestionMetrics(questionId, respondents, i);
      questionMetrics.push(metrics);
    }
  }

  // Calculer métriques globales
  const avgCompletionRate =
    respondents.reduce((sum, r) => sum + r.completionRate, 0) / respondents.length;
  const avgTotalTime = respondents.reduce((sum, r) => sum + r.totalTime, 0) / respondents.length;
  const dropoffRate = 1 - avgCompletionRate;

  const metrics: SimulationMetrics = {
    totalResponses: respondents.length,
    avgCompletionRate,
    avgTotalTime,
    dropoffRate,
    questionMetrics,
  };

  // Détecter problèmes
  const issues: DetectedIssue[] = [];

  // Problèmes par question
  questionMetrics.forEach((qMetrics) => {
    const bias = detectBias(qMetrics, config.context);
    if (bias) issues.push(bias);

    const lowResponse = detectLowResponse(qMetrics);
    if (lowResponse) issues.push(lowResponse);

    const highDropoff = detectHighDropoff(qMetrics);
    if (highDropoff) issues.push(highDropoff);

    const highTime = detectHighTime(qMetrics);
    if (highTime) issues.push(highTime);
  });

  // Problèmes globaux
  const longSurvey = detectLongSurvey(metrics);
  if (longSurvey) issues.push(longSurvey);

  // Problèmes structurels (si questions fournies)
  if (questions) {
    const tooManyText = detectTooManyRequiredText(questionMetrics, questions);
    if (tooManyText) issues.push(tooManyText);

    const complexMatrices = detectComplexMatrix(questions);
    issues.push(...complexMatrices);
  }

  // Trier par sévérité
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Validation d'objectif (si fourni)
  let objectiveValidation: ObjectiveValidation | undefined;
  if (config.objective && questions) {
    objectiveValidation = await validateObjective(config.objective, questions, metrics);
  }

  return {
    ...result,
    metrics,
    issues,
    objectiveValidation,
  };
}
