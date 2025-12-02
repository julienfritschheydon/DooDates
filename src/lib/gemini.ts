import CalendarQuery, { CalendarDay } from "./calendar-generator";
import { handleError, ErrorFactory, logError } from "./error-handling";
import { logger } from "./logger";
import { formatDateLocal, getTodayLocal } from "./date-utils";
import { postProcessSuggestion } from "@/services/GeminiSuggestionPostProcessor";
import { secureGeminiService } from "@/services/SecureGeminiService";
import { directGeminiService } from "@/services/DirectGeminiService";
import { getEnv, isDev } from "./env";
import type { ParsedTemporalInput } from "./temporalParser";

// Choisir entre appel direct Gemini ou Edge Function
// Pour forcer appel direct, définir VITE_USE_DIRECT_GEMINI=true dans .env.local
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
  REQUESTS_PER_DAY: 960, // Quota pour le chat
};

// Types pour Form Polls (questionnaires)
export interface FormQuestion {
  text: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text" | "rating" | "nps" | "matrix" | "date";
  required: boolean;
  options?: string[]; // Pour single/multiple
  maxChoices?: number; // Pour multiple
  placeholder?: string; // Pour text/long-text
  maxLength?: number; // Pour text/long-text
  // Rating-specific fields
  ratingScale?: number; // 5 ou 10 (par défaut 5)
  ratingStyle?: "numbers" | "stars" | "emojis"; // Style d'affichage (par défaut numbers)
  ratingMinLabel?: string; // Label pour la valeur minimale
  ratingMaxLabel?: string; // Label pour la valeur maximale
  // Text validation fields
  validationType?: "email" | "phone" | "url" | "number" | "date"; // Type de validation pour champs text
  // Matrix-specific fields
  matrixRows?: Array<{ id: string; label: string }>; // Lignes (aspects à évaluer)
  matrixColumns?: Array<{ id: string; label: string }>; // Colonnes (échelle de réponse)
  matrixType?: "single" | "multiple"; // Une seule réponse par ligne ou plusieurs
  matrixColumnsNumeric?: boolean; // Colonnes numériques (1-5) au lieu de texte
  // Date-specific fields
  selectedDates?: string[]; // Dates au format ISO string (YYYY-MM-DD)
  timeSlotsByDate?: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>>; // Créneaux horaires par date
  timeGranularity?: "15min" | "30min" | "1h"; // Granularité des créneaux horaires
  allowMaybeVotes?: boolean; // Permettre les votes "peut-être"
  allowAnonymousVotes?: boolean; // Permettre les votes anonymes
}

export interface FormPollSuggestion {
  title: string;
  description?: string;
  questions: FormQuestion[];
  type: "form";
  conditionalRules?: import("../types/conditionalRules").ConditionalRule[];
}

