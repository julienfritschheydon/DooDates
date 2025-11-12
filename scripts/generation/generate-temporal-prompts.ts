import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PathLike } from "node:fs";

interface ScenarioContext {
  readonly id: string;
  readonly subject: string[];
  readonly participants: string[];
  readonly tone: ("formel" | "neutre" | "familier")[];
  readonly impliesProfessional: boolean;
}

interface TemporalIntent {
  readonly id: string;
  readonly description: string[];
  readonly temporalHints: string[];
  readonly recurrence: ("ponctuel" | "recurrent");
}

interface ConstraintTemplate {
  readonly id: string;
  readonly exclusions: string[];
  readonly durations: string[];
  readonly locations: string[];
  readonly extras: string[];
}

interface LinguisticTwist {
  readonly id: string;
  readonly prefaces: string[];
  readonly codas: string[];
  readonly implicitAssumptions: string[];
}

interface GenerationOptions {
  readonly count: number;
  readonly output: PathLike;
  readonly seed: string;
}

const DEFAULT_COUNT = 600;
const DEFAULT_OUTPUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../Docs/TESTS/datasets/temporal-prompts.txt",
);

const scenarioContexts: readonly ScenarioContext[] = [
  {
    id: "equipetravail",
    subject: [
      "réunion de synchronisation",
      "point hebdo",
      "atelier stratégique",
      "revue trimestrielle",
      "mise à jour projet",
    ],
    participants: [
      "pour l'équipe produit",
      "avec les chefs de projet",
      "pour notre task-force IA",
      "avec le comité de pilotage",
      "pour tout le staff technique",
    ],
    tone: ["formel", "neutre"],
    impliesProfessional: true,
  },
  {
    id: "comiteclient",
    subject: [
      "session de cadrage client",
      "revue de livrables",
      "démonstration de sprint",
      "comité de pilotage client",
      "atelier de co-conception",
    ],
    participants: [
      "avec l'équipe du client",
      "avec les interlocuteurs métiers",
      "avec la direction du client",
      "avec nos partenaires",
      "avec les sponsors",
    ],
    tone: ["formel"],
    impliesProfessional: true,
  },
  {
    id: "scolaire",
    subject: [
      "réunion parents-profs",
      "atelier périscolaire",
      "conseil de classe",
      "préparation de sortie scolaire",
      "répétition de spectacle",
    ],
    participants: [
      "avec les parents d'élèves",
      "pour les professeurs principaux",
      "avec l'association des parents",
      "pour l'équipe pédagogique",
      "avec les élèves volontaires",
    ],
    tone: ["neutre", "formel"],
      impliesProfessional: false,
  },
  {
    id: "association",
    subject: [
      "organisation de collecte",
      "atelier de sensibilisation",
      "réunion du bureau",
      "session de bénévolat",
      "préparation d'événement caritatif",
    ],
    participants: [
      "avec les bénévoles",
      "avec le bureau étendu",
      "pour le conseil d'administration",
      "avec les coordinateurs de terrain",
      "pour l'équipe communication",
    ],
    tone: ["neutre", "familier"],
    impliesProfessional: false,
  },
  {
    id: "loisirs",
    subject: [
      "sortie trail",
      "tournoi amical",
      "atelier créatif",
      "week-end plongée",
      "session de répétition musicale",
    ],
    participants: [
      "avec le groupe habituel",
      "pour notre club",
      "avec la bande",
      "pour l'équipe loisirs",
      "avec les nouveaux membres",
    ],
    tone: ["familier"],
    impliesProfessional: false,
  },
  {
    id: "urgence",
    subject: [
      "consultation médicale",
      "réunion de gestion de crise",
      "point exceptionnel",
      "intervention d'urgence",
      "coordination express",
    ],
    participants: [
      "avec le staff réduit",
      "avec ceux disponibles",
      "pour la cellule de crise",
      "avec les corps de métier essentiels",
      "pour les responsables d'astreinte",
    ],
    tone: ["formel", "neutre"],
    impliesProfessional: true,
  },
  {
    id: "international",
    subject: [
      "alignment call",
      "kick-off transatlantique",
      "réunion franco-allemande",
      "call Europe/Asie",
      "stand-up bilingue",
    ],
    participants: [
      "avec nos bureaux US",
      "avec l'équipe APAC",
      "pour les partenaires européens",
      "avec le board international",
      "avec le cluster EMEA",
    ],
    tone: ["formel"],
    impliesProfessional: true,
  },
];

