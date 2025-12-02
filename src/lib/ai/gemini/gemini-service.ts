import CalendarQuery, { CalendarDay } from "../calendar-generator";
import { handleError, ErrorFactory, logError } from "../error-handling";
import { logger } from "../logger";
import { formatDateLocal, getTodayLocal } from "../date-utils";
import { postProcessSuggestion } from "@/services/GeminiSuggestionPostProcessor";
import { secureGeminiService } from "@/services/SecureGeminiService";
import { directGeminiService } from "@/services/DirectGeminiService";
import { getEnv, isDev } from "../env";
import type { ParsedTemporalInput } from "../temporalParser";

// Import modules
import { PromptBuilder } from "./prompts";
import {
  buildDateHintsFromParsed,
  validateFormPollResponse,
  validateDatePollResponse,
} from "./hints";

// Types pour Form Polls (questionnaires)
export interface FormQuestion {
  text: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text" | "rating" | "nps" | "matrix" | "date";
  required: boolean;
  options?: string[];
  maxChoices?: number;
  placeholder?: string;
  maxLength?: number;
  ratingScale?: number;
  ratingStyle?: "numbers" | "stars" | "emojis";
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  validationType?: "email" | "phone" | "url" | "number" | "date";
  matrixRows?: Array<{ id: string; label: string }>;
  matrixColumns?: Array<{ id: string; label: string }>;
  matrixType?: "single" | "multiple";
  matrixColumnsNumeric?: boolean;
  selectedDates?: string[];
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>;
  timeGranularity?: "15min" | "30min" | "1h";
  allowMaybeVotes?: boolean;
  allowAnonymousVotes?: boolean;
}

export interface FormPollSuggestion {
  title: string;
  description?: string;
  questions: FormQuestion[];
  type: "form";
  conditionalRules?: any[];
}

// Types pour Date Polls (sondages de dates)
export interface DatePollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[];
  }>;
  type: "date" | "datetime" | "custom";
  participants?: string[];
  dateGroups?: Array<{
    dates: string[];
    label: string;
    type: "weekend" | "week" | "fortnight" | "custom";
  }>;
}

// Union type pour supporter les deux types de sondages
export type PollSuggestion = DatePollSuggestion | FormPollSuggestion;

export interface GeminiResponse {
  success: boolean;
  data?: PollSuggestion;
  message: string;
  error?: string;
}

// Choisir entre appel direct Gemini ou Edge Function
const USE_DIRECT_GEMINI = getEnv("VITE_USE_DIRECT_GEMINI") === "true";
const geminiBackend = USE_DIRECT_GEMINI ? directGeminiService : secureGeminiService;

if (USE_DIRECT_GEMINI) {
  logger.info("🔵 Mode DIRECT GEMINI API activé (bypass Edge Function)", "api");
  const apiKey = getEnv("VITE_GEMINI_API_KEY");
  if (!apiKey) {
    logger.error("VITE_GEMINI_API_KEY non configurée en mode direct", "api");
  } else {
    logger.info(`VITE_GEMINI_API_KEY configurée: ${apiKey.substring(0, 10)}...`, "api");
  }
} else {
  logger.info("🟢 Mode Edge Function activé", "api");
}

// Constantes pour la gestion des quotas
const RATE_LIMIT: { REQUESTS_PER_SECOND: number; REQUESTS_PER_DAY: number } = {
  REQUESTS_PER_SECOND: 2,
  REQUESTS_PER_DAY: 960,
};

export class GeminiService {
  private static instance: GeminiService;
  private calendarQuery: CalendarQuery;

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private constructor() {
    this.calendarQuery = new CalendarQuery();
  }

