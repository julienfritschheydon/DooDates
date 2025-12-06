/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests Gemini - Catégorie ASSOCIATIF
 *
 * Usage: npx vitest run src/test/gemini-tests/associatif.test.ts
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
    input: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
    description: "Réunion parents-profs",
    minDates: 2,
  },
  {
    input: "Trouve un créneau de 30 minutes cette semaine pour le bureau de l'asso.",
    description: "Bureau associatif 30min",
    minDates: 1,
  },
  {
    input: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
    description: "Atelier bénévoles semaine du 12",
    minDates: 2,
  },
  {
    input: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
    description: "Répétition chorale week-end",
    minDates: 1,
  },
  {
    input: "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.",
    description: "Aide devoirs mercredi/vendredi",
    minDates: 1,
  },
  {
    input: "Prévois le comité de quartier dans quinze jours, plutôt en début de soirée.",
    description: "Comité de quartier J+15",
    minDates: 1,
  },
  {
    input: "Propose un créneau samedi 10h pour la réunion de préparation kermesse.",
    description: "Prépa kermesse samedi 10h",
    minDates: 1,
  },
  {
    input: "Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.",
    description: "Equipe éducative avant vacances",
    minDates: 1,
  },
  {
    input: "Trouve-nous un créneau en visio après 18h pour le point trésorerie.",
    description: "Visio trésorerie",
    minDates: 1,
  },
  {
    input: "Planifie la distribution de flyers sur un week-end fin avril.",
    description: "Distribution flyers fin avril",
    minDates: 1,
  },
];

describe("Gemini Tests - ASSOCIATIF", () => {
  beforeAll(async () => {
    const module = await import("@/lib/ai/gemini");
    geminiService = module.GeminiService.getInstance();
    console.log("\n" + "=".repeat(70));
    console.log("🧪 TESTS GEMINI - CATÉGORIE ASSOCIATIF");
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
