/**
 * Gemini Intent Service - Détection d'intentions via IA
 *
 * Utilisé comme fallback quand les patterns regex ne matchent pas.
 * Permet de gérer toutes les formulations naturelles.
 *
 * Réutilise EnhancedGeminiService pour éviter la duplication.
 */

import type { Poll } from "../lib/pollStorage";
import type { FormPollAction } from "@/reducers/formPollReducer";
import { logger } from "@/lib/logger";
import { EnhancedGeminiService } from "@/lib/enhanced-gemini";

export interface AIIntentResult {
  isModification: boolean;
  action: FormPollAction["type"] | null;
  payload: any;
  confidence: number; // 0-1
  explanation?: string;
  modifiedField?: "title" | "type" | "options" | "required";
  modifiedQuestionId?: string;
}

/**
 * Détecte l'intention de modification via Gemini
 */
export class GeminiIntentService {
  /**
   * Détecte l'intention pour un Form Poll
   */
  static async detectFormIntent(
    userMessage: string,
    currentPoll: Poll,
  ): Promise<AIIntentResult | null> {
    try {
      // Réutiliser le service Gemini existant
      const geminiService = EnhancedGeminiService.getInstance();

      // Forcer l'initialisation
      logger.info("🔧 Tentative d'initialisation de Gemini...", "poll");
      const initialized = await geminiService.ensureInitialized();
      logger.info(`🔧 Initialisation result: ${initialized}`, "poll");

      if (!initialized || !geminiService.model) {
        logger.warn("Modèle Gemini non initialisé", "poll", {
          initialized,
          hasModel: !!geminiService.model,
          apiKey: import.meta.env.VITE_GEMINI_API_KEY ? "présente" : "absente",
        });
        return null;
      }

      const model = geminiService.model;
      logger.info("✅ Modèle Gemini prêt, appel en cours...", "poll");

      // Construire le contexte du poll actuel
      const pollContext = this.buildPollContext(currentPoll);

      const prompt = `Tu es un assistant qui détecte les intentions de modification d'un questionnaire.

CONTEXTE DU QUESTIONNAIRE ACTUEL :
${pollContext}

MESSAGE DE L'UTILISATEUR :
"${userMessage}"

ACTIONS POSSIBLES :
1. ADD_QUESTION - Ajouter une nouvelle question
2. REMOVE_QUESTION - Supprimer une question existante
3. CHANGE_QUESTION_TYPE - Changer le type d'une question (choix unique/multiple, texte, matrice)
4. ADD_OPTION - Ajouter une option à une question à choix
5. REMOVE_OPTION - Supprimer une option d'une question
6. SET_REQUIRED - Rendre une question obligatoire ou optionnelle
7. RENAME_QUESTION - Renommer une question

INSTRUCTIONS :
1. Analyse le message et détermine s'il s'agit d'une demande de modification
2. Si oui, identifie l'action correspondante
3. Extrais les paramètres nécessaires (numéro de question, nouveau texte, etc.)
4. Retourne un JSON avec cette structure EXACTE :

{
  "isModification": true/false,
  "action": "ADD_QUESTION" | "REMOVE_QUESTION" | etc. | null,
  "payload": { ... paramètres de l'action ... },
  "confidence": 0.0-1.0,
  "explanation": "Explication courte",
  "modifiedQuestionId": "question-id" (optionnel),
  "modifiedField": "title" | "type" | "options" | "required" (optionnel)
}

EXEMPLES DE PAYLOAD PAR ACTION :

ADD_QUESTION:
{ "title": "Quel est votre âge ?", "type": "text" }
IMPORTANT : Le titre doit être une phrase complète, pas juste un mot. Si l'utilisateur dit "ajoute une question Droit", le titre doit être "Quelle est votre formation en droit ?" ou similaire.

REMOVE_QUESTION:
{ "questionIndex": 2 }

CHANGE_QUESTION_TYPE:
{ "questionIndex": 1, "newType": "multiple" }

ADD_OPTION:
{ "questionIndex": 1, "optionLabel": "Autre" }

REMOVE_OPTION:
{ "questionIndex": 1, "optionLabel": "Non" }

SET_REQUIRED:
{ "questionIndex": 3, "required": true }
Note : "pas obligatoire" = required: false, "obligatoire" = required: true

RENAME_QUESTION:
{ "questionIndex": 2, "newTitle": "Nouveau titre" }

IMPORTANT :
- Les index de questions commencent à 1 (pas 0)
- Si le message n'est pas une modification, retourne isModification: false
- Sois conservateur : si tu n'es pas sûr (confidence < 0.7), retourne isModification: false
- Retourne UNIQUEMENT le JSON, sans texte avant ou après`;

      logger.info("📤 Envoi du prompt à Gemini...", "poll");
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      logger.info("📥 Réponse reçue de Gemini", "poll", { response: response.substring(0, 200) });

      // Parser la réponse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn("Gemini n'a pas retourné de JSON valide", "poll", {
          response,
        });
        return null;
      }

      const intent: AIIntentResult = JSON.parse(jsonMatch[0]);
      logger.info("🔍 Intent parsé", "poll", { intent });

      // Valider la réponse
      if (!intent.isModification || !intent.action || intent.confidence < 0.7) {
        logger.info("❌ Intent rejeté (pas modification ou confidence trop basse)", "poll", {
          isModification: intent.isModification,
          action: intent.action,
          confidence: intent.confidence,
        });
        return null;
      }

      logger.info("✅ Intention détectée par Gemini", "poll", {
        action: intent.action,
        confidence: intent.confidence,
      });

      return intent;
    } catch (error) {
      logger.error("Erreur lors de la détection d'intention par Gemini", "poll", error);
      return null;
    }
  }

  /**
   * Construit le contexte du poll pour Gemini
   */
  private static buildPollContext(poll: Poll): string {
    if (poll.type !== "form") {
      return "Type de poll non supporté";
    }

    const questions = poll.questions || [];
    const questionsList = questions
      .map((q, i) => {
        const required = q.required ? " (obligatoire)" : " (optionnelle)";
        const options =
          q.type === "single" || q.type === "multiple"
            ? `\n   Options: ${q.options?.map((o) => o.label).join(", ")}`
            : "";
        return `${i + 1}. "${q.title}"${required} - Type: ${q.type}${options}`;
      })
      .join("\n");

    return `Titre: "${poll.title}"
Nombre de questions: ${questions.length}

Questions:
${questionsList}`;
  }

  /**
   * Log un gap détecté pour améliorer les regex plus tard
   */
  static logMissingPattern(userMessage: string, detectedIntent: AIIntentResult): void {
    logger.info("📊 GAP DÉTECTÉ - Pattern regex manquant", "poll", {
      message: userMessage,
      action: detectedIntent.action,
      payload: detectedIntent.payload,
      confidence: detectedIntent.confidence,
    });

    // TODO: Envoyer à un service d'analytics pour collecter les gaps
    // et améliorer les regex périodiquement
  }
}
