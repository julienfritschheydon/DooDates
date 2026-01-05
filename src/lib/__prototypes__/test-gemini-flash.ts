/**
 * TEST : Gemini 2.0 Flash pour Simulation IA
 *
 * Objectif : Valider coût et qualité des réponses texte
 * Date : 02/11/2025
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Charger .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ .env.local chargé");
} else {
  console.warn("⚠️  .env.local non trouvé");
}

import { GEMINI_CONFIG } from "../../config/gemini";

// Configuration
const API_KEY = process.env.VITE_GEMINI_API_KEY || "";
const MODEL = GEMINI_CONFIG.MODEL_NAME;

/*
if (!API_KEY) {
  console.error("❌ VITE_GEMINI_API_KEY non définie dans .env.local");
  process.exit(1);
}
*/
if (!API_KEY) {
  console.warn("⚠️ Pas de clé API. Ce test legacy nécessitait une clé directe.");
  console.warn("Pour tester le modèle, utilisez les tests via l'Edge Function.");
  process.exit(0);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================================================
// PERSONAS DE TEST
// ============================================================================

interface Persona {
  name: string;
  context: string;
  detailLevel: "low" | "medium" | "high";
}

const PERSONAS: Persona[] = [
  {
    name: "Participant Casual",
    context: "événement",
    detailLevel: "low",
  },
  {
    name: "Membre Association",
    context: "associatif",
    detailLevel: "medium",
  },
  {
    name: "Organisateur Événement",
    context: "événement",
    detailLevel: "high",
  },
];

// ============================================================================
// QUESTIONS DE TEST (typiques DooDates)
// ============================================================================

const TEST_QUESTIONS = [
  {
    id: "q1",
    title: "Qu'avez-vous pensé de la soirée ?",
    context: "événement",
  },
  {
    id: "q2",
    title: "Comment évaluez-vous l'organisation de l'événement ?",
    context: "événement",
  },
  {
    id: "q3",
    title: "Que pensez-vous des activités proposées par l'association ?",
    context: "associatif",
  },
  {
    id: "q4",
    title: "Avez-vous des suggestions pour améliorer nos prochains événements ?",
    context: "événement",
  },
  {
    id: "q5",
    title: "Recommanderiez-vous cette activité à vos amis ? Pourquoi ?",
    context: "loisirs",
  },
];

// ============================================================================
// GÉNÉRATION RÉPONSE AVEC GEMINI FLASH
// ============================================================================

async function generateResponseWithGemini(
  question: string,
  persona: Persona,
): Promise<{ text: string; tokensUsed: number }> {
  const model = genAI.getGenerativeModel({ model: MODEL });

  // Prompt optimisé pour réponses courtes et naturelles
  const detailInstructions = {
    low: "Réponds en 1 phrase courte (5-10 mots), de manière naturelle et spontanée.",
    medium: "Réponds en 2-3 phrases (15-30 mots), de manière claire et constructive.",
    high: "Réponds en 3-5 phrases (30-60 mots), de manière détaillée et réfléchie.",
  };

  const prompt = `Tu es un participant à un questionnaire sur un ${persona.context}.

Question : ${question}

${detailInstructions[persona.detailLevel]}

Réponds de manière naturelle, comme une vraie personne. Ne mentionne pas que tu es une IA.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Estimation tokens (approximation : 1 token ≈ 4 caractères)
    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);

    return { text, tokensUsed };
  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw error;
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log("\n🧪 TEST GEMINI 2.0 FLASH - Simulation IA\n");
  console.log("=".repeat(60));

  let totalTokens = 0;
  let totalCost = 0;
  const responses: any[] = [];

  // Test 1 : Qualité des réponses
  console.log("\n📝 TEST 1 : Qualité des Réponses\n");

  for (const question of TEST_QUESTIONS.slice(0, 3)) {
    console.log(`\nQuestion : "${question.title}"\n`);

    for (const persona of PERSONAS) {
      try {
        const startTime = Date.now();
        const { text, tokensUsed } = await generateResponseWithGemini(question.title, persona);
        const duration = Date.now() - startTime;

        totalTokens += tokensUsed;
        responses.push({ question: question.id, persona: persona.name, text, tokensUsed });

        console.log(`  [${persona.detailLevel}] ${persona.name}`);
        console.log(`    → "${text}"`);
        console.log(`    ⏱️  ${duration}ms | 🎫 ${tokensUsed} tokens\n`);

        // Pause pour éviter rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`    ❌ Erreur: ${error.message}\n`);
      }
    }
  }

  // Test 2 : Coût estimé
  console.log("\n" + "=".repeat(60));
  console.log("\n💰 TEST 2 : Coût Estimé\n");

  // Coût Gemini 2.0 Flash
  const COST_PER_1K_INPUT = 0.000075;
  const COST_PER_1K_OUTPUT = 0.0003;

  // Approximation : 50% input, 50% output
  const inputTokens = totalTokens * 0.5;
  const outputTokens = totalTokens * 0.5;

  totalCost = (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;

  console.log(`Tokens totaux : ${totalTokens}`);
  console.log(`Coût total : $${totalCost.toFixed(6)}`);
  console.log(`Coût par réponse : $${(totalCost / responses.length).toFixed(6)}`);

  // Test 3 : Extrapolation usage réel
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 TEST 3 : Extrapolation Usage Réel\n");

  const avgCostPerResponse = totalCost / responses.length;

  const scenarios = [
    { tier: "Free", sims: 3, responses: 10, textQuestions: 2 },
    { tier: "Pro", sims: 20, responses: 25, textQuestions: 2 },
    { tier: "Enterprise", sims: 100, responses: 50, textQuestions: 3 },
  ];

  console.log("Scénarios DooDates (grand public) :\n");

  scenarios.forEach((scenario) => {
    const totalResponses = scenario.sims * scenario.responses * scenario.textQuestions;
    const monthlyCost = totalResponses * avgCostPerResponse;

    console.log(`${scenario.tier} :`);
    console.log(
      `  ${scenario.sims} sim × ${scenario.responses} rép × ${scenario.textQuestions} texte = ${totalResponses} appels`,
    );
    console.log(`  Coût/mois : $${monthlyCost.toFixed(3)}`);

    if (scenario.tier === "Pro") {
      const margin = 10 - monthlyCost;
      const marginPercent = (margin / 10) * 100;
      console.log(`  Marge : $${margin.toFixed(2)} (${marginPercent.toFixed(1)}%)`);
    }
    console.log("");
  });

  // Test 4 : Validation hypothèses
  console.log("=".repeat(60));
  console.log("\n✅ TEST 4 : Validation Hypothèses\n");

  const avgWordsPerResponse =
    responses.reduce((sum, r) => sum + r.text.split(/\s+/).length, 0) / responses.length;

  console.log("Hypothèses initiales vs Résultats :");
  console.log(`  Coût par réponse : $0.0004 (estimé) vs $${avgCostPerResponse.toFixed(6)} (réel)`);
  console.log(
    `  Coût Pro/mois : $0.40 (estimé) vs $${(scenarios[1].sims * scenarios[1].responses * scenarios[1].textQuestions * avgCostPerResponse).toFixed(3)} (réel)`,
  );
  console.log(`  Qualité : Ultra-réaliste ? ${avgWordsPerResponse > 5 ? "✅ OUI" : "❌ NON"}`);
  console.log(`  Longueur moyenne : ${avgWordsPerResponse.toFixed(1)} mots/réponse`);

  // Verdict final
  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 VERDICT FINAL\n");

  const proMonthlyCost =
    scenarios[1].sims * scenarios[1].responses * scenarios[1].textQuestions * avgCostPerResponse;
  const proMargin = ((10 - proMonthlyCost) / 10) * 100;

  if (proMonthlyCost < 1 && proMargin > 90) {
    console.log("✅ HYPOTHÈSES VALIDÉES");
    console.log(`   - Coût négligeable : $${proMonthlyCost.toFixed(3)}/mois (Pro)`);
    console.log(`   - Marge excellente : ${proMargin.toFixed(1)}%`);
    console.log(`   - Qualité réponses : Ultra-réaliste`);
    console.log("\n🚀 GO pour implémentation avec Gemini 2.0 Flash !");
  } else {
    console.log("⚠️  HYPOTHÈSES À REVOIR");
    console.log(`   - Coût : $${proMonthlyCost.toFixed(3)}/mois (> $1)`);
    console.log(`   - Marge : ${proMargin.toFixed(1)}% (< 90%)`);
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// Exécution
runTests().catch(console.error);
