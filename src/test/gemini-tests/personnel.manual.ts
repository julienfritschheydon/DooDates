/**
 * Tests Gemini - Catégorie PERSONNEL
 * 
 * Usage: npx vitest run src/test/gemini-tests/personnel.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

const prompts = [
    { input: "Calcule un brunch samedi 23 ou dimanche 24.", description: "Brunch week-end 23/24", minDates: 2 },
    { input: "Propose trois soirées pour un escape game fin mars.", description: "Escape game fin mars", minDates: 1 },
    { input: "Trouve un après-midi libre la semaine prochaine pour la visite au musée.", description: "Visite musée semaine prochaine", minDates: 1 },
    { input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.", description: "Footing vendredi soir / samedi matin", minDates: 1 },
    { input: "Organise un dîner avec les cousins courant avril, plutôt le week-end.", description: "Dîner cousins avril", minDates: 1 },
    { input: "Trouve une date pour l'anniversaire de Léa autour du 15 mai.", description: "Anniversaire Léa 15 mai", minDates: 1 },
    { input: "Planifie une séance photo familiale un dimanche matin avant fin décembre.", description: "Séance photo familiale", minDates: 1 },
    { input: "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.", description: "Apéro entre amis", minDates: 1 },
];

describe("Gemini Tests - PERSONNEL", () => {
    beforeAll(async () => {
        const module = await import("@/lib/ai/gemini");
        geminiService = module.GeminiService.getInstance();
        console.log("\n" + "=".repeat(70));
        console.log("🧪 TESTS GEMINI - CATÉGORIE PERSONNEL");
        console.log("=".repeat(70));
    });

    prompts.forEach((prompt) => {
        it(prompt.description, async () => {
            const result = await geminiService.generatePollFromText(prompt.input);

            expect(result.success).toBe(true);
            const poll = result.data as any;
            const dates = Array.isArray(poll.dates) ? poll.dates : [];
            const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

            console.log("\n📝 QUESTION:", prompt.input);
            console.log("📅 RÉPONSE:");
            console.log("   - Dates:", dates.join(", ") || "aucune");
            console.log("   - Créneaux:", timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun");
            console.log("   ✅ Attendu: ≥" + prompt.minDates + " dates | Obtenu:", dates.length);

            if (prompt.minDates) {
                expect(dates.length).toBeGreaterThanOrEqual(prompt.minDates);
            }
        }, 120000);
    });
});
