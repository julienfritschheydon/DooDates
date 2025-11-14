/**
 * Tests automatisés de génération de sondages
 * Lit le fichier TESTS-PROMPTS-GENERATION.md et teste tous les prompts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { GeminiService } from "../src/lib/gemini";
import { DatePollSuggestion } from "../src/lib/gemini";

interface PromptTest {
  id: string;
  prompt: string;
  expected: {
    dates_count: string | number; // Peut être "5-7" ou 1
    slots_count: string | number; // Peut être "2-3" ou 1
    date_range?: string;
    slot_range?: string;
  };
  category: string;
  priority: "CRITIQUE" | "HAUTE" | "MOYENNE" | "BASSE";
}

interface TestResult {
  id: string;
  prompt: string;
  passed: boolean;
  score: number;
  details: {
    datesCount: number;
    slotsCount: number;
    expectedDatesRange: string;
    expectedSlotsRange: string;
    violations: string[];
  };
  response?: DatePollSuggestion;
}

// Parse le fichier YAML markdown
function parseTestFile(filePath: string): PromptTest[] {
  const content = readFileSync(filePath, "utf-8");
  const tests: PromptTest[] = [];
  
  // Extraire les blocs YAML entre ```yaml et ```
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);
  
  if (!yamlBlocks) {
    throw new Error("Aucun bloc YAML trouvé dans le fichier");
  }
  
  for (const block of yamlBlocks) {
    const yamlContent = block.replace(/```yaml\n/, "").replace(/\n```/, "");
    const test: Partial<PromptTest> = {};
    
    // Parser le YAML simple
    const lines = yamlContent.split("\n");
    let currentKey = "";
    let currentValue = "";
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      if (trimmed.includes(":")) {
        // Sauvegarder la valeur précédente
        if (currentKey && currentValue) {
          setValue(test, currentKey, currentValue.trim());
        }
        
        const [key, ...valueParts] = trimmed.split(":");
        currentKey = key.trim();
        currentValue = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
      } else if (trimmed.startsWith("-")) {
        // Continuation de la valeur précédente
        currentValue += " " + trimmed.replace(/^-/, "").trim();
      }
    }
    
    // Sauvegarder la dernière valeur
    if (currentKey && currentValue) {
      setValue(test, currentKey, currentValue.trim());
    }
    
    // Parser expected
    if (yamlContent.includes("expected:")) {
      const expectedMatch = yamlContent.match(/expected:\s*\n((?:\s+[\w_]+\s*:.*\n?)+)/);
      if (expectedMatch) {
        const expectedLines = expectedMatch[1].split("\n");
        test.expected = {} as any;
        for (const line of expectedLines) {
          const match = line.match(/\s+(\w+):\s*(.+)/);
          if (match) {
            const [, key, value] = match;
            const cleanValue = value.trim().replace(/^["']|["']$/g, "");
            (test.expected as any)[key] = cleanValue;
          }
        }
      }
    }
    
    if (test.id && test.prompt && test.expected && test.category && test.priority) {
      tests.push(test as PromptTest);
    }
  }
  
  return tests;
}

function setValue(obj: any, key: string, value: string) {
  if (key === "id" || key === "prompt" || key === "category" || key === "priority") {
    obj[key] = value;
  }
}

// Parse un range comme "5-7" ou un nombre simple
function parseRange(value: string | number): { min: number; max: number } {
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
  return { min: 0, max: 999 }; // Par défaut, très permissif
}

describe("Tests automatisés - Génération de sondages", () => {
  let geminiService: GeminiService;
  let testCases: PromptTest[] = [];
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    geminiService = GeminiService.getInstance();
    
    // Charger les tests depuis le fichier YAML
    const testFile = join(process.cwd(), "TESTS-PROMPTS-GENERATION.md");
    console.log(`\n📖 Chargement des tests depuis: ${testFile}`);
    
    try {
      testCases = parseTestFile(testFile);
      console.log(`✅ ${testCases.length} tests chargés`);
      
      // Filtrer pour tester seulement quelques prompts CRITIQUE d'abord
      const criticalTests = testCases.filter((t) => t.priority === "CRITIQUE").slice(0, 3);
      console.log(`🎯 Test de ${criticalTests.length} prompts CRITIQUE`);
      testCases = criticalTests;
    } catch (error) {
      console.error("❌ Erreur lors du chargement des tests:", error);
      throw error;
    }
  });

  // Générer un test pour chaque cas
  testCases.forEach((testCase) => {
    it(`[${testCase.priority}] ${testCase.id}: "${testCase.prompt}"`, async () => {
      console.log(`\n🧪 Test: ${testCase.id}`);
      console.log(`📝 Prompt: "${testCase.prompt}"`);
      
      const result = await runPromptTest(testCase);
      testResults.push(result);

      console.log(`\n📊 Résultat:`);
      console.log(`  - Score: ${result.score.toFixed(2)}/1.0`);
      console.log(`  - Status: ${result.passed ? "✅ RÉUSSI" : "❌ ÉCHEC"}`);
      console.log(`  - Dates générées: ${result.details.datesCount} (attendu: ${result.details.expectedDatesRange})`);
      console.log(`  - Créneaux générés: ${result.details.slotsCount} (attendu: ${result.details.expectedSlotsRange})`);
      
      if (result.details.violations.length > 0) {
        console.log(`  - Violations:`);
        result.details.violations.forEach((v) => {
          console.log(`    ❌ ${v}`);
        });
      }

      // Pour les tests CRITIQUE, on attend un score parfait
      if (testCase.priority === "CRITIQUE") {
        expect(result.passed).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      } else {
        expect(result.passed).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.7);
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
        console.log(`\n  ${result.passed ? "✅" : "❌"} ${result.id}: ${result.score.toFixed(2)}/1.0`);
        if (result.details.violations.length > 0) {
          result.details.violations.forEach((v) => console.log(`     - ${v}`));
        }
      });
    }
  });

  async function runPromptTest(testCase: PromptTest): Promise<TestResult> {
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
            expectedDatesRange: testCase.expected.dates_count.toString(),
            expectedSlotsRange: testCase.expected.slots_count.toString(),
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
      const passed = score >= 0.7 && violations.length === 0;

      return {
        id: testCase.id,
        prompt: testCase.prompt,
        passed,
        score,
        details: {
          datesCount,
          slotsCount,
          expectedDatesRange: `${expectedDatesRange.min}-${expectedDatesRange.max}`,
          expectedSlotsRange: `${expectedSlotsRange.min}-${expectedSlotsRange.max}`,
          violations,
        },
        response: poll,
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
          expectedDatesRange: testCase.expected.dates_count.toString(),
          expectedSlotsRange: testCase.expected.slots_count.toString(),
          violations: [`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`],
        },
      };
    }
  }
});

