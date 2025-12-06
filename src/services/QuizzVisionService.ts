/**
 * QuizzVisionService - Extraction de quiz depuis une image de devoir
 * Utilise Gemini Vision pour analyser une photo et générer des questions/réponses
 */

import { directGeminiService } from "./DirectGeminiService";
import { logger } from "../lib/logger";
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
 * Prompt pour extraire un quiz d'une image de devoir
 */
const QUIZZ_EXTRACTION_PROMPT = `Tu es un assistant éducatif expert. Analyse cette image de devoir/exercice scolaire.

OBJECTIF: Extraire TOUTES les questions visibles et leurs réponses correctes.

RÈGLES D'EXTRACTION:
1. Identifie chaque question distincte dans l'image
2. Détermine le type de chaque question:
   - "single" = choix unique (QCM avec 1 réponse)
   - "multiple" = choix multiples (plusieurs réponses possibles)
   - "text" = réponse libre (mot, phrase, calcul)
   - "true-false" = vrai/faux
3. Pour les QCM, liste toutes les options visibles
4. Déduis la réponse correcte si elle est indiquée ou évidente
5. Ajoute une explication pédagogique courte pour chaque réponse

MATIÈRES RECONNUES:
- Mathématiques, Français, Histoire, Géographie, Sciences, Anglais, etc.

FORMAT JSON REQUIS:
{
  "title": "Exercice de [matière] - [sujet]",
  "subject": "Mathématiques" | "Français" | "Histoire" | etc.,
  "questions": [
    {
      "id": "q1",
      "question": "Texte exact de la question",
      "type": "single" | "multiple" | "text" | "true-false",
      "options": ["Option A", "Option B", "..."],
      "correctAnswer": "Option A" | ["A", "B"] | true | "réponse texte",
      "points": 1,
      "explanation": "Courte explication pédagogique"
    }
  ],
  "confidence": 85
}

NOTES IMPORTANTES:
- Si l'image est floue ou illisible, retourne confidence < 50
- Si aucune question n'est détectée, retourne un tableau vide
- Sois précis sur le texte des questions (pas de paraphrase)
- Les options doivent correspondre exactement à ce qui est visible

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

/**
 * Prompt pour générer un quiz à partir d'une description textuelle
 */
const QUIZZ_GENERATION_PROMPT = `Tu es un assistant éducatif expert. Crée un quiz basé sur la demande suivante.

DEMANDE: {userInput}

RÈGLES DE GÉNÉRATION:
1. Crée 5-10 questions adaptées au niveau scolaire mentionné
2. Varie les types de questions (QCM, vrai/faux, réponse courte)
3. Progresse du plus facile au plus difficile
4. Ajoute des explications pédagogiques claires

FORMAT JSON REQUIS:
{
  "title": "Quiz de [matière] - [sujet]",
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
   * Extrait un quiz d'une image de devoir
   * @param imageBase64 Image en base64 (sans préfixe data:...)
   * @param mimeType Type MIME (image/jpeg, image/png, etc.)
   */
  async extractFromImage(
    imageBase64: string,
    mimeType: string
  ): Promise<QuizzVisionResult> {
    try {
      logger.info("🔍 Extraction quiz depuis image", "api", { mimeType });

      const response = await directGeminiService.generateContentWithImage(
        imageBase64,
        mimeType,
        QUIZZ_EXTRACTION_PROMPT,
        { temperature: 0.3 } // Plus déterministe pour l'extraction
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Échec de l'analyse de l'image",
        };
      }

      const parsed = this.parseQuizzResponse(response.data);
      if (!parsed) {
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
    } catch (error) {
      logger.error("Erreur extraction quiz", "api", error);
      return {
        success: false,
        error: "Erreur lors de l'analyse de l'image",
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

      const response = await directGeminiService.generateContent(userInput, prompt, {
        temperature: 0.7, // Plus créatif pour la génération
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Échec de la génération",
        };
      }

      const parsed = this.parseQuizzResponse(response.data);
      if (!parsed) {
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
      const questions: QuizzQuestion[] = parsed.questions.map(
        (q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          question: q.question || q.title || "",
          type: this.normalizeQuestionType(q.type),
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 1,
          explanation: q.explanation,
        })
      );

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
    type: string
  ): "single" | "multiple" | "text" | "true-false" {
    const t = (type || "single").toLowerCase();
    if (t.includes("multi")) return "multiple";
    if (t.includes("text") || t.includes("libre")) return "text";
    if (t.includes("true") || t.includes("vrai") || t.includes("bool"))
      return "true-false";
    return "single";
  }
}

export const quizzVisionService = QuizzVisionService.getInstance();
