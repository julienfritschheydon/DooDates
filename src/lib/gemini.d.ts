export interface FormQuestion {
    text: string;
    title: string;
    type: "single" | "multiple" | "text" | "long-text" | "rating" | "nps" | "matrix";
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
    matrixRows?: Array<{
        id: string;
        label: string;
    }>;
    matrixColumns?: Array<{
        id: string;
        label: string;
    }>;
    matrixType?: "single" | "multiple";
    matrixColumnsNumeric?: boolean;
}
export interface FormPollSuggestion {
    title: string;
    description?: string;
    questions: FormQuestion[];
    type: "form";
    conditionalRules?: import("../types/conditionalRules").ConditionalRule[];
}
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
}
export type PollSuggestion = DatePollSuggestion | FormPollSuggestion;
export interface GeminiResponse {
    success: boolean;
    data?: PollSuggestion;
    message: string;
    error?: string;
}
export declare class GeminiService {
    private static instance;
    private calendarQuery;
    static getInstance(): GeminiService;
    private constructor();
    /**
     * Détecte si l'input contient du markdown de questionnaire
     */
    private isMarkdownQuestionnaire;
    /**
     * Parse un questionnaire markdown et extrait la structure
     */
    private parseMarkdownQuestionnaire;
    /**
     * Détecte le type de sondage demandé par l'utilisateur
     * @param userInput Texte de la demande utilisateur
     * @returns "form" pour questionnaire, "date" pour sondage de dates
     */
    private detectPollType;
    generatePollFromText(userInput: string): Promise<GeminiResponse>;
    chatAboutPoll(userInput: string, context?: string): Promise<string>;
    private getNextDayOfWeek;
    private getNextThursdayAfterTuesday;
    private getTargetYear;
    private parseWeekendRange;
    private parseConsecutiveDays;
    private parseTimeRange;
    private getNextNDaysOfWeek;
    private convertGeminiTimeSlots;
    private generateSequentialTimeSlots;
    private parseTimePattern;
    private formatTime;
    private parseSessionPattern;
    private getTimeRangeForPeriod;
    private buildPollGenerationPrompt;
    private buildChatPrompt;
    /**
     * Détecte si l'input est un questionnaire structuré (markdown parsé) ou une simple demande
     */
    private isStructuredQuestionnaire;
    /**
     * Prompt pour COPIER un questionnaire existant (markdown parsé)
     */
    private buildFormPollPromptCopy;
    /**
     * Prompt pour GÉNÉRER un questionnaire créatif (demande simple)
     */
    private buildFormPollPromptGenerate;
    private parseGeminiResponse;
    /**
     * Parse la réponse Gemini pour les Form Polls (questionnaires)
     * @param text Réponse brute de Gemini
     * @returns FormPollSuggestion validée ou null
     */
    private parseFormPollResponse;
    /**
     * Analyse temporelle avec techniques Counterfactual-Consistency
     */
    private analyzeTemporalInput;
    /**
     * Génère des questions counterfactual spécifiques au contexte
     */
    private generateCounterfactualQuestions;
    testConnection(): Promise<boolean>;
}
export declare const geminiService: GeminiService;
