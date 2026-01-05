import { describe, beforeAll } from "vitest";
import { runGeminiPromptTest, PromptSpec } from "./gemini-test-helpers";
import path from "node:path";
import { config as loadEnv } from "dotenv";

type GeminiModule = typeof import("../lib/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

// Charger .env.local si présent (sans écraser les variables déjà définies)
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

// type GeminiPollResponse = Awaited<ReturnType<GeminiServiceInstance["generatePollFromText"]>>;

const prompts: PromptSpec[] = [
  // Professionnel
  {
    category: "professionnel",
    input: "Propose-moi trois créneaux mardi ou mercredi prochain pour la démo client.",
    description: "Démo client mardi/mercredi",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Planifie un point budget dans deux semaines autour de 9h30.",
    description: "Point budget dans deux semaines",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Génère une réunion projet la semaine du 18, plutôt en fin de journée.",
    description: "Réunion projet semaine du 18",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Trouve un créneau avant vendredi midi pour passer en revue les slides.",
    description: "Revue slides avant vendredi midi",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Organise un stand-up express demain matin pour l'équipe support.",
    description: "Stand-up express demain matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input:
      "Planifie la réunion de lancement la semaine prochaine, idéalement mardi 14h ou jeudi 10h.",
    description: "Réunion de lancement mardi 14h / jeudi 10h",
    expectedType: "datetime",
    minDates: 2,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Prévois un créneau avec le client canadien en fin d'après-midi (fuseau -5h).",
    description: "Créneau client canadien (fuseau -5h)",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Bloque 45 minutes lundi ou mardi matin pour faire le point prod.",
    description: "Point prod lundi/mardi matin",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.",
    description: "Déjeuner partenariats mercredi 11h-13h",
    expectedType: "datetime",
    minDates: 1,
    expectTimeSlots: true,
  },
  {
    category: "professionnel",
    input: "Propose deux dates dans quinze jours pour répéter la présentation.",
    description: "Répétition présentation dans quinze jours",
    expectedType: "date",
    minDates: 2,
  },

  // Personnel / Social
  {
    category: "personnel",
    input: "Calcule un brunch samedi 23 ou dimanche 24.",
    description: "Brunch week-end 23/24",
    expectedOutcome: "Deux créneaux autour de 11h30-13h sur samedi 23 et dimanche 24",
  },
  {
    category: "personnel",
    input: "Propose trois soirées pour un escape game fin mars.",
    description: "Escape game fin mars",
    expectedOutcome: "Trois soirées 19h-21h sur la dernière quinzaine de mars",
  },
  {
    category: "personnel",
    input: "Trouve un après-midi libre la semaine prochaine pour la visite au musée.",
    description: "Visite musée semaine prochaine",
    expectedOutcome: "Créneaux 14h-17h sur la semaine suivante",
  },
  {
    category: "personnel",
    input: "Bloque un créneau vendredi soir ou samedi matin pour un footing.",
    description: "Footing vendredi soir / samedi matin",
    expectedOutcome: "Vendredi 18h-19h et/ou samedi 8h-9h",
  },
  {
    category: "personnel",
    input: "Organise un dîner avec les cousins courant avril, plutôt le week-end.",
    description: "Dîner cousins avril",
    expectedOutcome: "Deux week-ends d'avril (samedi soir / dimanche midi)",
  },
  {
    category: "personnel",
    input: "Trouve une date pour l'anniversaire de Léa autour du 15 mai.",
    description: "Anniversaire Léa 15 mai",
    expectedOutcome: "Week-end avant/après le 15 mai",
  },
  {
    category: "personnel",
    input: "Repère un week-end où partir deux jours en juin.",
    description: "Week-end escapade juin",
    expectedOutcome: "Deux week-ends potentiels en juin",
  },
  {
    category: "personnel",
    input: "Planifie une séance photo familiale un dimanche matin avant fin décembre.",
    description: "Séance photo familiale",
    expectedOutcome: "Dimanches matin 9h-12h avant fin décembre",
  },
  {
    category: "personnel",
    input: "Cherche une soirée disponible entre amis pour un apéro d'ici trois semaines.",
    description: "Apéro entre amis",
    expectedOutcome: "Trois soirées semaine en 18h30-20h sous 21 jours",
  },
  {
    category: "personnel",
    input: "Programme un créneau dans dix jours pour un call visio avec les parents.",
    description: "Call visio parents",
    expectedOutcome: "Deux créneaux vers J+10 en soirée",
  },

  // Associatif / Scolaire
  {
    category: "associatif",
    input: "Cale la réunion parents-profs entre mardi et jeudi prochains.",
    description: "Réunion parents-profs",
    expectedOutcome: "Deux créneaux mardi/jeudi en soirée",
  },
  {
    category: "associatif",
    input: "Trouve un créneau de 30 minutes cette semaine pour le bureau de l'asso.",
    description: "Bureau associatif 30min",
    expectedOutcome: "Deux créneaux 30 min J+1 / J+2",
  },
  {
    category: "associatif",
    input: "Organise deux dates en soirée pour l'atelier bénévoles, semaine du 12.",
    description: "Atelier bénévoles semaine du 12",
    expectedOutcome: "Deux soirées cette semaine-là",
  },
  {
    category: "associatif",
    input: "Planifie une répétition chorale samedi matin ou dimanche après-midi.",
    description: "Répétition chorale week-end",
    expectedOutcome: "Samedi matin 10h-12h ou dimanche 15h-17h",
  },
  {
    category: "associatif",
    input: "Cherche une disponibilité mercredi ou vendredi pour l'aide aux devoirs.",
    description: "Aide devoirs mercredi/vendredi",
    expectedOutcome: "Deux créneaux sur ces jours",
  },
  {
    category: "associatif",
    input: "Prévois le comité de quartier dans quinze jours, plutôt en début de soirée.",
    description: "Comité de quartier J+15",
    expectedOutcome: "Créneaux 18h30-20h autour de J+15",
  },
  {
    category: "associatif",
    input: "Propose un créneau samedi 10h pour la réunion de préparation kermesse.",
    description: "Prépa kermesse samedi 10h",
    expectedOutcome: "Samedi 10h-11h + alternative proche",
  },
  {
    category: "associatif",
    input: "Planifie une réunion d'équipe éducative avant les vacances, matinée uniquement.",
    description: "Equipe éducative avant vacances",
    expectedOutcome: "Deux matinées 09h",
  },
  {
    category: "associatif",
    input: "Trouve-nous un créneau en visio après 18h pour le point trésorerie.",
    description: "Visio trésorerie",
    expectedOutcome: "Deux créneaux après 18h",
  },
  {
    category: "associatif",
    input: "Planifie la distribution de flyers sur un week-end fin avril.",
    description: "Distribution flyers fin avril",
    expectedOutcome: "Deux demi-journées week-end fin avril",
  },
];

const promptsByCategory = prompts.reduce<Record<string, PromptSpec[]>>((acc, prompt) => {
  if (!acc[prompt.category]) {
    acc[prompt.category] = [];
  }
  acc[prompt.category].push(prompt);
  return acc;
}, {});

const categoryFilter = process.env.GEMINI_CATEGORY?.toLowerCase().trim();
const promptFilter = process.env.GEMINI_PROMPT?.toLowerCase().trim();

describe("Gemini – prompts réalistes", () => {
  beforeAll(async () => {
    const module = await import("../lib/gemini");
    geminiService = module.GeminiService.getInstance();
  });

  Object.entries(promptsByCategory).forEach(([category, categoryPrompts]) => {
    if (categoryFilter && category.toLowerCase() !== categoryFilter) {
      return;
    }

    describe(`Catégorie ${category}`, () => {
      categoryPrompts.forEach((prompt) => {
        runGeminiPromptTest(geminiService, prompt, {
          category: categoryFilter,
          prompt: promptFilter,
        });
      });
    });
  });
});
