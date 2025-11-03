/**
 * Service de détection des tentatives de changement de type de sondage.
 * 
 * Détecte quand un utilisateur essaie de passer d'un type de sondage à un autre
 * (date poll → form poll ou inversement) afin de démarrer automatiquement
 * une nouvelle conversation au lieu d'afficher une erreur.
 * 
 * @module services/PollTypeSwitchDetector
 */

import { Poll } from "../types/poll";
import { logger } from "../lib/logger";

/**
 * Résultat de la détection de changement de type
 */
export interface TypeSwitchDetectionResult {
  /** Indique si un changement de type est détecté */
  isTypeSwitch: boolean;
  /** Type actuel du poll (si applicable) */
  currentType?: "date" | "form";
  /** Type demandé par l'utilisateur */
  requestedType?: "date" | "form";
  /** Niveau de confiance de la détection (0-1) */
  confidence: number;
  /** Explication de la détection */
  explanation: string;
}

/**
 * Service de détection des changements de type de sondage
 */
export class PollTypeSwitchDetector {
  /**
   * Mots-clés pour Form Polls (questionnaires)
   */
  private static readonly FORM_KEYWORDS = [
    "questionnaire",
    "sondage d'opinion",
    "enquête",
    "formulaire",
    "questions",
    "choix multiple",
    "avis",
    "feedback",
    "satisfaction",
    "préférences",
    "vote sur",
    "classement",
    "évaluation",
    "opinion",
    "retour",
    "impression",
  ];

  /**
   * Mots-clés pour Date Polls (sondages de dates)
   */
  private static readonly DATE_KEYWORDS = [
    "date",
    "rendez-vous",
    "réunion",
    "disponibilité",
    "planning",
    "horaire",
    "créneau",
    "semaine",
    "jour",
    "mois",
    "calendrier",
    "rdv",
    "rencontre",
    "meeting",
  ];

  /**
   * Phrases explicites de changement de type
   */
  private static readonly EXPLICIT_SWITCH_PATTERNS = [
    /plutôt\s+(un\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /je\s+préfère\s+(un\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /change\s+en\s+(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /transforme\s+en\s+(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /fais\s+(un\s+)?(questionnaire|formulaire|sondage\s+d'opinion)\s+à\s+la\s+place/i,
    /plutôt\s+(un\s+)?sondage\s+de\s+(date|disponibilité|réunion)/i,
    /je\s+préfère\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /change\s+en\s+sondage\s+de\s+(date|disponibilité)/i,
    /transforme\s+en\s+sondage\s+de\s+(date|disponibilité)/i,
    /finalement,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /non,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
  ];

  /**
   * Détecte le type demandé dans un message utilisateur
   */
  private static detectRequestedType(message: string): "date" | "form" | null {
    const messageLower = message.toLowerCase();

    // Compter les occurrences de chaque type de mot-clé
    const formScore = this.FORM_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;
    const dateScore = this.DATE_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;

    logger.debug("Détection de type demandé", "poll", {
      message: message.slice(0, 50),
      formScore,
      dateScore,
    });

    // Si score Form > Date → Form Poll
    if (formScore > dateScore && formScore > 0) {
      return "form";
    }

    // Si score Date > Form → Date Poll
    if (dateScore > formScore && dateScore > 0) {
      return "date";
    }

    return null;
  }

  /**
   * Détecte une phrase explicite de changement
   */
  private static hasExplicitSwitchPhrase(message: string): {
    found: boolean;
    targetType?: "date" | "form";
  } {
    for (const pattern of this.EXPLICIT_SWITCH_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        // Déterminer le type cible basé sur le match
        const matchedText = match[0].toLowerCase();
        const isFormTarget =
          matchedText.includes("questionnaire") ||
          matchedText.includes("formulaire") ||
          matchedText.includes("opinion");

        return {
          found: true,
          targetType: isFormTarget ? "form" : "date",
        };
      }
    }

    return { found: false };
  }

  /**
   * Détecte si l'utilisateur tente de changer le type de sondage
   * 
   * @param message Message de l'utilisateur
   * @param currentPoll Poll actuellement en cours d'édition
   * @returns Résultat de la détection
   */
  static detectTypeSwitch(
    message: string,
    currentPoll: Poll | null,
  ): TypeSwitchDetectionResult {
    // Si pas de poll actuel, pas de changement de type possible
    if (!currentPoll) {
      return {
        isTypeSwitch: false,
        confidence: 0,
        explanation: "Aucun poll actuel",
      };
    }

    const currentType = (currentPoll as any).type || "date";
    
    // 1. Vérifier les phrases explicites de changement
    const explicitSwitch = this.hasExplicitSwitchPhrase(message);
    
    if (explicitSwitch.found && explicitSwitch.targetType) {
      // Changement détecté si le type cible diffère du type actuel
      const isTypeSwitch = explicitSwitch.targetType !== currentType;
      
      if (isTypeSwitch) {
        logger.info("🔄 Changement de type détecté (explicite)", "poll", {
          currentType,
          requestedType: explicitSwitch.targetType,
          message: message.slice(0, 50),
        });

        return {
          isTypeSwitch: true,
          currentType,
          requestedType: explicitSwitch.targetType,
          confidence: 0.95,
          explanation: `Changement de type détecté : ${currentType} → ${explicitSwitch.targetType}`,
        };
      }
    }

    // 2. Détection basée sur les mots-clés
    const requestedType = this.detectRequestedType(message);

    if (requestedType && requestedType !== currentType) {
      // Calculer la confiance basée sur la différence des scores
      const messageLower = message.toLowerCase();
      const formScore = this.FORM_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;
      const dateScore = this.DATE_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;
      const scoreDifference = Math.abs(formScore - dateScore);
      
      // Confiance proportionnelle à la différence de score (min 0.5, max 0.85)
      const confidence = Math.min(0.85, 0.5 + scoreDifference * 0.15);

      logger.info("🔄 Changement de type détecté (mots-clés)", "poll", {
        currentType,
        requestedType,
        confidence,
        formScore,
        dateScore,
        message: message.slice(0, 50),
      });

      return {
        isTypeSwitch: true,
        currentType,
        requestedType,
        confidence,
        explanation: `Type de sondage différent détecté : ${currentType} → ${requestedType}`,
      };
    }

    // Aucun changement de type détecté
    return {
      isTypeSwitch: false,
      currentType,
      confidence: 0,
      explanation: "Aucun changement de type détecté",
    };
  }
}

