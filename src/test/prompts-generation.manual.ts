/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests automatisés de génération de sondages
 * Teste les prompts de cas limites définis dans TESTS-PROMPTS-GENERATION.md
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GeminiService } from "../lib/gemini";
import { DatePollSuggestion } from "../lib/gemini";

interface PromptTest {
  id: string;
  prompt: string;
  expected: {
    dates_count: number | string;
    slots_count: number | string;
  };
  category: string;
  priority: "CRITIQUE" | "HAUTE" | "MOYENNE";
}

interface TestResult {
  id: string;
  prompt: string;
  passed: boolean;
  score: number;
  details: {
    datesCount: number;
    slotsCount: number;
    violations: string[];
    dates?: string[];
    slots?: Array<{ start: string; end: string }>;
  };
}

// Tests de cas limites pour la génération de sondages
const testCases: PromptTest[] = [
  {
    id: "brunch-samedi-ou-dimanche",
    prompt: "prévois un brunch samedi ou dimanche",
    expected: { dates_count: 2, slots_count: 1 },
    category: "cas_limite",
    priority: "HAUTE",
  },
  {
    id: "footing-vendredi-soir-samedi-matin",
    prompt: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
    expected: { dates_count: 2, slots_count: 2 },
    category: "cas_limite",
    priority: "HAUTE",
  },
];

function parseRange(value: number | string): { min: number; max: number } {
  if (typeof value === "number") {
    return { min: value, max: value };
  }
  const match = value.toString().match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  }
  const num = parseInt(value.toString(), 10);
  if (!isNaN(num)) {
    return { min: num, max: num };
  }
  return { min: 0, max: 999 };
}

describe("Tests automatisés - Génération de sondages", () => {
  let geminiService: GeminiService;
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    geminiService = GeminiService.getInstance();
    const critical = testCases.filter((t) => t.priority === "CRITIQUE").length;
    const high = testCases.filter((t) => t.priority === "HAUTE").length;
    const medium = testCases.filter((t) => t.priority === "MOYENNE").length;
    console.log(
      `\n📋 Test de ${testCases.length} prompts (${critical} CRITIQUE, ${high} HAUTE, ${medium} MOYENNE)`,
    );
  });

  testCases.forEach((testCase) => {
    it(`[${testCase.priority}] ${testCase.id}: "${testCase.prompt}"`, async () => {
      console.log(`\n🧪 Test: ${testCase.id}`);
      console.log(`📝 Prompt: "${testCase.prompt}"`);

      const result = await runPromptTest(testCase, geminiService);
      testResults.push(result);

      console.log(`\n📊 Résultat:`);
      console.log(`  - Score: ${result.score.toFixed(2)}/1.0`);
      console.log(`  - Status: ${result.passed ? "✅ RÉUSSI" : "❌ ÉCHEC"}`);
      console.log(
        `  - Dates générées: ${result.details.datesCount} (attendu: ${testCase.expected.dates_count})`,
      );
      console.log(
        `  - Créneaux générés: ${result.details.slotsCount} (attendu: ${testCase.expected.slots_count})`,
      );

      if (result.details.violations.length > 0) {
        console.log(`  - Violations:`);
        result.details.violations.forEach((v) => {
          console.log(`    ❌ ${v}`);
        });
      }

      // Afficher les détails complets pour les tests qui échouent
      if (!result.passed) {
        console.log(`\n  📋 Détails complets:`);
        console.log(
          `    - Dates générées: ${result.details.datesCount} (attendu: ${testCase.expected.dates_count})`,
        );
        console.log(
          `    - Créneaux générés: ${result.details.slotsCount} (attendu: ${testCase.expected.slots_count})`,
        );
        if (result.details.dates && result.details.dates.length > 0) {
          console.log(
            `    - Dates: ${result.details.dates.slice(0, 5).join(", ")}${result.details.dates.length > 5 ? "..." : ""}`,
          );
        }
        if (result.details.slots && result.details.slots.length > 0) {
          console.log(
            `    - Créneaux: ${result.details.slots
              .slice(0, 3)
              .map((s: any) => `${s.start}-${s.end}`)
              .join(", ")}${result.details.slots.length > 3 ? "..." : ""}`,
          );
        }
      }

      // Validation selon la priorité
      if (testCase.priority === "CRITIQUE") {
        expect(result.passed).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      } else if (testCase.priority === "HAUTE") {
        expect(result.passed).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.7);
      } else {
        // MOYENNE : plus permissif
        expect(result.score).toBeGreaterThanOrEqual(0.6);
      }
    }, 60000);
  });

  afterAll(async () => {
    if (testResults.length > 0) {
      console.log("\n📄 Résumé des tests:");
      const passed = testResults.filter((r) => r.passed).length;
      const failed = testResults.filter((r) => !r.passed).length;
      const avgScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;

      console.log(`  ✅ Réussis: ${passed}/${testResults.length}`);
      console.log(`  ❌ Échoués: ${failed}/${testResults.length}`);
      console.log(`  📊 Score moyen: ${avgScore.toFixed(2)}/1.0`);

      testResults.forEach((result) => {
        console.log(
          `\n  ${result.passed ? "✅" : "❌"} ${result.id}: ${result.score.toFixed(2)}/1.0`,
        );
        if (result.details.violations.length > 0) {
          result.details.violations.forEach((v) => console.log(`     - ${v}`));
        }
      });
    }
  });
});