// Types pour Date Polls (sondages de dates)
export interface DatePollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots?: Array<{
    start: string;
    end: string;
    dates?: string[]; // Dates spécifiques auxquelles ce créneau s'applique
  }>;
  type: "date" | "datetime" | "custom";
  participants?: string[];
  // 🔧 Groupes de dates (week-ends, semaines, quinzaines)
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
    // Initialiser le calendrier pré-généré
    this.calendarQuery = new CalendarQuery();
  }

  /**
   * Détecte si l'input contient du markdown de questionnaire
   */
  private isMarkdownQuestionnaire(text: string): boolean {
    const hasTitle = /^#\s+.+$/m.test(text);
    const hasSections = /^##\s+.+$/m.test(text);
    const hasQuestions = /^###\s*Q\d+/m.test(text);
    // Support multiple checkbox formats: ☐, □, - [ ], etc.
    const hasCheckboxes = /-\s*[☐□]|^-\s*\[\s*\]/m.test(text);

    const isMarkdown = hasTitle && hasSections && hasQuestions && text.length > 200;

    if (isDev()) {
      logger.info(
        `Markdown detection: title=${hasTitle}, sections=${hasSections}, questions=${hasQuestions}, checkboxes=${hasCheckboxes}, length=${text.length}, result=${isMarkdown}`,
        "api",
      );
    }

    // Doit avoir au moins titre + questions ET sections
    return isMarkdown;
  }

  /**
   * Parse un questionnaire markdown et extrait la structure
   */
  private parseMarkdownQuestionnaire(markdown: string): string | null {
    try {
      // Nettoyer les commentaires HTML
      let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

      // Extraire titre principal
      const titleMatch = cleaned.match(/^#\s+(.+?)$/m);
      if (!titleMatch) return null;
      const title = titleMatch[1].trim();

      // Construire un format UNIFORME simplifié pour Gemini
      let prompt = `TITRE: ${title}\n\n`;

      // Extraire sections avec split() (méthode robuste testée)
      const parts = cleaned.split(/(?=^##\s+)/gm);
      const sections = parts.filter(
        (part: string) => part.startsWith("##") && !part.startsWith("###"),
      );

      let questionNumber = 0;
      const conditionalPatterns: Array<{
        questionNumber: number;
        title: string;
      }> = [];

      for (const sectionContent of sections) {
        const lines = sectionContent.split("\n");
        const sectionTitle = lines[0].replace(/^##\s+/, "").trim();

        // Extraire questions avec split() (plus robuste que regex)
        const questionParts = sectionContent.split(/(?=^###\s)/gm);
        const questionBlocks = questionParts.filter((part: string) =>
          part.trim().startsWith("###"),
        );

        for (const questionBlock of questionBlocks) {
          questionNumber++;

          // Extraire le titre de la question (première ligne sans les ###)
          const firstLine = questionBlock.split("\n")[0];
          const questionTitle = firstLine
            .replace(/^###\s*(?:Q\d+[a-z]*\.|Q\d+[a-z]*|Question\s*\d+:?|\d+[).]\s*)\s*/, "")
            .trim();

          // Détecter si la question est conditionnelle (Si NON, Si OUI, etc.)
          const conditionalMatch = questionTitle.match(/^Si\s+(NON|OUI|non|oui)[,\s]+(.+)/i);
          if (conditionalMatch) {
            conditionalPatterns.push({
              questionNumber,
              title: questionTitle,
            });
          }

          // Détecter type de question
          const lowerBlock = questionBlock.toLowerCase();
          let type = "single";
          let maxChoices = undefined;

          // Texte libre (détection étendue)
          if (
            lowerBlock.includes("réponse libre") ||
            lowerBlock.includes("texte libre") ||
            lowerBlock.includes("votre réponse") ||
            lowerBlock.includes("_votre réponse") ||
            lowerBlock.includes("commentaires") ||
            lowerBlock.includes("expliquez") ||
            lowerBlock.includes("précisez") ||
            lowerBlock.includes("détailler")
          ) {
            type = "text";
          }
          // Choix multiple avec contrainte
          else {
            const maxMatch = lowerBlock.match(/max\s+(\d+)|(\d+)\s+max/);
            if (maxMatch) {
              type = "multiple";
              maxChoices = parseInt(maxMatch[1] || maxMatch[2]);
            }
            // Choix unique explicite
            else if (
              lowerBlock.includes("1 seule réponse") ||
              lowerBlock.includes("une réponse") ||
              lowerBlock.includes("une seule")
            ) {
              type = "single";
            }
          }

          // Format UNIFORME simplifié
          prompt += `QUESTION ${questionNumber} [${type}`;
          if (maxChoices) prompt += `, max=${maxChoices}`;
          prompt += `, required]:\n${questionTitle}\n`;

          // Extraire options (support TOUS les formats)
          if (type !== "text") {
            // Support: -, *, •, ○, ☐, □, ✓, [ ]
            const optionRegex = /^[\s]*[-*\u2022\u25cb\u2610\u25a1\u2713]\s*(?:\[\s*\])?\s*(.+)$/gm;
            const options: string[] = [];
            let optionMatch;

            while ((optionMatch = optionRegex.exec(questionBlock)) !== null) {
              let option = optionMatch[1].trim();

              // Nettoyer les symboles checkbox résiduels (☐, □, ✓, [ ])
              option = option.replace(/^[☐□✓\u2610\u25a1\u2713]\s*/, "");
              option = option.replace(/^\[\s*\]\s*/, "");
              option = option.trim();

              // Ignorer les sous-titres markdown et "Autre :"
              if (!option.startsWith("#") && !option.startsWith("Autre :") && option.length > 0) {
                options.push(option);
              }
            }

            if (options.length > 0) {
              // Format simple : une ligne par option
              options.forEach((opt: string) => {
                prompt += `- ${opt}\n`;
              });
            }
          } else {
            prompt += `(réponse libre)\n`;
          }

          prompt += "\n";
        }
      }

      // Ajouter les règles conditionnelles détectées
      if (conditionalPatterns.length > 0) {
        prompt += `\nRÈGLES CONDITIONNELLES:\n`;
        for (const pattern of conditionalPatterns) {
          const match = pattern.title.match(/^Si\s+(NON|OUI|non|oui)[,\s]+(.+)/i);
          if (match) {
            const condition = match[1].toUpperCase();
            const dependsOnQuestion = pattern.questionNumber - 1;
            prompt += `- Question ${pattern.questionNumber} s'affiche seulement si Question ${dependsOnQuestion} = "${condition === "OUI" ? "Oui" : "Non"}"\n`;
          }
        }
        prompt += "\n";
      }

      return prompt;
    } catch (error) {
      logger.error("Erreur parsing markdown questionnaire", "api", error);
      return null;
    }
  }

  /**
   * Détecte le type de sondage demandé par l'utilisateur
   * @param userInput Texte de la demande utilisateur
   * @returns "form" pour questionnaire, "date" pour sondage de dates
   */
  private detectPollType(userInput: string): "date" | "form" {
    const inputLower = userInput.toLowerCase();

    // Mots-clés explicites pour Form Polls (haute priorité)
    // ⚠️ "sondage" retiré car ambigu (peut être date ou form selon contexte)
    const strongFormKeywords = [
      "questionnaire",
      "enquête",
      "formulaire",
      "satisfaction",
      "feedback",
      "avis",
      "sondage d'opinion",
      "sondage de satisfaction",
    ];

    // Mots-clés secondaires pour Form Polls
    const formKeywords = [
      "questions",
      "choix multiple",
      "préférences",
      "vote sur",
      "classement",
      "évaluation",
      "opinion",
      "retour",
      "impression",
    ];

    // Mots-clés pour Date Polls (sondages de dates)
    const dateKeywords = [
      "date",
      "dates",
      "rendez-vous",
      "réunion",
      "disponibilité",
      "planning",
      "horaire",
      "horaires",
      "créneau",
      "créneaux",
      "semaine",
      "jour",
      "jours",
      "mois",
      "calendrier",
      "rdv",
      "rencontre",
      "meeting",
      "déjeuner",
      "diner",
      "dîner",
      "petit-déjeuner",
      "petit déjeuner",
      "midi",
      "soir",
      "matin",
      "après-midi",
      "après midi",
      "demain",
      "aujourd'hui",
      "aujourd hui",
      "semaine prochaine",
      "semaine pro",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ];

    // Compter les occurrences de chaque type de mot-clé
    const strongFormScore = strongFormKeywords.filter((kw: string) =>
      inputLower.includes(kw),
    ).length;
    const formScore = formKeywords.filter((kw: string) => inputLower.includes(kw)).length;
    const dateScore = dateKeywords.filter((kw: string) => inputLower.includes(kw)).length;

    // Cas spécial : "sondage" seul est ambigu, mais avec contexte de dates → date poll
    const hasSondage = inputLower.includes("sondage");
    const hasDateContext =
      dateScore > 0 ||
      inputLower.includes("demain") ||
      inputLower.includes("déjeuner") ||
      inputLower.includes("diner") ||
      inputLower.includes("dîner") ||
      inputLower.includes("midi") ||
      inputLower.includes("soir") ||
      inputLower.includes("matin");

    const totalFormScore = strongFormScore + formScore;

    if (isDev()) {
      logger.info(
        `Poll type detection: strongFormScore=${strongFormScore}, formScore=${formScore}, totalFormScore=${totalFormScore}, dateScore=${dateScore}, hasSondage=${hasSondage}, hasDateContext=${hasDateContext}`,
        "api",
      );
    }

    // Si "sondage" + contexte de dates → Date Poll (priorité)
    if (hasSondage && hasDateContext) {
      return "date";
    }

    // Si des mots-clés explicites de formulaire sont présents, priorité au form
    if (strongFormScore > 0) {
      return "form";
    }

    // Si "sondage" seul sans contexte de dates → Form Poll (par défaut)
    if (hasSondage && !hasDateContext) {
      return "form";
    }

    // Sinon, comparer les scores totaux
    if (totalFormScore > dateScore) {
      return "form";
    }

    // Sinon → Date Poll (défaut pour backward compatibility)
    return "date";
  }

  async generatePollFromText(userInput: string): Promise<GeminiResponse> {
    const requestId = crypto.randomUUID();

    if (isDev()) {
      logger.info("🟡 GeminiService.generatePollFromText appelé", "api", {
        requestId,
        userInputLength: userInput?.length || 0,
        userInputPreview: userInput?.substring(0, 50) || "",
      });
    }

    try {
      // NOUVEAU : Détecter si c'est du markdown
      const isMarkdown = this.isMarkdownQuestionnaire(userInput);
      let processedInput = userInput;
      let pollType: "date" | "form";

      if (isDev()) {
        logger.info("📋 Détection type", "api", { requestId, isMarkdown });
      }

      if (isMarkdown) {
        // Parser le markdown et convertir en prompt structuré
        const parsedPrompt = this.parseMarkdownQuestionnaire(userInput);
        if (parsedPrompt) {
          processedInput = parsedPrompt;
          pollType = "form"; // Les questionnaires markdown sont toujours des Form Polls
          if (isDev()) {
            logger.info("Markdown questionnaire détecté et parsé avec succès", "api");
          }
        } else {
          // Fallback si parsing échoue
          pollType = this.detectPollType(userInput);
        }
      } else {
        // Détection normale
        pollType = this.detectPollType(userInput);
      }

      if (isDev()) {
        logger.info(
          `Generating ${pollType === "form" ? "Form Poll" : "Date Poll"} from user input`,
          "api",
        );
      }

      // PRE-PARSING TEMPOREL avec le nouveau parser robuste (seulement pour Date Polls)
      let dateHints = "";
      let allowedDates: string[] | undefined;
      let parsedTemporal: ParsedTemporalInput | undefined;

      if (pollType === "date") {
        try {
          // Utiliser le nouveau parser temporel robuste
          const { parseTemporalInput } = await import("./temporalParser");
          const { validateParsedInput, autoFixParsedInput } = await import("./temporalValidator");

          const parsed = await parseTemporalInput(userInput);

          // Valider le parsing
          const validation = validateParsedInput(parsed);

          // Auto-corriger si nécessaire
          const fixedParsed = validation.isValid ? parsed : autoFixParsedInput(parsed, validation);

          // Stocker pour le post-processor
          parsedTemporal = fixedParsed;

          // Utiliser les dates corrigées
          allowedDates = fixedParsed.allowedDates.length > 0 ? fixedParsed.allowedDates : undefined;

          // Générer les hints Gemini basés sur le parsing
          dateHints = this.buildDateHintsFromParsed(fixedParsed, userInput);

          if (isDev()) {
            logger.info("📅 Dates pré-parsées avec temporalParser", "api", {
              type: fixedParsed.type,
              allowedDatesCount: fixedParsed.allowedDates.length,
              detectedKeywords: fixedParsed.detectedKeywords,
              validationErrors: validation.errors.length,
              validationWarnings: validation.warnings.length,
            });
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
        // Détecter si c'est un questionnaire structuré (markdown parsé) ou une simple demande
        const isStructured = this.isStructuredQuestionnaire(processedInput);
        prompt = isStructured
          ? this.buildFormPollPromptCopy(processedInput)
          : this.buildFormPollPromptGenerate(processedInput);

        if (isDev()) {
          logger.info(
            `Form Poll mode: ${isStructured ? "COPY (markdown parsé)" : "GENERATE (demande simple)"}`,
            "api",
          );
        }
      } else {
        // Construire le prompt avec les hints de dates en priorité
        prompt = this.buildPollGenerationPrompt(processedInput, dateHints);
      }

      // Appeler Gemini via backend configuré (direct ou Edge Function)
      if (isDev()) {
        logger.info("🔵 Appel geminiBackend.generateContent", "api", {
          requestId,
          mode: USE_DIRECT_GEMINI ? "DIRECT" : "EDGE_FUNCTION",
          hasUserInput: !!userInput,
          hasPrompt: !!prompt,
          promptLength: prompt?.length || 0,
        });
      }
      const secureResponse = await geminiBackend.generateContent(userInput, prompt);
      if (isDev()) {
        logger.info("🟢 Réponse geminiBackend reçue", "api", {
          requestId,
          success: secureResponse.success,
          hasData: !!secureResponse.data,
          error: secureResponse.error,
        });
      }

      if (!secureResponse.success) {
        // Gérer les erreurs spécifiques
        if (secureResponse.error === "CONFIG_ERROR") {
          const apiKey = getEnv("VITE_GEMINI_API_KEY");
          logger.error("CONFIG_ERROR détectée", "api", {
            useDirectGemini: USE_DIRECT_GEMINI,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length || 0,
            errorMessage: secureResponse.message,
          });

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

        if (secureResponse.error === "NETWORK_ERROR") {
          logger.error("NETWORK_ERROR détectée", "api", {
            mode: USE_DIRECT_GEMINI ? "DIRECT" : "EDGE_FUNCTION",
            errorMessage: secureResponse.message,
            hasSupabaseUrl: !!getEnv("VITE_SUPABASE_URL"),
            hasSupabaseKey: !!getEnv("VITE_SUPABASE_ANON_KEY"),
          });

          return {
            success: false,
            message: secureResponse.message || "Erreur réseau lors de la communication avec l'IA",
            error: "NETWORK_ERROR",
          };
        }

        if (secureResponse.error === "API_ERROR") {
          logger.error("API_ERROR détectée", "api", {
            mode: USE_DIRECT_GEMINI ? "DIRECT" : "EDGE_FUNCTION",
            errorMessage: secureResponse.message,
            hasSupabaseUrl: !!getEnv("VITE_SUPABASE_URL"),
            hasSupabaseKey: !!getEnv("VITE_SUPABASE_ANON_KEY"),
          });

          return {
            success: false,
            message: secureResponse.message || "Erreur API lors de la communication avec l'IA",
            error: "API_ERROR",
          };
        }

        return {
          success: false,
          message: secureResponse.message || "Erreur lors de la communication avec le service IA",
          error: secureResponse.error || "UNKNOWN_ERROR",
        };
      }

      const text = secureResponse.data || "";

      if (isDev()) {
        logger.info("Raw Gemini response received", "api");
      }

      // Parser selon le type détecté
      const pollData =
        pollType === "form" ? this.parseFormPollResponse(text) : this.parseGeminiResponse(text);

      if (pollData) {
        const processedPollData =
          pollType === "date"
            ? postProcessSuggestion(pollData as DatePollSuggestion, {
                userInput,
                allowedDates,
                parsedTemporal: parsedTemporal, // Passer le parsing au post-processor
              })
            : pollData;

        const successMessage =
          pollType === "form"
            ? "Questionnaire généré avec succès !"
            : "Sondage généré avec succès !";

        if (isDev()) {
          logger.info(
            `${pollType === "form" ? "Form Poll" : "Date Poll"} successfully generated`,
            "api",
          );
        }

        return {
          success: true,
          data: processedPollData,
          message: successMessage,
        };
      } else {
        const parseError = ErrorFactory.validation(
          "Failed to parse Gemini response",
          "Impossible de générer le sondage à partir de votre demande",
        );

        logError(parseError, {
          component: "GeminiService",
          operation: "parseGeminiResponse",
        });

        return {
          success: false,
          message: "Impossible de générer le sondage à partir de votre demande",
          error: "PARSE_ERROR",
        };
      }
    } catch (error) {
      logger.error("Error in Gemini chat", "api", error);
      const generationError = handleError(
        error,
        {
          component: "GeminiService",
          operation: "generatePollFromText",
        },
        "Erreur lors de la génération du sondage",
      );

      logError(generationError, {
        component: "GeminiService",
        operation: "generatePollFromText",
      });

      return {
        success: false,
        message: "Erreur lors de la communication avec le service IA",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      };
    }
  }

  async chatAboutPoll(userInput: string, context?: string): Promise<string> {
    try {
      const prompt = this.buildChatPrompt(userInput, context);
      const secureResponse = await geminiBackend.generateContent(userInput, prompt);

      if (!secureResponse.success) {
        if (secureResponse.error === "QUOTA_EXCEEDED") {
          return "Désolé, votre quota de crédits IA est dépassé. Veuillez mettre à niveau votre compte.";
        }
        if (secureResponse.error === "UNAUTHORIZED") {
          return "Désolé, vous devez être connecté pour utiliser l'IA.";
        }
        return "Désolé, je n'ai pas pu traiter votre demande.";
      }

      return secureResponse.data || "Désolé, je n'ai pas pu traiter votre demande.";
    } catch (error) {
      const chatError = handleError(
        error,
        {
          component: "GeminiService",
          operation: "chatAboutPoll",
        },
        "Erreur lors du chat avec Gemini",
      );

      logError(chatError, {
        component: "GeminiService",
        operation: "chatAboutPoll",
      });

      return "Désolé, je n'ai pas pu traiter votre demande.";
    }
  }

  private getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));
    if (resultDate <= date) {
      resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
  }

  private getNextThursdayAfterTuesday(tuesday: Date): Date {
    // Si on est mardi, on veut le jeudi de la même semaine
    const thursday = new Date(tuesday);
    thursday.setDate(tuesday.getDate() + 2); // +2 jours pour aller de mardi à jeudi
    return thursday;
  }

  private getTargetYear(month: number): number {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Si le mois demandé est déjà passé cette année, utiliser l'année prochaine
    return month < currentMonth ? currentYear + 1 : currentYear;
  }

  private parseWeekendRange(startMonth: number, endMonth: number, year?: number): string[] {
    // Utiliser le calendrier pré-généré pour une performance optimale
    const targetYear = year || this.getTargetYear(startMonth);

    // Formater les mois pour la requête
    const startMonthKey = `${targetYear}-${startMonth.toString().padStart(2, "0")}`;
    const endMonthKey = `${targetYear}-${endMonth.toString().padStart(2, "0")}`;

    // Obtenir tous les week-ends de la période en une seule requête
    const weekendDays = this.calendarQuery.getWeekendsInMonths(startMonthKey, endMonthKey);

    // Grouper les week-ends par paires consécutives (samedi + dimanche)
    const weekendPairs: string[] = [];
    for (let i = 0; i < weekendDays.length; i++) {
      const currentDay = weekendDays[i];
      const currentDate = new Date(currentDay.date);

      // Si c'est un samedi (dayOfWeek = 6)
      if (currentDay.dayOfWeek === 6) {
        // Ajouter le samedi
        weekendPairs.push(currentDay.date);

        // Vérifier si le jour suivant est un dimanche consécutif
        const nextDay = weekendDays[i + 1];
        if (nextDay && nextDay.dayOfWeek === 0) {
          const nextDate = new Date(nextDay.date);
          const dayDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

          // Si le dimanche est bien le lendemain du samedi
          if (dayDiff === 1) {
            weekendPairs.push(nextDay.date);
            i++; // Sauter le dimanche car on l'a déjà traité
          }
        }
      }
      // Si c'est un dimanche isolé (pas précédé d'un samedi), on l'ignore
      // car un week-end = samedi + dimanche
    }

    return weekendPairs;
  }

  private parseConsecutiveDays(firstDay: number, daysCount: number, fromDate?: Date): string[] {
    const dates: string[] = [];
    const startDate = fromDate || this.getNextDayOfWeek(new Date(), firstDay);

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(formatDateLocal(date));
    }

    return dates;
  }

  private parseTimeRange(
    start: string,
    end: string,
    dates: string[],
  ): { start: string; end: string; dates: string[] } {
    return {
      start,
      end,
      dates,
    };
  }

  private getNextNDaysOfWeek(dayOfWeek: number, count: number, month: number): string[] {
    // Utiliser le calendrier pré-généré pour une performance optimale
    const targetYear = this.getTargetYear(month);
    const fromDate = `${targetYear}-${month.toString().padStart(2, "0")}-01`;

    // Obtenir directement N occurrences du jour de la semaine
    const dayOccurrences = this.calendarQuery.getNextNDaysOfWeek(dayOfWeek, count, fromDate);

    return dayOccurrences.map((day: { date: string }) => day.date);
  }

  private convertGeminiTimeSlots(
    timeSlots: Array<{ start: string; end: string; dates: string[] }>,
  ): Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> {
    const result: Record<string, Array<{ hour: number; minute: number; enabled: boolean }>> = {};

    timeSlots.forEach((slot: { start: string; end: string; dates: string[] }) => {
      slot.dates.forEach((date: string) => {
        if (!result[date]) {
          // Initialiser avec toutes les heures désactivées
          result[date] = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            minute: 0,
            enabled: false,
          }));
        }

        // Activer les heures correspondant au créneau
        const startHour = parseInt(slot.start.split(":")[0]);
        const endHour = parseInt(slot.end.split(":")[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          if (result[date][hour]) {
            result[date][hour].enabled = true;
          }
        }
      });
    });

    return result;
  }

  private generateSequentialTimeSlots(
    date: string,
    mainStartTime: string,
    durations: { brief?: number; main: number; debrief?: number },
  ): Array<{ start: string; end: string; dates: string[]; description?: string }> {
    const timeSlots = [];
    const currentTime = new Date(`${date}T${mainStartTime}`);

    // Si brief, on le met avant la réunion principale
    if (durations.brief) {
      const briefStart = new Date(currentTime);
      briefStart.setMinutes(briefStart.getMinutes() - durations.brief);

      timeSlots.push({
        start: briefStart.toTimeString().slice(0, 5),
        end: currentTime.toTimeString().slice(0, 5),
        dates: [date],
        description: "Brief d'équipe",
      });
    }

    // Réunion principale
    const mainEnd = new Date(currentTime);
    mainEnd.setMinutes(mainEnd.getMinutes() + durations.main);

    timeSlots.push({
      start: currentTime.toTimeString().slice(0, 5),
      end: mainEnd.toTimeString().slice(0, 5),
      dates: [date],
      description: "Réunion principale",
    });

    // Si débrief, on le met après la réunion principale
    if (durations.debrief) {
      const debriefStart = new Date(mainEnd);
      const debriefEnd = new Date(debriefStart);
      debriefEnd.setMinutes(debriefEnd.getMinutes() + durations.debrief);

      timeSlots.push({
        start: debriefStart.toTimeString().slice(0, 5),
        end: debriefEnd.toTimeString().slice(0, 5),
        dates: [date],
        description: "Débrief d'équipe",
      });
    }

    return timeSlots;
  }

  private parseTimePattern(timeStr: string): { hour: number; minute: number } {
    // Convertit "9h", "9:00", "09h00", etc. en { hour: 9, minute: 0 }
    const cleanTime = timeStr
      .toLowerCase()
      .replace("h", ":")
      .replace(/[^0-9:]/g, "");
    const [hours, minutes = "0"] = cleanTime.split(":");
    return {
      hour: parseInt(hours, 10),
      minute: parseInt(minutes, 10),
    };
  }

  private formatTime(hour: number, minute: number): string {
    // Formate en "HH:MM"
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  private parseSessionPattern(text: string): Array<{
    type: string;
    count: number;
    dayOfWeek: string;
    timeOfDay: string;
    month: string;
    format: string;
  }> {
    const patterns = [];

    // Analyse le texte pour trouver les patterns de sessions
    // Ex: "3 sessions en présentiel les lundis matins de mars"
    const sessionMatches = text.matchAll(
      /(\d+)\s+sessions?\s+en\s+(\w+)\s+les\s+(\w+)s?\s+(\w+)s?\s+(?:de|en|d'|du)\s+(\w+)/g,
    );

    for (const match of sessionMatches) {
      const [_, count, format, day, timing, month] = match;
      patterns.push({
        type: "session",
        count: parseInt(count),
        dayOfWeek: day,
        timeOfDay: timing,
        month: month,
        format: format,
      });
    }

    return patterns;
  }

  private getTimeRangeForPeriod(period: string): {
    start: string;
    end: string;
  } {
    const timeRanges = {
      matin: { start: "09:00", end: "12:00" },
      midi: { start: "12:00", end: "14:00" },
      "après-midi": { start: "14:00", end: "17:00" },
      soir: { start: "17:00", end: "19:00" },
    };

    return timeRanges[period] || { start: "09:00", end: "17:00" };
  }

  /**
   * Génère des hints contextuels spécifiques pour améliorer la génération de créneaux par Gemini.
   * Détecte les contextes spécifiques (visite musée, footing, visio, brunch, etc.) et génère des instructions précises.
   */
  /**
   * Génère les hints Gemini basés sur le parsing temporel robuste.
   */
  private buildDateHintsFromParsed(parsed: ParsedTemporalInput, userInput: string): string {
    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const monthNames = [
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
    ];

    // Cas 1: Jour de la semaine + période ("lundi dans 2 semaines")
    if (parsed.type === "day_of_week" && parsed.relativeWeeks && parsed.dayOfWeek) {
      // ⚠️ CAS SPÉCIAL : Plusieurs jours de la semaine avec période ("lundi ou mardi dans 2 semaines")
      const hasMultipleDays = parsed.dayOfWeek.length > 1;
      const jourName = hasMultipleDays
        ? parsed.dayOfWeek.map((d) => dayNames[d]).join(" ET ")
        : dayNames[parsed.dayOfWeek[0]];
      const targetDate = parsed.targetDates[0] ? formatDateLocal(parsed.targetDates[0]) : "N/A";

      const multipleDaysHint = hasMultipleDays
        ? `

⚠️⚠️⚠️ PLUSIEURS JOURS DE LA SEMAINE DÉTECTÉS ⚠️⚠️⚠️

Le prompt mentionne "${jourName}" → L'utilisateur veut des options pour CHAQUE jour mentionné !

RÈGLE ABSOLUE - PLUSIEURS JOURS + PÉRIODE:
→ OBLIGATOIRE : Générer EXACTEMENT ${parsed.dayOfWeek.length} DATES (une pour chaque jour mentionné)
→ OBLIGATOIRE : Chaque date doit correspondre au bon jour de la semaine
→ INTERDIT : Ne générer qu'une seule date (l'utilisateur veut voir les options pour tous les jours)

Dates autorisées (OBLIGATOIRE de générer TOUTES ces dates):
${parsed.allowedDates
  .map((d: string) => {
    const dateObj = new Date(d + "T00:00:00");
    const dayName = dayNames[dateObj.getDay()];
    return `  - ${d} (${dayName})`;
  })
  .join("\n")}

⚠️⚠️ CRITIQUE : Ne pas générer seulement 1 date ! L'utilisateur veut voir les options pour TOUS les jours mentionnés !`
        : "";

      return `

⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - JOUR SPÉCIFIQUE + PÉRIODE ⚠️⚠️⚠️

Jour demandé: ${jourName}
Période: dans ${parsed.relativeWeeks} semaines
Date de référence: ${targetDate}
${multipleDaysHint}
${
  !hasMultipleDays
    ? `RÈGLE ABSOLUE - JOUR SPÉCIFIQUE + PÉRIODE:
- Proposer UNIQUEMENT les ${jourName}s autour de la période (1-2 dates MAXIMUM)
- Filtrer pour ne garder QUE les ${jourName}s
- Générer 2-3 créneaux par date

Dates autorisées (filtrer pour ne garder que les ${jourName}s):
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}

⚠️ CRITIQUE : Ne proposer QUE des ${jourName}s, pas d'autres jours !`
    : ""
}
`;
    }

    // Cas 2: Date spécifique OU jour(s) de la semaine
    if (parsed.type === "specific_date" || parsed.type === "day_of_week") {
      // ⚠️ CAS SPÉCIAL : Plusieurs jours de la semaine détectés ("samedi ou dimanche", "lundi ou mardi")
      const hasMultipleDays = parsed.dayOfWeek && parsed.dayOfWeek.length > 1;
      // ⚠️ CAS SPÉCIAL : Plusieurs dates numériques détectées ("samedi 23 ou dimanche 24")
      // Le parser stocke plusieurs dates numériques dans allowedDates mais pas dans dateNumeric (qui est seulement la première)
      const hasMultipleNumericDates =
        parsed.allowedDates.length > 1 &&
        parsed.type === "day_of_week" &&
        parsed.dayOfWeek &&
        parsed.dayOfWeek.length > 1 &&
        /(\d{1,2})\s+ou\s+(\d{1,2})/.test(userInput); // Vérifier qu'il y a bien "X ou Y" dans le prompt

      const targetDate = parsed.targetDates[0] ? formatDateLocal(parsed.targetDates[0]) : "N/A";

      // Générer le hint pour plusieurs jours
      let multipleDaysHint = "";
      if (hasMultipleDays || hasMultipleNumericDates) {
        const joursNames =
          parsed.dayOfWeek && parsed.dayOfWeek.length > 0
            ? parsed.dayOfWeek.map((d) => dayNames[d]).join(" ET ")
            : "jours multiples";
        const expectedDatesCount = parsed.allowedDates.length;
        multipleDaysHint = `

⚠️⚠️⚠️ PLUSIEURS JOURS DE LA SEMAINE DÉTECTÉS ⚠️⚠️⚠️

Le prompt mentionne "${joursNames}" → L'utilisateur veut des options pour CHAQUE jour mentionné !

RÈGLE ABSOLUE - PLUSIEURS JOURS:
→ OBLIGATOIRE : Générer EXACTEMENT ${expectedDatesCount} DATES (une pour chaque jour mentionné)
→ OBLIGATOIRE : Chaque date doit correspondre au bon jour de la semaine
→ INTERDIT : Ne générer qu'une seule date (l'utilisateur veut voir les options pour tous les jours)
${parsed.isMealContext ? `→ OBLIGATOIRE : 1 CRÉNEAU UNIQUEMENT (partagé entre toutes les dates ou 1 par date selon le contexte)` : ""}

Dates autorisées (OBLIGATOIRE de générer TOUTES ces dates):
${parsed.allowedDates
  .map((d: string, idx: number) => {
    const dateObj = new Date(d + "T00:00:00");
    const dayName = dayNames[dateObj.getDay()];
    return `  - ${d} (${dayName})`;
  })
  .join("\n")}

⚠️⚠️ CRITIQUE : Ne pas générer seulement 1 date ! L'utilisateur veut voir les options pour TOUS les jours mentionnés !`;
      }

      const jourHint =
        parsed.dayOfWeek && parsed.dayOfWeek.length === 1
          ? `\n⚠️⚠️⚠️ JOUR DE LA SEMAINE DÉTECTÉ ⚠️⚠️⚠️\nLe prompt mentionne "${dayNames[parsed.dayOfWeek[0]]}" → Générer UNIQUEMENT le ${dayNames[parsed.dayOfWeek[0]]} correspondant (1 date uniquement)\n`
          : "";

      const partenariatsHint =
        /partenariats/.test(userInput) && parsed.isMealContext
          ? `\n⚠️⚠️⚠️ EXCEPTION PARTENARIATS ⚠️⚠️⚠️\nPour "déjeuner partenariats" avec date spécifique :\n→ OBLIGATOIRE : 1 DATE UNIQUEMENT\n→ OBLIGATOIRE : 2-3 CRÉNEAUX (exception à la règle générale repas + date spécifique)\n→ Créneaux entre 11h30 et 13h30\n`
          : "";

      // Si plusieurs jours, ne pas appliquer la règle "1 date uniquement" pour les repas
      const isMealWithMultipleDays =
        parsed.isMealContext && (hasMultipleDays || hasMultipleNumericDates);

      return `

⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - DATE SPÉCIFIQUE DÉTECTÉE ⚠️⚠️⚠️

Date cible calculée: ${targetDate}
${parsed.isProfessionalContext ? "Contexte professionnel détecté → Week-ends exclus (lundi-vendredi uniquement)" : ""}
${multipleDaysHint}
${jourHint}
${partenariatsHint}
${
  !hasMultipleDays && !hasMultipleNumericDates
    ? `RÈGLE ABSOLUE - DATE SPÉCIFIQUE:
- Proposer CETTE DATE UNIQUEMENT (${targetDate})
- Ajouter MAXIMUM 1-2 alternatives très proches (±1 jour) SEULEMENT si vraiment nécessaire`
    : ""
}
${
  parsed.isMealContext && !/partenariats/.test(userInput) && !isMealWithMultipleDays
    ? `
⚠️⚠️⚠️ CAS SPÉCIAL REPAS + DATE SPÉCIFIQUE ⚠️⚠️⚠️
Pour "${userInput}" :
→ OBLIGATOIRE : 1 DATE UNIQUEMENT (${targetDate})
→ OBLIGATOIRE : 1 CRÉNEAU UNIQUEMENT (12h30-13h30 pour déjeuner/midi, 19h00-20h00 pour dîner)
→ INTERDIT : Générer plusieurs créneaux (pas 2, pas 3, UNIQUEMENT 1)
→ INTERDIT : Générer plusieurs dates
Cette règle PRIME sur toutes les autres !`
    : ""
}

Dates autorisées${hasMultipleDays || hasMultipleNumericDates ? " (OBLIGATOIRE de générer TOUTES ces dates)" : " (pour alternatives seulement si vraiment nécessaire ET pas repas)"}:
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}

⚠️ IMPORTANT : ${hasMultipleDays || hasMultipleNumericDates ? "Générer TOUTES les dates mentionnées, pas seulement une !" : "Si l'utilisateur demande une date spécifique, ne pas surcharger avec trop d'options !"}
${parsed.isMealContext && !/partenariats/.test(userInput) && !isMealWithMultipleDays ? `⚠️⚠️ CRITIQUE : Pour un repas, générer EXACTEMENT 1 créneau, pas plusieurs !` : ""}
`;
    }

    // Cas 3: Mois explicite
    if (parsed.type === "month" && parsed.month !== undefined) {
      const monthName = monthNames[parsed.month];
      const periodHint = parsed.period
        ? `Période: ${parsed.period === "end" ? "fin" : "début"} ${monthName}\n`
        : `Mois: ${monthName}\n`;
      return `

⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - MOIS EXPLICITE DÉTECTÉ ⚠️⚠️⚠️

${periodHint}
Dates autorisées (filtrer pour ne garder que les dates en ${monthName}${parsed.period === "end" ? " (jour >= 15)" : parsed.period === "start" ? " (jour <= 15)" : ""}):
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}

⚠️ CRITIQUE : Ne proposer QUE des dates en ${monthName}${parsed.period === "end" ? " (fin du mois)" : parsed.period === "start" ? " (début du mois)" : ""} !
`;
    }

    // Cas 4: Période relative ou vague
    const expectedDatesCount =
      typeof parsed.expectedDatesCount === "string"
        ? parsed.expectedDatesCount
        : parsed.expectedDatesCount.toString();
    return `

⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - PÉRIODE DÉTECTÉE ⚠️⚠️⚠️

Type: ${parsed.type}
${parsed.chronoParsedText ? `Expression temporelle: "${parsed.chronoParsedText}"` : ""}
${parsed.isProfessionalContext ? "Contexte professionnel détecté → Week-ends exclus (lundi-vendredi uniquement)" : ""}

RÈGLE ABSOLUE - PÉRIODE:
- Proposer ${expectedDatesCount} dates INDIVIDUELLES parmi la liste ci-dessous
- Répartir uniformément sur la période

Dates autorisées:
${parsed.allowedDates.map((d: string) => `  - ${d}`).join("\n")}
`;
  }

  private buildContextualHints(userInput: string): string {
    const lowerInput = userInput.toLowerCase();
    const hints: string[] = [];

    // Détection des contextes spécifiques (par ordre de priorité)

    // Visite musée/exposition
    if (/visite.*musée|musée.*visite|visite.*exposition|exposition.*visite/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Visite au musée/exposition → Générer 2-3 créneaux entre 14h00 et 17h00 (durée 2-3h)",
      );
    }

    // Footing/course/jogging
    if (/footing|course|jogging|running/.test(lowerInput)) {
      hints.push("CONTEXTE: Activité sportive → Générer 1-2 créneaux courts (1h max)");
      if (/vendredi.*soir|soir.*vendredi/.test(lowerInput)) {
        hints.push("  - Vendredi soir: 18h00-19h00");
      }
      if (/samedi.*matin|matin.*samedi/.test(lowerInput)) {
        hints.push("  - Samedi matin: 08h00-09h00");
      }
    }

    // Visio/visioconférence
    if (/visio|visioconférence|visioconference/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Visioconférence → Générer maximum 2 créneaux entre 18h00 et 20h00 (durée 1h)",
      );
    }

    // Brunch
    if (/brunch/.test(lowerInput)) {
      hints.push("CONTEXTE: Brunch → Générer créneaux entre 11h30 et 13h00 (durée 90min)");
    }

    // Déjeuner/partenariats
    if (/déjeuner|dejeuner|partenariats/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Déjeuner/partenariats → Générer 2-3 créneaux entre 11h30 et 13h30 (durée 1h)",
      );
    }

    // Escape game
    if (/escape.*game|escape game/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Escape game → Générer créneaux en soirée entre 19h00 et 21h00 (durée 2h)",
      );
    }

    // Séance photo
    if (
      /photo|séance photo/.test(lowerInput) &&
      /dimanche/.test(lowerInput) &&
      /matin/.test(lowerInput)
    ) {
      hints.push(
        "CONTEXTE: Séance photo dimanche matin → Générer 2-3 créneaux entre 09h00 et 12h00 (durée 3h)",
      );
    }

    // Répétition chorale
    if (
      /chorale|répétition/.test(lowerInput) &&
      /samedi/.test(lowerInput) &&
      /dimanche/.test(lowerInput)
    ) {
      hints.push(
        "CONTEXTE: Répétition chorale → Générer 1 créneau samedi matin (10h-12h) et 1 créneau dimanche après-midi (15h-17h)",
      );
    }

    // Réunion parents-profs
    if (/parents?-?profs?/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Réunion parents-profs → Générer 2 créneaux en début de soirée (18h30-20h00, durée 90min)",
      );
    }

    // Aide aux devoirs
    if (/aide aux devoirs|devoirs/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Aide aux devoirs → Générer créneaux mercredi après-midi (17h-18h) ou vendredi soir (18h-19h)",
      );
    }

    // Distribution flyers
    if (/distribution.*flyers|flyers/.test(lowerInput)) {
      hints.push(
        "CONTEXTE: Distribution de flyers → Générer 2 créneaux (samedi matin 9h-11h + dimanche après-midi 14h-16h)",
      );
    }

    // Améliorer les plages horaires génériques
    if (/matin/.test(lowerInput) && !/brunch/.test(lowerInput)) {
      hints.push("CONTEXTE: Matin → Générer créneaux entre 09h00 et 12h00 (pas 8h-11h)");
    }

    if (/après-midi|apres-midi/.test(lowerInput)) {
      hints.push("CONTEXTE: Après-midi → Générer créneaux entre 14h00 et 17h00 (pas 15h-17h)");
    }

    // Soirée générique
    if (/soir|soirée|soiree/.test(lowerInput) && !/escape/.test(lowerInput)) {
      hints.push("CONTEXTE: Soirée → Générer créneaux entre 18h30 et 21h00");
    }

    return hints.length > 0
      ? `\n⚠️⚠️⚠️ HINTS CONTEXTUELS DÉTECTÉS ⚠️⚠️⚠️\n${hints.join("\n")}\n`
      : "";
  }

  private buildPollGenerationPrompt(userInput: string, dateHints: string = ""): string {
    const contextualHints = this.buildContextualHints(userInput);
    const today = new Date();

    // Détecter contexte repas + date spécifique
    const isMealContext = /(déjeuner|dîner|brunch|lunch|repas)/i.test(userInput);
    const isSpecificDateInInput =
      /(demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)/i.test(
        userInput,
      );

    return `Tu es l'IA DooDates, expert en planification temporelle.
${dateHints}
${contextualHints}

Demande: "${userInput}"

RÈGLES FONDAMENTALES:
1. Dates futures uniquement (>= ${getTodayLocal()})
2. Respecter les jours demandés (si "lundi" → uniquement lundis)
3. Calculer à partir d'aujourd'hui (${getTodayLocal()})

PRIORITÉ #1 - SPÉCIFICITÉ DE LA DEMANDE:
- Date très spécifique ("demain", "lundi", "vendredi 15") → 1 DATE PRINCIPALE, max 1-2 alternatives
- Période vague ("cette semaine", "semaine prochaine") → 5-7 dates

PRIORITÉ #2 - CRÉNEAUX HORAIRES:
Générer timeSlots UNIQUEMENT si mentionné :
- Heures précises ("9h", "14h30")
- Plages horaires ("matin", "après-midi", "soir", "midi")
- Mots-clés repas ("déjeuner", "dîner", "brunch")
- Durées ("1h", "30 minutes")

⚠️⚠️⚠️ RÈGLE ABSOLUE - REPAS + DATE SPÉCIFIQUE ⚠️⚠️⚠️
Si la demande contient un mot-clé de REPAS ("déjeuner", "dîner", "brunch", "lunch", "repas")
ET une DATE SPÉCIFIQUE ("demain", "lundi", "vendredi", "dans X jours") :
→ OBLIGATOIRE : 1 DATE UNIQUEMENT (la date spécifique)
→ OBLIGATOIRE : 1 CRÉNEAU UNIQUEMENT autour de l'heure du repas
→ INTERDIT : Générer plusieurs créneaux
→ INTERDIT : Générer plusieurs dates

Cette règle PRIME sur toutes les autres règles de génération de créneaux !

Exemples OBLIGATOIRES :
- "déjeuner demain midi" → 1 date (demain), 1 créneau (12h30-13h30) - PAS 3 créneaux !
- "dîner vendredi soir" → 1 date (vendredi), 1 créneau (19h00-20h00) - PAS plusieurs créneaux !
- "brunch dimanche" → 1 date (dimanche), 1 créneau (10h00-11h00) - PAS plusieurs créneaux !
- "repas lundi midi" → 1 date (lundi), 1 créneau (12h30-13h30) - PAS plusieurs créneaux !

CRÉNEAUX PAR TYPE D'ÉVÉNEMENT:
⚠️ IMPORTANT : Si REPAS + DATE SPÉCIFIQUE → Voir règle absolue ci-dessus (1 créneau uniquement)

Pour les autres cas :
- Déjeuners ("déjeuner", "midi") : 1 créneau (12h30-13h30) par date
- Dîners : 1 créneau (19h00-20h00) par date
- Matin : Plusieurs créneaux (8h-12h, toutes les 30min) - SEULEMENT si pas repas + date spécifique
- Après-midi : Plusieurs créneaux (14h-17h, toutes les 30min) - SEULEMENT si pas repas + date spécifique
- Soir : Plusieurs créneaux (18h30-21h00) - SEULEMENT si pas repas + date spécifique

EXPRESSIONS TEMPORELLES:
- "cette semaine" = semaine actuelle (du ${getTodayLocal()} à 7 jours)
- "semaine prochaine" = semaine suivante
- "demain" = ${formatDateLocal(new Date(today.getTime() + 24 * 60 * 60 * 1000))}
- "dans X jours" = ${getTodayLocal()} + X jours
- "dans X semaines" = ${getTodayLocal()} + (X × 7) jours

EXEMPLES:
- "réunion lundi ou mardi" → type: "date", timeSlots: []
- "réunion lundi matin" → 1 date (lundi), plusieurs créneaux matin
- "déjeuner demain midi" → 1 date (demain), 1 créneau (12h00-13h00)
- "disponibilité cette semaine" → 5-7 dates, pas de créneaux

FORMAT JSON:
{
  "title": "Titre",
  "description": "Description optionnelle",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "dates": ["YYYY-MM-DD"],
      "description": "Description"
    }
  ],
  "type": "date" ou "datetime"
}

VÉRIFICATIONS AVANT RÉPONSE:
1. Toutes dates >= ${getTodayLocal()}
2. Dates correspondent aux jours demandés
3. ⚠️ CRITIQUE : Si repas + date spécifique → VÉRIFIER qu'il n'y a qu'1 DATE et qu'1 CRÉNEAU (pas 3 créneaux !)
4. Si date spécifique (sans repas) → max 1-2 dates
5. Si période vague → 5-7 dates

⚠️⚠️⚠️ RAPPEL FINAL - REPAS + DATE SPÉCIFIQUE ⚠️⚠️⚠️
Si tu détectes "repas" + "date spécifique" dans la demande :
→ GÉNÉRER EXACTEMENT 1 DATE et 1 CRÉNEAU
→ NE PAS générer 2 ou 3 créneaux même si "midi" est mentionné
→ Exemple "déjeuner demain midi" = 1 date, 1 créneau (12h30-13h30) - PAS 3 créneaux différents !

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire.`;
  }

  private buildChatPrompt(userInput: string, context?: string): string {
    return `Tu es l'assistant IA de DooDates, une application de création de sondages pour planifier des rendez-vous.

${context ? `Contexte : ${context}` : ""}

Utilisateur : ${userInput}

Réponds de manière utile et amicale. Tu peux :
- Aider à créer des sondages
- Expliquer les fonctionnalités
- Donner des conseils sur la planification
- Répondre aux questions sur l'application

Reste concis et pratique. Réponds en français.`;
  }

  /**
   * Détecte si l'input est un questionnaire structuré (markdown parsé) ou une simple demande
   */
  private isStructuredQuestionnaire(input: string): boolean {
    // Détecter le nouveau format uniforme
    return (
      input.startsWith("TITRE:") &&
      input.includes("QUESTION") &&
      input.includes("[") &&
      (input.includes("- ") || input.includes("(réponse libre)"))
    );
  }

  /**
   * Prompt pour COPIER un questionnaire existant (markdown parsé)
   */
  private buildFormPollPromptCopy(userInput: string): string {
    return `Tu es l'IA DooDates, expert en conversion de questionnaires.

OBJECTIF: Convertir EXACTEMENT ce questionnaire au format JSON sans AUCUNE modification.

QUESTIONNAIRE À COPIER:
${userInput}

FORMAT DU QUESTIONNAIRE:
- Ligne "TITRE:" suivi du titre exact
- "QUESTION X [type, required]:" suivi du texte de la question
- Options listées avec "- " (une par ligne)
- "(réponse libre)" pour les questions texte
- Section "RÈGLES CONDITIONNELLES:" si présente (optionnelle)

RÈGLES ABSOLUES (MODE COPIE 100% FIDÈLE):
1. ✅ COPIE MOT-À-MOT - Chaque texte doit être copié caractère par caractère
2. ✅ AUCUNE REFORMULATION - Ne jamais paraphraser ou simplifier
3. ✅ TOUT COPIER - Parenthèses, chiffres, ponctuations inclus
4. ✅ ORDRE EXACT - Respecter l'ordre des questions et options

EXEMPLES DE COPIE EXACTE:
✅ "Je suis en file d'attente (pas encore démarré)" → COPIE TELLE QUELLE
✅ "Très utile (5/5)" → COPIE TELLE QUELLE
✅ "Moins de 3 mois" → COPIE TELLE QUELLE

INTERDIT (exemples de ce qu'il NE FAUT PAS faire):
❌ "Je suis en file d'attente (pas encore démarré)" → "En attente"
❌ "Très utile (5/5)" → "Très positive"
❌ "Moins de 3 mois" → "0-3 mois"
❌ Supprimer des parenthèses
❌ Changer des mots
❌ Inverser l'ordre

FORMAT JSON ATTENDU:
{
  "title": "Titre exact copié tel quel",
  "questions": [
    {
      "title": "Question exacte copiée telle quelle",
      "type": "single" | "multiple" | "text" | "rating" | "nps" | "matrix" | "date",
      "required": true,
      "options": ["Option 1 exacte", "Option 2 exacte"],  // Pour single/multiple
      "maxChoices": X,  // si [max=X] dans le type (pour multiple)
      "ratingScale": 5 | 10,  // Pour rating (par défaut 5)
      "ratingStyle": "numbers" | "stars" | "emojis",  // Pour rating (par défaut numbers)
      "ratingMinLabel": "Label min",  // Pour rating (optionnel)
      "ratingMaxLabel": "Label max",  // Pour rating (optionnel)
      "validationType": "email" | "phone" | "url" | "number" | "date",  // Pour text (optionnel)
      "selectedDates": ["${getTodayLocal()}", "${formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))}"],  // Pour date (optionnel - dates au format YYYY-MM-DD, année ${new Date().getFullYear()})
      "timeSlotsByDate": {  // Pour date (optionnel - créneaux horaires par date)
        "${getTodayLocal()}": [{"hour": 10, "minute": 0, "enabled": true}, {"hour": 14, "minute": 0, "enabled": true}]
      },
      "timeGranularity": "15min" | "30min" | "1h",  // Pour date (optionnel - par défaut "30min")
      "allowMaybeVotes": true | false,  // Pour date (optionnel - par défaut false)
      "allowAnonymousVotes": true | false  // Pour date (optionnel - par défaut false)
    }
  ],
  "conditionalRules": [  // OPTIONNEL - seulement si règles détectées
    {
      "questionId": "question-4",  // ID de la question à masquer/afficher
      "dependsOn": "question-3",   // ID de la question dont elle dépend
      "showIf": {
        "operator": "equals",
        "value": "Non"  // Valeur qui déclenche l'affichage
      }
    }
  ],
  "type": "form"
}

IMPORTANT pour les conditionalRules:
- Les IDs des questions doivent correspondre à l'index dans le tableau questions
- Exemple: Question 1 → "question-1", Question 4 → "question-4"
- Si pas de règles conditionnelles, ne pas inclure le champ "conditionalRules"

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
  }

  /**
   * Prompt pour GÉNÉRER un questionnaire créatif (demande simple)
   */
  private buildFormPollPromptGenerate(userInput: string): string {
    return `Tu es l'IA DooDates, expert en création de questionnaires et formulaires.

OBJECTIF: Créer un questionnaire pertinent à partir de la demande utilisateur.

Demande: "${userInput}"

RÈGLES DE GÉNÉRATION (MODE CRÉATIF):
1. **TITRE** - Clair et descriptif (max 100 caractères)
2. **QUESTIONS** - 3 à 10 questions pertinentes et logiques
3. **TYPES DE QUESTIONS**:
   - "single" : Choix unique (radio buttons) - pour sélectionner UNE option
   - "multiple" : Choix multiples (checkboxes) - pour sélectionner PLUSIEURS options
   - "text" : Réponse libre - pour commentaires ou informations textuelles
   - "rating" : Échelle de notation (1-5 ou 1-10) - pour évaluer satisfaction/qualité
   - "nps" : Net Promoter Score (0-10) - pour mesurer probabilité de recommandation
   - "matrix" : Matrice (lignes × colonnes) - pour évaluer plusieurs aspects sur une même échelle
   - "date" : Sélection de dates et horaires - pour planifier réunions, événements, rendez-vous
4. **OPTIONS** - Pour single/multiple : 2 à 8 options claires par question
5. **COHÉRENCE** - Questions logiques, ordonnées et sans redondance
6. **PERTINENCE** - Adapter précisément au contexte de la demande

EXEMPLES DE QUESTIONS PAR TYPE:

**Single choice (choix unique):**
{
  "title": "Quel est votre niveau d'expérience ?",
  "type": "single",
  "required": true,
  "options": ["Débutant", "Intermédiaire", "Avancé", "Expert"]
}

**Multiple choice (choix multiples):**
{
  "title": "Quels langages maîtrisez-vous ? (3 max)",
  "type": "multiple",
  "required": false,
  "options": ["JavaScript", "Python", "Java", "C++", "Go", "Rust"],
  "maxChoices": 3
}

**Text (réponse libre):**
{
  "title": "Avez-vous des suggestions pour améliorer le service ?",
  "type": "text",
  "required": false,
  "placeholder": "Vos commentaires ici...",
  "maxLength": 500
}

**Rating (échelle de notation):**
{
  "title": "Comment évaluez-vous la qualité du service ?",
  "type": "rating",
  "required": true,
  "ratingScale": 5,  // 5 ou 10 (par défaut 5)
  "ratingStyle": "stars",  // "numbers", "stars" ou "emojis" (par défaut "numbers")
  "ratingMinLabel": "Très mauvais",  // Optionnel
  "ratingMaxLabel": "Excellent"  // Optionnel
}

**NPS (Net Promoter Score):**
{
  "title": "Recommanderiez-vous notre service à un ami ?",
  "type": "nps",
  "required": true
  // Pas de configuration : échelle fixe 0-10
}

**Text avec validation:**
{
  "title": "Quelle est votre adresse email ?",
  "type": "text",
  "required": true,
  "validationType": "email",  // "email", "phone", "url", "number" ou "date"
  "placeholder": "exemple@email.com"
}

**Date (sélection de dates et horaires):**
{
  "title": "Quelles dates vous conviennent pour la réunion ?",
  "type": "date",
  "required": true,
      "selectedDates": ["${getTodayLocal()}", "${formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))}", "${formatDateLocal(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))}"],  // Dates au format YYYY-MM-DD (année ${new Date().getFullYear()})
      "timeSlotsByDate": {  // Créneaux horaires par date (optionnel)
        "${getTodayLocal()}": [
      {"hour": 10, "minute": 0, "enabled": true},
      {"hour": 14, "minute": 0, "enabled": true},
      {"hour": 16, "minute": 0, "enabled": true}
    ],
        "${formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))}": [
          {"hour": 9, "minute": 0, "enabled": true},
          {"hour": 13, "minute": 0, "enabled": true}
        ]
  },
  "timeGranularity": "30min",  // "15min", "30min" ou "1h" (par défaut "30min")
  "allowMaybeVotes": false,  // Permettre les votes "peut-être" (optionnel, par défaut false)
  "allowAnonymousVotes": false  // Permettre les votes anonymes (optionnel, par défaut false)
}

IMPORTANT pour les questions de type "date":
- Si la demande mentionne des dates/horaires/réunions/événements, utiliser le type "date"
- Toujours inclure au moins 2-3 dates dans "selectedDates"
- Les dates doivent être au format ISO (YYYY-MM-DD)
- ⚠️ CRITIQUE : Utiliser UNIQUEMENT l'année ${new Date().getFullYear()} (année actuelle)
- ⚠️ CRITIQUE : Les dates doivent être futures ou aujourd'hui (>= ${getTodayLocal()})
- Les horaires sont optionnels mais recommandés pour les réunions
- Si pas d'horaires spécifiques, omettre "timeSlotsByDate" (l'utilisateur pourra les configurer manuellement)

