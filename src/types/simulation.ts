/**
 * Types pour la Simulation IA des Réponses
 *
 * Permet de générer des réponses fictives pour tester les questionnaires
 * avant de les envoyer aux vrais répondants.
 */

// ============================================================================
// PERSONAS
// ============================================================================

/**
 * Contexte d'usage du questionnaire
 */
export type SimulationContext =
  | "event" // Événements (mariages, soirées, anniversaires)
  | "feedback" // Feedback (satisfaction, retour activité)
  | "leisure" // Loisirs (sondages amis, famille)
  | "association" // Associatif (clubs, groupes)
  | "research"; // Recherche (études, enquêtes)

/**
 * Niveau de détail des réponses
 */
export type DetailLevel = "low" | "medium" | "high";

/**
 * Persona représentant un type de répondant
 */
export interface Persona {
  /** Identifiant unique */
  id: string;

  /** Nom descriptif */
  name: string;

  /** Contexte d'usage */
  context: SimulationContext;

  /** Traits comportementaux */
  traits: {
    /** Probabilité de répondre (0.7-0.95) */
    responseRate: number;

    /** Nombre de questions avant fatigue (8-20) */
    attentionSpan: number;

    /** Niveau de détail des réponses */
    detailLevel: DetailLevel;

    /** Biais vers réponses positives (0.0-0.3) */
    biasTowardPositive: number;

    /** Probabilité de sauter une question (0.05-0.2) */
    skipProbability: number;
  };
}

// ============================================================================
// RÉPONSES SIMULÉES
// ============================================================================

/**
 * Réponse simulée pour une question
 */
export interface SimulatedResponse {
  /** ID de la question */
  questionId: string;

  /** Valeur de la réponse */
  value: string | string[] | Record<string, string | string[]> | null;

  /** Temps passé sur la question (secondes) */
  timeSpent: number;

  /** Persona ayant généré cette réponse */
  personaId: string;
}

/**
 * Ensemble de réponses d'un répondant simulé
 */
export interface SimulatedRespondent {
  /** ID unique du répondant simulé */
  id: string;

  /** Persona utilisé */
  personaId: string;

  /** Réponses aux questions */
  responses: SimulatedResponse[];

  /** Temps total (secondes) */
  totalTime: number;

  /** Taux de complétion (0-1) */
  completionRate: number;
}

// ============================================================================
// CONFIGURATION SIMULATION
// ============================================================================

/**
 * Configuration d'une simulation
 */
export interface SimulationConfig {
  /** ID du poll à simuler */
  pollId: string;

  /** Nombre de réponses à générer */
  volume: number;

  /** Contexte détecté ou manuel */
  context: SimulationContext;

  /** Utiliser Gemini pour questions texte (Pro) */
  useGemini?: boolean;

  /** Personas à utiliser (si vide, sélection auto selon contexte) */
  personaIds?: string[];

  /** Objectif du questionnaire (optionnel - pour validation) */
  objective?: string;
}

// ============================================================================
// RÉSULTATS SIMULATION
// ============================================================================

/**
 * Sévérité d'un problème détecté
 */
export type IssueSeverity = "critical" | "warning" | "info";

/**
 * Niveau de confiance dans la détection
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Problème détecté dans le questionnaire
 */
export interface DetectedIssue {
  /** ID unique du problème */
  id: string;

  /** Sévérité */
  severity: IssueSeverity;

  /** Niveau de confiance */
  confidence: ConfidenceLevel;

  /** Titre court */
  title: string;

  /** Description détaillée */
  description: string;

  /** Question concernée (si applicable) */
  questionId?: string;

  /** Recommandations */
  recommendations: string[];
}

/**
 * Métriques d'une question
 */
export interface QuestionMetrics {
  /** ID de la question */
  questionId: string;

  /** Taux de réponse (0-1) */
  responseRate: number;

  /** Temps moyen de réponse (secondes) */
  avgTimeSpent: number;

  /** Taux d'abandon après cette question (0-1) */
  dropoffRate: number;

  /** Distribution des réponses (pour questions à choix) */
  distribution?: Record<string, number>;
}

/**
 * Métriques globales de la simulation
 */
export interface SimulationMetrics {
  /** Nombre total de réponses générées */
  totalResponses: number;

  /** Taux de complétion moyen (0-1) */
  avgCompletionRate: number;

  /** Temps moyen total (secondes) */
  avgTotalTime: number;

  /** Taux d'abandon global (0-1) */
  dropoffRate: number;

  /** Métriques par question */
  questionMetrics: QuestionMetrics[];
}

/**
 * Validation de l'objectif du questionnaire
 */
export interface ObjectiveValidation {
  /** Objectif défini par l'utilisateur */
  objective: string;

  /** Score d'alignement (0-100) */
  alignmentScore: number;

  /** Points forts (questions bien alignées) */
  strengths: string[];

  /** Points faibles (manques détectés) */
  weaknesses: string[];

  /** Suggestions d'amélioration */
  suggestions: string[];
}

/**
 * Résultat complet d'une simulation
 */
export interface SimulationResult {
  /** ID unique de la simulation */
  id: string;

  /** Configuration utilisée */
  config: SimulationConfig;

  /** Date de création */
  createdAt: Date;

  /** Répondants simulés */
  respondents: SimulatedRespondent[];

  /** Métriques globales */
  metrics: SimulationMetrics;

  /** Problèmes détectés */
  issues: DetectedIssue[];

  /** Temps de génération (ms) */
  generationTime: number;

  /** Coût estimé de la simulation (USD) */
  estimatedCost?: {
    /** Coût total */
    total: number;
    /** Nombre d'appels Gemini */
    geminiCalls: number;
    /** Coût par réponse */
    costPerResponse: number;
  };

  /** Validation de l'objectif (si fourni) */
  objectiveValidation?: ObjectiveValidation;
}

// ============================================================================
// QUOTAS & PERMISSIONS
// ============================================================================

/**
 * Tier utilisateur
 */
export type UserTier = "free" | "pro" | "enterprise";

/**
 * Quotas de simulation selon le tier
 */
export interface SimulationQuota {
  /** Tier utilisateur */
  tier: UserTier;

  /** Nombre de simulations par mois */
  simulationsPerMonth: number;

  /** Volume maximum par simulation */
  maxVolume: number;

  /** Accès à Gemini pour questions texte */
  hasGeminiAccess: boolean;

  /** Accès à l'export PDF */
  hasPdfExport: boolean;

  /** Peut override le contexte auto-détecté */
  canOverrideContext: boolean;
}

/**
 * Usage actuel de l'utilisateur
 */
export interface SimulationUsage {
  /** Tier utilisateur */
  tier: UserTier;

  /** Nombre de simulations ce mois */
  simulationsThisMonth: number;

  /** Simulations restantes */
  remainingSimulations: number;

  /** Date de reset du quota */
  quotaResetDate: Date;
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Format d'export du rapport
 */
export type ExportFormat = "pdf" | "markdown" | "json";

/**
 * Options d'export
 */
export interface ExportOptions {
  /** Format souhaité */
  format: ExportFormat;

  /** Inclure les réponses détaillées */
  includeResponses?: boolean;

  /** Inclure les graphiques */
  includeCharts?: boolean;

  /** Nom du fichier (sans extension) */
  filename?: string;
}
