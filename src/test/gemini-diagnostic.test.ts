/**
 * Test de diagnostic Gemini - Compare MODE DIRECT vs MODE NORMAL
 * Affiche TOUTES les étapes pour diagnostiquer les échecs
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { GeminiService } from "@/lib/ai/gemini";

// Active le debug pour voir toutes les étapes
process.env.GEMINI_DEBUG = "true";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiTestCase {
  id: string;
  name: string;
  userInput: string;
}

// Cas à diagnostiquer
const TEST_CASES: GeminiTestCase[] = [
  {
    id: "atelier-benevoles",
    name: "Atelier bénévoles semaine du 12",
    userInput: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
  },
  {
    id: "repetition-chorale",
    name: "Répétition chorale week-end",
    userInput: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
  },
  {
    id: "point-mensuel",
    name: "Point mensuel mardi/mercredi",
    userInput: "Créé un sondage pour un point mensuel mardi ou mercredi après-midi",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════════

function buildSimplePrompt(userInput: string): string {
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
  "dates": ["YYYY-MM-DD"],  // ⚠️ OBLIGATOIRE - Liste des dates au niveau racine
  "timeSlots": [{"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}]
}

⚠️ RÈGLE CRITIQUE: Le champ "dates" est OBLIGATOIRE au niveau racine, même si timeSlots existe.

Répondre UNIQUEMENT avec le JSON valide.
`;
}

async function callGeminiDirect(prompt: string): Promise<{
  success: boolean;
  rawResponse: string;
  httpStatus: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    const httpStatus = response.status;
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        rawResponse: JSON.stringify(data, null, 2),
        httpStatus,
        error: `HTTP ${httpStatus}: ${data.error?.message || "Unknown error"}`,
      };
    }

    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { success: true, rawResponse, httpStatus };
  } catch (error) {
    return {
      success: false,
      rawResponse: "",
      httpStatus: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractDatesFromJson(text: string): {
  parsed: boolean;
  json: Record<string, unknown> | null;
  datesFromRoot: string[];
  datesFromTimeSlots: string[];
  allDates: string[];
  futureDates: string[];
  pastDates: string[];
  error?: string;
} {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        parsed: false,
        json: null,
        datesFromRoot: [],
        datesFromTimeSlots: [],
        allDates: [],
        futureDates: [],
        pastDates: [],
        error: "No JSON found",
      };
    }

    const json = JSON.parse(jsonMatch[0]);

    // Dates depuis la racine
    const datesFromRoot: string[] = json.dates && Array.isArray(json.dates) ? json.dates : [];

    // Dates depuis timeSlots
    const datesFromTimeSlotsSet = new Set<string>();
    if (json.timeSlots && Array.isArray(json.timeSlots)) {
      for (const slot of json.timeSlots) {
        if (slot.dates && Array.isArray(slot.dates)) {
          for (const d of slot.dates) {
            if (typeof d === "string") datesFromTimeSlotsSet.add(d);
          }
        }
      }
    }
    const datesFromTimeSlots = Array.from(datesFromTimeSlotsSet).sort();

    // Toutes les dates (union)
    const allDatesSet = new Set([...datesFromRoot, ...datesFromTimeSlots]);
    const allDates = Array.from(allDatesSet).sort();

    const futureDates = allDates.filter((d) => d >= todayStr);
    const pastDates = allDates.filter((d) => d < todayStr);

    return {
      parsed: true,
      json,
      datesFromRoot,
      datesFromTimeSlots,
      allDates,
      futureDates,
      pastDates,
    };
  } catch (error) {
    return {
      parsed: false,
      json: null,
      datesFromRoot: [],
      datesFromTimeSlots: [],
      allDates: [],
      futureDates: [],
      pastDates: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("🔬 Diagnostic Gemini - DIRECT vs NORMAL", () => {
  let geminiService: GeminiService;
  const sep = "─".repeat(70);
  const sepBold = "═".repeat(70);

  beforeAll(() => {
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY non définie");
    }
    console.log("\n" + sepBold);
    console.log("🔬 COMPARAISON MODE DIRECT vs MODE NORMAL");
    console.log(sepBold);
    console.log(`📅 Aujourd'hui: ${new Date().toISOString().split("T")[0]}`);
    console.log(sepBold + "\n");
  });

  beforeEach(() => {
    geminiService = GeminiService.getInstance();
  });

  for (const testCase of TEST_CASES) {
    it(`[COMPARE] ${testCase.name}`, async () => {
      console.log(`\n${sepBold}`);
      console.log(`🧪 TEST: ${testCase.name}`);
      console.log(`📝 Input: "${testCase.userInput}"`);
      console.log(sepBold);

      // ═══════════════════════════════════════════════════════════════════
      // MODE DIRECT (comme Google Studio)
      // ═══════════════════════════════════════════════════════════════════
      console.log(`\n${sep}`);
      console.log(`🔵 MODE DIRECT (appel API simple, comme Google Studio)`);
      console.log(sep);

      const directPrompt = buildSimplePrompt(testCase.userInput);
      console.log(`\n📤 PROMPT ENVOYÉ:`);
      console.log("```");
      console.log(directPrompt);
      console.log("```");

      const directStart = Date.now();
      const directResult = await callGeminiDirect(directPrompt);
      const directDuration = Date.now() - directStart;

      console.log(`\n📥 RÉPONSE BRUTE (${directDuration}ms):`);
      console.log("```");
      console.log(directResult.rawResponse);
      console.log("```");

      const directParsed = extractDatesFromJson(directResult.rawResponse);

      console.log(`\n📊 ANALYSE:`);
      console.log(`   JSON parsé: ${directParsed.parsed}`);
      console.log(`   Dates dans "dates": [${directParsed.datesFromRoot.join(", ")}]`);
      console.log(`   Dates dans "timeSlots": [${directParsed.datesFromTimeSlots.join(", ")}]`);
      console.log(`   ✅ Dates futures: [${directParsed.futureDates.join(", ")}]`);
      console.log(`   ❌ Dates passées: [${directParsed.pastDates.join(", ")}]`);

      const directSuccess = directParsed.parsed && directParsed.futureDates.length > 0;
      console.log(
        `\n   ${directSuccess ? "✅ SUCCÈS" : "❌ ÉCHEC"} - ${directParsed.futureDates.length} dates valides`,
      );

      // ═══════════════════════════════════════════════════════════════════
      // MODE NORMAL (via GeminiService avec pré-processing)
      // ═══════════════════════════════════════════════════════════════════
      console.log(`\n${sep}`);
      console.log(`🟢 MODE NORMAL (via GeminiService avec pré-processing)`);
      console.log(sep);

      const normalStart = Date.now();
      let normalResult;
      let normalError: Error | null = null;

      try {
        normalResult = await geminiService.generatePollFromText(testCase.userInput, "date");
      } catch (e) {
        normalError = e instanceof Error ? e : new Error(String(e));
      }
      const normalDuration = Date.now() - normalStart;

      console.log(`\n📊 RÉSULTAT (${normalDuration}ms):`);

      if (normalError) {
        console.log(`   ❌ ERREUR: ${normalError.message}`);
      } else if (normalResult?.success && normalResult.data) {
        console.log(`   ✅ SUCCÈS`);
        console.log(`   Titre: ${normalResult.data.title}`);
        console.log(`   Dates: [${normalResult.data.dates?.join(", ") || "aucune"}]`);
        console.log(`   TimeSlots: ${normalResult.data.timeSlots?.length || 0}`);
        if (normalResult.data.timeSlots && normalResult.data.timeSlots.length > 0) {
          normalResult.data.timeSlots.slice(0, 3).forEach((slot, i) => {
            console.log(`     ${i + 1}. ${slot.start}-${slot.end} (${slot.dates?.join(", ")})`);
          });
        }
      } else {
        console.log(`   ❌ ÉCHEC - Pas de données`);
        if (normalResult) {
          console.log(`   Détail: ${JSON.stringify(normalResult, null, 2)}`);
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // COMPARAISON
      // ═══════════════════════════════════════════════════════════════════
      console.log(`\n${sep}`);
      console.log(`📈 COMPARAISON`);
      console.log(sep);

      const normalSuccess =
        normalResult?.success && normalResult.data && (normalResult.data.dates?.length || 0) > 0;

      console.log(
        `   MODE DIRECT:  ${directSuccess ? "✅ SUCCÈS" : "❌ ÉCHEC"} (${directParsed.futureDates.length} dates)`,
      );
      console.log(
        `   MODE NORMAL:  ${normalSuccess ? "✅ SUCCÈS" : "❌ ÉCHEC"} (${normalResult?.data?.dates?.length || 0} dates)`,
      );

      if (directSuccess && !normalSuccess) {
        console.log(`\n   ⚠️ PROBLÈME: Direct OK mais Normal KO → Bug dans notre pré-processing`);
      } else if (!directSuccess && normalSuccess) {
        console.log(`\n   ✨ AMÉLIORATION: Direct KO mais Normal OK → Notre pré-processing aide`);
      } else if (directSuccess && normalSuccess) {
        console.log(`\n   ✅ COHÉRENT: Les deux modes fonctionnent`);
      } else {
        console.log(`\n   ❌ PROBLÈME: Les deux modes échouent`);
      }

      console.log(`\n${sepBold}\n`);

      // Le test passe si au moins un des deux modes fonctionne
      expect(directSuccess || normalSuccess).toBe(true);
    }, 60000);
  }
});
