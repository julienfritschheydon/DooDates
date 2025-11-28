/**
 * Tests pour évaluer la valeur des règles hints
 * Compare les réponses Gemini avec et sans hints
 */

const MODEL = "gemini-2.0-flash";
const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";

async function testGeminiWithPrompt(prompt) {
  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  const data = await response.json();

  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    const result = data.candidates[0].content.parts[0].text;
    return result.replace(/```json\n?|\n?```/g, "").trim();
  }

  return null;
}

// 🔧 PROMPT DE BASE (sans hints)
function buildBasicPrompt(userInput) {
  const today = new Date().toISOString().split("T")[0];

  return `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif
- DATE OBLIGATOIRE : Uniquement les dates FUTURES (après ${today})

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

ATTENTION: AUJOURD'HUI EST LE ${today} - GÉNÉRER UNIQUEMENT DES DATES FUTURES !

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;
}

// 🔧 PROMPT AVEC HINTS COMPLETS
function buildPromptWithHints(userInput, hints) {
  const today = new Date().toISOString().split("T")[0];

  return `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

${hints}

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif
- DATE OBLIGATOIRE : Uniquement les dates FUTURES (après ${today})

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

ATTENTION: AUJOURD'HUI EST LE ${today} - GÉNÉRER UNIQUEMENT DES DATES FUTURES !

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;
}

// 📊 Tests des différents cas
const testCases = [
  {
    name: "Cas 1: Weekend simple",
    input: "déjeuner d'équipe ce weekend",
    hints: `
⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - PÉRIODE DÉTECTÉE ⚠️⚠️⚠️

Type: unknown
Expression temporelle: "for 1 d"

RÈGLE ABSOLUE - PÉRIODE:
- Proposer 3-5 dates INDIVIDUELLES parmi la liste ci-dessous
- Répartir uniformément sur la période
- CONTEXTE REPAS + PÉRIODE : Générer 1 créneau UNIQUE par date (ex: 12h30-13h30 pour déjeuner)

Dates autorisées:
  - 2025-11-29
  - 2025-11-30`,
  },
  {
    name: "Cas 2: Jours multiples",
    input: "réunion samedi ou dimanche",
    hints: `
⚠️⚠️⚠️ PLUSIEURS JOURS DE LA SEMAINE DÉTECTÉS ⚠️⚠️⚠️

Le prompt mentionne "samedi ET dimanche" → L'utilisateur veut des options pour CHAQUE jour mentionné !

RÈGLE ABSOLUE - PLUSIEURS JOURS:
→ OBLIGATOIRE : Générer EXACTEMENT 2 DATES (une pour chaque jour mentionné)
→ OBLIGATOIRE : Chaque date doit correspondre au bon jour de la semaine

Dates autorisées (OBLIGATOIRE de générer TOUTES ces dates):
  - 2025-11-29 (samedi)
  - 2025-11-30 (dimanche)`,
  },
  {
    name: "Cas 3: Jour spécifique",
    input: "rendez-vous lundi prochain",
    hints: `
⚠️⚠️⚠️ JOUR DE LA SEMAINE DÉTECTÉ ⚠️⚠️⚠️
Le prompt mentionne "lundi" → Générer UNIQUEMENT le lundi correspondant (1 date uniquement)

RÈGLE ABSOLUE - DATE SPÉCIFIQUE:
- Proposer CETTE DATE UNIQUEMENT (2025-12-01)
- Ajouter MAXIMUM 1-2 alternatives très proches (±1 jour) SEULEMENT si vraiment nécessaire

Dates autorisées (pour alternatives seulement si vraiment nécessaire ET pas repas):
  - 2025-12-01`,
  },
  {
    name: "Cas 4: Mois explicite",
    input: "activité en décembre",
    hints: `
⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - MOIS EXPLICITE DÉTECTÉ ⚠️⚠️⚠️

Mois: décembre

Dates autorisées (filtrer pour ne garder que les dates en décembre):
  - 2025-12-05
  - 2025-12-12
  - 2025-12-19

⚠️ CRITIQUE : Ne proposer QUE des dates en décembre !`,
  },
];

