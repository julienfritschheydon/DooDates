/**
 * Tests de validation des prompts temporels PARTIEL/NOK
 * Rejoue les prompts problématiques du dataset pour vérifier les améliorations
 * 
 * Teste avec un seul prompt pour valider l'appel réel à Gemini via Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GeminiService } from "../src/lib/gemini";
import { DatePollSuggestion } from "../src/lib/gemini";
import { CalendarQuery } from "../src/lib/calendar-generator";

interface PromptTestCase {
  id: string;
  input: string;
  expectedStatus: "OK" | "PARTIEL" | "NOK";
  expectedCriteria: {
    hasTimeSlots?: boolean;
    minTimeSlots?: number;
    maxTimeSlots?: number;
    timeRange?: { start: string; end: string };
    days?: string[];
    duration?: { min?: number; max?: number };
  };
  originalAnalysis?: string;
}

interface TestResult {
  promptId: string;
  input: string;
  passed: boolean;
  score: number;
  details: {
    hasTimeSlots: boolean;
    timeSlotsCount: number;
    datesCount: number;
    timeSlots?: Array<{ start: string; end: string; dates: string[] }>;
    dates?: string[];
    violations: string[];
  };
  response?: DatePollSuggestion;
}

describe("Validation prompts temporels PARTIEL/NOK", () => {
  let geminiService: GeminiService;
  let calendarQuery: CalendarQuery;
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    geminiService = GeminiService.getInstance();
    calendarQuery = new CalendarQuery();
    
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const useDirectGemini = process.env.VITE_USE_DIRECT_GEMINI === "true";
    
    console.log("\n📋 Configuration détectée:");
    console.log(`  - VITE_GEMINI_API_KEY: ${apiKey ? "✅ Présente" : "❌ Manquante"}`);
    console.log(`  - VITE_SUPABASE_URL: ${supabaseUrl ? "✅ Présente" : "❌ Manquante"}`);
    console.log(`  - Mode: ${useDirectGemini ? "DIRECT API" : "EDGE FUNCTION (Supabase)"}`);
    
    if (!useDirectGemini && !supabaseUrl) {
      throw new Error("VITE_SUPABASE_URL manquante. Configurez-la dans .env.local pour tester via Edge Function");
    }
  });

  // Test avec UN SEUL prompt problématique pour valider l'appel réel
  const testCase: PromptTestCase = {
    id: "stand-up-express",
    input: "Organise un stand-up express demain matin pour l'équipe support.",
    expectedStatus: "PARTIEL",
    expectedCriteria: {
      hasTimeSlots: true,
      minTimeSlots: 2,
      maxTimeSlots: 3,
      timeRange: { start: "08:00", end: "10:00" },
      duration: { max: 30 },
    },
    originalAnalysis: "PARTIEL – bonnes dates mais aucune plage horaire, donc inutilisable en l'état.",
  };

  it(`[${testCase.expectedStatus}] ${testCase.input}`, async () => {
    console.log(`\n🧪 Test du prompt: "${testCase.input}"`);
    console.log(`📋 Critères attendus:`, testCase.expectedCriteria);
    
    const result = await runPromptTest(testCase);
    testResults.push(result);

    console.log(`\n📊 Résultat:`);
    console.log(`  - Score: ${result.score.toFixed(2)}/1.0`);
    console.log(`  - Status: ${result.passed ? "✅ RÉUSSI" : "❌ ÉCHEC"}`);
    console.log(`  - Dates générées: ${result.details.datesCount}`);
    console.log(`  - Créneaux générés: ${result.details.timeSlotsCount}`);
    
    if (result.details.timeSlots && result.details.timeSlots.length > 0) {
      console.log(`  - Créneaux détaillés:`);
      result.details.timeSlots.forEach((slot, idx) => {
        const duration = calculateDuration(slot.start, slot.end);
        console.log(`    ${idx + 1}. ${slot.start}-${slot.end} (${duration}min) sur ${slot.dates?.join(", ") || "dates"}`);
      });
    }
    
    if (result.details.violations.length > 0) {
      console.log(`  - Violations:`);
      result.details.violations.forEach((v) => {
        console.log(`    ❌ ${v}`);
      });
    }

    // Pour les prompts PARTIEL, on attend maintenant OK après améliorations
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(result.details.hasTimeSlots).toBe(true);
    expect(result.details.timeSlotsCount).toBeGreaterThanOrEqual(testCase.expectedCriteria.minTimeSlots || 1);
  }, 60000);

  afterAll(async () => {
    if (testResults.length > 0) {
      console.log("\n📄 Résumé du test:");
      const result = testResults[0];
      console.log(`  Prompt: "${result.input}"`);
      console.log(`  Score: ${result.score.toFixed(2)}/1.0 - ${result.passed ? "✅" : "❌"}`);
      console.log(`  Créneaux générés: ${result.details.timeSlotsCount}`);
      console.log(`  Violations: ${result.details.violations.length}`);
    }
  });

  async function runPromptTest(testCase: PromptTestCase): Promise<TestResult> {
    try {
      console.log(`\n🔄 Appel à GeminiService.generatePollFromText...`);
      const startTime = Date.now();
      
      const response = await geminiService.generatePollFromText(testCase.input);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  Temps de réponse: ${duration}ms`);
      
      if (!response.success || !response.data) {
        console.error(`❌ Échec génération: ${response.message}`);
        return {
          promptId: testCase.id,
          input: testCase.input,
          passed: false,
          score: 0,
          details: {
            hasTimeSlots: false,
            timeSlotsCount: 0,
            datesCount: 0,
            violations: [`Échec génération: ${response.message}`],
          },
        };
      }

      console.log(`✅ Réponse reçue avec succès`);
      const poll = response.data as DatePollSuggestion;
      
      console.log(`  - Type: ${poll.type}`);
      console.log(`  - Dates: ${poll.dates?.length || 0}`);
      console.log(`  - Créneaux: ${poll.timeSlots?.length || 0}`);

      const violations: string[] = [];
      let score = 1.0;

      // Vérifier présence de créneaux horaires
      const hasTimeSlots = poll.timeSlots && poll.timeSlots.length > 0;
      if (testCase.expectedCriteria.hasTimeSlots && !hasTimeSlots) {
        violations.push("Absence de créneaux horaires");
        score -= 0.3;
      }

      // Vérifier nombre de créneaux
      const timeSlotsCount = poll.timeSlots?.length || 0;
      if (testCase.expectedCriteria.minTimeSlots && timeSlotsCount < testCase.expectedCriteria.minTimeSlots) {
        violations.push(`Trop peu de créneaux: ${timeSlotsCount} < ${testCase.expectedCriteria.minTimeSlots}`);
        score -= 0.2;
      }
      if (testCase.expectedCriteria.maxTimeSlots && timeSlotsCount > testCase.expectedCriteria.maxTimeSlots) {
        violations.push(`Trop de créneaux: ${timeSlotsCount} > ${testCase.expectedCriteria.maxTimeSlots}`);
        score -= 0.1;
      }

      // Vérifier plage horaire
      if (testCase.expectedCriteria.timeRange && poll.timeSlots) {
        const validSlots = poll.timeSlots.filter((slot) => {
          const startHour = parseInt(slot.start.split(":")[0], 10);
          const expectedStart = parseInt(testCase.expectedCriteria.timeRange!.start.split(":")[0], 10);
          const expectedEnd = parseInt(testCase.expectedCriteria.timeRange!.end.split(":")[0], 10);
          return startHour >= expectedStart && startHour < expectedEnd;
        });
        if (validSlots.length === 0) {
          violations.push(
            `Plage horaire incorrecte (attendu: ${testCase.expectedCriteria.timeRange.start}-${testCase.expectedCriteria.timeRange.end})`,
          );
          score -= 0.2;
        }
      }

      // Vérifier durée des créneaux
      if (testCase.expectedCriteria.duration && poll.timeSlots) {
        poll.timeSlots.forEach((slot) => {
          const duration = calculateDuration(slot.start, slot.end);
          if (testCase.expectedCriteria.duration!.min && duration < testCase.expectedCriteria.duration!.min) {
            violations.push(`Durée trop courte: ${duration}min < ${testCase.expectedCriteria.duration!.min}min`);
            score -= 0.1;
          }
          if (testCase.expectedCriteria.duration!.max && duration > testCase.expectedCriteria.duration!.max) {
            violations.push(`Durée trop longue: ${duration}min > ${testCase.expectedCriteria.duration!.max}min`);
            score -= 0.1;
          }
        });
      }

      score = Math.max(0, score);
      const passed = score >= 0.7 && violations.length === 0;

      return {
        promptId: testCase.id,
        input: testCase.input,
        passed,
        score,
        details: {
          hasTimeSlots,
          timeSlotsCount,
          datesCount: poll.dates?.length || 0,
          timeSlots: poll.timeSlots,
          dates: poll.dates,
          violations,
        },
        response: poll,
      };
    } catch (error) {
      console.error(`❌ Erreur lors du test:`, error);
      return {
        promptId: testCase.id,
        input: testCase.input,
        passed: false,
        score: 0,
        details: {
          hasTimeSlots: false,
          timeSlotsCount: 0,
          datesCount: 0,
          violations: [`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`],
        },
      };
    }
  }

  function calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    return (endHour - startHour) * 60 + (endMin - startMin);
  }
});

