// Test simple de l'API Gemini - isolé de notre logique

const API_KEY = "AIzaSyAjguZF2MIjfseiOZohUtXK89S6_My6pvA";
const MODEL = "gemini-2.0-flash";

async function testGeminiAPI() {
  console.log("🔍 Test API Gemini isolé...");

  const prompt = `GÉNÈRE UN SONDAGE DE DATES UNIQUEMENT.

DEMANDE: "Crée un sondage pour un déjeuner d'équipe ce weekend"

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

    console.log("📊 Status:", response.status);
    console.log("📊 Response:", JSON.stringify(data, null, 2));

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const result = data.candidates[0].content.parts[0].text;
      console.log("🎯 Result brut:", result);

      // 🔧 NETTOYER les backticks comme dans notre code
      const cleanedResult = result.replace(/```json\n?|\n?```/g, "").trim();
      console.log("🧹 Result nettoyé:", cleanedResult);

      // Vérifier si c'est du JSON
      try {
        const parsed = JSON.parse(cleanedResult);
        console.log("✅ SUCCÈS - JSON valide:", parsed);
        console.log("📊 Dates:", parsed.dates);
        console.log("📊 TimeSlots:", parsed.timeSlots);
      } catch (e) {
        console.log("❌ ÉCHEC - Pas du JSON valide");
        console.log("🔍 Erreur parsing:", e.message);
      }
    }
  } catch (error) {
    console.error("🚨 Erreur:", error);
  }
}

testGeminiAPI();
