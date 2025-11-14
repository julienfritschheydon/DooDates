/**
 * Poll Analytics Service - Analytics conversationnels via IA
 *
 * Permet d'interroger les résultats de sondages en langage naturel.
 * Réutilise l'infrastructure Gemini existante pour générer des insights.
 *
 * Fonctionnalités :
 * - Query en langage naturel ("Combien ont voté ?", "Option la plus populaire ?")
 * - Génération d'insights automatiques
 * - Détection de patterns et tendances
 * - Résumés intelligents
 * - Cache des résultats pour optimiser les coûts API
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { Poll, FormResults, FormResponse } from "@/lib/pollStorage";
import { getFormResults, getFormResponses } from "@/lib/pollStorage";
import { logger } from "@/lib/logger";
import { handleError, ErrorFactory } from "@/lib/error-handling";

// Types pour les analytics
export interface AnalyticsQuery {
  question: string;
  pollId: string;
  context?: "summary" | "detailed" | "trends"; // Type de contexte demandé
}

export interface AnalyticsResponse {
  answer: string;
  confidence: number; // 0-1
  insights?: string[]; // Insights additionnels détectés
  data?: Record<string, unknown>; // Données brutes si pertinent
  cached?: boolean; // Indique si la réponse vient du cache
}

export interface AutoInsight {
  type: "trend" | "anomaly" | "summary" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  data?: Record<string, unknown>;
}

// Cache des queries (en mémoire pour MVP, pourrait être localStorage)
interface CacheEntry {
  query: string;
  pollId: string;
  response: AnalyticsResponse;
  timestamp: number;
}

export class PollAnalyticsService {
  private static instance: PollAnalyticsService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 50;

  private constructor() {
    this.initializeGemini();
  }

  static getInstance(): PollAnalyticsService {
    if (!PollAnalyticsService.instance) {
      PollAnalyticsService.instance = new PollAnalyticsService();
    }
    return PollAnalyticsService.instance;
  }

  private initializeGemini(): void {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        logger.warn("VITE_GEMINI_API_KEY not set, analytics will not work", "analytics");
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      logger.info("Poll Analytics Service initialized", "analytics");
    } catch (error) {
      logger.error("Failed to initialize Gemini for analytics", error);
      this.model = null;
    }
  }

  /**
   * Génère une clé de cache unique pour une query
   */
  private getCacheKey(pollId: string, question: string): string {
    return `${pollId}:${question.toLowerCase().trim()}`;
  }

  /**
   * Récupère une réponse du cache si elle existe et n'est pas expirée
   */
  private getFromCache(pollId: string, question: string): AnalyticsResponse | null {
    const key = this.getCacheKey(pollId, question);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    logger.info("Analytics query served from cache", "analytics", { pollId, question });
    return { ...entry.response, cached: true };
  }

  /**
   * Ajoute une réponse au cache
   */
  private addToCache(pollId: string, question: string, response: AnalyticsResponse): void {
    // Limiter la taille du cache
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const key = this.getCacheKey(pollId, question);
    this.cache.set(key, {
      query: question,
      pollId,
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Construit le contexte de données pour l'IA
   */
  private buildPollContext(poll: Poll, includeRawData: boolean = false): string {
    let context = `INFORMATIONS DU SONDAGE:\n`;
    context += `- Titre: ${poll.title}\n`;
    context += `- Type: ${poll.type === "form" ? "Questionnaire" : "Sondage de dates"}\n`;
    context += `- Statut: ${poll.status}\n`;
    context += `- Créé le: ${new Date(poll.created_at).toLocaleDateString("fr-FR")}\n\n`;

    if (poll.type === "form") {
      const results = getFormResults(poll.id);
      const responses = getFormResponses(poll.id);

      context += `STATISTIQUES GLOBALES:\n`;
      context += `- Nombre total de réponses: ${results.totalResponses}\n`;
      context += `- Nombre de questions: ${poll.questions?.length || 0}\n\n`;

      context += `QUESTIONS ET RÉSULTATS:\n`;
      poll.questions?.forEach((q, idx) => {
        const question = q;
        context += `\nQuestion ${idx + 1}: ${question.title}\n`;
        context += `- Type: ${question.kind || question.type}\n`;
        context += `- Obligatoire: ${question.required ? "Oui" : "Non"}\n`;

        const kind = question.kind || question.type;

        if (kind === "text") {
          const answers = results.textAnswers[question.id] || [];
          context += `- Nombre de réponses: ${answers.length}\n`;
          if (includeRawData && answers.length > 0) {
            context += `- Réponses: ${answers.slice(0, 5).join(", ")}${answers.length > 5 ? "..." : ""}\n`;
          }
        } else if (kind === "rating" || kind === "nps") {
          const counts = results.countsByQuestion[question.id] || {};
          const ratings = Object.entries(counts).map(([rating, count]) => ({
            rating: parseInt(rating),
            count,
          }));
          const totalRatings = ratings.reduce((sum, r) => sum + r.count, 0);
          const avgRating =
            totalRatings > 0
              ? ratings.reduce((sum, r) => sum + r.rating * r.count, 0) / totalRatings
              : 0;

          context += `- Note moyenne: ${avgRating.toFixed(1)}\n`;
          context += `- Nombre de notes: ${totalRatings}\n`;
          if (includeRawData) {
            context += `- Distribution: ${ratings.map((r) => `${r.rating}★: ${r.count}`).join(", ")}\n`;
          }
        } else if (kind === "single" || kind === "multiple") {
          const counts = results.countsByQuestion[question.id] || {};
          const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

          context += `- Réponses:\n`;
          question.options?.forEach((opt: import("../lib/pollStorage").FormQuestionOption) => {
            const count = counts[opt.id] || 0;
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            context += `  • ${opt.label}: ${count} (${percentage}%)\n`;
          });
        } else if (kind === "matrix") {
          const counts = results.countsByQuestion[question.id] || {};
          context += `- Matrice de réponses:\n`;
          question.matrixRows?.forEach((row: import("../lib/pollStorage").FormQuestionOption) => {
            context += `  ${row.label}:\n`;
            question.matrixColumns?.forEach(
              (col: import("../lib/pollStorage").FormQuestionOption) => {
                const cellKey = `${row.id}_${col.id}`;
                const count = counts[cellKey] || 0;
                context += `    - ${col.label}: ${count}\n`;
              },
            );
          });
        }
      });

      if (includeRawData && responses.length > 0) {
        context += `\nDÉTAIL DES RÉPONSES (${Math.min(3, responses.length)} premières):\n`;
        responses.slice(0, 3).forEach((resp, idx) => {
          context += `\nRépondant ${idx + 1} (${resp.respondentName || "Anonyme"}):\n`;
          resp.items.forEach((item) => {
            const q = poll.questions?.find(
              (question: import("../../lib/pollStorage").FormQuestionShape) =>
                question.id === item.questionId,
            );
            if (q) {
              context += `- ${q.title}: ${JSON.stringify(item.value)}\n`;
            }
          });
        });
      }
    }

    return context;
  }

  /**
   * Interroge les résultats d'un sondage en langage naturel
   */
  async queryPoll(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    try {
      // Vérifier le cache d'abord
      const cached = this.getFromCache(query.pollId, query.question);
      if (cached) return cached;

      if (!this.model) {
        throw ErrorFactory.api(
          "Gemini model not initialized",
          "Service d'analytics non disponible",
        );
      }

      // Récupérer le poll
      const { getPollBySlugOrId } = await import("@/lib/pollStorage");
      const poll = getPollBySlugOrId(query.pollId);
      if (!poll) {
        throw ErrorFactory.validation("Poll not found", "Sondage introuvable");
      }

      // Construire le contexte
      const includeRawData = query.context === "detailed";
      const pollContext = this.buildPollContext(poll, includeRawData);

      // Construire le prompt
      const prompt = `Tu es un assistant d'analyse de données pour un outil de sondages.
Ton rôle est de répondre aux questions sur les résultats d'un sondage de manière claire et concise.

${pollContext}

QUESTION DE L'UTILISATEUR:
"${query.question}"

INSTRUCTIONS:
1. Réponds de manière directe et factuelle
2. Utilise les données fournies ci-dessus
3. Si la question nécessite un calcul, effectue-le
4. Si tu détectes des insights intéressants (tendances, anomalies), mentionne-les
5. Reste concis (2-3 phrases maximum sauf si détails demandés)
6. Utilise un ton professionnel mais accessible
7. Si les données sont insuffisantes pour répondre, dis-le clairement

Réponds maintenant à la question de l'utilisateur.`;

      logger.info("Sending analytics query to Gemini", "analytics", {
        pollId: query.pollId,
        question: query.question,
      });

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const answer = response.text();

      // Extraire les insights mentionnés (simple heuristique)
      const insights: string[] = [];
      if (answer.toLowerCase().includes("tendance")) {
        insights.push("Tendance détectée dans les données");
      }
      if (answer.toLowerCase().includes("majorité") || answer.toLowerCase().includes("plupart")) {
        insights.push("Consensus identifié");
      }
      if (
        answer.toLowerCase().includes("anomalie") ||
        answer.toLowerCase().includes("inhabituel")
      ) {
        insights.push("Anomalie potentielle détectée");
      }

      const analyticsResponse: AnalyticsResponse = {
        answer,
        confidence: 0.85, // Confiance par défaut (pourrait être amélioré)
        insights: insights.length > 0 ? insights : undefined,
        cached: false,
      };

      // Mettre en cache
      this.addToCache(query.pollId, query.question, analyticsResponse);

      // Consommer les crédits pour la query analytics (1 crédit selon la doc)
      try {
        const { consumeAnalyticsCredits } = await import("../lib/quotaTracking");
        const { getCurrentUserId } = await import("../lib/pollStorage");
        const currentUserId = getCurrentUserId();
        consumeAnalyticsCredits(currentUserId, query.pollId, query.question);
      } catch (error) {
        logger.debug("Impossible de consommer les crédits analytics", "analytics", { error });
      }

      logger.info("Analytics query completed", "analytics", {
        pollId: query.pollId,
        insightsCount: insights.length,
      });

      return analyticsResponse;
    } catch (error) {
      const analyticsError = handleError(
        error,
        {
          component: "PollAnalyticsService",
          operation: "queryPoll",
        },
        "Erreur lors de l'analyse du sondage",
      );

      logger.error("Analytics query failed", "analytics", {
        pollId: query.pollId,
        question: query.question,
        error: analyticsError,
      });

      throw analyticsError;
    }
  }

  /**
   * Génère automatiquement des insights pour un sondage
   */
  async generateAutoInsights(pollId: string): Promise<AutoInsight[]> {
    try {
      if (!this.model) {
        throw ErrorFactory.api(
          "Gemini model not initialized",
          "Service d'analytics non disponible",
        );
      }

      const { getPollBySlugOrId } = await import("@/lib/pollStorage");
      const poll = getPollBySlugOrId(pollId);
      if (!poll) {
        throw ErrorFactory.validation("Poll not found", "Sondage introuvable");
      }

      const pollContext = this.buildPollContext(poll, true);

      const prompt = `Tu es un analyste de données expert. Analyse les résultats de ce sondage et génère des insights automatiques.

${pollContext}

INSTRUCTIONS:
Génère 3-5 insights pertinents parmi les catégories suivantes:
- TREND: Tendances dans les réponses
- ANOMALY: Anomalies ou résultats surprenants
- SUMMARY: Résumé des points clés
- RECOMMENDATION: Recommandations basées sur les données

Pour chaque insight, fournis:
1. Type (TREND/ANOMALY/SUMMARY/RECOMMENDATION)
2. Titre court (max 10 mots)
3. Description (1-2 phrases)
4. Niveau de confiance (0-100)

Format de réponse (JSON):
[
  {
    "type": "trend",
    "title": "Titre de l'insight",
    "description": "Description détaillée",
    "confidence": 85
  }
]

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

      logger.info("Generating auto insights", "analytics", { pollId });

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parser le JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn("Failed to parse insights JSON", "analytics", { text });
        return [];
      }

      const insights: AutoInsight[] = JSON.parse(jsonMatch[0]);

      logger.info("Auto insights generated", "analytics", {
        pollId,
        count: insights.length,
      });

      // Consommer les crédits pour la génération d'insights (1 crédit selon la doc)
      try {
        const { consumeAnalyticsCredits } = await import("../lib/quotaTracking");
        const { getCurrentUserId } = await import("../lib/pollStorage");
        const currentUserId = getCurrentUserId();
        consumeAnalyticsCredits(currentUserId, pollId, "auto-insights");
      } catch (error) {
        logger.debug("Impossible de consommer les crédits insights", "analytics", { error });
      }

      return insights.map((insight) => ({
        ...insight,
        confidence: insight.confidence / 100, // Normaliser 0-1
      }));
    } catch (error) {
      const insightsError = handleError(
        error,
        {
          component: "PollAnalyticsService",
          operation: "generateAutoInsights",
        },
        "Erreur lors de la génération des insights",
      );

      logger.error("Auto insights generation failed", "analytics", {
        pollId,
        error: insightsError,
      });

      // Retourner un tableau vide plutôt que throw (non-bloquant)
      return [];
    }
  }

  /**
   * Vide le cache (utile pour forcer un refresh)
   */
  clearCache(pollId?: string): void {
    if (pollId) {
      // Supprimer uniquement les entrées pour ce poll
      const keysToDelete: string[] = [];
      this.cache.forEach((entry, key) => {
        if (entry.pollId === pollId) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => this.cache.delete(key));
      logger.info("Cache cleared for poll", "analytics", { pollId });
    } else {
      // Vider tout le cache
      this.cache.clear();
      logger.info("Full cache cleared", "analytics");
    }
  }

  /**
   * Obtient des statistiques sur le cache
   */
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
    };
  }
}

// Export singleton instance
export const pollAnalyticsService = PollAnalyticsService.getInstance();
