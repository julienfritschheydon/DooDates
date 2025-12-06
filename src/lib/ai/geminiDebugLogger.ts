/**
 * Logger de debug pour le flux Gemini.
 * Permet de tracer tout le parcours d'une requête de génération de sondage.
 *
 * Activation : export GEMINI_DEBUG=true ou localStorage.setItem('GEMINI_DEBUG', 'true')
 */

import { isDev } from "../env";

export interface GeminiDebugLog {
  timestamp: string;
  requestId: string;
  step: string;
  data: Record<string, unknown>;
}

// Stockage des logs pour la session
const sessionLogs: GeminiDebugLog[] = [];

/**
 * Vérifie si le debug Gemini est activé.
 */
export function isGeminiDebugEnabled(): boolean {
  // En environnement Node.js (tests)
  if (typeof process !== "undefined" && process.env?.GEMINI_DEBUG === "true") {
    return true;
  }
  // En environnement navigateur
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("GEMINI_DEBUG") === "true";
  }
  // Par défaut en dev
  return isDev();
}

/**
 * Log une étape du flux Gemini avec des données structurées.
 */
export function logGeminiStep(
  requestId: string,
  step: string,
  data: Record<string, unknown>,
): void {
  if (!isGeminiDebugEnabled()) return;

  const log: GeminiDebugLog = {
    timestamp: new Date().toISOString(),
    requestId,
    step,
    data,
  };

  sessionLogs.push(log);

  // Affichage console structuré
  const emoji = getStepEmoji(step);
  console.log(`\n${emoji} [${requestId}] ${step}`);
  console.log("─".repeat(60));

  // Afficher les données de manière lisible
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 500) {
      // Tronquer les longues chaînes (prompts, réponses)
      console.log(`  ${key}:`);
      console.log(`    ${value.substring(0, 500)}...`);
      console.log(`    [... ${value.length - 500} caractères de plus]`);
    } else if (Array.isArray(value)) {
      console.log(`  ${key}: [${value.length} éléments]`, value);
    } else if (typeof value === "object" && value !== null) {
      console.log(`  ${key}:`, JSON.stringify(value, null, 2));
    } else {
      console.log(`  ${key}:`, value);
    }
  });
}

/**
 * Log complet du flux Gemini en 7 étapes.
 */
export const GeminiFlowLogger = {
  /**
   * ÉTAPE 1: Question utilisateur
   */
  logUserQuestion(requestId: string, userInput: string): void {
    logGeminiStep(requestId, "1. QUESTION UTILISATEUR", {
      input: userInput,
      inputLength: userInput.length,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * ÉTAPE 2: Traitement initial du code
   */
  logCodeProcessing(
    requestId: string,
    data: {
      pollType: string;
      pollTypeSource: string;
      processedInput: string;
      markdownDetected: boolean;
    },
  ): void {
    logGeminiStep(requestId, "2. TRAITEMENT DU CODE", data);
  },

  /**
   * ÉTAPE 3: Parsing Chrono
   */
  logChronoParsing(
    requestId: string,
    data: {
      chronoResult: unknown;
      chronoText?: string;
      chronoDate?: string;
      detectedKeywords: string[];
      dayOfWeek?: number[];
      month?: number;
      dateNumeric?: { day: number; dayOfWeek?: number };
      relativeDays?: number;
      relativeWeeks?: number;
      allowedDates: string[];
      targetDates: string[];
      parseType: string;
      validationErrors?: string[];
      validationWarnings?: string[];
    },
  ): void {
    logGeminiStep(requestId, "3. PARSING CHRONO-NODE", data);
  },

  /**
   * ÉTAPE 4: Prompt envoyé à Gemini
   */
  logPromptSent(
    requestId: string,
    data: {
      prompt: string;
      dateHints: string;
      promptLength: number;
      pollType: string;
    },
  ): void {
    logGeminiStep(requestId, "4. PROMPT ENVOYÉ À GEMINI", data);
  },

  /**
   * ÉTAPE 5: Réponse brute de Gemini
   */
  logGeminiResponse(
    requestId: string,
    data: {
      success: boolean;
      rawText: string;
      responseTime: number;
      error?: string;
    },
  ): void {
    logGeminiStep(requestId, "5. RÉPONSE BRUTE GEMINI", data);
  },

  /**
   * ÉTAPE 6: Traitement de la réponse
   */
  logResponseProcessing(
    requestId: string,
    data: {
      jsonExtracted: boolean;
      parsedDates?: string[];
      filteredDates?: string[];
      datesRemoved?: string[];
      parsedTimeSlots?: unknown[];
      filteredTimeSlots?: unknown[];
      timeSlotsRemoved?: number;
      parseErrors?: string[];
      validationResult?: unknown;
    },
  ): void {
    logGeminiStep(requestId, "6. TRAITEMENT DE LA RÉPONSE", data);
  },

  /**
   * ÉTAPE 7: Réponse finale affichée
   */
  logFinalResponse(
    requestId: string,
    data: {
      success: boolean;
      title?: string;
      description?: string;
      type?: string;
      datesCount?: number;
      dates?: string[];
      timeSlotsCount?: number;
      timeSlots?: unknown[];
      errorMessage?: string;
    },
  ): void {
    logGeminiStep(requestId, "7. RÉPONSE FINALE AFFICHÉE", data);
  },
};

/**
 * Retourne un emoji approprié pour chaque étape.
 */
function getStepEmoji(step: string): string {
  if (step.includes("1.")) return "📝";
  if (step.includes("2.")) return "⚙️";
  if (step.includes("3.")) return "📅";
  if (step.includes("4.")) return "📤";
  if (step.includes("5.")) return "📥";
  if (step.includes("6.")) return "🔄";
  if (step.includes("7.")) return "✅";
  return "🔵";
}

/**
 * Récupère tous les logs de la session.
 */
export function getSessionLogs(): GeminiDebugLog[] {
  return [...sessionLogs];
}

/**
 * Exporte les logs en format JSON.
 */
export function exportLogsAsJson(): string {
  return JSON.stringify(sessionLogs, null, 2);
}

/**
 * Vide les logs de la session.
 */
export function clearSessionLogs(): void {
  sessionLogs.length = 0;
}

/**
 * Génère un rapport Markdown des logs.
 */
export function generateLogReport(requestId?: string): string {
  const logs = requestId ? sessionLogs.filter((l) => l.requestId === requestId) : sessionLogs;

  if (logs.length === 0) {
    return "# Aucun log disponible\n";
  }

  let report = `# Rapport de Debug Gemini\n\n`;
  report += `**Généré le:** ${new Date().toISOString()}\n`;
  report += `**Nombre de logs:** ${logs.length}\n\n`;

  logs.forEach((log) => {
    report += `## ${log.step}\n\n`;
    report += `**Timestamp:** ${log.timestamp}\n`;
    report += `**Request ID:** ${log.requestId}\n\n`;
    report += "```json\n";
    report += JSON.stringify(log.data, null, 2);
    report += "\n```\n\n";
  });

  return report;
}
