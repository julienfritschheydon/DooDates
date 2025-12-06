/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests Gemini - Catégorie EDGE (Cas limites)
 *
 * Usage: npx vitest run src/test/gemini-tests/edge.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

describe("Gemini Tests - EDGE", () => {
  beforeAll(async () => {
    const module = await import("@/lib/ai/gemini");
    geminiService = module.GeminiService.getInstance();
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TESTS GEMINI - CATÉGORIE EDGE (CAS LIMITES)");
    console.log("=".repeat(70));
  });

  it("Caractères spéciaux dans le prompt", async () => {
    const prompt = "réunion @work #urgent";
    const result = await geminiService.generatePollFromText(prompt);

    expect(result.success).toBe(true);
    const poll = result.data as any;
    const dates = Array.isArray(poll.dates) ? poll.dates : [];
    const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

    console.log("\n📝 QUESTION:", prompt);
    console.log("📅 RÉPONSE:");
    console.log("   - Dates:", dates.join(", ") || "aucune");
    console.log(
      "   - Créneaux:",
      timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun",
    );
  }, 120000);

  it("Prompt très court", async () => {
    const prompt = "réunion demain";
    const result = await geminiService.generatePollFromText(prompt);

    expect(result.success).toBe(true);
    const poll = result.data as any;
    const dates = Array.isArray(poll.dates) ? poll.dates : [];
    const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

    console.log("\n📝 QUESTION:", prompt);
    console.log("📅 RÉPONSE:");
    console.log("   - Dates:", dates.join(", ") || "aucune");
    console.log(
      "   - Créneaux:",
      timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun",
    );
  }, 120000);

  it("Prompt avec emojis", async () => {
    const prompt = "🎉 Organise une fête vendredi soir 🎊";
    const result = await geminiService.generatePollFromText(prompt);

    expect(result.success).toBe(true);
    const poll = result.data as any;
    const dates = Array.isArray(poll.dates) ? poll.dates : [];
    const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

    console.log("\n📝 QUESTION:", prompt);
    console.log("📅 RÉPONSE:");
    console.log("   - Dates:", dates.join(", ") || "aucune");
    console.log(
      "   - Créneaux:",
      timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun",
    );
  }, 120000);

  it("Mélange français/anglais", async () => {
    const prompt = "Schedule a meeting pour next week please";
    const result = await geminiService.generatePollFromText(prompt);

    expect(result.success).toBe(true);
    const poll = result.data as any;
    const dates = Array.isArray(poll.dates) ? poll.dates : [];
    const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

    console.log("\n📝 QUESTION:", prompt);
    console.log("📅 RÉPONSE:");
    console.log("   - Dates:", dates.join(", ") || "aucune");
    console.log(
      "   - Créneaux:",
      timeSlots.map((s: any) => `${s.start}-${s.end}`).join(", ") || "aucun",
    );
  }, 120000);
});
