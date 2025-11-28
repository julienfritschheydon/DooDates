// Test simple de l'API Gemini - sans backticks

const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";
const MODEL = "gemini-2.0-flash";

async function testGeminiAPI() {
  console.log("🔍 Test API Gemini sans backticks...");

  const prompt = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "Crée un sondage pour un déjeuner d'équipe ce weekend"

RÈGLES CRITIQUES:
- UNiquement JSON avec "dates" et "timeSlots"
- JAMAIS de questions sur lieu, budget, préférences
- JAMAIS de texte explicatif
- JAMAIS de blocs de code avec backticks

FORMAT OBLIGATOIRE:
{
  "title": "Titre",
  "description": "Description",
  "dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "timeSlots": [
    {"start": "HH:MM", "end": "HH:MM", "dates": ["YYYY-MM-DD"]}
  ]
}

GÉNÈRE LE JSON BRUT - PAS DE BACKTICKS !`;

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
      console.log("🎯 Result brut:", result);

      // Nettoyer les backticks si présents
      const cleanResult = result.replace(/```json\n?|\n?```/g, "").trim();
      console.log("🧹 Result nettoyé:", cleanResult);

      // Vérifier si c'est du JSON
      try {
        const parsed = JSON.parse(cleanResult);
        console.log("✅ SUCCÈS - JSON valide:", parsed);
      } catch (e) {
        console.log("❌ ÉCHEC - Pas du JSON valide");
      }
    }
  } catch (error) {
    console.error("🚨 Erreur:", error);
  }
}

testGeminiAPI();
