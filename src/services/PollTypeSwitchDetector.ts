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
import { EnhancedGeminiService } from "../lib/enhanced-gemini";

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
    // Changements explicites avec "plutôt"
    /plutôt\s+(un\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /plutôt\s+(un\s+)?sondage\s+de\s+(date|disponibilité|réunion)/i,
    /plutôt\s+(faire|créer|générer)\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /plutôt\s+(faire|créer|générer)\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Préférences explicites
    /je\s+préfère\s+(un\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /je\s+préfère\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /j'aimerais\s+(plutôt\s+)?(un\s+)?(questionnaire|formulaire|sondage)/i,
    /j'aimerais\s+(plutôt\s+)?(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /je\s+veux\s+(plutôt\s+)?(un\s+)?(questionnaire|formulaire|sondage)/i,
    /je\s+veux\s+(plutôt\s+)?(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /je\s+voudrais\s+(plutôt\s+)?(un\s+)?(questionnaire|formulaire|sondage)/i,
    /je\s+voudrais\s+(plutôt\s+)?(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Changements directs
    /change\s+en\s+(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /change\s+en\s+sondage\s+de\s+(date|disponibilité)/i,
    /change\s+pour\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /change\s+pour\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /transforme\s+en\s+(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /transforme\s+en\s+sondage\s+de\s+(date|disponibilité)/i,
    /convertit\s+en\s+(questionnaire|formulaire|sondage)/i,
    /convertit\s+en\s+sondage\s+de\s+(date|disponibilité)/i,
    /remplace\s+par\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /remplace\s+par\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Expressions de changement d'avis
    /finalement,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /finalement,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /en\s+fait,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /en\s+fait,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /au\s+final,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /au\s+final,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /après\s+réflexion,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /après\s+réflexion,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /réfléchissant,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /réfléchissant,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /en\s+y\s+réfléchissant,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /en\s+y\s+réfléchissant,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Négations
    /non,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /non,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /pas\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /pas\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /plus\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /plus\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Création d'un nouveau type différent - Variations de "créer"
    /crée\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /créer\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /crées\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /créez\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /crée\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité|réunion)/i,
    /créer\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité|réunion)/i,
    /crées\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /créez\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Création avec "faire"
    /fais\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage\s+d'opinion)/i,
    /fais\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité|réunion)/i,
    /fais\s+(un\s+)?(questionnaire|formulaire|sondage)\s+à\s+la\s+place/i,
    /fais\s+(un\s+)?sondage\s+de\s+(date|disponibilité)\s+à\s+la\s+place/i,
    /fait\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /fait\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /faites\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /faites\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Création avec autres verbes
    /génère\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /générer\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /génère\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /générer\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /produis\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /produire\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /produis\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /produire\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /établis\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /établir\s+(un\s+)?(nouveau\s+)?(questionnaire|formulaire|sondage)/i,
    /établis\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /établir\s+(un\s+)?(nouveau\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Demandes avec "peux-tu", "est-ce que"
    /peux-?tu\s+(crée|créer|faire|générer)\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /peux-?tu\s+(crée|créer|faire|générer)\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /est-?ce\s+que\s+tu\s+peux\s+(crée|créer|faire|générer)\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /est-?ce\s+que\s+tu\s+peux\s+(crée|créer|faire|générer)\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /pourrais-?tu\s+(crée|créer|faire|générer)\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /pourrais-?tu\s+(crée|créer|faire|générer)\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,

    // Variations de "nouveau" (autre, différent, un autre type)
    /(un\s+)?(autre|différent)\s+(questionnaire|formulaire|sondage)/i,
    /(un\s+)?(autre|différent)\s+sondage\s+de\s+(date|disponibilité)/i,
    /(un\s+)?autre\s+type\s+de\s+(questionnaire|formulaire|sondage)/i,
    /(un\s+)?autre\s+type\s+de\s+sondage\s+de\s+(date|disponibilité)/i,
    /(un\s+)?(questionnaire|formulaire|sondage)\s+différent/i,
    /(un\s+)?sondage\s+de\s+(date|disponibilité)\s+différent/i,

    // Phrases avec contexte spécifique
    /(questionnaire|formulaire|sondage)\s+de\s+(satisfaction|avis|feedback|opinion)/i,
    /(questionnaire|formulaire|sondage)\s+pour\s+(satisfaction|avis|feedback|opinion)/i,
    /sondage\s+de\s+(date|disponibilité|réunion)\s+pour/i,
    /sondage\s+pour\s+(date|disponibilité|réunion)/i,

    // "Au lieu de" / "À la place"
    /au\s+lieu\s+de\s+(ça|cela|celui-?ci),?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /au\s+lieu\s+de\s+(ça|cela|celui-?ci),?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
    /à\s+la\s+place,?\s+(un\s+)?(questionnaire|formulaire|sondage)/i,
    /à\s+la\s+place,?\s+(un\s+)?sondage\s+de\s+(date|disponibilité)/i,
  ];

  /**
   * Détecte le type demandé dans un message utilisateur
   */
  private static detectRequestedType(message: string): "date" | "form" | null {
    const messageLower = message.toLowerCase();

    // Détecter les phrases de création de nouveau sondage (même sans verbe explicite)
    // Ex: "nouveau questionnaire de satisfaction" → Form
    const isNewPollCreation = /(nouveau|nouvelle)\s+(questionnaire|formulaire|sondage)/i.test(
      message,
    );
    const isNewPollCreationDate =
      /(nouveau|nouvelle)\s+sondage\s+de\s+(date|disponibilité|réunion)/i.test(message);

    if (isNewPollCreation && !isNewPollCreationDate) {
      return "form";
    }
    if (isNewPollCreationDate) {
      return "date";
    }

    // Compter les occurrences de chaque type de mot-clé
    const formScore = this.FORM_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;
    const dateScore = this.DATE_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;

    logger.debug("Détection de type demandé", "poll", {
      message: message.slice(0, 50),
      formScore,
      dateScore,
      isNewPollCreation,
      isNewPollCreationDate,
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
   * Détecte une phrase explicite de changement ou de création d'un nouveau type
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
  static detectTypeSwitch(message: string, currentPoll: Poll | null): TypeSwitchDetectionResult {
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

  /**
   * Détecte un changement de type avec l'aide de l'IA (fallback pour cas ambigus)
   *
   * @param message Message de l'utilisateur
   * @param currentPoll Poll actuellement en cours d'édition
   * @returns Résultat de la détection avec IA ou null si l'IA n'est pas disponible
   */
  static async detectTypeSwitchWithAI(
    message: string,
    currentPoll: Poll | null,
  ): Promise<TypeSwitchDetectionResult | null> {
    if (!currentPoll) {
      return null;
    }

    try {
      const geminiService = EnhancedGeminiService.getInstance();
      const initialized = await geminiService.ensureInitialized();

      if (!initialized || !geminiService.model) {
        logger.debug("Gemini non disponible pour détection de changement de type", "poll");
        return null;
      }

      const currentType = (currentPoll as any).type || "date";
      const pollTitle = currentPoll.title || "Sans titre";

      const prompt = `Tu es un assistant qui détecte si un utilisateur veut changer le type de sondage en cours d'édition.

CONTEXTE :
- Sondage actuel : "${pollTitle}"
- Type actuel : ${currentType === "date" ? "sondage de disponibilité (dates)" : "questionnaire (formulaire)"}

MESSAGE DE L'UTILISATEUR :
"${message}"

TYPES DE SONDAGES :
- "date" : sondage de disponibilité pour trouver des dates communes (réunion, rendez-vous, événement)
- "form" : questionnaire/formulaire avec des questions (satisfaction, avis, feedback, enquête)

INSTRUCTIONS :
1. Analyse si l'utilisateur veut créer un nouveau type de sondage DIFFÉRENT du type actuel
2. Détecte les intentions de changement d'avis ("en fait", "finalement", "plutôt", "créer un nouveau", etc.)
3. Sois conservateur : si tu n'es pas sûr (confidence < 0.7), retourne isTypeSwitch: false

Retourne UNIQUEMENT un JSON avec cette structure EXACTE :
{
  "isTypeSwitch": true/false,
  "requestedType": "date" | "form" | null,
  "confidence": 0.0-1.0,
  "explanation": "Explication courte en français"
}

IMPORTANT :
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Si isTypeSwitch: true, requestedType doit être différent de "${currentType}"`;

      logger.info("🤖 Demande à l'IA pour détection de changement de type", "poll", {
        message: message.slice(0, 50),
        currentType,
      });

      const result = await geminiService.model.generateContent(prompt);
      const response = result.response.text();

      // Parser la réponse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn("Gemini n'a pas retourné de JSON valide pour changement de type", "poll", {
          response: response.substring(0, 200),
        });
        return null;
      }

      const aiResult = JSON.parse(jsonMatch[0]);
      logger.info("🤖 Réponse IA pour changement de type", "poll", {
        isTypeSwitch: aiResult.isTypeSwitch,
        requestedType: aiResult.requestedType,
        confidence: aiResult.confidence,
      });

      // Valider la réponse
      if (
        !aiResult.isTypeSwitch ||
        !aiResult.requestedType ||
        aiResult.confidence < 0.7 ||
        aiResult.requestedType === currentType
      ) {
        return {
          isTypeSwitch: false,
          currentType,
          confidence: 0,
          explanation: "Aucun changement de type détecté par l'IA",
        };
      }

      return {
        isTypeSwitch: true,
        currentType,
        requestedType: aiResult.requestedType,
        confidence: Math.min(0.9, aiResult.confidence), // Cap à 0.9 pour l'IA (moins fiable que les patterns)
        explanation:
          aiResult.explanation ||
          `Changement de type détecté par l'IA : ${currentType} → ${aiResult.requestedType}`,
      };
    } catch (error) {
      logger.error("Erreur lors de la détection de changement de type par IA", "poll", error);
      return null;
    }
  }
}
