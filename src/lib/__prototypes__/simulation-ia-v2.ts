/**
 * PROTOTYPE V2 : Simulation IA avec Compromise.js
 *
 * Amélioration : Extraction mots-clés avec NLP
 * Date : 02/11/2025
 */

import nlp from "compromise";

// ============================================================================
// TYPES (réutilisés de v1)
// ============================================================================

interface Persona {
  id: string;
  name: string;
  context: "b2b" | "b2c" | "event" | "feedback" | "research";
  traits: {
    responseRate: number;
    attentionSpan: number;
    detailLevel: "low" | "medium" | "high";
    biasTowardPositive: number;
    skipProbability: number;
  };
}

interface Question {
  id: string;
  title: string;
  type: "single" | "multiple" | "text";
  options?: { id: string; label: string }[];
}

// ============================================================================
// PERSONAS (réutilisés de v1)
// ============================================================================

const PERSONAS: Persona[] = [
  {
    id: "b2b-decision-maker",
    name: "Décideur B2B",
    context: "b2b",
    traits: {
      responseRate: 0.85,
      attentionSpan: 15,
      detailLevel: "high",
      biasTowardPositive: 0.1,
      skipProbability: 0.05,
    },
  },
  {
    id: "b2c-casual",
    name: "Consommateur Occasionnel",
    context: "b2c",
    traits: {
      responseRate: 0.7,
      attentionSpan: 8,
      detailLevel: "low",
      biasTowardPositive: 0.2,
      skipProbability: 0.15,
    },
  },
];

// ============================================================================
// EXTRACTION MOTS-CLÉS AVEC COMPROMISE.JS
// ============================================================================

function extractKeywordsNLP(text: string): string[] {
  const doc = nlp(text);

  // Extraire nouns (noms)
  const nouns = doc.nouns().out("array");

  // Extraire adjectives (adjectifs)
  const adjectives = doc.adjectives().out("array");

  // Extraire verbs (verbes) si pas de nouns
  const verbs = nouns.length === 0 ? doc.verbs().out("array") : [];

  // Combiner et prioriser
  const keywords = [...nouns, ...adjectives, ...verbs]
    .filter((word) => word.length > 3)
    .slice(0, 3);

  return keywords.length > 0 ? keywords : ["cela"];
}

// ============================================================================
// DÉTECTION CONTEXTE AVEC COMPROMISE.JS
// ============================================================================

function detectContextNLP(title: string, description?: string): string {
  const text = `${title} ${description || ""}`;
  const doc = nlp(text);

  // Extraction entités
  const organizations = doc.organizations().out("array");
  const topics = doc.topics().out("array");

  const scores = {
    b2b: 0,
    b2c: 0,
    event: 0,
    feedback: 0,
    research: 0,
  };

  // B2B indicators
  if (organizations.length > 0) scores.b2b += 2;
  if (text.toLowerCase().match(/entreprise|professionnel|décideur/)) scores.b2b += 2;

  // B2C indicators
  if (text.toLowerCase().match(/consommateur|achat|produit/)) scores.b2c += 2;

  // Event indicators
  if (text.toLowerCase().match(/événement|soirée|réunion/)) scores.event += 3;

  // Feedback indicators
  if (text.toLowerCase().match(/feedback|avis|retour/)) scores.feedback += 2;

  // Research indicators
  if (text.toLowerCase().match(/recherche|étude|académique/)) scores.research += 3;

  const maxScore = Math.max(...Object.values(scores));
  const detectedContext = Object.keys(scores).find(
    (k) => scores[k as keyof typeof scores] === maxScore,
  );

  return detectedContext || "b2c";
}

// ============================================================================
// GÉNÉRATION RÉPONSES TEXTE AVEC MOTS-CLÉS NLP
// ============================================================================

