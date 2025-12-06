/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests Gemini Comprehensive - Fichier consolidé
 *
 * Regroupe tous les tests Gemini en un seul fichier avec filtrage.
 *
 * Variables d'environnement pour filtrer:
 * - GEMINI_CATEGORY: "professionnel", "personnel", "associatif", "temporel", "edge", "bug"
 * - GEMINI_PROMPT: Filtre par texte (ex: "séance photo", "déjeuner")
 * - GEMINI_ID: ID spécifique d'un test (ex: "dejeuner-partenariats-mercredi")
 *
 * Exemples:
 *   $env:GEMINI_CATEGORY="professionnel"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-comprehensive.test.ts
 *   $env:GEMINI_PROMPT="déjeuner"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-comprehensive.test.ts
 *   $env:GEMINI_ID="brunch-samedi-dimanche"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-comprehensive.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

// Charger .env.local
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

// ============================================================================
// Types
// ============================================================================

interface PromptSpec {
  id: string;
  category: "professionnel" | "personnel" | "associatif" | "temporel" | "edge" | "bug";
  input: string;
  description: string;
  expectedType?: "date" | "datetime";
  minDates?: number;
  maxDates?: number;
  minTimeSlots?: number;
  maxTimeSlots?: number;
  expectTimeSlots?: boolean;
  expectedOutcome?: string;
  priority?: "CRITIQUE" | "HAUTE" | "MOYENNE";
  originalIssue?: string;
}

interface TestResult {
  id: string;
  passed: boolean;
  score: number;
  details: {
    datesCount: number;
    slotsCount: number;
    type: string;
    violations: string[];
  };
}

// ============================================================================
// Prompts consolidés (UNIQUES - sans doublons)
// ============================================================================