// 🧪 Fonction de test
async function runTest(testCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`📝 Input: "${testCase.input}"`);

  // Test sans hints
  console.log(`\n❌ SANS HINTS:`);
  const basicPrompt = buildBasicPrompt(testCase.input);
  const basicResult = await testGeminiWithPrompt(basicPrompt);

  if (basicResult) {
    try {
      const parsed = JSON.parse(basicResult);
      console.log(`✅ JSON valide`);
      console.log(`📊 Dates: ${parsed.dates?.join(", ")}`);
      console.log(`📊 TimeSlots: ${parsed.timeSlots?.length} créneaux`);
      console.log(`📊 Titre: "${parsed.title}"`);
    } catch (e) {
      console.log(`❌ JSON invalide: ${e.message}`);
      console.log(`🔍 Réponse brute: ${basicResult.substring(0, 200)}...`);
    }
  } else {
    console.log(`❌ Pas de réponse`);
  }

  // Test avec hints
  console.log(`\n✅ AVEC HINTS:`);
  const hintsPrompt = buildPromptWithHints(testCase.input, testCase.hints);
  const hintsResult = await testGeminiWithPrompt(hintsPrompt);

  if (hintsResult) {
    try {
      const parsed = JSON.parse(hintsResult);
      console.log(`✅ JSON valide`);
      console.log(`📊 Dates: ${parsed.dates?.join(", ")}`);
      console.log(`📊 TimeSlots: ${parsed.timeSlots?.length} créneaux`);
      console.log(`📊 Titre: "${parsed.title}"`);
    } catch (e) {
      console.log(`❌ JSON invalide: ${e.message}`);
      console.log(`🔍 Réponse brute: ${hintsResult.substring(0, 200)}...`);
    }
  } else {
    console.log(`❌ Pas de réponse`);
  }

  // Analyse comparative
  console.log(`\n📈 ANALYSE COMPARATIVE:`);
  if (basicResult && hintsResult) {
    try {
      const basicParsed = JSON.parse(basicResult);
      const hintsParsed = JSON.parse(hintsResult);

      console.log(`📊 Dates sans hints: ${basicParsed.dates?.length || 0}`);
      console.log(`📊 Dates avec hints: ${hintsParsed.dates?.length || 0}`);
      console.log(`📊 TimeSlots sans hints: ${basicParsed.timeSlots?.length || 0}`);
      console.log(`📊 TimeSlots avec hints: ${hintsParsed.timeSlots?.length || 0}`);

      // Vérifier si les hints ont amélioré la précision
      const expectedDates = testCase.hints.match(/(\d{4}-\d{2}-\d{2})/g) || [];
      if (expectedDates.length > 0) {
        const hintsMatches = expectedDates.filter((date) =>
          hintsParsed.dates?.includes(date),
        ).length;
        const basicMatches = expectedDates.filter((date) =>
          basicParsed.dates?.includes(date),
        ).length;

        console.log(`🎯 Précision dates attendues:`);
        console.log(
          `   Sans hints: ${basicMatches}/${expectedDates.length} (${Math.round((basicMatches / expectedDates.length) * 100)}%)`,
        );
        console.log(
          `   Avec hints: ${hintsMatches}/${expectedDates.length} (${Math.round((hintsMatches / expectedDates.length) * 100)}%)`,
        );
      }
    } catch (e) {
      console.log(`❌ Erreur analyse: ${e.message}`);
    }
  }
}

// 🚀 Lancer tous les tests
async function runAllTests() {
  console.log(`🚀 Lancement des tests de valeur des hints...\n`);

  for (const testCase of testCases) {
    await runTest(testCase);
    console.log(`\n${"=".repeat(80)}`);
  }

  console.log(`\n✅ Tests terminés !`);
}

runAllTests().catch(console.error);
