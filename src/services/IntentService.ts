/**
 * Intent Service - Service unifié de détection d'intentions
 *
 * Utilise le pattern Strategy pour unifier les 3 services existants :
 * - IntentDetectionService (Date Polls)
 * - FormPollIntentService (Form Polls)
 * - GeminiIntentService (Fallback IA)
 *
 * Bénéfices :
 * - API unique et cohérente
 * - Stratégies interchangeables
 * - Testable facilement
 * - Évite duplication de code
 *
 * @see Docs/2. Planning.md - Quick Win #3
 */

import type { Poll } from "../lib/pollStorage";
import type { PollAction } from "../reducers/pollReducer";
import type { FormPollAction } from "../reducers/formPollReducer";
import { IntentDetectionService } from "./IntentDetectionService";
import { FormPollIntentService } from "./FormPollIntentService";
import { GeminiIntentService } from "./GeminiIntentService";
import { logger } from "@/lib/logger";

/**
 * Interface commune pour tous les résultats d'intention
 */
export interface IntentResult {
  isModification: boolean;
  action: PollAction["type"] | FormPollAction["type"] | null;
  payload: any;
  confidence: number; // 0-1
  explanation?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  modifiedQuestionId?: string;
  strategy: "regex" | "ai"; // Quelle stratégie a détecté l'intention
}

/**
 * Interface pour les stratégies de détection
 */
export interface IntentDetectionStrategy {
  /**
   * Nom de la stratégie (pour logging)
   */
  name: string;

  /**
   * Détecte l'intention dans le message
   * @returns IntentResult si une intention est détectée, null sinon
   */
  detect(
    message: string,
    currentPoll: Poll | null,
  ): Promise<IntentResult | null> | IntentResult | null;

  /**
   * Vérifie si cette stratégie peut traiter ce type de poll
   */
  canHandle(pollType: Poll["type"] | null): boolean;
}

/**
 * Stratégie pour les Date Polls (regex)
 */
class DatePollStrategy implements IntentDetectionStrategy {
  name = "DatePollRegex";

  canHandle(pollType: Poll["type"] | null): boolean {
    return pollType === "date" || pollType === null;
  }

  detect(message: string, currentPoll: Poll | null): IntentResult | null {
    const result = IntentDetectionService.detectSimpleIntent(message, currentPoll);

    if (!result) return null;

    return {
      ...result,
      strategy: "regex",
    };
  }
}

/**
 * Stratégie pour les Form Polls (regex)
 */
class FormPollStrategy implements IntentDetectionStrategy {
  name = "FormPollRegex";

  canHandle(pollType: Poll["type"] | null): boolean {
    return pollType === "form";
  }

  detect(message: string, currentPoll: Poll | null): IntentResult | null {
    const result = FormPollIntentService.detectIntent(message, currentPoll);

    if (!result) return null;

    return {
      ...result,
      strategy: "regex",
    };
  }
}

/**
 * Stratégie IA (fallback)
 */
class AIFallbackStrategy implements IntentDetectionStrategy {
  name = "GeminiAI";

  canHandle(pollType: Poll["type"] | null): boolean {
    // L'IA peut gérer tous les types, mais seulement pour Form Polls pour l'instant
    return pollType === "form";
  }

  async detect(message: string, currentPoll: Poll | null): Promise<IntentResult | null> {
    if (!currentPoll) return null;

    const result = await GeminiIntentService.detectFormIntent(message, currentPoll);

    if (!result) return null;

    return {
      ...result,
      strategy: "ai",
    };
  }
}

/**
 * Service unifié de détection d'intentions
 *
 * Utilise le pattern Strategy pour déléguer la détection
 * aux stratégies appropriées selon le type de poll
 */
export class IntentService {
  private static strategies: IntentDetectionStrategy[] = [
    new DatePollStrategy(),
    new FormPollStrategy(),
    new AIFallbackStrategy(),
  ];

  /**
   * Détecte l'intention dans le message utilisateur
   *
   * Processus :
   * 1. Essaie les stratégies regex (rapides, déterministes)
   * 2. Si aucune ne matche, essaie la stratégie IA (fallback)
   *
   * @param message Message utilisateur
   * @param currentPoll Poll actuel (peut être null pour création)
   * @param options Options de détection
   * @returns IntentResult si une intention est détectée, null sinon
   */
  static async detectIntent(
    message: string,
    currentPoll: Poll | null,
    options: {
      useAI?: boolean; // Utiliser l'IA en fallback (défaut: true)
      debug?: boolean; // Activer les logs de debug
    } = {},
  ): Promise<IntentResult | null> {
    const { useAI = true, debug = false } = options;
    const pollType = currentPoll?.type || null;

    if (debug) {
      logger.info("🔍 Détection d'intention", "poll", {
        message,
        pollType,
        useAI,
      });
    }

    // Phase 1 : Essayer les stratégies regex
    const regexStrategies = this.strategies.filter(
      (s) => s.name.includes("Regex") && s.canHandle(pollType),
    );

    for (const strategy of regexStrategies) {
      try {
        const result = await strategy.detect(message, currentPoll);

        if (result && result.confidence >= 0.7) {
          if (debug) {
            logger.info("✅ Intention détectée (regex)", "poll", {
              strategy: strategy.name,
              action: result.action,
              confidence: result.confidence,
            });
          }
          return result;
        }
      } catch (error) {
        logger.error(`Erreur stratégie ${strategy.name}`, "poll", error);
      }
    }

    // Phase 2 : Fallback IA (si activé)
    if (useAI) {
      const aiStrategy = this.strategies.find((s) => s.name === "GeminiAI");

      if (aiStrategy && aiStrategy.canHandle(pollType)) {
        try {
          const result = await aiStrategy.detect(message, currentPoll);

          if (result && result.confidence >= 0.7) {
            if (debug) {
              logger.info("✅ Intention détectée (IA)", "poll", {
                action: result.action,
                confidence: result.confidence,
              });
            }

            // Logger le gap pour améliorer les regex
            GeminiIntentService.logMissingPattern(message, result as any);

            return result;
          }
        } catch (error) {
          logger.error("Erreur stratégie IA", "poll", error);
        }
      }
    }

    if (debug) {
      logger.info("❌ Aucune intention détectée", "poll");
    }

    return null;
  }

  /**
   * Ajoute une stratégie personnalisée
   * Utile pour les tests ou extensions futures
   */
  static addStrategy(strategy: IntentDetectionStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Retire une stratégie
   */
  static removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter((s) => s.name !== strategyName);
  }

  /**
   * Liste les stratégies disponibles
   */
  static getStrategies(): IntentDetectionStrategy[] {
    return [...this.strategies];
  }

  /**
   * Réinitialise les stratégies par défaut
   * Utile pour les tests
   */
  static resetStrategies(): void {
    this.strategies = [new DatePollStrategy(), new FormPollStrategy(), new AIFallbackStrategy()];
  }
}
