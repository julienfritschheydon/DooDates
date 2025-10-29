import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import CalendarQuery from "./calendar-generator";
import { logError, ErrorFactory } from "./error-handling";
import { formatDateLocal, getTodayLocal } from "./date-utils";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Interface simplifiée pour éviter les problèmes d'import
interface SimpleTemporalAnalysis {
  originalText: string;
  confidence: number;
  temporalType: "date" | "datetime" | "recurring" | "duration" | "relative";
  conflicts: string[];
  suggestions: string[];
  extractedDates: string[];
  extractedTimes: string[];
  constraints: {
    matin?: boolean;
    apresmidi?: boolean;
    soir?: boolean;
    weekend?: boolean;
    semaine?: boolean;
  };
}

export interface EnhancedPollSuggestion {
  title: string;
  description?: string;
  dates: string[];
  timeSlots: Array<{
    start: string;
    end: string;
    dates: string[];
    description: string;
  }>;
  type: "date" | "datetime";
  participants: string[];
  confidence: number;
  temporalAnalysis: SimpleTemporalAnalysis;
  suggestions?: string[];
}

export interface EnhancedGeminiResponse {
  success: boolean;
  data?: EnhancedPollSuggestion;
  message: string;
  error?: string;
  temporalAnalysis?: SimpleTemporalAnalysis;
}

export class EnhancedGeminiService {
  private static instance: EnhancedGeminiService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private calendarQuery: CalendarQuery;

  constructor() {
    this.calendarQuery = new CalendarQuery();
  }