function generateTextResponseNLP(question: Question, persona: Persona): string {
  // Extraire mots-clés avec Compromise.js
  const keywords = extractKeywordsNLP(question.title);
  const keyword = keywords[0] || "cela";

  // Templates contextuels
  const templates = {
    low: [
      `Le ${keyword} est correct`,
      `Pas mal pour le ${keyword}`,
      `${keyword} OK`,
      `Bien pour le ${keyword}`,
      `Le ${keyword} est acceptable`,
    ],
    medium: [
      `Je trouve le ${keyword} plutôt bien dans l'ensemble`,
      `Le ${keyword} répond à mes attentes`,
      `Quelques points à améliorer sur le ${keyword}`,
      `Le ${keyword} est satisfaisant mais pourrait être mieux`,
      `Globalement le ${keyword} est bien conçu`,
    ],
    high: [
      `Mon avis sur le ${keyword} : c'est très intéressant et bien pensé`,
      `Concernant le ${keyword}, je pense que les points forts sont nombreux`,
      `Le ${keyword} est excellent, notamment pour son innovation`,
      `Je suis impressionné par le ${keyword}, particulièrement par la qualité`,
      `Le ${keyword} dépasse mes attentes sur plusieurs aspects`,
    ],
  };

  const templateList = templates[persona.traits.detailLevel];
  const randomIndex = Math.floor(Math.random() * templateList.length);

  return templateList[randomIndex];
}

// ============================================================================
// TESTS DE VALIDATION V2
// ============================================================================

console.log("\n=== PROTOTYPE V2 : Avec Compromise.js ===\n");

// Test 1 : Extraction mots-clés
console.log("=== TEST 1 : Extraction Mots-Clés (NLP) ===\n");

const testQuestions = [
  "Qu'avez-vous pensé de notre nouveau produit ?",
  "Comment évaluez-vous notre service client ?",
  "Votre avis sur la qualité de l'événement ?",
  "Êtes-vous satisfait de notre application mobile ?",
  "Que pensez-vous de la formation proposée ?",
];

testQuestions.forEach((question) => {
  const keywords = extractKeywordsNLP(question);
  console.log(`"${question}"`);
  console.log(`  Mots-clés: [${keywords.join(", ")}]\n`);
});

// Test 2 : Génération réponses avec NLP
console.log("=== TEST 2 : Génération Réponses (NLP) ===\n");

const testQuestionsObj: Question[] = [
  { id: "q1", title: "Qu'avez-vous pensé de notre nouveau produit ?", type: "text" },
  { id: "q2", title: "Comment évaluez-vous notre service client ?", type: "text" },
  { id: "q3", title: "Votre avis sur la qualité de l'événement ?", type: "text" },
];

const testPersonas = [
  PERSONAS.find((p) => p.traits.detailLevel === "low")!,
  { ...PERSONAS[0], traits: { ...PERSONAS[0].traits, detailLevel: "medium" as const } },
  { ...PERSONAS[0], traits: { ...PERSONAS[0].traits, detailLevel: "high" as const } },
];

testQuestionsObj.forEach((question) => {
  console.log(`Question: "${question.title}"`);
  testPersonas.forEach((persona) => {
    const response = generateTextResponseNLP(question, persona);
    console.log(`  [${persona.traits.detailLevel}] ${response}`);
  });
  console.log("");
});

// Test 3 : Détection contexte avec NLP
console.log("=== TEST 3 : Détection Contexte (NLP) ===\n");

const contextTests = [
  { title: "Satisfaction client e-commerce", expected: "b2c" },
  { title: "Feedback entreprise B2B", expected: "b2b" },
  { title: "Sondage événement soirée", expected: "event" },
  { title: "Avis sur notre produit", expected: "feedback" },
  { title: "Étude académique recherche", expected: "research" },
];

let correct = 0;
contextTests.forEach((test) => {
  const detected = detectContextNLP(test.title);
  const isCorrect = detected === test.expected;
  correct += isCorrect ? 1 : 0;

  console.log(`"${test.title}"`);
  console.log(`  Attendu: ${test.expected}, Détecté: ${detected} ${isCorrect ? "✅" : "❌"}`);
});

const precision = (correct / contextTests.length) * 100;
console.log(`\nPrécision: ${precision.toFixed(1)}% (${correct}/${contextTests.length})`);
console.log(`Critère: > 80% ${precision > 80 ? "✅" : "❌"}`);

// Test 4 : Performance
console.log("\n=== TEST 4 : Performance (NLP) ===\n");

console.time("Génération 50 réponses");
for (let i = 0; i < 50; i++) {
  testQuestionsObj.forEach((q) => {
    generateTextResponseNLP(q, PERSONAS[0]);
  });
}
console.timeEnd("Génération 50 réponses");

console.log("\n✅ Prototype V2 terminé !");
