/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * QuizzVisionService - Extraction de quiz depuis un fichier de devoir (photo ou PDF scanné)
 * Utilise Gemini via Supabase Edge Function pour générer des questions/réponses
 * Pour les fichiers avec contenu visuel (images/PDF scannés) : utilise l'API directe (fallback)
 * car l'Edge Function ne supporte pas encore ces payloads binaires.
 */

import { secureGeminiService } from "./SecureGeminiService";
import { directGeminiService } from "./DirectGeminiService";
import { logger } from "../lib/logger";
import { getEnv } from "../lib/env";
import type { QuizzQuestion } from "../lib/products/quizz/quizz-service";

export interface ExtractedQuizz {
  title: string;
  subject?: string; // Matière détectée
  questions: QuizzQuestion[];
  confidence: number; // 0-100, confiance dans l'extraction
}

export interface QuizzVisionResult {
  success: boolean;
  data?: ExtractedQuizz;
  error?: string;
  rawResponse?: string;
}

/**
 * Prompt pour extraire un quiz depuis un fichier de devoir (photo ou PDF scanné)
 */
const QUIZZ_EXTRACTION_PROMPT = `Tu es un assistant éducatif expert. Analyse ce fichier de devoir/exercice scolaire (photo ou PDF scanné).

OBJECTIF: TRANSFORMER l'exercice en VRAIES QUESTIONS de quiz interactif pour aider l'enfant à réviser.

⚠️ RÈGLE IMPORTANTE: Ne copie PAS le contenu brut de l'exercice !
Tu dois CRÉER des questions pédagogiques basées sur l'exercice.

EXEMPLES DE TRANSFORMATION:
- Exercice "2 dizaines 3 unités" → Question: "Combien font 2 dizaines et 3 unités ?" Réponse: "23"
- Exercice "Complète: Le chat ___ sur le toit" → Question: "Quel verbe complète: Le chat ___ sur le toit ?" Options: ["monte", "court", "dort"]
- Exercice "3 + 5 = ?" → Question: "Combien font 3 + 5 ?" Réponse: "8"
- Exercice avec cases à cocher → Questions QCM correspondantes

RÈGLES DE CRÉATION:
1. Formule chaque item comme une VRAIE QUESTION (avec "?")
2. La réponse doit être la solution correcte de l'exercice
3. Pour les calculs, crée des questions "Combien font...?"
4. Pour les textes à trous, crée des QCM avec options
5. Ajoute une explication pédagogique pour chaque réponse

TYPES DE QUESTIONS (choisis le plus adapté):
- "single" = QCM avec 1 seule bonne réponse (RECOMMANDÉ pour phrases/concepts)
- "multiple" = plusieurs bonnes réponses possibles
- "text" = réponse libre COURTE (nombre, mot unique, max 2-3 mots)
- "text-ai" = réponse libre LONGUE nécessitant validation IA (phrases, définitions)
- "true-false" = vrai/faux

⚠️ RÈGLE DE CHOIX DU TYPE:
- Réponse = nombre ou mot unique → "text"
- Réponse = phrase/définition → PRÉFÈRE "single" avec options OU "text-ai"
- Si tu mets "text-ai", Gemini vérifiera la réponse (plus souple mais plus lent)

FORMAT JSON REQUIS:
{
  "title": "Quiz - [sujet de l'exercice]",
  "subject": "Mathématiques" | "Français" | "Histoire" | etc.,
  "questions": [
    {
      "id": "q1",
      "question": "La vraie question formulée clairement ?",
      "type": "text",
      "options": [],
      "correctAnswer": "la réponse correcte",
      "points": 1,
      "explanation": "Explication pédagogique"
    }
  ],
  "confidence": 85
}

NOTES:
- Si le contenu du fichier est flou ou illisible, retourne confidence < 50
- Génère au moins 3-5 questions par exercice
- Les options doivent correspondre exactement à ce qui est visible

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

/**
 * Prompt pour générer un quiz à partir d'une description textuelle
 */
const QUIZZ_GENERATION_PROMPT = `Tu es un assistant éducatif expert. Crée un quiz basé sur la demande suivante.

CONTEXTE: {userInput}

RÈGLES IMPORTANTES:
1. Si un titre et/ou description sont déjà fournis dans le contexte, UTILISE-LES comme base
2. Le titre du quiz doit correspondre au titre fourni ou en créer un si absent
3. Si seule une demande complémentaire est fournie, génère un quiz complet basé sur cette demande
4. Si les deux sont présents, combine le contexte existant avec la demande complémentaire

RÈGLES DE GÉNÉRATION:
1. Crée 5-10 questions adaptées au niveau scolaire mentionné
2. Varie les types de questions (QCM, vrai/faux, réponse courte)
3. Progresse du plus facile au plus difficile
4. Ajoute des explications pédagogiques claires

FORMAT JSON REQUIS:
{
  "title": "Titre du quiz (utilise le titre du contexte ou génère-en un)",
  "subject": "Mathématiques" | "Français" | "Histoire" | etc.,
  "questions": [
    {
      "id": "q1",
      "question": "Texte de la question",
      "type": "single" | "multiple" | "text" | "true-false",
      "options": ["Option A", "Option B", "..."],
      "correctAnswer": "Option A" | ["A", "B"] | true | "réponse",
      "points": 1,
      "explanation": "Explication pédagogique"
    }
  ],
  "confidence": 100
}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