const temporalIntents: readonly TemporalIntent[] = [
  {
    id: "semaine",
    description: [
      "calage la semaine prochaine",
      "mise en place sur la semaine du 18",
      "organisation entre lundi et jeudi prochains",
      "planification la semaine suivant les congés",
      "programmation dès la reprise",
    ],
    temporalHints: [
      "dans deux semaines",
      "sur la semaine 47",
      "la semaine qui ouvre novembre",
      "juste après le pont",
      "la semaine qui suit le salon",
    ],
    recurrence: "ponctuel",
  },
  {
    id: "jour",
    description: [
      "calage d'une plage un jour précis",
      "identification de créneaux sur un même jour",
      "réservation d'une demi-journée",
      "blocage d'une matinée",
      "sélection d'une fin de journée",
    ],
    temporalHints: [
      "le mardi ou le jeudi de la semaine après la prochaine",
      "un mercredi fin de matinée",
      "un vendredi avant midi",
      "un lundi juste après les vacances",
      "un jeudi soir vers 19h",
    ],
    recurrence: "ponctuel",
  },
  {
    id: "recurrent",
    description: [
      "mise en place d'une récurrence",
      "série de sessions régulières",
      "cycles hebdomadaires",
      "rendez-vous mensuels",
      "créneaux répétitifs",
    ],
    temporalHints: [
      "tous les mardis pairs",
      "un jeudi sur deux",
      "les premiers lundis du mois",
      "chaque fin de matinée du mercredi",
      "un samedi sur deux jusqu'à fin mai",
    ],
    recurrence: "recurrent",
  },
  {
    id: "weekend",
    description: [
      "organisation sur week-end",
      "planification sur un samedi ou dimanche",
      "coordination sur un pont",
      "événement sur deux jours consécutifs",
      "activités sur un week-end prolongé",
    ],
    temporalHints: [
      "week-end du 14",
      "un dimanche en fin de journée",
      "week-end prolongé autour du 8 mai",
      "pont de l'Ascension",
      "week-end avec nuit sur place",
    ],
    recurrence: "ponctuel",
  },
  {
    id: "periode",
    description: [
      "coordination sur une période spécifique",
      "mise en place pendant la tournée",
      "répartition pendant la période fiscale",
      "programmation pendant la fenêtre budgétaire",
      "alignement pendant le sprint de fin de trimestre",
    ],
    temporalHints: [
      "entre la mi-janvier et début février",
      "pendant les deux semaines post lancement",
      "durant la période de soldes",
      "d'ici la fin du trimestre",
      "pendant les nuits calmes",
    ],
    recurrence: "ponctuel",
  },
];

const constraintTemplates: readonly ConstraintTemplate[] = [
  {
    id: "dispo",
    exclusions: [
      "en évitant les mercredis après-midi",
      "sans le vendredi car off-site",
      "hors vacances scolaires zone B",
      "en excluant les jours fériés",
      "sans les lundis matin (réservés aux rituels)",
    ],
    durations: [
      "pour un créneau de 45 minutes",
      "avec une marge de 30 minutes pour l'installation",
      "sur un créneau d'1h30",
      "pour deux sessions successives de 50 minutes",
      "avec un brief de 20 minutes juste avant",
    ],
    locations: [
      "en visio préférentiellement",
      "dans la salle Horizon si disponible",
      "en hybride depuis Paris et Lyon",
      "sur site à Nantes",
      "dans nos bureaux de Montréal",
    ],
    extras: [
      "si possible avant 17h pour ceux qui récupèrent les enfants",
      "en laissant le lundi libre pour le reporting",
      "en tenant compte du fuseau -5h de Montréal",
      "avec option de doublon le matin ET le soir",
      "avec confirmation avant ce vendredi midi",
    ],
  },
  {
    id: "contraintesLegeres",
    exclusions: [
      "en évitant les midi",
      "sans le mardi (bloc réunions)",
      "en laissant respirer le jeudi",
      "sans la première semaine du mois",
      "hors jours de télétravail imposé",
    ],
    durations: [
      "pour 30 minutes maximum",
      "format court d'une heure",
      "format long de 2h",
      "prévoir 15 minutes de questions",
      "prévoir 3 créneaux de 20 minutes",
    ],
    locations: [
      "dans la salle Teams habituelle",
      "en présentiel à la cafétéria",
      "chez le client",
      "depuis Paris et remotely pour les autres",
      "en mode audio only",
    ],
    extras: [
      "si on peut éviter les fins de journées",
      "avec rappel automatique la veille",
      "avec replanification automatique si conflit",
      "avec un résumé à envoyer après",
      "en laissant la possibilité de répondre \"préférences\"",
    ],
  },
  {
    id: "fortes",
    exclusions: [
      "hors des heures d'astreinte",
      "sans chevaucher la permanence support",
      "sans lundi (rattrapage backlog)",
      "en excluant les soirs car couvre-feu local",
      "en évitant les jours de grève annonces",
    ],
    durations: [
      "prévoir 3h de suite",
      "format express de 25 minutes",
      "format double : 2x1h le même jour",
      "prévoir 4 sessions de 40 minutes",
      "prévoir un créneau tampon de 30 minutes",
    ],
    locations: [
      "réserver la war-room",
      "en salle de crise",
      "dans le hub digital",
      "en visio sécurisée",
      "dans la salle dédiée au support 24/7",
    ],
    extras: [
      "obligatoirement avant mercredi",
      "avec décision actée avant la fin de semaine",
      "en impliquant aussi le service juridique",
      "en doublant chaque créneau pour backup",
      "en tenant compte des astreintes de nuit",
    ],
  },
];