  public static getInstance(): EnhancedGeminiService {
    if (!EnhancedGeminiService.instance) {
      EnhancedGeminiService.instance = new EnhancedGeminiService();
    }
    return EnhancedGeminiService.instance;
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!this.genAI && API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
        });
        return true;
      } catch (error) {
        logError(
          ErrorFactory.api(
            "Failed to initialize Gemini",
            "Erreur lors de l'initialisation de Gemini",
          ),
          { metadata: { originalError: error } },
        );
        return false;
      }
    }
    return !!this.model;
  }

  /**
   * Analyse temporelle simplifiée avec techniques Counterfactual
   */
  private analyzeTemporalInput(userInput: string): SimpleTemporalAnalysis {
    const text = userInput.toLowerCase();
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    const extractedDates: string[] = [];
    const extractedTimes: string[] = [];

    // Détection des contraintes temporelles
    const constraints = {
      matin: text.includes("matin"),
      apresmidi: text.includes("après-midi") || text.includes("apres-midi"),
      soir: text.includes("soir"),
      weekend: text.includes("weekend") || text.includes("week-end"),
      semaine: text.includes("semaine") && !text.includes("weekend"),
    };

    // Vérifications counterfactual de base
    if (text.includes("lundi") && constraints.weekend) {
      conflicts.push('Contradiction: "lundi" demandé mais "weekend" aussi mentionné');
      suggestions.push("Clarifiez si vous voulez un lundi ou un weekend");
    }

    if (text.includes("matin") && text.includes("soir")) {
      suggestions.push("Précisez si vous voulez le matin OU le soir, ou toute la journée");
    }

    // Extraction de dates relatives
    if (text.includes("cette semaine")) {
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        // Lundi à vendredi
        const date = new Date(today);
        const daysToMonday = (today.getDay() + 6) % 7;
        date.setDate(today.getDate() - daysToMonday + (i - 1));
        extractedDates.push(formatDateLocal(date));
      }
    }

    if (text.includes("semaine prochaine")) {
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        // Lundi à vendredi semaine suivante
        const date = new Date(today);
        const daysToNextMonday = 7 - ((today.getDay() + 6) % 7) + 7;
        date.setDate(today.getDate() + daysToNextMonday + (i - 1));
        extractedDates.push(formatDateLocal(date));
      }
    }

    // Détection du type temporel
    let temporalType: SimpleTemporalAnalysis["temporalType"] = "relative";
    if (text.includes("tous les") || text.includes("chaque")) {
      temporalType = "recurring";
    } else if (
      constraints.matin ||
      constraints.apresmidi ||
      constraints.soir ||
      /\d{1,2}h/.test(text)
    ) {
      temporalType = "datetime";
    } else if (extractedDates.length > 0) {
      temporalType = "date";
    }

    // Calcul de confiance
    let confidence = 0.7;
    if (extractedDates.length > 0) confidence += 0.1;
    if (conflicts.length === 0) confidence += 0.1;
    if (temporalType !== "relative") confidence += 0.1;
    confidence = Math.min(1, confidence - conflicts.length * 0.2);

    return {
      originalText: userInput,
      confidence,
      temporalType,
      conflicts,
      suggestions,
      extractedDates,
      extractedTimes,
      constraints,
    };
  }

  async generateEnhancedPoll(userInput: string): Promise<EnhancedGeminiResponse> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.model) {
      return {
        success: false,
        message: "Service IA temporairement indisponible",
        error: "INITIALIZATION_FAILED",
      };
    }

    try {
      // 1. Analyse temporelle préalable
      const temporalAnalysis = this.analyzeTemporalInput(userInput);

      console.log("🔍 Analyse temporelle améliorée:", temporalAnalysis);

      // 2. Génération du prompt avec techniques Counterfactual-Consistency
      const enhancedPrompt = this.buildCounterfactualPrompt(userInput, temporalAnalysis);

      // 3. Génération par Gemini
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      console.log("📝 Réponse Gemini améliorée:", text);

      // 4. Parsing et validation
      const pollData = this.parseAndValidateResponse(text, temporalAnalysis);

      if (pollData) {
        return {
          success: true,
          data: pollData,
          message: "Sondage généré avec analyse temporelle avancée !",
          temporalAnalysis,
        };
      } else {
        return {
          success: false,
          message: "Impossible de générer le sondage. " + temporalAnalysis.suggestions.join(" "),
          error: "PARSE_ERROR",
          temporalAnalysis,
        };
      }
    } catch (error) {
      logError(
        ErrorFactory.api("Enhanced generation failed", "Erreur lors de la génération améliorée"),
        { metadata: { originalError: error } },
      );
      return {
        success: false,
        message: "Erreur lors de la communication avec le service IA",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Construit un prompt avec techniques Counterfactual-Consistency Prompting
   */
  private buildCounterfactualPrompt(userInput: string, analysis: SimpleTemporalAnalysis): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Questions counterfactual spécifiques
    const counterfactualQuestions = [];

    if (userInput.includes("lundi") || userInput.includes("mardi")) {
      counterfactualQuestions.push(
        "Si on changeait le jour demandé, est-ce que le contexte resterait cohérent ?",
      );
    }

    if (userInput.includes("matin") || userInput.includes("soir")) {
      counterfactualQuestions.push(
        "Si on inversait matin/soir, les horaires seraient-ils logiques ?",
      );
    }

    if (userInput.includes("cette semaine") || userInput.includes("semaine prochaine")) {
      counterfactualQuestions.push("Si on décalait d'une semaine, quelle semaine serait visée ?");
    }

    return `Tu es un assistant spécialisé dans la création de sondages DooDates avec vérification de cohérence temporelle avancée.

DEMANDE UTILISATEUR: "${userInput}"

ANALYSE TEMPORELLE PRÉALABLE:
- Confiance: ${(analysis.confidence * 100).toFixed(1)}%
- Type détecté: ${analysis.temporalType}
- Conflits détectés: ${analysis.conflicts.length > 0 ? analysis.conflicts.join(", ") : "Aucun"}
- Contraintes: Matin=${analysis.constraints.matin}, Après-midi=${analysis.constraints.apresmidi}, Soir=${analysis.constraints.soir}, Weekend=${analysis.constraints.weekend}
- Dates pré-extraites: ${analysis.extractedDates.join(", ") || "Aucune"}

VÉRIFICATIONS COUNTERFACTUAL OBLIGATOIRES:
${counterfactualQuestions.map((q) => `❓ ${q}`).join("\n")}

RÉSOLUTION DES CONFLITS:
${
  analysis.conflicts.length > 0
    ? analysis.conflicts.map((c) => `⚠️ RÉSOUDRE: ${c}`).join("\n")
    : "✅ Aucun conflit - procéder normalement"
}

INSTRUCTIONS AMÉLIORÉES AVEC COUNTERFACTUAL-CONSISTENCY:

1. VÉRIFICATION COUNTERFACTUAL SYSTÉMATIQUE:
   Pour chaque élément généré, se demander :
   - "Si j'inverse cette relation temporelle, est-ce cohérent ?"
   - "Si je change ce jour, le sens change-t-il ?"
   - "Si je décale cette heure, respecte-t-elle les contraintes ?"

2. COHÉRENCE TEMPORELLE STRICTE:
   * Si "lundi" → générer UNIQUEMENT des lundis (vérifier jour = 1)
   * Si "weekend" → générer UNIQUEMENT samedis (6) et dimanches (0)
   * Si "cette semaine" → utiliser les dates pré-calculées: ${analysis.extractedDates.slice(0, 5).join(", ")}
   * Si "matin" → créneaux avant 12:00 UNIQUEMENT
   * Si "après-midi" → créneaux 12:00-18:00 UNIQUEMENT

3. VALIDATION PAR QUESTIONS INVERSES:
   Avant chaque génération, valider :
   - "Si ce n'était PAS un ${userInput.includes("lundi") ? "lundi" : "jour"}, serait-ce acceptable ?"
   - "Si ce n'était PAS le ${userInput.includes("matin") ? "matin" : "moment"}, serait-ce cohérent ?"

4. DATES ET HORAIRES INTELLIGENTS:
   Date actuelle de référence: ${getTodayLocal()}
   * Générer 3-8 options selon le contexte
   * Respecter STRICTEMENT les jours de semaine demandés
   * Adapter les horaires aux contraintes détectées

5. GESTION DES PATTERNS RÉCURRENTS:
   ${
     analysis.temporalType === "recurring"
       ? "✓ Pattern récurrent détecté - générer plusieurs occurrences"
       : "✗ Événement ponctuel - générer dates spécifiques"
   }

Format JSON requis (avec validation counterfactual intégrée):

{
  "title": "Titre descriptif et précis",
  "dates": [${
    analysis.extractedDates.length > 0
      ? '"' + analysis.extractedDates.slice(0, 3).join('","') + '"'
      : '"YYYY-MM-DD"'
  }], // VÉRIFIÉES par counterfactual
  "timeSlots": [
    {
      "start": "${analysis.constraints.matin ? "09:00" : analysis.constraints.apresmidi ? "14:00" : analysis.constraints.soir ? "18:00" : "HH:MM"}",
      "end": "${analysis.constraints.matin ? "12:00" : analysis.constraints.apresmidi ? "17:00" : analysis.constraints.soir ? "21:00" : "HH:MM"}",
      "dates": ["YYYY-MM-DD"],
      "description": "Créneau validé counterfactual - [jour exact]"
    }
  ],
  "type": "${analysis.temporalType === "datetime" || analysis.constraints.matin || analysis.constraints.apresmidi || analysis.constraints.soir ? "datetime" : "date"}",
  "confidence": ${analysis.confidence}
}

VALIDATION FINALE OBLIGATOIRE:
✓ Chaque date correspond au jour demandé
✓ Aucune contradiction temporelle
✓ Questions counterfactual résolues
✓ Conflits de l'analyse traités

Réponds SEULEMENT avec le JSON validé.`;
  }

  /**
   * Parse et valide avec vérifications counterfactual
   */
  private parseAndValidateResponse(
    text: string,
    analysis: SimpleTemporalAnalysis,
  ): EnhancedPollSuggestion | null {
    try {
      const cleanText = text.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.title && parsed.dates && Array.isArray(parsed.dates)) {
          // Validation counterfactual des résultats
          const validationErrors = this.validateCounterfactual(parsed, analysis);

          if (validationErrors.length > 0) {
            logError(
              ErrorFactory.validation(
                `Counterfactual validation failed: ${validationErrors.join(", ")}`,
                "Certaines suggestions pourraient être incomplètes",
              ),
              {
                component: "enhanced-gemini",
                operation: "validateCounterfactual",
                metadata: { validationErrors },
              },
            );
            // On peut quand même retourner le résultat avec des suggestions
          }

          return {
            title: parsed.title,
            description: parsed.description,
            dates: parsed.dates,
            timeSlots: parsed.timeSlots || [],
            type: parsed.type || "date",
            participants: parsed.participants || [],
            confidence: analysis.confidence,
            temporalAnalysis: analysis,
            suggestions: [...analysis.suggestions, ...validationErrors],
          };
        }
      }

      return null;
    } catch (error) {
      logError(
        ErrorFactory.api(
          "Failed to parse enhanced response",
          "Erreur lors du parsing de la réponse",
        ),
        { metadata: { originalError: error } },
      );
      return null;
    }
  }

  /**
   * Validation counterfactual des résultats
   */
  private validateCounterfactual(parsed: any, analysis: SimpleTemporalAnalysis): string[] {
    const errors: string[] = [];

    // Test counterfactual 1: Cohérence des jours
    for (const dateStr of parsed.dates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();

      if (analysis.originalText.includes("lundi") && dayOfWeek !== 1) {
        errors.push(`Date ${dateStr} n'est pas un lundi comme demandé`);
      }
      if (analysis.originalText.includes("mardi") && dayOfWeek !== 2) {
        errors.push(`Date ${dateStr} n'est pas un mardi comme demandé`);
      }
      if (analysis.constraints.weekend && ![0, 6].includes(dayOfWeek)) {
        errors.push(`Date ${dateStr} n'est pas un weekend`);
      }
      if (analysis.constraints.semaine && [0, 6].includes(dayOfWeek)) {
        errors.push(`Date ${dateStr} est un weekend mais semaine demandée`);
      }
    }

    // Test counterfactual 2: Cohérence des horaires
    if (parsed.timeSlots) {
      for (const slot of parsed.timeSlots) {
        const startHour = parseInt(slot.start.split(":")[0]);

        if (analysis.constraints.matin && startHour >= 12) {
          errors.push(`Créneau ${slot.start} n'est pas le matin (doit être < 12:00)`);
        }
        if (analysis.constraints.apresmidi && (startHour < 12 || startHour >= 18)) {
          errors.push(`Créneau ${slot.start} n'est pas l'après-midi (doit être 12:00-18:00)`);
        }
        if (analysis.constraints.soir && startHour < 18) {
          errors.push(`Créneau ${slot.start} n'est pas le soir (doit être >= 18:00)`);
        }
      }
    }

    return errors;
  }

  async testConnection(): Promise<boolean> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.model) return false;

    try {
      const result = await this.model.generateContent('Test de connexion - réponds juste "OK"');
      const response = await result.response;
      return response.text().includes("OK");
    } catch (error) {
      logError(ErrorFactory.network("Connection test failed", "Test de connexion échoué"), {
        metadata: { originalError: error },
      });
      return false;
    }
  }
}

export const enhancedGeminiService = EnhancedGeminiService.getInstance();