FORMAT JSON REQUIS:
{
  "title": "Titre du questionnaire",
  "description": "Description optionnelle (1-2 phrases)",
  "questions": [
    {
      "title": "Texte de la question",
      "type": "single" | "multiple" | "text" | "rating" | "nps" | "matrix" | "date",
      "required": true | false,
      "options": ["Option 1", "Option 2", "..."], // SEULEMENT pour single/multiple
      "maxChoices": 3, // SEULEMENT pour multiple (optionnel)
      "placeholder": "Texte d'aide", // SEULEMENT pour text (optionnel)
      "maxLength": 500, // SEULEMENT pour text (optionnel)
      "validationType": "email" | "phone" | "url" | "number" | "date", // SEULEMENT pour text (optionnel)
      "ratingScale": 5 | 10, // SEULEMENT pour rating (par défaut 5)
      "ratingStyle": "numbers" | "stars" | "emojis", // SEULEMENT pour rating (par défaut "numbers")
      "ratingMinLabel": "Label min", // SEULEMENT pour rating (optionnel)
      "ratingMaxLabel": "Label max", // SEULEMENT pour rating (optionnel)
      "selectedDates": ["${getTodayLocal()}", "${formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))}"], // SEULEMENT pour date (requis - dates au format YYYY-MM-DD, utiliser l'année ${new Date().getFullYear()})
      "timeSlotsByDate": {  // SEULEMENT pour date (optionnel - créneaux horaires par date)
        "${getTodayLocal()}": [{"hour": 10, "minute": 0, "enabled": true}]
      },
      "timeGranularity": "15min" | "30min" | "1h", // SEULEMENT pour date (optionnel - par défaut "30min")
      "allowMaybeVotes": true | false, // SEULEMENT pour date (optionnel - par défaut false)
      "allowAnonymousVotes": true | false // SEULEMENT pour date (optionnel - par défaut false)
    }
  ],
  "type": "form"
}