const allPrompts: PromptSpec[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: PROFESSIONNEL (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "demo-client-mardi-mercredi",
    category: "professionnel",
    input: "Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client.",
    description: "Démo client mardi/mercredi",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    id: "point-budget-deux-semaines",
    category: "professionnel",
    input: "Planifie un point budget dans deux semaines autour de 9h30.",
    description: "Point budget dans deux semaines",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "reunion-projet-semaine-18",
    category: "professionnel",
    input: "Génère une réunion projet la semaine du 18, plutôt en fin de journée.",
    description: "Réunion projet semaine du 18",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    id: "revue-slides-vendredi",
    category: "professionnel",
    input: "Trouve un créneau avant vendredi midi pour passer en revue les slides.",
    description: "Revue slides avant vendredi midi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "standup-demain-matin",
    category: "professionnel",
    input: "Organise un stand-up express demain matin pour l'équipe support.",
    description: "Stand-up express demain matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "reunion-lancement-mardi-jeudi",
    category: "professionnel",
    input:
      "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h.",
    description: "Réunion de lancement mardi 14h / jeudi 10h",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    id: "client-canadien-fuseau",
    category: "professionnel",
    input: "Prévois un créneau avec le client canadien en fin d'après-midi (fuseau -5h).",
    description: "Créneau client canadien (fuseau -5h)",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "point-prod-lundi-mardi",
    category: "professionnel",
    input: "Bloque 45 minutes lundi ou mardi matin pour faire le point prod.",
    description: "Point prod lundi/mardi matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "dejeuner-partenariats-mercredi",
    category: "professionnel",
    input: "Cherche un créneau entre 11h et 13h mercredi prochain pour un déjeuner partenariats.",
    description: "Déjeuner partenariats mercredi 11h-13h",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    priority: "HAUTE",
    originalIssue: "Doit générer 1 créneau dans la plage 11h-13h, pas plusieurs",
  },
  {
    id: "repetition-presentation",
    category: "professionnel",
    input: "Propose deux dates dans quinze jours pour répéter la présentation.",
    description: "Répétition présentation dans quinze jours",
    expectedType: "datetime",
    minDates: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: PERSONNEL (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "brunch-samedi-dimanche",
    category: "personnel",
    input: "Calcule un brunch samedi 23 ou dimanche 24.",
    description: "Brunch week-end 23/24",
    expectedOutcome: "Deux créneaux autour de 11h30-13h sur samedi 23 et dimanche 24",
    priority: "HAUTE",
  },
  {
    id: "escape-game-fin-mars",
    category: "personnel",
    input: "Propose trois soirées pour un escape game fin mars.",
    description: "Escape game fin mars",
    expectedOutcome: "Trois soirées 19h-21h sur la dernière quinzaine de mars",
  },
  {
    id: "visite-musee-semaine-prochaine",
    category: "personnel",
    input: "Trouve un après-midi libre la semaine prochaine pour la visite au musée.",
    description: "Visite musée semaine prochaine",
    expectedOutcome: "Créneaux 14h-17h sur la semaine suivante",
  },
  {
    id: "footing-vendredi-samedi",
    category: "personnel",
    input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
    description: "Footing vendredi soir / samedi matin",
    expectedOutcome: "Vendredi 18h-19h et/ou samedi 8h-9h",
    priority: "HAUTE",
  },
  {
    id: "diner-cousins-avril",
    category: "personnel",
    input: "Organise un dîner avec les cousins courant avril, plutôt le week-end.",
    description: "Dîner cousins avril",
    expectedOutcome: "Deux week-ends d'avril (samedi soir / dimanche midi)",
  },
  {
    id: "anniversaire-lea-15-mai",
    category: "personnel",
    input: "Trouve une date pour l'anniversaire de Léa autour du 15 mai.",
    description: "Anniversaire Léa 15 mai",
    expectedOutcome: "Week-end avant/après le 15 mai",
  },
  {
    id: "weekend-escapade-juin",
    category: "personnel",
    input: "Repère un week-end où partir deux jours en juin.",
    description: "Week-end escapade juin",
    expectedOutcome: "Deux week-ends potentiels en juin",
  },
  {
    id: "seance-photo-familiale",
    category: "personnel",
    input: "Planifie une séance photo familiale un dimanche matin avant fin décembre.",
    description: "Séance photo familiale",
    expectedOutcome: "Dimanches matin 9h-12h avant fin décembre",
    priority: "HAUTE",
    originalIssue: "Gemini reste bloqué sur novembre au lieu de décembre",
  },
  {
    id: "apero-amis-trois-semaines",
    category: "personnel",
    input: "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.",
    description: "Apéro entre amis",
    expectedOutcome: "Trois soirées semaine en 18h30-20h sous 21 jours",
  },
  {
    id: "call-visio-parents",
    category: "personnel",
    input: "Programme un créneau dans dix jours pour un call visio avec les parents.",
    description: "Call visio parents",
    expectedOutcome: "Deux créneaux vers J+10 en soirée",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: ASSOCIATIF (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "reunion-parents-profs",
    category: "associatif",
    input: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
    description: "Réunion parents-profs",
    expectedOutcome: "Deux créneaux mardi/jeudi en soirée",
  },
  {
    id: "bureau-asso-30min",
    category: "associatif",
    input: "Trouve un créneau de 30 minutes cette semaine pour le bureau de l'asso.",
    description: "Bureau associatif 30min",
    expectedOutcome: "Deux créneaux 30 min J+1 / J+2",
  },
  {
    id: "atelier-benevoles-semaine-12",
    category: "associatif",
    input: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
    description: "Atelier bénévoles semaine du 12",
    expectedOutcome: "Deux soirées cette semaine-là",
  },
  {
    id: "repetition-chorale-weekend",
    category: "associatif",
    input: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
    description: "Répétition chorale week-end",
    expectedOutcome: "Samedi matin 10h-12h ou dimanche 15h-17h",
  },
  {
    id: "aide-devoirs-mercredi-vendredi",
    category: "associatif",
    input: "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.",
    description: "Aide devoirs mercredi/vendredi",
    expectedOutcome: "Deux créneaux sur ces jours",
  },
  {
    id: "comite-quartier-quinze-jours",
    category: "associatif",
    input: "Prévois le comité de quartier dans quinze jours, plutôt en début de soirée.",
    description: "Comité de quartier J+15",
    expectedOutcome: "Créneaux 18h30-20h autour de J+15",
  },
  {
    id: "kermesse-samedi-10h",
    category: "associatif",
    input: "Propose un créneau samedi 10h pour la réunion de préparation kermesse.",
    description: "Prépa kermesse samedi 10h",
    expectedOutcome: "Samedi 10h-11h + alternative proche",
    priority: "HAUTE",
    originalIssue: "Ignore la contrainte du samedi 10h",
  },
  {
    id: "equipe-educative-vacances",
    category: "associatif",
    input: "Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.",
    description: "Equipe éducative avant vacances",
    expectedOutcome: "Deux matinées 09h",
  },
  {
    id: "visio-tresorerie-apres-18h",
    category: "associatif",
    input: "Trouve-nous un créneau en visio après 18h pour le point trésorerie.",
    description: "Visio trésorerie",
    expectedOutcome: "Deux créneaux après 18h",
  },
  {
    id: "distribution-flyers-fin-avril",
    category: "associatif",
    input: "Planifie la distribution de flyers sur un week-end fin avril.",
    description: "Distribution flyers fin avril",
    expectedOutcome: "Deux demi-journées week-end fin avril",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: BUG - Tests de régression critiques
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "bug-dejeuner-midi-deux",
    category: "bug",
    input: "fais-moi un sondage pour réserver un déjeuner la semaine prochaine entre midi et deux",
    description: "Bug #1: Déjeuner entre midi et deux",
    expectedType: "datetime",
    minDates: 5,
    maxDates: 7,
    minTimeSlots: 1,
    maxTimeSlots: 1, // CRITICAL: Doit être 1 seul créneau!
    priority: "CRITIQUE",
    originalIssue:
      "Génère 3 créneaux au lieu de 1 car hasExplicitTimeRange désactive isMealContext",
  },
  {
    id: "bug-brunch-samedi-ou-dimanche",
    category: "bug",
    input: "prévois un brunch samedi ou dimanche",
    description: "Bug: Brunch week-end",
    minDates: 2,
    maxDates: 2,
    minTimeSlots: 1,
    maxTimeSlots: 2,
    priority: "HAUTE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: EDGE - Cas limites
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "edge-input-vide",
    category: "edge",
    input: "",
    description: "Input vide",
    minDates: 1,
  },
  {
    id: "edge-caracteres-speciaux",
    category: "edge",
    input: "réunion @work #urgent",
    description: "Caractères spéciaux",
    minDates: 1,
  },
];

// ============================================================================
// Filtrage
// ============================================================================

// Note: Les variables sont lues depuis process.env au chargement du module
// Pour que le filtrage fonctionne, définir les variables AVANT de lancer vitest
const categoryFilter = process.env.GEMINI_CATEGORY?.toLowerCase().trim() || "";
const promptFilter = process.env.GEMINI_PROMPT?.toLowerCase().trim() || "";
const idFilter = process.env.GEMINI_ID?.toLowerCase().trim() || "";

function shouldRunTest(prompt: PromptSpec): boolean {
  // Si aucun filtre n'est défini, accepter tous les tests
  if (!categoryFilter && !promptFilter && !idFilter) {
    return true;
  }

  // Filtre par ID (priorité absolue)
  if (idFilter) {
    return prompt.id.toLowerCase() === idFilter;
  }

  // Filtre par catégorie
  if (categoryFilter && prompt.category.toLowerCase() !== categoryFilter) {
    return false;
  }

  // Filtre par texte
  if (promptFilter) {
    const haystack = `${prompt.description} ${prompt.input} ${prompt.id}`.toLowerCase();
    if (!haystack.includes(promptFilter)) {
      return false;
    }
  }

  return true;
}

const filteredPrompts = allPrompts.filter(shouldRunTest);

// Regrouper par catégorie
const promptsByCategory = filteredPrompts.reduce<Record<string, PromptSpec[]>>((acc, prompt) => {
  if (!acc[prompt.category]) {
    acc[prompt.category] = [];
  }
  acc[prompt.category].push(prompt);
  return acc;
}, {});

// ============================================================================
// Tests
// ============================================================================

describe("Gemini Comprehensive Tests", () => {
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    const module = await import("@/lib/ai/gemini");
    geminiService = module.GeminiService.getInstance();

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY manquante. Définissez la clé dans .env.local.");
    }

    // Afficher les filtres actifs
    console.log("\n📋 Configuration des tests:");
    console.log(`   Total prompts: ${allPrompts.length}`);
    console.log(`   Prompts filtrés: ${filteredPrompts.length}`);
    if (categoryFilter) console.log(`   Catégorie: ${categoryFilter}`);
    if (promptFilter) console.log(`   Texte: ${promptFilter}`);
    if (idFilter) console.log(`   ID: ${idFilter}`);
  });

  Object.entries(promptsByCategory).forEach(([category, categoryPrompts]) => {
    describe(`Catégorie: ${category.toUpperCase()} (${categoryPrompts.length} tests)`, () => {
      categoryPrompts.forEach((prompt) => {
        it(`[${prompt.priority || "MOYENNE"}] ${prompt.description}`, async () => {
          console.log(`\n🧪 Test: ${prompt.id}`);
          console.log(`   Prompt: "${prompt.input}"`);

          // Gérer le cas input vide
          if (!prompt.input) {
            console.log(`   ⚠️ Input vide - test ignoré`);
            return;
          }

          const startTime = Date.now();
          const result = await geminiService.generatePollFromText(prompt.input);
          const duration = Date.now() - startTime;

          console.log(`   ⏱️ Durée: ${duration}ms`);

          expect(result.success).toBe(true);
          expect(result.data).toBeTruthy();

          const poll = result.data as any;
          const pollType = String(poll.type ?? "");
          const dates = Array.isArray(poll.dates) ? poll.dates : [];
          const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

          // Vérifications de type
          if (prompt.expectedType === "datetime") {
            expect(["datetime", "date"]).toContain(pollType);
          } else if (prompt.expectedType) {
            expect(pollType).toBe(prompt.expectedType);
          }

          // Vérifications de dates
          if (typeof prompt.minDates === "number") {
            expect(dates.length).toBeGreaterThanOrEqual(prompt.minDates);
          }
          if (typeof prompt.maxDates === "number") {
            expect(dates.length).toBeLessThanOrEqual(prompt.maxDates);
          }

          // Vérifications de créneaux
          if (typeof prompt.minTimeSlots === "number") {
            expect(timeSlots.length).toBeGreaterThanOrEqual(prompt.minTimeSlots);
          }
          if (typeof prompt.maxTimeSlots === "number") {
            expect(timeSlots.length).toBeLessThanOrEqual(prompt.maxTimeSlots);
          }

          if (prompt.expectTimeSlots && timeSlots.length === 0) {
            console.warn(`   ⚠️ Aucun créneau généré malgré l'attente`);
          }

          // Log résultat
          console.log(`   ✅ Résultat: ${dates.length} dates, ${timeSlots.length} créneaux`);
          if (prompt.originalIssue) {
            console.log(`   📝 Issue originale: ${prompt.originalIssue}`);
          }

          // Stocker pour le rapport
          testResults.push({
            id: prompt.id,
            passed: true,
            score: 1.0,
            details: {
              datesCount: dates.length,
              slotsCount: timeSlots.length,
              type: pollType,
              violations: [],
            },
          });
        }, 120000); // 2 minutes timeout
      });
    });
  });

  afterAll(() => {
    if (testResults.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("📊 RAPPORT DE TESTS");
      console.log("=".repeat(60));

      const passed = testResults.filter((r) => r.passed).length;
      console.log(`   ✅ Réussis: ${passed}/${testResults.length}`);
      console.log(`   ❌ Échoués: ${testResults.length - passed}/${testResults.length}`);
      console.log("=".repeat(60));
    }
  });
});