class QuizzVisionService {
  private static instance: QuizzVisionService;

  public static getInstance(): QuizzVisionService {
    if (!QuizzVisionService.instance) {
      QuizzVisionService.instance = new QuizzVisionService();
    }
    return QuizzVisionService.instance;
  }

  /**
   * Extrait un quiz depuis un fichier de devoir (photo ou PDF scanné)
   * Utilise l'API directe Gemini (car l'Edge Function ne supporte pas ces fichiers binaires)
   */
  async extractFromImage(imageBase64: string, mimeType: string): Promise<QuizzVisionResult> {
    // Vérifier si l'API directe est disponible
    const apiKey = getEnv("VITE_GEMINI_API_KEY");
    if (!apiKey) {
      logger.warn("🔍 Extraction fichier (vision) - Clé API Gemini non configurée", "api");
      return {
        success: false,
        error:
          "Pour analyser un fichier (photo ou PDF), configurez VITE_GEMINI_API_KEY dans .env.local",
      };
    }

    try {
      logger.info("🔍 Extraction quiz depuis fichier (API directe)", "api", { mimeType });

      const response = await directGeminiService.generateContentWithImage(
        imageBase64,
        mimeType,
        QUIZZ_EXTRACTION_PROMPT,
      );

      if (!response.success || !response.data) {
        logger.error("Échec extraction fichier (vision)", "api", { error: response.error });
        return {
          success: false,
          error: response.message || response.error || "Échec de l'analyse du fichier",
        };
      }

      const parsed = this.parseQuizzResponse(response.data);
      if (!parsed) {
        logger.error("Parsing échoué", "api", { rawResponse: response.data?.substring(0, 200) });
        return {
          success: false,
          error: "Format de réponse invalide",
          rawResponse: response.data,
        };
      }

      logger.info("✅ Quiz extrait avec succès", "api", {
        questionsCount: parsed.questions.length,
        confidence: parsed.confidence,
      });

      return {
        success: true,
        data: parsed,
        rawResponse: response.data,
      };
    } catch (error: any) {
      logger.error("Erreur extraction quiz depuis fichier (vision)", "api", error);
      return {
        success: false,
        error: error?.message || "Erreur lors de l'analyse du fichier",
      };
    }
  }

  /**
   * Génère un quiz à partir d'une description textuelle
   * @param userInput Description du quiz souhaité (ex: "Quiz de maths sur les fractions pour CE2")
   */
  async generateFromText(userInput: string): Promise<QuizzVisionResult> {
    try {
      logger.info("📝 Génération quiz depuis texte", "api", {
        inputLength: userInput.length,
      });

      const prompt = QUIZZ_GENERATION_PROMPT.replace("{userInput}", userInput);

      // Utilise l'Edge Function Supabase
      const response = await secureGeminiService.generateContent(userInput, prompt);

      if (!response.success || !response.data) {
        logger.error("Échec génération quiz", "api", {
          error: response.error,
          message: response.message,
        });
        return {
          success: false,
          error: response.message || response.error || "Échec de la génération",
        };
      }

      const parsed = this.parseQuizzResponse(response.data);
      if (!parsed) {
        logger.error("Parsing échoué", "api", { rawResponse: response.data?.substring(0, 200) });
        return {
          success: false,
          error: "Format de réponse invalide",
          rawResponse: response.data,
        };
      }

      logger.info("✅ Quiz généré avec succès", "api", {
        questionsCount: parsed.questions.length,
      });

      return {
        success: true,
        data: parsed,
        rawResponse: response.data,
      };
    } catch (error) {
      logger.error("Erreur génération quiz", "api", error);
      return {
        success: false,
        error: "Erreur lors de la génération du quiz",
      };
    }
  }

  /**
   * Parse la réponse JSON de Gemini
   */
  private parseQuizzResponse(text: string): ExtractedQuizz | null {
    try {
      // Nettoyer le texte (enlever les backticks markdown si présents)
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      // Extraire le JSON
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error("Pas de JSON trouvé dans la réponse", "api");
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Valider la structure
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        logger.error("Structure JSON invalide", "api", { parsed });
        return null;
      }

      // Normaliser les questions
      const questions: QuizzQuestion[] = parsed.questions.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        question: q.question || q.title || "",
        type: this.normalizeQuestionType(q.type),
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        explanation: q.explanation,
      }));

      return {
        title: parsed.title,
        subject: parsed.subject,
        questions,
        confidence: parsed.confidence || 80,
      };
    } catch (error) {
      logger.error("Erreur parsing réponse quiz", "api", error);
      return null;
    }
  }

  /**
   * Normalise le type de question
   */
  private normalizeQuestionType(
    type: string,
  ): "single" | "multiple" | "text" | "text-ai" | "true-false" {
    const t = (type || "single").toLowerCase();
    if (t.includes("multi")) return "multiple";
    if (t === "text-ai" || t.includes("text-ai")) return "text-ai";
    if (t.includes("text") || t.includes("libre")) return "text";
    if (t.includes("true") || t.includes("vrai") || t.includes("bool")) return "true-false";
    return "single";
  }
}

export const quizzVisionService = QuizzVisionService.getInstance();
