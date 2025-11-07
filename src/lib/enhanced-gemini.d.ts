import { GenerativeModel } from "@google/generative-ai";
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
export declare class EnhancedGeminiService {
  private static instance;
  private genAI;
  model: GenerativeModel | null;
  private calendarQuery;
  constructor();
  static getInstance(): EnhancedGeminiService;
  ensureInitialized(): Promise<boolean>;
  /**
   * Analyse temporelle simplifiée avec techniques Counterfactual
   */
  private analyzeTemporalInput;
  generateEnhancedPoll(userInput: string): Promise<EnhancedGeminiResponse>;
  /**
   * Construit un prompt avec techniques Counterfactual-Consistency Prompting
   */
  private buildCounterfactualPrompt;
  /**
   * Parse et valide avec vérifications counterfactual
   */
  private parseAndValidateResponse;
  /**
   * Validation counterfactual des résultats
   */
  private validateCounterfactual;
  testConnection(): Promise<boolean>;
}
export declare const enhancedGeminiService: EnhancedGeminiService;
export {};
