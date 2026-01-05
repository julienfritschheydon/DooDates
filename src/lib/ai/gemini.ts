import CalendarQuery from "../calendar-generator";
import { handleError, ErrorFactory, logError } from "../error-handling";
import { logger } from "../logger";
import { formatDateLocal, getTodayLocal } from "../date-utils";
// ARCHIVÉ 2025-12-05: Post-processor désactivé après test A/B (score +7.8% sans)
// import { postProcessSuggestion } from "@/services/GeminiSuggestionPostProcessor";
import { secureGeminiService } from "@/services/SecureGeminiService";
import type { GeminiAttachedFile } from "@/services/FileAttachmentService";
import { getEnv, isDev } from "../env";
// ARCHIVÉ 2025-12-06: ParsedTemporalInput plus utilisé après simplification
import type { ParsedTemporalInput } from "../temporalParser";
import { buildDirectPrompt } from "./prompts/pollPrompts";
// ARCHIVÉ 2025-12-06: buildPollGenerationPrompt plus utilisé après simplification
// import { buildPollGenerationPrompt, buildDirectPrompt } from "./prompts/pollPrompts";
import { GeminiFlowLogger, isGeminiDebugEnabled } from "./geminiDebugLogger";

import { datePollService, type DatePollSuggestion } from "./products/date/DatePollService";
import { formPollService, type FormPollSuggestion } from "./products/form/FormPollService";

export type PollSuggestion = DatePollSuggestion | FormPollSuggestion;

// Toujours utiliser l'Edge Function sécurisée
const geminiBackend = secureGeminiService;

logger.info("🟢 Mode Edge Function activé (SecureGeminiService)", "api");

// Constantes pour la gestion des quotas
const RATE_LIMIT: { REQUESTS_PER_SECOND: number; REQUESTS_PER_DAY: number } = {
  REQUESTS_PER_SECOND: 2,
  REQUESTS_PER_DAY: 960, // Quota pour le chat
};

export interface GeminiResponse {
  success: boolean;
  data?: PollSuggestion;
  message: string;
  error?: string;
  rawText?: string; // Réponse brute avant parsing pour debug/comparaison avec Google Studio
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

  /**
   * Parse un questionnaire markdown et extrait la structure
   */

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

    // ⚠️ IMPORTANT : "sondage" = TOUJOURS Date Poll (tous les prompts clients avec "sondage" sont des sondages de dates)
    const hasSondage = inputLower.includes("sondage");

    // Si "sondage" est présent → TOUJOURS Date Poll (priorité absolue)
    if (hasSondage) {
      return "date";
    }

    const totalFormScore = strongFormScore + formScore;

    if (isDev()) {
      logger.info(
        `Poll type detection: strongFormScore=${strongFormScore}, formScore=${formScore}, totalFormScore=${totalFormScore}, dateScore=${dateScore}, hasSondage=${hasSondage}`,
        "api",
      );
    }

    // Si des mots-clés explicites de formulaire sont présents, priorité au form
    if (strongFormScore > 0) {
      return "form";
    }

    // Sinon, comparer les scores totaux
    if (totalFormScore > dateScore) {
      return "form";
    }