BONNES PRATIQUES:
- Questions courtes et claires (max 120 caractères)
- Options mutuellement exclusives (pas de chevauchement)
- Ordre logique : questions générales → spécifiques
- Équilibrer questions obligatoires/optionnelles
- Éviter les questions biaisées ou suggestives
- Au moins 1 question obligatoire, maximum 70% obligatoires

AVANT DE RÉPONDRE:
1. Identifier le sujet principal et l'objectif du questionnaire
2. Générer 3-10 questions pertinentes et variées
3. Choisir le type approprié pour chaque question
4. Vérifier la cohérence et l'absence de redondance
5. S'assurer que les options sont claires et complètes
6. Valider que le questionnaire répond à la demande

IMPORTANT:
- Si la demande est vague, générer un questionnaire généraliste cohérent
- Privilégier la qualité à la quantité (mieux 5 bonnes questions que 10 médiocres)
- Toujours inclure au moins 1 question "text" pour les commentaires libres

Réponds SEULEMENT avec le JSON, aucun texte supplémentaire avant ou après.`;
  }

  private parseGeminiResponse(text: string): DatePollSuggestion | null {
    try {
      // Nettoyer le texte pour extraire le JSON
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        // Parsing JSON response
        const parsed = JSON.parse(jsonStr);

        // Valider la structure et les dates
        if (parsed.title && parsed.dates && Array.isArray(parsed.dates)) {
          const todayStr = getTodayLocal();

          // PROTECTION CRITIQUE : Filtrer strictement les dates passées
          const validDates = parsed.dates.filter((dateStr: string) => {
            const isValidDate = dateStr >= todayStr;
            if (!isValidDate) {
              logger.debug("Past date filtered out", "general", { date: dateStr, today: todayStr });
            }
            return isValidDate;
          });

          // Si toutes les dates ont été filtrées, retourner null
          if (validDates.length === 0) {
            const dateError = ErrorFactory.validation(
              "All dates were in the past, suggestion rejected",
              "Toutes les dates proposées sont dans le passé",
            );

            logError(dateError, {
              component: "GeminiService",
              operation: "parseGeminiResponse",
            });

            return null;
          }

          // Validated future dates successfully

          return {
            title: parsed.title,
            description: parsed.description,
            dates: validDates,
            timeSlots: parsed.timeSlots || [],
            type: parsed.type || "date",
            participants: parsed.participants || [],
          };
        }
      }

      return null;
    } catch (error) {
      const parseError = handleError(
        error,
        {
          component: "GeminiService",
          operation: "parseGeminiResponse",
        },
        "Erreur lors du parsing de la réponse Gemini",
      );

      logError(parseError, {
        component: "GeminiService",
        operation: "parseGeminiResponse",
      });

      return null;
    }
  }

  /**
   * Parse la réponse Gemini pour les Form Polls (questionnaires)
   * @param text Réponse brute de Gemini
   * @returns FormPollSuggestion validée ou null
   */
  private parseFormPollResponse(text: string): FormPollSuggestion | null {
    try {
      // Nettoyer le texte pour extraire le JSON
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validation structure Form Poll
        if (
          parsed.title &&
          parsed.questions &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length > 0 &&
          parsed.type === "form"
        ) {
          // Valider chaque question
          const validQuestions = parsed.questions.filter((q: FormQuestion) => {
            // Validation basique
            if (!q.title || !q.type) {
              return false;
            }

            // Vérifier que le type est valide
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
            if (!validTypes.includes(q.type)) {
              return false;
            }

            // Questions single/multiple DOIVENT avoir des options
            if (q.type === "single" || q.type === "multiple") {
              if (!Array.isArray(q.options) || q.options.length < 2) {
                logger.warn(
                  `Question "${q.title}" de type ${q.type} ignorée : options invalides`,
                  "api",
                );
                return false;
              }
            }

            // Questions de type "date" DOIVENT avoir des dates sélectionnées
            if (q.type === "date") {
              if (!Array.isArray(q.selectedDates) || q.selectedDates.length === 0) {
                logger.warn(
                  `Question "${q.title}" de type date ignorée : aucune date sélectionnée`,
                  "api",
                );
                return false;
              }
              // Valider le format des dates (YYYY-MM-DD)
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!q.selectedDates.every((date: string) => dateRegex.test(date))) {
                logger.warn(
                  `Question "${q.title}" de type date ignorée : format de dates invalide`,
                  "api",
                );
                return false;
              }
              // Valider et corriger les années des dates
              const currentYear = new Date().getFullYear();
              const hasInvalidYear = q.selectedDates.some((date: string) => {
                const year = parseInt(date.split("-")[0], 10);
                // Vérifier si l'année est dans le passé ou trop loin dans le futur (> currentYear + 1)
                return year < currentYear || year > currentYear + 1;
              });
              if (hasInvalidYear) {
                logger.warn(
                  `Question "${q.title}" de type date : dates avec année invalide détectées, correction automatique vers ${currentYear}`,
                  "api",
                );
                // Corriger automatiquement : remplacer l'année par l'année actuelle
                q.selectedDates = q.selectedDates.map((date: string) => {
                  const [year, month, day] = date.split("-");
                  const dateYear = parseInt(year, 10);
                  // Si l'année est dans le passé ou trop loin dans le futur, utiliser l'année actuelle
                  if (dateYear < currentYear || dateYear > currentYear + 1) {
                    return `${currentYear}-${month}-${day}`;
                  }
                  return date;
                });
                // Mettre à jour aussi timeSlotsByDate si présent
                if (q.timeSlotsByDate) {
                  const correctedTimeSlots: Record<string, unknown> = {};
                  Object.entries(q.timeSlotsByDate).forEach(([date, slots]) => {
                    const [year, month, day] = date.split("-");
                    const dateYear = parseInt(year, 10);
                    const correctedDate =
                      dateYear < currentYear || dateYear > currentYear + 1
                        ? `${currentYear}-${month}-${day}`
                        : date;
                    correctedTimeSlots[correctedDate] = slots;
                  });
                  q.timeSlotsByDate = correctedTimeSlots;
                }
              }
            }

            return true;
          });

          // Il faut au moins 1 question valide
          if (validQuestions.length === 0) {
            logError(
              ErrorFactory.validation(
                "No valid questions in form poll",
                "Aucune question valide dans le questionnaire",
              ),
              {
                component: "GeminiService",
                operation: "parseFormPollResponse",
              },
            );
            return null;
          }

          if (isDev()) {
            logger.info(`Form Poll parsed: ${validQuestions.length} valid questions`, "api");
          }

          const finalPoll: FormPollSuggestion = {
            title: parsed.title,
            description: parsed.description,
            questions: validQuestions.map((q: FormQuestion) => ({
              title: q.title,
              type: q.type,
              required: q.required !== false, // Par défaut true
              options: q.options,
              maxChoices: q.maxChoices,
              placeholder: q.placeholder,
              maxLength: q.maxLength,
              // Rating-specific fields
              ratingScale: q.ratingScale,
              ratingStyle: q.ratingStyle,
              ratingMinLabel: q.ratingMinLabel,
              ratingMaxLabel: q.ratingMaxLabel,
              // Matrix-specific fields
              matrixRows: q.matrixRows,
              matrixColumns: q.matrixColumns,
              matrixType: q.matrixType,
              matrixColumnsNumeric: q.matrixColumnsNumeric,
              // Text validation fields
              validationType: q.validationType,
              // Date-specific fields
              selectedDates: q.selectedDates,
              timeSlotsByDate: q.timeSlotsByDate,
              timeGranularity: q.timeGranularity,
              allowMaybeVotes: q.allowMaybeVotes,
              allowAnonymousVotes: q.allowAnonymousVotes,
            })),
            type: "form" as const,
            ...(parsed.conditionalRules && {
              conditionalRules: parsed.conditionalRules,
            }),
          };

          return finalPoll;
        }
      }

      return null;
    } catch (error) {
      logError(
        handleError(
          error,
          { component: "GeminiService", operation: "parseFormPollResponse" },
          "Erreur lors du parsing de la réponse Gemini pour FormPoll",
        ),
        { component: "GeminiService", operation: "parseFormPollResponse" },
      );
      return null;
    }
  }

  /**
   * Analyse temporelle avec techniques Counterfactual-Consistency
   */
  private analyzeTemporalInput(userInput: string) {
    const text = userInput.toLowerCase();
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // Détection des contraintes temporelles
    const constraints = {
      matin: text.includes("matin"),
      apresmidi: text.includes("après-midi") || text.includes("apres-midi"),
      soir: text.includes("soir") || text.includes("fin de journée"),
      weekend: text.includes("weekend") || text.includes("week-end"),
      semaine: text.includes("semaine") && !text.includes("weekend"),
      urgent: text.includes("urgent"),
    };

    // Vérifications counterfactual de base
    if (text.includes("lundi") && constraints.weekend) {
      conflicts.push('Contradiction: "lundi" demandé mais "weekend" aussi mentionné');
      suggestions.push("Clarifiez si vous voulez un lundi ou un weekend");
    }

    if (text.includes("matin") && text.includes("soir")) {
      suggestions.push("Précisez si vous voulez le matin OU le soir, ou toute la journée");
    }

    // Détection du type temporel
    let temporalType = "relative";
    if (text.includes("tous les") || text.includes("chaque")) {
      temporalType = "recurring";
    } else if (
      constraints.matin ||
      constraints.apresmidi ||
      constraints.soir ||
      /\d{1,2}h/.test(text)
    ) {
      temporalType = "datetime";
    } else if (text.includes("cette semaine") || text.includes("semaine prochaine")) {
      temporalType = "date";
    }

    // Calcul de confiance
    let confidence = 0.7;
    if (temporalType !== "relative") confidence += 0.1;
    if (conflicts.length === 0) confidence += 0.1;
    confidence = Math.min(1, confidence - conflicts.length * 0.2);

    return {
      conflicts,
      suggestions,
      constraints,
      temporalType,
      confidence,
    };
  }

  /**
   * Génère des questions counterfactual spécifiques au contexte
   */
  private generateCounterfactualQuestions(userInput: string): string[] {
    const questions: string[] = [];
    const text = userInput.toLowerCase();

    // Questions sur la cohérence des jours
    if (text.includes("lundi") || text.includes("mardi") || text.includes("mercredi")) {
      questions.push(
        "Si on changeait le jour de la semaine demandé, le contexte resterait-il cohérent ?",
      );
    }

    // Questions sur les relations temporelles
    if (text.includes("avant") || text.includes("après")) {
      questions.push('Si on inversait "avant" et "après", la phrase aurait-elle encore du sens ?');
    }

    // Questions sur les périodes
    if (text.includes("matin") || text.includes("soir")) {
      questions.push('Si on changeait "matin" par "soir", les horaires seraient-ils cohérents ?');
    }

    // Questions sur la récurrence
    if (text.includes("tous les") || text.includes("chaque")) {
      questions.push('Si on supprimait "tous les" ou "chaque", le sens changerait-il ?');
    }

    // Questions générales de cohérence
    questions.push("Chaque date générée correspond-elle exactement au jour demandé ?");
    questions.push("Les horaires respectent-ils les contraintes temporelles mentionnées ?");

    return questions;
  }

  async testConnection(): Promise<boolean> {
    try {
      return await secureGeminiService.testConnection();
    } catch (error) {
      logger.error("Erreur lors du test de connexion", "api", error);
      return false;
    }
  }
}

export const geminiService = GeminiService.getInstance();
