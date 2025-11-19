/**
 * SurveyRequestAggregator - Service pour agréger les demandes de modification de sondage
 * avant que le sondage ne soit créé.
 *
 * Fonctionnalité :
 * - Détecte quand l'utilisateur demande une modification avant la création du sondage
 * - Stocke la dernière demande de sondage non créée
 * - Agrége les demandes successives pour créer une proposition complète
 *
 * Exemple :
 * Utilisateur : "Crée un sondage pour la réunion de lundi et mardi"
 * IA : [proposition de sondage]
 * Utilisateur : "Rajoute aussi mercredi" (AVANT d'avoir créé le sondage)
 * → Le service agrége : "Crée un sondage pour la réunion de lundi, mardi et mercredi"
 */

import { logger } from "../lib/logger";

/**
 * Pattern pour détecter les demandes d'ajout/modification avant création
 */
const MODIFICATION_PATTERNS = {
  // Ajout simple
  ADD: /(?:r?ajout(?:e|er)?|met(?:s|tre)?|inclus|propose|suggère|ajoute\s+aussi|rajoute\s+aussi)(?:\s+aussi|\s+encore)?/i,

  // Ajout avec "ceci", "cela", "ça", "ce"
  ADD_THIS: /(?:r?ajout(?:e|er)?|met(?:s|tre)?|inclus)\s+(?:ceci|cela|ça|ce)/i,

  // Modification générale
  MODIFY: /(?:modifie|change|remplace|corrige)/i,

  // Ajout avec "aussi" ou "encore"
  ADD_ALSO: /(?:aussi|encore|également|de\s+plus)\s+(?:r?ajout(?:e|er)?|met(?:s|tre)?|inclus)/i,
} as const;

/**
 * Pattern pour détecter si c'est une nouvelle demande de sondage (pas une modification)
 */
