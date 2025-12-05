/**
 * Tests Gemini - Catégorie BUG (Tests de régression critiques)
 * 
 * Usage: npx vitest run src/test/gemini-tests/bug.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

describe("Gemini Tests - BUG", () => {
    beforeAll(async () => {
        const module = await import("@/lib/ai/gemini");
        geminiService = module.GeminiService.getInstance();
        console.log("\n" + "=".repeat(70));
        console.log("🧪 TESTS GEMINI - CATÉGORIE BUG");
        console.log("=".repeat(70));
    });

    it("[CRITIQUE] Déjeuner entre midi et deux → 1 créneau", async () => {
        const prompt = "fais-moi un sondage pour réserver un déjeuner la semaine prochaine entre midi et deux";
        const result = await geminiService.generatePollFromText(prompt);

        expect(result.success).toBe(true);
        const poll = result.data as any;
        const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

        console.log("\n📝 QUESTION:", prompt);
        console.log("📅 RÉPONSE:");
        console.log("   - Dates:", poll.dates?.join(", ") || "aucune");
        console.log("   - Créneaux:", timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun");
        console.log("   ✅ Attendu: 1 créneau | Obtenu:", timeSlots.length);

        expect(timeSlots.length).toBeLessThanOrEqual(1);
    }, 120000);

    it("[HAUTE] Brunch samedi ou dimanche → 2 dates", async () => {
        const prompt = "prévois un brunch samedi ou dimanche";
        const result = await geminiService.generatePollFromText(prompt);

        expect(result.success).toBe(true);
        const poll = result.data as any;
        const dates = Array.isArray(poll.dates) ? poll.dates : [];
        const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

        console.log("\n📝 QUESTION:", prompt);
        console.log("📅 RÉPONSE:");
        console.log("   - Dates:", dates.join(", ") || "aucune");
        console.log("   - Créneaux:", timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun");
        console.log("   ✅ Attendu: ≥2 dates | Obtenu:", dates.length);

        expect(dates.length).toBeGreaterThanOrEqual(2);
    }, 120000);
});
