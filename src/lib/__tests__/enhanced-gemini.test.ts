/**
 * Tests for enhanced-gemini.ts
 * DooDates - Enhanced Gemini AI Service with Temporal Analysis
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EnhancedGeminiService,
  EnhancedPollSuggestion,
  enhancedGeminiService,
} from "../enhanced-gemini";

// Mocks
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}));

vi.mock("../calendar-generator", () => ({
  default: vi.fn().mockImplementation(() => ({
    // Mock calendar query methods if needed
  })),
}));

vi.mock("../error-handling", () => ({
  logError: vi.fn(),
  ErrorFactory: {
    api: vi.fn(),
    network: vi.fn(),
    validation: vi.fn(),
  },
}));

vi.mock("../date-utils", () => ({
  formatDateLocal: vi.fn((date) => date.toISOString().split("T")[0]),
  getTodayLocal: vi.fn(() => "2025-01-15"),
}));

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock environment variable with proper global typing
declare global {
  interface ImportMetaEnv {
    VITE_GEMINI_API_KEY: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

vi.mock("import.meta", () => ({
  env: {
    VITE_GEMINI_API_KEY: "test-api-key",
  },
}));

// Import mocked dependencies
const { GoogleGenerativeAI } = await import("@google/generative-ai");
const { logError, ErrorFactory } = await import("../error-handling");
const { formatDateLocal, getTodayLocal } = await import("../date-utils");
const { logger } = await import("../logger");

describe("EnhancedGeminiService", () => {
  let service: EnhancedGeminiService;
  let mockGenerativeModel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EnhancedGeminiService();

    // Mock the model
    mockGenerativeModel = {
      generateContent: vi.fn(),
    };

    // Setup the service with mocked model
    (service as any).genAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockGenerativeModel),
    };
    (service as any).model = mockGenerativeModel;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = EnhancedGeminiService.getInstance();
      const instance2 = EnhancedGeminiService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(enhancedGeminiService);
    });
  });

  describe("Initialization", () => {
    it("should initialize successfully with API key", async () => {
      const result = await service.ensureInitialized();

      expect(result).toBe(true);
      expect(GoogleGenerativeAI).toHaveBeenCalledWith("test-api-key");
    });

    it("should fail initialization without API key", async () => {
      // Temporarily remove API key
      const originalEnv = import.meta.env.VITE_GEMINI_API_KEY;
      (import.meta.env as any).VITE_GEMINI_API_KEY = undefined;

      const newService = new EnhancedGeminiService();
      const result = await newService.ensureInitialized();

      expect(result).toBe(false);

      // Restore
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalEnv;
    });

    it("should handle initialization errors", async () => {
      vi.mocked(GoogleGenerativeAI).mockImplementationOnce(() => {
        throw new Error("Init failed");
      });

      const newService = new EnhancedGeminiService();
      const result = await newService.ensureInitialized();

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("Temporal Analysis", () => {
    it("should analyze basic temporal input", () => {
      const result = (service as any).analyzeTemporalInput("réunion ce lundi matin");

      expect(result).toEqual({
        originalText: "réunion ce lundi matin",
        confidence: expect.any(Number),
        temporalType: "datetime",
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: true,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      });
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("should detect temporal conflicts", () => {
      const result = (service as any).analyzeTemporalInput("lundi au weekend");

      expect(result.conflicts).toContain('Contradiction: "lundi" demandé mais "weekend" aussi mentionné');
      expect(result.suggestions).toContain("Clarifiez si vous voulez un lundi ou un weekend");
      expect(result.confidence).toBeLessThan(0.8);
    });

    it("should extract dates for 'cette semaine'", () => {
      const result = (service as any).analyzeTemporalInput("réunion cette semaine");

      expect(result.extractedDates).toHaveLength(5); // Monday to Friday
      expect(result.temporalType).toBe("date");
      expect(result.constraints.semaine).toBe(true);
    });

    it("should extract dates for 'semaine prochaine'", () => {
      const result = (service as any).analyzeTemporalInput("réunion semaine prochaine");

      expect(result.extractedDates).toHaveLength(5);
      expect(result.temporalType).toBe("date");
    });

    it("should detect recurring patterns", () => {
      const result = (service as any).analyzeTemporalInput("réunion tous les lundis");

      expect(result.temporalType).toBe("recurring");
    });

    it("should handle morning/afternoon conflicts", () => {
      const result = (service as any).analyzeTemporalInput("matin et soir");

      expect(result.suggestions).toContain("Précisez si vous voulez le matin OU le soir, ou toute la journée");
    });
  });

  describe("Enhanced Poll Generation", () => {
    it("should generate enhanced poll successfully", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            title: "Réunion équipe",
            dates: ["2025-01-20"],
            timeSlots: [{
              start: "09:00",
              end: "10:00",
              dates: ["2025-01-20"],
              description: "Matinée",
            }],
            type: "datetime",
            confidence: 0.9,
          }),
        },
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const result = await service.generateEnhancedPoll("réunion lundi matin");

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Réunion équipe");
      expect(result.data?.type).toBe("datetime");
      expect(result.data?.dates).toEqual(["2025-01-20"]);
      expect(result.temporalAnalysis).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error("API Error"));

      const result = await service.generateEnhancedPoll("test input");

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error");
      expect(logError).toHaveBeenCalled();
    });

    it("should handle invalid JSON response", async () => {
      const mockResponse = {
        response: {
          text: () => "Invalid JSON response",
        },
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const result = await service.generateEnhancedPoll("test input");

      expect(result.success).toBe(false);
      expect(result.error).toBe("PARSE_ERROR");
    });

    it("should handle initialization failure", async () => {
      const newService = new EnhancedGeminiService();
      (newService as any).model = null;

      const result = await newService.generateEnhancedPoll("test");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Service IA temporairement indisponible");
    });
  });

  describe("Counterfactual Validation", () => {
    it("should validate correct temporal constraints", () => {
      const analysis = {
        originalText: "réunion lundi matin",
        constraints: { matin: true, weekend: false, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-20"], // Monday
        timeSlots: [{
          start: "09:00",
          end: "10:00",
        }],
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toHaveLength(0);
    });

    it("should detect day constraint violations", () => {
      const analysis = {
        originalText: "réunion lundi",
        constraints: { matin: false, weekend: false, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-18"], // Saturday
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toContain("Date 2025-01-18 n'est pas un lundi comme demandé");
    });

    it("should detect weekend constraint violations", () => {
      const analysis = {
        originalText: "weekend",
        constraints: { matin: false, weekend: true, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-20"], // Monday
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toContain("Date 2025-01-20 n'est pas un weekend");
    });

    it("should detect time constraint violations", () => {
      const analysis = {
        originalText: "matin",
        constraints: { matin: true, apresmidi: false, soir: false, weekend: false, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-20"],
        timeSlots: [{
          start: "14:00", // Afternoon, not morning
          end: "15:00",
        }],
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toContain("Créneau 14:00 n'est pas le matin (doit être < 12:00)");
    });

    it("should validate afternoon time slots", () => {
      const analysis = {
        originalText: "après-midi",
        constraints: { matin: false, apresmidi: true, soir: false, weekend: false, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-20"],
        timeSlots: [{
          start: "16:00",
          end: "17:00",
        }],
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toHaveLength(0);
    });

    it("should validate evening time slots", () => {
      const analysis = {
        originalText: "soir",
        constraints: { matin: false, apresmidi: false, soir: true, weekend: false, semaine: false },
      } as any;

      const parsed = {
        dates: ["2025-01-20"],
        timeSlots: [{
          start: "19:00",
          end: "20:00",
        }],
      };

      const errors = (service as any).validateCounterfactual(parsed, analysis);

      expect(errors).toHaveLength(0);
    });
  });

  describe("Connection Testing", () => {
    it("should test connection successfully", async () => {
      const mockResponse = {
        response: {
          text: () => "OK - Test successful",
        },
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockGenerativeModel.generateContent).toHaveBeenCalledWith('Test de connexion - réponds juste "OK"');
    });

    it("should handle connection test failure", async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error("Connection failed"));

      const result = await service.testConnection();

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });

    it("should handle non-OK response", async () => {
      const mockResponse = {
        response: {
          text: () => "Not OK response",
        },
      };

      mockGenerativeModel.generateContent.mockResolvedValue(mockResponse);

      const result = await service.testConnection();

      expect(result).toBe(false);
    });

    it("should handle uninitialized service", async () => {
      const newService = new EnhancedGeminiService();
      (newService as any).model = null;

      const result = await newService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("Prompt Building", () => {
    it("should build counterfactual prompt with temporal analysis", () => {
      const analysis = {
        originalText: "réunion lundi matin",
        confidence: 0.8,
        temporalType: "datetime" as const,
        conflicts: ["Test conflict"],
        suggestions: ["Test suggestion"],
        extractedDates: ["2025-01-20"],
        extractedTimes: [],
        constraints: {
          matin: true,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const prompt = (service as any).buildCounterfactualPrompt("réunion lundi matin", analysis);

      expect(prompt).toContain("DEMANDE UTILISATEUR: \"réunion lundi matin\"");
      expect(prompt).toContain("Confiance: 80.0%");
      expect(prompt).toContain("Type détecté: datetime");
      expect(prompt).toContain("Conflits détectés: Test conflict");
      expect(prompt).toContain("Contraintes: Matin=true");
      expect(prompt).toContain("VÉRIFICATIONS COUNTERFACTUAL OBLIGATOIRES");
      expect(prompt).toContain("Si on inversait matin/soir");
    });

    it("should include recurring pattern handling", () => {
      const analysis = {
        originalText: "réunion tous les lundis",
        confidence: 0.8,
        temporalType: "recurring" as const,
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: false,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const prompt = (service as any).buildCounterfactualPrompt("réunion tous les lundis", analysis);

      expect(prompt).toContain("✓ Pattern récurrent détecté - générer plusieurs occurrences");
    });
  });

  describe("Response Parsing", () => {
    it("should parse valid JSON response", () => {
      const analysis = {
        originalText: "test",
        confidence: 0.8,
        temporalType: "date" as const,
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: false,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const jsonResponse = `{
        "title": "Test Poll",
        "dates": ["2025-01-20"],
        "timeSlots": [],
        "type": "date",
        "participants": []
      }`;

      const result = (service as any).parseAndValidateResponse(jsonResponse, analysis);

      expect(result).toEqual({
        title: "Test Poll",
        description: undefined,
        dates: ["2025-01-20"],
        timeSlots: [],
        type: "date",
        participants: [],
        confidence: 0.8,
        temporalAnalysis: analysis,
        suggestions: [],
      });
    });

    it("should handle JSON with extra text", () => {
      const analysis = {
        originalText: "test",
        confidence: 0.8,
        temporalType: "date" as const,
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: false,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const jsonResponse = `Voici le résultat:
      {
        "title": "Test Poll",
        "dates": ["2025-01-20"]
      }
      Fin du résultat.`;

      const result = (service as any).parseAndValidateResponse(jsonResponse, analysis);

      expect(result?.title).toBe("Test Poll");
    });

    it("should return null for invalid JSON", () => {
      const analysis = {
        originalText: "test",
        confidence: 0.8,
        temporalType: "date" as const,
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: false,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const result = (service as any).parseAndValidateResponse("invalid json", analysis);

      expect(result).toBe(null);
      expect(logError).toHaveBeenCalled();
    });

    it("should return null for missing required fields", () => {
      const analysis = {
        originalText: "test",
        confidence: 0.8,
        temporalType: "date" as const,
        conflicts: [],
        suggestions: [],
        extractedDates: [],
        extractedTimes: [],
        constraints: {
          matin: false,
          apresmidi: false,
          soir: false,
          weekend: false,
          semaine: false,
        },
      };

      const jsonResponse = `{"invalid": "response"}`;

      const result = (service as any).parseAndValidateResponse(jsonResponse, analysis);

      expect(result).toBe(null);
    });
  });

  describe("Integration with Calendar", () => {
    it("should initialize calendar query", () => {
      expect((service as any).calendarQuery).toBeDefined();
    });
  });
});