const linguisticTwists: readonly LinguisticTwist[] = [
  {
    id: "sousentendus",
    prefaces: [
      "Sans vouloir alourdir les agendas,",
      "Tu peux me proposer,",
      "À nous de nous organiser,",
      "On devrait peut-être prévoir,",
      "Est-ce qu'on peut caler,",
    ],
    codas: [
      "comme si on était déjà à la semaine d'après",
      "tout en laissant croire que c'est spontané",
      "en allant à l'essentiel",
      "sans réveiller la moitié du continent",
      "en restant réaliste niveau charge",
    ],
    implicitAssumptions: [
      "on sait que ce sera forcément en semaine",
      "tout le monde comprend que c'est pro",
      "ça reste une initiative interne",
      "c'est censé passer avant la date butoir",
      "ça doit paraître simple à répondre",
    ],
  },
  {
    id: "tonfamilier",
    prefaces: [
      "Dis,",
      "Par curiosité,",
      "Pour éviter de faire 15 mails,",
      "Histoire de s'y prendre correctement,",
      "Si on pouvait éviter le cafouillage,",
    ],
    codas: [
      "et qu'on ne se retrouve pas à improviser",
      "pour ne pas bloquer tout le monde",
      "sans que ça devienne un casse-tête",
      "histoire de faire pro",
      "que personne ne râle",
    ],
    implicitAssumptions: [
      "on garde le contexte habituel",
      "tout le monde sait que c'est la folie",
      "on sous-entend que c'est en visio",
      "on part sur la semaine et basta",
      "ça sent le truc à caler dans les heures creuses",
    ],
  },
  {
    id: "tonformel",
    prefaces: [
      "Pourriez-vous identifier",
      "Merci de proposer",
      "Serait-il possible d'organiser",
      "Afin d'anticiper cette échéance, merci de soumettre",
      "Je vous prie de me suggérer",
    ],
    codas: [
      "en tenant compte des contraintes habituelles",
      "pour garantir la disponibilité des décideurs",
      "afin de respecter notre jalon projet",
      "tout en restant compatible avec nos obligations contractuelles",
      "en gardant en tête notre fuseau horaire principal",
    ],
    implicitAssumptions: [
      "les créneaux doivent rester en semaine ouvrée",
      "les participants sont dispersés sur plusieurs sites",
      "la décision finale doit être actée sous 72h",
      "il faudra un compte rendu formel",
      "il reste peu de latitude côté agenda",
    ],
  },
];

