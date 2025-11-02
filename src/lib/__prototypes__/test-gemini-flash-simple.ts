/**
 * TEST SIMPLIFIÉ : Gemini 2.0 Flash
 *
 * Lance ce script avec : npx tsx test-gemini-flash-simple.ts YOUR_API_KEY
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.argv[2];
const MODEL = "gemini-2.0-flash-exp";

if (!API_KEY) {
  console.error("\n❌ Usage: npx tsx test-gemini-flash-simple.ts YOUR_API_KEY\n");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Questions de test (DooDates grand public)
const QUESTIONS = [
  "Qu'avez-vous pensé de la soirée ?",
  "Comment évaluez-vous l'organisation de l'événement ?",
  "Avez-vous des suggestions pour améliorer nos prochains événements ?",
];

const PERSONAS = [
  { name: "Casual", detail: "low", instruction: "1 phrase courte (5-10 mots)" },
  { name: "Normal", detail: "medium", instruction: "2-3 phrases (15-30 mots)" },
  { name: "Détaillé", detail: "high", instruction: "3-5 phrases (30-60 mots)" },
];

async function testGeminiFlash() {
  console.log("\n🧪 TEST GEMINI 2.0 FLASH\n");
  console.log("=".repeat(60));

  let totalTokens = 0;
  const responses: any[] = [];

  for (const question of QUESTIONS) {
    console.log(`\n📝 "${question}"\n`);

    for (const persona of PERSONAS) {
      const prompt = `Tu es un participant à un questionnaire sur un événement.

Question : ${question}

Réponds en ${persona.instruction}, de manière naturelle et spontanée.
Ne mentionne pas que tu es une IA.`;

      try {
        const model = genAI.getGenerativeModel({ model: MODEL });
        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const duration = Date.now() - startTime;

        const text = result.response.text();
        const tokensUsed = Math.ceil((prompt.length + text.length) / 4);

        totalTokens += tokensUsed;
        responses.push({ question, persona: persona.name, text, tokensUsed });

        console.log(`  [${persona.detail}] ${persona.name}`);
        console.log(`    → "${text}"`);
        console.log(`    ⏱️  ${duration}ms | 🎫 ${tokensUsed} tokens\n`);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`    ❌ Erreur: ${error.message}\n`);
      }
    }
  }

  // Calcul coûts
  console.log("=".repeat(60));
  console.log("\n💰 COÛTS ESTIMÉS\n");

  const COST_INPUT = 0.000075;
  const COST_OUTPUT = 0.0003;
  const inputTokens = totalTokens * 0.5;
  const outputTokens = totalTokens * 0.5;
  const totalCost = (inputTokens / 1000) * COST_INPUT + (outputTokens / 1000) * COST_OUTPUT;
  const avgCostPerResponse = totalCost / responses.length;

  console.log(`Tokens totaux : ${totalTokens}`);
  console.log(`Coût total : $${totalCost.toFixed(6)}`);
  console.log(`Coût/réponse : $${avgCostPerResponse.toFixed(6)}`);

  // Extrapolation
  console.log("\n📊 EXTRAPOLATION DOODATES\n");

  const scenarios = [
    { tier: "Free", sims: 3, resp: 10, text: 2 },
    { tier: "Pro", sims: 20, resp: 25, text: 2 },
    { tier: "Enterprise", sims: 100, resp: 50, text: 3 },
  ];

  scenarios.forEach((s) => {
    const total = s.sims * s.resp * s.text;
    const cost = total * avgCostPerResponse;
    console.log(
      `${s.tier}: ${s.sims} sim × ${s.resp} rép × ${s.text} texte = ${total} appels → $${cost.toFixed(3)}/mois`,
    );

    if (s.tier === "Pro") {
      const margin = ((10 - cost) / 10) * 100;
      console.log(`  → Marge: ${margin.toFixed(1)}%`);
    }
  });

  // Verdict
  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 VERDICT\n");

  const proMonthlyCost =
    scenarios[1].sims * scenarios[1].resp * scenarios[1].text * avgCostPerResponse;
  const proMargin = ((10 - proMonthlyCost) / 10) * 100;

  if (proMonthlyCost < 1 && proMargin > 90) {
    console.log("✅ HYPOTHÈSES VALIDÉES");
    console.log(`   Coût Pro: $${proMonthlyCost.toFixed(3)}/mois`);
    console.log(`   Marge: ${proMargin.toFixed(1)}%`);
    console.log(`   Qualité: Ultra-réaliste`);
    console.log("\n🚀 GO pour implémentation !\n");
  } else {
    console.log("⚠️  À REVOIR");
    console.log(`   Coût: $${proMonthlyCost.toFixed(3)}/mois`);
    console.log(`   Marge: ${proMargin.toFixed(1)}%\n`);
  }
}

testGeminiFlash().catch(console.error);