const NEW_REQUEST_PATTERNS = {
  CREATE:
    /(?:crée|créer|fais|fait|génère|générer|créons)\s+(?:un\s+)?(?:sondage|questionnaire|formulaire|poll)/i,
  WANT: /(?:je\s+veux|j'aimerais|je\s+souhaite|on\s+veut|on\s+aimerait)\s+(?:un\s+)?(?:sondage|questionnaire|formulaire|poll)/i,
} as const;

export interface AggregatedRequest {
  originalRequest: string;
  modifications: string[];
  aggregatedText: string;
  shouldAggregate: boolean;
}

export class SurveyRequestAggregator {
  private static lastPendingRequest: string | null = null;
  private static lastRequestTimestamp: number = 0;

  // Timeout pour considérer qu'une demande est "expirée" (5 minutes)
  private static readonly REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

  // Clé pour le localStorage
  private static readonly STORAGE_KEY = "doodates_pending_survey_request";
  private static readonly STORAGE_TIMESTAMP_KEY = "doodates_pending_survey_request_timestamp";

  /**
   * Charge la demande en attente depuis le localStorage
   */
  private static loadPendingRequestFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const storedTimestamp = localStorage.getItem(this.STORAGE_TIMESTAMP_KEY);

      if (stored && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();
        const timeSinceLastRequest = now - timestamp;

        // Vérifier que la demande n'est pas expirée
        if (timeSinceLastRequest <= this.REQUEST_TIMEOUT_MS) {
          this.lastPendingRequest = stored;
          this.lastRequestTimestamp = timestamp;
          logger.info("📥 Demande en attente chargée depuis localStorage", "aggregator", {
            request: this.lastPendingRequest.substring(0, 100),
            timeSinceLastRequest: Math.round(timeSinceLastRequest / 1000),
          });
        } else {
          // Demande expirée, nettoyer le localStorage
          this.clearPendingRequest();
        }
      }
    } catch (error) {
      logger.warn("⚠️ Erreur lors du chargement depuis localStorage", "aggregator", { error });
    }
  }

  /**
   * Sauvegarde la demande en attente dans le localStorage
   */
  private static savePendingRequestToStorage(): void {
    try {
      if (this.lastPendingRequest) {
        localStorage.setItem(this.STORAGE_KEY, this.lastPendingRequest);
        localStorage.setItem(this.STORAGE_TIMESTAMP_KEY, this.lastRequestTimestamp.toString());
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.STORAGE_TIMESTAMP_KEY);
      }
    } catch (error) {
      logger.warn("⚠️ Erreur lors de la sauvegarde dans localStorage", "aggregator", { error });
    }
  }

  /**
   * Vérifie si le message est une demande de modification avant création
   */
  static isModificationRequest(message: string): boolean {
    const trimmed = message.trim();

    // Vérifier les patterns de modification
    const hasModificationPattern =
      MODIFICATION_PATTERNS.ADD.test(trimmed) ||
      MODIFICATION_PATTERNS.ADD_THIS.test(trimmed) ||
      MODIFICATION_PATTERNS.ADD_ALSO.test(trimmed) ||
      MODIFICATION_PATTERNS.MODIFY.test(trimmed);

    // Ne pas considérer comme modification si c'est clairement une nouvelle demande
    const isNewRequest =
      NEW_REQUEST_PATTERNS.CREATE.test(trimmed) || NEW_REQUEST_PATTERNS.WANT.test(trimmed);

    return hasModificationPattern && !isNewRequest;
  }

  /**
   * Vérifie si une demande précédente existe et est encore valide
   */
  static hasValidPendingRequest(): boolean {
    // Charger depuis localStorage si pas encore chargé
    if (!this.lastPendingRequest) {
      this.loadPendingRequestFromStorage();
    }

    if (!this.lastPendingRequest) {
      logger.info("❌ Aucune demande en attente", "aggregator", {
        lastPendingRequest: this.lastPendingRequest,
        lastRequestTimestamp: this.lastRequestTimestamp,
      });
      return false;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTimestamp;

    // La demande est expirée si elle date de plus de 5 minutes
    if (timeSinceLastRequest > this.REQUEST_TIMEOUT_MS) {
      logger.info("⏰ Demande précédente expirée", "aggregator", {
        timeSinceLastRequest: Math.round(timeSinceLastRequest / 1000),
        timeout: this.REQUEST_TIMEOUT_MS / 1000,
        lastPendingRequest: this.lastPendingRequest.substring(0, 100),
      });
      this.clearPendingRequest();
      return false;
    }

    logger.info("✅ Demande en attente valide", "aggregator", {
      lastPendingRequest: this.lastPendingRequest.substring(0, 100),
      timeSinceLastRequest: Math.round(timeSinceLastRequest / 1000),
    });
    return true;
  }

  /**
   * Stocke une demande de sondage en attente
   */
  static storePendingRequest(request: string): void {
    this.lastPendingRequest = request.trim();
    this.lastRequestTimestamp = Date.now();

    // Sauvegarder dans localStorage pour persister entre les rechargements
    this.savePendingRequestToStorage();

    logger.info("💾 Demande stockée en attente", "aggregator", {
      request: this.lastPendingRequest.substring(0, 100),
      timestamp: this.lastRequestTimestamp,
    });
  }

  /**
   * Efface la demande en attente
   */
  static clearPendingRequest(): void {
    const previousRequest = this.lastPendingRequest;
    this.lastPendingRequest = null;
    this.lastRequestTimestamp = 0;

    // Nettoyer le localStorage
    this.savePendingRequestToStorage();

    if (previousRequest) {
      logger.info("🗑️ Demande en attente effacée", "aggregator", {
        previousRequest: previousRequest.substring(0, 100),
      });
    }
  }

  /**
   * Agrége une demande de modification avec la demande précédente
   */
  static aggregateRequest(modificationMessage: string): AggregatedRequest | null {
    if (!this.hasValidPendingRequest() || !this.lastPendingRequest) {
      logger.info("❌ Aucune demande précédente valide pour agréger", "aggregator");
      return null;
    }

    const trimmedModification = modificationMessage.trim();

    // Extraire la partie à ajouter (enlever les mots d'action)
    let additionText = trimmedModification;

    // Enlever les mots d'action au début
    additionText = additionText.replace(
      /^(?:r?ajout(?:e|er)?|met(?:s|tre)?|inclus|propose|suggère|rajoute\s+aussi|ajoute\s+aussi)\s+/i,
      "",
    );

    // Enlever "ceci", "cela", "ça", "ce" si présent
    additionText = additionText.replace(/^(?:ceci|cela|ça|ce)\s+/i, "");

    // Enlever les mots de liaison au début
    additionText = additionText.replace(/^(?:aussi|encore|également|de\s+plus|et)\s+/i, "");

    // Enlever les articles au début si présents
    additionText = additionText.replace(/^(?:le|la|les|un|une|des)\s+/i, "");

    additionText = additionText.trim();

    if (!additionText) {
      logger.warn("⚠️ Impossible d'extraire le texte à ajouter", "aggregator", {
        originalModification: trimmedModification,
      });
      return null;
    }

    // Construire la demande agglomérée
    // Format : "Demande originale et [additionText]"
    // Utiliser "et" pour lier naturellement les deux parties
    const aggregatedText = `${this.lastPendingRequest} et ${additionText}`;

    logger.info("✅ Demande agglomérée créée", "aggregator", {
      originalRequest: this.lastPendingRequest.substring(0, 100),
      modification: trimmedModification.substring(0, 100),
      additionText: additionText.substring(0, 100),
      aggregatedText: aggregatedText.substring(0, 150),
    });

    return {
      originalRequest: this.lastPendingRequest,
      modifications: [trimmedModification],
      aggregatedText,
      shouldAggregate: true,
    };
  }

  /**
   * Traite un message et retourne soit une demande agglomérée, soit le message original
   */
  static processMessage(
    message: string,
    hasCurrentPoll: boolean,
  ): {
    text: string;
    isAggregated: boolean;
  } {
    const trimmed = message.trim();

    // Si un sondage existe déjà, ne pas agréger (géré par IntentDetectionService)
    if (hasCurrentPoll) {
      logger.info("ℹ️ Poll existant détecté, pas d'agrégation", "aggregator");
      // Stocker quand même la demande si c'est une nouvelle demande
      if (!this.isModificationRequest(trimmed)) {
        this.storePendingRequest(trimmed);
      }
      return { text: trimmed, isAggregated: false };
    }

    // Si c'est une demande de modification et qu'on a une demande précédente
    if (this.isModificationRequest(trimmed) && this.hasValidPendingRequest()) {
      logger.info("🔍 Détection demande de modification", "aggregator", {
        message: trimmed,
        hasPendingRequest: true,
        pendingRequest: this.lastPendingRequest?.substring(0, 100),
      });
      const aggregated = this.aggregateRequest(trimmed);
      if (aggregated) {
        // Stocker la nouvelle demande agglomérée comme demande en attente
        this.storePendingRequest(aggregated.aggregatedText);
        logger.info("✅ Agrégation réussie", "aggregator", {
          original: trimmed,
          aggregated: aggregated.aggregatedText.substring(0, 150),
        });
        return {
          text: aggregated.aggregatedText,
          isAggregated: true,
        };
      } else {
        logger.warn("⚠️ Agrégation échouée", "aggregator", {
          message: trimmed,
        });
      }
    } else {
      logger.info("ℹ️ Pas d'agrégation", "aggregator", {
        message: trimmed,
        isModificationRequest: this.isModificationRequest(trimmed),
        hasValidPendingRequest: this.hasValidPendingRequest(),
        hasCurrentPoll,
      });
    }

    // Sinon, stocker comme nouvelle demande
    if (!this.isModificationRequest(trimmed)) {
      this.storePendingRequest(trimmed);
    }

    return { text: trimmed, isAggregated: false };
  }

  /**
   * Réinitialise l'agrégateur (utile pour les tests ou changement de contexte)
   */
  static reset(): void {
    this.clearPendingRequest();
    logger.info("🔄 Agrégateur réinitialisé", "aggregator");
  }
}
