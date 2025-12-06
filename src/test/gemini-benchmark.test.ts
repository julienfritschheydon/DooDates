/**
 * Benchmark Gemini - Compare MODE DIRECT vs MODE NORMAL
 * Mesure : Précision, Vitesse, Qualité des réponses
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GeminiService } from "@/lib/ai/gemini";
import * as fs from "fs";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface TestCase {
  id: string;
  name: string;
  userInput: string;
  expectedDatesCount: { min: number; max: number };
  expectedHasTimeSlots: boolean;
  category: string;
}

interface BenchmarkResult {
  id: string;
  name: string;
  category: string;
  userInput: string;
  direct: {
    success: boolean;
    durationMs: number;
    datesCount: number;
    timeSlotsCount: number;
    datesInFuture: number;
    error?: string;
  };
  normal: {
    success: boolean;
    durationMs: number;
    datesCount: number;
    timeSlotsCount: number;
    datesInFuture: number;
    error?: string;
  };
  comparison: {
    winner: "direct" | "normal" | "tie" | "both_failed";
    speedDiff: number; // positif = direct plus rapide
    precisionScore: { direct: number; normal: number };
  };
}

// Cas de test variés pour le benchmark
const TEST_CASES: TestCase[] = [
  // ASSOCIATIF
  {
    id: "parents-profs",
    name: "Réunion parents-profs",
    userInput: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
    expectedDatesCount: { min: 2, max: 3 },
    expectedHasTimeSlots: false,
    category: "associatif",
  },
  {
    id: "bureau-asso",
    name: "Bureau associatif 30min",
    userInput: "Trouve un créneau de 30 minutes cette semaine pour le bureau de l'asso.",
    expectedDatesCount: { min: 1, max: 5 },
    expectedHasTimeSlots: true,
    category: "associatif",
  },
  {
    id: "atelier-benevoles",
    name: "Atelier bénévoles",
    userInput: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
    expectedDatesCount: { min: 2, max: 7 },
    expectedHasTimeSlots: true,
    category: "associatif",
  },
  // PROFESSIONNEL
  {
    id: "dejeuner-partenariats",
    name: "Déjeuner partenariats",
    userInput: "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.",
    expectedDatesCount: { min: 1, max: 1 },
    expectedHasTimeSlots: true,
    category: "professionnel",
  },
  {
    id: "reunion-equipe",
    name: "Réunion équipe lundi",
    userInput: "Planifie une réunion d'équipe lundi prochain matin.",
    expectedDatesCount: { min: 1, max: 1 },
    expectedHasTimeSlots: true,
    category: "professionnel",
  },
  {
    id: "point-mensuel",
    name: "Point mensuel mardi/mercredi",
    userInput: "Créé un sondage pour un point mensuel mardi ou mercredi après-midi",
    expectedDatesCount: { min: 2, max: 4 },
    expectedHasTimeSlots: true,
    category: "professionnel",
  },
  // PERSONNEL
  {
    id: "brunch-dimanche",
    name: "Brunch dimanche",
    userInput: "Organise un brunch dimanche prochain.",
    expectedDatesCount: { min: 1, max: 1 },
    expectedHasTimeSlots: true,
    category: "personnel",
  },
  {
    id: "repetition-chorale",
    name: "Répétition chorale week-end",
    userInput: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
    expectedDatesCount: { min: 2, max: 2 },
    expectedHasTimeSlots: true,
    category: "personnel",
  },
  // EDGE CASES
  {
    id: "dans-15-jours",
    name: "Comité dans 15 jours",
    userInput: "Prévois la réunion du comité de quartier dans quinze jours, sur 2 heures.",
    expectedDatesCount: { min: 1, max: 3 },
    expectedHasTimeSlots: true,
    category: "edge",
  },
  {
    id: "semaine-prochaine",
    name: "Disponibilité semaine prochaine",
    userInput: "Trouve des disponibilités pour la semaine prochaine.",
    expectedDatesCount: { min: 5, max: 7 },
    expectedHasTimeSlots: false,
    category: "edge",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════════

function buildDirectPrompt(userInput: string): string {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const dayName = today.toLocaleDateString("fr-FR", { weekday: "long" });

  return `Tu es l'IA DooDates, expert en planification temporelle.

Demande: "${userInput}"

Aujourd'hui: ${formatDate(today)} (${dayName})
Demain: ${formatDate(tomorrow)}

RÈGLES:
1. Dates FUTURES uniquement (>= ${formatDate(today)})
2. Si durée mentionnée → générer des timeSlots de cette durée
3. Si "créneau" mentionné → générer des timeSlots
4. Si heure/plage horaire mentionnée → générer des timeSlots

FORMAT JSON (OBLIGATOIRE):
{
  "title": "Titre court",
  "description": "Description optionnelle",
  "type": "date",
  "dates": ["YYYY-MM-DD"],
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}]
}

⚠️ Le champ "dates" est OBLIGATOIRE au niveau racine.
Répondre UNIQUEMENT avec le JSON valide.
`;
}

async function callGeminiDirect(prompt: string): Promise<{
  success: boolean;
  rawResponse: string;
  durationMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    const data = await response.json();
    const durationMs = Date.now() - start;

    if (!response.ok) {
      return { success: false, rawResponse: "", durationMs, error: data.error?.message };
    }

    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { success: true, rawResponse, durationMs };
  } catch (error) {
    return {
      success: false,
      rawResponse: "",
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractDates(text: string): { dates: string[]; timeSlots: number; futureDates: string[] } {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { dates: [], timeSlots: 0, futureDates: [] };

    const json = JSON.parse(jsonMatch[0]);

    // Dates depuis racine ou timeSlots
    let allDates: string[] = [];
    if (json.dates && Array.isArray(json.dates)) {
      allDates = json.dates;
    } else if (json.timeSlots && Array.isArray(json.timeSlots)) {
      const set = new Set<string>();
      for (const slot of json.timeSlots) {
        if (slot.dates && Array.isArray(slot.dates)) {
          for (const d of slot.dates) set.add(d);
        }
      }
      allDates = Array.from(set);
    }

    const futureDates = allDates.filter((d) => d >= todayStr);
    const timeSlots = json.timeSlots?.length || 0;

    return { dates: allDates, timeSlots, futureDates };
  } catch {
    return { dates: [], timeSlots: 0, futureDates: [] };
  }
}

function calculatePrecisionScore(
  testCase: TestCase,
  datesCount: number,
  hasTimeSlots: boolean,
  allDatesInFuture: boolean,
): number {
  let score = 0;
  const maxScore = 4;

  // 1. Nombre de dates dans la plage attendue
  if (
    datesCount >= testCase.expectedDatesCount.min &&
    datesCount <= testCase.expectedDatesCount.max
  ) {
    score += 1;
  } else if (datesCount > 0) {
    score += 0.5; // Partiellement correct
  }

  // 2. TimeSlots présents si attendus
  if (testCase.expectedHasTimeSlots === hasTimeSlots) {
    score += 1;
  } else if (hasTimeSlots && !testCase.expectedHasTimeSlots) {
    score += 0.5; // Bonus supplémentaire n'est pas pénalisé autant
  }

  // 3. Toutes les dates sont dans le futur
  if (allDatesInFuture) {
    score += 1;
  }

  // 4. Au moins une date générée
  if (datesCount > 0) {
    score += 1;
  }

  return score / maxScore; // Normaliser entre 0 et 1
}

// ═══════════════════════════════════════════════════════════════════════════════
// BENCHMARK
// ═══════════════════════════════════════════════════════════════════════════════

describe("📊 Benchmark Gemini - DIRECT vs NORMAL", () => {
  let geminiService: GeminiService;
  const results: BenchmarkResult[] = [];

  beforeAll(() => {
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY non définie");
    }
    geminiService = GeminiService.getInstance();

    console.log("\n" + "═".repeat(80));
    console.log("📊 BENCHMARK GEMINI - DIRECT vs NORMAL");
    console.log("═".repeat(80));
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🧪 Nombre de tests: ${TEST_CASES.length}`);
    console.log("═".repeat(80) + "\n");
  });

  afterAll(() => {
    // Générer le rapport final
    console.log("\n" + "═".repeat(80));
    console.log("📊 RAPPORT FINAL");
    console.log("═".repeat(80));

    // Statistiques globales
    const directWins = results.filter((r) => r.comparison.winner === "direct").length;
    const normalWins = results.filter((r) => r.comparison.winner === "normal").length;
    const ties = results.filter((r) => r.comparison.winner === "tie").length;
    const bothFailed = results.filter((r) => r.comparison.winner === "both_failed").length;

    const avgDirectTime = results.reduce((sum, r) => sum + r.direct.durationMs, 0) / results.length;
    const avgNormalTime = results.reduce((sum, r) => sum + r.normal.durationMs, 0) / results.length;

    const avgDirectPrecision =
      results.reduce((sum, r) => sum + r.comparison.precisionScore.direct, 0) / results.length;
    const avgNormalPrecision =
      results.reduce((sum, r) => sum + r.comparison.precisionScore.normal, 0) / results.length;

    const directSuccessRate =
      results.filter((r) => r.direct.success && r.direct.datesInFuture > 0).length / results.length;
    const normalSuccessRate =
      results.filter((r) => r.normal.success && r.normal.datesInFuture > 0).length / results.length;

    console.log("\n📈 STATISTIQUES GLOBALES:");
    console.log("─".repeat(60));
    console.log(`\n🏆 VICTOIRES:`);
    console.log(`   Mode Direct: ${directWins} victoires`);
    console.log(`   Mode Normal: ${normalWins} victoires`);
    console.log(`   Égalités: ${ties}`);
    console.log(`   Échecs des deux: ${bothFailed}`);

    console.log(`\n⏱️ VITESSE MOYENNE:`);
    console.log(`   Mode Direct: ${avgDirectTime.toFixed(0)}ms`);
    console.log(`   Mode Normal: ${avgNormalTime.toFixed(0)}ms`);
    console.log(
      `   Différence: ${(avgNormalTime - avgDirectTime).toFixed(0)}ms (${avgDirectTime < avgNormalTime ? "Direct plus rapide" : "Normal plus rapide"})`,
    );

    console.log(`\n🎯 PRÉCISION MOYENNE:`);
    console.log(`   Mode Direct: ${(avgDirectPrecision * 100).toFixed(1)}%`);
    console.log(`   Mode Normal: ${(avgNormalPrecision * 100).toFixed(1)}%`);

    console.log(`\n✅ TAUX DE SUCCÈS:`);
    console.log(`   Mode Direct: ${(directSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Mode Normal: ${(normalSuccessRate * 100).toFixed(1)}%`);

    console.log("\n" + "─".repeat(60));
    console.log("📋 DÉTAIL PAR TEST:");
    console.log("─".repeat(60));

    for (const r of results) {
      const winner =
        r.comparison.winner === "direct"
          ? "🔵"
          : r.comparison.winner === "normal"
            ? "🟢"
            : r.comparison.winner === "tie"
              ? "🟡"
              : "❌";
      console.log(`${winner} ${r.name}`);
      console.log(
        `   Direct: ${r.direct.durationMs}ms, ${r.direct.datesCount} dates, précision ${(r.comparison.precisionScore.direct * 100).toFixed(0)}%`,
      );
      console.log(
        `   Normal: ${r.normal.durationMs}ms, ${r.normal.datesCount} dates, précision ${(r.comparison.precisionScore.normal * 100).toFixed(0)}%`,
      );
    }

    console.log("\n" + "═".repeat(80));
    console.log(
      `🏁 CONCLUSION: ${normalWins > directWins ? "MODE NORMAL GAGNE" : directWins > normalWins ? "MODE DIRECT GAGNE" : "ÉGALITÉ"}`,
    );
    console.log("═".repeat(80) + "\n");

    // Sauvegarder le rapport JSON
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        directWins,
        normalWins,
        ties,
        bothFailed,
        avgDirectTimeMs: Math.round(avgDirectTime),
        avgNormalTimeMs: Math.round(avgNormalTime),
        avgDirectPrecision: Math.round(avgDirectPrecision * 100),
        avgNormalPrecision: Math.round(avgNormalPrecision * 100),
        directSuccessRate: Math.round(directSuccessRate * 100),
        normalSuccessRate: Math.round(normalSuccessRate * 100),
      },
      results,
    };

    fs.writeFileSync("tests/reports/gemini-benchmark.json", JSON.stringify(report, null, 2));
    console.log("📁 Rapport sauvegardé: tests/reports/gemini-benchmark.json\n");
  });

  for (const testCase of TEST_CASES) {
    it(`[BENCH] ${testCase.name}`, async () => {
      console.log(`\n🧪 ${testCase.name} (${testCase.category})`);
      console.log(`   Input: "${testCase.userInput.substring(0, 50)}..."`);

      // ═══════════════════════════════════════════════════════════════════
      // MODE DIRECT
      // ═══════════════════════════════════════════════════════════════════
      const directPrompt = buildDirectPrompt(testCase.userInput);
      const directResult = await callGeminiDirect(directPrompt);
      const directParsed = extractDates(directResult.rawResponse);

      // ═══════════════════════════════════════════════════════════════════
      // MODE NORMAL
      // ═══════════════════════════════════════════════════════════════════
      const normalStart = Date.now();
      let normalData: { dates?: string[]; timeSlots?: unknown[] } | null = null;
      let normalError: string | undefined;

      try {
        const result = await geminiService.generatePollFromText(testCase.userInput, "date");
        if (result?.success && result.data) {
          normalData = result.data;
        }
      } catch (e) {
        normalError = e instanceof Error ? e.message : String(e);
      }
      const normalDurationMs = Date.now() - normalStart;

      // ═══════════════════════════════════════════════════════════════════
      // CALCUL DES SCORES
      // ═══════════════════════════════════════════════════════════════════
      const directPrecision = calculatePrecisionScore(
        testCase,
        directParsed.futureDates.length,
        directParsed.timeSlots > 0,
        directParsed.dates.length === directParsed.futureDates.length,
      );

      const normalDatesCount = normalData?.dates?.length || 0;
      const normalPrecision = calculatePrecisionScore(
        testCase,
        normalDatesCount,
        (normalData?.timeSlots?.length || 0) > 0,
        true, // Le mode normal filtre déjà les dates passées
      );

      // Déterminer le gagnant
      let winner: "direct" | "normal" | "tie" | "both_failed";
      const directOk = directResult.success && directParsed.futureDates.length > 0;
      const normalOk = normalData && normalDatesCount > 0;

      if (!directOk && !normalOk) {
        winner = "both_failed";
      } else if (directPrecision > normalPrecision) {
        winner = "direct";
      } else if (normalPrecision > directPrecision) {
        winner = "normal";
      } else {
        // Égalité de précision, départager par vitesse
        winner =
          directResult.durationMs < normalDurationMs
            ? "direct"
            : normalDurationMs < directResult.durationMs
              ? "normal"
              : "tie";
      }

      const benchResult: BenchmarkResult = {
        id: testCase.id,
        name: testCase.name,
        category: testCase.category,
        userInput: testCase.userInput,
        direct: {
          success: directResult.success,
          durationMs: directResult.durationMs,
          datesCount: directParsed.dates.length,
          timeSlotsCount: directParsed.timeSlots,
          datesInFuture: directParsed.futureDates.length,
          error: directResult.error,
        },
        normal: {
          success: !!normalData,
          durationMs: normalDurationMs,
          datesCount: normalDatesCount,
          timeSlotsCount: normalData?.timeSlots?.length || 0,
          datesInFuture: normalDatesCount,
          error: normalError,
        },
        comparison: {
          winner,
          speedDiff: normalDurationMs - directResult.durationMs,
          precisionScore: { direct: directPrecision, normal: normalPrecision },
        },
      };

      results.push(benchResult);

      // Affichage résumé
      const winnerIcon =
        winner === "direct" ? "🔵" : winner === "normal" ? "🟢" : winner === "tie" ? "🟡" : "❌";
      console.log(`   ${winnerIcon} Gagnant: ${winner.toUpperCase()}`);
      console.log(`   ⏱️ Direct: ${directResult.durationMs}ms | Normal: ${normalDurationMs}ms`);
      console.log(
        `   📅 Direct: ${directParsed.futureDates.length} dates | Normal: ${normalDatesCount} dates`,
      );
      console.log(
        `   🎯 Précision: Direct ${(directPrecision * 100).toFixed(0)}% | Normal ${(normalPrecision * 100).toFixed(0)}%`,
      );

      // Le test passe si au moins un mode fonctionne
      expect(directOk || normalOk).toBe(true);
    }, 60000);
  }
});