const patternTemplates: readonly ((scenario: ScenarioContext, intent: TemporalIntent, constraint: ConstraintTemplate, twist: LinguisticTwist) => string)[] = [
  (scenario, intent, constraint, twist) =>
    `${pick(twist.prefaces)} ${pick(scenario.subject)} ${pick(scenario.participants)} ` +
    `${pick(intent.description)} ${pick(intent.temporalHints)} ${pick(constraint.exclusions)} ` +
    `${pick(constraint.durations)} ${pick(constraint.locations)} ${pick(constraint.extras)} ${pick(twist.codas)}`,
  (scenario, intent, constraint, twist) =>
    `${pick(twist.prefaces)} on doit ${intent.recurrence === "recurrent" ? "mettre en place" : "caler"} ` +
    `${pick(scenario.subject)} ${intent.recurrence === "recurrent" ? "en récurrence" : "en one-shot"} ` +
    `${pick(intent.temporalHints)}, ${pick(constraint.exclusions)}, ${pick(constraint.durations)}, ` +
    `${pick(constraint.locations)} ${pick(twist.codas)} (${pick(twist.implicitAssumptions)})`,
  (scenario, intent, constraint, twist) =>
    `${pick(twist.prefaces)} ${pick(scenario.subject)} ${pick(intent.description)} ` +
    `${pick(intent.temporalHints)}, ${pick(constraint.extras)}. ` +
    `${scenario.impliesProfessional ? "Sous-entendu : pro => jours ouvrés." : "Cadre souple."} ` +
    `${pick(constraint.durations)} ${pick(constraint.locations)} ${pick(twist.codas)}`,
  (scenario, intent, constraint, twist) =>
    `${pick(twist.prefaces)} faudrait qu'on ${intent.recurrence === "recurrent" ? "bloque" : "trouve"} ` +
    `${pick(scenario.subject)} ${pick(intent.description)} ${pick(intent.temporalHints)}, ` +
    `${pick(constraint.locations)} ${pick(constraint.extras)}, ${pick(constraint.durations)} ${pick(twist.codas)} ` +
    `(implicite : ${pick(twist.implicitAssumptions)})`,
  (scenario, intent, constraint, twist) =>
    `${pick(twist.prefaces)} merci de ${intent.recurrence === "recurrent" ? "planifier" : "identifier"} ` +
    `${pick(scenario.subject)} ${pick(scenario.participants)}, ${pick(intent.description)} ` +
    `${pick(intent.temporalHints)}, ${pick(constraint.exclusions)}, ${pick(constraint.extras)} ` +
    `${pick(constraint.durations)} ${pick(constraint.locations)} ${pick(twist.codas)}`,
];

function createPRNG(seed: string): () => number {
  let state = mulberry32Seed(seed);
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

function mulberry32Seed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function pick<T>(items: readonly T[], rand: () => number = Math.random): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty array");
  }
  const index = Math.floor(rand() * items.length);
  return items[index]!;
}

function normalizeForSet(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function generateSentences(options: GenerationOptions): string[] {
  const rand = createPRNG(options.seed);
  const rawSentences: string[] = [];
  const normalised = new Set<string>();

  const shuffledContexts = shuffleArray([...scenarioContexts], rand);
  const shuffledIntents = shuffleArray([...temporalIntents], rand);
  const shuffledConstraints = shuffleArray([...constraintTemplates], rand);
  const shuffledTwists = shuffleArray([...linguisticTwists], rand);

  for (const context of shuffledContexts) {
    for (const intent of shuffledIntents) {
      for (const constraint of shuffledConstraints) {
        for (const twist of shuffledTwists) {
          for (const pattern of patternTemplates) {
            const sentence = collapseWhitespace(pattern(context, intent, constraint, twist));
            const signature = normalizeForSet(sentence);
            if (!normalised.has(signature)) {
              normalised.add(signature);
              rawSentences.push(sentence);
            }
          }
        }
      }
    }
  }

  const shuffled = shuffleArray(rawSentences, rand);
  return shuffled.slice(0, options.count);
}

function collapseWhitespace(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s,/, ",")
    .replace(/\s\./g, ".")
    .replace(/\s\)/g, ")")
    .trim();
}

function shuffleArray<T>(array: T[], rand: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

function ensureDirectoryExists(targetPath: PathLike) {
  const directory = path.dirname(path.resolve(targetPath.toString()));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function writeOutputFile(options: GenerationOptions, sentences: string[]) {
  ensureDirectoryExists(options.output);
  const header = `# Dataset généré automatiquement le ${new Date().toISOString()}`;
  const content = [header, "# Usage : tests de compréhension temporelle", ""].concat(sentences).join("\n");
  fs.writeFileSync(options.output, content, { encoding: "utf-8" });
}

function parseArgs(argv: string[]): GenerationOptions {
  let count = DEFAULT_COUNT;
  let output = DEFAULT_OUTPUT;
  let seed = new Date().toISOString();

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg.startsWith("--count=")) {
      count = Math.max(1, Number.parseInt(arg.split("=", 2)[1] ?? "", 10));
    } else if (arg.startsWith("--out=")) {
      output = path.resolve(arg.split("=", 2)[1] ?? DEFAULT_OUTPUT);
    } else if (arg.startsWith("--seed=")) {
      seed = arg.split("=", 2)[1] ?? seed;
    }
  }

  return { count, output, seed };
}

function main() {
  const options = parseArgs(process.argv);
  const sentences = generateSentences(options);
  writeOutputFile(options, sentences);
  console.log(`✅ Généré ${sentences.length} phrases dans ${options.output}`);
}

try {
  main();
} catch (error) {
  console.error("❌ Erreur lors de la génération des prompts temporels", error);
  process.exitCode = 1;
}