    // Sinon → Date Poll (défaut pour backward compatibility)
    return "date";
  }

  async generatePollFromText(
    userInput: string,
    pollTypeOverride?: "date" | "form",
    attachedFile?: GeminiAttachedFile,
  ): Promise<GeminiResponse> {
    const requestId = crypto.randomUUID();

    // ÉTAPE 1: Log de la question utilisateur
    if (isGeminiDebugEnabled()) {
      GeminiFlowLogger.logUserQuestion(requestId, userInput);
    }

    if (isDev()) {
      logger.info("🟡 GeminiService.generatePollFromText appelé", "api", {
        requestId,
        userInputLength: userInput?.length || 0,
        userInputPreview: userInput?.substring(0, 50) || "",
      });
    }

    try {
      // Si pollTypeOverride est fourni, l'utiliser directement (produits séparés dans l'UI)
      // Sinon, détecter automatiquement (compatibilité legacy)
      let pollType: "date" | "form";
      let processedInput = userInput;

      if (pollTypeOverride) {
        pollType = pollTypeOverride;
        if (isDev()) {
          logger.info("📋 Type imposé depuis l'UI", "api", { requestId, pollType });
        }
      } else {
        // Détection automatique (legacy - pour compatibilité)
        const isMarkdown = formPollService.isMarkdownQuestionnaire(userInput);

        if (isDev()) {
          logger.info("📋 Détection automatique du type", "api", { requestId, isMarkdown });
        }

        if (isMarkdown) {
          // Parser le markdown et convertir en prompt structuré
          const parsedPrompt = formPollService.parseMarkdownQuestionnaire(userInput);
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
      }

      // ÉTAPE 2: Log du traitement du code
      if (isGeminiDebugEnabled()) {
        GeminiFlowLogger.logCodeProcessing(requestId, {
          pollType,
          pollTypeSource: pollTypeOverride ? "UI (override)" : "auto-detection",
          processedInput,
          markdownDetected: formPollService.isMarkdownQuestionnaire(userInput),
        });
      }

      if (isDev()) {
        logger.info(
          `Generating ${pollType === "form" ? "Form Poll" : "Date Poll"} from user input`,
          "api",
        );
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // SIMPLIFICATION 2025-12-06: Mode Direct activé par défaut
      // Benchmark: Direct 97.5% précision, 38% plus rapide que le pipeline complexe
      // L'UX permet de demander des modifications → pas besoin de sur-ingénierie
      // ═══════════════════════════════════════════════════════════════════════════

      /* ANCIEN CODE ARCHIVÉ - Pipeline complexe avec pré-processing temporel
      // MODE DIRECT : Bypass le pré-processing temporel pour test A/B
      // Activer avec : GEMINI_DIRECT_MODE=true
      const isDirectMode =
        (typeof process !== "undefined" && process.env?.GEMINI_DIRECT_MODE === "true") ||
        (typeof localStorage !== "undefined" && localStorage.getItem("GEMINI_DIRECT_MODE") === "true");

      // PRE-PARSING TEMPOREL avec le nouveau parser robuste (seulement pour Date Polls)
      let dateHints = "";
      let allowedDates: string[] | undefined;
      let parsedTemporal: ParsedTemporalInput | undefined;

      if (pollType === "date" && !isDirectMode) {
        try {
          // Utiliser le nouveau parser temporel robuste
          const { parseTemporalInput } = await import("../temporalParser");
          const { validateParsedInput, autoFixParsedInput } = await import("../temporalValidator");

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
          dateHints = datePollService.buildDateHintsFromParsed(fixedParsed, userInput);

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
      } else if (isDirectMode) {
        logger.info("🔴 MODE DIRECT ACTIVÉ - Bypass du pré-processing temporel", "api");
      }
      FIN ANCIEN CODE ARCHIVÉ */

      // Router vers le bon prompt selon le type
      let prompt: string;
      if (pollType === "form") {
        // Détecter si c'est un questionnaire structuré (markdown parsé) ou une simple demande
        const isStructured = formPollService.isStructuredQuestionnaire(processedInput);
        prompt = isStructured
          ? formPollService.buildFormPollPromptCopy(processedInput)
          : formPollService.buildFormPollPromptGenerate(processedInput);

        if (isDev()) {
          logger.info(
            `Form Poll mode: ${isStructured ? "COPY (markdown parsé)" : "GENERATE (demande simple)"}`,
            "api",
          );
        }
      } else {
        // NOUVEAU: Toujours utiliser le prompt direct simplifié
        // Benchmark 2025-12-06: 97.5% précision, 38% plus rapide
        prompt = buildDirectPrompt(processedInput);

        if (isDev()) {
          logger.info("🔵 Mode DIRECT - Prompt simplifié sans pré-processing", "api");
        }
      }

      // ÉTAPE 4: Log du prompt envoyé
      if (isGeminiDebugEnabled()) {
        GeminiFlowLogger.logPromptSent(requestId, {
          prompt,
          dateHints: "",
          promptLength: prompt?.length || 0,
          pollType,
        });
      }

      // Appeler Gemini via backend configuré (direct ou Edge Function)
      if (isDev()) {
        logger.info("🔵 Appel geminiBackend.generateContent", "api", {
          requestId,
          mode: "EDGE_FUNCTION",
          hasUserInput: !!userInput,
          hasPrompt: !!prompt,
          promptLength: prompt?.length || 0,
        });
        // Log du prompt complet pour debug (uniquement en dev)
        logger.debug("📝 Prompt complet envoyé à Gemini", "api", {
          requestId,
          prompt: prompt,
        });
      }
      const startTime = Date.now();
      const secureResponse = await geminiBackend.generateContent(userInput, prompt, attachedFile);
      const responseTime = Date.now() - startTime;

      // ÉTAPE 5: Log de la réponse brute
      if (isGeminiDebugEnabled()) {
        GeminiFlowLogger.logGeminiResponse(requestId, {
          success: secureResponse.success,
          rawText: secureResponse.data || "",
          responseTime,
          error: secureResponse.error,
        });
      }

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
          logger.error("CONFIG_ERROR détectée", "api", {
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
            mode: "EDGE_FUNCTION",
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
            mode: "EDGE_FUNCTION",
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
      // Note: parseGeminiResponse filtre les dates passées - on capture l'avant/après pour debug
      const rawParsedData = this.extractJsonFromText(text);
      const pollData =
        pollType === "form"
          ? formPollService.parseFormPollResponse(text)
          : this.parseGeminiResponse(text);

      // ÉTAPE 6: Log du traitement de la réponse
      if (isGeminiDebugEnabled()) {
        const rawDates = (rawParsedData?.dates as string[] | undefined) || [];
        const rawTimeSlots = (rawParsedData?.timeSlots as unknown[] | undefined) || [];
        const filteredDates = (pollData as DatePollSuggestion)?.dates || [];
        const filteredTimeSlots = (pollData as DatePollSuggestion)?.timeSlots || [];

        GeminiFlowLogger.logResponseProcessing(requestId, {
          jsonExtracted: !!rawParsedData,
          parsedDates: rawDates,
          filteredDates: filteredDates,
          datesRemoved: rawDates.filter((d: string) => !filteredDates.includes(d)),
          parsedTimeSlots: rawTimeSlots,
          filteredTimeSlots: filteredTimeSlots,
          timeSlotsRemoved: rawTimeSlots.length - filteredTimeSlots.length,
          parseErrors: pollData ? [] : ["Échec du parsing JSON"],
        });
      }

      if (pollData) {
        // ARCHIVÉ 2025-12-05: Post-processor désactivé après test A/B (score +7.8% sans)
        // Gemini 2.0 avec température 1 produit de meilleurs résultats sans post-processing
        // Voir: Docs/Post-Processing-Comparison-Report.md
        const processedPollData = pollData;
        /* ANCIEN CODE ARCHIVÉ:
        const usePostProcessing = getEnv("VITE_DISABLE_POST_PROCESSING") !== "true";
        const processedPollData =
          pollType === "date" && usePostProcessing
            ? postProcessSuggestion(pollData as DatePollSuggestion, {
              userInput,
              allowedDates,
              parsedTemporal: parsedTemporal,
            })
            : pollData;
        */

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

        // ÉTAPE 7: Log de la réponse finale
        if (isGeminiDebugEnabled()) {
          const datePoll = processedPollData as DatePollSuggestion;
          GeminiFlowLogger.logFinalResponse(requestId, {
            success: true,
            title: datePoll.title,
            description: datePoll.description,
            type: datePoll.type,
            datesCount: datePoll.dates?.length || 0,
            dates: datePoll.dates,
            timeSlotsCount: datePoll.timeSlots?.length || 0,
            timeSlots: datePoll.timeSlots,
          });
        }

        return {
          success: true,
          data: processedPollData,
          message: successMessage,
          rawText: text, // Réponse brute avant parsing pour debug/comparaison
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

        // ÉTAPE 7: Log de l'échec
        if (isGeminiDebugEnabled()) {
          GeminiFlowLogger.logFinalResponse(requestId, {
            success: false,
            errorMessage: "Impossible de générer le sondage à partir de votre demande",
          });
        }

        return {
          success: false,
          message: "Impossible de générer le sondage à partir de votre demande",
          error: "PARSE_ERROR",
          rawText: text, // Inclure la réponse brute même en cas d'échec pour debug
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
${!hasMultipleDays
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
${!hasMultipleDays && !hasMultipleNumericDates
          ? `RÈGLE ABSOLUE - DATE SPÉCIFIQUE:
- Proposer CETTE DATE UNIQUEMENT (${targetDate})
- Ajouter MAXIMUM 1-2 alternatives très proches (±1 jour) SEULEMENT si vraiment nécessaire`
          : ""
        }
${parsed.isMealContext && !/partenariats/.test(userInput) && !isMealWithMultipleDays
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

  private buildChatPrompt(userInput: string, context?: string): string {
    return `Tu es l'assistant IA de DooDates, une application de création de sondages pour planifier des rendez-vous.

${context ? `Contexte : ${context}` : ""}

Utilisateur: ${userInput}

Réponds de manière utile et amicale.Tu peux:
- Aider à créer des sondages
  - Expliquer les fonctionnalités
    - Donner des conseils sur la planification
      - Répondre aux questions sur l'application

Reste concis et pratique.Réponds en français.`;
  }

  /**
   * Extrait le JSON brut de la réponse Gemini SANS filtrage des dates.
   * Utilisé pour le debug et la comparaison avant/après filtrage.
   */
  private extractJsonFromText(text: string): Record<string, unknown> | null {
    try {
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch {
      return null;
    }
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

        // Valider la structure minimale (title obligatoire)
        if (!parsed.title) {
          logger.debug("Missing title in Gemini response", "general", { parsed });
          return null;
        }

        const todayStr = getTodayLocal();

        // Extraire les dates - d'abord depuis parsed.dates, sinon depuis timeSlots
        let allDates: string[] = [];

        if (parsed.dates && Array.isArray(parsed.dates) && parsed.dates.length > 0) {
          // Cas normal : dates au niveau racine
          allDates = parsed.dates;
        } else if (parsed.timeSlots && Array.isArray(parsed.timeSlots)) {
          // Cas alternatif : Gemini a mis les dates uniquement dans timeSlots
          // Extraire toutes les dates uniques depuis timeSlots[].dates
          const datesFromTimeSlots = new Set<string>();
          for (const slot of parsed.timeSlots) {
            if (slot.dates && Array.isArray(slot.dates)) {
              for (const d of slot.dates) {
                if (typeof d === "string") {
                  datesFromTimeSlots.add(d);
                }
              }
            }
          }
          allDates = Array.from(datesFromTimeSlots).sort();
          if (allDates.length > 0) {
            logger.debug("Dates extracted from timeSlots (fallback)", "general", {
              extractedDates: allDates,
            });
          }
        }

        // Si toujours pas de dates, échec
        if (allDates.length === 0) {
          logger.debug("No dates found in Gemini response", "general", { parsed });
          return null;
        }

        // PROTECTION CRITIQUE : Filtrer strictement les dates passées
        const validDates = allDates.filter((dateStr: string) => {
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
      // Sinon, utiliser l'Edge Function pour tester la connexion
      return await secureGeminiService.testConnection();
    } catch (error) {
      logger.error("Erreur lors du test de connexion", "api", error);
      return false;
    }
  }
}

export const geminiService = GeminiService.getInstance();