  /**
   * Détecte si l'input contient du markdown de questionnaire
   */
  private isMarkdownQuestionnaire(text: string): boolean {
    const hasTitle = /^#\s+.+$/m.test(text);
    const hasSections = /^##\s+.+$/m.test(text);
    const hasQuestions = /^###\s*Q\d+/m.test(text);
    const hasCheckboxes = /-\s*[☐□]|^-\s*\[\s*\]/m.test(text);

    const isMarkdown = hasTitle && hasSections && hasQuestions && text.length > 200;

    if (isDev()) {
      logger.info(
        `Markdown detection: title=${hasTitle}, sections=${hasSections}, questions=${hasQuestions}, checkboxes=${hasCheckboxes}, length=${text.length}, result=${isMarkdown}`,
        "api",
      );
    }

    return isMarkdown;
  }

  /**
   * Parse un questionnaire markdown et extrait la structure
   */
  private parseMarkdownQuestionnaire(markdown: string): string | null {
    try {
      let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

      const titleMatch = cleaned.match(/^#\s+(.+?)$/m);
      if (!titleMatch) return null;
      const title = titleMatch[1].trim();

      let prompt = `TITRE: ${title}\n\n`;

      const parts = cleaned.split(/(?=^##\s+)/gm);
      const sections = parts.filter(
        (part: string) => part.startsWith("##") && !part.startsWith("###"),
      );

      for (const sectionContent of sections) {
        const lines = sectionContent.split("\n");
        const sectionTitle = lines[0].replace(/^##\s+/, "").trim();

        const questionParts = sectionContent.split(/(?=^###\s)/gm);
        const questionBlocks = questionParts.filter((part: string) =>
          part.trim().startsWith("###"),
        );

        for (const questionBlock of questionBlocks) {
          const firstLine = questionBlock.split("\n")[0];
          const questionTitle = firstLine
            .replace(/^###\s*(?:Q\d+[a-z]*\.|Q\d+[a-z]*|Question\s*\d+:?|\d+[).]\s*)\s*/, "")
            .trim();

          prompt += `QUESTION: ${questionTitle}\n`;
          prompt += `SECTION: ${sectionTitle}\n`;
          prompt += `${questionBlock}\n\n`;
        }
      }

      return prompt;
    } catch (error) {
      logError(error, "MarkdownParsingError", { markdown: markdown.substring(0, 100) });
      return null;
    }
  }

  /**
   * Génère un sondage à partir de l'input utilisateur
   */
  async generatePoll(userInput: string): Promise<GeminiResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (isDev()) {
        logger.info("🔵 GeminiService.generatePoll", "api", {
          requestId,
          userInput: userInput.substring(0, 100),
        });
      }

      // Détecter le type de sondage
      const pollType = this.detectPollType(userInput);

      // Traiter l'input selon le type
      let processedInput = userInput;
      if (pollType === "form") {
        const parsedMarkdown = this.parseMarkdownQuestionnaire(userInput);
        if (parsedMarkdown) {
          processedInput = parsedMarkdown;
        }
      }

      // Générer les hints de dates si nécessaire
      let dateHints = "";
      if (pollType === "date") {
        try {
          // Import dynamique pour éviter les dépendances circulaires
          const { parseTemporalInput } = await import("../temporalParser");
          const { validateTemporalInput } = await import("../temporalValidator");

          const parsed = parseTemporalInput(userInput);
          const validation = validateTemporalInput(parsed);

          if (validation.isValid && parsed.allowedDates.length > 0) {
            dateHints = buildDateHintsFromParsed(parsed, userInput);

            logger.debug("🎯 Hints envoyés à Gemini", "api", {
              requestId,
              hintsLength: dateHints.length,
            });
          }
        } catch (error) {
          logger.warn("Erreur lors du pré-parsing temporel, continuation normale", "api", error);
        }
      }

      // Router vers le bon prompt selon le type
      let prompt: string;
      if (pollType === "form") {
        const isStructured = PromptBuilder.isStructuredQuestionnaire(processedInput);
        prompt = isStructured
          ? PromptBuilder.buildFormPollPromptCopy(processedInput)
          : PromptBuilder.buildFormPollPromptGenerate(processedInput);
      } else {
        prompt = PromptBuilder.buildDatePollPrompt(processedInput, dateHints);
      }

      // Appeler Gemini via backend configuré
      const secureResponse = await geminiBackend.generateContent(userInput, prompt);

      if (!secureResponse.success) {
        return this.handleGeminiError(secureResponse);
      }

      // Parser et valider la réponse
      const suggestion =
        pollType === "form"
          ? this.parseFormPollResponse(secureResponse.data!)
          : this.parseGeminiResponse(secureResponse.data!);

      if (!suggestion) {
        return {
          success: false,
          message: "Impossible de parser la réponse Gemini",
          error: "PARSE_ERROR",
        };
      }

      // Post-traitement
      const processedSuggestion = postProcessSuggestion(suggestion);

      return {
        success: true,
        data: processedSuggestion,
        message: "Sondage généré avec succès",
      };
    } catch (error) {
      logError(error, "GeminiGenerationError", {
        requestId,
        userInput: userInput.substring(0, 100),
      });
      return {
        success: false,
        message: "Erreur lors de la génération du sondage",
        error: "GENERATION_ERROR",
      };
    }
  }

  /**
   * Détecte le type de sondage à partir de l'input
   */
  private detectPollType(input: string): "date" | "form" {
    // Score pour les indicateurs de formulaire
    let formScore = 0;
    let strongFormScore = 0;

    // Mots-clés forts pour les formulaires
    const strongFormKeywords = [
      "questionnaire",
      "formulaire",
      "sondage",
      "enquête",
      "feedback",
      "avis",
      "opinion",
      "évaluation",
      "note",
      "cotation",
      "rating",
      "satisfaction",
      "expérience",
      "service client",
      "enquête de satisfaction",
    ];

    // Mots-clés pour les formulaires
    const formKeywords = [
      "question",
      "réponse",
      "choix",
      "option",
      "case à cocher",
      "bouton radio",
      "échelle",
      "notation",
      "note sur",
      "note de",
      "satisfait",
      "pas satisfait",
      "recommanderiez",
      "NPS",
      "net promoter",
    ];

    // Vérifier les mots-clés forts
    strongFormKeywords.forEach((keyword) => {
      if (input.toLowerCase().includes(keyword)) {
        strongFormScore += 2;
      }
    });

    // Vérifier les mots-clés de formulaire
    formKeywords.forEach((keyword) => {
      if (input.toLowerCase().includes(keyword)) {
        formScore += 1;
      }
    });

    // Vérifier si c'est un questionnaire markdown
    if (this.isMarkdownQuestionnaire(input)) {
      strongFormScore += 3;
    }

    const totalFormScore = formScore + strongFormScore;

    // Score pour les indicateurs de dates
    let dateScore = 0;

    // Mots-clés pour les dates
    const dateKeywords = [
      "date",
      "quand",
      "moment",
      "créneau",
      "horaire",
      "disponibilité",
      "rendez-vous",
      "réunion",
      "meeting",
      "agenda",
      "calendrier",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
      "aujourd'hui",
      "demain",
      "semaine",
      "mois",
      "weekend",
      "matin",
      "après-midi",
      "soir",
      "nuit",
    ];

    dateKeywords.forEach((keyword) => {
      if (input.toLowerCase().includes(keyword)) {
        dateScore += 1;
      }
    });

    // Patterns de dates
    const datePatterns = [
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, // JJ/MM/AAAA
      /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/, // AAAA/MM/JJ
      /\d{1,2}h\d{2}/, // Heures (9h30)
      /(dans|en)\s+\d+\s+(jour|jours|semaine|semaines|mois|an)/, // Dans X jours
    ];

    datePatterns.forEach((pattern) => {
      if (pattern.test(input)) {
        dateScore += 2;
      }
    });

    if (isDev()) {
      logger.info(
        `🌐 Poll type detection: strongFormScore=${strongFormScore}, formScore=${formScore}, totalFormScore=${totalFormScore}, dateScore=${dateScore}`,
        "api",
      );
    }

    // Décision finale
    if (totalFormScore >= 3 || strongFormScore >= 2) {
      return "form";
    } else if (dateScore >= 2) {
      return "date";
    } else {
      // Par défaut, considérer comme un sondage de dates
      return "date";
    }
  }

  /**
   * Gère les erreurs spécifiques de Gemini
   */
  private handleGeminiError(secureResponse: any): GeminiResponse {
    if (secureResponse.error === "CONFIG_ERROR") {
      return {
        success: false,
        message: "Erreur de configuration: clé API Gemini introuvable ou invalide.",
        error: "CONFIG_ERROR",
      };
    }

    if (secureResponse.error === "QUOTA_EXCEEDED") {
      return {
        success: false,
        message: secureResponse.message || "Quota de crédits IA dépassé",
        error: "QUOTA_EXCEEDED",
      };
    }

    if (secureResponse.error === "RATE_LIMIT_EXCEEDED") {
      return {
        success: false,
        message: secureResponse.message || "Trop de requêtes. Veuillez patienter.",
        error: "RATE_LIMIT_EXCEEDED",
      };
    }

    if (secureResponse.error === "UNAUTHORIZED") {
      return {
        success: false,
        message: "Erreur d'authentification. Veuillez vous reconnecter.",
        error: "UNAUTHORIZED",
      };
    }

    return {
      success: false,
      message: secureResponse.message || "Erreur inconnue",
      error: secureResponse.error || "UNKNOWN_ERROR",
    };
  }

  /**
   * Parse la réponse Gemini pour les sondages de dates
   */
  private parseGeminiResponse(text: string): DatePollSuggestion | null {
    try {
      // Tenter de parser du JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn("Pas de JSON trouvé dans la réponse Gemini", "api", {
          text: text.substring(0, 200),
        });
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validation basique
      if (!parsed.title || !Array.isArray(parsed.dates)) {
        logger.warn("Structure JSON invalide pour DatePoll", "api", { parsed });
        return null;
      }

      // Validation avec le validator
      const validation = validateDatePollResponse(parsed);
      if (!validation.isValid) {
        logger.warn("DatePoll validation failed", "api", { errors: validation.errors });
        return null;
      }

      return parsed as DatePollSuggestion;
    } catch (error) {
      logError(error, "GeminiResponseParseError", { text: text.substring(0, 200) });
      return null;
    }
  }

  /**
   * Parse la réponse Gemini pour les questionnaires
   */
  private parseFormPollResponse(text: string): FormPollSuggestion | null {
    try {
      // Tenter de parser du JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn("Pas de JSON trouvé dans la réponse Gemini", "api", {
          text: text.substring(0, 200),
        });
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validation basique
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        logger.warn("Structure JSON invalide pour FormPoll", "api", { parsed });
        return null;
      }

      // Validation avec le validator
      const validation = validateFormPollResponse(parsed);
      if (!validation.isValid) {
        logger.warn("FormPoll validation failed", "api", { errors: validation.errors });
        return null;
      }

      // Normaliser les questions
      const validQuestions = parsed.questions.filter((q: FormQuestion) => {
        if (!q.title || !q.type) return false;

        const validTypes = [
          "single",
          "multiple",
          "text",
          "long-text",
          "rating",
          "nps",
          "matrix",
          "date",
        ];
        if (!validTypes.includes(q.type)) return false;

        // Validation spécifique par type
        if (
          (q.type === "single" || q.type === "multiple") &&
          (!Array.isArray(q.options) || q.options.length < 2)
        ) {
          return false;
        }

        if (
          q.type === "date" &&
          (!Array.isArray(q.selectedDates) || q.selectedDates.length === 0)
        ) {
          return false;
        }

        return true;
      });

      if (validQuestions.length === 0) {
        logger.warn("Aucune question valide dans le questionnaire", "api");
        return null;
      }

      return {
        ...parsed,
        questions: validQuestions,
        type: "form",
      } as FormPollSuggestion;
    } catch (error) {
      logError(error, "FormPollResponseParseError", { text: text.substring(0, 200) });
      return null;
    }
  }
}
