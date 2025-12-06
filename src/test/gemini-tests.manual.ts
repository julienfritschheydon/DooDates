/**
 * Tests Gemini Consolidés - Fichier Unique
 *
 * Fichier unique regroupant TOUS les tests Gemini avec:
 * - Filtrage par catégorie, ID ou texte
 * - Critères détaillés (timeRange, days, duration)
 * - Retry automatique (3 tentatives)
 * - Scoring sur 4 points (Type, Dates, Créneaux, Mots requis)
 * - Rapports JSON et Markdown générés automatiquement
 *
 * FILTRAGE - Variables d'environnement:
 * - GEMINI_CATEGORY: "professionnel", "personnel", "associatif", "temporel", "edge", "bug", "reunions", "evenements", "formations"
 * - GEMINI_ID: ID spécifique d'un test (ex: "dejeuner-partenariats-mercredi")
 * - GEMINI_PROMPT: Filtre par texte dans le prompt (ex: "déjeuner")
 * - FAILED_TEST_IDS: Liste d'IDs séparés par virgule pour re-run sélectif (ex: "bug1-4,bug1-5")
 *
 * EXEMPLES:
 *   # Tous les tests
 *   npx vitest run --config vitest.config.gemini.ts src/test/gemini-tests.manual.ts
 *
 *   # Par catégorie
 *   $env:GEMINI_CATEGORY="professionnel"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-tests.manual.ts
 *
 *   # Par ID
 *   $env:GEMINI_ID="brunch-samedi-dimanche"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-tests.manual.ts
 *
 *   # Par texte
 *   $env:GEMINI_PROMPT="déjeuner"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-tests.manual.ts
 *
 *   # Tests échoués uniquement
 *   $env:FAILED_TEST_IDS="bug1-4,bug1-5"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-tests.manual.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import * as fsp from "node:fs/promises";
import { writeFileSync, mkdirSync } from "fs";

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
  category: "professionnel" | "personnel" | "associatif" | "temporel" | "edge" | "bug" | "reunions" | "evenements" | "formations";
  input: string;
  description: string;
  // Critères de validation
  expectedType?: "date" | "datetime";
  expectTimeSlots?: boolean; // true = doit avoir des timeSlots, false = ne doit PAS en avoir
  minDates?: number;
  maxDates?: number;
  minTimeSlots?: number;
  maxTimeSlots?: number;
  days?: string[]; // Jours autorisés: ["lundi", "mardi", ...]
  timeRange?: { start: string; end: string }; // Plage horaire ex: { start: "09:00", end: "12:00" }
  duration?: { min?: number; max?: number }; // Durée des créneaux en minutes
  requiredWords?: string[]; // Mots qui doivent apparaître dans le titre/description
  // Métadonnées
  priority?: "CRITIQUE" | "HAUTE" | "MOYENNE";
  expectedOutcome?: string;
  originalIssue?: string;
}

interface TestResult {
  id: string;
  category: string;
  input: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: {
    hasTimeSlots: boolean;
    timeSlotsCount: number;
    datesCount: number;
    type: string;
    violations: string[];
    scoreBreakdown?: {
      type: number;
      dates: number;
      timeSlots: number;
      requiredWords: number;
    };
    timeSlots?: Array<{ start: string; end: string; dates: string[] }>;
    dates?: string[];
    // Informations supplémentaires pour juger la qualité
    generatedTitle?: string;
    generatedDescription?: string;
    rawResponse?: any; // Réponse parsée complète pour debug
    rawText?: string; // Réponse brute avant parsing (pour comparaison Google Studio)
    duration?: number; // Durée de génération en ms
  };
}

// ============================================================================
// TOUS LES PROMPTS (consolidés, sans doublons)
// ============================================================================

const allPrompts: PromptSpec[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: PROFESSIONNEL (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "demo-client-mardi-mercredi",
    category: "professionnel",
    input: "Propose-moi trois créneaux horaires mardi ou mercredi prochain pour la démo client.",
    description: "Démo client mardi/mercredi",
    expectTimeSlots: true,
    minTimeSlots: 3,
    maxTimeSlots: 3,
    days: ["mardi", "mercredi"],
    priority: "MOYENNE",
  },
  {
    id: "point-budget-deux-semaines",
    category: "professionnel",
    input: "Planifie un point budget dans deux semaines autour de 9h30.",
    description: "Point budget dans deux semaines",
    expectTimeSlots: true,
    minDates: 1,
    timeRange: { start: "09:00", end: "10:30" },
  },
  {
    id: "reunion-projet-semaine-18",
    category: "professionnel",
    input: "Génère une réunion projet la semaine du 18, plutôt en fin de journée.",
    description: "Réunion projet semaine du 18",
    expectTimeSlots: true,
    minDates: 2,
    timeRange: { start: "17:00", end: "19:00" },
  },
  {
    id: "revue-slides-vendredi",
    category: "professionnel",
    input: "Trouve un créneau avant vendredi midi pour passer en revue les slides.",
    description: "Revue slides avant vendredi midi",
    expectTimeSlots: true,
    minDates: 1,
    timeRange: { start: "08:00", end: "12:00" },
  },
  {
    id: "standup-demain-matin",
    category: "professionnel",
    input: "Organise un stand-up express demain matin pour l'équipe support.",
    description: "Stand-up express demain matin",
    expectTimeSlots: true,
    minDates: 1,
    timeRange: { start: "08:00", end: "12:00" },
    duration: { max: 30 },
  },
  {
    id: "reunion-lancement-mardi-jeudi",
    category: "professionnel",
    input: "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h.",
    description: "Réunion de lancement mardi 14h / jeudi 10h",
    expectTimeSlots: true,
    minDates: 2,
    days: ["mardi", "jeudi"],
  },
  {
    id: "client-canadien-fuseau",
    category: "professionnel",
    input: "Prévois un créneau avec le client canadien en fin d'après-midi (fuseau -5h).",
    description: "Créneau client canadien (fuseau -5h)",
    expectTimeSlots: true,
    minDates: 1,
    timeRange: { start: "15:00", end: "18:00" },
  },
  {
    id: "point-prod-lundi-mardi",
    category: "professionnel",
    input: "Bloque 45 minutes lundi ou mardi matin pour faire le point prod.",
    description: "Point prod lundi/mardi matin",
    expectTimeSlots: true,
    minDates: 1,
    days: ["lundi", "mardi"],
    timeRange: { start: "08:00", end: "12:00" },
    duration: { min: 45, max: 60 },
  },
  {
    id: "dejeuner-partenariats-mercredi",
    category: "professionnel",
    input: "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.",
    description: "Déjeuner partenariats mercredi 11h-13h",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 4,
    days: ["mercredi"],
    timeRange: { start: "11:00", end: "14:00" },
    priority: "HAUTE",
  },
  {
    id: "repetition-presentation",
    category: "professionnel",
    input: "Propose deux dates dans quinze jours pour répéter la présentation.",
    description: "Répétition présentation dans quinze jours",
    minDates: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: PERSONNEL (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "brunch-samedi-dimanche",
    category: "personnel",
    input: "Organise un brunch samedi ou dimanche prochain.",
    description: "Brunch week-end",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 4,
    days: ["samedi", "dimanche"],
    timeRange: { start: "10:00", end: "14:00" },
    priority: "HAUTE",
  },
  {
    id: "escape-game-fin-mars",
    category: "personnel",
    input: "Propose trois soirées pour un escape game fin mars.",
    description: "Escape game fin mars",
    expectTimeSlots: true,
    minTimeSlots: 3,
    maxTimeSlots: 3,
    timeRange: { start: "19:00", end: "21:00" },
  },
  {
    id: "visite-musee-semaine-prochaine",
    category: "personnel",
    input: "Trouve un après-midi libre la semaine prochaine pour la visite au musée.",
    description: "Visite musée semaine prochaine",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 3,
    timeRange: { start: "14:00", end: "17:00" },
  },
  {
    id: "footing-vendredi-samedi",
    category: "personnel",
    input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
    description: "Footing vendredi soir / samedi matin",
    expectTimeSlots: true,
    minTimeSlots: 2,
    maxTimeSlots: 3,
    days: ["vendredi", "samedi"],
    priority: "HAUTE",
  },
  {
    id: "diner-cousins-avril",
    category: "personnel",
    input: "Organise un dîner avec les cousins courant avril, plutôt le week-end.",
    description: "Dîner cousins avril",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 4,
    days: ["samedi", "dimanche"],
  },
  {
    id: "anniversaire-lea-15-mai",
    category: "personnel",
    input: "Trouve une date pour l'anniversaire de Léa autour du 15 mai un samedi.",
    description: "Anniversaire Léa - DATE uniquement",
    expectTimeSlots: false, // L'utilisateur demande une DATE, pas un horaire
    days: ["samedi"],
  },
  {
    id: "weekend-escapade-juin",
    category: "personnel",
    input: "Repère un week-end où partir deux jours en juin.",
    description: "Week-end escapade juin",
    minDates: 2,
    days: ["samedi", "dimanche"],
  },
  {
    id: "seance-photo-decembre",
    category: "personnel",
    input: "Planifie une séance photo familiale un dimanche matin en décembre (avant fin décembre).",
    description: "Séance photo familiale dimanche matin",
    expectTimeSlots: true,
    minTimeSlots: 2,
    maxTimeSlots: 6,
    days: ["dimanche"],
    timeRange: { start: "08:00", end: "13:00" },
    priority: "HAUTE",
  },
  {
    id: "apero-amis-trois-semaines",
    category: "personnel",
    input: "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.",
    description: "Apéro entre amis",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 5,
    timeRange: { start: "18:30", end: "21:00" },
  },
  {
    id: "call-visio-parents",
    category: "personnel",
    input: "Programme un call visio avec les parents dans dix jours, plutôt en soirée.",
    description: "Call visio parents",
    expectTimeSlots: true, // "en soirée" déclenche des timeSlots
    minTimeSlots: 1,
    maxTimeSlots: 5,
    timeRange: { start: "18:00", end: "21:00" },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: ASSOCIATIF (10 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "reunion-parents-profs",
    category: "associatif",
    input: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
    description: "Réunion parents-profs",
    expectTimeSlots: false, // Pas d'heure mentionnée → pas de timeSlots attendus
    minDates: 2,
    maxDates: 3,
    days: ["mardi", "mercredi", "jeudi"],
  },
  {
    id: "bureau-asso-30min",
    category: "associatif",
    input: "Trouve un créneau de 90 minutes en fin de semaine prochaine pour le bureau de l'asso.",
    description: "Bureau associatif 90min fin de semaine",
    expectTimeSlots: true,
    minTimeSlots: 1,
    minDates: 2,
    maxDates: 3,
    duration: { min: 90, max: 90 },
  },
  {
    id: "atelier-benevoles-semaine-12",
    category: "associatif",
    input: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
    description: "Atelier bénévoles semaine du 12",
    expectTimeSlots: true,
    minTimeSlots: 2,
    maxTimeSlots: 2,
    timeRange: { start: "18:00", end: "21:00" },
  },
  {
    id: "repetition-chorale",
    category: "associatif",
    input: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
    description: "Répétition chorale week-end",
    expectTimeSlots: true,
    minTimeSlots: 2,
    maxTimeSlots: 4,
    days: ["samedi", "dimanche"],
  },
  {
    id: "aide-devoirs-mercredi-vendredi",
    category: "associatif",
    input: "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.",
    description: "Aide devoirs mercredi/vendredi",
    expectTimeSlots: false, // Pas d'heure mentionnée → pas de timeSlots attendus
    minDates: 2,
    maxDates: 8, // Plusieurs mercredis/vendredis possibles
    days: ["mercredi", "vendredi"],
  },
  {
    id: "comite-quartier-quinze-jours",
    category: "associatif",
    input: "Prévois la réunion du comité de quartier dans quinze jours, sur 2 heures, plutôt en début de soirée.",
    description: "Comité de quartier J+15 - 2h",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 5,
    duration: { min: 120, max: 120 }, // 2 heures
    timeRange: { start: "18:00", end: "21:00" },
  },
  {
    id: "kermesse-samedi-10h",
    category: "associatif",
    input: "Propose un créneau samedi 10h pour la réunion de préparation kermesse.",
    description: "Prépa kermesse samedi 10h",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 2,
    days: ["samedi"],
    timeRange: { start: "10:00", end: "11:00" },
    priority: "HAUTE",
  },
  {
    id: "visio-tresorerie-apres-18h",
    category: "associatif",
    input: "Trouve-nous un créneau en visio après 18h pour le point trésorerie.",
    description: "Visio trésorerie après 18h",
    expectTimeSlots: true,
    minTimeSlots: 1,
    timeRange: { start: "18:00", end: "21:00" },
  },
  {
    id: "distribution-flyers-fin-avril",
    category: "associatif",
    input: "Planifie la distribution de flyers sur un week-end fin avril.",
    description: "Distribution flyers fin avril",
    expectTimeSlots: true,
    minTimeSlots: 1,
    maxTimeSlots: 8,
    days: ["samedi", "dimanche"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: BUG - Tests de régression critiques (6 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "bug-dejeuner-midi-deux",
    category: "bug",
    input: "fais-moi un sondage pour réserver un déjeuner la semaine prochaine entre midi et deux",
    description: "Bug #1: Déjeuner entre midi et deux",
    expectTimeSlots: true,
    minDates: 5,
    maxDates: 7,
    minTimeSlots: 1,
    maxTimeSlots: 1, // CRITICAL: Doit être 1 seul créneau!
    timeRange: { start: "12:00", end: "14:00" },
    priority: "CRITIQUE",
    originalIssue: "Génère 3 créneaux au lieu de 1 car hasExplicitTimeRange désactive isMealContext",
  },
  // SUPPRIMÉ 2025-12-06: Doublon avec brunch-samedi-dimanche dans PERSONNEL
  {
    id: "bug1-1",
    category: "bug",
    input: "fais-moi un sondage de date pour un week-end de ski en mars",
    description: "Bug #1: Mois Explicite - Mars",
    expectedType: "date",
    minDates: 2,
    requiredWords: ["mars"],
    priority: "CRITIQUE",
    originalIssue: "Doit reconnaître le mois 'mars' explicitement",
  },
  {
    id: "bug1-2",
    category: "bug",
    input: "organise un événement en avril prochain",
    description: "Bug #1: Mois Explicite - Avril",
    expectedType: "date",
    minDates: 1,
    requiredWords: ["avril"],
    priority: "CRITIQUE",
  },
  {
    id: "bug1-3",
    category: "bug",
    input: "planifie une réunion en décembre",
    description: "Bug #1: Mois Explicite - Décembre",
    expectedType: "date",
    minDates: 1,
    requiredWords: ["décembre"],
    priority: "CRITIQUE",
  },
  {
    id: "bug1-6",
    category: "bug",
    input: "organise un week-end de jeux fin mars début avril 2026",
    description: "Bug #1: Week-end Multi-mois",
    expectedType: "date",
    minDates: 2,
    requiredWords: ["mars", "avril"],
    priority: "HAUTE",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: TEMPORAL - Cas limites temporels (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "temporal-1",
    category: "temporel",
    input: "Planifie une réunion demain matin",
    description: "Temporal: Demain matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    id: "temporal-2",
    category: "temporel",
    input: "Organise un événement après-demain",
    description: "Temporal: Après-demain",
    expectedType: "date",
    minDates: 1,
  },
  {
    id: "temporal-3",
    category: "temporel",
    input: "Trouve un créneau la semaine prochaine",
    description: "Temporal: Semaine prochaine",
    expectedType: "date",
    minDates: 5,
    maxDates: 7,
  },
  {
    id: "temporal-4",
    category: "temporel",
    input: "Planifie une réunion dans deux semaines",
    description: "Temporal: Dans deux semaines",
    expectedType: "date",
    minDates: 1,
  },
  {
    id: "temporal-5",
    category: "temporel",
    input: "Organise un événement le mois prochain",
    description: "Temporal: Mois prochain",
    expectedType: "date",
    minDates: 1,
  },
  {
    id: "temporal-6",
    category: "temporel",
    input: "Trouve un créneau ce week-end",
    description: "Temporal: Ce week-end",
    expectedType: "date",
    minDates: 2,
    maxDates: 2,
  },
  {
    id: "temporal-7",
    category: "temporel",
    input: "Trouve un créneau fin de semaine",
    description: "Temporal: Fin de semaine",
    expectedType: "date",
    minDates: 1,
  },
  {
    id: "temporal-8",
    category: "temporel",
    input: "Planifie une réunion début de semaine prochaine",
    description: "Temporal: Début de semaine prochaine",
    expectedType: "date",
    minDates: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: EDGE - Cas limites (2 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "edge-input-vide",
    category: "edge",
    input: "",
    description: "Input vide",
    minDates: 0,
  },
  {
    id: "edge-caracteres-speciaux",
    category: "edge",
    input: "réunion @work #urgent",
    description: "Caractères spéciaux",
    minDates: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: RÉUNIONS (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "date-reunion-1",
    category: "reunions",
    input: "Organise une réunion d'équipe lundi matin la semaine prochaine",
    description: "Réunion d'équipe lundi matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["réunion", "équipe"],
  },
  {
    id: "date-reunion-2",
    category: "reunions",
    input: "Créé un sondage pour un point mensuel mardi ou mercredi après-midi",
    description: "Point mensuel mardi/mercredi",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
    requiredWords: ["point", "mensuel"],
  },
  {
    id: "date-reunion-3",
    category: "reunions",
    input: "Planifie un entretien client vendredi entre 14h et 17h",
    description: "Entretien client vendredi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["entretien", "client"],
  },
  {
    id: "date-reunion-4",
    category: "reunions",
    input: "Trouve un créneau pour une visioconférence avec les partenaires cette semaine",
    description: "Visioconférence partenaires",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["visioconférence", "partenaires"],
  },
  {
    id: "date-reunion-5",
    category: "reunions",
    input: "Organise une réunion de suivi projet tous les jeudis matin",
    description: "Réunion suivi projet jeudis",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["suivi", "projet"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: ÉVÉNEMENTS (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "date-event-1",
    category: "evenements",
    input: "Créé un sondage pour un déjeuner d'équipe ce weekend",
    description: "Déjeuner d'équipe weekend",
    expectedType: "date",
    minDates: 2,
    maxDates: 2,
    requiredWords: ["déjeuner", "équipe"],
  },
  {
    id: "date-event-2",
    category: "evenements",
    input: "Planifie une soirée entre amis samedi soir",
    description: "Soirée entre amis samedi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["soirée", "amis"],
  },
  {
    id: "date-event-3",
    category: "evenements",
    input: "Organise un événement de team building la semaine prochaine",
    description: "Team building semaine prochaine",
    expectedType: "date",
    minDates: 1,
    requiredWords: ["team building"],
  },
  {
    id: "date-event-4",
    category: "evenements",
    input: "Trouve une date pour célébrer l'anniversaire de Marie en décembre",
    description: "Anniversaire Marie décembre",
    expectedType: "date",
    minDates: 1,
    requiredWords: ["anniversaire", "Marie"],
  },
  {
    id: "date-event-5",
    category: "evenements",
    input: "Créé un sondage pour un barbecue dimanche après-midi",
    description: "Barbecue dimanche après-midi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["barbecue"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE: FORMATIONS (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "date-formation-1",
    category: "formations",
    input: "Planifie une formation sécurité mardi matin 2h",
    description: "Formation sécurité mardi matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["formation", "sécurité"],
  },
  {
    id: "date-formation-2",
    category: "formations",
    input: "Organise un atelier créatif mercredi après-midi 3h",
    description: "Atelier créatif mercredi après-midi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["atelier", "créatif"],
  },
  {
    id: "date-formation-3",
    category: "formations",
    input: "Créé un sondage pour une session de brainstorming vendredi",
    description: "Session brainstorming vendredi",
    expectedType: "date",
    minDates: 1,
    requiredWords: ["brainstorming"],
  },
  {
    id: "date-formation-4",
    category: "formations",
    input: "Planifie un webinaire technique lundi ou mardi entre 10h et 12h",
    description: "Webinaire technique lundi/mardi",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
    requiredWords: ["webinaire", "technique"],
  },
  {
    id: "date-formation-5",
    category: "formations",
    input: "Trouve un créneau horaire pour une formation Excel cette semaine entre 8h et 18h",
    description: "Formation Excel cette semaine",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
    requiredWords: ["formation", "Excel"],
  },
];

// ============================================================================
// Filtrage
// ============================================================================

const categoryFilter = process.env.GEMINI_CATEGORY?.toLowerCase().trim() || "";
const promptFilter = process.env.GEMINI_PROMPT?.toLowerCase().trim() || "";
const idFilter = process.env.GEMINI_ID?.toLowerCase().trim() || "";
const failedTestIdsEnv = process.env.FAILED_TEST_IDS?.split(",").map(id => id.trim()) || [];

function shouldRunTest(prompt: PromptSpec): boolean {
  // Filtre par FAILED_TEST_IDS (priorité absolue)
  if (failedTestIdsEnv.length > 0) {
    return failedTestIdsEnv.includes(prompt.id);
  }

  // Pas de filtre = tous les tests
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

const promptsByCategory = filteredPrompts.reduce<Record<string, PromptSpec[]>>((acc, prompt) => {
  if (!acc[prompt.category]) {
    acc[prompt.category] = [];
  }
  acc[prompt.category].push(prompt);
  return acc;
}, {});

// ============================================================================
// Helpers
// ============================================================================

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  return (endHour - startHour) * 60 + (endMin - startMin);
}

// ============================================================================
// Fonction de scoring sur 4 points (comme gemini-date-polls.test.ts)
// ============================================================================

function scoreDatePollTest(
  prompt: PromptSpec,
  result: any
): { score: number; maxScore: number; violations: string[]; breakdown: { type: number; dates: number; timeSlots: number; requiredWords: number } } {
  const maxScore = 4.0;
  let score = 0;
  const violations: string[] = [];
  const breakdown = {
    type: 0,
    dates: 0,
    timeSlots: 0,
    requiredWords: 0,
  };

  const pollType = String(result.type ?? "");
  const dates = Array.isArray(result.dates) ? result.dates : [];
  const timeSlots = Array.isArray(result.timeSlots) ? result.timeSlots : [];
  const title = String(result.title ?? "");
  const description = String(result.description ?? "");
  const textContent = `${title} ${description}`.toLowerCase();

  // 1. Type correct (1 point)
  if (prompt.expectedType) {
    if (prompt.expectedType === "datetime") {
      if (pollType === "datetime" || pollType === "date") {
        breakdown.type = 1.0;
        score += 1.0;
      } else {
        violations.push(`Type: attendu "datetime" ou "date" mais obtenu "${pollType}"`);
      }
    } else if (pollType === prompt.expectedType) {
      breakdown.type = 1.0;
      score += 1.0;
    } else {
      violations.push(`Type: attendu "${prompt.expectedType}" mais obtenu "${pollType}"`);
    }
  } else {
    // Pas de contrainte de type, on donne le point
    breakdown.type = 1.0;
    score += 1.0;
  }

  // 2. Contraintes de dates (1 point)
  if (typeof prompt.minDates === "number" || typeof prompt.maxDates === "number") {
    const datesCount = dates.length;
    const minDates = prompt.minDates ?? 0;
    const maxDates = prompt.maxDates ?? Infinity;

    if (datesCount >= minDates && datesCount <= maxDates) {
      breakdown.dates = 1.0;
      score += 1.0;
    } else {
      const expected = prompt.maxDates ? `${minDates}-${maxDates}` : `≥${minDates}`;
      violations.push(`Dates: ${datesCount} dates obtenues (attendu: ${expected})`);
      // Score partiel si proche
      if (datesCount >= minDates * 0.8 && datesCount <= maxDates * 1.2) {
        breakdown.dates = 0.5;
        score += 0.5;
      }
    }
  } else {
    // Pas de contrainte de dates, on donne le point
    breakdown.dates = 1.0;
    score += 1.0;
  }

  // 3. Contraintes horaires (1 point)
  const slotsCount = timeSlots.length;
  const hasTimeSlots = slotsCount > 0;

  if (prompt.expectTimeSlots === true) {
    // Doit avoir des créneaux
    if (hasTimeSlots) {
      const minSlots = prompt.minTimeSlots ?? 0;
      const maxSlots = prompt.maxTimeSlots ?? Infinity;

      if (slotsCount >= minSlots && slotsCount <= maxSlots) {
        breakdown.timeSlots = 1.0;
        score += 1.0;
      } else {
        const expected = prompt.maxTimeSlots ? `${minSlots}-${maxSlots}` : `≥${minSlots}`;
        violations.push(`Créneaux: ${slotsCount} créneaux obtenus (attendu: ${expected})`);
        // Score partiel si proche
        if (slotsCount >= minSlots * 0.8 && slotsCount <= maxSlots * 1.2) {
          breakdown.timeSlots = 0.5;
          score += 0.5;
        }
      }
    } else {
      violations.push("Créneaux: aucun créneau généré malgré l'attente");
    }
  } else if (prompt.expectTimeSlots === false) {
    // Ne doit PAS avoir de créneaux
    if (!hasTimeSlots) {
      breakdown.timeSlots = 1.0;
      score += 1.0;
    } else {
      violations.push(`Créneaux: ${slotsCount} créneaux générés alors qu'aucun n'est attendu`);
    }
  } else {
    // Pas de contrainte de créneaux, on donne le point
    breakdown.timeSlots = 1.0;
    score += 1.0;
  }

  // 4. Mots requis (1 point)
  if (prompt.requiredWords && prompt.requiredWords.length > 0) {
    const foundWords = prompt.requiredWords.filter(word =>
      textContent.includes(word.toLowerCase())
    );
    const ratio = foundWords.length / prompt.requiredWords.length;

    if (ratio === 1.0) {
      breakdown.requiredWords = 1.0;
      score += 1.0;
    } else {
      const missing = prompt.requiredWords.filter(word =>
        !textContent.includes(word.toLowerCase())
      );
      violations.push(`Mots-clés manquants: ${missing.join(", ")}`);
      breakdown.requiredWords = ratio;
      score += ratio;
    }
  } else {
    // Pas de mots requis, on donne le point
    breakdown.requiredWords = 1.0;
    score += 1.0;
  }

  return { score, maxScore, violations, breakdown };
}

// ============================================================================
// Génération de rapport markdown
// ============================================================================

function generateMarkdownReport(results: TestResult[]): string {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  let report = `# Rapport Gemini Tests Consolidés\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Score Final:** ${totalScore.toFixed(2)}/${maxTotalScore.toFixed(0)} (${percentage.toFixed(1)}%)\n`;
  report += `**Tests réussis:** ${passedTests}/${totalTests}\n\n`;

  // Évaluation qualité
  let qualityEmoji = "🔴";
  let qualityText = "INSUFFISANT";
  if (percentage >= 90) {
    qualityEmoji = "✅";
    qualityText = "EXCELLENT";
  } else if (percentage >= 80) {
    qualityEmoji = "🟡";
    qualityText = "BON";
  } else if (percentage >= 70) {
    qualityEmoji = "🟠";
    qualityText = "ACCEPTABLE";
  }

  report += `## 🎯 Évaluation Qualité\n\n`;
  report += `${qualityEmoji} **${qualityText}** (${percentage.toFixed(1)}%)`;
  if (percentage < 70) {
    report += ` - Révision requise`;
  } else if (percentage >= 90) {
    report += ` - Prêt pour production`;
  }
  report += `\n\n`;

  // Détail des tests
  report += `## 📋 Détail des Tests\n\n`;
  report += `| Test ID | Catégorie | Score | Status | Détails |\n`;
  report += `|---------|-----------|--------|--------|----------|\n`;

  results.forEach(result => {
    const statusEmoji = result.passed ? "✅" : "❌";
    const statusText = result.passed ? "RÉUSSI" : "ÉCHEC";
    report += `| ${result.id} | ${result.category} | ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} | ${statusEmoji} | Score: ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} - ${statusText} |\n`;
  });

  // Analyse des échecs avec détails complets
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    report += `\n## 🔍 Analyse des Échecs\n\n`;
    failedTests.forEach(result => {
      const prompt = allPrompts.find(p => p.id === result.id);
      report += `### Test ${result.id}: ${result.category}\n\n`;
      if (prompt) {
        report += `**Prompt:** ${prompt.input}\n\n`;
        if (prompt.expectedType) report += `**Type attendu:** ${prompt.expectedType}\n`;
        if (prompt.minDates || prompt.maxDates) {
          const range = prompt.maxDates ? `${prompt.minDates}-${prompt.maxDates}` : `≥${prompt.minDates}`;
          report += `**Dates attendues:** ${range}\n`;
        }
        if (prompt.expectTimeSlots !== undefined) {
          report += `**Créneaux attendus:** ${prompt.expectTimeSlots ? "Oui" : "Non"}\n`;
        }
        if (prompt.requiredWords && prompt.requiredWords.length > 0) {
          report += `**Mots-clés requis:** ${prompt.requiredWords.join(", ")}\n`;
        }
        report += `\n`;
      }
      report += `**Score:** ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} (${((result.score / result.maxScore) * 100).toFixed(1)}%)\n\n`;
      if (result.details.scoreBreakdown) {
        report += `**Breakdown du score:**\n`;
        report += `  - Type: ${result.details.scoreBreakdown.type.toFixed(1)}/1.0\n`;
        report += `  - Dates: ${result.details.scoreBreakdown.dates.toFixed(1)}/1.0\n`;
        report += `  - Créneaux: ${result.details.scoreBreakdown.timeSlots.toFixed(1)}/1.0\n`;
        report += `  - Mots requis: ${result.details.scoreBreakdown.requiredWords.toFixed(1)}/1.0\n\n`;
      }
      report += `**Réponse générée par Gemini:**\n`;
      report += `  - Type obtenu: ${result.details.type}\n`;
      report += `  - Nombre de dates: ${result.details.datesCount}\n`;
      report += `  - Nombre de créneaux: ${result.details.timeSlotsCount}\n`;
      if (result.details.generatedTitle) {
        report += `  - Titre: "${result.details.generatedTitle}"\n`;
      }
      if (result.details.generatedDescription) {
        report += `  - Description: "${result.details.generatedDescription}"\n`;
      }
      if (result.details.dates && result.details.dates.length > 0) {
        report += `  - Dates: ${result.details.dates.slice(0, 5).join(", ")}${result.details.dates.length > 5 ? "..." : ""}\n`;
      }
      if (result.details.timeSlots && result.details.timeSlots.length > 0) {
        report += `  - Créneaux:\n`;
        result.details.timeSlots.slice(0, 3).forEach((slot, idx) => {
          report += `    ${idx + 1}. ${slot.start}-${slot.end} (${slot.dates?.length || 0} dates)\n`;
        });
        if (result.details.timeSlots.length > 3) {
          report += `    ... (${result.details.timeSlots.length - 3} autres créneaux)\n`;
        }
      }
      report += `\n`;
      if (result.details.violations.length > 0) {
        report += `**Violations détectées:**\n`;
        result.details.violations.forEach(v => {
          report += `  - ❌ ${v}\n`;
        });
      }
      if (result.details.duration) {
        report += `\n**Durée de génération:** ${result.details.duration}ms\n`;
      }
      report += `\n---\n\n`;
    });
  }
  
  // Section détaillée pour tous les tests (réussis et échoués)
  report += `\n## 📊 Détails Complets de Tous les Tests\n\n`;
  results.forEach(result => {
    const prompt = allPrompts.find(p => p.id === result.id);
    const statusEmoji = result.passed ? "✅" : "❌";
    report += `### ${statusEmoji} ${result.id} (${result.category})\n\n`;
    report += `**Prompt:** ${result.input}\n\n`;
    report += `**Score:** ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} (${((result.score / result.maxScore) * 100).toFixed(1)}%)\n\n`;
    if (result.details.generatedTitle) {
      report += `**Titre généré:** "${result.details.generatedTitle}"\n\n`;
    }
    if (result.details.generatedDescription) {
      report += `**Description générée:** "${result.details.generatedDescription}"\n\n`;
    }
    report += `**Type:** ${result.details.type} | **Dates:** ${result.details.datesCount} | **Créneaux:** ${result.details.timeSlotsCount}\n\n`;
    if (result.details.violations.length > 0) {
      report += `**Violations:** ${result.details.violations.join("; ")}\n\n`;
    }
    report += `---\n\n`;
  });

  // Recommandations
  report += `\n## 📈 Recommandations\n\n`;
  if (percentage < 70) {
    report += `- Réviser les prompts Gemini pour améliorer la précision\n`;
    report += `- Analyser les tests en échec pour identifier les patterns\n`;
    report += `- Tester avec des variations de formulation\n`;
  } else if (percentage >= 90) {
    report += `- Continuer le monitoring automatisé\n`;
    report += `- Maintenir la qualité actuelle\n`;
  } else {
    report += `- Améliorer les prompts en échec\n`;
    report += `- Continuer le monitoring automatisé\n`;
  }

  return report;
}

// ============================================================================
// Test Runner avec Retry et Scoring
// ============================================================================

async function runPromptTest(prompt: PromptSpec): Promise<TestResult> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n🔄 Test: ${prompt.id} (tentative ${attempt}/${MAX_RETRIES})`);
      console.log(`   Prompt: "${prompt.input}"`);

      // Gérer input vide
      if (!prompt.input) {
        console.log(`   ⚠️ Input vide - test ignoré`);
        return {
          id: prompt.id,
          category: prompt.category,
          input: prompt.input,
          passed: true,
          score: 4.0,
          maxScore: 4.0,
          details: {
            hasTimeSlots: false,
            timeSlotsCount: 0,
            datesCount: 0,
            type: "unknown",
            violations: [],
            scoreBreakdown: { type: 1.0, dates: 1.0, timeSlots: 1.0, requiredWords: 1.0 },
            generatedTitle: "",
            generatedDescription: "",
            duration: 0,
          },
        };
      }

      const startTime = Date.now();
      // Tous les tests dans ce fichier sont des Date Polls - passer "date" explicitement
      const response = await geminiService.generatePollFromText(prompt.input, "date");
      const duration = Date.now() - startTime;
      console.log(`   ⏱️ Durée: ${duration}ms`);
      
      // Afficher la réponse générée pour juger la qualité
      if (response.success && response.data) {
        const poll = response.data as any;
        console.log(`   📝 Titre généré: "${poll.title ?? "N/A"}"`);
        console.log(`   📝 Description générée: "${poll.description ?? "N/A"}"`);
      }

      if (!response.success || !response.data) {
        console.error(`   ❌ Échec génération (tentative ${attempt}): ${response.message}`);
        if (attempt < MAX_RETRIES) {
          console.log(`   ⏳ Attente ${RETRY_DELAY_MS}ms avant retry...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        return {
          id: prompt.id,
          category: prompt.category,
          input: prompt.input,
          passed: false,
          score: 0,
          maxScore: 4.0,
          details: {
            hasTimeSlots: false,
            timeSlotsCount: 0,
            datesCount: 0,
            type: "unknown",
            violations: [`Échec génération après ${MAX_RETRIES} tentatives: ${response.message}`],
            generatedTitle: "",
            generatedDescription: "",
            rawText: (response as any).rawText || "", // Réponse brute même en cas d'échec
            duration,
          },
        };
      }

      console.log(`   ✅ Réponse reçue`);
      const poll = response.data as any;

      // Extraire les données
      const dates = Array.isArray(poll.dates) ? poll.dates : [];
      const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];
      const hasTimeSlots = timeSlots.length > 0;

      // Calculer le nombre réel de créneaux
      let timeSlotsCount = 0;
      if (timeSlots.length > 0) {
        timeSlots.forEach((slot: any) => {
          if (slot.dates && slot.dates.length > 0) {
            timeSlotsCount += slot.dates.length;
          } else {
            timeSlotsCount += Math.max(1, dates.length);
          }
        });
      }

      console.log(`   📊 ${dates.length} dates, ${timeSlotsCount} créneaux`);

      // Scoring sur 4 points
      const scoring = scoreDatePollTest(prompt, poll);
      const passed = scoring.score >= 2.8; // 70% de 4 points

      console.log(`   ✅ Score: ${scoring.score.toFixed(1)}/4.0`);
      if (scoring.breakdown) {
        console.log(`   📊 Breakdown: Type=${scoring.breakdown.type.toFixed(1)}, Dates=${scoring.breakdown.dates.toFixed(1)}, Créneaux=${scoring.breakdown.timeSlots.toFixed(1)}, Mots=${scoring.breakdown.requiredWords.toFixed(1)}`);
      }
      if (scoring.violations.length > 0) {
        console.log(`   ⚠️ Violations: ${scoring.violations.join("; ")}`);
      }

      // Vérifications supplémentaires (timeRange, days, duration)
      const additionalViolations: string[] = [];

      // Vérifier plage horaire
      if (prompt.timeRange && timeSlots.length > 0) {
        const validSlots = timeSlots.filter((slot: any) => {
          const startHour = parseInt(slot.start.split(":")[0], 10);
          const expectedStart = parseInt(prompt.timeRange!.start.split(":")[0], 10);
          const expectedEnd = parseInt(prompt.timeRange!.end.split(":")[0], 10);
          return startHour >= expectedStart && startHour < expectedEnd;
        });
        if (validSlots.length === 0) {
          additionalViolations.push(
            `Plage horaire incorrecte (attendu: ${prompt.timeRange.start}-${prompt.timeRange.end})`,
          );
        }
      }

      // Vérifier durée des créneaux
      if (prompt.duration && timeSlots.length > 0) {
        timeSlots.forEach((slot: any) => {
          const dur = calculateDuration(slot.start, slot.end);
          if (prompt.duration!.min && dur < prompt.duration!.min) {
            additionalViolations.push(`Durée trop courte: ${dur}min < ${prompt.duration!.min}min`);
          }
          if (prompt.duration!.max && dur > prompt.duration!.max) {
            additionalViolations.push(`Durée trop longue: ${dur}min > ${prompt.duration!.max}min`);
          }
        });
      }

      // Vérifier les jours de la semaine
      if (prompt.days && dates.length > 0) {
        const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
        const wrongDays: string[] = [];
        dates.forEach((dateStr: string) => {
          const date = new Date(dateStr);
          const dayName = dayNames[date.getDay()];
          if (!prompt.days!.includes(dayName)) {
            wrongDays.push(`${dateStr} (${dayName})`);
          }
        });
        if (wrongDays.length > 0) {
          additionalViolations.push(`Mauvais jours (attendu: ${prompt.days.join("/")}): ${wrongDays.join(", ")}`);
        }
      }

      const allViolations = [...scoring.violations, ...additionalViolations];

      return {
        id: prompt.id,
        category: prompt.category,
        input: prompt.input,
        passed,
        score: scoring.score,
        maxScore: scoring.maxScore,
        details: {
          hasTimeSlots,
          timeSlotsCount,
          datesCount: dates.length,
          type: String(poll.type ?? ""),
          violations: allViolations,
          scoreBreakdown: scoring.breakdown,
          timeSlots: timeSlots.map((s: any) => ({
            start: s.start,
            end: s.end,
            dates: s.dates || [],
          })),
          dates,
          // Informations supplémentaires pour juger la qualité
          generatedTitle: String(poll.title ?? ""),
          generatedDescription: String(poll.description ?? ""),
          rawResponse: poll, // Réponse parsée complète pour debug
          rawText: (response as any).rawText || "", // Réponse brute avant parsing (pour comparaison Google Studio)
          duration,
        },
      };
    } catch (error) {
      console.error(`   ❌ Erreur (tentative ${attempt}):`, error);
      if (attempt < MAX_RETRIES) {
        console.log(`   ⏳ Attente ${RETRY_DELAY_MS}ms avant retry...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      return {
        id: prompt.id,
        category: prompt.category,
        input: prompt.input,
        passed: false,
        score: 0,
        maxScore: 4.0,
        details: {
          hasTimeSlots: false,
          timeSlotsCount: 0,
          datesCount: 0,
            type: "unknown",
          violations: [
            `Erreur après ${MAX_RETRIES} tentatives: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          ],
            generatedTitle: "",
            generatedDescription: "",
            duration: 0,
        },
      };
    }
  }

  // Fallback (ne devrait jamais arriver)
  return {
    id: prompt.id,
    category: prompt.category,
    input: prompt.input,
    passed: false,
    score: 0,
    maxScore: 4.0,
    details: {
      hasTimeSlots: false,
      timeSlotsCount: 0,
      datesCount: 0,
            type: "unknown",
      violations: ["Erreur inattendue: fin de boucle de retry"],
            generatedTitle: "",
            generatedDescription: "",
            duration: 0,
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("Gemini Tests Consolidés", () => {
  const testResults: TestResult[] = [];

  beforeAll(async () => {
    const module = await import("@/lib/ai/gemini");
    geminiService = module.GeminiService.getInstance();

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY manquante. Définissez la clé dans .env.local.");
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 CONFIGURATION DES TESTS");
    console.log("=".repeat(60));
    console.log(`   Total prompts disponibles: ${allPrompts.length}`);
    console.log(`   Prompts sélectionnés: ${filteredPrompts.length}`);
    if (categoryFilter) console.log(`   Filtre catégorie: ${categoryFilter}`);
    if (promptFilter) console.log(`   Filtre texte: ${promptFilter}`);
    if (idFilter) console.log(`   Filtre ID: ${idFilter}`);
    if (failedTestIdsEnv.length > 0) console.log(`   Tests échoués à relancer: ${failedTestIdsEnv.join(", ")}`);
    console.log("=".repeat(60));
  });

  Object.entries(promptsByCategory).forEach(([category, categoryPrompts]) => {
    describe(`${category.toUpperCase()} (${categoryPrompts.length} tests)`, () => {
      categoryPrompts.forEach((prompt) => {
        it(`[${prompt.priority || "MOYENNE"}] ${prompt.description}`, async () => {
          const result = await runPromptTest(prompt);
          testResults.push(result);

          // Assertions
          expect(result.score).toBeGreaterThanOrEqual(2.8); // 70% de 4 points
          if (prompt.expectTimeSlots === true) {
            expect(result.details.hasTimeSlots).toBe(true);
          }
          if (prompt.expectTimeSlots === false) {
            expect(result.details.hasTimeSlots).toBe(false);
          }
        }, 120000);
      });
    });
  });

  afterAll(async () => {
    if (testResults.length > 0) {
      // Rapport console
      console.log("\n" + "=".repeat(60));
      console.log("📊 RAPPORT FINAL");
      console.log("=".repeat(60));

      const passed = testResults.filter((r) => r.passed).length;
      const totalScore = testResults.reduce((sum, r) => sum + r.score, 0);
      const maxTotalScore = testResults.reduce((sum, r) => sum + r.maxScore, 0);
      const avgScore = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

      console.log(`   ✅ Réussis: ${passed}/${testResults.length}`);
      console.log(`   ❌ Échoués: ${testResults.length - passed}/${testResults.length}`);
      console.log(`   📈 Score moyen: ${avgScore.toFixed(1)}%`);
      console.log("=".repeat(60));

      // Générer rapport JSON
      const jsonReport = {
        timestamp: new Date().toISOString().split("T")[0],
        filters: { category: categoryFilter, prompt: promptFilter, id: idFilter, failedTestIds: failedTestIdsEnv },
        totalTests: testResults.length,
        passedTests: passed,
        averageScore: avgScore / 100,
        totalScore: totalScore,
        maxTotalScore: maxTotalScore,
        results: testResults,
      };

      const jsonReportPath = path.resolve(
        process.cwd(),
        "tests/reports/gemini-tests-report.json",
      );
      await fsp.mkdir(path.dirname(jsonReportPath), { recursive: true });
      await fsp.writeFile(jsonReportPath, JSON.stringify(jsonReport, null, 2), "utf8");
      console.log(`\n📄 Rapport JSON: ${jsonReportPath}`);

      // Générer rapport Markdown
      const markdownReport = generateMarkdownReport(testResults);
      const markdownReportPath = path.resolve(
        process.cwd(),
        "tests/reports/gemini-tests-report.md",
      );
      writeFileSync(markdownReportPath, markdownReport, "utf-8");
      console.log(`📄 Rapport Markdown: ${markdownReportPath}`);
    }
  });
});
