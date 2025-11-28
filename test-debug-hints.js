// Test pour voir EXACTEMENT ce que notre app envoie

const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";
const MODEL = "gemini-2.0-flash";

// Importer les vraies fonctions (simulées)
function buildDateHintsFromParsed(parsed, userInput) {
  // Simuler exactement ce que notre code fait
  return `\n\n⚠️⚠️⚠️ INSTRUCTION PRIORITAIRE - PÉRIODE DÉTECTÉE ⚠️⚠️⚠️

Type: unknown
Expression temporelle: "for 1 d"
Contexte professionnel détecté → Week-ends exclus (lundi-vendredi uniquement)

RÈGLE ABSOLUE : Générer UNIQUEMENT des dates en semaine (lundi-vendredi)
PAS de week-ends (samedi, dimanche)
PAS de jours fériés
PAS de dates passées

DATES AUTORISÉES: ${parsed.allowedDates?.join(", ") || "Aucune"}

CONTEXTE: ${userInput}`;
}

function buildContextualHints(userInput) {
  return `

CONTEXTE UTILISATEUR:
- Demande: "${userInput}"
- Type: sondage de dates
- Objectif: trouver des créneaux disponibles

INSTRUCTIONS SPÉCIFIQUES:
- Utiliser les dates ci-dessus
- Proposer des créneaux standards (12:00-14:00)
- Adapter les timeSlots selon les dates`;
}

async function testDebugHints() {
  console.log("🔍 Test DEBUG - Comparaison avec notre app...");

  const userInput = "Crée un sondage pour un déjeuner d'équipe ce weekend";

  // CAS 1: SANS hints (comme notre test simple qui fonctionne)
  console.log("\n=== TEST 1: SANS hints ===");
  const prompt1 = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;

  await testPrompt(prompt1, "SANS hints");

  // CAS 2: AVEC hints (comme notre app)
  console.log("\n=== TEST 2: AVEC hints ===");
  const mockParsed = {
    type: "datetime",
    allowedDates: ["2025-11-29", "2025-11-30"],
    detectedKeywords: ["weekend"],
  };

  const dateHints = buildDateHintsFromParsed(mockParsed, userInput);
  const contextualHints = buildContextualHints(userInput);

  const prompt2 = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "${userInput}"

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

${dateHints}
${contextualHints}

GÉNÈRE LE JSON MAINTENANT - PAS DE TEXTE !`;

  await testPrompt(prompt2, "AVEC hints");
}

async function testPrompt(prompt, label) {
  console.log(`\n📊 ${label} - Prompt longueur:`, prompt.length);
  console.log(`📊 ${label} - Aperçu:`, prompt.substring(0, 200) + "...");

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  try {
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
      const cleanedResult = result.replace(/```json\n?|\n?```/g, "").trim();

      try {
        const parsed = JSON.parse(cleanedResult);
        console.log(`✅ ${label} - SUCCÈS JSON valide`);
      } catch (e) {
        console.log(`❌ ${label} - ÉCHEC: Formulaire généré`);
        console.log(`🔍 ${label} - Erreur:`, e.message);
      }
    }
  } catch (error) {
    console.error(`🚨 ${label} - Erreur API:`, error);
  }
}

testDebugHints();
