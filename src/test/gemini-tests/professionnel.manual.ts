/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests Gemini - Catégorie PROFESSIONNEL
 *
 * Usage: npx vitest run src/test/gemini-tests/professionnel.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

const prompts = [
  {
    input: "Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client.",
    description: "Démo client mardi/mercredi",
    minDates: 2,
  },
  {
    input: "Planifie un point budget dans deux semaines autour de 9h30.",
    description: "Point budget dans deux semaines",
    minDates: 1,
  },
  {
    input: "Génère une réunion projet la semaine du 18, plutôt en fin de journée.",
    description: "Réunion projet semaine du 18",
    minDates: 2,
  },
  {
    input: "Trouve un créneau avant vendredi midi pour passer en revue les slides.",
    description: "Revue slides avant vendredi midi",
    minDates: 1,
  },
  {
    input: "Organise un stand-up express demain matin pour l'équipe support.",
    description: "Stand-up express demain matin",
    minDates: 1,
  },
];

describe("Gemini Tests - PROFESSIONNEL", () => {
  beforeAll(async () => {
    const module = await import("@/lib/ai/gemini");
    geminiService = module.GeminiService.getInstance();
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TESTS GEMINI - CATÉGORIE PROFESSIONNEL");
    console.log("=".repeat(70));
  });

  prompts.forEach((prompt) => {
    it(
      prompt.description,
      async () => {
        const result = await geminiService.generatePollFromText(prompt.input);

        expect(result.success).toBe(true);
        const poll = result.data as any;
        const dates = Array.isArray(poll.dates) ? poll.dates : [];
        const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

        console.log("\n📝 QUESTION:", prompt.input);
        console.log("📅 RÉPONSE:");
        console.log("   - Dates:", dates.join(", ") || "aucune");
        console.log(
          "   - Créneaux:",
          timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun",
        );
        console.log("   ✅ Attendu: ≥" + prompt.minDates + " dates | Obtenu:", dates.length);

        if (prompt.minDates) {
          expect(dates.length).toBeGreaterThanOrEqual(prompt.minDates);
        }
      },
      120000,
    );
  });
});