async function runPromptTest(
  testCase: PromptTest,
  geminiService: GeminiService,
): Promise<TestResult> {
  try {
    const startTime = Date.now();
    const response = await geminiService.generatePollFromText(testCase.prompt);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Temps de réponse: ${duration}ms`);

    if (!response.success || !response.data) {
      return {
        id: testCase.id,
        prompt: testCase.prompt,
        passed: false,
        score: 0,
        details: {
          datesCount: 0,
          slotsCount: 0,
          violations: [`Échec génération: ${response.message}`],
        },
      };
    }

    const poll = response.data as DatePollSuggestion;
    const violations: string[] = [];
    let score = 1.0;

    const datesCount = poll.dates?.length || 0;
    const slotsCount = poll.timeSlots?.length || 0;

    // Vérifier nombre de dates
    const expectedDatesRange = parseRange(testCase.expected.dates_count);
    if (datesCount < expectedDatesRange.min) {
      violations.push(`Trop peu de dates: ${datesCount} < ${expectedDatesRange.min}`);
      score -= 0.2;
    }
    if (datesCount > expectedDatesRange.max) {
      violations.push(`Trop de dates: ${datesCount} > ${expectedDatesRange.max}`);
      score -= 0.1;
    }

    // Vérifier nombre de créneaux
    const expectedSlotsRange = parseRange(testCase.expected.slots_count);
    if (slotsCount < expectedSlotsRange.min) {
      violations.push(`Trop peu de créneaux: ${slotsCount} < ${expectedSlotsRange.min}`);
      score -= 0.2;
    }
    if (slotsCount > expectedSlotsRange.max) {
      violations.push(`Trop de créneaux: ${slotsCount} > ${expectedSlotsRange.max}`);
      score -= 0.1;
    }

    // Pour les repas + date spécifique, vérifier strictement 1 date et 1 créneau
    if (testCase.category === "repas_date_specifique") {
      if (datesCount !== 1) {
        violations.push(`RÈGLE ABSOLUE VIOLÉE: ${datesCount} dates au lieu de 1`);
        score -= 0.5;
      }
      if (slotsCount !== 1) {
        violations.push(`RÈGLE ABSOLUE VIOLÉE: ${slotsCount} créneaux au lieu de 1`);
        score -= 0.5;
      }
    }

    score = Math.max(0, score);
    // Seuil de passage selon la catégorie
    const threshold =
      testCase.priority === "CRITIQUE" ? 0.9 : testCase.priority === "HAUTE" ? 0.7 : 0.6;
    const passed = score >= threshold && violations.length === 0;

    return {
      id: testCase.id,
      prompt: testCase.prompt,
      passed,
      score,
      details: {
        datesCount,
        slotsCount,
        violations,
        dates: poll.dates || [],
        slots: poll.timeSlots || [],
      },
    };
  } catch (error) {
    return {
      id: testCase.id,
      prompt: testCase.prompt,
      passed: false,
      score: 0,
      details: {
        datesCount: 0,
        slotsCount: 0,
        violations: [`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`],
      },
    };
  }
}
